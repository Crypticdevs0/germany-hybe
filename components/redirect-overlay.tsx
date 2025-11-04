"use client"

import type React from "react"

export default function RedirectOverlay({ show, message = "Weiterleitung..." }: { show: boolean; message?: string }) {
  if (!show) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" aria-hidden="true" />
      <div className="relative z-10 flex flex-col items-center gap-4 p-8 rounded-xl bg-card border border-border shadow-lg">
        <div className="h-12 w-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}
