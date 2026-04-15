import React, { useEffect, useState } from "react";
import { apiGet, apiPost, apiPatch, apiDelete } from "../lib/api.js";

const GOLD = "#C9A84C";
const CATEGORIES = ["general", "company", "services", "contact", "pricing", "process", "equipment", "faq"];

export default function KnowledgeBase() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'add' | {entry}
  const [form, setForm] = useState({ title: "", content: "", category: "general" });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetch = () => {
    setLoading(true);
    apiGet("/admin/knowledge-base")
      .then((d) => setEntries(d.entries))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const openAdd = () => {
    setForm({ title: "", content: "", category: "general" });
    setModal("add");
  };

  const openEdit = (entry) => {
    setForm({ title: entry.title, content: entry.content, category: entry.category });
    setModal(entry);
  };

  const save = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      alert("Title and content are required");
      return;
    }
    setSaving(true);
    try {
      if (modal === "add") {
        await apiPost("/admin/knowledge-base", form);
      } else {
        await apiPatch(`/admin/knowledge-base/${modal.id}`, form);
      }
      setModal(null);
      fetch();
    } catch (e) {
      alert("Save failed: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (entry) => {
    try {
      await apiPatch(`/admin/knowledge-base/${entry.id}`, { is_active: !entry.is_active });
      fetch();
    } catch {
      alert("Failed to update");
    }
  };

  const deleteEntry = async (id) => {
    try {
      await apiDelete(`/admin/knowledge-base/${id}`);
      setDeleteConfirm(null);
      fetch();
    } catch {
      alert("Delete failed");
    }
  };

  const catColors = {
    general: "#888", company: GOLD, services: "#3498db", contact: "#27ae60",
    pricing: "#e74c3c", process: "#9b59b6", equipment: "#f39c12", faq: "#e67e22",
  };

  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>Knowledge Base</h2>
          <p style={{ fontSize: 13, color: "#888" }}>
            {entries.filter((e) => e.is_active).length} active entries — AI uses these to answer questions
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          + Add Entry
        </button>
      </div>

      {/* Info Banner */}
      <div
        style={{
          background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)",
          borderRadius: 10, padding: "14px 20px", marginBottom: 20,
          display: "flex", alignItems: "center", gap: 12,
        }}
      >
        <span style={{ fontSize: 20 }}>💡</span>
        <p style={{ fontSize: 13, color: "#555", lineHeight: 1.6 }}>
          The AI chatbot automatically uses <strong>all active entries</strong> as additional context. 
          Add company-specific information, FAQs, pricing, and policies here to improve AI responses.
          Toggle entries on/off without deleting them.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60 }}>Loading...</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="card"
              style={{
                opacity: entry.is_active ? 1 : 0.5,
                borderLeft: `3px solid ${catColors[entry.category] || "#888"}`,
                transition: "opacity .2s",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <span
                    style={{
                      fontSize: 11, fontWeight: 600, letterSpacing: 1,
                      textTransform: "uppercase", color: catColors[entry.category] || "#888",
                    }}
                  >
                    {entry.category}
                  </span>
                  <h4 style={{ fontSize: 15, fontWeight: 700, marginTop: 4, color: "#111" }}>
                    {entry.title}
                  </h4>
                </div>
                <div
                  onClick={() => toggleActive(entry)}
                  style={{
                    width: 40, height: 22, borderRadius: 11, cursor: "pointer",
                    background: entry.is_active ? GOLD : "#ddd",
                    position: "relative", transition: "background .2s",
                    flexShrink: 0, marginLeft: 12,
                  }}
                >
                  <div
                    style={{
                      position: "absolute", top: 3,
                      left: entry.is_active ? 20 : 3,
                      width: 16, height: 16, borderRadius: "50%",
                      background: "#fff", transition: "left .2s",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                    }}
                  />
                </div>
              </div>

              <p
                style={{
                  fontSize: 13, color: "#666", lineHeight: 1.6, marginBottom: 16,
                  display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {entry.content}
              </p>

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button className="btn btn-secondary btn-sm" onClick={() => openEdit(entry)}>
                  ✏️ Edit
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(entry.id)}>
                  🗑️
                </button>
              </div>

              <div style={{ fontSize: 11, color: "#aaa", marginTop: 10 }}>
                Updated: {new Date(entry.updated_at).toLocaleDateString("en-SA")}
              </div>
            </div>
          ))}

          {entries.length === 0 && (
            <div
              style={{
                gridColumn: "1/-1", textAlign: "center", padding: 60,
                color: "#aaa",
              }}
            >
              <p style={{ fontSize: 40, marginBottom: 16 }}>📚</p>
              <p>No knowledge base entries yet. Add your first entry!</p>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {modal !== null && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1000, padding: 20,
          }}
          onClick={(e) => e.target === e.currentTarget && setModal(null)}
        >
          <div
            style={{
              background: "#fff", borderRadius: 16, padding: "28px 32px",
              width: "100%", maxWidth: 560,
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
              maxHeight: "90vh", overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>
                {modal === "add" ? "Add Knowledge Base Entry" : "Edit Entry"}
              </h3>
              <button onClick={() => setModal(null)} style={{ background: "none", fontSize: 20, color: "#888" }}>✕</button>
            </div>

            <div className="form-group">
              <label className="form-label">Title *</label>
              <input
                className="form-input"
                placeholder="e.g., Equipment Price Ranges"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Content *</label>
              <textarea
                className="form-input"
                rows={8}
                placeholder="Enter the knowledge base content here. The AI will use this to answer user questions..."
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                style={{ resize: "vertical" }}
              />
              <p style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>
                {form.content.length} characters — Be specific and detailed for better AI responses
              </p>
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? "Saving..." : modal === "add" ? "Add Entry" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1000, padding: 20,
          }}
        >
          <div style={{ background: "#fff", borderRadius: 12, padding: "28px 32px", maxWidth: 400, width: "100%" }}>
            <h3 style={{ marginBottom: 16 }}>Delete Entry</h3>
            <p style={{ color: "#555", marginBottom: 24 }}>Are you sure? This cannot be undone.</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button
                className="btn"
                style={{ background: "#e74c3c", color: "#fff" }}
                onClick={() => deleteEntry(deleteConfirm)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
