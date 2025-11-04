"use client"

import type React from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ShieldAlert } from "lucide-react"

interface FinancialSectionProps {
  formData: any
  errors: any
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
}

export default function FinancialSection({ formData, errors, handleInputChange }: FinancialSectionProps) {
  return (
    <div className="space-y-4">
      <Alert className="border-warning bg-warning/10">
        <ShieldAlert className="h-4 w-4 text-warning-foreground" />
        <AlertDescription className="text-sm text-warning-foreground">
          Ihre Finanzdaten werden verschlüsselt und sicher übertragen. Diese Informationen werden ausschließlich zur
          Verifizierung verwendet.
        </AlertDescription>
      </Alert>

      <div>
        <Label htmlFor="iban">IBAN *</Label>
        <Input
          id="iban"
          name="iban"
          type="text"
          value={formData.iban}
          onChange={handleInputChange}
          placeholder="DE89 3704 0044 0532 0130 00"
          className={errors.iban ? "border-destructive" : ""}
        />
        {errors.iban && <p className="text-xs text-destructive mt-1">{errors.iban}</p>}
        <p className="text-xs text-muted-foreground mt-1">Internationale Bankkontonummer</p>
      </div>

      <div>
        <Label htmlFor="accountHolderName">Kontoinhaber *</Label>
        <Input
          id="accountHolderName"
          name="accountHolderName"
          type="text"
          value={formData.accountHolderName}
          onChange={handleInputChange}
          placeholder="Max Mustermann"
          className={errors.accountHolderName ? "border-destructive" : ""}
        />
        {errors.accountHolderName && <p className="text-xs text-destructive mt-1">{errors.accountHolderName}</p>}
      </div>

      <div>
        <Label htmlFor="sourceOfFunds">Herkunft der Mittel *</Label>
        <select
          id="sourceOfFunds"
          name="sourceOfFunds"
          value={formData.sourceOfFunds}
          onChange={handleInputChange}
          className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground ${
            errors.sourceOfFunds ? "border-destructive" : "border-input"
          }`}
        >
          <option value="">Bitte wählen</option>
          <option value="salary">Gehalt/Lohn</option>
          <option value="business">Geschäftseinkommen</option>
          <option value="investment">Kapitalerträge</option>
          <option value="inheritance">Erbschaft</option>
          <option value="other">Sonstiges</option>
        </select>
        {errors.sourceOfFunds && <p className="text-xs text-destructive mt-1">{errors.sourceOfFunds}</p>}
      </div>
    </div>
  )
}
