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
const prismaClient = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prismaClient

// Преобразуем результаты Prisma методов
const wrapPrismaMethod = (target: any, methodName: string, prismaInstance: any) => {
  const originalMethod = target[methodName];
  target[methodName] = async (...args: any[]) => {
    const result = await originalMethod.apply(prismaInstance, args);
    return fixPrismaDecimalFields(result);
  };
  return target;
};

// Создаем прокси для всех методов Prisma для автоматического преобразования Decimal
const prisma = new Proxy(prismaClient, {
  get(target, prop) {
    const value = target[prop as keyof typeof target];
    
    // Если это модель (например, prisma.user, prisma.product)
    if (typeof value === 'object' && value !== null) {
      return new Proxy(value, {
        get(modelTarget, modelProp) {
          const modelMethod = modelTarget[modelProp as keyof typeof modelTarget];
          
          // Если это метод модели (например, findMany, findUnique)
          if (typeof modelMethod === 'function') {
            return async (...args: any[]) => {
              // Используем Function.prototype.apply для вызова метода
              const result = await (modelMethod as Function).apply(modelTarget, args);
              return fixPrismaDecimalFields(result);
            };
          }
          
          return modelMethod;
        }
      });
    }
    
    return value;
  }
});

// Экспортируем обернутый экземпляр Prisma
export default prisma;
export { prisma };
