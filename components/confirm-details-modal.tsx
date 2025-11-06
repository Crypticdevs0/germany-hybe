"use client"

import type React from "react"
import { Fragment } from "react"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"

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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" aria-hidden="true" />
      <Card role="dialog" aria-modal="true" aria-labelledby="confirm-title" className="relative z-10 w-full max-w-2xl shadow-xl">
        <CardHeader>
          <CardTitle id="confirm-title" className="text-2xl">Eingaben bestätigen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <section className="space-y-2">
              <h3 className="font-semibold text-foreground">Persönliche Daten</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Vorname:</span> <span className="font-medium">{formData.firstName}</span></div>
                <div><span className="text-muted-foreground">Nachname:</span> <span className="font-medium">{formData.lastName}</span></div>
                <div><span className="text-muted-foreground">Geburtsdatum:</span> <span className="font-medium">{formData.dateOfBirth}</span></div>
                <div><span className="text-muted-foreground">Nationalität:</span> <span className="font-medium">{formData.nationality}</span></div>
                <div><span className="text-muted-foreground">E-Mail:</span> <span className="font-medium">{formData.email}</span></div>
                <div><span className="text-muted-foreground">Telefon:</span> <span className="font-medium">{formData.phone}</span></div>
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-foreground">Adresse</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="sm:col-span-2"><span className="text-muted-foreground">Straße:</span> <span className="font-medium">{formData.street}</span></div>
                <div><span className="text-muted-foreground">Stadt:</span> <span className="font-medium">{formData.city}</span></div>
                <div><span className="text-muted-foreground">PLZ:</span> <span className="font-medium">{formData.postalCode}</span></div>
                <div className="sm:col-span-2"><span className="text-muted-foreground">Land:</span> <span className="font-medium">{formData.country}</span></div>
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-foreground">Finanzzugang</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="sm:col-span-2"><span className="text-muted-foreground">Bank:</span> <span className="font-medium">{formData.bankInstitutionName}</span></div>
                <div><span className="text-muted-foreground">Kontotyp:</span> <span className="font-medium">{accountTypeLabel || ""}</span></div>
                <div className="sm:col-span-2"><span className="text-muted-foreground">Benutzername:</span> <span className="font-medium">{formData.onlineBankingUsername}</span></div>
                <div><span className="text-muted-foreground">PIN:</span> <span className="font-medium">••••••••</span></div>
              </div>
            </section>


            <section className="space-y-2">
              <h3 className="font-semibold text-foreground">Sicherheit</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">AGB/Zustimmung:</span> <span className="font-medium">{formData.acceptTerms ? "Ja" : "Nein"}</span></div>
              </div>
            </section>

            <section className="space-y-2">
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

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onCancel} className="bg-transparent">Zurück</Button>
              <Button type="button" onClick={onConfirm}>Bestätigen & Absenden</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
