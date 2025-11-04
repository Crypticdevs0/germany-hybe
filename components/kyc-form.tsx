"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle } from "lucide-react"
import PersonalInfoSection from "./kyc-sections/personal-info"
import AddressSection from "./kyc-sections/address"
import FinancialSection from "./kyc-sections/financial"
import SecuritySection from "./kyc-sections/security"
import DocumentUploadSection from "./kyc-sections/document-upload"
import { useRouter } from "next/navigation"
import ConfirmDetailsModal from "./confirm-details-modal"
import RedirectOverlay from "./redirect-overlay"

interface FormData {
  // Personal Info
  firstName: string
  lastName: string
  dateOfBirth: string
  nationality: string
  email: string
  phone: string

  // Address
  street: string
  city: string
  postalCode: string
  country: string

  // Financial
  iban: string
  accountHolderName: string
  sourceOfFunds: string

  // Security
  password: string
  confirmPassword: string
  acceptTerms: boolean

  // Documents
  documents: File[]
}

interface Errors {
  [key: string]: string
}

export default function KYCForm() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    nationality: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    postalCode: "",
    country: "",
    iban: "",
    accountHolderName: "",
    sourceOfFunds: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
    documents: [],
  })

  const [errors, setErrors] = useState<Errors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showRedirect, setShowRedirect] = useState(false)
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement
    const inputValue = type === "checkbox" ? (e.target as HTMLInputElement).checked : value

    setFormData((prev) => ({
      ...prev,
      [name]: inputValue,
    }))

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleDocumentsChange = (files: File[]) => {
    setFormData((prev) => ({
      ...prev,
      documents: files,
    }))
  }

  const validateCurrentStep = (): boolean => {
    const newErrors: Errors = {}

    switch (currentStep) {
      case 1: // Personal Info
        if (!formData.firstName.trim()) newErrors.firstName = "First name is required"
        if (!formData.lastName.trim()) newErrors.lastName = "Last name is required"
        if (!formData.dateOfBirth) newErrors.dateOfBirth = "Date of birth is required"
        if (!formData.nationality) newErrors.nationality = "Nationality is required"
        if (!formData.email.trim()) newErrors.email = "Email is required"
        if (formData.email && !formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
          newErrors.email = "Invalid email format"
        }
        if (!formData.phone.trim()) newErrors.phone = "Phone number is required"
        break

      case 2: // Address
        if (!formData.street.trim()) newErrors.street = "Street address is required"
        if (!formData.city.trim()) newErrors.city = "City is required"
        if (!formData.postalCode.trim()) newErrors.postalCode = "Postal code is required"
        if (!formData.country) newErrors.country = "Country is required"
        break

      case 3: // Financial
        if (!formData.iban.trim()) newErrors.iban = "IBAN is required"
        if (!formData.accountHolderName.trim()) newErrors.accountHolderName = "Account holder name is required"
        if (!formData.sourceOfFunds) newErrors.sourceOfFunds = "Source of funds is required"
        break

      case 4: // Security
        if (!formData.password) newErrors.password = "Password is required"
        if (formData.password && formData.password.length < 8) {
          newErrors.password = "Password must be at least 8 characters"
        }
        if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = "Passwords do not match"
        }
        if (!formData.acceptTerms) newErrors.acceptTerms = "You must accept the terms"
        break

      case 5: // Documents
        if (formData.documents.length === 0) {
          newErrors.documents = "At least one document is required"
        }
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, 5))
    }
  }

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateCurrentStep()) {
      setShowConfirm(true)
    }
  }

  const submitToNetlify = async () => {
    setIsSubmitting(true)
    setSubmitError(null)
    setShowConfirm(false)
    setShowRedirect(true)
    try {
      const netlifyFormData = new FormData()
      netlifyFormData.append("form-name", "kyc-verification")

      Object.entries(formData).forEach(([key, value]) => {
        if (key === "documents") {
          formData.documents.forEach((file, index) => {
            netlifyFormData.append(`document-${index + 1}`, file)
          })
        } else if (typeof value === "boolean") {
          netlifyFormData.append(key, value ? "yes" : "no")
        } else {
          netlifyFormData.append(key, String(value))
        }
      })

      const response = await fetch("/", {
        method: "POST",
        body: netlifyFormData,
      })

      if (!response.ok) {
        throw new Error("Form submission failed")
      }

      router.push("/success")
    } catch (error) {
      console.error("Submission error:", error)
      setSubmitError("Es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.")
      setShowRedirect(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const steps = [
    { number: 1, title: "Personal Information", label: "Step 1" },
    { number: 2, title: "Address", label: "Step 2" },
    { number: 3, title: "Financial Information", label: "Step 3" },
    { number: 4, title: "Security", label: "Step 4" },
    { number: 5, title: "Documents", label: "Step 5" },
  ]

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">KYC-Verifizierung</h1>
          <p className="text-muted-foreground">Vervollständigen Sie Ihren Identitätsverifizierungsprozess</p>
        </div>

        {/* Success and Error Alerts */}
        {submitSuccess && (
          <Alert className="mb-6 border-green-500 bg-green-50 dark:bg-green-950">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              Vielen Dank! Ihre KYC-Verifizierung wurde erfolgreich übermittelt. Wir werden Ihre Informationen prüfen
              und uns in Kürze bei Ihnen melden.
            </AlertDescription>
          </Alert>
        )}

        {submitError && (
          <Alert className="mb-6 border-red-500 bg-red-50 dark:bg-red-950">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 dark:text-red-200">{submitError}</AlertDescription>
          </Alert>
        )}

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-8">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm transition-colors ${
                    currentStep >= step.number ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step.number}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 rounded transition-colors ${
                      currentStep > step.number ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">{steps[currentStep - 1].label}</p>
            <h2 className="text-xl font-semibold text-foreground">{steps[currentStep - 1].title}</h2>
          </div>
        </div>

        {/* Form Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">{steps[currentStep - 1].title}</CardTitle>
            <CardDescription>
              {currentStep === 1 && "Geben Sie Ihre persönlichen Informationen ein"}
              {currentStep === 2 && "Geben Sie Ihre Wohnadresse an"}
              {currentStep === 3 && "Geben Sie Ihre Finanzdaten ein"}
              {currentStep === 4 && "Richten Sie Ihre Kontosicherheit ein"}
              {currentStep === 5 && "Laden Sie die erforderlichen Dokumente hoch"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Netlify Forms hidden fields and honeypot */}
            <form
              onSubmit={handleSubmit}
              className="space-y-6"
              name="kyc-verification"
              data-netlify="true"
              data-netlify-honeypot="bot-field"
            >
              <input type="hidden" name="form-name" value="kyc-verification" />
              <div className="hidden">
                <label>
                  Don't fill this out if you're human: <input name="bot-field" />
                </label>
              </div>

              {/* Step Sections */}
              {currentStep === 1 && (
                <PersonalInfoSection formData={formData} errors={errors} handleInputChange={handleInputChange} />
              )}

              {currentStep === 2 && (
                <AddressSection formData={formData} errors={errors} handleInputChange={handleInputChange} />
              )}

              {currentStep === 3 && (
                <FinancialSection formData={formData} errors={errors} handleInputChange={handleInputChange} />
              )}

              {currentStep === 4 && (
                <SecuritySection formData={formData} errors={errors} handleInputChange={handleInputChange} />
              )}

              {currentStep === 5 && (
                <DocumentUploadSection formData={formData} errors={errors} onDocumentsChange={handleDocumentsChange} />
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevStep}
                  disabled={currentStep === 1}
                  className="flex-1 bg-transparent"
                >
                  Zurück
                </Button>
                {currentStep < 5 ? (
                  <Button type="button" onClick={handleNextStep} className="flex-1">
                    Weiter
                  </Button>
                ) : (
                  <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting ? "Wird übermittelt..." : "Verifizierung abschließen"}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Form Summary */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Ihre Informationen sind sicher und verschlüsselt. Wir verwenden diese Daten ausschließlich zur
                Identitätsverifizierung.
              </p>
              <p className="text-xs text-muted-foreground">
                Durch das Absenden dieses Formulars stimmen Sie unseren Datenschutzbestimmungen gemäß DSGVO zu.
              </p>
            </div>
          </CardContent>
        </Card>
        <ConfirmDetailsModal
          open={showConfirm}
          onCancel={() => setShowConfirm(false)}
          onConfirm={submitToNetlify}
          formData={formData}
        />
        <RedirectOverlay show={showRedirect} message="Weiterleitung zur Erfolgsseite..." />
      </div>
    </div>
  )
}
