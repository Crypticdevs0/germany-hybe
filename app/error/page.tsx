import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { Metadata } from "next"
import { AlertCircle } from "lucide-react"

export const metadata: Metadata = {
  title: "Fehler – HYBE CORP",
  description: "Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut oder kontaktieren Sie den Support.",
}

export default function ErrorPage() {
  return (
    <main className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Card className="p-6 sm:p-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl text-foreground">
              <AlertCircle className="h-6 w-6 text-destructive" />
              Etwas ist schiefgelaufen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-base text-muted-foreground">
              Beim Verarbeiten Ihrer Anfrage ist ein Fehler aufgetreten. Versuchen Sie es bitte erneut. Wenn das Problem
              weiterhin besteht, wenden Sie sich bitte an unseren Support.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <Button asChild className="flex-1">
                <Link href="/">Neu versuchen</Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link href="/contact">Kontakt / Support</Link>
              </Button>
            </div>

            <p className="text-xs text-muted-foreground pt-4">Alternativ können Sie uns eine E-Mail an <a className="underline" href="mailto:support@hybe.example">support@hybe.example</a> senden.</p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
