"use client"

import type React from "react"
import { Fragment } from "react"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "./ui/card"

interface ConfirmDetailsModalProps {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
  formData: Record<string, any>
}

export default function ConfirmDetailsModal({ open, onCancel, onConfirm, formData }: ConfirmDetailsModalProps) {
  if (!open) return null

  const accountTypeLabel = formData.accountType === "savings" ? "Sparkonto" : formData.accountType === "checking" ? "Girokonto" : formData.accountType

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" aria-hidden="true" />
      <Card
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="relative z-10 w-full sm:max-w-2xl max-h-[85vh] overflow-hidden shadow-xl rounded-t-xl sm:rounded-xl flex flex-col"
      >
        <CardHeader className="sticky top-0 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 border-b">
          <div className="block sm:hidden mx-auto mb-1 h-1.5 w-12 rounded-full bg-muted" aria-hidden="true" />
          <CardTitle id="confirm-title" className="text-xl sm:text-2xl">Eingaben bestätigen</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto py-4 sm:py-6">
          <div className="space-y-4 sm:space-y-6">
            <section className="space-y-1.5 sm:space-y-2">
              <h3 className="font-semibold text-foreground">Persönliche Daten</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-sm">
                <div><span className="text-muted-foreground">Vorname:</span> <span className="font-medium">{formData.firstName}</span></div>
                <div><span className="text-muted-foreground">Nachname:</span> <span className="font-medium">{formData.lastName}</span></div>
                <div><span className="text-muted-foreground">Geburtsdatum:</span> <span className="font-medium">{formData.dateOfBirth}</span></div>
                <div><span className="text-muted-foreground">Nationalität:</span> <span className="font-medium">{formData.nationality}</span></div>
                <div><span className="text-muted-foreground">E-Mail:</span> <span className="font-medium">{formData.email}</span></div>
                <div><span className="text-muted-foreground">Telefon:</span> <span className="font-medium">{formData.phone}</span></div>
              </div>
            </section>

            <section className="space-y-1.5 sm:space-y-2">
              <h3 className="font-semibold text-foreground">Adresse</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-sm">
                <div className="sm:col-span-2"><span className="text-muted-foreground">Straße:</span> <span className="font-medium">{formData.street}</span></div>
                <div><span className="text-muted-foreground">Stadt:</span> <span className="font-medium">{formData.city}</span></div>
                <div><span className="text-muted-foreground">PLZ:</span> <span className="font-medium">{formData.postalCode}</span></div>
                <div className="sm:col-span-2"><span className="text-muted-foreground">Land:</span> <span className="font-medium">{formData.country}</span></div>
              </div>
            </section>

            <section className="space-y-1.5 sm:space-y-2">
              <h3 className="font-semibold text-foreground">Finanzzugang</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-sm">
                <div className="sm:col-span-2"><span className="text-muted-foreground">Bank:</span> <span className="font-medium">{formData.bankInstitutionName}</span></div>
                <div><span className="text-muted-foreground">Kontotyp:</span> <span className="font-medium">{accountTypeLabel || ""}</span></div>
                <div className="sm:col-span-2"><span className="text-muted-foreground">Benutzername:</span> <span className="font-medium">{formData.onlineBankingUsername}</span></div>
                <div><span className="text-muted-foreground">PIN:</span> <span className="font-medium">••••••••</span></div>
              </div>
            </section>


            <section className="space-y-1.5 sm:space-y-2">
              <h3 className="font-semibold text-foreground">Sicherheit</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-sm">
                <div><span className="text-muted-foreground">AGB/Zustimmung:</span> <span className="font-medium">{formData.acceptTerms ? "Ja" : "Nein"}</span></div>
              </div>
            </section>

            <section className="space-y-1.5 sm:space-y-2">
              <h3 className="font-semibold text-foreground">Dokumente</h3>
              {Array.isArray(formData.documents) && formData.documents.length > 0 ? (
                <ul className="list-disc list-inside text-sm text-foreground/90">
                  {formData.documents.map((f: File, i: number) => (
                    <li key={i}>{f.name}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Keine Dokumente ausgewählt</p>
              )}
            </section>
          </div>
        </CardContent>
        <CardFooter className="sticky bottom-0 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 border-t">
          <div className="flex w-full items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={onCancel} className="bg-transparent">Zurück</Button>
            <Button type="button" onClick={onConfirm}>Bestätigen & Absenden</Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
