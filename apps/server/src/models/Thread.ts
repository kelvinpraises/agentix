import { Insertable, Selectable, Updateable } from 'kysely'

import { ThreadsTable } from '@/infrastructure/database/schema'

export type Thread = Selectable<ThreadsTable>
export type NewThread = Insertable<ThreadsTable>
export type ThreadUpdate = Updateable<ThreadsTable>