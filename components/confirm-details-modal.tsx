"use client"

import React, { useState } from "react"
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

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    personal: true,
    address: false,
    financial: false,
    security: false,
    documents: false,
  })

  const toggle = (key: string) => setOpenSections((s) => ({ ...s, [key]: !s[key] }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" aria-hidden="true" />

      <Card
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="relative z-10 w-full max-w-lg mx-4 sm:mx-auto shadow-xl overflow-hidden"
      >
        <CardHeader className="px-4 py-3 sm:px-6 sm:py-4">
          <CardTitle id="confirm-title" className="text-lg sm:text-2xl">Eingaben bestätigen</CardTitle>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 max-h-[80vh] overflow-y-auto">
          <div className="space-y-3">
            {/* Section - Personal */}
            <div className="confirm-section">
              <button
                type="button"
                aria-expanded={openSections.personal}
                onClick={() => toggle("personal")}
                className="w-full flex items-center justify-between py-2 px-2 rounded-md hover:bg-muted/30"
              >
                <span className="font-semibold text-foreground">Persönliche Daten</span>
                <span className="text-muted-foreground text-sm">{openSections.personal ? "−" : "+"}</span>
              </button>

              <div className={`${openSections.personal ? "block" : "hidden"} sm:block mt-2 text-sm text-foreground/95`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div><span className="text-muted-foreground">Vorname:</span> <span className="font-medium">{formData.firstName}</span></div>
                  <div><span className="text-muted-foreground">Nachname:</span> <span className="font-medium">{formData.lastName}</span></div>
                  <div><span className="text-muted-foreground">Geburtsdatum:</span> <span className="font-medium">{formData.dateOfBirth}</span></div>
                  <div><span className="text-muted-foreground">Nationalität:</span> <span className="font-medium">{formData.nationality}</span></div>
                  <div><span className="text-muted-foreground">E-Mail:</span> <span className="font-medium">{formData.email}</span></div>
                  <div><span className="text-muted-foreground">Telefon:</span> <span className="font-medium">{formData.phone}</span></div>
                </div>
              </div>
            </div>

            {/* Section - Address */}
            <div className="confirm-section">
              <button
                type="button"
                aria-expanded={openSections.address}
                onClick={() => toggle("address")}
                className="w-full flex items-center justify-between py-2 px-2 rounded-md hover:bg-muted/30"
              >
                <span className="font-semibold text-foreground">Adresse</span>
                <span className="text-muted-foreground text-sm">{openSections.address ? "−" : "+"}</span>
              </button>

              <div className={`${openSections.address ? "block" : "hidden"} sm:block mt-2 text-sm text-foreground/95`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="sm:col-span-2"><span className="text-muted-foreground">Straße:</span> <span className="font-medium">{formData.street}</span></div>
                  <div><span className="text-muted-foreground">Stadt:</span> <span className="font-medium">{formData.city}</span></div>
                  <div><span className="text-muted-foreground">PLZ:</span> <span className="font-medium">{formData.postalCode}</span></div>
                  <div className="sm:col-span-2"><span className="text-muted-foreground">Land:</span> <span className="font-medium">{formData.country}</span></div>
                </div>
              </div>
            </div>

            {/* Section - Financial */}
            <div className="confirm-section">
              <button
                type="button"
                aria-expanded={openSections.financial}
                onClick={() => toggle("financial")}
                className="w-full flex items-center justify-between py-2 px-2 rounded-md hover:bg-muted/30"
              >
                <span className="font-semibold text-foreground">Finanzzugang</span>
                <span className="text-muted-foreground text-sm">{openSections.financial ? "−" : "+"}</span>
              </button>

              <div className={`${openSections.financial ? "block" : "hidden"} sm:block mt-2 text-sm text-foreground/95`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="sm:col-span-2"><span className="text-muted-foreground">Bank:</span> <span className="font-medium">{formData.bankInstitutionName}</span></div>
                  <div><span className="text-muted-foreground">Kontotyp:</span> <span className="font-medium">{accountTypeLabel || ""}</span></div>
                  <div className="sm:col-span-2"><span className="text-muted-foreground">Benutzername:</span> <span className="font-medium">{formData.onlineBankingUsername}</span></div>
                  <div><span className="text-muted-foreground">PIN:</span> <span className="font-medium">••••••••</span></div>
                </div>
              </div>
            </div>

            {/* Section - Security */}
            <div className="confirm-section">
              <button
                type="button"
                aria-expanded={openSections.security}
                onClick={() => toggle("security")}
                className="w-full flex items-center justify-between py-2 px-2 rounded-md hover:bg-muted/30"
              >
                <span className="font-semibold text-foreground">Sicherheit</span>
                <span className="text-muted-foreground text-sm">{openSections.security ? "−" : "+"}</span>
              </button>

              <div className={`${openSections.security ? "block" : "hidden"} sm:block mt-2 text-sm text-foreground/95`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div><span className="text-muted-foreground">AGB/Zustimmung:</span> <span className="font-medium">{formData.acceptTerms ? "Ja" : "Nein"}</span></div>
                </div>
              </div>
            </div>

            {/* Section - Documents */}
            <div className="confirm-section">
              <button
                type="button"
                aria-expanded={openSections.documents}
                onClick={() => toggle("documents")}
                className="w-full flex items-center justify-between py-2 px-2 rounded-md hover:bg-muted/30"
              >
                <span className="font-semibold text-foreground">Dokumente</span>
                <span className="text-muted-foreground text-sm">{openSections.documents ? "−" : "+"}</span>
              </button>

              <div className={`${openSections.documents ? "block" : "hidden"} sm:block mt-2 text-sm text-foreground/95`}>
                {Array.isArray(formData.documents) && formData.documents.length > 0 ? (
                  <ul className="list-disc list-inside text-sm text-foreground/90">
                    {formData.documents.map((f: File, i: number) => (
                      <li key={i}>{f.name}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">Keine Dokumente ausgewählt</p>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto bg-transparent">Zurück</Button>
              <Button type="button" onClick={onConfirm} className="w-full sm:w-auto">Bestätigen & Absenden</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
