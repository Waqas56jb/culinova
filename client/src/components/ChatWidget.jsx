import React, { useState, useEffect, useRef, useCallback } from "react";

const API  = `${import.meta.env.VITE_API_URL || ""}/api`;
const GOLD = "#C9A84C";
const GOLD2 = "#a07830";

/* ── small helpers ─────────────────────────────────────────────────────────── */
function useIsMobile(bp = 600) {
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

function nowStr() {
  return new Date().toLocaleTimeString("en-SA", { hour: "2-digit", minute: "2-digit" });
}

function fmt(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g,     "<em>$1</em>")
    .replace(/\n/g,            "<br/>");
}

/* ── component ─────────────────────────────────────────────────────────────── */
export default function ChatWidget() {
  const [open, setOpen]           = useState(false);
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [ready, setReady]         = useState(false);
  const [pulse, setPulse]         = useState(true);
  const [startTime]               = useState(Date.now());

  const endRef      = useRef(null);
  const inputRef    = useRef(null);
  const initRef     = useRef(false);
  const isMobile    = useIsMobile();

  /* pulse fades after 8 s */
  useEffect(() => {
    const t = setTimeout(() => setPulse(false), 8000);
    return () => clearTimeout(t);
  }, []);

  /* session init */
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    let id = sessionStorage.getItem("culinova_sid");
    if (!id) {
      id = "sess_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
      sessionStorage.setItem("culinova_sid", id);
    }
    setSessionId(id);
    (async () => {
      try {
        const r = await fetch(`${API}/chat/session`, { method: "POST" });
        const d = await r.json();
        if (d.sessionId) {
          setSessionId(d.sessionId);
          sessionStorage.setItem("culinova_sid", d.sessionId);
        }
      } catch {/* silent */}
      finally { setReady(true); }
    })();
  }, []);

  /* welcome message */
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: "assistant",
        content: "Hello! 👋 Welcome to **Culinova** — Saudi Arabia's leading commercial kitchen & laundry design experts.\n\nWhat kind of project are you planning?",
        time: nowStr(),
      }]);
    }
  }, [open, messages.length]);

  /* scroll to bottom */
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  /* focus input */
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 180);
  }, [open]);

  /* time tracking */
  useEffect(() => {
    const fn = () => {
      if (!sessionId) return;
      navigator.sendBeacon(
        `${API}/chat/time`,
        JSON.stringify({ sessionId, seconds: Math.floor((Date.now() - startTime) / 1000) })
      );
    };
    window.addEventListener("beforeunload", fn);
    return () => window.removeEventListener("beforeunload", fn);
  }, [sessionId, startTime]);

  /* body scroll lock on mobile */
  useEffect(() => {
    if (isMobile) document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open, isMobile]);

  /* ── send ── */
  const send = useCallback(async (text) => {
    text = (text || input).trim();
    if (!text || loading || !ready) return;
    setInput("");
    setMessages(p => [...p, { role: "user", content: text, time: nowStr() }]);
    setLoading(true);
    try {
      const r = await fetch(`${API}/chat/message`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ sessionId, message: text }),
      });
      const d = await r.json();
      if (d.reply) setMessages(p => [...p, { role: "assistant", content: d.reply, time: nowStr() }]);
    } catch {
      setMessages(p => [...p, {
        role: "assistant",
        content: "I'm having trouble connecting. Please try again or call **+966 54 848 9341**.",
        time: nowStr(),
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [input, loading, sessionId, ready]);

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const quickReplies = [
    "🍽️ Restaurant kitchen",
    "🏨 Hotel kitchen",
    "🏥 Hospital kitchen",
    "🧺 Commercial laundry",
    "🏫 School / cafeteria",
    "💰 Get price estimate",
  ];

  /* ── layout ── */
  // Desktop: clamp height so it never clips the top of the viewport
  const BUBBLE_H   = 80;   // bubble + gap
  const MARGIN_TOP = 16;   // min clearance from top
  const maxH = typeof window !== "undefined"
    ? Math.min(600, window.innerHeight - BUBBLE_H - MARGIN_TOP)
    : 560;

  return (
    <>
      {/* ═══ CHAT WINDOW ═══ */}
      <div
        style={isMobile ? {
          /* Mobile: full-screen sheet */
          position:     "fixed",
          inset:        0,
          zIndex:       10001,
          display:      "flex",
          flexDirection:"column",
          background:   "#f5f5f5",
          transform:    open ? "translateY(0)"   : "translateY(100%)",
          transition:   "transform .3s cubic-bezier(.4,0,.2,1)",
          pointerEvents: open ? "all" : "none",
        } : {
          /* Desktop */
          position:     "fixed",
          bottom:       BUBBLE_H,
          right:        24,
          width:        380,
          height:       maxH,
          zIndex:       9998,
          display:      "flex",
          flexDirection:"column",
          background:   "#f5f5f5",
          borderRadius: 16,
          overflow:     "hidden",
          boxShadow:    "0 8px 40px rgba(0,0,0,0.18), 0 0 0 1px rgba(201,168,76,0.15)",
          transform:    open ? "scale(1) translateY(0)"    : "scale(0.92) translateY(12px)",
          opacity:      open ? 1 : 0,
          transition:   "all .28s cubic-bezier(.4,0,.2,1)",
          pointerEvents: open ? "all" : "none",
          transformOrigin: "bottom right",
        }}
      >
        {/* ── Header ── */}
        <div style={{
          background:   "linear-gradient(135deg, #111 0%, #222 100%)",
          padding:      isMobile ? "max(14px,env(safe-area-inset-top)) 16px 14px" : "14px 16px",
          display:      "flex",
          alignItems:   "center",
          gap:          12,
          borderBottom: "1px solid rgba(201,168,76,0.2)",
          flexShrink:   0,
        }}>
          {/* Avatar */}
          <div style={{
            width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
            background:  `linear-gradient(135deg,${GOLD},${GOLD2})`,
            display:     "flex", alignItems: "center", justifyContent: "center",
            fontSize:    20, position: "relative",
            boxShadow:   `0 0 0 3px rgba(201,168,76,0.25)`,
          }}>
            🍽️
            <div style={{
              position: "absolute", bottom: 1, right: 1,
              width: 10, height: 10, borderRadius: "50%",
              background: "#2ecc71", border: "2px solid #111",
            }} />
          </div>

          {/* Title */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 15, letterSpacing: 0.3 }}>
              Culinova AI
            </div>
            <div style={{ color: "#27ae60", fontSize: 11, marginTop: 1, display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#2ecc71", display: "inline-block" }} />
              Online · Responds instantly
            </div>
          </div>

          {/* Badge + Close */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <div style={{
              background:   "rgba(201,168,76,0.15)",
              border:       "1px solid rgba(201,168,76,0.3)",
              color:        GOLD, padding: "3px 9px",
              borderRadius: 20, fontSize: 10, fontWeight: 700,
              letterSpacing: 0.5, textTransform: "uppercase",
            }}>
              GPT-4o
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              style={{
                width:       32, height: 32, borderRadius: "50%",
                background:  "rgba(255,255,255,0.08)",
                border:      "1px solid rgba(255,255,255,0.12)",
                color:       "#aaa", fontSize: 15, cursor: "pointer",
                display:     "flex", alignItems: "center", justifyContent: "center",
                transition:  "all .2s",
                lineHeight:  1,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(231,76,60,0.3)"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#aaa"; }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── Messages ── */}
        <div style={{
          flex:       1,
          overflowY:  "auto",
          overflowX:  "hidden",
          padding:    "16px 14px 8px",
          display:    "flex",
          flexDirection: "column",
          gap:        12,
          minHeight:  0,
          WebkitOverflowScrolling: "touch",
          background: "#f5f5f5",
        }}>
          {messages.map((msg, i) => (
            <div key={i} style={{
              display:        "flex",
              flexDirection:  "column",
              alignItems:     msg.role === "user" ? "flex-end" : "flex-start",
              animation:      "cw-fadeIn .22s ease",
            }}>
              {/* Row: avatar + bubble */}
              <div style={{
                display:     "flex",
                alignItems:  "flex-end",
                gap:         8,
                flexDirection: msg.role === "user" ? "row-reverse" : "row",
                maxWidth:    "88%",
              }}>
                {/* Bot avatar */}
                {msg.role === "assistant" && (
                  <div style={{
                    width:      28, height: 28, borderRadius: "50%", flexShrink: 0,
                    background: `linear-gradient(135deg,${GOLD},${GOLD2})`,
                    display:    "flex", alignItems: "center", justifyContent: "center",
                    fontSize:   12, marginBottom: 2,
                    boxShadow:  "0 2px 6px rgba(0,0,0,0.15)",
                  }}>
                    🍽️
                  </div>
                )}
                {/* Bubble */}
                <div
                  style={{
                    padding:      "10px 14px",
                    borderRadius: msg.role === "user"
                      ? "18px 18px 4px 18px"
                      : "4px 18px 18px 18px",
                    background:   msg.role === "user"
                      ? `linear-gradient(135deg,${GOLD},${GOLD2})`
                      : "#fff",
                    color:        msg.role === "user" ? "#fff" : "#222",
                    fontSize:     14, lineHeight: 1.6,
                    boxShadow:    msg.role === "user"
                      ? "0 2px 10px rgba(201,168,76,0.35)"
                      : "0 1px 6px rgba(0,0,0,0.08)",
                    border:       msg.role === "assistant"
                      ? "1px solid rgba(0,0,0,0.06)"
                      : "none",
                    wordBreak:    "break-word",
                    overflowWrap: "break-word",
                  }}
                  dangerouslySetInnerHTML={{ __html: fmt(msg.content) }}
                />
              </div>
              {/* Timestamp */}
              <div style={{
                fontSize:  10, color: "#bbb", marginTop: 4,
                paddingLeft:  msg.role === "assistant" ? 36 : 0,
                paddingRight: msg.role === "user"      ? 0  : 0,
              }}>
                {msg.time}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                background: `linear-gradient(135deg,${GOLD},${GOLD2})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12,
              }}>🍽️</div>
              <div style={{
                background:   "#fff", borderRadius: "4px 18px 18px 18px",
                padding:      "12px 16px", display: "flex", gap: 5, alignItems: "center",
                boxShadow:    "0 1px 6px rgba(0,0,0,0.08)",
                border:       "1px solid rgba(0,0,0,0.06)",
              }}>
                {[0, 0.18, 0.36].map((d, i) => (
                  <div key={i} style={{
                    width: 7, height: 7, borderRadius: "50%",
                    background: GOLD,
                    animation:  `cw-bounce 1.3s ${d}s infinite`,
                  }} />
                ))}
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* ── Quick Replies ── */}
        {messages.length <= 1 && (
          <div style={{
            padding:     "8px 12px 6px",
            background:  "#fff",
            borderTop:   "1px solid #eee",
            display:     "flex",
            gap:         6,
            overflowX:   "auto",
            flexShrink:  0,
            scrollbarWidth: "none",
            WebkitOverflowScrolling: "touch",
          }}>
            {quickReplies.map(qr => (
              <button
                key={qr}
                onClick={() => send(qr)}
                style={{
                  whiteSpace:   "nowrap",
                  padding:      "6px 12px",
                  borderRadius: 20,
                  border:       `1px solid rgba(201,168,76,0.35)`,
                  background:   "transparent",
                  color:        "#555",
                  fontSize:     12,
                  cursor:       "pointer",
                  flexShrink:   0,
                  transition:   "all .18s",
                  fontFamily:   "Inter, sans-serif",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = GOLD; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = GOLD; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#555"; e.currentTarget.style.borderColor = "rgba(201,168,76,0.35)"; }}
              >
                {qr}
              </button>
            ))}
          </div>
        )}

        {/* ── Input ── */}
        <div style={{
          background:    "#fff",
          borderTop:     "1px solid #e8e8e8",
          padding:       isMobile
            ? "10px 12px max(10px,env(safe-area-inset-bottom)) 12px"
            : "10px 12px",
          display:       "flex",
          alignItems:    "center",
          gap:           8,
          flexShrink:    0,
        }}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about kitchen design, pricing…"
            style={{
              flex:        1,
              height:      42,
              padding:     "0 16px",
              borderRadius: 21,
              border:      "1.5px solid #e0e0e0",
              fontSize:    14,
              outline:     "none",
              fontFamily:  "Inter, sans-serif",
              color:       "#222",
              background:  "#fafafa",
              transition:  "border-color .2s, box-shadow .2s",
              boxSizing:   "border-box",
              minWidth:    0,
            }}
            onFocus={e => {
              e.target.style.borderColor = GOLD;
              e.target.style.boxShadow   = `0 0 0 3px rgba(201,168,76,0.12)`;
              e.target.style.background  = "#fff";
            }}
            onBlur={e => {
              e.target.style.borderColor = "#e0e0e0";
              e.target.style.boxShadow   = "none";
              e.target.style.background  = "#fafafa";
            }}
          />
          <button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            style={{
              width:        42,
              height:       42,
              borderRadius: "50%",
              border:       "none",
              background:   loading || !input.trim()
                ? "#e8e8e8"
                : `linear-gradient(135deg,${GOLD},${GOLD2})`,
              color:        loading || !input.trim() ? "#bbb" : "#fff",
              fontSize:     17,
              cursor:       loading || !input.trim() ? "not-allowed" : "pointer",
              display:      "flex",
              alignItems:   "center",
              justifyContent: "center",
              flexShrink:   0,
              transition:   "all .2s",
              boxShadow:    !loading && input.trim()
                ? "0 3px 12px rgba(201,168,76,0.45)"
                : "none",
            }}
            aria-label="Send"
          >
            {loading
              ? <span style={{ display: "inline-block", animation: "cw-spin 1s linear infinite" }}>⟳</span>
              : <span style={{ marginLeft: 2 }}>➤</span>
            }
          </button>
        </div>

        {/* ── Footer ── */}
        <div style={{
          background:   "#111",
          padding:      "6px 14px",
          textAlign:    "center",
          flexShrink:   0,
          display:      "flex",
          alignItems:   "center",
          justifyContent: "center",
          gap:          6,
        }}>
          <span style={{ color: "#444", fontSize: 10 }}>Powered by</span>
          <span style={{ color: GOLD, fontSize: 10, fontWeight: 700 }}>Culinova AI</span>
          <span style={{ color: "#333", fontSize: 10 }}>·</span>
          <span style={{ color: "#444", fontSize: 10 }}>OpenAI GPT-4o</span>
        </div>
      </div>

      {/* ═══ FLOATING BUBBLE ═══ */}
      {/* Hidden on mobile while chat is open */}
      {!(isMobile && open) && (
        <div style={{
          position:   "fixed",
          bottom:     isMobile ? 16 : 24,
          right:      isMobile ? 16 : 24,
          zIndex:     9999,
          display:    "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap:        10,
        }}>
          {/* Tooltip */}
          {!open && pulse && (
            <div style={{
              background:   "#111",
              color:        "#fff",
              padding:      "10px 16px",
              borderRadius: 12,
              fontSize:     13,
              fontWeight:   500,
              maxWidth:     210,
              textAlign:    "center",
              border:       "1px solid rgba(201,168,76,0.3)",
              boxShadow:    "0 4px 20px rgba(0,0,0,0.25)",
              animation:    "cw-fadeIn .5s ease",
              lineHeight:   1.5,
            }}>
              <div style={{ color: GOLD, marginBottom: 3, fontSize: 16 }}>💬</div>
              <div>Ask our AI kitchen consultant!</div>
            </div>
          )}

          {/* Bubble button */}
          <button
            onClick={() => setOpen(v => !v)}
            title={open ? "Close" : "Chat with Culinova AI"}
            style={{
              width:        58,
              height:       58,
              borderRadius: "50%",
              border:       "none",
              background:   open
                ? "linear-gradient(135deg,#3a3a3a,#555)"
                : `linear-gradient(135deg,${GOLD},${GOLD2})`,
              boxShadow:    open
                ? "0 4px 16px rgba(0,0,0,0.3)"
                : `0 4px 20px rgba(201,168,76,0.55)`,
              cursor:       "pointer",
              fontSize:     24,
              display:      "flex",
              alignItems:   "center",
              justifyContent: "center",
              transition:   "all .25s",
              animation:    pulse && !open ? "cw-pulse 2.5s infinite" : "none",
              color:        "#fff",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.08)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
          >
            {open ? "✕" : "💬"}
          </button>
        </div>
      )}

      {/* ═══ KEYFRAMES ═══ */}
      <style>{`
        @keyframes cw-bounce {
          0%, 60%, 100% { transform: translateY(0);    opacity: .5; }
          30%            { transform: translateY(-6px); opacity: 1;  }
        }
        @keyframes cw-fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        @keyframes cw-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes cw-pulse {
          0%, 100% { box-shadow: 0 4px 20px rgba(201,168,76,.55); }
          50%       { box-shadow: 0 4px 32px rgba(201,168,76,.85); transform: scale(1.06); }
        }
        /* Scrollbar inside chat */
        .cw-messages::-webkit-scrollbar { width: 4px; }
        .cw-messages::-webkit-scrollbar-track { background: transparent; }
        .cw-messages::-webkit-scrollbar-thumb { background: rgba(201,168,76,.35); border-radius: 4px; }
      `}</style>
    </>
  );
}
