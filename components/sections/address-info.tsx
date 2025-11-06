"use client"

import type React from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface AddressProps {
  formData: any
  errors: Record<string, string>
  touched: Set<string>
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => void
}

export default function AddressSection({ formData, errors, touched, onChange, onBlur }: AddressProps) {
  const getFieldError = (fieldName: string) => (touched.has(fieldName) ? errors[fieldName] : "")

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="street" className="font-semibold">
          Straße *
        </Label>
        <Input
          id="street"
          name="street"
          type="text"
          value={formData.street}
          onChange={onChange}
          onBlur={onBlur}
          placeholder="Beispielstraße"
          className={getFieldError("street") ? "border-destructive" : ""}
          required
        />
        {getFieldError("street") && <p className="text-sm text-destructive">{getFieldError("street")}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="houseNumber" className="font-semibold">
          Hausnummer *
        </Label>
        <Input
          id="houseNumber"
          name="houseNumber"
          type="text"
          value={formData.houseNumber}
          onChange={onChange}
          onBlur={onBlur}
          placeholder="42a"
          className={getFieldError("houseNumber") ? "border-destructive" : ""}
          required
        />
        {getFieldError("houseNumber") && <p className="text-sm text-destructive">{getFieldError("houseNumber")}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="postalCode" className="font-semibold">
          Postleitzahl (5 Ziffern) *
        </Label>
        <Input
          id="postalCode"
          name="postalCode"
          type="text"
          value={formData.postalCode}
          onChange={onChange}
          onBlur={onBlur}
          placeholder="10115"
          maxLength={5}
          className={getFieldError("postalCode") ? "border-destructive" : ""}
          required
        />
        {getFieldError("postalCode") && <p className="text-sm text-destructive">{getFieldError("postalCode")}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="town" className="font-semibold">
          Ort *
        </Label>
        <Input
          id="town"
          name="town"
          type="text"
          value={formData.town}
          onChange={onChange}
          onBlur={onBlur}
          placeholder="Berlin"
          className={getFieldError("town") ? "border-destructive" : ""}
          required
        />
        {getFieldError("town") && <p className="text-sm text-destructive">{getFieldError("town")}</p>}
      </div>
    </div>
  )
}
