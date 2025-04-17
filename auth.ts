import NextAuth, { DefaultSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import authConfig from './auth.config'
import bcrypt from 'bcryptjs'
import Credentials from 'next-auth/providers/credentials'
import { User } from '@prisma/client'
import { verifyPassword } from '@/lib/password'

// Set the number of salt rounds for bcrypt
const BCRYPT_SALT_ROUNDS = 12
const prisma = new PrismaClient()

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role?: 'USER' | 'ADMIN'
    } & DefaultSession['user']
  }
}

// Проверяем наличие AUTH_SECRET
if (!process.env.AUTH_SECRET) {
  throw new Error("AUTH_SECRET is not defined. Please define it in your .env file");
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  basePath: '/api/auth',
  session: { strategy: 'jwt' },
  // Явно указываем секрет для JWT
  secret: process.env.AUTH_SECRET,
  ...authConfig,
  pages: {
    // signIn: '/auth/signin',
    // error: '/auth/error',
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = credentials.email as string
        const password = credentials.password as string

        try {
          const user = await prisma.user.findUnique({
            where: { email },
          })

          if (!user || !user.password) {
            return null
          }

          const isPasswordValid = await verifyPassword(password, user.password)

          if (!isPasswordValid) {
            // Add a small delay to prevent timing attacks
            await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 100))
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,
          }
        } catch (error) {
          console.error("Authentication error:", error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as User).role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as 'USER' | 'ADMIN'
        session.user.id = token.id as string
      }
      return session
    },
  },
})
