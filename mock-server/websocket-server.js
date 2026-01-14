/**
 * Mock WebSocket server for testing the dashboard.
 * 
 * Purpose:
 * - Simulate real-time event stream
 * - Generate random monitoring events
 * - Test dashboard under various load conditions
 * 
 * Features:
 * - Configurable event rate
 * - Random severity distribution
 * - Multiple event sources
 * - Realistic message patterns
 * 
 * Usage:
 * node mock-server/websocket-server.js
 */

const WebSocket = require('ws');

// Server configuration
const PORT = 8080;
const EVENT_INTERVAL = 1000; // Send event every N milliseconds (adjust for load testing)

// Event templates for realistic messages
const EVENT_TEMPLATES = {
  INFO: [
    'User authentication successful',
    'Database connection pool initialized',
    'Cache updated successfully',
    'API request completed',
    'Background job started',
    'Health check passed',
    'Configuration loaded',
    'Service started successfully'
  ],
  WARNING: [
    'High memory usage detected',
    'Slow database query detected',
    'API rate limit approaching',
    'Disk space running low',
    'Deprecated API endpoint used',
    'Connection pool near capacity',
    'Cache miss rate elevated',
    'Response time increased'
  ],
  ERROR: [
    'Database connection failed',
    'Authentication token expired',
    'API request timeout',
    'File system permission denied',
    'External service unavailable',
    'Invalid configuration detected',
    'Memory allocation failed',
    'Network connection lost'
  ]
};

// Simulated service sources
const SOURCES = [
  'api-gateway',
  'auth-service',
  'database',
  'cache-server',
  'payment-processor',
  'notification-service',
  'analytics-engine',
  'file-storage'
];

/**
 * Generate random monitoring event.
 * 
 * Algorithm:
 * 1. Random severity with weighted distribution
 * 2. Random source from available services
 * 3. Select message template based on severity
 * 4. Generate unique ID and timestamp
 * 
 * Distribution weights:
 * - INFO: 70%
 * - WARNING: 20%
 * - ERROR: 10%
 * 
 * This mimics realistic production systems where
 * most events are informational, some are warnings,
 * and errors are relatively rare.
 */
function generateEvent() {
  // Weighted random severity selection
  const rand = Math.random();
  let severity;
  
  if (rand < 0.7) {
    severity = 'INFO';
  } else if (rand < 0.9) {
    severity = 'WARNING';
  } else {
    severity = 'ERROR';
  }
  
  // Random source selection
  const source = SOURCES[Math.floor(Math.random() * SOURCES.length)];
  
  // Random message template
  const templates = EVENT_TEMPLATES[severity];
  const message = templates[Math.floor(Math.random() * templates.length)];
  
  // Generate event object
  return {
    id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    source: source,
    message: message,
    severity: severity
  };
}

/**
 * WebSocket server initialization.
 */
const wss = new WebSocket.Server({ port: PORT });

console.log(`WebSocket server running on ws://localhost:${PORT}`);
console.log(`Sending events every ${EVENT_INTERVAL}ms`);
console.log('---');

/**
 * Handle client connections.
 * 
 * Flow:
 * 1. Client connects
 * 2. Start sending events at configured interval
 * 3. Handle client disconnection cleanup
 */
wss.on('connection', (ws) => {
  console.log('Client connected');
  
  // Event generation interval
  const intervalId = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      const event = generateEvent();
      
      // Send event as JSON string
      ws.send(JSON.stringify(event));
      
      // Log for debugging
      console.log(`[${event.severity}] ${event.source}: ${event.message}`);
    }
  }, EVENT_INTERVAL);
  
  // Cleanup on disconnection
  ws.on('close', () => {
    console.log('Client disconnected');
    clearInterval(intervalId);
  });
  
  // Error handling
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clearInterval(intervalId);
  });
});

/**
 * Server error handling.
 */
wss.on('error', (error) => {
  console.error('Server error:', error);
});

/**
 * Graceful shutdown.
 */
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  wss.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
