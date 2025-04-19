import { Order, OrderItem as PrismaOrderItem, User as PrismaUser, Product, Address } from '@prisma/client';

export type OrderWithItems = Order & {
  items: (PrismaOrderItem & {
    product: Product;
  })[];
  shippingAddress: Address;
};

export type OrderItem = PrismaOrderItem & {
  product: Product;
};

export type User = PrismaUser; 