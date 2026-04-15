# Culinova AI Chatbot System

Full-stack AI chatbot with admin panel for Culinova — commercial kitchen and laundry design company in Saudi Arabia.

## Project Structure

```
culinova/
├── backend/          Node.js Express API (server.js)
├── client/           React - Chatbot Landing Page + Widget
└── admin/            React - Admin Dashboard Panel
```

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Database**: Vercel Postgres (PostgreSQL)
- **AI**: OpenAI GPT-4o
- **Email**: NodeMailer (Gmail)
- **Auth**: JWT + bcrypt

## Setup

### 1. Configure Environment Variables

Edit `backend/.env`:
```env
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o
DATABASE_URL=your_vercel_postgres_url
JWT_SECRET=your_secret_key
EMAIL_USER=your_gmail@gmail.com
EMAIL_APP_PASSWORD=your_gmail_app_password
EMAIL_TO=contact@culinova.sa
PORT=5000
CLIENT_URL=http://localhost:3000
ADMIN_URL=http://localhost:3001
```

### 2. Get Vercel Postgres URL

1. Go to [vercel.com](https://vercel.com) → your project → Storage tab
2. Create a new Postgres database
3. Copy the `POSTGRES_URL` (use this as `DATABASE_URL`)

### 3. Install & Run

```bash
# Backend
cd backend && npm install && npm run dev

# Client (new terminal)
cd client && npm install && npm run dev

# Admin (new terminal)
cd admin && npm install && npm run dev
```

### 4. Access

- **Chatbot**: http://localhost:3000
- **Admin Panel**: http://localhost:3001
- **API**: http://localhost:5000

## Admin Login

Default credentials (change immediately after setup):
- **Email**: admin@culinova.sa
- **Password**: Culinova@2024

## Database Tables

See `backend/database.sql` for all table definitions.
The server auto-creates all tables on first run.

| Table | Purpose |
|-------|---------|
| `admins` | Admin users with JWT auth |
| `leads` | Captured leads with scoring |
| `chat_sessions` | Visitor sessions and stats |
| `chat_messages` | Full conversation history |
| `knowledge_base` | AI context entries (editable) |
| `visitor_analytics` | Event tracking |

## Features

### Chatbot
- OpenAI GPT-4o powered AI consultant
- Multilingual (Arabic, English, any language)
- Last 20 message memory per session
- Smart lead qualification (Hot/Warm/Cold)
- Email notifications on lead capture
- Quick reply buttons
- Beautiful gold/dark theme

### Admin Panel
- Secure JWT login + password reset
- Real-time dashboard with charts
- Leads management (filter, edit, export CSV)
- Full chat history viewer
- Analytics (trends, hourly activity, locations)
- Knowledge base editor
- Settings & password management
