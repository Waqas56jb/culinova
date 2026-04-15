-- ============================================================
-- Culinova AI Chatbot — Vercel Postgres Database Tables
-- Run these in your Vercel Postgres console or psql
-- ============================================================

-- 1. Admins Table
CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  reset_token VARCHAR(255),
  reset_token_expires TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Leads Table
CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255),
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  company VARCHAR(255),
  location VARCHAR(255),
  project_type VARCHAR(100),
  project_size VARCHAR(100),
  budget VARCHAR(100),
  timeline VARCHAR(100),
  quality_preference VARCHAR(50),
  message TEXT,
  lead_score VARCHAR(20) DEFAULT 'cold',   -- hot / warm / cold
  status VARCHAR(50) DEFAULT 'new',         -- new / contacted / qualified / closed
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Chat Sessions Table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) UNIQUE NOT NULL,
  visitor_ip VARCHAR(100),
  user_agent TEXT,
  language VARCHAR(10) DEFAULT 'en',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ DEFAULT NOW(),
  message_count INTEGER DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,
  lead_captured BOOLEAN DEFAULT FALSE,
  country VARCHAR(100) DEFAULT 'Saudi Arabia'
);

-- 4. Chat Messages Table (stores last 20 per session for memory)
CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL,     -- 'user' or 'assistant'
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Knowledge Base Table (admin-editable AI context)
CREATE TABLE IF NOT EXISTS knowledge_base (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100) DEFAULT 'general',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Visitor Analytics Table
CREATE TABLE IF NOT EXISTS visitor_analytics (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255),
  event_type VARCHAR(100),   -- chat_opened / message_sent / lead_captured
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes for performance ──────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(lead_score);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_started ON chat_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_analytics_event ON visitor_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_session ON visitor_analytics(session_id);

-- ── Default Admin (password: Culinova@2024) ──────────────────
-- The server.js auto-creates this on first run.
-- To manually insert: bcrypt hash of "Culinova@2024"
-- INSERT INTO admins (username, email, password_hash)
-- VALUES ('admin', 'admin@culinova.sa', '$2b$12$...');

-- ── Default Knowledge Base ────────────────────────────────────
-- Auto-inserted by server.js on first run.
