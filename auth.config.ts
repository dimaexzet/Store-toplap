import type { NextAuthConfig } from 'next-auth'

declare module 'next-auth' {
  interface User {
    role?: 'USER' | 'ADMIN'
  }
}

export default {
  providers: [],
  // Явные настройки JWT для предотвращения ошибок
  jwt: {
    maxAge: 60 * 60 * 24 * 30, // 30 дней
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string
        token.email = user.email
        token.name = user.name
        token.image = user.image
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.image = token.image as string | null
        session.user.role = token.role as 'USER' | 'ADMIN'
      }
      return session
    },
  },
  // Настройки безопасности для cookie
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  pages: {
    signIn: '/sign-in',
    signOut: '/',
    error: '/sign-in',
  },
} satisfies NextAuthConfig
