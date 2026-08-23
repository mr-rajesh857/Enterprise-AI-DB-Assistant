# Enterprise AI DB Assistant - Complete Setup Guide

This guide covers the complete setup for both the backend FastAPI server and the frontend Next.js application.

## System Requirements

- **OS**: Linux, macOS, or Windows (WSL2)
- **Node.js**: 18.0 or higher
- **Python**: 3.10 or higher
- **Docker**: Latest version with Docker Compose
- **PostgreSQL**: 15 (via Docker)

## Quick Start (5 Minutes)

### 1. Start PostgreSQL Database

```bash
cd /home/rajeshkumarpanda/Documents/enterprise-ai-db-assistant
docker-compose up -d
```

Verify PostgreSQL is running:
```bash
docker-compose ps
```

### 2. Setup Backend

```bash
cd backend

# Create Python virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Seed database with test users
python seed.py

# Start backend server
python run.py
```

Backend will be available at `http://localhost:8000`

### 3. Setup Frontend

```bash
cd ../frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be available at `http://localhost:3000`

---

## Detailed Setup Instructions

## Backend Setup

### Prerequisites

- Python 3.10+
- PostgreSQL 15 (via Docker)
- Virtual environment (recommended)

### Step 1: Install Python Dependencies

```bash
cd /home/rajeshkumarpanda/Documents/enterprise-ai-db-assistant/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install requirements
pip install -r requirements.txt
```

### Step 2: Environment Configuration

Create `.env` file in backend directory:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/enterprise_ai_db

# JWT Configuration
SECRET_KEY=your-super-secret-key-change-this-in-production

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
API_ENV=development

# CORS
CORS_ORIGINS=["http://localhost:3000"]

# Google Gemini
GEMINI_API_KEY=your-google-api-key-here
GEMINI_MODEL=gemini-2.5-flash
```

### Step 3: Setup PostgreSQL Database

```bash
# Start PostgreSQL in Docker
docker-compose up -d

# Wait for PostgreSQL to be ready (about 10 seconds)
sleep 10

# Verify connection
psql -h localhost -p 5433 -U postgres -d postgres -c "SELECT 1"
```

### Step 4: Initialize Database

The database schema is created automatically when the application starts, but you can seed it with test data:

```bash
python seed.py
```

This creates:
- 3 test users (admin, analyst, viewer)
- 3 test roles with permissions
- Sample tables and audit logs

### Step 5: Start Backend Server

```bash
python run.py
```

Expected output:
```
Uvicorn running on http://0.0.0.0:8000
```

### Verify Backend

Test the API:
```bash
# Health check
curl http://localhost:8000/health

# Auth login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "Admin@123"}'
```

---

## Frontend Setup

### Prerequisites

- Node.js 18.0+
- npm or yarn
- Backend running on `http://localhost:8000`

### Step 1: Install Dependencies

```bash
cd /home/rajeshkumarpanda/Documents/enterprise-ai-db-assistant/frontend

npm install
```

### Step 2: Environment Configuration

`.env.local` file (already created):

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Step 3: Start Development Server

```bash
npm run dev
```

Expected output:
```
> frontend@0.1.0 dev
> next dev

  ▲ Next.js 16.2.10
  - Local:        http://localhost:3000
```

### Step 4: Access Application

Open `http://localhost:3000` in your browser

---

## Docker Setup

### Start All Services

```bash
cd /home/rajeshkumarpanda/Documents/enterprise-ai-db-assistant

# Start PostgreSQL database
docker-compose up -d

# Verify all services
docker-compose ps
```

### Stop All Services

```bash
docker-compose down
```

### View Database Logs

```bash
docker-compose logs postgres
```

---

## Test User Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@example.com | Admin@123 |
| **Analyst** | analyst@example.com | Analyst@123 |
| **Viewer** | viewer@example.com | Viewer@123 |

### Test Permissions

- **Admin**: Full access to all features, user/role management, audit logs
- **Analyst**: Can query assigned tables (orders, products, customers by default)
- **Viewer**: Read-only access to database schema and audit logs

---

## API Endpoints

### Authentication
- `POST /auth/login` - Login with email/password
- `GET /auth/me` - Get current user info

### Queries
- `POST /query/chat` - Execute natural language query
- `GET /query/tables` - List accessible tables

### User Management (Admin)
- `GET /admin/users` - List all users
- `POST /admin/users` - Create user
- `PUT /admin/users/{id}` - Update user
- `DELETE /admin/users/{id}` - Delete user

### Role Management (Admin)
- `GET /admin/roles` - List all roles
- `POST /admin/roles` - Create role

### Audit & Stats (Admin)
- `GET /admin/audit-logs` - Get audit logs (paginated)
- `GET /admin/stats` - Get system statistics

---

## Troubleshooting

### Backend Issues

#### Port 8000 already in use
```bash
# Find and kill process using port 8000
lsof -ti:8000 | xargs kill -9
```

#### PostgreSQL connection failed
```bash
# Check PostgreSQL is running
docker-compose ps

# Check PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

#### Module not found errors
```bash
# Ensure venv is activated
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt

# Verify installation
pip list
```

#### Gemini API errors
- Verify `GEMINI_API_KEY` is set correctly
- Verify model name is `gemini-2.5-flash`
- Check API quota on Google Cloud Console
- Wait a few seconds if hitting rate limits

### Frontend Issues

#### Port 3000 already in use
```bash
# Kill process using port 3000
lsof -ti:3000 | xargs kill -9
```

#### Cannot connect to backend
- Verify backend is running: `curl http://localhost:8000/health`
- Check `.env.local` has correct `NEXT_PUBLIC_API_URL`
- Check browser console for CORS errors
- Verify backend CORS configuration allows `http://localhost:3000`

#### npm install fails
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

#### TypeScript errors
```bash
# Build to see all type errors
npm run build

# For development, errors are shown in console
npm run dev
```

---

## Development Workflow

### Backend Development

1. Make changes to backend code
2. Backend will auto-reload (if using `python run.py`)
3. Test endpoints with curl or Postman
4. Check FastAPI docs at `http://localhost:8000/docs`

### Frontend Development

1. Make changes to frontend code
2. Next.js will hot-reload automatically
3. Check browser console for TypeScript errors
4. Use React DevTools for debugging components

---

## Production Deployment

### Backend

```bash
# Build production package
cd backend
pip install -r requirements.txt

# Set environment
export API_ENV=production
export SECRET_KEY=your-production-secret-key

# Run with production server
gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker
```

### Frontend

```bash
# Build production bundle
cd frontend
npm run build

# Start production server
npm start
```

---

## Database Backup & Restore

### Backup Database

```bash
docker-compose exec postgres pg_dump -U postgres enterprise_ai_db > backup.sql
```

### Restore Database

```bash
docker-compose exec -T postgres psql -U postgres < backup.sql
```

---

## Monitoring

### Backend Logs

```bash
# View backend logs
tail -f /var/log/enterprise-ai-db/backend.log

# Watch FastAPI docs
open http://localhost:8000/docs
```

### Frontend Logs

```bash
# View in browser console
# Or use npm run dev and watch terminal output
```

### Database Logs

```bash
docker-compose logs postgres -f
```

---

## Security Checklist

- [ ] Change `SECRET_KEY` in backend `.env`
- [ ] Set strong database password
- [ ] Enable HTTPS in production
- [ ] Restrict CORS origins to your domain
- [ ] Use environment variables for sensitive data
- [ ] Enable database SSL connections
- [ ] Setup rate limiting
- [ ] Enable audit logging
- [ ] Regular database backups
- [ ] Keep dependencies updated

---

## Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Google Gemini API](https://ai.google.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Zustand Documentation](https://zustand-demo.vercel.app/)

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review application logs
3. Check FastAPI docs at `/docs`
4. Verify all services are running: `docker-compose ps`

---

## License

MIT
