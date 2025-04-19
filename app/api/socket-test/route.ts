import { NextResponse } from 'next/server';

// This endpoint is just for testing socket connections
export async function GET() {
  try {
    // Get information about the server environment
    const serverInfo = {
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development',
      socketConfig: {
        path: '/api/socketio',
        transport: 'polling', // Using HTTP polling, not WebSocket
        corsEnabled: true
      }
    };
    
    return NextResponse.json({ 
      status: 'success',
      message: 'Socket.io server should be running on /api/socketio path using HTTP polling',
      time: new Date().toISOString(),
      serverInfo
    });
  } catch (error) {
    console.error('Socket test error:', error);
    return NextResponse.json({ 
      error: 'Failed to test socket connection',
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
} 