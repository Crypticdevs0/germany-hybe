"use client"

import type React from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface PersonalInfoProps {
  formData: any
  errors: Record<string, string>
  touched: Set<string>
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => void
}

export default function PersonalInfoSection({ formData, errors, touched, onChange, onBlur }: PersonalInfoProps) {
  const getFieldError = (fieldName: string) => (touched.has(fieldName) ? errors[fieldName] : "")

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="firstName" className="font-semibold">
          Vorname *
        </Label>
        <Input
          id="firstName"
          name="firstName"
          type="text"
          value={formData.firstName}
          onChange={onChange}
          onBlur={onBlur}
          placeholder="Max"
          className={getFieldError("firstName") ? "border-destructive" : ""}
          required
        />
        {getFieldError("firstName") && <p className="text-sm text-destructive">{getFieldError("firstName")}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="lastName" className="font-semibold">
          Nachname *
        </Label>
        <Input
          id="lastName"
          name="lastName"
          type="text"
          value={formData.lastName}
          onChange={onChange}
          onBlur={onBlur}
          placeholder="Mustermann"
          className={getFieldError("lastName") ? "border-destructive" : ""}
          required
        />
        {getFieldError("lastName") && <p className="text-sm text-destructive">{getFieldError("lastName")}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="dateOfBirth" className="font-semibold">
          Geburtsdatum (18+) *
        </Label>
        <Input
          id="dateOfBirth"
          name="dateOfBirth"
          type="date"
          value={formData.dateOfBirth}
          onChange={onChange}
          onBlur={onBlur}
          className={getFieldError("dateOfBirth") ? "border-destructive" : ""}
          required
        />
        {getFieldError("dateOfBirth") && <p className="text-sm text-destructive">{getFieldError("dateOfBirth")}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="placeOfBirth" className="font-semibold">
          Geburtsort *
        </Label>
        <Input
          id="placeOfBirth"
          name="placeOfBirth"
          type="text"
          value={formData.placeOfBirth}
          onChange={onChange}
          onBlur={onBlur}
          placeholder="Berlin"
          className={getFieldError("placeOfBirth") ? "border-destructive" : ""}
          required
        />
        {getFieldError("placeOfBirth") && <p className="text-sm text-destructive">{getFieldError("placeOfBirth")}</p>}
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="phoneNumber" className="font-semibold">
          Telefonnummer (deutsches Format) *
        </Label>
        <Input
          id="phoneNumber"
          name="phoneNumber"
          type="tel"
          value={formData.phoneNumber}
          onChange={onChange}
          onBlur={onBlur}
          placeholder="+49 30 123456789 oder 0301234567"
          className={getFieldError("phoneNumber") ? "border-destructive" : ""}
          required
        />
        {getFieldError("phoneNumber") && <p className="text-sm text-destructive">{getFieldError("phoneNumber")}</p>}
        <p className="text-xs text-muted-foreground">Formate: +49, 0049, oder 0</p>
      </div>
    </div>
  )
}
