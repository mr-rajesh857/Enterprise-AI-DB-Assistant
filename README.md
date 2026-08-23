# ⚡ Enterprise AI Database Assistant

A state-of-the-art, enterprise-grade AI Database Assistant built with **LangGraph StateGraph**, **FastMCP Server Tools**, **Two-Tiered Query Memory Architecture**, and **Granular Role-Based Access Control (RBAC)**.

It converts conversational natural language into secure, optimized SQL queries, executes them against PostgreSQL/MySQL databases, caches reusable query templates for **$0 LLM API cost**, and presents results via a unified **Production Dark Slate UI**.

---

## 📊 End-to-End System Architecture Diagram

```mermaid
flowchart TD
    %% ─────────────────────────────────────────────────────────────────────────
    %% STYLING CLASSES FOR COLORED NODES
    %% ─────────────────────────────────────────────────────────────────────────
    classDef feNode fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#ffffff
    classDef apiNode fill:#312e81,stroke:#6366f1,stroke-width:2px,color:#ffffff
    classDef memNode fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#ffffff
    classDef agentNode fill:#3b0764,stroke:#a855f7,stroke-width:2px,color:#ffffff
    classDef dbNode fill:#78350f,stroke:#f59e0b,stroke-width:2px,color:#ffffff
    classDef sleepNode fill:#701a75,stroke:#e879f9,stroke-width:2px,color:#ffffff
    classDef hitNode fill:#065f46,stroke:#34d399,stroke-width:3px,color:#ffffff
    classDef errNode fill:#881337,stroke:#f43f5e,stroke-width:2px,color:#ffffff

    %% ─────────────────────────────────────────────────────────────────────────
    %% 1. FRONTEND LAYER
    %% ─────────────────────────────────────────────────────────────────────────
    subgraph Frontend["💻 Frontend UI & Session"]
        UserPrompt["User Prompt"]:::feNode
        FEAuthCheck{"Auth Guard Check"}:::feNode
        RedirectLogin["Redirect to Login"]:::errNode
        RenderUI["Render Results UI"]:::feNode
    end

    %% ─────────────────────────────────────────────────────────────────────────
    %% 2. API GATEWAY LAYER
    %% ─────────────────────────────────────────────────────────────────────────
    subgraph APIGateway["🛡️ API Gateway & Security"]
        APIRoute["POST /api/query/chat"]:::apiNode
        AuditInit["Record Audit Log"]:::apiNode
        RBACGate{"RBAC Security Check"}:::apiNode
        Block403["Access Denied"]:::errNode
    end

    %% ─────────────────────────────────────────────────────────────────────────
    %% 3. LEVEL 0 MEMORY LOOKUP ($0 COST)
    %% ─────────────────────────────────────────────────────────────────────────
    subgraph MemoryLookup["⚡ Memory Engine ($0 Cost)"]
        ScopeCheck["Lookup Scope"]:::memNode
        Level1Hash{"Level 1: SHA-256 Hash"}:::memNode
        Level2Semantic{"Level 2: AI Intent Match"}:::memNode
        MemoryHit["🎯 Memory HIT ($0 Cost)"]:::hitNode
    end

    %% ─────────────────────────────────────────────────────────────────────────
    %% 4. LANGGRAPH AGENT LOOP
    %% ─────────────────────────────────────────────────────────────────────────
    subgraph LangGraphEngine["🧠 LangGraph Agent Loop"]
        Node1["Node 1: Schema Inspector"]:::agentNode
        Node2["Node 2: Gemini Reasoner"]:::agentNode
        Node3["Node 3: FastMCP Tool Executor"]:::agentNode
        Node4["Node 4: Response Synthesizer"]:::agentNode
    end

    %% ─────────────────────────────────────────────────────────────────────────
    %% 5. FASTMCP & DATABASE LAYER
    %% ─────────────────────────────────────────────────────────────────────────
    subgraph DatabaseLayer["🗄️ Database & MCP Protocols"]
        SQLVal{"SQL Validation"}:::dbNode
        FastMCPTools["FastMCP Tools"]:::dbNode
        PostgreSQL[(PostgreSQL Database)]:::dbNode
    end

    %% ─────────────────────────────────────────────────────────────────────────
    %% 6. ASYNCHRONOUS SLEEP AGENT
    %% ─────────────────────────────────────────────────────────────────────────
    subgraph SleepAgent["⚙️ Async Sleep Agent"]
        BgTrigger["Trigger Sleep Agent"]:::sleepNode
        Watermark["1. Watermark Check"]:::sleepNode
        PIIGate["2. Privacy Gate"]:::sleepNode
        DedupCheck{"3. Pattern Exists?"}:::sleepNode
        LLMAbstraction["4. AI Template Abstraction"]:::sleepNode
        SaveQueryMemory["5. Save Reusable Memory"]:::sleepNode
    end

    %% ─────────────────────────────────────────────────────────────────────────
    %% CONNECTORS
    %% ─────────────────────────────────────────────────────────────────────────
    UserPrompt --> FEAuthCheck
    FEAuthCheck -->|Failed| RedirectLogin
    FEAuthCheck -->|Passed| APIRoute
    
    APIRoute --> AuditInit
    AuditInit --> RBACGate
    RBACGate -->|Denied| Block403
    RBACGate -->|Passed| ScopeCheck

    ScopeCheck --> Level1Hash
    Level1Hash -->|Match| MemoryHit
    Level1Hash -->|Miss| Level2Semantic
    Level2Semantic -->|Match| MemoryHit
    Level2Semantic -->|Miss| Node1

    MemoryHit --> SQLVal
    Node1 --> Node2
    Node2 -->|Tool Call| Node3
    Node3 --> SQLVal

    SQLVal -->|Valid SELECT| FastMCPTools
    SQLVal -->|Invalid| Node4
    FastMCPTools --> PostgreSQL

    FastMCPTools -->|Query Results| Node4
    Node4 -->|Response JSON| RenderUI
    Node4 -->|Complete| BgTrigger

    BgTrigger --> Watermark
    Watermark --> PIIGate
    PIIGate --> DedupCheck
    DedupCheck -->|Saved| Done[Complete]:::sleepNode
    DedupCheck -->|New Pattern| LLMAbstraction
    LLMAbstraction --> SaveQueryMemory
```

<details>
<summary>📋 Click to copy raw Mermaid source code for End-to-End Architecture Flowchart</summary>

```text
flowchart TD
    classDef feNode fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#ffffff
    classDef apiNode fill:#312e81,stroke:#6366f1,stroke-width:2px,color:#ffffff
    classDef memNode fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#ffffff
    classDef agentNode fill:#3b0764,stroke:#a855f7,stroke-width:2px,color:#ffffff
    classDef dbNode fill:#78350f,stroke:#f59e0b,stroke-width:2px,color:#ffffff
    classDef sleepNode fill:#701a75,stroke:#e879f9,stroke-width:2px,color:#ffffff
    classDef hitNode fill:#065f46,stroke:#34d399,stroke-width:3px,color:#ffffff
    classDef errNode fill:#881337,stroke:#f43f5e,stroke-width:2px,color:#ffffff

    subgraph Frontend["💻 Frontend UI & Session"]
        UserPrompt["User Prompt"]:::feNode
        FEAuthCheck{"Auth Guard Check"}:::feNode
        RedirectLogin["Redirect to Login"]:::errNode
        RenderUI["Render Results UI"]:::feNode
    end

    subgraph APIGateway["🛡️ API Gateway & Security"]
        APIRoute["POST /api/query/chat"]:::apiNode
        AuditInit["Record Audit Log"]:::apiNode
        RBACGate{"RBAC Security Check"}:::apiNode
        Block403["Access Denied"]:::errNode
    end

    subgraph MemoryLookup["⚡ Memory Engine ($0 Cost)"]
        ScopeCheck["Lookup Scope"]:::memNode
        Level1Hash{"Level 1: SHA-256 Hash"}:::memNode
        Level2Semantic{"Level 2: AI Intent Match"}:::memNode
        MemoryHit["🎯 Memory HIT ($0 Cost)"]:::hitNode
    end

    subgraph LangGraphEngine["🧠 LangGraph Agent Loop"]
        Node1["Node 1: Schema Inspector"]:::agentNode
        Node2["Node 2: Gemini Reasoner"]:::agentNode
        Node3["Node 3: FastMCP Tool Executor"]:::agentNode
        Node4["Node 4: Response Synthesizer"]:::agentNode
    end

    subgraph DatabaseLayer["🗄️ Database & MCP Protocols"]
        SQLVal{"SQL Validation"}:::dbNode
        FastMCPTools["FastMCP Tools"]:::dbNode
        PostgreSQL[(PostgreSQL Database)]:::dbNode
    end

    subgraph SleepAgent["⚙️ Async Sleep Agent"]
        BgTrigger["Trigger Sleep Agent"]:::sleepNode
        Watermark["1. Watermark Check"]:::sleepNode
        PIIGate["2. Privacy Gate"]:::sleepNode
        DedupCheck{"3. Pattern Exists?"}:::sleepNode
        LLMAbstraction["4. AI Template Abstraction"]:::sleepNode
        SaveQueryMemory["5. Save Reusable Memory"]:::sleepNode
    end

    UserPrompt --> FEAuthCheck
    FEAuthCheck -->|Failed| RedirectLogin
    FEAuthCheck -->|Passed| APIRoute
    
    APIRoute --> AuditInit
    AuditInit --> RBACGate
    RBACGate -->|Denied| Block403
    RBACGate -->|Passed| ScopeCheck

    ScopeCheck --> Level1Hash
    Level1Hash -->|Match| MemoryHit
    Level1Hash -->|Miss| Level2Semantic
    Level2Semantic -->|Match| MemoryHit
    Level2Semantic -->|Miss| Node1

    MemoryHit --> SQLVal
    Node1 --> Node2
    Node2 -->|Tool Call| Node3
    Node3 --> SQLVal

    SQLVal -->|Valid SELECT| FastMCPTools
    SQLVal -->|Invalid| Node4
    FastMCPTools --> PostgreSQL

    FastMCPTools -->|Query Results| Node4
    Node4 -->|Response JSON| RenderUI
    Node4 -->|Complete| BgTrigger

    BgTrigger --> Watermark
    Watermark --> PIIGate
    PIIGate --> DedupCheck
    DedupCheck -->|Saved| Done[Complete]:::sleepNode
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
