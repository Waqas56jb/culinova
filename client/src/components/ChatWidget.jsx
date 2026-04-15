import React, { useState, useEffect, useRef, useCallback } from "react";

const API  = `${import.meta.env.VITE_API_URL || ""}/api`;
const GOLD = "#C9A84C";
const DARK = "#1a1a1a";

function useIsMobile(bp = 480) {
  const [m, setM] = useState(
    typeof window !== "undefined" ? window.innerWidth <= bp : false
  );
  useEffect(() => {
    const fn = () => setM(window.innerWidth <= bp);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, [bp]);
  return m;
}

function getOrCreateSessionId() {
  let id = sessionStorage.getItem("culinova_session");
  if (!id) {
    id = "sess_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9);
    sessionStorage.setItem("culinova_session", id);
  }
  return id;
}

export default function ChatWidget() {
  const [open, setOpen]               = useState(false);
  const [messages, setMessages]       = useState([]);
  const [input, setInput]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [sessionId, setSessionId]     = useState(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [startTime]                   = useState(Date.now());
  const [pulse, setPulse]             = useState(true);
  const messagesEndRef  = useRef(null);
  const inputRef        = useRef(null);
  const sessionInit     = useRef(false);
  const isMobile        = useIsMobile();

  // Pulse stops after 8s
  useEffect(() => {
    const t = setTimeout(() => setPulse(false), 8000);
    return () => clearTimeout(t);
  }, []);

  // Initialize session once
  useEffect(() => {
    if (sessionInit.current) return;
    sessionInit.current = true;
    setSessionId(getOrCreateSessionId());
    (async () => {
      try {
        const res  = await fetch(`${API}/chat/session`, { method: "POST" });
        const data = await res.json();
        if (data.sessionId) {
          setSessionId(data.sessionId);
          sessionStorage.setItem("culinova_session", data.sessionId);
        }
      } catch { /* silent */ }
      finally { setSessionReady(true); }
    })();
  }, []);

  // Welcome message on first open
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: "assistant",
        content: "Hello! 👋 Welcome to **Culinova** — Saudi Arabia's leading commercial kitchen & laundry design experts.\n\nWhat kind of project are you planning?",
        time: now(),
      }]);
    }
  }, [open, messages.length]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus input when open
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  // Track time spent on unload
  useEffect(() => {
    const fn = () => {
      if (!sessionId) return;
      const secs = Math.floor((Date.now() - startTime) / 1000);
      navigator.sendBeacon(`${API}/chat/time`, JSON.stringify({ sessionId, seconds: secs }));
    };
    window.addEventListener("beforeunload", fn);
    return () => window.removeEventListener("beforeunload", fn);
  }, [sessionId, startTime]);

  // Lock body scroll on mobile when chat is open
  useEffect(() => {
    if (isMobile) {
      document.body.style.overflow = open ? "hidden" : "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open, isMobile]);

  function now() {
    return new Date().toLocaleTimeString("en-SA", { hour: "2-digit", minute: "2-digit" });
  }

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading || !sessionReady) return;
    setInput("");

    setMessages(prev => [...prev, { role: "user", content: text, time: now() }]);
    setLoading(true);

    try {
      const res  = await fetch(`${API}/chat/message`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ sessionId, message: text }),
      });
      const data = await res.json();
      if (data.reply) {
        setMessages(prev => [...prev, { role: "assistant", content: data.reply, time: now() }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "I'm having trouble connecting. Please try again or call **+966 54 848 9341**.",
        time: now(),
      }]);
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

  const sendQuickReply = (qr) => {
    const text = qr.replace(/^[^\w]+\s*/, ""); // strip leading emoji+space for clean text
    setMessages(prev => [...prev, { role: "user", content: qr, time: now() }]);
    setLoading(true);
    fetch(`${API}/chat/message`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ sessionId, message: qr }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.reply) setMessages(prev => [...prev, { role: "assistant", content: d.reply, time: now() }]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const fmt = (text) =>
    text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br/>");

  const quickReplies = [
    "🍽️ Restaurant kitchen",
    "🏨 Hotel kitchen",
    "🏥 Hospital kitchen",
    "🧺 Commercial laundry",
    "🏫 School / cafeteria",
    "💰 Get price estimate",
  ];

  /* ── Window sizing: desktop vs mobile ── */
  const windowStyle = isMobile
    ? {
        /* True full-screen on mobile: immune to keyboard viewport changes */
        position:    "fixed",
        top:         0,
        left:        0,
        right:       0,
        bottom:      0,
        width:       "100%",
        height:      "100%",
        borderRadius: 0,
        zIndex:      10000,
      }
    : {
        position:     "fixed",
        bottom:       106,
        right:        28,
        width:        390,
        height:       600,
        borderRadius: 20,
        zIndex:       9998,
      };

  return (
    <>
      {/* ── Floating Bubble (hidden on mobile while open) ── */}
      {!(isMobile && open) && (
        <div
          style={{
            position: "fixed",
            bottom:   isMobile ? 16 : 28,
            right:    isMobile ? 16 : 28,
            zIndex:   9999,
            display:  "flex", flexDirection: "column", alignItems: "flex-end", gap: 10,
          }}
        >
          {/* Tooltip */}
          {!open && pulse && (
            <div style={{
              background:   DARK, color: "#fff", padding: "10px 16px",
              borderRadius: 12, fontSize: 13, fontWeight: 500,
              boxShadow:    "0 4px 20px rgba(0,0,0,0.2)",
              maxWidth:     200, textAlign: "center",
              border:       "1px solid rgba(201,168,76,0.3)",
              animation:    "fadeInUp .5s ease",
            }}>
              <span style={{ color: GOLD }}>💬</span> Ask our AI consultant!
            </div>
          )}

          <button
            onClick={() => setOpen(!open)}
            title="Chat with Culinova AI"
            style={{
              width:      62, height: 62, borderRadius: "50%", border: "none",
              background: open
                ? "linear-gradient(135deg,#333,#555)"
                : `linear-gradient(135deg,${GOLD},#a07830)`,
              boxShadow:  open
                ? "0 4px 20px rgba(0,0,0,0.3)"
                : `0 4px 24px rgba(201,168,76,0.5)`,
              cursor:     "pointer", fontSize: 26,
              display:    "flex", alignItems: "center", justifyContent: "center",
              transition: "all .3s",
              animation:  pulse && !open ? "pulse 2s infinite" : "none",
              flexShrink: 0,
            }}
          >
            {open ? "✕" : "💬"}
          </button>
        </div>
      )}

      {/* ── Chat Window ── */}
      <div
        style={{
          ...windowStyle,
          overflow:     "hidden",
          boxShadow:    "0 20px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(201,168,76,0.2)",
          display:      "flex", flexDirection: "column",
          /* Animate open/close only on desktop */
          ...(isMobile ? {
            transform:   open ? "translateY(0)"    : "translateY(100%)",
            transition:  "transform .3s cubic-bezier(.4,0,.2,1)",
            pointerEvents: open ? "all" : "none",
          } : {
            transform:   open ? "scale(1) translateY(0)" : "scale(0.85) translateY(20px)",
            opacity:     open ? 1 : 0,
            transition:  "all .3s cubic-bezier(.175,.885,.32,1.275)",
            pointerEvents: open ? "all" : "none",
            transformOrigin: "bottom right",
          }),
          background:   "#fafafa",
        }}
      >
        {/* ── Header ── */}
        <div style={{
          background:    `linear-gradient(135deg,${DARK},#2d2d2d)`,
          padding:       "14px 16px",
          display:       "flex", alignItems: "center", gap: 12,
          borderBottom:  "1px solid rgba(201,168,76,0.2)",
          flexShrink:    0,
          /* Safe area for notch on mobile */
          paddingTop:    isMobile ? "max(14px, env(safe-area-inset-top))" : "14px",
        }}>
          {/* Avatar */}
          <div style={{
            width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
            background:  `linear-gradient(135deg,${GOLD},#a07830)`,
            display:     "flex", alignItems: "center", justifyContent: "center",
            fontSize:    18, position: "relative",
          }}>
            🍽️
            <div style={{
              position: "absolute", bottom: 1, right: 1,
              width: 10, height: 10, borderRadius: "50%",
              background: "#27ae60", border: "2px solid #1a1a1a",
            }} />
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              Culinova AI
            </div>
            <div style={{ color: "#888", fontSize: 11 }}>🟢 Online · Kitchen Design Expert</div>
          </div>

          {/* AI badge + close */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <div style={{
              background:   "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.3)",
              color:        GOLD, padding: "3px 10px", borderRadius: 12,
              fontSize:     10, fontWeight: 600, whiteSpace: "nowrap",
            }}>
              AI Powered
            </div>
            {/* Always-visible close button */}
            <button
              onClick={() => setOpen(false)}
              style={{
                width: 30, height: 30, borderRadius: "50%", border: "none",
                background:  "rgba(255,255,255,0.1)", color: "#ccc",
                fontSize:    16, cursor: "pointer", flexShrink: 0,
                display:     "flex", alignItems: "center", justifyContent: "center",
                transition:  "background .2s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── Messages ── */}
        <div style={{
          flex:           1,
          overflowY:      "auto",
          overflowX:      "hidden",
          padding:        "16px 14px",
          display:        "flex",
          flexDirection:  "column",
          gap:            14,
          /* Prevent scroll chaining on iOS */
          WebkitOverflowScrolling: "touch",
          minHeight:      0,           /* critical: allows flex child to shrink */
        }}>
          {messages.map((msg, i) => (
            <div key={i} style={{
              display:        "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              animation:      "fadeInUp .25s ease",
            }}>
              {msg.role === "assistant" && (
                <div style={{
                  width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                  background:  `linear-gradient(135deg,${GOLD},#a07830)`,
                  display:     "flex", alignItems: "center", justifyContent: "center",
                  fontSize:    13, marginRight: 8, marginTop: 2,
                }}>
                  🍽️
                </div>
              )}
              <div style={{ maxWidth: "80%", minWidth: 0 }}>
                <div
                  style={{
                    padding:      "11px 14px",
                    borderRadius: msg.role === "user"
                      ? "16px 16px 4px 16px"
                      : "16px 16px 16px 4px",
                    background:   msg.role === "user"
                      ? `linear-gradient(135deg,${GOLD},#a07830)`
                      : "#fff",
                    color:        msg.role === "user" ? "#fff" : "#333",
                    fontSize:     14, lineHeight: 1.6,
                    boxShadow:    msg.role === "user"
                      ? "0 2px 10px rgba(201,168,76,0.3)"
                      : "0 2px 8px rgba(0,0,0,0.06)",
                    border:       msg.role === "assistant"
                      ? "1px solid rgba(201,168,76,0.12)"
                      : "none",
                    wordBreak:    "break-word",
                    overflowWrap: "break-word",
                  }}
                  dangerouslySetInnerHTML={{ __html: fmt(msg.content) }}
                />
                <div style={{
                  fontSize:   10, color: "#bbb", marginTop: 3,
                  textAlign:  msg.role === "user" ? "right" : "left",
                  padding:    msg.role === "user" ? "0 4px 0 0" : "0 0 0 4px",
                }}>
                  {msg.time}
                </div>
              </div>
            </div>
          ))}

          {/* Typing dots */}
          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                background:  `linear-gradient(135deg,${GOLD},#a07830)`,
                display:     "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13,
              }}>🍽️</div>
              <div style={{
                background:   "#fff", borderRadius: "16px 16px 16px 4px",
                padding:      "12px 16px", display: "flex", gap: 5,
                boxShadow:    "0 2px 8px rgba(0,0,0,0.06)",
                border:       "1px solid rgba(201,168,76,0.1)",
              }}>
                {[0, 0.2, 0.4].map((d, i) => (
                  <div key={i} style={{
                    width: 7, height: 7, borderRadius: "50%", background: GOLD,
                    animation: `bounce 1.4s ${d}s infinite ease-in-out`,
                  }} />
                ))}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ── Quick Replies ── */}
        {messages.length <= 1 && (
          <div style={{
            padding:        "8px 12px",
            background:     "#f0f0f0",
            display:        "flex",
            gap:            6,
            overflowX:      "auto",
            flexShrink:     0,
            scrollbarWidth: "none",
            WebkitOverflowScrolling: "touch",
          }}>
            {quickReplies.map(qr => (
              <button
                key={qr}
                onClick={() => sendQuickReply(qr)}
                style={{
                  whiteSpace:  "nowrap",
                  padding:     "6px 12px",
                  borderRadius: 16,
                  border:      `1px solid rgba(201,168,76,0.4)`,
                  background:  "#fff",
                  color:       "#555",
                  fontSize:    12,
                  cursor:      "pointer",
                  flexShrink:  0,
                  transition:  "all .2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = GOLD; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#555"; }}
              >
                {qr}
              </button>
            ))}
          </div>
        )}

        {/* ── Input Area ── */}
        <div style={{
          padding:       "10px 12px",
          background:    "#fff",
          borderTop:     "1px solid #eee",
          display:       "flex",
          gap:           8,
          alignItems:    "center",   /* center (not flex-end) prevents height-jump */
          flexShrink:    0,
          /* iOS safe area bottom padding */
          paddingBottom: isMobile
            ? "max(10px, env(safe-area-inset-bottom))"
            : "10px",
        }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about kitchen design, pricing…"
            rows={1}
            style={{
              flex:        1,
              padding:     "10px 14px",
              borderRadius: 20,
              border:      "1.5px solid #e0e0e0",
              fontSize:    14,
              resize:      "none",
              outline:     "none",
              fontFamily:  "Inter, sans-serif",
              lineHeight:  1.45,
              /* Fixed height — no dynamic resizing (prevents floating) */
              height:      42,
              maxHeight:   42,
              overflowY:   "auto",
              transition:  "border-color .2s",
              boxSizing:   "border-box",
              display:     "block",
            }}
            onFocus={e  => (e.target.style.borderColor = GOLD)}
            onBlur={e   => (e.target.style.borderColor = "#e0e0e0")}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            style={{
              width:       42,
              height:      42,
              borderRadius: "50%",
              border:      "none",
              background:  loading || !input.trim()
                ? "#ddd"
                : `linear-gradient(135deg,${GOLD},#a07830)`,
              color:       "#fff",
              fontSize:    17,
              cursor:      loading || !input.trim() ? "not-allowed" : "pointer",
              display:     "flex",
              alignItems:  "center",
              justifyContent: "center",
              transition:  "all .2s",
              flexShrink:  0,
              boxShadow:   !loading && input.trim()
                ? "0 2px 10px rgba(201,168,76,0.4)"
                : "none",
            }}
            aria-label="Send"
          >
            {loading
              ? <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span>
              : "➤"}
          </button>
        </div>

        {/* ── Footer ── */}
        <div style={{
          background:  DARK,
          padding:     "6px 14px",
          textAlign:   "center",
          flexShrink:  0,
        }}>
          <span style={{ color: "#555", fontSize: 10 }}>
            Powered by <span style={{ color: GOLD, fontWeight: 600 }}>Culinova AI</span>
            {" · "}GPT-4o
          </span>
        </div>
      </div>

      {/* ── Global keyframes ── */}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); opacity: .5; }
          40%           { transform: scale(1); opacity: 1;  }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 4px 24px rgba(201,168,76,.5); }
          50%       { box-shadow: 0 4px 40px rgba(201,168,76,.8); transform: scale(1.05); }
        }
      `}</style>
    </>
  );
}
