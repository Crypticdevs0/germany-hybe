"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function RedirectingPage() {
  const router = useRouter()

  useEffect(() => {
    const t = setTimeout(() => {
      router.push("/success")
    }, 1200)
    return () => clearTimeout(t)
  }, [router])

  return (
    <main className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Card className="p-6 sm:p-8 flex flex-col items-center text-center">
          <CardHeader>
            <CardTitle className="text-2xl text-foreground">Weiterleitung...</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-12 w-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">Sie werden in Kürze zur Erfolgsseite weitergeleitet.</p>

            <div className="pt-4">
              <Button asChild>
                <Link href="/">Zur Startseite</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
