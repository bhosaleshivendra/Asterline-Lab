import os
import uvicorn
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from agent_graph import ask_asterline

app = FastAPI(title="Asterline AI Agent")

# Enable CORS for frontend clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: Optional[str] = None
    question: Optional[str] = None
    prompt: Optional[str] = None
    emp_id: Optional[str] = None
    user_id: Optional[str] = None

    def get_message(self) -> str:
        return self.message or self.question or self.prompt or ""

    def get_emp_id(self) -> str:
        return self.emp_id or self.user_id or "default_user"


@app.post("/chat")
def chat_endpoint(req: ChatRequest):
    user_msg = req.get_message()
    emp_id = req.get_emp_id()

    if not user_msg:
        raise HTTPException(
            status_code=400,
            detail="Payload must include at least one text field: 'message', 'question', or 'prompt'.",
        )

    print(f"\n[INCOMING REQUEST] emp_id='{emp_id}' | message='{user_msg}'")

    try:
        response_text = ask_asterline(question=user_msg, emp_id=emp_id)
        print(f"[RESPONSE]: {response_text}")
        
        # Return both 'answer' and 'response' to satisfy Node.js backend schema
        return {
            "answer": response_text,
            "response": response_text
        }
    except Exception as e:
        print(f"[ERROR]: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)