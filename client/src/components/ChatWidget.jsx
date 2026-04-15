import React, { useState, useEffect, useRef, useCallback } from "react";

const API = `${import.meta.env.VITE_API_URL || ""}/api`;
const GOLD = "#C9A84C";
const DARK = "#1a1a1a";

function getOrCreateSessionId() {
  let id = sessionStorage.getItem("culinova_session");
  if (!id) {
    id = "sess_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9);
    sessionStorage.setItem("culinova_session", id);
  }
  return id;
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [startTime] = useState(Date.now());
  const [pulse, setPulse] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const sessionInitialized = useRef(false);

  // Stop bubble pulse after 8 seconds
  useEffect(() => {
    const t = setTimeout(() => setPulse(false), 8000);
    return () => clearTimeout(t);
  }, []);

  // Initialize session
  useEffect(() => {
    if (sessionInitialized.current) return;
    sessionInitialized.current = true;

    const existing = getOrCreateSessionId();
    setSessionId(existing);

    (async () => {
      try {
        const res = await fetch(`${API}/chat/session`, { method: "POST" });
        const data = await res.json();
        if (data.sessionId) {
          setSessionId(data.sessionId);
          sessionStorage.setItem("culinova_session", data.sessionId);
        }
        setSessionReady(true);
      } catch {
        setSessionReady(true);
      }
    })();
  }, []);

  // Add welcome message on open
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content:
            "Welcome to **Culinova**! 👋\n\nI'm your AI design consultant, specialized in commercial kitchen and laundry projects across Saudi Arabia.\n\nAre you planning a new project? Tell me — are you looking for a:\n\n🍽️ **Restaurant kitchen**\n🏨 **Hotel kitchen**\n🏥 **Hospital kitchen**\n🧺 **Commercial laundry**\n🏫 **School / cafeteria**\n\nOr describe your project and let's get started!",
          time: new Date().toLocaleTimeString("en-SA", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    }
  }, [open, messages.length]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus input when open
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  // Track time spent
  useEffect(() => {
    const trackTime = () => {
      if (sessionId) {
        const seconds = Math.floor((Date.now() - startTime) / 1000);
        navigator.sendBeacon(
          `${API}/chat/time`,
          JSON.stringify({ sessionId, seconds })
        );
      }
    };
    window.addEventListener("beforeunload", trackTime);
    return () => window.removeEventListener("beforeunload", trackTime);
  }, [sessionId, startTime]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading || !sessionReady) return;
    setInput("");

    const time = new Date().toLocaleTimeString("en-SA", {
      hour: "2-digit",
      minute: "2-digit",
    });

    setMessages((prev) => [...prev, { role: "user", content: text, time }]);
    setLoading(true);

    try {
      const res = await fetch(`${API}/chat/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: text }),
      });
      const data = await res.json();

      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.reply,
            time: new Date().toLocaleTimeString("en-SA", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I'm having trouble connecting right now. Please try again or call us at **+966 54 848 9341**.",
          time,
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [input, loading, sessionId, sessionReady]);

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessage = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br/>");
  };

  const quickReplies = [
    "I need a restaurant kitchen",
    "Hotel kitchen project",
    "Commercial laundry",
    "Free consultation",
    "Equipment cost estimate",
  ];

  return (
    <>
      {/* ── Chat Bubble ── */}
      <div
        className="chat-bubble"
        style={{
          position: "fixed", bottom: 28, right: 28, zIndex: 9999,
          display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 12,
        }}
      >
        {/* Tooltip */}
        {!open && pulse && (
          <div
            style={{
              background: DARK, color: "#fff", padding: "10px 16px",
              borderRadius: 12, fontSize: 13, fontWeight: 500,
              boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
              animation: "fadeInUp .5s ease",
              maxWidth: 200, textAlign: "center",
              border: "1px solid rgba(201,168,76,0.3)",
            }}
          >
            <span style={{ color: GOLD }}>💬</span> Ask our AI consultant!
          </div>
        )}

        <button
          onClick={() => setOpen(!open)}
          style={{
            width: 62, height: 62, borderRadius: "50%", border: "none",
            background: open
              ? "linear-gradient(135deg, #333, #555)"
              : `linear-gradient(135deg, ${GOLD}, #a07830)`,
            boxShadow: open
              ? "0 4px 20px rgba(0,0,0,0.3)"
              : `0 4px 24px rgba(201,168,76,0.5)`,
            cursor: "pointer", fontSize: 26,
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all .3s",
            animation: pulse && !open ? "pulse 2s infinite" : "none",
          }}
          title="Chat with Culinova AI"
        >
          {open ? "✕" : "💬"}
        </button>
      </div>

      {/* ── Chat Window ── */}
      <div
        className="chat-window"
        style={{
          position: "fixed", bottom: 106, right: 28, zIndex: 9998,
          width: "clamp(320px, 90vw, 400px)",
          height: "clamp(480px, 75vh, 620px)",
          borderRadius: 20, overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(201,168,76,0.2)",
          display: "flex", flexDirection: "column",
          transition: "all .35s cubic-bezier(.175,.885,.32,1.275)",
          transform: open ? "scale(1) translateY(0)" : "scale(0.8) translateY(20px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "all" : "none",
          transformOrigin: "bottom right",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: `linear-gradient(135deg, ${DARK}, #2d2d2d)`,
            padding: "18px 20px",
            display: "flex", alignItems: "center", gap: 14,
            borderBottom: "1px solid rgba(201,168,76,0.2)",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 44, height: 44, borderRadius: "50%",
              background: `linear-gradient(135deg, ${GOLD}, #a07830)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, flexShrink: 0, position: "relative",
            }}
          >
            🍽️
            <div
              style={{
                position: "absolute", bottom: 2, right: 2, width: 10, height: 10,
                borderRadius: "50%", background: "#27ae60",
                border: "2px solid #1a1a1a",
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>
              Culinova AI
            </div>
            <div style={{ color: "#888", fontSize: 12 }}>
              🟢 Online · Kitchen Design Expert
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.3)",
                color: GOLD, padding: "3px 10px", borderRadius: 12,
                fontSize: 11, fontWeight: 600,
              }}
            >
              AI Powered
            </div>
          </div>
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1, overflowY: "auto", padding: "20px 16px",
            background: "#fafafa", display: "flex", flexDirection: "column", gap: 16,
          }}
        >
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                animation: "fadeInUp .3s ease",
              }}
            >
              {msg.role === "assistant" && (
                <div
                  style={{
                    width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                    background: `linear-gradient(135deg, ${GOLD}, #a07830)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, marginRight: 8, marginTop: 2,
                  }}
                >
                  🍽️
                </div>
              )}
              <div style={{ maxWidth: "78%" }}>
                <div
                  style={{
                    padding: "12px 16px",
                    borderRadius:
                      msg.role === "user"
                        ? "18px 18px 4px 18px"
                        : "18px 18px 18px 4px",
                    background:
                      msg.role === "user"
                        ? `linear-gradient(135deg, ${GOLD}, #a07830)`
                        : "#fff",
                    color: msg.role === "user" ? "#fff" : "#333",
                    fontSize: 14, lineHeight: 1.65,
                    boxShadow:
                      msg.role === "user"
                        ? "0 2px 12px rgba(201,168,76,0.3)"
                        : "0 2px 12px rgba(0,0,0,0.06)",
                    border:
                      msg.role === "assistant"
                        ? "1px solid rgba(201,168,76,0.1)"
                        : "none",
                  }}
                  dangerouslySetInnerHTML={{
                    __html: formatMessage(msg.content),
                  }}
                />
                <div
                  style={{
                    fontSize: 11, color: "#aaa", marginTop: 4,
                    textAlign: msg.role === "user" ? "right" : "left",
                    paddingLeft: msg.role === "assistant" ? 4 : 0,
                    paddingRight: msg.role === "user" ? 4 : 0,
                  }}
                >
                  {msg.time}
                </div>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <div
                style={{
                  width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                  background: `linear-gradient(135deg, ${GOLD}, #a07830)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14,
                }}
              >
                🍽️
              </div>
              <div
                style={{
                  background: "#fff", borderRadius: "18px 18px 18px 4px",
                  padding: "14px 18px", display: "flex", gap: 5,
                  boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                  border: "1px solid rgba(201,168,76,0.1)",
                }}
              >
                {[0, 0.2, 0.4].map((delay, i) => (
                  <div
                    key={i}
                    style={{
                      width: 8, height: 8, borderRadius: "50%",
                      background: GOLD,
                      animation: `bounce 1.4s ${delay}s infinite ease-in-out`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Replies */}
        {messages.length <= 1 && (
          <div
            style={{
              padding: "8px 16px", background: "#f0f0f0",
              display: "flex", gap: 8, overflowX: "auto",
              flexShrink: 0, scrollbarWidth: "none",
            }}
          >
            {quickReplies.map((qr) => (
              <button
                key={qr}
                onClick={() => {
                  setInput(qr);
                  setTimeout(() => {
                    setInput("");
                    setMessages((prev) => [
                      ...prev,
                      {
                        role: "user", content: qr,
                        time: new Date().toLocaleTimeString("en-SA", {
                          hour: "2-digit", minute: "2-digit",
                        }),
                      },
                    ]);
                    setLoading(true);
                    fetch(`${API}/chat/message`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ sessionId, message: qr }),
                    })
                      .then((r) => r.json())
                      .then((d) => {
                        if (d.reply) {
                          setMessages((prev) => [
                            ...prev,
                            {
                              role: "assistant", content: d.reply,
                              time: new Date().toLocaleTimeString("en-SA", {
                                hour: "2-digit", minute: "2-digit",
                              }),
                            },
                          ]);
                        }
                      })
                      .finally(() => setLoading(false));
                  }, 0);
                }}
                style={{
                  whiteSpace: "nowrap", padding: "6px 14px",
                  borderRadius: 20, border: `1px solid rgba(201,168,76,0.4)`,
                  background: "#fff", color: "#555", fontSize: 12,
                  cursor: "pointer", transition: "all .2s",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = GOLD;
                  e.target.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "#fff";
                  e.target.style.color = "#555";
                }}
              >
                {qr}
              </button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div
          style={{
            padding: "14px 16px",
            background: "#fff",
            borderTop: "1px solid #eee",
            display: "flex", gap: 10, alignItems: "flex-end",
            flexShrink: 0,
          }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about kitchen design, pricing, services..."
            rows={1}
            style={{
              flex: 1, padding: "10px 14px", borderRadius: 24,
              border: "1.5px solid #e0e0e0",
              fontSize: 14, resize: "none", outline: "none",
              fontFamily: "Inter, sans-serif", lineHeight: 1.5,
              maxHeight: 100, overflowY: "auto",
              transition: "border-color .2s",
            }}
            onFocus={(e) => (e.target.style.borderColor = GOLD)}
            onBlur={(e) => (e.target.style.borderColor = "#e0e0e0")}
            onInput={(e) => {
              e.target.style.height = "auto";
              e.target.style.height =
                Math.min(e.target.scrollHeight, 100) + "px";
            }}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            style={{
              width: 42, height: 42, borderRadius: "50%", border: "none",
              background:
                loading || !input.trim()
                  ? "#ddd"
                  : `linear-gradient(135deg, ${GOLD}, #a07830)`,
              color: "#fff", fontSize: 18, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all .2s", flexShrink: 0,
              boxShadow:
                !loading && input.trim()
                  ? "0 2px 12px rgba(201,168,76,0.4)"
                  : "none",
            }}
          >
            {loading ? (
              <span style={{ fontSize: 14, animation: "spin 1s linear infinite" }}>
                ⟳
              </span>
            ) : (
              "➤"
            )}
          </button>
        </div>

        {/* Footer */}
        <div
          style={{
            background: DARK, padding: "8px 16px", textAlign: "center",
            flexShrink: 0,
          }}
        >
          <span style={{ color: "#555", fontSize: 11 }}>
            Powered by{" "}
            <span style={{ color: GOLD, fontWeight: 600 }}>Culinova AI</span>
            {" · "}OpenAI GPT-4o
          </span>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 4px 24px rgba(201,168,76,0.5); }
          50% { box-shadow: 0 4px 40px rgba(201,168,76,0.8); transform: scale(1.05); }
        }
        @media (max-width: 480px) {
          .chat-window {
            bottom: 0 !important;
            right: 0 !important;
            width: 100vw !important;
            height: 92dvh !important;
            border-radius: 20px 20px 0 0 !important;
            transform-origin: bottom center !important;
          }
          .chat-bubble {
            bottom: 16px !important;
            right: 16px !important;
          }
        }
      `}</style>
    </>
  );
}
