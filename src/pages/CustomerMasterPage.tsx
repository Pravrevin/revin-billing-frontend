import { PartyMasterPage } from './PartyMasterPage'

/** Do not offer these API fields as filter dropdowns on Customer Master. */
const CUSTOMER_FACET_BLOCKLIST = [
  'gstin',
  'gst_in',
  'gst_no',
  'gst_number',
  'opening_balance',
  'opening_balance_amount',
  'drug_license',
  'drug_license_no',
  'drug_licence_no',
  'email',
  'contact_email',
  'credit_limit',
  'credit_limit_amount',
  'credit_line',
] as const

export function CustomerMasterPage() {
  return (
    <PartyMasterPage
      partyType="Customer"
      title="Customer Master"
      subtitle="Retail walk-ins, credit customers, and prescription-linked profiles — loaded from the party API with party_type=Customer."
      facetKeyBlocklist={CUSTOMER_FACET_BLOCKLIST}
      customerTable
    />
  )
}
