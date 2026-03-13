# 🤖 AutoBizOps – Autonomous Business Operations Agent

> Built for the **TinyFish Web Agent Hackathon** — demonstrating real autonomous web agent automation

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?logo=typescript)](https://typescriptlang.org)
[![TinyFish](https://img.shields.io/badge/TinyFish-Web%20Agent%20API-green)](https://tinyfish.io)
[![Gemini](https://img.shields.io/badge/Google-Gemini%201.5-orange?logo=google)](https://ai.google.dev)

---

## 🎯 Project Overview

AutoBizOps is an AI-powered autonomous business agent that performs **real work on real websites** using the TinyFish Web Agent API. Users enter natural language commands, and the agent plans and executes multi-step browser workflows — navigating sites, extracting data, filling forms, and logging results.

**Hackathon Goal**: Demonstrate agentic web automation with real browser sessions, multi-step workflows, and live data extraction.

---

## 🏆 TinyFish Hackathon

This project showcases the **TinyFish Web Agent API** as the core browser automation engine:

- **Real browser sessions** via TinyFish API
- **Multi-step web workflows** with session management
- **Page navigation, clicking, form filling, and data extraction**
- **Scalable agent architecture** with clean session lifecycle

---

## 🤖 How the AI Agent Works

### Architecture

```
User Command
     ↓
Gemini AI Planner (lib/gemini.ts)
     ↓ Generates structured step plan
TinyFish Executor (agent/executor.ts)
     ↓ Executes via browser sessions
Browser Navigation (agent/browser.ts)
     ↓
MongoDB Logging (models/log.ts)
     ↓
Dashboard Results
```

### Agent Pipeline

1. **User enters a command** in natural language
2. **Gemini AI** parses the command and generates a structured JSON execution plan
3. **TinyFish Web Agent API** starts a browser session and executes each step
4. **Actions performed**: navigate, search, click, extract, fill_form, submit, save
5. **All logs and results** are persisted to MongoDB
6. **Dashboard** shows live execution logs and results table

### Example: Competitor Price Monitoring

```
Command: "Find SaaS CRM competitors and extract pricing"

Step 1: Navigate → https://www.google.com
Step 2: Search → "best SaaS CRM tools pricing 2024"
Step 3: Click → first organic search result
Step 4: Navigate → /pricing page
Step 5: Extract → pricing tiers (plan_name, price, features)
Step 6: Navigate → second competitor
Step 7: Extract → competitor 2 pricing data
Step 8: Save → MongoDB database
```

---

## 🚀 Installation

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- TinyFish API key → [tinyfish.io](https://tinyfish.io)
- Google Gemini API key → [ai.google.dev](https://ai.google.dev)

### 1. Clone & Install

```bash
git clone <repo-url>
cd autobizops-agent
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
TINYFISH_API_KEY=your_tinyfish_api_key
GEMINI_API_KEY=your_gemini_api_key
MONGODB_URI=mongodb+srv://...
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Build for Production

```bash
npm run build
npm start
```

---

## 📁 Project Structure

```
autobizops-agent/
├── app/
│   ├── page.tsx              # Landing page
│   ├── dashboard/page.tsx    # Agent dashboard
│   └── logs/page.tsx         # Execution history
│
├── components/
│   ├── Navbar.tsx            # Top navigation
│   ├── Sidebar.tsx           # Side navigation + templates
│   ├── CommandInput.tsx      # Agent command terminal
│   ├── AgentConsole.tsx      # Live execution log viewer
│   ├── WorkflowTable.tsx     # Results table
│   └── StatusBadge.tsx       # Status indicator
│
├── agent/
│   ├── planner.ts            # Gemini AI planning layer
│   ├── executor.ts           # TinyFish API execution
│   ├── browser.ts            # Playwright fallback
│   └── workflow.ts           # Orchestration pipeline
│
├── lib/
│   ├── gemini.ts             # Google Gemini client
│   └── mongodb.ts            # MongoDB connection
│
├── models/
│   └── log.ts                # Workflow log schema
│
└── pages/api/agent/
    ├── start.ts              # POST /api/agent/start
    ├── status.ts             # GET /api/agent/status
    └── logs.ts               # GET /api/agent/logs
```

---

## 🌐 TinyFish API Integration

The executor (`agent/executor.ts`) calls TinyFish API endpoints:

```typescript
// Start session
POST /sessions
{ browser: "chromium", headless: true }

// Navigate
POST /sessions/:id/actions
{ action: "navigate", url: "https://google.com" }

// Extract data
POST /sessions/:id/actions
{ action: "extract", fields: ["price", "plan_name"], selector: ".pricing-table" }

// Close session
DELETE /sessions/:id
```

---

## 🎬 Demo Workflows

| Workflow | Command |
|----------|---------|
| Price Monitor | `Find SaaS CRM competitors and extract pricing` |
| Lead Gen | `Find B2B SaaS companies and extract contact emails` |
| Form Submit | `Submit a demo request on HubSpot website` |
| Research | `Research top project management tools in 2024` |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React, TypeScript, TailwindCSS |
| Agent API | TinyFish Web Agent API |
| AI Planner | Google Gemini 1.5 Flash |
| Browser Fallback | Playwright |
| Database | MongoDB + Mongoose |
| Hosting | Vercel |

---

## 📊 Features

- ✅ Real browser sessions via TinyFish API
- ✅ Gemini AI converts natural language → structured plans
- ✅ Multi-step workflow execution with logging
- ✅ Live execution console with real-time log streaming
- ✅ MongoDB persistence for all workflow runs
- ✅ Quick workflow templates for demo
- ✅ Results table with extracted data
- ✅ Session management (start/execute/close)
- ✅ Playwright fallback for offline/demo mode
- ✅ Modern SaaS dashboard UI

---

## 🏗 API Reference

### `POST /api/agent/start`
Start a new agent workflow.

```json
// Request
{ "command": "Find SaaS CRM competitors and extract pricing" }

// Response
{ "workflowId": "uuid", "status": "running" }
```

### `GET /api/agent/logs?workflowId=xxx&since=0`
Get live execution logs.

### `GET /api/agent/status?workflowId=xxx`
Get workflow status.

---

## 📄 License

MIT — Built for TinyFish Web Agent Hackathon 2024
