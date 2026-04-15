import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../App.jsx";

export default function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const API_URL = `${import.meta.env.VITE_API_URL || ""}/api`;
      const res = await fetch(`${API_URL}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      login(data.token, data.admin);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%)",
        padding: 20, position: "relative", overflow: "hidden",
      }}
    >
      {/* Background decoration */}
      <div
        style={{
          position: "absolute", top: "30%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: 700, height: 700, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          background: "#fff", borderRadius: 20, padding: "48px 44px",
          width: "100%", maxWidth: 440,
          boxShadow: "0 30px 80px rgba(0,0,0,0.4)",
          animation: "fadeIn .5s ease",
          position: "relative",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div
            style={{
              fontFamily: "'Playfair Display', serif", fontSize: 36,
              fontWeight: 700, color: "#C9A84C", letterSpacing: 3,
            }}
          >
            CULINOVA
          </div>
          <p style={{ color: "#888", fontSize: 14, marginTop: 6 }}>
            Admin Portal
          </p>
          <div
            style={{
              width: 50, height: 3, background: "linear-gradient(90deg, #C9A84C, #a07830)",
              margin: "14px auto 0",
            }}
          />
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#111", marginBottom: 6 }}>
          Welcome Back
        </h2>
        <p style={{ fontSize: 14, color: "#888", marginBottom: 28 }}>
          Sign in to your admin dashboard
        </p>

        {error && (
          <div
            style={{
              background: "rgba(231,76,60,0.1)", border: "1px solid rgba(231,76,60,0.3)",
              borderRadius: 8, padding: "12px 16px", color: "#e74c3c",
              fontSize: 14, marginBottom: 20,
            }}
          >
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              className="form-input"
              type="email"
              placeholder="admin@culinova.sa"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div className="form-group" style={{ position: "relative" }}>
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type={showPass ? "text" : "password"}
              placeholder="Enter your password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              style={{ paddingRight: 46 }}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              style={{
                position: "absolute", right: 14, bottom: 11,
                background: "none", border: "none", cursor: "pointer",
                color: "#888", fontSize: 16,
              }}
            >
              {showPass ? "🙈" : "👁"}
            </button>
          </div>

          <div style={{ textAlign: "right", marginBottom: 24, marginTop: -8 }}>
            <Link
              to="/reset-password"
              style={{ fontSize: 13, color: "#C9A84C", fontWeight: 500 }}
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: "100%", padding: "13px", fontSize: 15 }}
          >
            {loading ? "Signing in..." : "Sign In →"}
          </button>
        </form>

        <div
          style={{
            marginTop: 24, padding: "16px", borderRadius: 8,
            background: "#f9f5eb", border: "1px solid rgba(201,168,76,0.2)",
          }}
        >
          <p style={{ fontSize: 12, color: "#888", textAlign: "center" }}>
            <strong>Default credentials:</strong><br />
            admin@culinova.sa / Culinova@2024
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
