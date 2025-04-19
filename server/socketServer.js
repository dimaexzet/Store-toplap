const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const socketIo = require('./socketIo');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Create HTTP server
  const server = createServer((req, res) => {
    // Log socket-related requests for debugging
    if (req.url && req.url.includes('/socket')) {
      console.log(`[Socket.io] HTTP request: ${req.method} ${req.url}`);
    }

    // Handle all HTTP requests with Next.js
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Initialize Socket.io with improved configuration
  const io = socketIo.init(server);

  // Store connected admin users
  const adminUsers = new Set();

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Track connection status for debugging
    socket.on('disconnect', (reason) => {
      console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);
      if (adminUsers.has(socket.id)) {
        adminUsers.delete(socket.id);
      }
    });

    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.id}:`, error);
    });
    
    // Join admin room for notifications
    socket.on('join-admin', () => {
      console.log(`Admin joined: ${socket.id}`);
      socket.join('admin-room');
      adminUsers.add(socket.id);
      
      // Confirm join by sending back acknowledgment
      socket.emit('admin-joined', { status: 'success', socketId: socket.id });
    });
    
    // Handle new order notifications
    socket.on('new-order', (orderData) => {
      console.log('New order received:', orderData.id);
      io.to('admin-room').emit('order-notification', {
        type: 'new',
        order: orderData,
        message: 'New order received',
        timestamp: new Date(),
      });
    });
    
    // Handle stock updates
    socket.on('stock-update', (stockData) => {
      console.log('Stock updated:', stockData.product?.name);
      io.to('admin-room').emit('stock-notification', {
        product: stockData.product,
        previousStock: stockData.previousStock,
        newStock: stockData.newStock,
        timestamp: new Date(),
      });
    });
    
    // Handle low stock alerts
    socket.on('low-stock-alert', (productData) => {
      console.log('Low stock alert:', productData.name);
      io.to('admin-room').emit('low-stock-notification', {
        product: productData,
        message: `Low stock alert: ${productData.name} has only ${productData.stock} items left`,
        timestamp: new Date(),
      });
    });
  });

  // Get port from environment variable or default to 3000
  const port = process.env.PORT || 3000;

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Next.js server ready on http://localhost:${port}`);
    console.log(`> Socket.io server running on path: /api/socketio`);
    console.log(`> Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}); 