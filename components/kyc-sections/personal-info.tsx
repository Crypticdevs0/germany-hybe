"use client"

import type React from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface PersonalInfoProps {
  formData: any
  errors: any
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
}

export default function PersonalInfoSection({ formData, errors, handleInputChange }: PersonalInfoProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">Vorname *</Label>
          <Input
            id="firstName"
            name="firstName"
            type="text"
            value={formData.firstName}
            onChange={handleInputChange}
            placeholder="Max"
            className={errors.firstName ? "border-destructive" : ""}
          />
          {errors.firstName && <p className="text-xs text-destructive mt-1">{errors.firstName}</p>}
        </div>
        <div>
          <Label htmlFor="lastName">Nachname *</Label>
          <Input
            id="lastName"
            name="lastName"
            type="text"
            value={formData.lastName}
            onChange={handleInputChange}
            placeholder="Mustermann"
            className={errors.lastName ? "border-destructive" : ""}
          />
          {errors.lastName && <p className="text-xs text-destructive mt-1">{errors.lastName}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="dateOfBirth">Geburtsdatum *</Label>
          <Input
            id="dateOfBirth"
            name="dateOfBirth"
            type="date"
            value={formData.dateOfBirth}
            onChange={handleInputChange}
            className={errors.dateOfBirth ? "border-destructive" : ""}
          />
          {errors.dateOfBirth && <p className="text-xs text-destructive mt-1">{errors.dateOfBirth}</p>}
        </div>
        <div>
          <Label htmlFor="nationality">Staatsangehörigkeit *</Label>
          <select
            id="nationality"
            name="nationality"
            value={formData.nationality}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground ${
              errors.nationality ? "border-destructive" : "border-input"
            }`}
          >
            <option value="">Bitte wählen</option>
            <option value="DE">Deutsch</option>
            <option value="AT">Österreichisch</option>
            <option value="CH">Schweizerisch</option>
            <option value="other">Andere</option>
          </select>
          {errors.nationality && <p className="text-xs text-destructive mt-1">{errors.nationality}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="email">E-Mail-Adresse *</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleInputChange}
          placeholder="max.mustermann@beispiel.de"
          className={errors.email ? "border-destructive" : ""}
        />
        {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
      </div>

      <div>
        <Label htmlFor="phone">Telefonnummer *</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleInputChange}
          placeholder="+49 123 456789"
          className={errors.phone ? "border-destructive" : ""}
        />
        {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
        <p className="text-xs text-muted-foreground mt-1">Format: +49 für Deutschland</p>
      </div>
    </div>
  )
}
