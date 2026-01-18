# Frontend Analytics Setup

## New Dependencies Added

The following dependencies have been added to `ivr-frontend/package.json` for analytics functionality:

```json
{
  "socket.io-client": "^4.6.0",
  "date-fns": "^3.2.0",
  "@radix-ui/react-tabs": "^1.0.4"
}
```

## Installation

To install the new dependencies:

```bash
cd ivr-frontend
npm install
```

## What Was Added

### 1. WebSocket Integration
- **socket.io-client**: Real-time communication with backend
- Location: Used in `src/lib/hooks/useWebSocket.ts`

### 2. Date Formatting
- **date-fns**: Date manipulation and formatting
- Location: Used in analytics components for date range filtering

### 3. UI Components
- **@radix-ui/react-tabs**: Accessible tabs component
- Location: Used in dashboard for Overview/History/Charts tabs

## New Files Created

### Hooks
- `src/lib/hooks/useWebSocket.ts` - WebSocket connection management

### API Services
- `src/lib/api/analytics.ts` - Analytics API client

### Components
- `src/components/analytics/MetricsCards.tsx`
- `src/components/analytics/CallHistoryTable.tsx`
- `src/components/analytics/CallMetricsCharts.tsx`

### UI Components
- `src/components/ui/tabs.tsx`
- `src/components/ui/table.tsx`

### Pages
- `src/app/dashboard/page.tsx` (updated)
- `src/app/analytics/page.tsx` (new)
- `src/app/analytics/layout.tsx` (new)

## Environment Variables

Ensure these are set in `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

## Running the Frontend

After installation:

```bash
npm run dev
```

The frontend will be available at http://localhost:3000

## Features Available

1. **Real-time Dashboard** (http://localhost:3000/dashboard)
   - Live metrics updating every 5 seconds
   - Connection status indicator
   - Latest call alerts
   - Queue and agent status cards

2. **Analytics Page** (http://localhost:3000/analytics)
   - Call metrics charts
   - Agent performance tracking
   - Date range filtering
   - CSV export

3. **Call History**
   - Searchable call table
   - Status filtering
   - Pagination
   - CSV export

## Verification

To verify everything is working:

1. Start backend: `cd ivr-backend && npm run start:dev`
2. Start frontend: `cd ivr-frontend && npm run dev`
3. Login at http://localhost:3000
4. Navigate to Dashboard
5. Check for green connection indicator (WebSocket connected)
6. Metrics should update automatically

## Troubleshooting

### WebSocket Not Connecting
- Check backend is running on port 3001
- Verify `NEXT_PUBLIC_WS_URL` in `.env.local`
- Check browser console for connection errors

### Charts Not Rendering
- Ensure Recharts is installed: `npm list recharts`
- Check browser console for errors
- Verify backend analytics endpoints are working

### Dependencies Installation Fails
- Clear node_modules: `rm -rf node_modules package-lock.json`
- Reinstall: `npm install`
- Check Node.js version: `node -v` (should be v20+)

## Next Steps

After successful installation:
1. Seed production data: `cd ivr-backend && npm run prisma:seed-production`
2. Test with Exotel API
3. Customize dashboard metrics
4. Add custom analytics queries

---

**Status**: ✅ Ready to use
**Last Updated**: January 17, 2026
