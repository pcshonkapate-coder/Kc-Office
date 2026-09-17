import re
import html
from typing import Optional

# Regex pattern to match potential XSS and HTML tags
TAG_RE = re.compile(r"<[^>]+>")
SCRIPT_RE = re.compile(r"(?i)<\s*script[^>]*>.*?<\s*/\s*script\s*>", re.DOTALL)
EVENT_HANDLER_RE = re.compile(r"(?i)\bon\w+\s*=", re.IGNORECASE)
JAVASCRIPT_URI_RE = re.compile(r"(?i)javascript:\s*", re.IGNORECASE)


def sanitize_text(value: Optional[str]) -> Optional[str]:
    """
    Sanitize text input by removing script blocks, tags, and decoding dangerous entities.
    Preserves normal punctuation, standard characters, and multi-line breaks.
    """
    if not value:
        return value

    text = value.strip()
    # Strip script blocks
    text = SCRIPT_RE.sub("", text)
    # Strip inline HTML tags
    text = TAG_RE.sub("", text)
    # Strip event handlers (e.g. onload=) and javascript: schemes
    text = EVENT_HANDLER_RE.sub("", text)
    text = JAVASCRIPT_URI_RE.sub("", text)
    # Escape HTML special entities
    text = html.escape(text, quote=True)
    # Unescape normal quotes and apostrophes for natural reading in CRM
    text = text.replace("&quot;", '"').replace("&#x27;", "'").replace("&amp;", "&")
    return text.strip()


def validate_honeypot(honeypot_value: Optional[str]) -> bool:
    """
    Returns True if the honeypot is empty (legitimate user),
    or False if filled (automated bot submission).
    """
    if honeypot_value and honeypot_value.strip():
        return False
    return True
