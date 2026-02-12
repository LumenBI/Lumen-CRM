'use client'

import { useState, useRef, useEffect } from 'react'

interface EditableCellProps {
    value: string
    onSave: (newValue: string) => void
    isEditable?: boolean
    className?: string
}

export default function EditableCell({ value, onSave, isEditable = true, className = '' }: EditableCellProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [inputValue, setInputValue] = useState(value)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        setInputValue(value)
    }, [value])

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus()
            inputRef.current.select()
        }
    }, [isEditing])

    const handleDoubleClick = () => {
        if (isEditable) {
            setIsEditing(true)
        }
    }

    const handleBlur = () => {
        setIsEditing(false)
        if (inputValue !== value) {
            onSave(inputValue)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            setIsEditing(false)
            if (inputValue !== value) {
                onSave(inputValue)
            }
        } else if (e.key === 'Escape') {
            setIsEditing(false)
            setInputValue(value) // Reset
        }
    }

    if (isEditing) {
        return (
            <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className={`w-full bg-blue-50 border border-blue-200 rounded px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
            />
        )
    }

    return (
        <span
            onDoubleClick={handleDoubleClick}
            className={`cursor-pointer hover:bg-slate-100 px-2 py-1 -mx-2 rounded transition-colors block truncate
                ${isEditable ? 'hover:ring-1 hover:ring-slate-200' : ''} 
                ${className}`}
            title={isEditable ? "Doble clic para editar" : undefined}
        >
            {value}
        </span>
    )
}
