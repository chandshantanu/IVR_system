# IVR System - Frontend Guide

Complete guide for the IVR Management UI built with Next.js 14, TypeScript, and Tailwind CSS.

---

## 🎨 What's Included

### ✅ Features Implemented
- **Authentication System**: Login with JWT tokens
- **Error Handling**: Comprehensive error boundaries and API error handling
- **Responsive Dashboard**: Clean, professional UI with metrics cards
- **Protected Routes**: Automatic redirect to login if not authenticated
- **Type-Safe**: Full TypeScript with strict mode
- **API Integration**: Axios client with auto-refresh tokens
- **State Management**: Zustand for auth state
- **UI Components**: Reusable components (Button, Card, Input)

### 🎯 Pages
- **Login** (`/auth/login`) - User authentication
- **Dashboard** (`/dashboard`) - Main dashboard with stats
- **IVR Flows** (`/flows`) - Flow management (placeholder)
- **Agents** (`/agents`) - Coming soon
- **Queues** (`/queues`) - Coming soon
- **Analytics** (`/analytics`) - Coming soon

---

## 🚀 Quick Start

### Option 1: With Docker (Recommended)

```bash
# Start full stack (backend + frontend)
docker-compose up -d

# View logs
docker-compose logs -f frontend
```

Frontend will be available at: **http://localhost:3000**

### Option 2: Local Development

```bash
cd ivr-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be available at: **http://localhost:3000**

---

## 🔐 Default Login Credentials

| Username | Password   | Role        |
|----------|------------|-------------|
| admin    | admin123   | super_admin |
| manager  | manager123 | manager     |
| agent    | agent123   | agent       |

---

## 📁 Project Structure

```
ivr-frontend/
├── src/
│   ├── app/                      # Next.js 14 App Router
│   │   ├── layout.tsx            # Root layout with error boundary
│   │   ├── page.tsx              # Home page (redirects to dashboard/login)
│   │   ├── globals.css           # Global styles + Tailwind
│   │   ├── auth/
│   │   │   └── login/page.tsx    # Login page
│   │   ├── dashboard/
│   │   │   ├── layout.tsx        # Dashboard layout (protected)
│   │   │   └── page.tsx          # Dashboard home
│   │   └── flows/
│   │       ├── layout.tsx        # Flows layout (protected)
│   │       └── page.tsx          # Flows list
│   ├── components/
│   │   ├── error-boundary.tsx    # Error boundary component
│   │   ├── layout/
│   │   │   └── dashboard-layout.tsx  # Dashboard layout with sidebar
│   │   └── ui/                   # Reusable UI components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       └── input.tsx
│   ├── lib/
│   │   ├── api-client.ts         # Axios client with error handling
│   │   └── utils.ts              # Utility functions (cn, formatDate)
│   ├── store/
│   │   └── auth-store.ts         # Zustand auth state management
│   └── types/
│       └── index.ts              # TypeScript type definitions
├── public/                        # Static assets
├── package.json                   # Dependencies
├── tsconfig.json                  # TypeScript config
├── tailwind.config.js             # Tailwind CSS config
├── next.config.js                 # Next.js config
├── Dockerfile                     # Docker configuration
└── .env.local                     # Environment variables
```

---

## 🔧 Key Technologies

| Technology | Purpose | Version |
|------------|---------|---------|
| Next.js | React framework with App Router | 14.1.0 |
| TypeScript | Type safety | 5.3.3 |
| Tailwind CSS | Styling | 3.4.1 |
| Axios | HTTP client | 1.6.5 |
| Zustand | State management | 4.5.0 |
| Radix UI | Accessible components | Latest |
| Lucide React | Icons | 0.314.0 |

---

## ⚙️ Configuration

### Environment Variables

Create `.env.local`:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
```

For production:
```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com
```

---

## 🛡️ Error Handling

### 1. Error Boundary
Catches React component errors and displays a fallback UI:

```tsx
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

### 2. API Error Handling
Automatic handling of:
- **Network errors** - "Network error. Please check your connection."
- **401 Unauthorized** - Auto-refresh token or redirect to login
- **4xx/5xx errors** - Display user-friendly error messages

Example:
```tsx
try {
  await api.post('/api/auth/login', credentials);
} catch (error) {
  if (error instanceof ApiError) {
    // error.status, error.message, error.data
    console.error('API Error:', error.message);
  }
}
```

### 3. Form Validation
Client-side validation before API calls:

```tsx
if (!formData.username || !formData.password) {
  setFormError('Please fill in all fields');
  return;
}
```

---

## 🎨 UI Components

### Button
```tsx
<Button variant="default" size="lg">Click Me</Button>
<Button variant="outline">Secondary</Button>
<Button variant="destructive">Delete</Button>
```

### Card
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
</Card>
```

### Input
```tsx
<Input
  type="text"
  placeholder="Enter text"
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>
```

---

## 🔒 Authentication Flow

### 1. Login
```tsx
const { login } = useAuthStore();
await login({ username, password });
// Stores: accessToken, refreshToken, user in localStorage
```

### 2. Protected Routes
```tsx
useEffect(() => {
  loadUser();
  if (!isAuthenticated) {
    router.push('/auth/login');
  }
}, [isAuthenticated]);
```

### 3. API Requests with Auth
```tsx
// Automatic - token added via interceptor
const data = await api.get('/api/protected-endpoint');
```

### 4. Token Refresh
- Automatic on 401 responses
- Falls back to login if refresh fails

### 5. Logout
```tsx
const { logout } = useAuthStore();
logout(); // Clears tokens and user data
router.push('/auth/login');
```

---

## 📱 Responsive Design

- **Mobile**: Single column layout, collapsible sidebar
- **Tablet**: Two column layout
- **Desktop**: Full layout with sidebar

Breakpoints (Tailwind):
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1400px

---

## 🧪 Development

### Available Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Type checking
npm run type-check

# Linting
npm run lint
```

### Hot Reload
Changes to `src/**` files automatically reload the page.

### Adding New Pages

1. Create file in `src/app/your-page/page.tsx`
2. Export default component
3. Add to navigation in `dashboard-layout.tsx`

Example:
```tsx
// src/app/analytics/page.tsx
export default function AnalyticsPage() {
  return <div>Analytics Page</div>;
}
```

---

## 🐛 Troubleshooting

### "Cannot connect to backend"

**Check:**
1. Backend is running: `curl http://localhost:3001/health`
2. Environment variable: `NEXT_PUBLIC_API_URL=http://localhost:3001`
3. CORS enabled in backend

### "Token expired" errors

- Refresh token should auto-renew
- If persists, logout and login again
- Check browser console for errors

### "Module not found" errors

```bash
# Clean install
rm -rf node_modules .next
npm install
```

### Styles not applying

```bash
# Restart dev server
npm run dev
```

---

## 🚀 Production Deployment

### Docker

```bash
# Build production image
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build frontend

# Run production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d frontend
```

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variable: `NEXT_PUBLIC_API_URL`
4. Deploy

### Manual

```bash
# Build
npm run build

# Start
npm start
```

---

## 🎯 Next Steps

### Coming in Phase 2-6:
- ✅ **Visual Flow Builder** - Drag-and-drop IVR flow editor
- ✅ **Real-time Analytics** - Call metrics and charts
- ✅ **Agent Management** - CRUD for agents
- ✅ **Queue Management** - Configure call queues
- ✅ **WebSocket Integration** - Live updates
- ✅ **Advanced Components** - Tables, modals, forms

---

## 📚 Additional Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Radix UI**: https://www.radix-ui.com/
- **Zustand**: https://zustand-demo.pmnd.rs/

---

## 💡 Pro Tips

1. **Use TypeScript** - Catch errors before runtime
2. **Error Boundaries** - Wrap components for safety
3. **Loading States** - Show spinners during API calls
4. **Optimistic Updates** - Update UI before API response
5. **Cache API Responses** - Reduce unnecessary requests
6. **Use React DevTools** - Debug component state
7. **Keep Components Small** - Single responsibility

---

**🎨 Your IVR Management UI is ready!**

Login at: http://localhost:3000
