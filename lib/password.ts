import bcrypt from 'bcryptjs';

// Надежное количество раундов соли для bcrypt
// Рекомендуется использовать как минимум 12 раундов для повышения безопасности
export const SALT_ROUNDS = 12;

/**
 * Хеширует пароль с использованием bcrypt с безопасным количеством раундов соли
 * @param password Пароль для хеширования
 * @returns Хешированный пароль
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Проверяет, соответствует ли пароль хешу
 * @param password Пароль для проверки
 * @param hashedPassword Хешированный пароль из базы данных
 * @returns true если пароль соответствует хешу, иначе false
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
} 