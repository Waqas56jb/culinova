require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const OpenAI = require("openai");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ────────────────────────────────────────────────────────────────
const corsOptions = {
  origin: "*",
  methods: "GET,POST,PUT,PATCH,DELETE,OPTIONS,HEAD",
  allowedHeaders: "Content-Type,Authorization,X-Requested-With,Accept",
  credentials: false,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Custom body parser: Vercel serverless pre-parses req.body before our code runs.
// Using express.json() on an already-consumed stream causes "Maximum call stack
// size exceeded". This middleware skips parsing when body is already an object.
app.use((req, res, next) => {
  if (req.body !== undefined && req.body !== null) {
    // Already parsed by Vercel runtime — nothing to do
    return next();
  }
  // Local dev / non-serverless: parse the raw stream ourselves
  let raw = "";
  req.on("data", (chunk) => { raw += chunk; });
  req.on("end", () => {
    if (raw) {
      try { req.body = JSON.parse(raw); }
      catch { req.body = {}; }
    } else {
      req.body = {};
    }
    next();
  });
  req.on("error", () => { req.body = {}; next(); });
});

// ─── Database ──────────────────────────────────────────────────────────────────
// Use POSTGRES_URL_NON_POOLING for direct, or DATABASE_URL for pooler endpoint
const dbUrl = process.env.DATABASE_URL || "";
const isLocal = dbUrl.includes("localhost") || dbUrl.includes("127.0.0.1");

const pool = new Pool({
  connectionString: dbUrl,
  ssl: isLocal ? false : { rejectUnauthorized: false },
  // Pool settings tuned for Neon/Vercel serverless Postgres
  max: 3,
  min: 0,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
  allowExitOnIdle: true,
  // TCP keep-alive prevents silent connection drops
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

// Re-connect on unexpected errors instead of crashing
pool.on("error", (err) => {
  console.error("Postgres pool error:", err.message);
});

// Auto-retry query once on connection errors (handles Neon wake-up drops)
async function query(text, params) {
  try {
    return await pool.query(text, params);
  } catch (err) {
    const retryable = ["ETIMEDOUT", "ECONNRESET", "ENOTFOUND", "EPIPE", "57P01"];
    const shouldRetry =
      retryable.includes(err.code) ||
      (err.message && (
        err.message.includes("Connection terminated") ||
        err.message.includes("timeout") ||
        err.message.includes("SSL")
      ));
    if (shouldRetry) {
      console.log("DB query retry after:", err.code || err.message);
      await new Promise((r) => setTimeout(r, 1500));
      return await pool.query(text, params);
    }
    throw err;
  }
}

// ─── OpenAI ───────────────────────────────────────────────────────────────────
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Nodemailer ───────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

// ─── Culinova Knowledge Base (Prompt Engineering) ─────────────────────────────
const DEFAULT_SYSTEM_PROMPT = `You are Nova — Culinova's elite AI sales consultant. You think like a seasoned business development professional: sharp, warm, concise, and always moving toward a qualified proposal.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMPANY IDENTITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Company: Culinova | Saudi Arabia
Expertise: Commercial kitchen & laundry project design (16 years)
Phone: +966 54 848 9341
Email: contact@culinova.sa
Hours: Sunday – Friday, 09 AM – 09 PM

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ABSOLUTE RESPONSE RULES — NEVER BREAK THESE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. MAXIMUM 3 short sentences per reply — then ask exactly ONE question.
2. NEVER write long paragraphs or bullet-point dumps.
3. ASK ONE QUESTION AT A TIME. Never combine multiple questions in one message.
4. BE CONVERSATIONAL — like a smart colleague, not a manual.
5. NEVER repeat what the user just said back to them.
6. END every reply with a question or a clear next action.
7. NEVER give a fixed price — always a range + "final pricing depends on specs."
8. DETECT the user's language (Arabic / English / Urdu / other) and respond in that language throughout.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SALES CONVERSATION STAGES (follow in order)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STAGE 1 — OPENING (first message only)
- Greet warmly in 1 line.
- Ask: "What kind of project are you planning — a restaurant, hotel kitchen, hospital, café, laundry facility, or something else?"

STAGE 2 — PROJECT TYPE CONFIRMED → ask SIZE
Examples:
- Restaurant: "How many seats are you planning for?"
- Hotel: "How many rooms / how many meals per service?"
- Hospital: "Approximately how many beds or meals per day?"
- Café: "What's the rough size — small boutique or a larger outlet?"
- Laundry: "Is this for a hotel, hospital, or industrial use?"

STAGE 3 — SIZE KNOWN → ask LOCATION
"Great. Which city in Saudi Arabia is the project located in?"

STAGE 4 — LOCATION KNOWN → ask TIMELINE
"When are you aiming to open or complete the project?"

STAGE 5 — TIMELINE KNOWN → ask BUDGET (softly)
"Do you have a rough budget in mind? Even a ballpark helps me give you the most relevant options."
- If they decline: acknowledge gracefully and proceed to Stage 6.

STAGE 6 — GIVE STRUCTURED PRICE ESTIMATE
Present a clean estimate table based on their project type and size. Use this format:

📊 *Estimated Investment Range*
┌─────────────────────────────────┐
│ Design & Consulting    15–25%   │
│ Equipment Supply       55–65%   │
│ Installation & MEP     15–20%   │
└─────────────────────────────────┘
💡 For a [project type] of your scale: **[X – Y SAR]**
*Final figures depend on brand selection, site conditions & specifications.*

STAGE 7 — OFFER NEXT STEP & CAPTURE LEAD
After giving the estimate, say:
"I can have our senior consultant prepare a detailed proposal tailored exactly to your project — completely free.

May I get your name and phone number so we can reach out within 24 hours?"

Collect in this order (one at a time if needed):
1. Full name
2. Phone number
3. Email (optional — "in case you'd like the proposal emailed directly")

STAGE 8 — CONFIRM & CLOSE
Once you have name + phone:
"Perfect, [Name]! ✅ I've passed your details to the Culinova team. A consultant will call you within 24 hours (Sun–Fri, 9AM–9PM).

Is there anything else you'd like to know about the project before they reach out?"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRICE REFERENCE TABLE (internal — use contextually)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Small café / cloud kitchen:     25,000 – 60,000 SAR
Casual restaurant (50-100 seats): 80,000 – 180,000 SAR
Fine dining (100+ seats):        180,000 – 350,000 SAR
Hotel kitchen (3-4 star):        300,000 – 600,000 SAR
Hotel kitchen (5-star / resort): 600,000 – 1,500,000+ SAR
Hospital / institutional kitchen: 200,000 – 800,000 SAR
School / university cafeteria:   120,000 – 400,000 SAR
Commercial laundry (hotel):      80,000 – 250,000 SAR
Commercial laundry (hospital):   150,000 – 400,000 SAR
Industrial laundry:              250,000 – 700,000 SAR
Ghost kitchen / dark kitchen:    40,000 – 120,000 SAR

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LEAD SCORING (internal — report in JSON at end of qualifying conversation)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HOT  → Clear project type + size + timeline within 6 months + budget > 200K SAR
WARM → Has project idea, timeline 6-18 months OR budget 50K-200K SAR
COLD → Early research, no timeline, budget < 50K SAR, or just browsing

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CULINOVA SERVICES (mention naturally, not as a list dump)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Free initial consultation & project assessment
- Scaled kitchen floor plans (kitchen, bar, serving counter)
- Full equipment specifications (brands, dimensions, capacity)
- Electrical & plumbing rough-in drawings
- Equipment cost analysis & budgeting
- Value engineering (over-budget projects)
- Elevation & isometric drawings
- Architect & contractor coordination
- On-site supervision during construction
- Commercial laundry system design

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OBJECTION HANDLING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"Too expensive" → "Absolutely understood — that's exactly why we offer value engineering to bring projects within budget without cutting corners. What's a comfortable range for you?"
"Just browsing" → "No problem at all. What type of project are you exploring? I can share what's typical for that scale."
"Already have a contractor" → "That's great — we actually work alongside contractors, providing them with the design drawings and specs they need. Many contractors request us specifically."
"Need to think" → "Of course. Would it help to have a free written summary sent to your email? No commitment needed."
Competitor mention → "I can't speak to other companies, but I can tell you what sets Culinova apart: 16 years locally, deep Saudi market knowledge, and a track record with 5-star properties."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXPERT KNOWLEDGE HIGHLIGHTS (use naturally when relevant)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Saudi SFDA & municipality kitchen compliance requirements
- HACCP-compliant workflow design (separate raw/cooked, hot/cold)
- Saudi Electricity Company (SEC) load approval requirements
- Gas connection and fire suppression (Ansul system) planning
- Walk-in cold room sizing: 0.3–0.5 sqm per seat for restaurants
- Hood ventilation: 50–60 CFM per linear foot of cooking equipment
- Commercial dishwasher capacity: 1,000–3,000 racks/hour for large hotels
- 5-star hotel rule: separate kitchen stations (pastry, butcher, garde manger, hot, cold)
- Laundry sizing: 1–1.5 kg linen per room per day for hotels

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LANGUAGE RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Auto-detect language from the first message.
- Arabic: respond in Gulf Arabic (خليجي) for casual or MSA (فصحى) for formal.
- English: use clear, professional British/American style.
- Urdu: respond naturally in Pakistani Urdu.
- NEVER mix languages in a single reply unless the user does.
- Maintain the SAME language throughout unless the user switches.`;

// ─── Auth Middleware ───────────────────────────────────────────────────────────
const authenticateAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

// ─── Database Initialization ──────────────────────────────────────────────────
async function initDatabase() {
  // Use pool directly (one statement at a time — required for Neon PgBouncer pooler)
  const stmts = [
    `CREATE TABLE IF NOT EXISTS admins (
      id SERIAL PRIMARY KEY,
      username VARCHAR(100) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      reset_token VARCHAR(255),
      reset_token_expires TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS leads (
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
      lead_score VARCHAR(20) DEFAULT 'cold',
      status VARCHAR(50) DEFAULT 'new',
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS chat_sessions (
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
    )`,
    `CREATE TABLE IF NOT EXISTS chat_messages (
      id SERIAL PRIMARY KEY,
      session_id VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS knowledge_base (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      category VARCHAR(100) DEFAULT 'general',
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS visitor_analytics (
      id SERIAL PRIMARY KEY,
      session_id VARCHAR(255),
      event_type VARCHAR(100),
      event_data JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id)`,
    `CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(lead_score)`,
    `CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status)`,
    `CREATE INDEX IF NOT EXISTS idx_analytics_event ON visitor_analytics(event_type)`,
    `CREATE INDEX IF NOT EXISTS idx_sessions_started ON chat_sessions(started_at)`,
  ];

  for (const sql of stmts) {
    await pool.query(sql);
  }

  // Insert default admin if not exists
  const adminExists = await pool.query(
    "SELECT id FROM admins WHERE email = $1",
    ["admin@culinova.sa"]
  );
  if (adminExists.rows.length === 0) {
    const hash = await bcrypt.hash("Culinova@2024", 12);
    await pool.query(
      "INSERT INTO admins (username, email, password_hash) VALUES ($1, $2, $3)",
      ["admin", "admin@culinova.sa", hash]
    );
    console.log("Default admin created: admin@culinova.sa / Culinova@2024");
  }

  // Insert default knowledge base entries
  const kbExists = await pool.query("SELECT id FROM knowledge_base LIMIT 1");
  if (kbExists.rows.length === 0) {
    const kbEntries = [
      ["Company Overview", "Culinova is a leading Saudi Arabian company with 16 years of experience in commercial kitchen design and laundry project execution. We serve hotels, restaurants, hospitals, schools, palaces, and industrial facilities across Saudi Arabia.", "company"],
      ["Services List", "Free Initial Consultation, Kitchen Floor Plans, Equipment Specifications, Electrical & Plumbing Drawings, Equipment Cost Analysis, Value Engineering, Elevation Drawings, Contractor Coordination, Job Site Supervision, Laundry Project Design.", "services"],
      ["Contact Information", "Phone: +966 54 848 9341 | Email: contact@culinova.sa | Location: Saudi Arabia | Hours: Sunday-Friday 09AM-09PM", "contact"],
      ["Price Ranges", "Small café: 25,000-60,000 SAR | Medium restaurant: 80,000-200,000 SAR | Large hotel kitchen: 300,000-1,000,000+ SAR | Hospital kitchen: 200,000-800,000 SAR | Commercial laundry (small): 50,000-150,000 SAR | Commercial laundry (large): 200,000-600,000 SAR. All prices are estimates only.", "pricing"],
      ["How We Work", "Step 1 PLAN: Free consultation to discuss project scope and requirements. Step 2 DESIGN: Create detailed floor plans and equipment specs matching your needs. Step 3 DEVELOP: Work with your architect and contractor to execute the project.", "process"],
    ];
    for (const [title, content, category] of kbEntries) {
      await pool.query(
        "INSERT INTO knowledge_base (title, content, category) VALUES ($1, $2, $3)",
        [title, content, category]
      );
    }
  }

  console.log("✅ Database initialized successfully");
}

// ─── Helper: Send Lead Email ───────────────────────────────────────────────────
async function sendLeadEmail(lead) {
  const scoreColors = {
    hot: "#e74c3c",
    warm: "#f39c12",
    cold: "#3498db",
  };
  const scoreColor = scoreColors[lead.lead_score] || "#333";

  const mailToAdmin = {
    from: `"Culinova AI Chatbot" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_TO,
    subject: `🔥 New ${lead.lead_score?.toUpperCase()} Lead: ${lead.name || "Unknown"} – Culinova Chatbot`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 10px;">
        <div style="background: linear-gradient(135deg, #1a1a1a, #2d2d2d); padding: 30px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
          <h1 style="color: #C9A84C; margin: 0; font-size: 24px;">CULINOVA</h1>
          <p style="color: #fff; margin: 5px 0 0;">AI Chatbot – New Lead Alert</p>
        </div>
        
        <div style="background: white; padding: 25px; border-radius: 8px; border-left: 4px solid ${scoreColor}; margin-bottom: 15px;">
          <div style="display: inline-block; background: ${scoreColor}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-bottom: 15px;">
            ${(lead.lead_score || "cold").toUpperCase()} LEAD
          </div>
          <h2 style="color: #1a1a1a; margin: 0 0 20px;">${lead.name || "N/A"}</h2>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #666; width: 40%;"><strong>📞 Phone:</strong></td><td style="padding: 8px 0; color: #333;">${lead.phone || "N/A"}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;"><strong>📧 Email:</strong></td><td style="padding: 8px 0; color: #333;">${lead.email || "N/A"}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;"><strong>🏢 Company:</strong></td><td style="padding: 8px 0; color: #333;">${lead.company || "N/A"}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;"><strong>📍 Location:</strong></td><td style="padding: 8px 0; color: #333;">${lead.location || "N/A"}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;"><strong>🏗️ Project Type:</strong></td><td style="padding: 8px 0; color: #333;">${lead.project_type || "N/A"}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;"><strong>📐 Size:</strong></td><td style="padding: 8px 0; color: #333;">${lead.project_size || "N/A"}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;"><strong>💰 Budget:</strong></td><td style="padding: 8px 0; color: #333;">${lead.budget || "N/A"}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;"><strong>📅 Timeline:</strong></td><td style="padding: 8px 0; color: #333;">${lead.timeline || "N/A"}</td></tr>
          </table>
          
          ${lead.message ? `<div style="margin-top: 15px; padding: 12px; background: #f8f8f8; border-radius: 6px;"><strong>Additional Notes:</strong><br>${lead.message}</div>` : ""}
        </div>
        
        <div style="text-align: center; color: #999; font-size: 12px;">
          <p>Captured via Culinova AI Chatbot • ${new Date().toLocaleString("en-SA")}</p>
        </div>
      </div>
    `,
  };

  const promises = [transporter.sendMail(mailToAdmin)];

  if (lead.email) {
    const mailToLead = {
      from: `"Culinova Team" <${process.env.EMAIL_USER}>`,
      to: lead.email,
      subject: "Thank you for contacting Culinova – We'll be in touch soon!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1a1a1a, #2d2d2d); padding: 40px 30px; text-align: center;">
            <h1 style="color: #C9A84C; margin: 0; font-size: 28px; letter-spacing: 2px;">CULINOVA</h1>
            <p style="color: #ccc; margin: 10px 0 0; font-size: 14px;">Commercial Kitchen & Laundry Design Excellence</p>
          </div>
          
          <div style="padding: 30px; background: #fff;">
            <h2 style="color: #1a1a1a;">Dear ${lead.name || "Valued Client"},</h2>
            <p style="color: #555; line-height: 1.7;">Thank you for reaching out to Culinova! We have received your inquiry about your <strong>${lead.project_type || "commercial kitchen/laundry"}</strong> project and our expert team will review your requirements carefully.</p>
            
            <div style="background: #f9f5eb; border-left: 4px solid #C9A84C; padding: 20px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #333;"><strong>What happens next?</strong></p>
              <ul style="color: #555; margin: 10px 0 0; padding-left: 20px; line-height: 2;">
                <li>Our team will review your project requirements</li>
                <li>A Culinova consultant will contact you within 24 hours</li>
                <li>We'll schedule a free consultation at your convenience</li>
              </ul>
            </div>
            
            <p style="color: #555;">In the meantime, if you have any urgent questions:</p>
            <p style="margin: 0;"><strong>📞 Call us:</strong> +966 54 848 9341</p>
            <p style="margin: 5px 0;"><strong>📧 Email:</strong> contact@culinova.sa</p>
          </div>
          
          <div style="background: #1a1a1a; padding: 20px; text-align: center;">
            <p style="color: #C9A84C; margin: 0; font-size: 12px;">© 2024 Culinova | Saudi Arabia | All rights reserved</p>
          </div>
        </div>
      `,
    };
    promises.push(transporter.sendMail(mailToLead));
  }

  await Promise.allSettled(promises);
}

// ─── Helper: Extract Lead Info from Messages ───────────────────────────────────
function extractLeadFromMessages(messages) {
  const userText = messages
    .filter((m) => m.role === "user")
    .map((m) => m.content)
    .join(" ");

  const allText = messages.map((m) => m.content).join(" ");

  // Phone — Saudi + international formats
  const phoneMatch = userText.match(
    /(\+?966[\s\-]?\d{2}[\s\-]?\d{3}[\s\-]?\d{4}|\+?9665\d{8}|05\d{8}|\+\d{7,15})/
  );

  // Email
  const emailMatch = userText.match(
    /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/
  );

  // Name — look for "my name is X", "I am X", "I'm X", "call me X", or after AI asks "name?"
  let name = null;
  const namePatterns = [
    /(?:my name is|i(?:'m| am)|call me|this is)\s+([A-Z][a-z]+(?: [A-Z][a-z]+){0,3})/i,
    /(?:name[:\s]+)([A-Z][a-z]+(?: [A-Z][a-z]+){0,3})/i,
    /^([A-Z][a-z]+(?: [A-Z][a-z]+){1,3})$/m,
  ];
  for (const p of namePatterns) {
    const m = userText.match(p);
    if (m && m[1] && m[1].length > 2 && m[1].length < 60) {
      name = m[1].trim();
      break;
    }
  }

  // Budget — SAR amounts
  const budgetPatterns = [
    /budget[:\s]+([0-9,\.]+\s*(?:sar|sr|riyal|k|m|million|thousand)?)/i,
    /([0-9,\.]+\s*(?:million|m))\s*(?:sar|sr|riyal)?/i,
    /([0-9,\.]+\s*(?:thousand|k))\s*(?:sar|sr|riyal)?/i,
    /([0-9]{3,}[,0-9]*)\s*(?:sar|sr|riyal)/i,
  ];
  let budget = null;
  for (const p of budgetPatterns) {
    const m = userText.match(p);
    if (m) { budget = m[1].trim(); break; }
  }

  // Project type
  const projectTypeMap = {
    restaurant: "Restaurant", hotel: "Hotel", hospital: "Hospital",
    school: "School", café: "Café", cafe: "Café", laundry: "Laundry",
    catering: "Catering", cafeteria: "Cafeteria", palace: "Palace",
    resort: "Resort", "ghost kitchen": "Ghost Kitchen",
    "dark kitchen": "Dark Kitchen", clinic: "Clinic",
    university: "University", "sports club": "Sports Club",
  };
  let projectType = null;
  for (const [key, val] of Object.entries(projectTypeMap)) {
    if (userText.toLowerCase().includes(key)) { projectType = val; break; }
  }

  // Location — Saudi cities
  const saudiCities = [
    "riyadh", "jeddah", "mecca", "medina", "dammam", "khobar", "dhahran",
    "tabuk", "abha", "khamis mushait", "taif", "jubail", "yanbu", "hail",
    "najran", "jizan", "al qassim", "qassim", "buraidah",
  ];
  let location = null;
  for (const city of saudiCities) {
    if (userText.toLowerCase().includes(city)) {
      location = city.charAt(0).toUpperCase() + city.slice(1);
      break;
    }
  }

  // Timeline — look for month/year references or timeframes
  const timelineMatch = userText.match(
    /(?:open(?:ing)?|ready|complete|finish|launch|start)(?:ing)?\s+(?:in|by|around)?\s*([a-zA-Z0-9\s,]{3,30}(?:month|year|quarter|q[1-4]|\d{4}))/i
  ) || userText.match(/(\d+)\s*(?:months?|years?)/i);
  const timeline = timelineMatch ? timelineMatch[1]?.trim() : null;

  // Project size
  const sizeMatch = userText.match(
    /(\d+)\s*(?:seats?|covers?|rooms?|beds?|sq\.?\s*m(?:eters?)?|sqm|m2)/i
  );
  const projectSize = sizeMatch ? sizeMatch[0] : null;

  return {
    phone: phoneMatch?.[0] || null,
    email: emailMatch?.[0] || null,
    name,
    budget,
    projectType,
    location,
    timeline,
    projectSize,
  };
}

// ─── Helper: Score Lead ────────────────────────────────────────────────────────
function scoreLead(lead) {
  let score = 0;

  // Budget weight (most important signal)
  if (lead.budget) {
    const raw = lead.budget.toLowerCase();
    let num = 0;
    if (raw.includes("million") || raw.includes("m")) {
      num = parseFloat(raw.replace(/[^0-9.]/g, "")) * 1_000_000;
    } else if (raw.includes("thousand") || raw.includes("k")) {
      num = parseFloat(raw.replace(/[^0-9.]/g, "")) * 1_000;
    } else {
      num = parseInt(raw.replace(/[^0-9]/g, ""));
    }
    if (num >= 300_000) score += 4;
    else if (num >= 100_000) score += 3;
    else if (num >= 50_000)  score += 2;
    else if (num > 0)        score += 1;
  }

  // Contact info
  if (lead.phone) score += 3;
  if (lead.email) score += 1;
  if (lead.name)  score += 1;

  // Project maturity
  if (lead.project_type || lead.projectType) score += 1;
  if (lead.location)     score += 1;
  if (lead.projectSize || lead.project_size) score += 1;
  if (lead.timeline) {
    const t = lead.timeline.toLowerCase();
    if (/[1-6]\s*month|q[1-4]|immediate|soon|asap/.test(t)) score += 3;
    else if (/[7-9]\s*month|1\s*year/.test(t)) score += 2;
    else score += 1;
  }

  if (score >= 8)  return "hot";
  if (score >= 4)  return "warm";
  return "cold";
}

// ═══════════════════════════════════════════════════════════════════════════════
// API ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Health Check (see full route with env check near bottom) ─────────────────

// ─── Chat Session: Start ──────────────────────────────────────────────────────
app.post("/api/chat/session", async (req, res) => {
  try {
    await ensureDb();
    const sessionId = uuidv4();
    const visitorIp =
      req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const userAgent = req.headers["user-agent"] || "";

    await query(
      `INSERT INTO chat_sessions (session_id, visitor_ip, user_agent) VALUES ($1, $2, $3)
       ON CONFLICT (session_id) DO NOTHING`,
      [sessionId, visitorIp, userAgent]
    );

    await query(
      `INSERT INTO visitor_analytics (session_id, event_type, event_data)
       VALUES ($1, 'chat_opened', $2)`,
      [sessionId, JSON.stringify({ ip: visitorIp })]
    );

    res.json({ sessionId });
  } catch (err) {
    console.error("Session error:", err);
    res.status(500).json({ error: "Failed to create session" });
  }
});

// ─── Chat: Send Message ────────────────────────────────────────────────────────
app.post("/api/chat/message", async (req, res) => {
  try {
    await ensureDb();
    const { sessionId, message } = req.body;
    if (!sessionId || !message) {
      return res.status(400).json({ error: "sessionId and message required" });
    }

    // Get active knowledge base entries
    const kbResult = await query(
      "SELECT title, content FROM knowledge_base WHERE is_active = TRUE ORDER BY id"
    );
    const kbContext = kbResult.rows
      .map((r) => `### ${r.title}\n${r.content}`)
      .join("\n\n");

    // Get last 20 messages for memory
    const historyResult = await query(
      `SELECT role, content FROM chat_messages WHERE session_id = $1
       ORDER BY created_at DESC LIMIT 20`,
      [sessionId]
    );
    const history = historyResult.rows.reverse();

    // Build system prompt — append active KB entries as supplemental facts
    const systemContent =
      DEFAULT_SYSTEM_PROMPT +
      (kbContext
        ? `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nADMIN-ADDED KNOWLEDGE (use naturally, never dump as list)\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n${kbContext}`
        : "");

    const messagesForAI = [
      { role: "system", content: systemContent },
      ...history,
      { role: "user", content: message },
    ];

    // Call OpenAI — lower max_tokens enforces concise responses
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o",
      messages: messagesForAI,
      max_tokens: 450,
      temperature: 0.35,
      presence_penalty: 0.1,
      frequency_penalty: 0.3,
    });

    const reply = completion.choices[0].message.content;

    // Store messages
    await query(
      `INSERT INTO chat_messages (session_id, role, content) VALUES ($1, $2, $3), ($1, $4, $5)`,
      [sessionId, "user", message, "assistant", reply]
    );

    // Update session stats
    await query(
      `UPDATE chat_sessions SET last_active = NOW(), message_count = message_count + 1 WHERE session_id = $1`,
      [sessionId]
    );

    // Track analytics
    await query(
      `INSERT INTO visitor_analytics (session_id, event_type, event_data) VALUES ($1, 'message_sent', $2)`,
      [sessionId, JSON.stringify({ messageLength: message.length })]
    );

    // Check for lead info in the conversation
    const allMessages = [...history, { role: "user", content: message }];
    const extracted = extractLeadFromMessages(allMessages);

    let leadCaptured = false;
    if (extracted.phone || extracted.email) {
      const existingLead = await query(
        "SELECT id FROM leads WHERE session_id = $1",
        [sessionId]
      );
      if (existingLead.rows.length === 0) {
        const leadData = {
          ...extracted,
          project_type: extracted.projectType,
          lead_score: scoreLead({ ...extracted, project_type: extracted.projectType }),
          session_id: sessionId,
        };
        const leadInsert = await query(
          `INSERT INTO leads
             (session_id, name, phone, email, project_type, project_size, budget, timeline, location, lead_score)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           RETURNING id`,
          [
            sessionId,
            leadData.name || null,
            leadData.phone,
            leadData.email,
            leadData.project_type,
            leadData.projectSize || null,
            leadData.budget,
            leadData.timeline || null,
            leadData.location || null,
            leadData.lead_score,
          ]
        );
        leadCaptured = true;

        await query(
          `UPDATE chat_sessions SET lead_captured = TRUE WHERE session_id = $1`,
          [sessionId]
        );

        await query(
          `INSERT INTO visitor_analytics (session_id, event_type, event_data) VALUES ($1, 'lead_captured', $2)`,
          [sessionId, JSON.stringify({ leadId: leadInsert.rows[0].id })]
        );

        try {
          await sendLeadEmail(leadData);
        } catch (emailErr) {
          console.error("Email error:", emailErr.message);
        }
      }
    }

    res.json({ reply, leadCaptured });
  } catch (err) {
    console.error("Chat error:", err?.message || err);
    // Return detailed error info to help debug (remove in strict production)
    res.status(500).json({
      error: "Failed to process message",
      detail: err?.message,
      type: err?.constructor?.name,
    });
  }
});

// ─── Chat: Get History ─────────────────────────────────────────────────────────
app.get("/api/chat/history/:sessionId", async (req, res) => {
  try {
    const result = await query(
      "SELECT role, content, created_at FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC",
      [req.params.sessionId]
    );
    res.json({ messages: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to get history" });
  }
});

// ─── Chat: Update Time Spent ──────────────────────────────────────────────────
app.post("/api/chat/time", async (req, res) => {
  try {
    const { sessionId, seconds } = req.body;
    await query(
      "UPDATE chat_sessions SET time_spent_seconds = $1 WHERE session_id = $2",
      [seconds, sessionId]
    );
    res.json({ ok: true });
  } catch {
    res.json({ ok: false });
  }
});

// ─── Lead: Submit Full Lead Form ──────────────────────────────────────────────
app.post("/api/leads", async (req, res) => {
  try {
    await ensureDb();
    const {
      sessionId,
      name,
      email,
      phone,
      company,
      location,
      project_type,
      project_size,
      budget,
      timeline,
      quality_preference,
      message,
    } = req.body;

    const leadData = {
      name,
      email,
      phone,
      company,
      location,
      project_type,
      budget,
      timeline,
    };
    const lead_score = scoreLead(leadData);

    const result = await query(
      `INSERT INTO leads (session_id, name, email, phone, company, location, project_type,
        project_size, budget, timeline, quality_preference, message, lead_score)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       ON CONFLICT DO NOTHING RETURNING id`,
      [
        sessionId,
        name,
        email,
        phone,
        company,
        location,
        project_type,
        project_size,
        budget,
        timeline,
        quality_preference,
        message,
        lead_score,
      ]
    );

    if (result.rows.length > 0) {
      try {
        await sendLeadEmail({
          ...req.body,
          lead_score,
        });
      } catch (emailErr) {
        console.error("Email error:", emailErr.message);
      }
    }

    res.json({ success: true, lead_score });
  } catch (err) {
    console.error("Lead error:", err);
    res.status(500).json({ error: "Failed to save lead" });
  }
});

// ─── Admin: Login ─────────────────────────────────────────────────────────────
app.post("/api/admin/login", async (req, res) => {
  try {
    await ensureDb();
    const { email, password } = req.body;
    const result = await query("SELECT * FROM admins WHERE email = $1", [
      email,
    ]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const admin = result.rows[0];
    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: admin.id, email: admin.email, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({
      token,
      admin: { id: admin.id, email: admin.email, username: admin.username },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── Admin: Change Password ────────────────────────────────────────────────────
app.post("/api/admin/change-password", authenticateAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await query("SELECT * FROM admins WHERE id = $1", [
      req.admin.id,
    ]);
    const admin = result.rows[0];
    const valid = await bcrypt.compare(currentPassword, admin.password_hash);
    if (!valid) return res.status(401).json({ error: "Current password incorrect" });

    const hash = await bcrypt.hash(newPassword, 12);
    await query("UPDATE admins SET password_hash = $1 WHERE id = $2", [
      hash,
      req.admin.id,
    ]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ─── Admin: Request Password Reset ────────────────────────────────────────────
app.post("/api/admin/reset-password-request", async (req, res) => {
  try {
    await ensureDb();
    const { email } = req.body;
    const result = await query("SELECT * FROM admins WHERE email = $1", [
      email,
    ]);
    if (result.rows.length === 0) {
      return res.json({ success: true }); // Don't reveal if email exists
    }
    const token = uuidv4();
    const expires = new Date(Date.now() + 3600000); // 1 hour
    await query(
      "UPDATE admins SET reset_token = $1, reset_token_expires = $2 WHERE email = $3",
      [token, expires, email]
    );

    const resetUrl = `${process.env.ADMIN_URL}/reset-password?token=${token}`;
    await transporter.sendMail({
      from: `"Culinova Admin" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset – Culinova Admin",
      html: `<p>Click to reset your password (expires in 1 hour):</p><a href="${resetUrl}">${resetUrl}</a>`,
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Reset request error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── Admin: Reset Password with Token ─────────────────────────────────────────
app.post("/api/admin/reset-password", async (req, res) => {
  try {
    await ensureDb();
    const { token, newPassword } = req.body;
    const result = await query(
      "SELECT * FROM admins WHERE reset_token = $1 AND reset_token_expires > NOW()",
      [token]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }
    const hash = await bcrypt.hash(newPassword, 12);
    await query(
      "UPDATE admins SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2",
      [hash, result.rows[0].id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ─── Admin: Dashboard Stats ────────────────────────────────────────────────────
app.get("/api/admin/dashboard", authenticateAdmin, async (req, res) => {
  try {
    await ensureDb();
    const [
      totalLeads,
      hotLeads,
      warmLeads,
      coldLeads,
      totalSessions,
      sessionsToday,
      leadsToday,
      avgMessages,
      leadsByDay,
      sessionsByDay,
      topProjectTypes,
      leadConversionRate,
      recentLeads,
      knowledgeBaseCount,
    ] = await Promise.all([
      query("SELECT COUNT(*) FROM leads"),
      query("SELECT COUNT(*) FROM leads WHERE lead_score = 'hot'"),
      query("SELECT COUNT(*) FROM leads WHERE lead_score = 'warm'"),
      query("SELECT COUNT(*) FROM leads WHERE lead_score = 'cold'"),
      query("SELECT COUNT(*) FROM chat_sessions"),
      query(
        "SELECT COUNT(*) FROM chat_sessions WHERE started_at >= NOW() - INTERVAL '24 hours'"
      ),
      query(
        "SELECT COUNT(*) FROM leads WHERE created_at >= NOW() - INTERVAL '24 hours'"
      ),
      query(
        "SELECT AVG(message_count) as avg FROM chat_sessions WHERE message_count > 0"
      ),
      query(`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM leads WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at) ORDER BY date ASC
      `),
      query(`
        SELECT DATE(started_at) as date, COUNT(*) as count
        FROM chat_sessions WHERE started_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(started_at) ORDER BY date ASC
      `),
      query(`
        SELECT project_type, COUNT(*) as count FROM leads
        WHERE project_type IS NOT NULL
        GROUP BY project_type ORDER BY count DESC LIMIT 5
      `),
      query(`
        SELECT 
          COUNT(CASE WHEN lead_captured = TRUE THEN 1 END)::float / NULLIF(COUNT(*), 0) * 100 as rate
        FROM chat_sessions
      `),
      query(
        "SELECT * FROM leads ORDER BY created_at DESC LIMIT 5"
      ),
      query(
        "SELECT COUNT(*) FROM knowledge_base WHERE is_active = TRUE"
      ),
    ]);

    res.json({
      stats: {
        totalLeads: parseInt(totalLeads.rows[0].count),
        hotLeads: parseInt(hotLeads.rows[0].count),
        warmLeads: parseInt(warmLeads.rows[0].count),
        coldLeads: parseInt(coldLeads.rows[0].count),
        totalSessions: parseInt(totalSessions.rows[0].count),
        sessionsToday: parseInt(sessionsToday.rows[0].count),
        leadsToday: parseInt(leadsToday.rows[0].count),
        avgMessages: parseFloat(avgMessages.rows[0]?.avg || 0).toFixed(1),
        conversionRate: parseFloat(
          leadConversionRate.rows[0]?.rate || 0
        ).toFixed(1),
        activeKBEntries: parseInt(knowledgeBaseCount.rows[0].count),
      },
      charts: {
        leadsByDay: leadsByDay.rows,
        sessionsByDay: sessionsByDay.rows,
        topProjectTypes: topProjectTypes.rows,
      },
      recentLeads: recentLeads.rows,
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ error: "Failed to get dashboard data" });
  }
});

// ─── Admin: Leads ─────────────────────────────────────────────────────────────
app.get("/api/admin/leads", authenticateAdmin, async (req, res) => {
  try {
    await ensureDb();
    const { page = 1, limit = 20, score, status, search } = req.query;
    const offset = (page - 1) * limit;

    let where = "WHERE 1=1";
    const params = [];
    let paramIdx = 1;

    if (score) {
      where += ` AND lead_score = $${paramIdx++}`;
      params.push(score);
    }
    if (status) {
      where += ` AND status = $${paramIdx++}`;
      params.push(status);
    }
    if (search) {
      where += ` AND (name ILIKE $${paramIdx} OR phone ILIKE $${paramIdx} OR email ILIKE $${paramIdx})`;
      params.push(`%${search}%`);
      paramIdx++;
    }

    const countResult = await query(
      `SELECT COUNT(*) FROM leads ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await query(
      `SELECT * FROM leads ${where} ORDER BY created_at DESC LIMIT $${paramIdx} OFFSET $${
        paramIdx + 1
      }`,
      [...params, limit, offset]
    );

    res.json({ leads: result.rows, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error("Leads error:", err);
    res.status(500).json({ error: "Failed to get leads" });
  }
});

// ─── Admin: Update Lead ───────────────────────────────────────────────────────
app.patch("/api/admin/leads/:id", authenticateAdmin, async (req, res) => {
  try {
    const { status, notes, name, phone, email, lead_score } = req.body;
    await query(
      `UPDATE leads SET status = COALESCE($1, status), notes = COALESCE($2, notes),
       name = COALESCE($3, name), phone = COALESCE($4, phone),
       email = COALESCE($5, email), lead_score = COALESCE($6, lead_score),
       updated_at = NOW() WHERE id = $7`,
      [status, notes, name, phone, email, lead_score, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update lead" });
  }
});

// ─── Admin: Delete Lead ───────────────────────────────────────────────────────
app.delete("/api/admin/leads/:id", authenticateAdmin, async (req, res) => {
  try {
    await query("DELETE FROM leads WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to delete lead" });
  }
});

// ─── Admin: Chat Sessions ─────────────────────────────────────────────────────
app.get("/api/admin/sessions", authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const total = await query("SELECT COUNT(*) FROM chat_sessions");
    const result = await query(
      `SELECT cs.*, 
        (SELECT COUNT(*) FROM chat_messages WHERE session_id = cs.session_id) as actual_messages
       FROM chat_sessions cs ORDER BY started_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({
      sessions: result.rows,
      total: parseInt(total.rows[0].count),
      page: parseInt(page),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to get sessions" });
  }
});

// ─── Admin: Session Messages ──────────────────────────────────────────────────
app.get("/api/admin/sessions/:sessionId/messages", authenticateAdmin, async (req, res) => {
  try {
    const result = await query(
      "SELECT * FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC",
      [req.params.sessionId]
    );
    res.json({ messages: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to get messages" });
  }
});

// ─── Admin: Analytics ─────────────────────────────────────────────────────────
app.get("/api/admin/analytics", authenticateAdmin, async (req, res) => {
  try {
    await ensureDb();
    const { range = "30" } = req.query;

    const [
      visitorTrend,
      leadTrend,
      hourlyActivity,
      languageBreakdown,
      avgSessionTime,
      topLocations,
      messageStats,
    ] = await Promise.all([
      query(`
        SELECT DATE(started_at) as date, COUNT(*) as visitors,
          SUM(CASE WHEN lead_captured THEN 1 ELSE 0 END) as leads
        FROM chat_sessions
        WHERE started_at >= NOW() - INTERVAL '${parseInt(range)} days'
        GROUP BY DATE(started_at) ORDER BY date ASC
      `),
      query(`
        SELECT DATE(created_at) as date, lead_score, COUNT(*) as count
        FROM leads
        WHERE created_at >= NOW() - INTERVAL '${parseInt(range)} days'
        GROUP BY DATE(created_at), lead_score ORDER BY date ASC
      `),
      query(`
        SELECT EXTRACT(HOUR FROM started_at) as hour, COUNT(*) as count
        FROM chat_sessions
        WHERE started_at >= NOW() - INTERVAL '${parseInt(range)} days'
        GROUP BY hour ORDER BY hour ASC
      `),
      query(`
        SELECT language, COUNT(*) as count FROM chat_sessions
        WHERE started_at >= NOW() - INTERVAL '${parseInt(range)} days'
        GROUP BY language ORDER BY count DESC
      `),
      query(`
        SELECT AVG(time_spent_seconds) as avg_seconds FROM chat_sessions
        WHERE time_spent_seconds > 0
        AND started_at >= NOW() - INTERVAL '${parseInt(range)} days'
      `),
      query(`
        SELECT location, COUNT(*) as count FROM leads
        WHERE location IS NOT NULL
        AND created_at >= NOW() - INTERVAL '${parseInt(range)} days'
        GROUP BY location ORDER BY count DESC LIMIT 10
      `),
      query(`
        SELECT 
          COUNT(*) as total_messages,
          AVG(message_count) as avg_per_session,
          MAX(message_count) as max_per_session
        FROM chat_sessions
        WHERE started_at >= NOW() - INTERVAL '${parseInt(range)} days'
      `),
    ]);

    res.json({
      visitorTrend: visitorTrend.rows,
      leadTrend: leadTrend.rows,
      hourlyActivity: hourlyActivity.rows,
      languageBreakdown: languageBreakdown.rows,
      avgSessionTime: avgSessionTime.rows[0],
      topLocations: topLocations.rows,
      messageStats: messageStats.rows[0],
    });
  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ error: "Failed to get analytics" });
  }
});

// ─── Admin: Knowledge Base CRUD ───────────────────────────────────────────────
app.get("/api/admin/knowledge-base", authenticateAdmin, async (req, res) => {
  try {
    await ensureDb();
    const result = await query(
      "SELECT * FROM knowledge_base ORDER BY id ASC"
    );
    res.json({ entries: result.rows });
  } catch {
    res.status(500).json({ error: "Failed to get knowledge base" });
  }
});

app.post("/api/admin/knowledge-base", authenticateAdmin, async (req, res) => {
  try {
    const { title, content, category } = req.body;
    const result = await query(
      "INSERT INTO knowledge_base (title, content, category) VALUES ($1, $2, $3) RETURNING *",
      [title, content, category || "general"]
    );
    res.json({ entry: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Failed to create entry" });
  }
});

app.patch("/api/admin/knowledge-base/:id", authenticateAdmin, async (req, res) => {
  try {
    const { title, content, category, is_active } = req.body;
    const result = await query(
      `UPDATE knowledge_base SET 
        title = COALESCE($1, title),
        content = COALESCE($2, content),
        category = COALESCE($3, category),
        is_active = COALESCE($4, is_active),
        updated_at = NOW()
       WHERE id = $5 RETURNING *`,
      [title, content, category, is_active, req.params.id]
    );
    res.json({ entry: result.rows[0] });
  } catch {
    res.status(500).json({ error: "Failed to update entry" });
  }
});

app.delete("/api/admin/knowledge-base/:id", authenticateAdmin, async (req, res) => {
  try {
    await query("DELETE FROM knowledge_base WHERE id = $1", [
      req.params.id,
    ]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to delete entry" });
  }
});

// ─── Admin: Export Leads CSV ───────────────────────────────────────────────────
app.get("/api/admin/leads/export", authenticateAdmin, async (req, res) => {
  try {
    const result = await query(
      "SELECT * FROM leads ORDER BY created_at DESC"
    );
    const headers = [
      "id",
      "name",
      "email",
      "phone",
      "company",
      "location",
      "project_type",
      "project_size",
      "budget",
      "timeline",
      "quality_preference",
      "lead_score",
      "status",
      "message",
      "notes",
      "created_at",
    ];
    const csv =
      headers.join(",") +
      "\n" +
      result.rows
        .map((row) =>
          headers
            .map((h) => `"${(row[h] || "").toString().replace(/"/g, '""')}"`)
            .join(",")
        )
        .join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=culinova-leads.csv"
    );
    res.send(csv);
  } catch {
    res.status(500).json({ error: "Export failed" });
  }
});

// ─── DB Keep-Alive (only in long-running process, not serverless) ─────────────
if (process.env.VERCEL !== "1") {
  setInterval(async () => {
    try { await query("SELECT 1"); } catch { /* silent */ }
  }, 4 * 60 * 1000);
}

// ─── Init DB on startup (lazy for serverless, eager for local) ───────────────
let dbReady = false;
async function ensureDb() {
  if (dbReady) return;
  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await initDatabase();
      dbReady = true;
      return;
    } catch (err) {
      lastErr = err;
      console.error(`DB init attempt ${attempt} failed:`, err.message);
      if (attempt < 3) await new Promise((r) => setTimeout(r, 2000));
    }
  }
  throw lastErr; // propagate so the API route returns 500 with real error
}

// ─── Health check also triggers DB init ───────────────────────────────────────
app.get("/api/health", async (req, res) => {
  await ensureDb();
  res.json({
    status: "ok",
    db: dbReady,
    env: {
      openai: !!process.env.OPENAI_API_KEY,
      db: !!process.env.DATABASE_URL,
      email: !!process.env.EMAIL_APP_PASSWORD,
    },
    timestamp: new Date().toISOString(),
  });
});

// ─── Local dev server start ───────────────────────────────────────────────────
if (process.env.VERCEL !== "1") {
  ensureDb().then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Culinova API running on port ${PORT}`);
      console.log(`📊 Admin: ${process.env.ADMIN_URL}`);
      console.log(`💬 Client: ${process.env.CLIENT_URL}`);
    });
  });
}

// ─── Vercel serverless export ─────────────────────────────────────────────────
// Vercel calls this on every request; DB init runs lazily on first hit
if (process.env.VERCEL === "1") {
  ensureDb().catch(console.error); // warm-up on cold start
}

module.exports = app;

