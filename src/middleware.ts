import NextAuth from "next-auth"
import { authConfig } from "./auth.config"

/**
 * Inisialisasi NextAuth instance khusus untuk Edge Runtime.
 * Dengan mengimpor authConfig murni (tanpa adapter database), 
 * middleware dapat membaca session token JWT di Edge tanpa memicu eror compile Prisma.
 */
const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const { nextUrl } = req

  const isPrivatePage = 
    nextUrl.pathname.startsWith("/dashboard") ||
    nextUrl.pathname.startsWith("/inventory") ||
    nextUrl.pathname.startsWith("/mutations") ||
    nextUrl.pathname.startsWith("/transfers")

  if (isPrivatePage) {
    if (isLoggedIn) return
    return Response.redirect(new URL("/login", nextUrl))
  }
})

export const config = {
  // Melindungi semua route kecuali asset statis, API, dan Next static files
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
