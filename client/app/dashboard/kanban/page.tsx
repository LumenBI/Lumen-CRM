import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import KanbanView from './KanbanView'

export default async function KanbanPage() {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
        redirect('/')
    }

    return (
        <KanbanView />
    )
}
