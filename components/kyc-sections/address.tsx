"use client"

import type React from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface AddressSectionProps {
  formData: any
  errors: any
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
}

export default function AddressSection({ formData, errors, handleInputChange }: AddressSectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="street">Straße und Hausnummer *</Label>
        <Input
          id="street"
          name="street"
          type="text"
          value={formData.street}
          onChange={handleInputChange}
          placeholder="Musterstraße 123"
          className={errors.street ? "border-destructive" : ""}
        />
        {errors.street && <p className="text-xs text-destructive mt-1">{errors.street}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="city">Stadt *</Label>
          <Input
            id="city"
            name="city"
            type="text"
            value={formData.city}
            onChange={handleInputChange}
            placeholder="Berlin"
            className={errors.city ? "border-destructive" : ""}
          />
          {errors.city && <p className="text-xs text-destructive mt-1">{errors.city}</p>}
        </div>
        <div>
          <Label htmlFor="postalCode">Postleitzahl *</Label>
          <Input
            id="postalCode"
            name="postalCode"
            type="text"
            value={formData.postalCode}
            onChange={handleInputChange}
            placeholder="10115"
            maxLength={5}
            className={errors.postalCode ? "border-destructive" : ""}
          />
          {errors.postalCode && <p className="text-xs text-destructive mt-1">{errors.postalCode}</p>}
          <p className="text-xs text-muted-foreground mt-1">5-stellige deutsche Postleitzahl</p>
        </div>
      </div>

      <div>
        <Label htmlFor="country">Land *</Label>
        <select
          id="country"
          name="country"
          value={formData.country}
          onChange={handleInputChange}
          className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground ${
            errors.country ? "border-destructive" : "border-input"
          }`}
        >
          <option value="">Bitte wählen</option>
          <option value="DE">Deutschland</option>
          <option value="AT">Österreich</option>
          <option value="CH">Schweiz</option>
          <option value="other">Andere</option>
        </select>
        {errors.country && <p className="text-xs text-destructive mt-1">{errors.country}</p>}
      </div>
    </div>
  )
}
