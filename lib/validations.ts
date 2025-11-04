/**
 * Validation utilities for KYC form
 * German-specific validations for IBAN, phone numbers, postal codes, and age
 */

export const validations = {
  validateIBAN: (iban: string): boolean => {
    const cleaned = iban.replace(/\s/g, "").toUpperCase()
    if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/.test(cleaned)) return false

    // Luhn algorithm for IBAN checksum
    const rearranged = cleaned.slice(4) + cleaned.slice(0, 4)
    const digits = rearranged.replace(/[A-Z]/g, (char) => String(char.charCodeAt(0) - 55))
    let sum = 0
    for (let i = 0; i < digits.length; i++) {
      sum = (sum * 10 + Number.parseInt(digits[i])) % 97
    }
    return sum === 1
  },

  validatePhoneDE: (phone: string): boolean => {
    const cleaned = phone.replace(/\s|-|$$|$$/g, "")
    return /^(\+49|0049|0)[1-9]\d{1,14}$/.test(cleaned)
  },

  validatePostalCodeDE: (code: string): boolean => {
    return /^[0-9]{5}$/.test(code.trim())
  },

  validateAge: (dateOfBirth: string): boolean => {
    const today = new Date()
    const birth = new Date(dateOfBirth)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age >= 18
  },

  validateFile: (file: File, maxSizeMB = 5): { valid: boolean; error?: string } => {
    const maxBytes = maxSizeMB * 1024 * 1024
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"]

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: "Nur JPG, PNG und PDF erlaubt" }
    }
    if (file.size > maxBytes) {
      return { valid: false, error: `Datei zu groß. Maximum ${maxSizeMB}MB.` }
    }
    return { valid: true }
  },

  validateEmail: (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  },
}

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, "")
}

export const formatIBAN = (iban: string): string => {
  const cleaned = iban.replace(/\s/g, "").toUpperCase()
  return cleaned.replace(/(.{4})/g, "$1 ").trim()
}

export const formatPhoneDE = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, "")
  if (cleaned.length < 2) return cleaned

  const prefix = cleaned.startsWith("0") ? "0" : "+49"
  const rest = cleaned.startsWith("0") ? cleaned.slice(1) : cleaned.slice(2)

  return `${prefix} ${rest.slice(0, 3)} ${rest.slice(3, 6)} ${rest.slice(6)}`.trim()
}
