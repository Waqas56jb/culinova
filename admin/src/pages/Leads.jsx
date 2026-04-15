import React, { useEffect, useState, useCallback } from "react";
import { apiGet, apiPatch, apiDelete } from "../lib/api.js";

const GOLD = "#C9A84C";

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ score: "", status: "", search: "" });
  const [selected, setSelected] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const LIMIT = 20;

  const fetchLeads = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page, limit: LIMIT,
      ...(filter.score && { score: filter.score }),
      ...(filter.status && { status: filter.status }),
      ...(filter.search && { search: filter.search }),
    });
    apiGet(`/admin/leads?${params}`)
      .then((d) => { setLeads(d.leads); setTotal(d.total); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, filter]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const openEdit = (lead) => {
    setSelected(lead);
    setEditForm({
      name: lead.name || "",
      phone: lead.phone || "",
      email: lead.email || "",
      status: lead.status || "new",
      lead_score: lead.lead_score || "cold",
      notes: lead.notes || "",
    });
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      await apiPatch(`/admin/leads/${selected.id}`, editForm);
      setSelected(null);
      fetchLeads();
    } catch (e) {
      alert("Save failed: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteLead = async (id) => {
    try {
      await apiDelete(`/admin/leads/${id}`);
      setDeleteConfirm(null);
      fetchLeads();
    } catch (e) {
      alert("Delete failed: " + e.message);
    }
  };

  const exportCSV = () => {
    const token = localStorage.getItem("culinova_admin_token");
    window.open(`/api/admin/leads/export?token=${token}`, "_blank");
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="fade-in">
      {/* Header */}
      <div
        style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: 24, flexWrap: "wrap", gap: 12,
        }}
      >
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>Leads Management</h2>
          <p style={{ fontSize: 13, color: "#888" }}>{total} total leads captured</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={exportCSV}>
          📥 Export CSV
        </button>
      </div>

      {/* Filters */}
      <div
        className="card"
        style={{
          display: "flex", gap: 14, flexWrap: "wrap",
          alignItems: "center", marginBottom: 20, padding: "16px 20px",
        }}
      >
        <input
          className="form-input"
          placeholder="🔍 Search name, phone, email..."
          value={filter.search}
          onChange={(e) => setFilter({ ...filter, search: e.target.value })}
          style={{ maxWidth: 280 }}
        />
        <select
          className="form-input"
          value={filter.score}
          onChange={(e) => setFilter({ ...filter, score: e.target.value })}
          style={{ maxWidth: 160 }}
        >
          <option value="">All Scores</option>
          <option value="hot">🔥 Hot</option>
          <option value="warm">⚡ Warm</option>
          <option value="cold">❄️ Cold</option>
        </select>
        <select
          className="form-input"
          value={filter.status}
          onChange={(e) => setFilter({ ...filter, status: e.target.value })}
          style={{ maxWidth: 160 }}
        >
          <option value="">All Status</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="qualified">Qualified</option>
          <option value="closed">Closed</option>
        </select>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => { setFilter({ score: "", status: "", search: "" }); setPage(1); }}
        >
          Reset
        </button>
      </div>

      {/* Score Summary */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { label: "🔥 Hot", score: "hot", color: "#e74c3c" },
          { label: "⚡ Warm", score: "warm", color: "#f39c12" },
          { label: "❄️ Cold", score: "cold", color: "#3498db" },
        ].map((s) => (
          <button
            key={s.score}
            onClick={() => setFilter({ ...filter, score: filter.score === s.score ? "" : s.score })}
            style={{
              padding: "8px 18px", borderRadius: 20, cursor: "pointer",
              background: filter.score === s.score ? s.color : `${s.color}15`,
              color: filter.score === s.score ? "#fff" : s.color,
              border: `1px solid ${s.color}40`,
              fontSize: 13, fontWeight: 600, transition: "all .2s",
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #eee", borderTopColor: GOLD, margin: "0 auto", animation: "spin 1s linear infinite" }} />
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Project</th>
                  <th>Budget</th>
                  <th>Location</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: "center", padding: 60, color: "#aaa" }}>
                      No leads found
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => (
                    <tr key={lead.id}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{lead.name || "—"}</div>
                        {lead.company && <div style={{ fontSize: 12, color: "#888" }}>{lead.company}</div>}
                      </td>
                      <td>
                        <div style={{ fontSize: 13 }}>{lead.phone || "—"}</div>
                        {lead.email && <div style={{ fontSize: 12, color: "#888" }}>{lead.email}</div>}
                      </td>
                      <td style={{ fontSize: 13 }}>{lead.project_type || "—"}</td>
                      <td style={{ fontSize: 13 }}>{lead.budget || "—"}</td>
                      <td style={{ fontSize: 13 }}>{lead.location || "—"}</td>
                      <td>
                        <span className={`badge badge-${lead.lead_score}`}>
                          {lead.lead_score === "hot" ? "🔥" : lead.lead_score === "warm" ? "⚡" : "❄️"}
                          {" "}{lead.lead_score}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${lead.status || "new"}`}>
                          {lead.status || "new"}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: "#888" }}>
                        {new Date(lead.created_at).toLocaleDateString("en-SA")}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => openEdit(lead)}
                          >
                            ✏️
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => setDeleteConfirm(lead.id)}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            style={{
              display: "flex", justifyContent: "center", alignItems: "center",
              gap: 8, padding: 20, borderTop: "1px solid #eee",
            }}
          >
            <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>←</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = page <= 3 ? i + 1 : page - 2 + i;
              if (p > totalPages) return null;
              return (
                <button
                  key={p}
                  className="btn btn-sm"
                  onClick={() => setPage(p)}
                  style={{
                    background: page === p ? GOLD : "#f5f5f5",
                    color: page === p ? "#fff" : "#333",
                    minWidth: 36,
                  }}
                >
                  {p}
                </button>
              );
            })}
            <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>→</button>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {selected && (
        <Modal title={`Edit Lead: ${selected.name || "Unnamed"}`} onClose={() => setSelected(null)}>
          {[
            { key: "name", label: "Name", type: "text" },
            { key: "phone", label: "Phone", type: "text" },
            { key: "email", label: "Email", type: "email" },
          ].map((f) => (
            <div key={f.key} className="form-group">
              <label className="form-label">{f.label}</label>
              <input
                className="form-input"
                type={f.type}
                value={editForm[f.key]}
                onChange={(e) => setEditForm({ ...editForm, [f.key]: e.target.value })}
              />
            </div>
          ))}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Score</label>
              <select
                className="form-input"
                value={editForm.lead_score}
                onChange={(e) => setEditForm({ ...editForm, lead_score: e.target.value })}
              >
                <option value="hot">🔥 Hot</option>
                <option value="warm">⚡ Warm</option>
                <option value="cold">❄️ Cold</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-input"
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea
              className="form-input"
              rows={3}
              value={editForm.notes}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
            />
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <button className="btn btn-secondary" onClick={() => setSelected(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveEdit} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </Modal>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <Modal title="Delete Lead" onClose={() => setDeleteConfirm(null)}>
          <p style={{ color: "#555", marginBottom: 24 }}>
            Are you sure you want to delete this lead? This action cannot be undone.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
            <button
              className="btn"
              style={{ background: "#e74c3c", color: "#fff" }}
              onClick={() => deleteLead(deleteConfirm)}
            >
              Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: 20,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "#fff", borderRadius: 16, padding: "28px 32px",
          width: "100%", maxWidth: 520,
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          animation: "fadeIn .2s ease",
          maxHeight: "90vh", overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700 }}>{title}</h3>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#888" }}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
