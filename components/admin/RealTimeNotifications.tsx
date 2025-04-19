'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Bell, Package, ShoppingCart, AlertTriangle, RefreshCw, AlertCircle, PlusCircle } from 'lucide-react';
import { useSocket, Order } from '@/hooks/useSocket';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { formatDistance } from 'date-fns';

export default function RealTimeNotifications() {
  const { 
    socket,
    isConnected, 
    orderNotifications, 
    stockNotifications, 
    lowStockNotifications,
    clearOrderNotifications,
    clearStockNotifications,
    clearLowStockNotifications,
    reconnect,
    error,
    isRealtime,
    emitNewOrder
  } = useSocket();
  
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Handle manual reconnection
  const handleReconnect = () => {
    if (!socket) return;
    
    setIsLoading(true);
    toast({
      title: 'Reconnecting',
      description: 'Attempting to reconnect to notification server...',
    });
    
    try {
      const success = reconnect();
      
      if (!success) {
        toast({
          title: 'Reconnection Failed',
          description: 'Could not initiate reconnection. Please refresh the page.',
          variant: 'destructive',
        });
        setIsLoading(false);
      } else {
        // Success will be determined by the connect event
        setTimeout(() => setIsLoading(false), 4000);
      }
    } catch (error) {
      console.error('Error during reconnect handler:', error);
      toast({
        title: 'Reconnection Error',
        description: 'An error occurred while trying to reconnect.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  // Test function to generate a notification
  const triggerTestNotification = () => {
    const testOrder: Order = {
      id: `test-${Math.random().toString(36).substring(2, 10)}`,
      status: 'PENDING',
      total: 199.99
    };
    
    emitNewOrder(testOrder);
    toast({
      title: 'Test Notification',
      description: 'A test notification has been sent',
    });
  };

  useEffect(() => {
    // Show toast when connection status changes
    if (isConnected && isRealtime) {
      toast({
        title: 'Connected',
        description: 'Now receiving real-time updates',
        variant: 'default',
      });
    }
  }, [isConnected, toast, isRealtime]);

  useEffect(() => {
    // Show toast when there's a socket error
    if (error) {
      toast({
        title: 'Connection Issue',
        description: error,
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  useEffect(() => {
    // Show toast when new order notification arrives
    if (orderNotifications.length > 0) {
      const latestNotification = orderNotifications[0];
      toast({
        title: 'New Order',
        description: latestNotification.message,
        variant: 'default',
      });
    }
  }, [orderNotifications, toast]);

  useEffect(() => {
    // Show toast when stock falls below threshold
    if (lowStockNotifications.length > 0) {
      const latestNotification = lowStockNotifications[0];
      toast({
        title: 'Low Stock Alert',
        description: latestNotification.message,
        variant: 'destructive',
      });
    }
  }, [lowStockNotifications, toast]);

  // Get the connection status badge
  const getConnectionBadge = () => {
    if (!isRealtime) {
      return (
        <Badge variant="outline" className="ml-2 bg-yellow-100 text-yellow-800">
          Mock Mode
        </Badge>
      );
    }
    
    if (error) {
      return (
        <Badge variant="outline" className="ml-2 bg-orange-100 text-orange-800">
          Error
        </Badge>
      );
    }
    
    if (isConnected) {
      return (
        <Badge variant="outline" className="ml-2 bg-green-100 text-green-800">
          Connected
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="ml-2 bg-red-100 text-red-800">
        Disconnected
      </Badge>
    );
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">
          Real-time Updates
          {getConnectionBadge()}
        </CardTitle>
        <div className="flex items-center space-x-2">
          {error && (
            <div title={error} className="relative">
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </div>
          )}
          {!isRealtime && (
            <span className="text-xs text-muted-foreground mr-2">Demo Mode (Socket.io disabled)</span>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={triggerTestNotification}
            className="h-8 w-8"
            title="Generate test notification"
          >
            <PlusCircle className="h-4 w-4" />
            <span className="sr-only">Test Notification</span>
          </Button>
          {!isConnected && isRealtime && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleReconnect}
              disabled={isLoading}
              className="h-8 w-8"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="sr-only">Reconnect</span>
            </Button>
          )}
          <Bell className={isConnected || !isRealtime ? 'text-green-500' : 'text-gray-400'} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Order Notifications */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium flex items-center">
              <ShoppingCart className="h-4 w-4 mr-1" /> Order Activity
            </h3>
            {orderNotifications.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearOrderNotifications}
                className="h-8 text-xs"
              >
                Clear
              </Button>
            )}
          </div>
          <ScrollArea className="h-28 rounded-md border">
            {orderNotifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No recent order activity
              </div>
            ) : (
              <div className="p-4">
                {orderNotifications.map((notification, i) => (
                  <div 
                    key={i} 
                    className="py-2 border-b last:border-0 text-sm"
                  >
                    <div className="font-medium">{notification.message}</div>
                    <div className="text-xs text-muted-foreground">
                      {notification.type === 'new' ? 'New order' : 'Order updated'} - Order #{notification.order?.id?.slice(0, 8) || 'Unknown'}
                    </div>
                    {notification.timestamp && (
                      <div className="text-xs text-muted-foreground">
                        {formatDistance(new Date(notification.timestamp), new Date(), { addSuffix: true })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Stock Updates */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium flex items-center">
              <Package className="h-4 w-4 mr-1" /> Stock Updates
            </h3>
            {stockNotifications.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearStockNotifications}
                className="h-8 text-xs"
              >
                Clear
              </Button>
            )}
          </div>
          <ScrollArea className="h-28 rounded-md border">
            {stockNotifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No recent stock updates
              </div>
            ) : (
              <div className="p-4">
                {stockNotifications.map((notification, i) => (
                  <div 
                    key={i} 
                    className="py-2 border-b last:border-0 text-sm"
                  >
                    <div className="font-medium">
                      Stock updated for {notification.product?.name || 'Unknown product'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {notification.previousStock} → {notification.newStock} units
                    </div>
                    {notification.timestamp && (
                      <div className="text-xs text-muted-foreground">
                        {formatDistance(new Date(notification.timestamp), new Date(), { addSuffix: true })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Low Stock Alerts */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium flex items-center">
              <AlertTriangle className="h-4 w-4 mr-1" /> Low Stock Alerts
            </h3>
            {lowStockNotifications.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearLowStockNotifications}
                className="h-8 text-xs"
              >
                Clear
              </Button>
            )}
          </div>
          <ScrollArea className="h-28 rounded-md border">
            {lowStockNotifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No low stock alerts
              </div>
            ) : (
              <div className="p-4">
                {lowStockNotifications.map((notification, i) => (
                  <div 
                    key={i} 
                    className="py-2 border-b last:border-0 text-sm"
                  >
                    <div className="font-medium text-red-600">
                      {notification.message}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Current stock: {notification.product?.stock || 0} units
                    </div>
                    {notification.timestamp && (
                      <div className="text-xs text-muted-foreground">
                        {formatDistance(new Date(notification.timestamp), new Date(), { addSuffix: true })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
} 