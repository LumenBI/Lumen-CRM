import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
<<<<<<< HEAD
    const next = requestUrl.searchParams.get('next') ?? '/dashboard'
=======
>>>>>>> f3dfb7456178ded21d4d15ff7b691dd9702b6f69

    let origin = requestUrl.origin
    const host = request.headers.get('host')

    if (host && (origin.includes('0.0.0.0') || origin.includes('localhost'))) {
        const protocol = request.headers.get('x-forwarded-proto') || 'http'
        origin = `${protocol}://${host}`
    }

    if (code) {
        const supabase = await createClient()
<<<<<<< HEAD
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            const forwardedHost = request.headers.get('x-forwarded-host')
            const isLocalEnv = origin.includes('localhost')

            if (isLocalEnv) {
                return NextResponse.redirect(`${origin}${next}`)
            } else if (forwardedHost) {
                return NextResponse.redirect(`https://${forwardedHost}${next}`)
            } else {
                return NextResponse.redirect(`${origin}${next}`)
            }
        }
    }

    const errorCode = requestUrl.searchParams.get('error')
    const errorDescription = requestUrl.searchParams.get('error_description')

    if (errorCode) {
        return NextResponse.redirect(`${origin}/login?error=${errorCode}&error_description=${errorDescription}`)
    }

    // Return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/login?error=auth_code_error`)
=======
        await supabase.auth.exchangeCodeForSession(code)
    }

    const nextUrl = new URL('/dashboard', origin)
    return NextResponse.redirect(nextUrl)
>>>>>>> f3dfb7456178ded21d4d15ff7b691dd9702b6f69
}