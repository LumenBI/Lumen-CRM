import { useCallback, useEffect } from 'react';

interface ErrorPayload {
    message: string;
    stack: string;
    user?: string;
    device?: string;
}

export function useErrorReport() {
    const reportError = useCallback(async (error: Error, additionalContext?: string) => {
        try {
            const payload: ErrorPayload = {
                message: error.message,
                stack: error.stack || 'No stack trace',
                device: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server-side',
            };

            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/client-error`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
        } catch (err) {
            console.error('Failed to report error to backend:', err);
        }
    }, []);

    useEffect(() => {
        if (process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true') return;

        const handleGlobalError = (event: ErrorEvent) => {
            reportError(event.error || new Error(event.message));
        };

        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            reportError(event.reason instanceof Error ? event.reason : new Error(String(event.reason)));
        };

        window.addEventListener('error', handleGlobalError);
        window.addEventListener('unhandledrejection', handleUnhandledRejection);

        return () => {
            window.removeEventListener('error', handleGlobalError);
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        };
    }, [reportError]);

    return { reportError };
}
