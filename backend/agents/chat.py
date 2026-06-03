from prompts import GENERAL_CHAT_PROMPT, PAGE_INSIGHT_PROMPT


def format_chat_history(history: list[dict[str, str]]) -> str:
    if not history:
        return "No previous chat context."
    return "\n".join(
        f"{item['role'].title()}: {item['content']}"
        for item in history
    )


def build_general_chat_prompt(question: str, history: list[dict[str, str]] | None = None) -> str:
    return f"""
    {GENERAL_CHAT_PROMPT}

    Recent conversation context:
    {format_chat_history(history or [])}

    Answer the following question:
    Question:
    {question}
    """


def build_page_insight_prompt(page: str, question: str, page_data_json: str) -> str:
    return f"""
    {PAGE_INSIGHT_PROMPT}

    Current page:
    {page}

    User question:
    {question}

    Page data JSON:
    {page_data_json}
    """
