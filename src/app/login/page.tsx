"use client"

import React, { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Lock, Mail, Loader2, ArrowRight, Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (res?.error) {
        setError("Email atau password yang Anda masukkan salah.")
      } else {
        router.push("/dashboard")
        router.refresh()
      }
    } catch (err) {
      setError("Terjadi kesalahan sistem. Silakan coba lagi.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-background">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />

      {/* Login Card */}
      <div className="w-full max-w-[440px] px-6 py-8 mx-4 z-10 glass rounded-2xl shadow-xl transition-all duration-300">
        <header className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary mb-3 shadow-lg shadow-primary/30">
            <Lock className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Nexus ERP
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sistem Inventaris Multi-Cabang Berkelas
          </p>
        </header>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-destructive/15 border border-destructive/20 text-xs text-destructive flex items-center gap-2 animate-shake">
            <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Input Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
              Alamat Email
            </label>
            <div className="relative group">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                type="email"
                required
                placeholder="nama@perusahaan.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full pl-10 pr-4 py-3 bg-secondary/40 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
              />
            </div>
          </div>

          {/* Input Password */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                Kata Sandi
              </label>
            </div>
            <div className="relative group">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full pl-10 pr-12 py-3 bg-secondary/40 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors cursor-pointer"
                title={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary text-primary-foreground font-semibold rounded-xl text-sm hover:bg-primary/95 hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all duration-200 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Mengecek Kredensial...
              </>
            ) : (
              <>
                Masuk Sistem
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Login Selector */}
        <div className="mt-6 pt-5 border-t border-border/60">
          <p className="text-xs font-semibold text-muted-foreground tracking-wider uppercase mb-3 text-center">
            Akun Demo Pengujian (Sekali Klik)
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setEmail("admin@nexus.com")
                setPassword("admin123")
              }}
              disabled={loading}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-secondary/50 hover:bg-primary/10 border border-border hover:border-primary/30 transition-all duration-200 group text-center cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">Admin</span>
              <span className="text-[9px] text-muted-foreground mt-0.5">Super Admin</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail("jakarta.manager@nexus.com")
                setPassword("manager123")
              }}
              disabled={loading}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-secondary/50 hover:bg-primary/10 border border-border hover:border-primary/30 transition-all duration-200 group text-center cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">Manager</span>
              <span className="text-[9px] text-muted-foreground mt-0.5">Cab. Jakarta</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail("bandung.staff@nexus.com")
                setPassword("staff123")
              }}
              disabled={loading}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-secondary/50 hover:bg-primary/10 border border-border hover:border-primary/30 transition-all duration-200 group text-center cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">Staff</span>
              <span className="text-[9px] text-muted-foreground mt-0.5">Cab. Bandung</span>
            </button>
          </div>
        </div>

        <footer className="text-center mt-6 pt-5 border-t border-border/60">
          <p className="text-xs text-muted-foreground">
            Nexus ERP v1.0.0 © 2026. All rights reserved.
          </p>
        </footer>
      </div>
    </main>
  )
}
