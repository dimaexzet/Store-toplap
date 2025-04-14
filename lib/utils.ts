import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Order, Product } from '@/hooks/useSocket'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
  }).format(price)
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

// Socket Event Utilities for Orders and Stock
export async function emitOrderCreatedEvent(order: Order) {
  try {
    // The actual emission happens on the client side through the useSocket hook
    // This is just a server-side utility to trigger the initialization
    console.log("Order created event triggered");
    return true;
  } catch (error) {
    console.error('Failed to emit order created event:', error);
    return false;
  }
}

export async function emitStockUpdatedEvent(product: Product, previousStock: number, newStock: number) {
  try {
    // The actual emission happens on the client side through the useSocket hook
    // This is just a server-side utility to trigger the initialization
    console.log(`Stock updated event triggered for ${product.name}: ${previousStock} -> ${newStock}`);
    return true;
  } catch (error) {
    console.error('Failed to emit stock updated event:', error);
    return false;
  }
}

export function checkLowStock(currentStock: number, threshold: number = 5) {
  return currentStock <= threshold;
}
