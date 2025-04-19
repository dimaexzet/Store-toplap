// This file provides a way to access the Socket.io instance from other parts of the app
let io;

module.exports = {
  init: (httpServer) => {
    const { Server } = require('socket.io');
    
    // Create Socket.io server with HTTP polling only configuration
    io = new Server(httpServer, {
      cors: {
        origin: '*', // Allow all origins in development
        methods: ['GET', 'POST', 'OPTIONS'],
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization'],
      },
      path: '/api/socketio',
      transports: ['polling'], // Use only HTTP long-polling for more reliable connections
      connectTimeout: 45000,
      pingTimeout: 30000,
      pingInterval: 25000,
      maxHttpBufferSize: 1e8,
      allowUpgrades: false, // Disable transport upgrades to prevent WebSocket errors
      serveClient: false,
    });

    console.log('Socket.io server initialized with path: /api/socketio');
    console.log('Socket.io using transports: polling (WebSocket disabled)');
    
    // Add connection error logging
    io.engine.on('connection_error', (err) => {
      console.error('Socket.io connection error:', {
        message: err.message || 'Unknown error',
        code: err.code,
        context: err.context || {},
        req: err.req ? {
          url: err.req.url,
          method: err.req.method,
          headers: Object.keys(err.req.headers || {})
        } : 'No request'
      });
    });
    
    return io;
  },
  
  getIO: () => {
    if (!io) {
      throw new Error('Socket.io not initialized');
    }
    return io;
  }
}; 