import { Insertable, Selectable, Updateable } from 'kysely'

import { JournalEntriesTable } from '@/database/schema'

export type JournalEntry = Selectable<JournalEntriesTable>
export type NewJournalEntry = Insertable<JournalEntriesTable>
export type JournalEntryUpdate = Updateable<JournalEntriesTable>
