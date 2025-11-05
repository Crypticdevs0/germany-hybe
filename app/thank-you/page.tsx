import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { Metadata } from "next"
import { CheckCircle2 } from "lucide-react"

export const metadata: Metadata = {
  title: "Danke – HYBE CORP",
  description: "Danke! Ihre Anfrage wurde successfully empfangen.",
}

export default function ThankYouPage() {
  return (
    <main className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Card className="p-6 sm:p-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl text-foreground">
              <CheckCircle2 className="h-6 w-6 text-success" />
              Vielen Dank
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-base text-muted-foreground">
              Wir haben Ihre Informationen erhalten und beginnen mit der Prüfung. Sie erhalten eine Benachrichtigung,
              sobald der Prozess abgeschlossen ist.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <Button asChild className="flex-1">
                <Link href="/">Zur Startseite</Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link href="/">Weitere Informationen</Link>
              </Button>
            </div>

            <p className="text-xs text-muted-foreground pt-4">
              Falls Sie Fragen haben, kontaktieren Sie uns unter <a className="underline" href="mailto:support@hybe.example">support@hybe.example</a>.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
