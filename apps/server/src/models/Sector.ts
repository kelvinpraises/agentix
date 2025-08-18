import { Insertable, Selectable, Updateable } from 'kysely'

import { SectorsTable } from '@/infrastructure/database/schema'

export type Sector = Selectable<SectorsTable>
export type NewSector = Insertable<SectorsTable>
export type SectorUpdate = Updateable<SectorsTable>