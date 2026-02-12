'use client'

import { useState, useEffect, ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface ModalPortalProps {
    children: ReactNode
    onBackdropClick?: () => void
    backdropClassName?: string
}

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
