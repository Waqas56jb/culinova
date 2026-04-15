import React, { useEffect, useState } from "react";
import { apiGet } from "../lib/api.js";

const GOLD = "#C9A84C";

function useIsMobile(bp = 768) {
  const [m, setM] = useState(typeof window !== "undefined" ? window.innerWidth <= bp : false);
  useEffect(() => {
    const fn = () => setM(window.innerWidth <= bp);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, [bp]);
  return m;
}

export default function ChatHistory() {
  const [sessions, setSessions]         = useState([]);
  const [total, setTotal]               = useState(0);
  const [page, setPage]                 = useState(1);
  const [loading, setLoading]           = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [messages, setMessages]         = useState([]);
  const [msgLoading, setMsgLoading]     = useState(false);
  const isMobile = useIsMobile();
  /* On mobile: show messages panel when a session is selected */
  const showMessages = isMobile ? !!selectedSession : true;

  useEffect(() => {
    setLoading(true);
    apiGet(`/admin/sessions?page=${page}&limit=20`)
      .then(d => { setSessions(d.sessions); setTotal(d.total); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page]);

  const viewMessages = async (session) => {
    setSelectedSession(session);
    setMsgLoading(true);
    try {
      const data = await apiGet(`/admin/sessions/${session.session_id}/messages`);
      setMessages(data.messages);
    } catch {
      setMessages([]);
    } finally {
      setMsgLoading(false);
    }
  };

  const panelH = isMobile ? "calc(100dvh - 130px)" : "calc(100vh - 140px)";

  return (
    <div className="fade-in">
      {/* Mobile: messages view */}
      {isMobile && showMessages && selectedSession && (
        <div style={{ display: "flex", flexDirection: "column", height: panelH }}>
          <div className="card" style={{ padding: "12px 16px", marginBottom: 10, display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => setSelectedSession(null)} style={{ background: "transparent", border: "none", fontSize: 20, cursor: "pointer", color: "#555", lineHeight: 1, padding: 0 }}>←</button>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700 }}>Session #{selectedSession.id}</h3>
              <p style={{ fontSize: 11, color: "#888" }}>
                {new Date(selectedSession.started_at).toLocaleString("en-SA")} · {messages.length} msgs
              </p>
            </div>
            {selectedSession.lead_captured && (
              <span style={{ background: "rgba(39,174,96,0.1)", color: "#27ae60", padding: "4px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600 }}>✅ Lead</span>
            )}
          </div>
          <div className="card" style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            {msgLoading ? (
              <div style={{ textAlign: "center", padding: 40 }}>Loading messages...</div>
            ) : messages.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: "#888" }}>No messages</div>
            ) : messages.map(msg => (
              <div key={msg.id} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                {msg.role === "assistant" && (
                  <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, background: `linear-gradient(135deg,${GOLD},#a07830)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, marginRight: 8, marginTop: 4 }}>🍽️</div>
                )}
                <div style={{ maxWidth: "80%" }}>
                  <div style={{ padding: "9px 13px", borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px", background: msg.role === "user" ? `linear-gradient(135deg,${GOLD},#a07830)` : "#f5f5f5", color: msg.role === "user" ? "#fff" : "#333", fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    {msg.content}
                  </div>
                  <div style={{ fontSize: 10, color: "#aaa", marginTop: 3, textAlign: msg.role === "user" ? "right" : "left" }}>
                    {new Date(msg.created_at).toLocaleTimeString("en-SA", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sessions list (hidden on mobile when viewing messages) */}
      {(!isMobile || !showMessages || !selectedSession) && (
        <div style={{ display: "flex", gap: 20, height: isMobile ? "auto" : panelH }}>
          {/* Sessions panel */}
          <div style={{ width: isMobile ? "100%" : 360, flexShrink: 0, display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="card" style={{ padding: "14px 18px" }}>
              <h3 style={{ fontSize: 15, fontWeight: 700 }}>Chat Sessions</h3>
              <p style={{ fontSize: 12, color: "#888" }}>{total} total sessions</p>
            </div>
            <div style={{ flex: 1, overflowY: isMobile ? "visible" : "auto", display: "flex", flexDirection: "column", gap: 8 }}>
              {loading ? (
                <div style={{ textAlign: "center", padding: 40 }}>Loading...</div>
              ) : sessions.map(session => (
                <div
                  key={session.session_id}
                  onClick={() => viewMessages(session)}
                  className="card"
                  style={{ padding: "13px 15px", cursor: "pointer", border: selectedSession?.session_id === session.session_id ? `2px solid ${GOLD}` : "1px solid #eee", transition: "all .2s" }}
                  onMouseEnter={e => { if (!selectedSession || selectedSession.session_id !== session.session_id) e.currentTarget.style.borderColor = "rgba(201,168,76,0.4)"; }}
                  onMouseLeave={e => { if (!selectedSession || selectedSession.session_id !== session.session_id) e.currentTarget.style.borderColor = "#eee"; }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "#111" }}>Session #{session.id}</div>
                      <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
                        {new Date(session.started_at).toLocaleString("en-SA", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, background: session.lead_captured ? "rgba(39,174,96,0.1)" : "rgba(136,136,136,0.1)", color: session.lead_captured ? "#27ae60" : "#888", padding: "2px 8px", borderRadius: 10 }}>
                        {session.lead_captured ? "✅ Lead" : "👤 Visitor"}
                      </span>
                      <span style={{ fontSize: 11, color: "#888" }}>💬 {session.actual_messages || session.message_count} msgs</span>
                    </div>
                  </div>
                  {session.time_spent_seconds > 0 && (
                    <div style={{ fontSize: 11, color: "#888", marginTop: 5 }}>
                      ⏱ {Math.floor(session.time_spent_seconds / 60)}m {session.time_spent_seconds % 60}s
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", paddingTop: 4 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
              <span style={{ padding: "6px 12px", fontSize: 13, color: "#888" }}>Page {page}</span>
              <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => p + 1)} disabled={sessions.length < 20}>Next →</button>
            </div>
          </div>

          {/* Messages panel (desktop only) */}
          {!isMobile && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              {!selectedSession ? (
                <div className="card" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
                  <div style={{ fontSize: 48 }}>💬</div>
                  <p style={{ color: "#888", fontSize: 15 }}>Select a session to view messages</p>
                </div>
              ) : (
                <>
                  <div className="card" style={{ padding: "14px 18px", marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <h3 style={{ fontSize: 15, fontWeight: 700 }}>Session #{selectedSession.id}</h3>
                        <p style={{ fontSize: 12, color: "#888" }}>Started: {new Date(selectedSession.started_at).toLocaleString("en-SA")} · {messages.length} msgs</p>
                      </div>
                      {selectedSession.lead_captured && (
                        <span style={{ background: "rgba(39,174,96,0.1)", color: "#27ae60", padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600, border: "1px solid rgba(39,174,96,0.2)" }}>✅ Lead Captured</span>
                      )}
                    </div>
                  </div>
                  <div className="card" style={{ flex: 1, overflowY: "auto", padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
                    {msgLoading ? (
                      <div style={{ textAlign: "center", padding: 40 }}>Loading messages...</div>
                    ) : messages.length === 0 ? (
                      <div style={{ textAlign: "center", padding: 40, color: "#888" }}>No messages</div>
                    ) : messages.map(msg => (
                      <div key={msg.id} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                        {msg.role === "assistant" && (
                          <div style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, background: `linear-gradient(135deg,${GOLD},#a07830)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, marginRight: 8, marginTop: 4 }}>🍽️</div>
                        )}
                        <div style={{ maxWidth: "70%" }}>
                          <div style={{ padding: "10px 14px", borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: msg.role === "user" ? `linear-gradient(135deg,${GOLD},#a07830)` : "#f5f5f5", color: msg.role === "user" ? "#fff" : "#333", fontSize: 14, lineHeight: 1.65, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                            {msg.content}
                          </div>
                          <div style={{ fontSize: 11, color: "#aaa", marginTop: 4, textAlign: msg.role === "user" ? "right" : "left" }}>
                            {new Date(msg.created_at).toLocaleTimeString("en-SA", { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
