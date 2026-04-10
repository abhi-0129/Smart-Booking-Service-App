import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const CHATBOT_URL = process.env.REACT_APP_CHATBOT_URL || 'https://innovative-gentleness-production.up.railway.app';

const Chatbot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: 'bot', text: "Hi! I'm your SmartBook assistant 👋 Ask me anything about booking services!" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  // ✅ FIXED send function
  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setMessages(prev => [...prev, { from: 'user', text }]);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post(
        `${CHATBOT_URL}/chat`,
        { message: text }
      );

      setMessages(prev => [
        ...prev,
        { from: 'bot', text: res.data.reply || "Sorry, I didn't understand." }
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { from: 'bot', text: "Server error. Try again!" }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED (अब बाहर है)
  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="chatbot-wrapper">
      {open && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div className="chatbot-avatar">🤖</div>
            <div>
              <div className="chatbot-title">SmartBook Assistant</div>
              <div className="chatbot-status">● Online</div>
            </div>
            <button className="chatbot-close" onClick={() => setOpen(false)}>✕</button>
          </div>

          <div className="chatbot-messages">
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg ${m.from}`}>
                <div className="chat-bubble">{m.text}</div>
              </div>
            ))}
            {loading && (
              <div className="chat-msg bot">
                <div className="chat-bubble typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="chatbot-input-row">
            <input
              className="chatbot-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask me anything..."
            />
            <button className="chatbot-send" onClick={send} disabled={!input.trim() || loading}>
              ➤
            </button>
          </div>
        </div>
      )}

      <button className="chatbot-fab" onClick={() => setOpen(o => !o)}>
        {open ? '✕' : '💬'}
      </button>
    </div>
  );
};

export default Chatbot;