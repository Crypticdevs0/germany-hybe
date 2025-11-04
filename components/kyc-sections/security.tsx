"use client"

import type React from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Lock } from "lucide-react"

interface SecuritySectionProps {
  formData: any
  errors: any
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export default function SecuritySection({ formData, errors, handleInputChange }: SecuritySectionProps) {
  return (
    <div className="space-y-4">
      <Alert className="border-primary bg-primary/10">
        <Lock className="h-4 w-4 text-primary" />
        <AlertDescription className="text-sm text-foreground">
          Erstellen Sie ein sicheres Passwort für Ihr HYBE-Konto. Verwenden Sie mindestens 8 Zeichen mit Groß- und
          Kleinbuchstaben, Zahlen und Sonderzeichen.
        </AlertDescription>
      </Alert>

      <div>
        <Label htmlFor="password">Passwort *</Label>
        <Input
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleInputChange}
          placeholder="••••••••"
          className={errors.password ? "border-destructive" : ""}
        />
        {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
        <p className="text-xs text-muted-foreground mt-1">
          Mindestens 8 Zeichen mit Groß- und Kleinbuchstaben, Zahlen und Sonderzeichen
        </p>
      </div>

      <div>
        <Label htmlFor="confirmPassword">Passwort bestätigen *</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={handleInputChange}
          placeholder="••••••••"
          className={errors.confirmPassword ? "border-destructive" : ""}
        />
        {errors.confirmPassword && <p className="text-xs text-destructive mt-1">{errors.confirmPassword}</p>}
      </div>

      <div className="bg-muted/50 p-4 rounded-lg border border-border">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="acceptTerms"
            checked={formData.acceptTerms}
            onChange={handleInputChange}
            className="mt-1 w-4 h-4 accent-primary"
          />
          <span className="text-sm text-foreground leading-relaxed">
            Ich akzeptiere die <span className="text-primary font-medium">Allgemeinen Geschäftsbedingungen</span> und
            die <span className="text-primary font-medium">Datenschutzerklärung</span> von HYBE CORP und stimme der
            Verarbeitung meiner Daten gemäß DSGVO zu. *
          </span>
        </label>
        {errors.acceptTerms && <p className="text-xs text-destructive mt-2">{errors.acceptTerms}</p>}
      </div>
    </div>
  )
}
