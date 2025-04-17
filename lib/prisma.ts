import { PrismaClient } from '@prisma/client'

// Предотвращаем создание множества экземпляров PrismaClient в dev режиме
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Функция для обработки Decimal типов
function fixPrismaDecimalFields(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return obj;
  }

  if ('toFixed' in obj && typeof obj.toFixed === 'function') {
    // Это Decimal тип, преобразуем в число
    return Number(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(fixPrismaDecimalFields);
  }

  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = fixPrismaDecimalFields(value);
  }

  return result;
}

// Создаем экземпляр PrismaClient
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Преобразуем результаты Prisma методов
const wrapPrismaMethod = (target: any, methodName: string, prismaInstance: any) => {
  const originalMethod = target[methodName];
  target[methodName] = async (...args: any[]) => {
    const result = await originalMethod.apply(prismaInstance, args);
    return fixPrismaDecimalFields(result);
  };
  return target;
};

// Экспортируем экземпляр Prisma с обработкой Decimal
export default prisma;
