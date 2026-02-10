'use client'

import { useState, useEffect, ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface ModalPortalProps {
    children: ReactNode
    onBackdropClick?: () => void
    backdropClassName?: string
}

/**
 * Reusable portal wrapper that eliminates the repeated mount/portal/backdrop
 * boilerplate from 9 modal components.
 *
 * Handles:
 * - Client-side mount check (SSR safe)
 * - createPortal to document.body
 * - Backdrop overlay with blur + animation
 */
export default function ModalPortal({ children, onBackdropClick, backdropClassName }: ModalPortalProps) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        return () => setMounted(false)
    }, [])

    if (!mounted) return null

    return createPortal(
        <div className={backdropClassName || "fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"}>
            {onBackdropClick && (
                <div
                    className="absolute inset-0"
                    onClick={onBackdropClick}
                />
            )}
            <div className="relative z-10">
                {children}
            </div>
        </div>,
        document.body
    )
}
