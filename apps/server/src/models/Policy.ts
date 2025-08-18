import { Insertable, Selectable, Updateable } from 'kysely'

import { SectorPoliciesTable } from '@/infrastructure/database/schema'

export type Policy = Selectable<SectorPoliciesTable>
export type NewPolicy = Insertable<SectorPoliciesTable>
export type PolicyUpdate = Updateable<SectorPoliciesTable>
