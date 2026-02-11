import { useCallback, useRef, useState } from 'react'

interface Options {
    shouldPreventDefault?: boolean
    delay?: number
}

const useLongPress = (
    onLongPress: (e: React.MouseEvent | React.TouchEvent) => void,
    onClick: (e: React.MouseEvent | React.TouchEvent) => void,
    { shouldPreventDefault = true, delay = 500 }: Options = {}
) => {
    const [longPressTriggered, setLongPressTriggered] = useState(false)
    const timeout = useRef<NodeJS.Timeout | undefined>(undefined)
    const target = useRef<EventTarget | undefined>(undefined)

    const start = useCallback(
        (e: React.MouseEvent | React.TouchEvent) => {
            const currentTarget = e.currentTarget

            if (shouldPreventDefault && currentTarget) {
                target.current = currentTarget as EventTarget
            }
            timeout.current = setTimeout(() => {
                onLongPress(e)
                setLongPressTriggered(true)
            }, delay)
        },
        [onLongPress, delay, shouldPreventDefault]
    )

    const clear = useCallback(
        (e: React.MouseEvent | React.TouchEvent, shouldTriggerClick = true) => {
            timeout.current && clearTimeout(timeout.current)
            shouldTriggerClick && !longPressTriggered && onClick(e)
            setLongPressTriggered(false)
            if (shouldPreventDefault && target.current) {
                target.current = undefined
            }
        },
        [shouldPreventDefault, onClick, longPressTriggered]
    )

    return {
        onMouseDown: (e: React.MouseEvent) => start(e),
        onTouchStart: (e: React.TouchEvent) => start(e),
        onMouseUp: (e: React.MouseEvent) => clear(e),
        onMouseLeave: (e: React.MouseEvent) => clear(e, false),
        onTouchEnd: (e: React.TouchEvent) => clear(e)
    }
}

export default useLongPress
