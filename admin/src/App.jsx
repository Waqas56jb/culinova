import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import AdminLayout from "./components/AdminLayout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Leads from "./pages/Leads.jsx";
import ChatHistory from "./pages/ChatHistory.jsx";
import Analytics from "./pages/Analytics.jsx";
import KnowledgeBase from "./pages/KnowledgeBase.jsx";
import Settings from "./pages/Settings.jsx";

export const AuthContext = React.createContext(null);

export default function App() {
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem("culinova_admin_token");
    const admin = localStorage.getItem("culinova_admin");
    return token && admin ? { token, admin: JSON.parse(admin) } : null;
  });

  const login = (token, admin) => {
    localStorage.setItem("culinova_admin_token", token);
    localStorage.setItem("culinova_admin", JSON.stringify(admin));
    setAuth({ token, admin });
  };

  const logout = () => {
    localStorage.removeItem("culinova_admin_token");
    localStorage.removeItem("culinova_admin");
    setAuth(null);
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      <Routes>
        <Route path="/login" element={auth ? <Navigate to="/" /> : <Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/*"
          element={
            auth ? (
              <AdminLayout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/leads" element={<Leads />} />
                  <Route path="/chat-history" element={<ChatHistory />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/knowledge-base" element={<KnowledgeBase />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </AdminLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </AuthContext.Provider>
  );
}
