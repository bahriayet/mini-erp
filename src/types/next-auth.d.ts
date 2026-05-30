import NextAuth, { type DefaultSession } from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      branchId: string | null
    } & DefaultSession["user"]
  }

  interface User {
    id?: string
    role: string
    branchId: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string
    branchId?: string | null
  }
}
