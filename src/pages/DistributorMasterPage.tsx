import { PartyMasterPage } from './PartyMasterPage'

export function DistributorMasterPage() {
  return (
    <PartyMasterPage
      partyType="Distributor"
      title="Distributor Master"
      subtitle="Suppliers and purchase partners — loaded from the party API with party_type=Distributor."
    />
  )
}
