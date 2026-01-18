# 🎉 Phase 2 Complete: IVR Engine Core

Phase 2 implementation is complete! The IVR flow execution engine is now fully functional with basic node types and state management.

---

## ✅ What Was Built

### Core Components

- ✅ **Abstract Node System** - Base class for all IVR nodes
- ✅ **Node Factory** - Creates node instances from configuration
- ✅ **Flow Execution Service** - Orchestrates flow execution
- ✅ **Call State Manager** - Redis-based state management
- ✅ **IVR Webhooks** - Exotel integration endpoints
- ✅ **Flow Management API** - CRUD operations for flows

### Basic Node Types Implemented

1. **Welcome Node** (`ivr-backend/src/ivr/nodes/types/welcome-node.ts`)
   - Entry point with greeting
   - Business hours checking
   - Multi-language support
   - TTS or pre-recorded audio

2. **Play Node** (`ivr-backend/src/ivr/nodes/types/play-node.ts`)
   - Audio playback or TTS
   - Loop support
   - Multi-language messages

3. **Menu Node** (`ivr-backend/src/ivr/nodes/types/menu-node.ts`)
   - DTMF input collection
   - Multiple menu options
   - Retry logic with max attempts
   - Invalid input handling
   - Timeout handling

4. **Hangup Node** (`ivr-backend/src/ivr/nodes/types/hangup-node.ts`)
   - Call termination
   - Optional goodbye message
   - Reason logging

---

## 📁 Files Created

### Node Types
```
ivr-backend/src/ivr/nodes/
├── types/
│   ├── abstract-node.ts           # Base class for all nodes ✅
│   ├── welcome-node.ts             # Welcome/greeting node ✅
│   ├── play-node.ts                # Audio playback node ✅
│   ├── menu-node.ts                # DTMF menu node ✅
│   └── hangup-node.ts              # Call termination node ✅
└── node-factory.ts                 # Node factory pattern ✅
```

### Execution Engine
```
ivr-backend/src/ivr/execution/
├── execution.service.ts            # Core flow executor ✅
└── state-manager.service.ts        # Redis state management ✅
```

### Controllers & Services
```
ivr-backend/src/ivr/
├── ivr.module.ts                   # IVR module ✅
├── ivr-webhooks.controller.ts      # Webhook endpoints ✅
└── flows/
    ├── flows.controller.ts         # Flow CRUD API ✅
    ├── flows.service.ts            # Flow management logic ✅
    └── dto/
        └── create-flow.dto.ts      # DTOs for flow operations ✅
```

### Sample Data
```
ivr-backend/prisma/
└── seed-flows.ts                   # Sample IVR flows ✅
```

---

## 🔄 How It Works

### Flow Execution Process

1. **Incoming Call**
   ```
   Exotel → POST /api/ivr/execute
   ↓
   FlowExecutionService.startFlowExecution()
   ↓
   Creates FlowExecution record in database
   ↓
   Creates CallState in Redis
   ↓
   Executes entry node
   ↓
   Returns XML response to Exotel
   ```

2. **DTMF Input Handling**
   ```
   User presses key → Exotel → POST /api/ivr/gather
   ↓
   FlowExecutionService.handleDtmfInput()
   ↓
   Loads call state from Redis
   ↓
   Finds matching connection
   ↓
   Executes target node
   ↓
   Returns XML response
   ```

3. **Node Execution**
   ```
   NodeFactory.createNode()
   ↓
   Node.execute(context)
   ↓
   Generates XML for Exotel
   ↓
   Updates call state
   ↓
   Logs node execution to database
   ```

4. **Call Completion**
   ```
   Call ends → Exotel → POST /api/ivr/callback/status
   ↓
   FlowExecutionService.handleCallCompleted()
   ↓
   Updates FlowExecution with duration
   ↓
   Deletes call state from Redis
   ```

---

## 🛡️ State Management

### Redis State Structure

**Call State Object:**
```typescript
interface CallState {
  executionId: number;          // Database execution ID
  flowId: number;               // Current flow ID
  callSid: string;              // Exotel call SID
  callerNumber: string;         // Caller's phone number
  calledNumber: string;         // Called (virtual) number
  currentNodeId: number;        // Current node in flow
  variables: Record<string, any>; // Call context variables
  startedAt: string;            // ISO timestamp
  lastActivity: string;         // Last interaction time
  status: 'active' | 'waiting_input' | 'completed' | 'failed';
}
```

**Redis Key Pattern:**
```
call:state:{callSid}
TTL: 3600 seconds (1 hour)
```

**State Operations:**
- `createCallState()` - Initialize state for new call
- `getCallState()` - Retrieve state by CallSid
- `updateCallState()` - Update state properties
- `updateVariables()` - Update context variables
- `deleteCallState()` - Clean up after call ends

---

## 📊 Database Schema

### New Tables

**FlowExecution** - Tracks call sessions
```sql
flow_executions (
  id, flow_id, call_sid, caller_number, called_number,
  current_node_id, status, started_at, ended_at,
  duration_seconds, context_variables, error_message
)
```

**NodeExecution** - Audit trail of node executions
```sql
node_executions (
  id, execution_id, node_id, node_type,
  entered_at, exited_at, status,
  input_data, output_data, error_message
)
```

---

## 🔌 API Endpoints

### IVR Webhooks (Exotel Integration)

**Execute Flow**
```
POST /api/ivr/execute
Body: { CallSid, From, To, CallStatus, Direction }
Response: XML (Exotel Passthru)
```

**Handle DTMF Input**
```
POST /api/ivr/gather
Body: { CallSid, Digits, From, To }
Response: XML (Exotel Passthru)
```

**Call Status Callback**
```
POST /api/ivr/callback/status
Body: { CallSid, CallStatus, CallDuration }
Response: { status: 'success' }
```

### Flow Management API

**Create Flow**
```
POST /api/ivr/flows
Headers: Authorization: Bearer <token>
Body: CreateFlowDto
Response: Created flow with nodes and connections
```

**Get All Flows**
```
GET /api/ivr/flows?status=published&flowType=inbound
Headers: Authorization: Bearer <token>
Response: Array of flows
```

**Get Flow by ID**
```
GET /api/ivr/flows/:id
Headers: Authorization: Bearer <token>
Response: Flow with nodes and connections
```

**Update Flow**
```
PUT /api/ivr/flows/:id
Headers: Authorization: Bearer <token>
Body: UpdateFlowDto
Response: Updated flow
```

**Publish Flow**
```
POST /api/ivr/flows/:id/publish
Headers: Authorization: Bearer <token>
Response: Published flow
```

**Delete Flow**
```
DELETE /api/ivr/flows/:id
Headers: Authorization: Bearer <token>
Response: { message: 'Flow deleted successfully' }
```

**Get Flow Statistics**
```
GET /api/ivr/flows/:id/stats
Headers: Authorization: Bearer <token>
Response: { totalExecutions, completedExecutions, failedExecutions, successRate, averageDuration }
```

---

## 🎨 Node Configuration Examples

### Welcome Node
```json
{
  "nodeType": "welcome",
  "name": "Welcome Message",
  "configuration": {
    "message": "Welcome to ABC Company.",
    "language": "en-IN",
    "voiceGender": "female",
    "checkBusinessHours": true,
    "businessHoursMessage": "We are currently closed."
  }
}
```

### Menu Node
```json
{
  "nodeType": "menu",
  "name": "Main Menu",
  "configuration": {
    "prompt": "Press 1 for sales, 2 for support, 9 for agent.",
    "timeout": 10,
    "numDigits": 1,
    "maxRetries": 3,
    "options": [
      { "digit": "1", "label": "Sales", "targetNodeId": 5 },
      { "digit": "2", "label": "Support", "targetNodeId": 6 },
      { "digit": "9", "label": "Agent", "targetNodeId": 7 }
    ]
  }
}
```

### Play Node
```json
{
  "nodeType": "play",
  "name": "Information Message",
  "configuration": {
    "message": "Please visit our website at www.example.com.",
    "language": "en-IN",
    "voiceGender": "male",
    "loop": 1
  }
}
```

### Hangup Node
```json
{
  "nodeType": "hangup",
  "name": "Goodbye",
  "configuration": {
    "message": "Thank you for calling. Goodbye!",
    "reason": "normal"
  }
}
```

---

## 🧪 Testing

### Sample Flows Created

1. **Customer Support Main Menu** (Published, Flow ID: 1)
   - Welcome message with business hours check
   - Main menu with 4 options (billing, tech support, general, agent)
   - Information messages for each option
   - Goodbye message

2. **Customer Satisfaction Survey** (Draft, Flow ID: 2)
   - Survey welcome
   - 1-5 rating menu
   - Thank you message

### Running Tests

**Seed Sample Flows:**
```bash
# Inside Docker container
docker-compose exec backend npm run prisma:seed-flows

# Or locally
cd ivr-backend
npm run prisma:seed-flows
```

**Test Flow Execution:**
```bash
# Simulate incoming call
curl -X POST http://localhost:3001/api/ivr/execute \
  -H "Content-Type: application/json" \
  -d '{
    "CallSid": "test-123",
    "From": "+919876543210",
    "To": "+911234567890",
    "CallStatus": "ringing"
  }'

# Expected: XML response with welcome message
```

**Test DTMF Input:**
```bash
curl -X POST http://localhost:3001/api/ivr/gather \
  -H "Content-Type: application/json" \
  -d '{
    "CallSid": "test-123",
    "Digits": "1",
    "From": "+919876543210",
    "To": "+911234567890"
  }'

# Expected: XML response for option 1 (billing)
```

**Check Call State in Redis:**
```bash
docker-compose exec redis redis-cli

# In redis-cli:
KEYS call:state:*
GET call:state:test-123
```

---

## 📊 Monitoring

### Check Active Calls

```typescript
// Using CallStateManager
const activeCount = await stateManager.getActiveCallCount();
const activeCalls = await stateManager.getActiveCallSids();
```

### View Flow Executions

```bash
# Open Prisma Studio
docker-compose exec backend npx prisma studio

# Navigate to:
# - flow_executions (call sessions)
# - node_executions (node audit trail)
```

### View Flow Statistics

```bash
curl -X GET http://localhost:3001/api/ivr/flows/1/stats \
  -H "Authorization: Bearer <your-token>"
```

---

## 🔧 Configuration

### Environment Variables

Add to `.env`:
```env
# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379

# Backend URL (for webhook callbacks)
BACKEND_URL=http://localhost:3001

# Or use ngrok URL for external Exotel webhooks
BACKEND_URL=https://your-ngrok-url.ngrok.io
```

### Exotel Webhook Configuration

Configure these webhook URLs in Exotel dashboard:

1. **Call Initiated:** `https://your-url.ngrok.io/api/ivr/execute`
2. **DTMF Collected:** `https://your-url.ngrok.io/api/ivr/gather`
3. **Call Status:** `https://your-url.ngrok.io/api/ivr/callback/status`

---

## 🎯 What's Next (Phase 3)

### Advanced Node Types (Weeks 7-8)

- **Queue Node** - Call queuing with hold music
- **Transfer Node** - Agent routing (round-robin, longest-idle)
- **Record Node** - Voicemail and recording
- **Decision Node** - Conditional routing
- **Gather Input Node** - Collect numeric input (PIN, account number)
- **API Integration Node** - External API calls

### Additional Features

- Queue management service
- Agent management service with routing
- Business hours service with holiday calendar
- Call recording integration
- Real-time queue status updates via WebSocket

---

## 📝 Documentation Links

- [Abstract Node Interface](./ivr-backend/src/ivr/nodes/types/abstract-node.ts)
- [Flow Execution Service](./ivr-backend/src/ivr/execution/execution.service.ts)
- [Call State Manager](./ivr-backend/src/ivr/execution/state-manager.service.ts)
- [IVR Webhooks Controller](./ivr-backend/src/ivr/ivr-webhooks.controller.ts)
- [Flows API](./ivr-backend/src/ivr/flows/flows.controller.ts)

---

## ✅ Verification Checklist

- [x] Abstract node system implemented
- [x] 4 basic node types created (Welcome, Play, Menu, Hangup)
- [x] Node factory with validation
- [x] Flow execution service
- [x] Redis state manager
- [x] Exotel webhook endpoints
- [x] Flow CRUD API
- [x] Sample flows seeded
- [x] XML generation for Exotel
- [x] Database logging of executions
- [x] Error handling at all levels
- [x] TypeScript types for all interfaces
- [x] Module integration in app.module.ts

---

## 🎊 Success!

Phase 2 is complete! The IVR engine core is fully functional with:
- ✅ 4 basic node types
- ✅ Flow execution engine
- ✅ State management with Redis
- ✅ Exotel integration
- ✅ Flow management API
- ✅ Sample flows for testing
- ✅ Comprehensive error handling

**Next:** Proceed to Phase 3 for advanced node types and queue management!
