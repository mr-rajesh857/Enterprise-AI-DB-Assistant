# Enterprise AI DB Assistant - Frontend

A modern Next.js frontend for the Enterprise AI DB Assistant application, providing a web interface for database queries using AI.

## Features

- 🔐 JWT Authentication with role-based access control
- 💬 Natural language database query interface
- 👥 User management (admin only)
- 🔑 Role and permission management (admin only)
- 📊 Audit logging and dashboard
- 📱 Responsive mobile-friendly design
- 🎨 Modern UI with Tailwind CSS

## Tech Stack

- **Framework**: Next.js 16.2.10 with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand 4.5.0
- **HTTP Client**: Axios 1.7.0
- **Icons**: Lucide React 0.408.0
- **Utilities**: clsx, date-fns

## Setup Instructions

### Prerequisites

- Node.js 18+ or higher
- npm or yarn
- Backend server running on http://localhost:8000

### Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env.local` file (already created with default values):
   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

### Running the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Building for Production

```bash
npm run build
npm start
```

## Project Structure

```
frontend/
├── app/                          # Next.js app directory
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page (redirects to login/dashboard)
│   ├── login/
│   │   └── page.tsx            # Login page
│   ├── dashboard/
│   │   ├── layout.tsx          # Protected layout with navigation
│   │   └── page.tsx            # Main chat interface
│   └── admin/
│       ├── layout.tsx          # Admin-only layout
│       ├── users/
│       │   └── page.tsx        # User management
│       ├── roles/
│       │   └── page.tsx        # Role management
│       ├── logs/
│       │   └── page.tsx        # Audit logs
│       └── dashboard/
│           └── page.tsx        # Admin stats dashboard
├── components/                  # Reusable React components
│   ├── Alert.tsx               # Error/Success alerts
│   ├── AuditLogs.tsx           # Audit logs table
│   ├── ChatInterface.tsx        # Main chat/query interface
│   ├── Header.tsx              # Top navigation header
│   ├── Loading.tsx             # Loading spinners
│   ├── RoleManagement.tsx       # Role components
│   ├── Sidebar.tsx             # Navigation sidebar
│   └── UserManagement.tsx       # User management components
├── hooks/                       # Custom React hooks
│   └── useAuth.ts              # Authentication hooks
├── lib/                         # Utilities and helpers
│   ├── api.ts                  # API client with axios
│   └── utils.ts                # Utility functions
├── store/                       # State management (Zustand)
│   └── auth.ts                 # Authentication store
├── types/                       # TypeScript interfaces
│   └── index.ts                # API types and schemas
├── public/                      # Static assets
├── .env.local                  # Environment variables
├── tailwind.config.ts          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
└── package.json                # Dependencies
```

## Authentication Flow

1. User visits application
2. If not authenticated, redirected to `/login`
3. User enters email and password
4. Frontend calls `POST /auth/login` endpoint
5. Backend returns JWT token
6. Token stored in localStorage
7. Axios interceptor automatically adds token to all requests
8. User redirected to `/dashboard`

### Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | Admin@123 |
| Analyst | analyst@example.com | Analyst@123 |
| Viewer | viewer@example.com | Viewer@123 |

## Pages and Features

### Public Pages

- **`/login`** - Authentication page

### Protected Pages (Authenticated Users)

- **`/` (root)** - Redirects to login or dashboard
- **`/dashboard`** - Main chat interface for querying database

### Admin Pages

- **`/admin/users`** - User management (create, read, update, delete)
- **`/admin/roles`** - Role and permission management
- **`/admin/logs`** - Audit logs with pagination
- **`/admin/dashboard`** - Statistics and system overview

## API Client

The `lib/api.ts` file provides an `APIClient` class with methods:

### Authentication
- `login(email, password)` - Authenticate user
- `getMe()` - Get current user info

### Queries
- `chat(message, conversation_history)` - Execute AI query
- `getTables()` - List accessible tables

### User Management (Admin)
- `listUsers()` - Get all users
- `createUser(data)` - Create new user
- `updateUser(id, data)` - Update user
- `deleteUser(id)` - Delete user

### Role Management (Admin)
- `listRoles()` - Get all roles
- `createRole(data)` - Create new role

### Audit & Stats
- `getAuditLogs(skip, limit)` - Get paginated audit logs
- `getStats()` - Get system statistics

## State Management

### Zustand Auth Store (`store/auth.ts`)

State:
- `user` - Current user object
- `token` - JWT token
- `isLoading` - Loading state
- `error` - Error message

Methods:
- `login(email, password)` - Authenticate
- `logout()` - Clear auth state
- `initializeAuth()` - Restore from localStorage

## Custom Hooks

### `useAuth()`
Returns full auth store state and methods.

### `useProtected()`
Redirects to login if not authenticated.

### `useAdminOnly()`
Redirects to dashboard if user is not admin.

## UI Components

### Alert Components
- `ErrorAlert` - Display error messages
- `SuccessAlert` - Display success messages

### Loading Components
- `LoadingSpinner` - Inline spinner
- `FullPageLoader` - Full-screen loading

### Navigation
- `Header` - Top navigation with user info
- `Sidebar` - Left sidebar navigation (desktop)
- `MobileNav` - Bottom navigation (mobile)

### Feature Components
- `ChatInterface` - Query interface with conversation history
- `UserList` & `UserForm` - User management UI
- `RoleList` & `RoleForm` - Role management UI
- `AuditLogTable` - Paginated audit logs

## Environment Variables

- `NEXT_PUBLIC_API_URL` - Backend API URL (default: `http://localhost:8000`)

## Building TypeScript

TypeScript configuration in `tsconfig.json` includes:
- Strict mode enabled
- Path aliases (`@/`)
- React 19 JSX transform

## Styling

Uses Tailwind CSS 4 for utility-first styling with:
- Custom color scheme
- Responsive breakpoints
- Dark mode support (optional)

## Error Handling

All API calls include:
- Error boundary handling
- User-friendly error messages
- Automatic 401 redirect to login
- Toast notifications

## Security

- JWT tokens stored in localStorage
- Authorization headers added automatically
- Role-based access control
- Protected routes with layout guards
- Admin-only pages with middleware

## Performance

- Server-side rendering with Next.js
- Code splitting per route
- Image optimization
- CSS optimization via Tailwind

## Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome Android)

## Troubleshooting

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
npm install

# Rebuild
npm run build
```

### API Connection Issues

- Verify backend is running on `http://localhost:8000`
- Check `.env.local` has correct `NEXT_PUBLIC_API_URL`
- Check browser console for CORS errors
- Verify backend CORS configuration

### Authentication Issues

- Clear localStorage: `localStorage.clear()`
- Check JWT token format in DevTools Application tab
- Verify token hasn't expired

## Development Tips

- Use `npm run dev` for hot reload
- TypeScript will catch type errors during build
- Check browser DevTools for network/console errors
- Use React DevTools extension for component debugging

## License

MIT
