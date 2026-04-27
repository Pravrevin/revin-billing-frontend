/** Party row from `GET /api/v1/party-master/?party_type=…` — backend may send extra keys. */
export type PartyMaster = {
  id: number
} & Record<string, unknown>
