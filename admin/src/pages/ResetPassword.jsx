import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const API_URL = `${import.meta.env.VITE_API_URL || ""}/api`;
      await fetch(`${API_URL}/admin/reset-password-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setStatus("sent");
    } catch {
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const API_URL = `${import.meta.env.VITE_API_URL || ""}/api`;
      const res = await fetch(`${API_URL}/admin/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      if (res.ok) {
        setStatus("reset_done");
      } else {
        setStatus("invalid_token");
      }
    } catch {
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(135deg, #0a0a0a, #1a1a1a)", padding: 20,
      }}
    >
      <div
        style={{
          background: "#fff", borderRadius: 20, padding: "48px 44px",
          width: "100%", maxWidth: 440, boxShadow: "0 30px 80px rgba(0,0,0,0.4)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              fontFamily: "'Playfair Display', serif", fontSize: 32,
              fontWeight: 700, color: "#C9A84C", letterSpacing: 3,
            }}
          >
            CULINOVA
          </div>
          <div
            style={{
              width: 50, height: 3,
              background: "linear-gradient(90deg, #C9A84C, #a07830)",
              margin: "12px auto 0",
            }}
          />
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
          {token ? "Set New Password" : "Reset Password"}
        </h2>
        <p style={{ fontSize: 14, color: "#888", marginBottom: 28 }}>
          {token
            ? "Enter your new password below."
            : "We'll send a reset link to your email."}
        </p>

        {status === "sent" && (
          <div
            style={{
              background: "rgba(39,174,96,0.1)", border: "1px solid rgba(39,174,96,0.3)",
              borderRadius: 8, padding: 16, color: "#27ae60", marginBottom: 20, fontSize: 14,
            }}
          >
            ✅ Reset link sent! Check your email inbox.
          </div>
        )}
        {status === "reset_done" && (
          <div
            style={{
              background: "rgba(39,174,96,0.1)", border: "1px solid rgba(39,174,96,0.3)",
              borderRadius: 8, padding: 16, color: "#27ae60", marginBottom: 20, fontSize: 14,
            }}
          >
            ✅ Password reset successfully!{" "}
            <Link to="/login" style={{ color: "#C9A84C", fontWeight: 600 }}>
              Login now →
            </Link>
          </div>
        )}
        {(status === "error" || status === "invalid_token") && (
          <div
            style={{
              background: "rgba(231,76,60,0.1)", border: "1px solid rgba(231,76,60,0.3)",
              borderRadius: 8, padding: 16, color: "#e74c3c", marginBottom: 20, fontSize: 14,
            }}
          >
            ⚠️ {status === "invalid_token" ? "Invalid or expired token." : "Something went wrong."}
          </div>
        )}

        {!token ? (
          <form onSubmit={handleRequest}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className="form-input"
                type="email"
                placeholder="admin@culinova.sa"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || status === "sent"}
              className="btn btn-primary"
              style={{ width: "100%", padding: "13px", fontSize: 15 }}
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset}>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: "100%", padding: "13px", fontSize: 15 }}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <Link to="/login" style={{ fontSize: 13, color: "#C9A84C", fontWeight: 500 }}>
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
