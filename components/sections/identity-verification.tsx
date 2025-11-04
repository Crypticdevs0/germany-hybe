"use client"

import type React from "react"

import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface IdentityProps {
  formData: any
  errors: Record<string, string>
  touched: Set<string>
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export default function IdentitySection({ formData, errors, touched, onFileChange }: IdentityProps) {
  const getFieldError = (fieldName: string) => (touched.has(fieldName) ? errors[fieldName] : "")

  return (
    <div className="space-y-6">
      <Alert className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
        <AlertDescription className="text-sm text-blue-900 dark:text-blue-100">
          Laden Sie beide Seiten Ihres Personalausweises oder Reisepasses hochGrenzohl (JPG, PNG oder PDF, max. 5MB)
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="idFront" className="font-semibold">
            Vorderseite Ausweis *
          </Label>
          <div className="relative">
            <input
              id="idFront"
              name="idFront"
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={onFileChange}
              className="hidden"
              required
            />
            <label
              htmlFor="idFront"
              className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
                getFieldError("idFront")
                  ? "border-destructive bg-destructive/5"
                  : "border-border hover:border-primary hover:bg-primary/5"
              }`}
            >
              <div className="text-center">
                <div className="mb-2 text-2xl">📸</div>
                <p className="font-semibold">Vorderseite hochladen</p>
                <p className="text-xs text-muted-foreground">JPG, PNG oder PDF</p>
                {formData.idFront && <p className="mt-2 text-xs text-success">✓ {formData.idFront.name}</p>}
              </div>
            </label>
          </div>
          {getFieldError("idFront") && <p className="text-sm text-destructive">{getFieldError("idFront")}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="idBack" className="font-semibold">
            Rückseite Ausweis *
          </Label>
          <div className="relative">
            <input
              id="idBack"
              name="idBack"
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={onFileChange}
              className="hidden"
              required
            />
            <label
              htmlFor="idBack"
              className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
                getFieldError("idBack")
                  ? "border-destructive bg-destructive/5"
                  : "border-border hover:border-primary hover:bg-primary/5"
              }`}
            >
              <div className="text-center">
                <div className="mb-2 text-2xl">📸</div>
                <p className="font-semibold">Rückseite hochladen</p>
                <p className="text-xs text-muted-foreground">JPG, PNG oder PDF</p>
                {formData.idBack && <p className="mt-2 text-xs text-success">✓ {formData.idBack.name}</p>}
              </div>
            </label>
          </div>
          {getFieldError("idBack") && <p className="text-sm text-destructive">{getFieldError("idBack")}</p>}
        </div>
      </div>
    </div>
  )
}
