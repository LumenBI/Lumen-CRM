import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')

    let origin = requestUrl.origin
    const host = request.headers.get('host')

    if (host && (origin.includes('0.0.0.0') || origin.includes('localhost'))) {
        const protocol = request.headers.get('x-forwarded-proto') || 'http'
        origin = `${protocol}://${host}`
    }

    if (code) {
        const supabase = await createClient()
        await supabase.auth.exchangeCodeForSession(code)
    }

    const nextUrl = new URL('/dashboard', origin)
    return NextResponse.redirect(nextUrl)
}