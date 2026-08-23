# ⚡ Enterprise AI Database Assistant

A state-of-the-art, enterprise-grade AI Database Assistant built with **LangGraph StateGraph**, **FastMCP Server Tools**, **Two-Tiered Query Memory Architecture**, and **Granular Role-Based Access Control (RBAC)**.

It converts conversational natural language into secure, optimized SQL queries, executes them against PostgreSQL/MySQL databases, caches reusable query templates for **$0 LLM API cost**, and presents results via a unified **Production Dark Slate UI**.

---

## 📊 End-to-End System Architecture Diagram

This single unified flowchart details the complete end-to-end request lifecycle—from authentication and memory lookup to LangGraph agent execution, FastMCP database querying, and background sleep agent template extraction:

```mermaid
flowchart TD
    %% ─────────────────────────────────────────────────────────────────────────
    %% 1. FRONTEND LAYER
    %% ─────────────────────────────────────────────────────────────────────────
    subgraph Frontend["💻 1. FRONTEND SECURITY & UI LAYER (Next.js 16)"]
        UserPrompt["User Submits Natural Language Query\n('List top 5 products by stock value')"]
        FEAuthGuard{"Frontend Auth Guard\n(isInitialized & localStorage token?)"}
        RedirectLogin["Redirect to /login"]
        RenderUI["Render Dark Slate UI & Results Data Table"]
    end

    %% ─────────────────────────────────────────────────────────────────────────
    %% 2. BACKEND API & AUDIT LAYER
    %% ─────────────────────────────────────────────────────────────────────────
    subgraph APIGateway["🛡️ 2. FASTAPI GATEWAY & SECURITY LAYER"]
        APIRoute["POST /api/query/chat"]
        JWTCheck{"Verify JWT Bearer Token"}
        AuditInit["Create AuditLog Entry\n(user_id, user_email, prompt)"]
        RBACGate{"Check RBAC Scope\n(get_allowed_tables)"}
        Block401["HTTP 401 Unauthorized"]
        Block403["HTTP 403 Forbidden"]
    end

    %% ─────────────────────────────────────────────────────────────────────────
    %% 3. LEVEL 0 CHEAP-FIRST MEMORY LOOKUP ($0 LLM COST)
    %% ─────────────────────────────────────────────────────────────────────────
    subgraph MemoryLookup["⚡ 3. LEVEL 0 TWO-TIERED MEMORY LOOKUP ($0 LLM COST)"]
        Level1Hash{"Level 1: SHA-256 Hash Match?"}
        Level2Semantic{"Level 2: Gemini LLM Semantic Intent Matcher"}
        TierCheck["Check Priority Scope:\n1. User Scope (user_id = X)\n2. Shared Scope (user_id = NULL)"]
        MemoryHit["🎯 MEMORY HIT! (0ms / 0 LLM Cost)\nInject runtime slots e.g. {user_id}"]
    end

    %% ─────────────────────────────────────────────────────────────────────────
    %% 4. LANGGRAPH STATEGRAPH AGENT REASONING LOOP (ON MEMORY MISS)
    %% ─────────────────────────────────────────────────────────────────────────
    subgraph LangGraphEngine["🧠 4. LANGGRAPH STATEGRAPH AGENT (ON MEMORY MISS)"]
        Node1["Node 1: schema_inspector\n(Inject schema context & allowed_tables)"]
        Node2["Node 2: llm_reasoner\n(Call Gemini 3.5 Flash + FastMCP Declarations)"]
        Node3["Node 3: mcp_tool_execution\n(Execute FastMCP SELECT Queries)"]
        Node4["Node 4: response_synthesizer\n(Compile final QueryResponse JSON)"]
    end

    %% ─────────────────────────────────────────────────────────────────────────
    %% 5. FASTMCP PROTOCOL & DATABASE LAYER
    %% ─────────────────────────────────────────────────────────────────────────
    subgraph DatabaseLayer["🗄️ 5. FASTMCP PROTOCOL & DATABASE LAYER"]
        SQLVal{"Validate SQL Syntax\n(Enforce SELECT only)"}
        FastMCPTools["FastMCP Tools\n(execute_query, describe_table, list_tables)"]
        PostgreSQL[(PostgreSQL Enterprise Database\ncustomers, orders, products, audit_logs)]
    end

    %% ─────────────────────────────────────────────────────────────────────────
    %% 6. ASYNCHRONOUS SLEEP AGENT MEMORY BUILDER (BACKGROUND PIPELINE)
    %% ─────────────────────────────────────────────────────────────────────────
    subgraph SleepAgent["⚙️ 6. ASYNCHRONOUS SLEEP AGENT MEMORY BUILDER (BACKGROUND)"]
        BgTrigger["FastAPI BackgroundTasks Enqueue\n(run_memory_builder_cycle)"]
        Watermark["Watermark Gating\n(Fetch unprocessed chat messages)"]
        PIIGate["Privacy Enforcement Gate\n(scrub_pii: Redact emails, SSNs, credit cards)"]
        DedupCheck{"SHA-256 Intent Hash Exists?"}
        LLMAbstraction["Gemini Value-Agnostic Template Abstraction\n(Abstract slots like {user_id}, ensure COUNT/GROUP BY)"]
        SaveQueryMemory["Persist New QueryMemory to DB"]
    end

    %% ─────────────────────────────────────────────────────────────────────────
    %% CONNECTORS & EXECUTION FLOW
    %% ─────────────────────────────────────────────────────────────────────────
    UserPrompt --> FEAuthGuard
    FEAuthGuard -->|No Token| RedirectLogin
    FEAuthGuard -->|Token Valid| APIRoute
    
    APIRoute --> JWTCheck
    JWTCheck -->|Invalid Token| Block401
    JWTCheck -->|Valid Token| AuditInit
    AuditInit --> RBACGate
    RBACGate -->|Permission Denied| Block403
    RBACGate -->|Access Granted| TierCheck

    TierCheck --> Level1Hash
    Level1Hash -->|Match Found| MemoryHit
    Level1Hash -->|Miss| Level2Semantic
    Level2Semantic -->|Match Found| MemoryHit
    Level2Semantic -->|Miss| Node1

    MemoryHit --> SQLVal
    Node1 --> Node2
    Node2 -->|Function Call| Node3
    Node3 --> SQLVal

    SQLVal -->|Valid SELECT| FastMCPTools
    SQLVal -->|Blocked Statement| Node4
    FastMCPTools --> PostgreSQL

    FastMCPTools -->|Return Rows| Node4
    Node4 -->|QueryResponse JSON| RenderUI
    Node4 -->|Query Completed| BgTrigger

    BgTrigger --> Watermark
    Watermark --> PIIGate
    PIIGate --> DedupCheck
    DedupCheck -->|Already Cached| Done[End Pipeline]
    DedupCheck -->|New Pattern| LLMAbstraction
    LLMAbstraction --> SaveQueryMemory
```

<details>
<summary>📋 Click to copy raw Mermaid source code for End-to-End Architecture Flowchart</summary>

```text
flowchart TD
    subgraph Frontend["💻 1. FRONTEND SECURITY & UI LAYER (Next.js 16)"]
        UserPrompt["User Submits Natural Language Query\n('List top 5 products by stock value')"]
        FEAuthGuard{"Frontend Auth Guard\n(isInitialized & localStorage token?)"}
        RedirectLogin["Redirect to /login"]
        RenderUI["Render Dark Slate UI & Results Data Table"]
    end

    subgraph APIGateway["🛡️ 2. FASTAPI GATEWAY & SECURITY LAYER"]
        APIRoute["POST /api/query/chat"]
        JWTCheck{"Verify JWT Bearer Token"}
        AuditInit["Create AuditLog Entry\n(user_id, user_email, prompt)"]
        RBACGate{"Check RBAC Scope\n(get_allowed_tables)"}
        Block401["HTTP 401 Unauthorized"]
        Block403["HTTP 403 Forbidden"]
    end

    subgraph MemoryLookup["⚡ 3. LEVEL 0 TWO-TIERED MEMORY LOOKUP ($0 LLM COST)"]
        Level1Hash{"Level 1: SHA-256 Hash Match?"}
        Level2Semantic{"Level 2: Gemini LLM Semantic Intent Matcher"}
        TierCheck["Check Priority Scope:\n1. User Scope (user_id = X)\n2. Shared Scope (user_id = NULL)"]
        MemoryHit["🎯 MEMORY HIT! (0ms / 0 LLM Cost)\nInject runtime slots e.g. {user_id}"]
    end

    subgraph LangGraphEngine["🧠 4. LANGGRAPH STATEGRAPH AGENT (ON MEMORY MISS)"]
        Node1["Node 1: schema_inspector\n(Inject schema context & allowed_tables)"]
        Node2["Node 2: llm_reasoner\n(Call Gemini 3.5 Flash + FastMCP Declarations)"]
        Node3["Node 3: mcp_tool_execution\n(Execute FastMCP SELECT Queries)"]
        Node4["Node 4: response_synthesizer\n(Compile final QueryResponse JSON)"]
    end

    subgraph DatabaseLayer["🗄️ 5. FASTMCP PROTOCOL & DATABASE LAYER"]
        SQLVal{"Validate SQL Syntax\n(Enforce SELECT only)"}
        FastMCPTools["FastMCP Tools\n(execute_query, describe_table, list_tables)"]
        PostgreSQL[(PostgreSQL Enterprise Database\ncustomers, orders, products, audit_logs)]
    end

    subgraph SleepAgent["⚙️ 6. ASYNCHRONOUS SLEEP AGENT MEMORY BUILDER (BACKGROUND)"]
        BgTrigger["FastAPI BackgroundTasks Enqueue\n(run_memory_builder_cycle)"]
        Watermark["Watermark Gating\n(Fetch unprocessed chat messages)"]
        PIIGate["Privacy Enforcement Gate\n(scrub_pii: Redact emails, SSNs, credit cards)"]
        DedupCheck{"SHA-256 Intent Hash Exists?"}
        LLMAbstraction["Gemini Value-Agnostic Template Abstraction\n(Abstract slots like {user_id}, ensure COUNT/GROUP BY)"]
        SaveQueryMemory["Persist New QueryMemory to DB"]
    end

    UserPrompt --> FEAuthGuard
    FEAuthGuard -->|No Token| RedirectLogin
    FEAuthGuard -->|Token Valid| APIRoute
    
    APIRoute --> JWTCheck
    JWTCheck -->|Invalid Token| Block401
    JWTCheck -->|Valid Token| AuditInit
    AuditInit --> RBACGate
    RBACGate -->|Permission Denied| Block403
    RBACGate -->|Access Granted| TierCheck

    TierCheck --> Level1Hash
    Level1Hash -->|Match Found| MemoryHit
    Level1Hash -->|Miss| Level2Semantic
    Level2Semantic -->|Match Found| MemoryHit
    Level2Semantic -->|Miss| Node1

    MemoryHit --> SQLVal
    Node1 --> Node2
    Node2 -->|Function Call| Node3
    Node3 --> SQLVal

    SQLVal -->|Valid SELECT| FastMCPTools
    SQLVal -->|Blocked Statement| Node4
    FastMCPTools --> PostgreSQL

    FastMCPTools -->|Return Rows| Node4
    Node4 -->|QueryResponse JSON| RenderUI
    Node4 -->|Query Completed| BgTrigger

    BgTrigger --> Watermark
    Watermark --> PIIGate
    PIIGate --> DedupCheck
    DedupCheck -->|Already Cached| Done[End Pipeline]
    DedupCheck -->|New Pattern| LLMAbstraction
    LLMAbstraction --> SaveQueryMemory
```
</details>

---

## 🌟 Key Features & Architectural Highlights

### 1. 🧠 LangGraph StateGraph Workflow Engine
Replaces simple linear chains with an agentic cyclic graph (`StateGraph`) featuring 5 specialized execution nodes:
- **Node 0 (`memory_lookup`)**: Cheap-first memory engine lookup. Bypasses LLM loops on a memory hit (**$0 API cost, sub-second execution**).
- **Node 1 (`schema_inspector`)**: Inspects active session credentials and injects table schema context.
- **Node 2 (`llm_reasoner`)**: Generates SQL queries using Google Gemini API attached to FastMCP declarations.
- **Node 3 (`mcp_tool_execution`)**: Securely executes SELECT queries via FastMCP tools (`execute_query`, `get_schema_summary`).
- **Node 4 (`response_synthesizer`)**: Compiles natural language explanations, formatted SQL queries, data tables, and error tracebacks.

### 2. ⚡ FastMCP Server Protocol Tools
Model Context Protocol (MCP) tool integration ensuring strict read-only query execution:
- `list_tables`: Enforces RBAC permissions per user role.
- `describe_table`: Inspects column types and names.
- `execute_query`: Enforces `SELECT`-only validation (blocking `DROP`, `UPDATE`, `INSERT`, `DELETE`).
- `get_schema_summary`: Retrieves compact database schema definitions.

### 3. 💾 Two-Tiered Memory & Asynchronous Sleep Agent
An intelligent query plan memory pipeline designed for data isolation and pattern reuse:
- **User-Specific Scope (`user_id = X`)**: Private query intents isolated to individual users.
- **Shared Agent Scope (`user_id = NULL`)**: Generic database query patterns shared system-wide.
- **Dynamic Parameter Slot Binding**: Automatically replaces dynamic parameters (e.g. `{user_id}`) at runtime to prevent data cross-contamination between users.
- **Asynchronous Sleep Agent Builder**: Automatically triggers in the background (`BackgroundTasks`) upon query completion. Features:
  - **Watermark Gating**: Tracks high-water marks in `chat_messages` to prevent duplicate processing.
  - **SHA-256 Deduplication**: Prevents redundant pattern storage.
  - **Privacy Enforcement Gate (`scrub_pii`)**: Redacts PII/PHI data (emails, SSNs, credit cards, phone numbers) before persisting memories.
  - **LLM Value-Agnostic Template Abstraction**: Guarantees aggregation queries retain proper `COUNT()`, `SUM()`, and `GROUP BY` clauses.

### 4. 🎨 Production Dark Slate Design System (`bg-slate-950`)
A unified dark-mode UI built with Next.js 16, Tailwind CSS, and Lucide Icons:
- **Conversational Drawer**: Active session history with one-click past conversation restoration.
- **SQL & Data Visualization**: One-click SQL copy, formatted JSON/table views, and CSV export.
- **Admin Control Center**: Visual dashboards for Users & RBAC Management (`/admin/users`), Security Roles (`/admin/roles`), Audit Logs (`/admin/logs`), and Metrics (`/admin/dashboard`).

### 5. 🔐 Dual-Layer Authentication & Authorization Guard
- **Backend Guard**: JWT Bearer verification (`get_current_user`) and strict RBAC decorators (`require_admin`, `check_permission`).
- **Frontend Guard**: State initialization tracking (`isInitialized`) in Zustand to prevent flash redirects or unauthorized URL navigation.
- **Audit Logging**: Logs all logins, logouts, natural language prompts, executed SQL, IP addresses, and returned row counts in the `audit_logs` database table.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Next.js 16 (App Router), React 19, Tailwind CSS, Zustand, Lucide Icons, Axios |
| **Backend Framework** | Python 3.10+, FastAPI, Uvicorn, Pydantic v2 |
| **AI / Graph Agent** | LangGraph `StateGraph`, Google Gemini API (`gemini-3.5-flash`), FastMCP |
| **Database & ORM** | PostgreSQL 15+, SQLAlchemy 2.0 ORM, psycopg2 |
| **Authentication & Security** | JWT (JSON Web Tokens), Passlib (Bcrypt password hashing), HTTPBearer |
| **Containerization** | Docker, Docker Compose |

---

## 🚀 Quick Start Guide

### Prerequisites
- **Docker & Docker Compose** installed.
- **Python 3.10+** & **Node.js 18+** installed.
- A **Google Gemini API Key** (Set `GEMINI_API_KEY` in `backend/.env`).

---

### Step 1: Start Database Container
```bash
docker compose up -d
```
*Starts PostgreSQL container on port `5432` and Adminer on port `8080`.*

---

### Step 2: Set Up Backend API

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure Environment Variables (`backend/.env`):
   ```ini
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/enterprise_db
   SECRET_KEY=your_super_secret_jwt_key_here
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-3.5-flash
   ```
5. Seed the Database with Users & Enterprise Sample Data:
   ```bash
   python seed.py
   ```
6. Start the Backend API Server:
   ```bash
   python run.py
   ```
   *Backend runs at `http://localhost:8000`. API Docs available at `http://localhost:8000/docs`.*

---

### Step 3: Set Up Frontend Web App

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure Environment Variables (`frontend/.env.local`):
   ```ini
   NEXT_PUBLIC_API_URL=http://localhost:8000/api
   ```
4. Start Next.js Development Server:
   ```bash
   npm run dev
   ```
   *Frontend application runs at `http://localhost:3000`.*

---

## 🔑 Test Credentials

After running `python seed.py`, the following test accounts are available:

| Role | Email | Password | Allowed Tables / Scope |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@example.com` | `Admin@123` | Unrestricted (Full System Access & Admin Tabs) |
| **Data Analyst** | `analyst@example.com` | `Analyst@123` | `customers`, `orders`, `order_items`, `products`, `categories` |
| **Data Viewer** | `viewer@example.com` | `Viewer@123` | `products`, `categories` |

---

## 📊 Database Schema Overview

The database seed populates complete enterprise e-commerce tables:
- **`customers`**: Customer profiles, locations (pan-India cities), contact info.
- **`orders`**: Order records, payment methods, delivery status, shipping charges, total amounts.
- **`order_items`**: Purchased line items, quantities, unit prices.
- **`products`**: Catalog items, categories, cost price, selling price, stock quantities.
- **`categories`**: Product category names and descriptions.
- **`reviews`**: Ratings (1-5 stars), titles, review text.
- **`employees`**: Company staff across 8 departments, designations, salaries.
- **`inventory_logs`**: Product stock changes (sales, restocks, returns).
- **`audit_logs`**: System audit trails for user queries, SQL, status, and IP addresses.
- **`query_memories`**: Canonical memory templates created by the Sleep Agent.

---

## 🧪 Testing Memory Reuse ($0 LLM Cost)

1. Log in to `http://localhost:3000` as `admin@example.com`.
2. Ask **Question A**:
   > `List all customers from Mumbai along with their total spend`
   *(FastAPI returns the result live and automatically triggers the background Sleep Agent).*
3. Click **"+ New Conversation"** and ask **Question B (Phrasing Variant)**:
   > `Show clients located in Mumbai with total purchase amount`
4. Check your Backend Terminal:
   ```text
   🔍 [LangGraph Node 0: memory_lookup] Cheap-First Two-Tiered Memory Lookup...
   🌐 [Memory Lookup] HIT (Semantic Intent Engine): Shared Agent Memory (ID: 1)
   ⚡ [LangGraph Node 0: memory_lookup] MEMORY HIT! Reusing template (0 LLM cost):
      'SELECT c.id, c.full_name, SUM(o.total_amount) FROM customers c JOIN orders o...'
   ```

---

## 📜 License

Distributed under the **MIT License**.
