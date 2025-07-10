import { Insertable, Selectable, Updateable } from 'kysely'

import { UserPoliciesTable } from '@/database/schema'

export type Policy = Selectable<UserPoliciesTable>
export type NewPolicy = Insertable<UserPoliciesTable>
export type PolicyUpdate = Updateable<UserPoliciesTable>
