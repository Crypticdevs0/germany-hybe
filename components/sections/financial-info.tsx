"use client"

import type React from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface FinancialProps {
  formData: any
  errors: Record<string, string>
  touched: Set<string>
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
  onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => void
}

export default function FinancialSection({ formData, errors, touched, onChange, onBlur }: FinancialProps) {
  const getFieldError = (fieldName: string) => (touched.has(fieldName) ? errors[fieldName] : "")

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="iban" className="font-semibold">
          IBAN *
        </Label>
        <Input
          id="iban"
          name="iban"
          type="text"
          value={formData.iban}
          onChange={onChange}
          onBlur={onBlur}
          placeholder="DE89 3704 0044 0532 0130 00"
          className={getFieldError("iban") ? "border-destructive" : ""}
          required
        />
        {getFieldError("iban") && <p className="text-sm text-destructive">{getFieldError("iban")}</p>}
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="bankName" className="font-semibold">
          Name der Bank *
        </Label>
        <Input
          id="bankName"
          name="bankName"
          type="text"
          value={formData.bankName}
          onChange={onChange}
          onBlur={onBlur}
          placeholder="Deutsche Bank"
          className={getFieldError("bankName") ? "border-destructive" : ""}
          required
        />
        {getFieldError("bankName") && <p className="text-sm text-destructive">{getFieldError("bankName")}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="bankRelationship" className="font-semibold">
          Wie lange Kunde? *
        </Label>
        <select
          id="bankRelationship"
          name="bankRelationship"
          value={formData.bankRelationship}
          onChange={onChange}
          onBlur={onBlur}
          className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            getFieldError("bankRelationship") ? "border-destructive" : ""
          }`}
          required
        >
          <option value="">Wählen Sie eine Option</option>
          <option value="under1">Unter 1 Jahr</option>
          <option value="1to2">1-2 Jahre</option>
          <option value="3to5">3-5 Jahre</option>
          <option value="over5">Über 5 Jahre</option>
        </select>
        {getFieldError("bankRelationship") && (
          <p className="text-sm text-destructive">{getFieldError("bankRelationship")}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="occupation" className="font-semibold">
          Beruf *
        </Label>
        <Input
          id="occupation"
          name="occupation"
          type="text"
          value={formData.occupation}
          onChange={onChange}
          onBlur={onBlur}
          placeholder="z.B. Software Engineer"
          className={getFieldError("occupation") ? "border-destructive" : ""}
          required
        />
        {getFieldError("occupation") && <p className="text-sm text-destructive">{getFieldError("occupation")}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="monthlySalary" className="font-semibold">
          Monatsgehalt (Brutto) *
        </Label>
        <select
          id="monthlySalary"
          name="monthlySalary"
          value={formData.monthlySalary}
          onChange={onChange}
          onBlur={onBlur}
          className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            getFieldError("monthlySalary") ? "border-destructive" : ""
          }`}
          required
        >
          <option value="">Wählen Sie einen Bereich</option>
          <option value="under1000">Unter 1.000€</option>
          <option value="1000to2500">1.000€ - 2.500€</option>
          <option value="2500to4000">2.500€ - 4.000€</option>
          <option value="4000to6000">4.000€ - 6.000€</option>
          <option value="over6000">Über 6.000€</option>
        </select>
        {getFieldError("monthlySalary") && <p className="text-sm text-destructive">{getFieldError("monthlySalary")}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="housingStatus" className="font-semibold">
          Wohnsituation *
        </Label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="housingStatus"
              value="tenant"
              checked={formData.housingStatus === "tenant"}
              onChange={onChange}
              className="h-4 w-4"
              required
            />
            <span className="text-sm">Mieter</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="housingStatus"
              value="owner"
              checked={formData.housingStatus === "owner"}
              onChange={onChange}
              className="h-4 w-4"
              required
            />
            <span className="text-sm">Eigentümer</span>
          </label>
        </div>
        {getFieldError("housingStatus") && <p className="text-sm text-destructive">{getFieldError("housingStatus")}</p>}
      </div>
    </div>
  )
}
