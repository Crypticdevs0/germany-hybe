/**
 * KYC Form Validation Utilities
 * Includes validators for IBAN, phone numbers, postal codes, and other KYC fields
 */

// IBAN Validation
export const validateIBAN = (iban: string): boolean => {
  if (!iban) return false

  // Remove spaces and convert to uppercase
  const cleanIBAN = iban.replace(/\s/g, "").toUpperCase()

  // Check IBAN format (2 letters, 2 digits, then alphanumeric)
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/.test(cleanIBAN)) {
    return false
  }

  // Move the first 4 characters to the end
  const rearranged = cleanIBAN.substring(4) + cleanIBAN.substring(0, 4)

  // Replace letters with numbers (A=10, B=11, ... Z=35)
  let numericIBAN = ""
  for (let i = 0; i < rearranged.length; i++) {
    const char = rearranged[i]
    if (char >= "0" && char <= "9") {
      numericIBAN += char
    } else {
      numericIBAN += (char.charCodeAt(0) - 55).toString()
    }
  }

  // Calculate mod 97
  let remainder = numericIBAN
  while (remainder.length > 2) {
    const block = remainder.substring(0, 9)
    remainder = ((Number.parseInt(block, 10) % 97).toString() + remainder.substring(9)).replace(/^0+/, "")
  }

  return Number.parseInt(remainder, 10) % 97 === 1
}

// German Phone Number Validation
export const validateGermanPhone = (phone: string): boolean => {
  if (!phone) return false

  // Remove spaces, hyphens, and parentheses
  const cleanPhone = phone.replace(/[\s\-()]/g, "")

  // German phone patterns:
  // +49 with 10-11 digits after country code
  // 0 with 10-11 digits
  const germanPhoneRegex = /^(\+49|0)[1-9]\d{8,10}$/

  return germanPhoneRegex.test(cleanPhone)
}

// German Postal Code Validation
export const validateGermanPostalCode = (postalCode: string): boolean => {
  if (!postalCode) return false

  // German postal codes: 5 digits
  const germanPostalCodeRegex = /^\d{5}$/

  return germanPostalCodeRegex.test(postalCode.replace(/\s/g, ""))
}

// Email Validation
export const validateEmail = (email: string): boolean => {
  if (!email) return false

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  return emailRegex.test(email)
}

// Name Validation (First and Last Name)
export const validateName = (name: string): boolean => {
  if (!name || name.trim().length === 0) return false

  // Allow letters, hyphens, apostrophes, and spaces
  const nameRegex = /^[a-zA-Z\s'-]{2,50}$/

  return nameRegex.test(name.trim())
}

// Date of Birth Validation
export const validateDateOfBirth = (dateString: string): boolean => {
  if (!dateString) return false

  const date = new Date(dateString)
  const today = new Date()

  // Check if valid date
  if (isNaN(date.getTime())) return false

  // Check if at least 18 years old
  let age = today.getFullYear() - date.getFullYear()
  const monthDiff = today.getMonth() - date.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age--
  }

  return age >= 18 && age <= 120
}

// Password Validation
export const validatePassword = (password: string): boolean => {
  if (!password || password.length < 8) return false

  // At least one uppercase, one lowercase, one number, one special character
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)

  return hasUppercase && hasLowercase && hasNumber && hasSpecialChar
}

// Account Holder Name Validation
export const validateAccountHolderName = (name: string): boolean => {
  if (!name || name.trim().length === 0) return false

  // Similar to name validation but can be more flexible for company names
  const nameRegex = /^[a-zA-Z0-9\s'-]{2,100}$/

  return nameRegex.test(name.trim())
}

// Country Code Validation
export const validateCountryCode = (code: string): boolean => {
  if (!code) return false

  // Valid ISO 3166-1 alpha-2 country codes (extended list for common countries)
  const validCountries = [
    "DE",
    "AT",
    "CH",
    "NL",
    "BE",
    "LU",
    "FR",
    "IT",
    "ES",
    "PL",
    "CZ",
    "US",
    "CA",
    "GB",
    "IE",
    "AU",
    "NZ",
    "SG",
    "JP",
    "CN",
    "IN",
    "BR",
  ]

  return validCountries.includes(code.toUpperCase())
}

// Nationality Validation
export const validateNationality = (nationality: string): boolean => {
  if (!nationality) return false

  const validNationalities = [
    "DE",
    "AT",
    "CH",
    "NL",
    "BE",
    "LU",
    "FR",
    "IT",
    "ES",
    "PL",
    "CZ",
    "US",
    "CA",
    "GB",
    "IE",
    "AU",
    "NZ",
    "SG",
    "JP",
    "CN",
    "IN",
    "BR",
  ]

  return validNationalities.includes(nationality.toUpperCase())
}

// Source of Funds Validation
export const validateSourceOfFunds = (source: string): boolean => {
  const validSources = ["salary", "business", "investment", "inheritance", "other"]
  return validSources.includes(source.toLowerCase())
}

// Street Address Validation
export const validateStreetAddress = (address: string): boolean => {
  if (!address || address.trim().length === 0) return false

  // Allow street name with optional house number
  // Move the dash or escape it to avoid a range in the character class
  const addressRegex = /^[a-zA-Z0-9\s'.,\-]{5,100}$/

  return addressRegex.test(address.trim())
}

// City Validation
export const validateCity = (city: string): boolean => {
  if (!city || city.trim().length === 0) return false

  // Allow letters, hyphens, and spaces
  const cityRegex = /^[a-zA-Z\s'-]{2,50}$/

  return cityRegex.test(city.trim())
}

// Comprehensive KYC Form Validation
export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
}

export const validateKYCStep = (step: number, formData: Record<string, any>): ValidationResult => {
  const errors: Record<string, string> = {}

  switch (step) {
    case 1: // Personal Information
      if (!validateName(formData.firstName)) {
        errors.firstName = "First name is invalid (2-50 characters, letters only)"
      }
      if (!validateName(formData.lastName)) {
        errors.lastName = "Last name is invalid (2-50 characters, letters only)"
      }
      if (!validateDateOfBirth(formData.dateOfBirth)) {
        errors.dateOfBirth = "You must be at least 18 years old"
      }
      if (!validateNationality(formData.nationality)) {
        errors.nationality = "Invalid nationality"
      }
      if (!validateEmail(formData.email)) {
        errors.email = "Invalid email format"
      }
      if (!validateGermanPhone(formData.phone)) {
        errors.phone = "Invalid German phone number (e.g., +49 123 456789)"
      }
      break

    case 2: // Address
      if (!validateStreetAddress(formData.street)) {
        errors.street = "Invalid street address"
      }
      if (!validateCity(formData.city)) {
        errors.city = "Invalid city name"
      }
      if (!validateGermanPostalCode(formData.postalCode)) {
        errors.postalCode = "Invalid postal code (5 digits required)"
      }
      if (!validateCountryCode(formData.country)) {
        errors.country = "Invalid country"
      }
      break

    case 3: // Financial
      if (!validateIBAN(formData.iban)) {
        errors.iban = "Invalid IBAN format"
      }
      if (!validateAccountHolderName(formData.accountHolderName)) {
        errors.accountHolderName = "Invalid account holder name"
      }
      if (!validateSourceOfFunds(formData.sourceOfFunds)) {
        errors.sourceOfFunds = "Invalid source of funds"
      }
      break

    case 4: // Security
      if (!validatePassword(formData.password)) {
        errors.password =
          "Password must be at least 8 characters with uppercase, lowercase, numbers, and special characters"
      }
      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = "Passwords do not match"
      }
      if (!formData.acceptTerms) {
        errors.acceptTerms = "You must accept the terms and conditions"
      }
      break

    case 5: // Documents
      if (!formData.documents || formData.documents.length === 0) {
        errors.documents = "At least one document is required"
      }
      break
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}
