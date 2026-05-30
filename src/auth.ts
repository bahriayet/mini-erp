import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { authConfig } from "./auth.config"

/**
 * Inisialisasi utama Auth.js (NextAuth v5).
 * Berkas ini dijalankan di Node.js Runtime karena mengimpor Prisma adapter 
 * dan memproses query database pada Credentials authorize().
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = credentials.email as string
        const password = credentials.password as string

        // Cari user di database
        const user = await prisma.user.findUnique({
          where: { email }
        })

        if (!user) {
          return null
        }

        // Bandingkan password hash
        const passwordsMatch = await bcrypt.compare(password, user.password)
        if (passwordsMatch) {
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            branchId: user.branchId
          }
        }

        return null
      }
    })
  ]
})
