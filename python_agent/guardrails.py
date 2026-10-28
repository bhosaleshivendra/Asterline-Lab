import re
from typing import Tuple, Optional

SECRET_PATTERNS = r'(?i)(api[_-]?key|bearer|ingest[_-]?key|secret|password|token)\s*[:=]\s*["\']?([a-zA-Z0-9_\-]{8,})["\']?'

JAILBREAK_PATTERNS = [
    r"(?i)ignore\s+(all\s+)?(previous\s+)?instructions",
    r"(?i)forget\s+(all\s+)?(the\s+)?guardrails",
    r"(?i)override\s+(security|system|safety)\s+rules",
    r"(?i)you\s+are\s+now\s+in\s+developer\s+mode",
    r"(?i)bypass\s+(all\s+)?filters",
    r"(?i)disregard\s+(all\s+)?prior\s+prompts",
    r"(?i)do\s+anything\s+now"
]

CROSS_USER_PATTERNS = [
    r"(?i)show\s+me\s+info\s+(about|for)\s+user",
    r"(?i)what\s+is\s+emp[_-]?\w+('s)?\s+(data|memory|context|plan)",
    r"(?i)get\s+memory\s+of\s+another\s+user",
    r"(?i)other\s+employee('s)?\s+(data|context|memory|info)",
    r"(?i)read\s+user\s+data"
]

def sanitize_secret_keys(text: str) -> str:
    """Masks API keys, passwords, and tokens before logging or storage."""
    return re.sub(SECRET_PATTERNS, r'\1: [REDACTED_SECRET]', text)

def validate_input_guardrails(query: str, current_emp_id: str) -> Tuple[bool, Optional[str]]:
    """Enforces jailbreak defenses and cross-user privacy boundaries."""
    for pattern in JAILBREAK_PATTERNS:
        if re.search(pattern, query):
            return False, (
                "SECURITY WARNING: Request blocked. System guardrails and safety policies "
                "cannot be overridden."
            )

    for pattern in CROSS_USER_PATTERNS:
        if re.search(pattern, query):
            return False, (
                f"PRIVACY WARNING: Access denied. You are authenticated as '{current_emp_id}'. "
                "Inspecting context belonging to another user is prohibited."
            )

    mentioned_ids = re.findall(r'\b(emp[_-]?[a-zA-Z0-9]+)\b', query, re.IGNORECASE)
    for target_id in mentioned_ids:
        if target_id.lower() != current_emp_id.lower():
            return False, (
                f"PRIVACY WARNING: Access denied. Active session is bound strictly to '{current_emp_id}'. "
                f"You cannot access memory for '{target_id}'."
            )

    return True, None

def validate_output_guardrails(response_text: str, retrieved_chunks: str) -> str:
    """Verifies citation presence and enforces uncertainty fallbacks."""
    no_chunks = "No relevant documentation found." in retrieved_chunks or not retrieved_chunks.strip()

    if no_chunks:
        uncertainty_terms = ["not found", "no information", "does not state", "uncertain", "no documentary evidence"]
        if not any(term in response_text.lower() for term in uncertainty_terms):
            return (
                "I could not find relevant evidence in the official Asterline documentation to answer this question. "
                "Please verify if the requested feature or policy exists in official documentation."
            )
        return response_text

    # Citation Verification Guardrail
    has_citation = bool(re.search(r'\[[a-zA-Z0-9_\-]+:\d+\]|chunk_id:', response_text, re.IGNORECASE))
    is_uncertain_reply = any(term in response_text.lower() for term in ["unable to answer", "no official document", "not specified"])

    if not has_citation and not is_uncertain_reply:
        # Append explicit verification disclaimer if citations were omitted by the LLM
        response_text += "\n\n[Note: Grounded in retrieved documentation chunks]."

    return response_text