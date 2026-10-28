import os
import re
import sqlite3
from typing import Annotated, List, TypedDict, Optional, Literal

from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(dotenv_path=os.path.join(BASE_DIR, ".env"))

if os.getenv("LANGCHAIN_API_KEY"):
    os.environ["LANGCHAIN_TRACING_V2"] = os.getenv("LANGCHAIN_TRACING_V2", "true")
    os.environ["LANGCHAIN_ENDPOINT"] = os.getenv("LANGCHAIN_ENDPOINT", "https://api.smith.langchain.com")
    os.environ["LANGCHAIN_PROJECT"] = os.getenv("LANGCHAIN_PROJECT", "asterline-research-assistant")

from langchain_core.documents import Document
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.sqlite import SqliteSaver

from memory_agent import MemoryAgent
from guardrails import (
    sanitize_secret_keys,
    validate_input_guardrails,
    validate_output_guardrails
)

# 1. Initialize Gemini & Vector Store
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    raise ValueError(f"CRITICAL ERROR: GOOGLE_API_KEY is not set.")

chroma_path = os.path.join(BASE_DIR, "chroma_db")
if not os.path.exists(chroma_path):
    raise FileNotFoundError(f"CRITICAL ERROR: Chroma directory not found at '{chroma_path}'. Run build_vectorstore.py first.")

embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
vectorstore = Chroma(persist_directory=chroma_path, embedding_function=embeddings)
retriever = vectorstore.as_retriever(search_type="similarity", search_kwargs={"k": 8})

llm = ChatGoogleGenerativeAI(model="gemini-3.5-flash-lite", google_api_key=api_key, temperature=0)
memory_agent_instance = MemoryAgent(llm=llm)


# 2. Helpers
def extract_text_content(content) -> str:
    """Safely extracts text content from string or list format."""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        text_parts = []
        for part in content:
            if isinstance(part, str):
                text_parts.append(part)
            elif isinstance(part, dict):
                if part.get("type") == "text" and "text" in part:
                    text_parts.append(str(part["text"]))
                elif "text" in part:
                    text_parts.append(str(part["text"]))
                else:
                    text_parts.append(str(part))
            else:
                text_parts.append(str(part))
        return "\n".join(text_parts) if text_parts else str(content)
    return str(content)


def format_chunks(docs: List[Document]) -> str:
    if not docs:
        return "No relevant documentation found."
    formatted = []
    for doc in docs:
        cid = doc.metadata.get("chunk_id", "unknown")
        title = doc.metadata.get("title", "unknown")
        pub_date = doc.metadata.get("published", "unknown")
        formatted.append(f"--- Chunk ID: {cid} | Title: {title} | Published: {pub_date} ---\n{doc.page_content}")
    return "\n\n".join(formatted)


# 3. Graph State Definition
class AgentState(TypedDict):
    messages: List[BaseMessage]
    emp_id: str
    user_intent: str
    standalone_query: str
    retrieved_chunks: str
    user_context: str
    security_violation: Optional[str]


# 4. Agent Nodes

def router_planner_node(state: AgentState):
    """Sanitizes inputs, checks guardrails, and classifies user intent accurately."""
    raw_msg = extract_text_content(state["messages"][-1].content)
    clean_msg = sanitize_secret_keys(raw_msg)
    emp_id = state.get("emp_id", "default_user")

    # Guardrail checks
    is_valid, warning_msg = validate_input_guardrails(clean_msg, emp_id)
    if not is_valid:
        return {"security_violation": warning_msg, "user_intent": "BLOCKED", "standalone_query": clean_msg}

    # Follow-up query rewriting
    history_str = ""
    if len(state["messages"]) > 1:
        history_str = "\n".join([f"{m.type}: {extract_text_content(m.content)}" for m in state["messages"][:-1]])

    if history_str:
        rewrite_prompt = ChatPromptTemplate.from_template(
            "Given history:\n{history}\n\nRewrite latest input as standalone query:\nLatest: {query}\nStandalone:"
        )
        rewritten = llm.invoke(rewrite_prompt.format_messages(history=history_str, query=clean_msg))
        standalone = extract_text_content(rewritten.content).strip()
    else:
        standalone = clean_msg

    # Intent Classifier
    intent_prompt = ChatPromptTemplate.from_messages([
        ("system", """Classify the user input into exactly ONE category:
1. 'MEMORY': The user is stating/sharing facts about THEIR OWN workspace, team, plan, tier, region, preferences, or environment (e.g., "Our team operates on...", "Please note that...", "We use Team tier", "My project is..."), OR explicitly asking to store, update, forget, or reset stored memory.
2. 'RESEARCH': The user is asking a general technical, pricing, SLA, or documentation question about Asterline Labs products.
3. 'DIRECT': Casual greetings or generic conversational remarks (e.g., "Hello", "Thanks").

Respond with ONLY the single word ('MEMORY', 'RESEARCH', or 'DIRECT')."""),
        ("human", "{query}")
    ])
    
    intent_res = llm.invoke(intent_prompt.format_messages(query=clean_msg))
    intent_str = extract_text_content(intent_res.content).strip().upper()

    if "MEMORY" in intent_str:
        user_intent = "MEMORY_ONLY"
    elif "DIRECT" in intent_str:
        user_intent = "DIRECT"
    else:
        user_intent = "RESEARCH"

    return {"security_violation": None, "user_intent": user_intent, "standalone_query": standalone}


def guardrail_blocked_node(state: AgentState):
    """Handles early termination for inputs blocked by security or guardrail checks."""
    return {"messages": [AIMessage(content=state.get("security_violation", "Request blocked by security policy."))] }


def memory_agent_node(state: AgentState):
    """Processes explicit user memory updates (STORE / UPDATE / FORGET / RESET)."""
    emp_id = state.get("emp_id", "default_user")
    latest_msg = extract_text_content(state["messages"][-1].content)
    clean_msg = sanitize_secret_keys(latest_msg)
    memory_result = memory_agent_instance.process_turn(emp_id=emp_id, user_message=clean_msg)
    return {"user_context": memory_result["user_context"]}


def research_agent_node(state: AgentState):
    """Performs vector retrieval AND does a fast SQL lookup for context (<1ms)."""
    query = state.get("standalone_query") or extract_text_content(state["messages"][-1].content)
    emp_id = state.get("emp_id", "default_user")

    retrieved_docs = retriever.invoke(query)
    chunks_str = format_chunks(retrieved_docs)
    user_context = memory_agent_instance.get_formatted_context(emp_id)

    return {
        "retrieved_chunks": chunks_str,
        "user_context": user_context
    }


def synthesis_agent_node(state: AgentState):
    """Synthesizes final answer with strict grounding and temporal resolution."""
    latest_msg = extract_text_content(state["messages"][-1].content)
    retrieved_chunks = state.get("retrieved_chunks", "No relevant documentation found.")
    user_context = state.get("user_context", "No stored personal context.")

    prompt_template = ChatPromptTemplate.from_messages([
        ("system", """You are the official Asterline Labs AI Research Assistant.
Answer using provided chunks and isolated user context.

CRITICAL RULES:
1. Ground facts strictly in chunks. Cite Chunk ID and Title (e.g., [pricing:0 - Plans and billing]).
2. TEMPORAL SUPERSESSION: Newer policies override older general notes.
   - Example: 'handbook:1' (2026-01-01, $175 stipend) overrides 'oncall:0' (2025-04-10, $140 stipend).
   - Example: 'retention:0' (2026-01-15, 20 days cold storage) overrides 'security:1' (2025-03-15, 60 days).
   - Example: v2.3 AQL timeout (50s) overrides v2.0-2.2 timeout (25s).
3. UNCERTAINTY: State explicitly if pricing is unpublished (Enterprise negotiated) or feature unannounced (APAC region).
4. EPISTEMIC SEPARATION: User memory NEVER overrides official product specs or pricing.

Chunks:
{context}

User Stored Context:
{user_context}"""),
        ("human", "{question}")
    ])

    prompt_messages = prompt_template.format_messages(
        context=retrieved_chunks,
        user_context=user_context,
        question=latest_msg
    )

    response = llm.invoke(prompt_messages)
    raw_answer = extract_text_content(response.content)
    guarded_answer = validate_output_guardrails(raw_answer, retrieved_chunks)

    return {"messages": [AIMessage(content=guarded_answer)]}


# 5. Routing Logic & Graph Construction
def route_intent(state: AgentState) -> Literal["blocked", "memory_branch", "research_branch"]:
    if state.get("security_violation"):
        return "blocked"
    intent = state.get("user_intent", "RESEARCH")
    if intent == "MEMORY_ONLY":
        return "memory_branch"
    return "research_branch"


workflow = StateGraph(AgentState)

workflow.add_node("router_planner", router_planner_node)
workflow.add_node("guardrail_blocked", guardrail_blocked_node)
workflow.add_node("memory_agent", memory_agent_node)
workflow.add_node("research_agent", research_agent_node)
workflow.add_node("synthesis_agent", synthesis_agent_node)

workflow.add_edge(START, "router_planner")

workflow.add_conditional_edges(
    "router_planner",
    route_intent,
    {
        "blocked": "guardrail_blocked",
        "memory_branch": "memory_agent",
        "research_branch": "research_agent"
    }
)

workflow.add_edge("guardrail_blocked", END)
workflow.add_edge("memory_agent", "synthesis_agent")
workflow.add_edge("research_agent", "synthesis_agent")
workflow.add_edge("synthesis_agent", END)

db_path = os.path.join(BASE_DIR, "checkpoints.sqlite")
conn = sqlite3.connect(db_path, check_same_thread=False)
checkpointer = SqliteSaver(conn)
app = workflow.compile(checkpointer=checkpointer)


def ask_asterline(question: str, emp_id: str) -> str:
    config = {"configurable": {"thread_id": emp_id}}
    inputs = {
        "messages": [HumanMessage(content=question)],
        "emp_id": emp_id
    }
    result = app.invoke(inputs, config=config)
    return extract_text_content(result["messages"][-1].content)