import os
import sqlite3
from typing import Optional, List
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(dotenv_path=os.path.join(BASE_DIR, ".env"))


class MemoryOperation(BaseModel):
    action: str = Field(description="Action to perform: 'STORE', 'UPDATE', 'FORGET', or 'NO_OP'")
    key: Optional[str] = Field(default=None, description="Attribute key (e.g., 'workspace_tier', 'region')")
    value: Optional[str] = Field(default=None, description="Attribute value (e.g., 'Enterprise', 'EU Dublin')")


class MemoryOperationsList(BaseModel):
    operations: List[MemoryOperation] = Field(description="List of memory operations to execute")


class MemoryAgent:
    def __init__(self, llm: Optional[ChatGoogleGenerativeAI] = None, db_path: Optional[str] = None):
        if db_path is None:
            self.db_path = os.path.join(BASE_DIR, "memory.sqlite")
        else:
            self.db_path = db_path

        if llm is None:
            api_key = os.getenv("GOOGLE_API_KEY")
            if not api_key:
                raise ValueError("CRITICAL ERROR: GOOGLE_API_KEY environment variable is missing.")
            self.llm = ChatGoogleGenerativeAI(model="gemini-3.5-flash-lite", google_api_key=api_key)
        else:
            self.llm = llm

        self._init_db()

    def _init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS user_memories (
                    emp_id TEXT NOT NULL,
                    key TEXT NOT NULL,
                    value TEXT NOT NULL,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (emp_id, key)
                )
            """)
            conn.commit()

    def get_formatted_context(self, emp_id: str) -> str:
        """Fetches ONLY the active employee's stored memories from SQLite."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT key, value FROM user_memories WHERE emp_id = ?", (emp_id,))
            rows = cursor.fetchall()

        if not rows:
            return "No stored personal or workspace context recorded for this user."

        return "\n".join([f"- {key}: {value}" for key, value in rows])

    def process_turn(self, emp_id: str, user_message: str) -> dict:
        """Parses user input for memory commands and updates SQLite atomically."""
        existing_context = self.get_formatted_context(emp_id)

        prompt = ChatPromptTemplate.from_messages([
            ("system", """You analyze user messages to detect memory instructions for user workspace settings.
Current Stored Context for User:
{existing_context}

Rules:
1. Extract ALL requested operations (STORE, UPDATE, FORGET) into the operations list.
2. Standardize atomic key names (e.g., 'workspace_tier', 'region', 'team_name').
3. For FORGET actions, identify the target key name to delete (e.g., 'region')."""),
            ("human", "{message}")
        ])

        ops: List[MemoryOperation] = []
        try:
            structured_llm = self.llm.with_structured_output(MemoryOperationsList)
            result = structured_llm.invoke(
                prompt.format_messages(existing_context=existing_context, message=user_message)
            )
            if result and hasattr(result, "operations"):
                ops = result.operations
        except Exception as err:
            print(f"[MemoryAgent Error]: {err}")

        confirmations = []

        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            for op in ops:
                if op.action in ["STORE", "UPDATE"] and op.key and op.value:
                    clean_key = op.key.lower().strip()
                    cursor.execute(
                        "INSERT INTO user_memories (emp_id, key, value, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP) "
                        "ON CONFLICT(emp_id, key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP",
                        (emp_id, clean_key, op.value)
                    )
                    confirmations.append(f"Saved {clean_key} = {op.value}")

                elif op.action == "FORGET" and op.key:
                    clean_key = op.key.lower().strip()
                    cursor.execute(
                        "DELETE FROM user_memories WHERE emp_id = ? AND key = ?",
                        (emp_id, clean_key)
                    )
                    confirmations.append(f"Forgotten key '{clean_key}'")
            conn.commit()

        updated_context = self.get_formatted_context(emp_id)
        status_msg = "; ".join(confirmations) if confirmations else "Memory updated successfully."

        return {
            "status": status_msg,
            "user_context": updated_context
        }