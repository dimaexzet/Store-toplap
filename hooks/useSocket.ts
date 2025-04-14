'use client';

import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

// Enable/disable real-time features
const ENABLE_REALTIME = true; // Real-time notifications enabled
const POLLING_INTERVAL = 5000; // Poll for updates every 5 seconds

// Define a Product interface matching the expected structure
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number; // Using number instead of Decimal for client
  stock: number;
  categoryId: string;
  featured: boolean;
  imageUrl?: string;
  Image?: { id: string; url: string }[];
}

// Define an Order interface that matches the expected structure
export interface Order {
  id: string;
  status?: string;
  total?: number;
  paymentMethod?: string;
  trackingNumber?: string;
  items?: {
    id: string;
    productId: string;
    quantity: number;
    price: number;
  }[];
  [key: string]: any; // Allow for additional properties that might be needed
}

export type OrderNotification = {
  type: 'new' | 'update' | 'cancel';
  order: {
    id: string;
    status?: string;
    total?: number; // Ensure this is a number, not a Decimal
    [key: string]: any;
  };
  message: string;
  timestamp?: Date;
};

export type StockNotification = {
  product: Product;
  previousStock: number;
  newStock: number;
  timestamp: Date;
};

export type LowStockNotification = {
  product: Product;
  message: string;
  timestamp: Date;
};

// Mock data for testing UI when Socket.io is not working
const MOCK_ORDER_NOTIFICATIONS: OrderNotification[] = [
  {
    type: 'new',
    order: { id: 'mock-order-123' },
    message: 'New order received (mock)',
    timestamp: new Date()
  }
];

const MOCK_STOCK_NOTIFICATIONS: StockNotification[] = [
  {
    product: { 
      id: 'mock-product-1',
      name: 'Sample Product',
      description: 'Sample description',
      price: 29.99,
      stock: 5,
      categoryId: 'mock-category-1',
      featured: false
    },
    previousStock: 10,
    newStock: 5,
    timestamp: new Date()
  }
];

const MOCK_LOW_STOCK_NOTIFICATIONS: LowStockNotification[] = [
  {
    product: { 
      id: 'mock-product-2',
      name: 'Sample Product',
      description: 'Sample description',
      price: 49.99,
      stock: 3,
      categoryId: 'mock-category-1',
      featured: true
    },
    message: 'Low stock alert: Sample Product has only 3 items left (mock)',
    timestamp: new Date()
  }
];

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [orderNotifications, setOrderNotifications] = useState<OrderNotification[]>(
    ENABLE_REALTIME ? [] : MOCK_ORDER_NOTIFICATIONS
  );
  const [stockNotifications, setStockNotifications] = useState<StockNotification[]>(
    ENABLE_REALTIME ? [] : MOCK_STOCK_NOTIFICATIONS
  );
  const [lowStockNotifications, setLowStockNotifications] = useState<LowStockNotification[]>(
    ENABLE_REALTIME ? [] : MOCK_LOW_STOCK_NOTIFICATIONS
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ENABLE_REALTIME) {
      // Set up polling for notifications instead of WebSocket
      const pollInterval = setInterval(async () => {
        try {
          // Simulate connecting
          if (!isConnected) {
            setIsConnected(true);
            setError(null);
            console.log('Connected to simulated WebSocket service');
          }
          
          // In a real app, you would fetch new notifications here
          // For demonstration, we'll just use the existing state
        } catch (error) {
          console.error('Error polling for notifications:', error);
          setError(`Connection error: ${error instanceof Error ? error.message : String(error)}`);
          setIsConnected(false);
        }
      }, POLLING_INTERVAL);
      
      // Clean up on unmount
      return () => {
        clearInterval(pollInterval);
        setIsConnected(false);
      };
    } else {
      console.log('Real-time features are disabled, using mock data');
    }
  }, []);

  // Function to emit new order event using the REST API
  const emitNewOrder = useCallback(async (orderData: Order) => {
    if (!ENABLE_REALTIME) {
      console.log('Mocking new order emission:', orderData.id);
      // Ensure any Decimal values are converted to numbers
      const processedOrder = {
        ...orderData,
        total: orderData.total ? Number(orderData.total) : undefined
      };
      setOrderNotifications(prev => [{
        type: 'new' as const,
        order: processedOrder,
        message: `New order received: ${orderData.id} (mocked)`,
        timestamp: new Date()
      }, ...prev].slice(0, 10));
      return;
    }
    
    try {
      console.log('Sending new order event:', orderData.id);
      
      // Use the REST API instead of Socket.io
      const response = await fetch('/api/socketio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: 'new-order',
          payload: orderData
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send notification');
      }
      
      // Optimistically update the UI
      const processedOrder = {
        ...orderData,
        total: orderData.total ? Number(orderData.total) : undefined
      };
      
      setOrderNotifications(prev => [{
        type: 'new' as const,
        order: processedOrder,
        message: `New order received: ${orderData.id}`,
        timestamp: new Date()
      }, ...prev].slice(0, 10));
    } catch (error) {
      console.error('Error emitting new order:', error);
      setError(`Error sending order: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, []);

  // Function to emit stock update event
  const emitStockUpdate = useCallback(async (stockData: { product: Product; previousStock: number; newStock: number }) => {
    if (!ENABLE_REALTIME) {
      console.log('Mocking stock update emission:', stockData.product?.name);
      setStockNotifications(prev => [{
        product: stockData.product,
        previousStock: stockData.previousStock,
        newStock: stockData.newStock,
        timestamp: new Date()
      }, ...prev].slice(0, 10));
      return;
    }

    try {
      console.log('Sending stock update event:', stockData.product?.name);
      
      // Use the REST API instead of Socket.io
      const response = await fetch('/api/socketio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: 'stock-update',
          payload: stockData
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send stock update');
      }
      
      // Optimistically update the UI
      setStockNotifications(prev => [{
        product: stockData.product,
        previousStock: stockData.previousStock,
        newStock: stockData.newStock,
        timestamp: new Date()
      }, ...prev].slice(0, 10));
    } catch (error) {
      console.error('Error emitting stock update:', error);
      setError(`Error updating stock: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, []);

  // Function to emit low stock alert
  const emitLowStockAlert = useCallback(async (productData: Product) => {
    if (!ENABLE_REALTIME) {
      console.log('Mocking low stock alert:', productData.name);
      setLowStockNotifications(prev => [{
        product: productData,
        message: `Low stock alert: ${productData.name} has only ${productData.stock} items left (mocked)`,
        timestamp: new Date()
      }, ...prev].slice(0, 10));
      return;
    }

    try {
      console.log('Sending low stock alert:', productData.name);
      
      // Use the REST API instead of Socket.io
      const response = await fetch('/api/socketio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: 'low-stock-alert',
          payload: productData
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send low stock alert');
      }
      
      // Optimistically update the UI
      setLowStockNotifications(prev => [{
        product: productData,
        message: `Low stock alert: ${productData.name} has only ${productData.stock} items left`,
        timestamp: new Date()
      }, ...prev].slice(0, 10));
    } catch (error) {
      console.error('Error emitting low stock alert:', error);
      setError(`Error sending alert: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, []);

  // Clear notifications
  const clearOrderNotifications = useCallback(() => {
    setOrderNotifications([]);
  }, []);

  const clearStockNotifications = useCallback(() => {
    setStockNotifications([]);
  }, []);

  const clearLowStockNotifications = useCallback(() => {
    setLowStockNotifications([]);
  }, []);

  // Manually reconnect
  const reconnect = useCallback(() => {
    if (!ENABLE_REALTIME) return false;
    
    setIsConnected(false);
    
    // Simulate reconnection
    setTimeout(() => {
      setIsConnected(true);
      setError(null);
    }, 1000);
    
    return true;
  }, []);

  return {
    socket: null, // We don't have a real socket instance now
    isConnected: ENABLE_REALTIME ? isConnected : true, // Always show as connected in mock mode
    orderNotifications,
    stockNotifications,
    lowStockNotifications,
    emitNewOrder,
    emitStockUpdate,
    emitLowStockAlert,
    clearOrderNotifications,
    clearStockNotifications,
    clearLowStockNotifications,
    reconnect,
    error,
    isRealtime: ENABLE_REALTIME
  };
}; 