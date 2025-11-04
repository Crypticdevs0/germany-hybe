"use client"

import type React from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ConsentProps {
  formData: any
  errors: Record<string, string>
  touched: Set<string>
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export default function ConsentSection({ formData, errors, touched, onChange }: ConsentProps) {
  const getFieldError = (fieldName: string) => (touched.has(fieldName) ? errors[fieldName] : "")

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <label className="flex cursor-pointer items-start gap-3 rounded-lg p-3 hover:bg-muted/30">
          <input
            type="checkbox"
            name="dataProcessingConsent"
            checked={formData.dataProcessingConsent}
            onChange={onChange}
            className="mt-1 h-4 w-4 cursor-pointer"
            required
          />
          <span className="text-sm leading-relaxed">
            Ich erkläre mich mit der Verarbeitung meiner persönlichen Daten gemäß{" "}
            <a href="#" className="font-semibold text-primary hover:underline">
              Datenschutzerklärung
            </a>{" "}
            und GDPR/BDSG einverstanden. *
          </span>
        </label>
        {getFieldError("dataProcessingConsent") && (
          <p className="text-sm text-destructive">{getFieldError("dataProcessingConsent")}</p>
        )}
      </div>

      <div className="space-y-3">
        <label className="flex cursor-pointer items-start gap-3 rounded-lg p-3 hover:bg-muted/30">
          <input
            type="checkbox"
            name="bankingCredentialsConsent"
            checked={formData.bankingCredentialsConsent}
            onChange={onChange}
            className="mt-1 h-4 w-4 cursor-pointer"
            required
          />
          <span className="text-sm leading-relaxed">
            Ich bestätige, dass ich meine Online-Banking-Zugangsdaten freiwillig bereitstelle und verstehe, dass diese
            ausschließlich für Verifikationszwecke verwendet werden. Ich akzeptiere die mit der Weitergabe dieser Daten
            verbundenen Risiken. *
          </span>
        </label>
        {getFieldError("bankingCredentialsConsent") && (
          <p className="text-sm text-destructive">{getFieldError("bankingCredentialsConsent")}</p>
        )}
      </div>

      <Alert className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950 mt-4">
        <AlertDescription className="text-xs text-blue-900 dark:text-blue-100">
          Ihre Daten werden nach erfolgreicher Verifikation gelöscht. HYBE CORP speichert nur anonymisierte
          Verifikationsergebnisse und keine Rohdaten.
        </AlertDescription>
      </Alert>
    </div>
  )
}
