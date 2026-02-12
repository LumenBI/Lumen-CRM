import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
<<<<<<< HEAD
}
=======
}
>>>>>>> f3dfb7456178ded21d4d15ff7b691dd9702b6f69
