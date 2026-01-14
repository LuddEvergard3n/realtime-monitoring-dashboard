# Quick Start Guide

##  Get Running in 3 Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Mock WebSocket Server
Open a terminal and run:
```bash
npm run mock-server
```

Leave this running. It will generate events on `ws://localhost:8080`.

### 3. Start Dashboard
Open another terminal and run:
```bash
npm start
```

Navigate to `http://localhost:4200`

##  What You'll See

- **Live Events:** Real-time monitoring events streaming in
- **Metrics Panel:** Total events, rate per second, severity distribution
- **Filters:** Click severity/source checkboxes to filter events
- **Connection Status:** Top-right indicator shows WebSocket connection state

##  Run Tests

```bash
npm test
```

Tests validate:
- State immutability
- Filter correctness
- Metrics accuracy
- Backpressure enforcement

##  Adjust Event Rate

Edit `mock-server/websocket-server.js`:
```javascript
const EVENT_INTERVAL = 1000; // Change to 500 for faster events
```

Restart the mock server to see changes.

##  Troubleshooting

**Dashboard shows "Disconnected":**
- Ensure mock server is running on port 8080
- Check console for WebSocket errors

**No events appearing:**
- Verify mock server terminal shows event logs
- Check browser console for errors
- Try refreshing the page

**Port conflicts:**
- Change Angular port: `ng serve --port 4300`
- Change WebSocket port in both:
  - `mock-server/websocket-server.js` (line 13)
  - `src/app/core/services/websocket.service.ts` (line 37)

##  Next Steps

- Read full [README.md](./README.md) for architecture details
- Explore code comments (every file heavily documented)
- Run tests to see state management validation
- Experiment with filters and high-frequency events

Enjoy! 
