import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Initialize prisma client
const prisma = new PrismaClient();

/**
 * Health check endpoint that verifies:
 * 1. API is responding
 * 2. Database connection is working
 * 3. Returns system metrics
 */
export async function GET() {
  try {
    // Check database connection
    const dbStatus = await checkDatabase();
    
    // Get memory usage
    const memoryUsage = process.memoryUsage();
    
    // Get uptime
    const uptime = process.uptime();
    
    // Prepare response
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || 'unknown',
      environment: process.env.NODE_ENV,
      database: dbStatus,
      system: {
        uptime: uptime,
        memory: {
          rss: formatBytes(memoryUsage.rss),
          heapTotal: formatBytes(memoryUsage.heapTotal),
          heapUsed: formatBytes(memoryUsage.heapUsed),
        },
        node: process.version,
      }
    };
    
    return NextResponse.json(healthData, { status: 200 });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

/**
 * Check database connection by running a simple query
 */
async function checkDatabase() {
  try {
    // Simple query to check database connection
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const endTime = Date.now();
    
    return {
      status: 'connected',
      responseTime: `${endTime - startTime}ms`,
    };
  } catch (error) {
    console.error('Database health check failed:', error);
    
    return {
      status: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown database error',
    };
  }
}

/**
 * Format bytes to a human-readable string
 */
function formatBytes(bytes: number) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
} 