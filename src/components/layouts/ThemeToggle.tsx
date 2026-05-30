"use client"

import React, { useEffect, useState } from "react"
import { Sun, Moon } from "lucide-react"

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const [theme, setTheme] = useState<"light" | "dark">("light")

  // Menjamin inisialisasi di client side untuk menghindari mismatch hidrasi SSR
  useEffect(() => {
    setMounted(true)
    const isDark = document.documentElement.classList.contains("dark")
    setTheme(isDark ? "dark" : "light")
  }, [])

  const toggleTheme = () => {
    const root = document.documentElement
    if (theme === "dark") {
      root.classList.remove("dark")
      localStorage.setItem("theme", "light")
      setTheme("light")
    } else {
      root.classList.add("dark")
      localStorage.setItem("theme", "dark")
      setTheme("dark")
    }
  }

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-xl border border-border/80 bg-card/40 backdrop-blur-sm shadow-sm shrink-0" />
    )
  }

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className="w-9 h-9 flex items-center justify-center rounded-xl border border-border bg-card/40 backdrop-blur-sm shadow-sm hover:bg-secondary/60 active:scale-90 transition-all duration-300 cursor-pointer shrink-0 group relative overflow-hidden"
      aria-label="Toggle Theme"
      title={theme === "dark" ? "Ubah ke Mode Terang" : "Ubah ke Mode Gelap"}
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        {/* Sun Icon */}
        <Sun className={`w-5 h-5 text-amber-500 absolute transition-all duration-500 transform ${
          theme === "dark" ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100 group-hover:rotate-45"
        }`} />
        {/* Moon Icon */}
        <Moon className={`w-4.5 h-4.5 text-indigo-400 absolute transition-all duration-500 transform ${
          theme === "dark" ? "rotate-0 scale-100 opacity-100 group-hover:-rotate-12" : "-rotate-90 scale-0 opacity-0"
        }`} />
      </div>
    </button>
  )
}
