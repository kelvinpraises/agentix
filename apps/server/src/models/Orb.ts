import { Insertable, Selectable, Updateable } from 'kysely'

import { OrbsTable } from '@/database/schema'

export type Orb = Selectable<OrbsTable>
export type NewOrb = Insertable<OrbsTable>
export type OrbUpdate = Updateable<OrbsTable>