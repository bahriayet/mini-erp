import type { NextAuthConfig } from "next-auth"

/**
 * Konfigurasi NextAuth yang kompatibel dengan Edge Runtime.
 * Kita memisahkan opsi ini agar Middleware Next.js tidak mengimpor Prisma ORM 
 * secara transitif, yang dapat menyebabkan eror kompilasi di lingkungan Edge.
 */
export const authConfig = {
  session: { strategy: "jwt" },
  providers: [], // Diisi lengkap di auth.ts (menggunakan database)
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.branchId = user.branchId
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string
        session.user.role = token.role as string
        session.user.branchId = token.branchId as string | null
      }
      return session
    }
  },
  pages: {
    signIn: "/login"
  }
} satisfies NextAuthConfig
