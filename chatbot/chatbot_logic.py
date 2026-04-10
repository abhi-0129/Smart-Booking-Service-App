import os
import re
from collections import defaultdict

# Try Google Gemini API first, fall back to rule-based
try:
    import google.generativeai as genai

    genai.configure(api_key=os.environ.get("GOOGLE_API_KEY", ""))
    model = genai.GenerativeModel("gemini-1.5-flash")

    USE_AI = bool(os.environ.get("AIzaSyDNNRoMZ6bYQJ-cpuVws4f5OSmXo8eKT-A"))
except ImportError:
    USE_AI = False

# In-memory session history for multi-turn conversation
_session_history = defaultdict(list)

SYSTEM_PROMPT = """You are a friendly and helpful assistant for SmartBook, a smart booking system.
SmartBook connects customers with service providers across categories like cleaning, plumbing, electrical, beauty, fitness, and tutoring.

Key platform facts:
- Customers can browse services, book by selecting date/time, and rate completed bookings 1-5 stars.
- Providers can add services with photos, set their own price and duration, and accept or reject booking requests.
- Bookings go through statuses: pending → accepted/rejected → completed (or cancelled).
- Real-time notifications are sent via Socket.io when booking status changes.
- Payments are shown in Indian Rupees (₹).

Keep responses helpful, concise, and friendly. If the user asks something unrelated to SmartBook, gently redirect them.
"""

# Rule-based fallback
RULES = [
    (r"\b(hi|hello|hey)\b", "Hi there! 👋 I'm your SmartBook assistant. How can I help you today?"),
    (r"\b(book|booking)\b", "To make a booking:\n1. Go to Browse Services\n2. Select service\n3. Click Book Now\n4. Choose date/time"),
    (r"\b(cancel)\b", "You can cancel booking only if it's in Pending status."),
    (r"\b(price|cost)\b", "Prices are set by providers in ₹. No hidden charges."),
    (r"\b(provider)\b", "Providers can add services, accept/reject bookings."),
    (r"\b(thanks|thank you)\b", "You're welcome! 😊"),
]

def get_ai_response(message: str, history: list) -> str:
    """Call Gemini API"""
    try:
        chat = model.start_chat(history=history)
        response = chat.send_message(SYSTEM_PROMPT + "\nUser: " + message)
        return response.text
    except Exception as e:
        return get_rule_response(message)

def get_rule_response(message: str) -> str:
    msg = message.lower().strip()
    for pattern, response in RULES:
        if re.search(pattern, msg, re.IGNORECASE):
            return response
    return "I'm here to help with SmartBook! Ask me anything 😊"

def get_response(message: str, session_id: str = "default") -> str:
    if USE_AI:
        history = _session_history[session_id]

        # Convert history to Gemini format
        formatted_history = [
            {"role": msg["role"], "parts": [msg["content"]]}
            for msg in history
        ]

        reply = get_ai_response(message, formatted_history)

        # Save conversation
        _session_history[session_id].append({"role": "user", "content": message})
        _session_history[session_id].append({"role": "assistant", "content": reply})

        # Limit history
        if len(_session_history[session_id]) > 20:
            _session_history[session_id] = _session_history[session_id][-20:]

        return reply

    return get_rule_response(message)