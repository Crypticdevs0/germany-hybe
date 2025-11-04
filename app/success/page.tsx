import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { Metadata } from "next"
import { CheckCircle2 } from "lucide-react"

export const metadata: Metadata = {
  title: "HYBE CORP – Erfolgreich übermittelt",
  description: "Ihre KYC-Verifizierung wurde erfolgreich übermittelt.",
}

export default function SuccessPage() {
  return (
    <main className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl text-foreground">
              <CheckCircle2 className="h-6 w-6 text-success" />
              Übermittlung erfolgreich
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Vielen Dank! Ihre KYC-Verifizierung ist bei uns eingegangen. Sie erhalten eine Benachrichtigung, sobald die
              Prüfung abgeschlossen ist.
            </p>
            <div className="pt-2">
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
