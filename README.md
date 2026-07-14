# Enterprise AI DB Assistant

Enterprise AI DB Assistant is a powerful, AI-driven web application that allows users to seamlessly interact with their PostgreSQL databases using natural language. It translates conversational queries into SQL, executes them securely with role-based access control (RBAC), and presents the results alongside audit trails and administrative dashboards.

## Key Features

- **Natural Language to SQL**: Chat with your database. Ask questions in plain English, and the AI will generate and execute the corresponding SQL query.
- **Role-Based Access Control (RBAC)**: Secure access to data.
  - **Admin**: Full system access, manage users, roles, and view comprehensive audit logs.
  - **Analyst**: Can execute AI queries on assigned tables.
  - **Viewer**: Read-only access to view schemas and query logs.
- **Granular Data Restrictions**: Restrict specific users to only interact with the tables they are permitted to see.
- **Audit Logging**: Comprehensive tracking of every natural language query, generated SQL, execution status, and affected row counts.
- **Admin Dashboard**: Visual statistics on system usage, query success rates, and user activity.

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS, TypeScript
- **Backend**: Python, FastAPI, SQLAlchemy
- **Database**: PostgreSQL
- **AI Integration**: Google Gemini 2.5 Flash

## Setup and Installation

For comprehensive instructions on how to set up the project, run the backend, seed the database, and start the frontend development server, please refer to the **[Setup Guide](./SETUP_GUIDE.md)**.

### Quick Start

1. Start the PostgreSQL container:
   ```bash
   docker-compose up -d
   ```
2. Start the Backend API (in `/backend`):
   ```bash
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   python seed.py # Seed database with test users and data
   python run.py
   ```
3. Start the Frontend Application (in `/frontend`):
   ```bash
   npm install
   npm run dev
   ```

## Test Accounts

After running the database seed script, the following accounts are available for testing:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | Admin@123 |
| Analyst | analyst@example.com | Analyst@123 |
| Viewer | viewer@example.com | Viewer@123 |

