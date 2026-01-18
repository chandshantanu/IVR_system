#!/usr/bin/env node
/**
 * Mock Backend Server for Testing Frontend
 * Runs on port 3001 and provides basic auth endpoints
 */

const http = require('http');

const PORT = 3001;

// Mock user database
const MOCK_USER = {
  id: 1,
  username: 'admin',
  email: 'admin@example.com',
  password: 'admin123', // In real app, this would be hashed
  role: 'admin',
  fullName: 'Admin User',
};

// Mock flows database
let flowsDb = [
  {
    id: 1,
    name: 'Complete IVR Flow',
    description: 'Full IVR flow with business hours, language selection, and department routing',
    status: 'published',
    version: 1,
    isPublished: true,
    nodes: [
      // Start node
      {
        id: 'node_1',
        type: 'welcome',
        position: { x: 50, y: 50 },
        data: {
          label: 'Start',
          subtitle: 'Call initiated',
          config: {
            message: 'Thank you for calling',
            language: 'en'
          }
        }
      },
      // Check Business Hours
      {
        id: 'node_2',
        type: 'decision',
        position: { x: 250, y: 50 },
        data: {
          label: 'Check Business Hours',
          subtitle: 'Mon-Fri 9AM-6PM',
          config: {
            condition: 'business_hours',
            operator: 'equals',
            value: 'true'
          }
        }
      },
      // After Hours Path
      {
        id: 'node_3',
        type: 'play',
        position: { x: 250, y: 180 },
        data: {
          label: 'After Hours Message',
          subtitle: 'We are closed',
          config: {
            message: 'We are currently closed. Our business hours are Monday to Friday, 9 AM to 6 PM.',
            type: 'tts'
          }
        }
      },
      {
        id: 'node_4',
        type: 'record',
        position: { x: 250, y: 300 },
        data: {
          label: 'Record Voicemail',
          subtitle: 'Leave a message',
          config: {
            maxDuration: 180,
            playBeep: true
          }
        }
      },
      {
        id: 'node_5',
        type: 'hangup',
        position: { x: 250, y: 420 },
        data: {
          label: 'Hangup',
          subtitle: 'End call',
          config: {
            reason: 'completed'
          }
        }
      },
      // Business Hours Path - Language Selection
      {
        id: 'node_6',
        type: 'menu',
        position: { x: 500, y: 50 },
        data: {
          label: 'Language Selection',
          subtitle: 'Press 1 for English, 2 for Hindi',
          config: {
            timeout: 10,
            maxRetries: 3,
            options: [
              { key: '1', label: 'English' },
              { key: '2', label: 'Hindi' }
            ]
          }
        }
      },
      // Welcome Message
      {
        id: 'node_7',
        type: 'play',
        position: { x: 750, y: 50 },
        data: {
          label: 'Welcome Message',
          subtitle: 'Welcome to our service',
          config: {
            message: 'Welcome to our customer service. Please listen to the following options.',
            type: 'tts'
          }
        }
      },
      // Main Menu
      {
        id: 'node_8',
        type: 'menu',
        position: { x: 1000, y: 50 },
        data: {
          label: 'Main Menu',
          subtitle: '1:Sales 2:Support 3:Billing',
          config: {
            timeout: 10,
            maxRetries: 3,
            options: [
              { key: '1', label: 'Sales Department' },
              { key: '2', label: 'Technical Support' },
              { key: '3', label: 'Billing & Accounts' },
              { key: '4', label: 'General Inquiries' },
              { key: '0', label: 'Operator' }
            ]
          }
        }
      },
      // Option 1 - Sales Path
      {
        id: 'node_9',
        type: 'queue',
        position: { x: 1300, y: 50 },
        data: {
          label: 'Sales Queue',
          subtitle: 'Please hold',
          config: {
            queueName: 'sales',
            maxWaitTime: 300,
            musicUrl: 'https://example.com/hold-music.mp3'
          }
        }
      },
      {
        id: 'node_10',
        type: 'transfer',
        position: { x: 1550, y: 50 },
        data: {
          label: 'Transfer to Sales',
          subtitle: 'Connecting...',
          config: {
            destination: '+919876543210',
            strategy: 'round_robin'
          }
        }
      },
      {
        id: 'node_11',
        type: 'hangup',
        position: { x: 1800, y: 50 },
        data: {
          label: 'End Call',
          subtitle: 'Call completed',
          config: {
            reason: 'completed'
          }
        }
      },
      // Option 2 - Support Path
      {
        id: 'node_12',
        type: 'queue',
        position: { x: 1300, y: 200 },
        data: {
          label: 'Support Queue',
          subtitle: 'Please hold',
          config: {
            queueName: 'support',
            maxWaitTime: 300,
            musicUrl: 'https://example.com/hold-music.mp3'
          }
        }
      },
      {
        id: 'node_13',
        type: 'transfer',
        position: { x: 1550, y: 200 },
        data: {
          label: 'Transfer to Support',
          subtitle: 'Connecting...',
          config: {
            destination: '+919876543211',
            strategy: 'longest_idle'
          }
        }
      },
      {
        id: 'node_14',
        type: 'hangup',
        position: { x: 1800, y: 200 },
        data: {
          label: 'End Call',
          subtitle: 'Call completed',
          config: {
            reason: 'completed'
          }
        }
      },
      // Option 3 - Billing Path
      {
        id: 'node_15',
        type: 'queue',
        position: { x: 1300, y: 350 },
        data: {
          label: 'Billing Queue',
          subtitle: 'Please hold',
          config: {
            queueName: 'billing',
            maxWaitTime: 300,
            musicUrl: 'https://example.com/hold-music.mp3'
          }
        }
      },
      {
        id: 'node_16',
        type: 'transfer',
        position: { x: 1550, y: 350 },
        data: {
          label: 'Transfer to Billing',
          subtitle: 'Connecting...',
          config: {
            destination: '+919876543212',
            strategy: 'round_robin'
          }
        }
      },
      {
        id: 'node_17',
        type: 'hangup',
        position: { x: 1800, y: 350 },
        data: {
          label: 'End Call',
          subtitle: 'Call completed',
          config: {
            reason: 'completed'
          }
        }
      },
      // Option 4 - General Inquiries Path
      {
        id: 'node_18',
        type: 'queue',
        position: { x: 1300, y: 500 },
        data: {
          label: 'General Queue',
          subtitle: 'Please hold',
          config: {
            queueName: 'general',
            maxWaitTime: 300,
            musicUrl: 'https://example.com/hold-music.mp3'
          }
        }
      },
      {
        id: 'node_19',
        type: 'transfer',
        position: { x: 1550, y: 500 },
        data: {
          label: 'Transfer to Agent',
          subtitle: 'Connecting...',
          config: {
            destination: '+919876543213',
            strategy: 'random'
          }
        }
      },
      {
        id: 'node_20',
        type: 'hangup',
        position: { x: 1800, y: 500 },
        data: {
          label: 'End Call',
          subtitle: 'Call completed',
          config: {
            reason: 'completed'
          }
        }
      },
      // Option 0 - Operator Path
      {
        id: 'node_21',
        type: 'transfer',
        position: { x: 1300, y: 650 },
        data: {
          label: 'Transfer to Operator',
          subtitle: 'Direct transfer',
          config: {
            destination: '+919876543200',
            strategy: 'round_robin'
          }
        }
      },
      {
        id: 'node_22',
        type: 'hangup',
        position: { x: 1550, y: 650 },
        data: {
          label: 'End Call',
          subtitle: 'Call completed',
          config: {
            reason: 'completed'
          }
        }
      }
    ],
    edges: [
      // Start → Business Hours Check
      { id: 'e1', source: 'node_1', target: 'node_2' },

      // Business Hours → After Hours Path
      { id: 'e2', source: 'node_2', target: 'node_3', sourceHandle: 'false', label: 'Closed' },
      { id: 'e3', source: 'node_3', target: 'node_4' },
      { id: 'e4', source: 'node_4', target: 'node_5' },

      // Business Hours → Language Selection
      { id: 'e5', source: 'node_2', target: 'node_6', sourceHandle: 'true', label: 'Open' },

      // Language Selection → Welcome → Main Menu
      { id: 'e6', source: 'node_6', target: 'node_7' },
      { id: 'e7', source: 'node_7', target: 'node_8' },

      // Main Menu → Sales (Option 1)
      { id: 'e8', source: 'node_8', target: 'node_9', sourceHandle: '1', label: 'Sales' },
      { id: 'e9', source: 'node_9', target: 'node_10' },
      { id: 'e10', source: 'node_10', target: 'node_11' },

      // Main Menu → Support (Option 2)
      { id: 'e11', source: 'node_8', target: 'node_12', sourceHandle: '2', label: 'Support' },
      { id: 'e12', source: 'node_12', target: 'node_13' },
      { id: 'e13', source: 'node_13', target: 'node_14' },

      // Main Menu → Billing (Option 3)
      { id: 'e14', source: 'node_8', target: 'node_15', sourceHandle: '3', label: 'Billing' },
      { id: 'e15', source: 'node_15', target: 'node_16' },
      { id: 'e16', source: 'node_16', target: 'node_17' },

      // Main Menu → General (Option 4)
      { id: 'e17', source: 'node_8', target: 'node_18', sourceHandle: '4', label: 'General' },
      { id: 'e18', source: 'node_18', target: 'node_19' },
      { id: 'e19', source: 'node_19', target: 'node_20' },

      // Main Menu → Operator (Option 0)
      { id: 'e20', source: 'node_8', target: 'node_21', sourceHandle: '0', label: 'Operator' },
      { id: 'e21', source: 'node_21', target: 'node_22' }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'Sales',
    description: 'Sales inquiry flow',
    status: 'draft',
    version: 1,
    isPublished: false,
    nodes: [],
    edges: [],
    createdAt: new Date().toISOString(),
  },
];

let nextFlowId = 3;

// Generate mock JWT token
function generateMockToken(user) {
  const payload = JSON.stringify({
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  });
  return Buffer.from(payload).toString('base64');
}

// CORS headers
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

// Parse JSON body
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
  });
}

// Send JSON response
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// Request handler
const server = http.createServer(async (req, res) => {
  setCorsHeaders(res);

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = req.url;
  const method = req.method;

  console.log(`[${new Date().toISOString()}] ${method} ${url}`);

  try {
    // Health check
    if (url === '/health' || url === '/api/health') {
      sendJson(res, 200, {
        status: 'ok',
        message: 'Mock backend is running',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Login
    if (url === '/api/auth/login' && method === 'POST') {
      const body = await parseBody(req);
      const { username, password } = body;

      console.log('Login attempt:', { username, password });

      if (username === MOCK_USER.username && password === MOCK_USER.password) {
        const token = generateMockToken(MOCK_USER);
        const refreshToken = generateMockToken({ ...MOCK_USER, type: 'refresh' });

        sendJson(res, 200, {
          message: 'Login successful',
          user: {
            id: MOCK_USER.id,
            username: MOCK_USER.username,
            email: MOCK_USER.email,
            role: MOCK_USER.role,
            fullName: MOCK_USER.fullName,
          },
          token,
          refreshToken,
        });
        console.log('✅ Login successful for:', username);
      } else {
        sendJson(res, 401, {
          statusCode: 401,
          message: 'Invalid credentials',
          error: 'Unauthorized',
        });
        console.log('❌ Login failed for:', username);
      }
      return;
    }

    // Register
    if (url === '/api/auth/register' && method === 'POST') {
      const body = await parseBody(req);
      const { username, email, password } = body;

      sendJson(res, 201, {
        message: 'User registered successfully',
        user: {
          id: 2,
          username,
          email,
          role: 'user',
        },
      });
      console.log('✅ User registered:', username);
      return;
    }

    // Get current user
    if (url === '/api/auth/me' && method === 'GET') {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        sendJson(res, 401, {
          statusCode: 401,
          message: 'Unauthorized',
          error: 'Unauthorized',
        });
        return;
      }

      sendJson(res, 200, {
        id: MOCK_USER.id,
        username: MOCK_USER.username,
        email: MOCK_USER.email,
        role: MOCK_USER.role,
        fullName: MOCK_USER.fullName,
      });
      return;
    }

    // Dashboard metrics
    if (url === '/api/analytics/dashboard' && method === 'GET') {
      sendJson(res, 200, {
        activeCalls: 3,
        callsInQueue: 2,
        availableAgents: 5,
        totalAgents: 8,
        averageWaitTime: 45,
        callsToday: 127,
        successRate: 94.5,
        peakHours: ['10:00', '14:00', '16:00'],
      });
      return;
    }

    // Call history
    if (url.startsWith('/api/analytics/calls') && method === 'GET') {
      sendJson(res, 200, {
        calls: [
          {
            id: 1,
            callSid: 'CALL-12345',
            flow: { id: 1, name: 'Customer Support' },
            callerNumber: '+919876543210',
            status: 'completed',
            startedAt: new Date().toISOString(),
            durationSeconds: 120,
          },
          {
            id: 2,
            callSid: 'CALL-12346',
            flow: { id: 2, name: 'Sales' },
            callerNumber: '+919876543211',
            status: 'in_progress',
            startedAt: new Date().toISOString(),
            durationSeconds: null,
          },
        ],
        total: 2,
      });
      return;
    }

    // List flows
    if (url === '/api/ivr/flows' && method === 'GET') {
      sendJson(res, 200, flowsDb);
      return;
    }

    // Get single flow
    if (url.match(/^\/api\/ivr\/flows\/\d+$/) && method === 'GET') {
      const flowId = parseInt(url.split('/').pop());
      const flow = flowsDb.find(f => f.id === flowId);
      if (flow) {
        sendJson(res, 200, flow);
      } else {
        sendJson(res, 404, {
          statusCode: 404,
          message: 'Flow not found',
        });
      }
      return;
    }

    // Create flow
    if (url === '/api/ivr/flows' && method === 'POST') {
      const body = await parseBody(req);
      const newFlow = {
        id: nextFlowId++,
        name: body.name || 'Untitled Flow',
        description: body.description || '',
        status: 'draft',
        version: 1,
        isPublished: false,
        nodes: body.nodes || [],
        edges: body.edges || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      flowsDb.push(newFlow);
      sendJson(res, 201, newFlow);
      console.log('✅ Created flow:', newFlow.name);
      return;
    }

    // Update flow
    if (url.match(/^\/api\/ivr\/flows\/\d+$/) && method === 'PUT') {
      const flowId = parseInt(url.split('/').pop());
      const body = await parseBody(req);
      const flowIndex = flowsDb.findIndex(f => f.id === flowId);

      if (flowIndex !== -1) {
        flowsDb[flowIndex] = {
          ...flowsDb[flowIndex],
          name: body.name || flowsDb[flowIndex].name,
          description: body.description || flowsDb[flowIndex].description,
          nodes: body.nodes || flowsDb[flowIndex].nodes,
          edges: body.edges || flowsDb[flowIndex].edges,
          updatedAt: new Date().toISOString(),
        };
        sendJson(res, 200, flowsDb[flowIndex]);
        console.log('✅ Updated flow:', flowsDb[flowIndex].name);
      } else {
        sendJson(res, 404, {
          statusCode: 404,
          message: 'Flow not found',
        });
      }
      return;
    }

    // Delete flow
    if (url.match(/^\/api\/ivr\/flows\/\d+$/) && method === 'DELETE') {
      const flowId = parseInt(url.split('/').pop());
      const flowIndex = flowsDb.findIndex(f => f.id === flowId);

      if (flowIndex !== -1) {
        const deletedFlow = flowsDb.splice(flowIndex, 1)[0];
        sendJson(res, 200, {
          message: 'Flow deleted successfully',
          flow: deletedFlow,
        });
        console.log('✅ Deleted flow:', deletedFlow.name);
      } else {
        sendJson(res, 404, {
          statusCode: 404,
          message: 'Flow not found',
        });
      }
      return;
    }

    // 404 for everything else
    sendJson(res, 404, {
      statusCode: 404,
      message: 'Not Found',
      error: 'Not Found',
      path: url,
    });

  } catch (error) {
    console.error('Error:', error);
    sendJson(res, 500, {
      statusCode: 500,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

server.listen(PORT, () => {
  console.log('\n');
  console.log('🚀 Mock Backend Server Started');
  console.log('================================');
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🔓 Test Credentials:`);
  console.log(`   Username: admin`);
  console.log(`   Password: admin123`);
  console.log('================================');
  console.log('');
  console.log('Available endpoints:');
  console.log('  POST   /api/auth/login');
  console.log('  POST   /api/auth/register');
  console.log('  GET    /api/auth/me');
  console.log('  GET    /api/analytics/dashboard');
  console.log('  GET    /api/analytics/calls');
  console.log('  GET    /api/ivr/flows');
  console.log('  GET    /health');
  console.log('');
  console.log('Press Ctrl+C to stop');
  console.log('');
});

// Handle shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down mock backend server...\n');
  server.close(() => {
    console.log('✅ Server stopped\n');
    process.exit(0);
  });
});
