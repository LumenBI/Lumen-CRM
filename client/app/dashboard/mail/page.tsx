'use client'

import { useState, useEffect, useCallback } from 'react'
import { useApi } from '@/hooks/useApi'
import { useUser } from '@/context/UserContext'
import { useQuickActions } from '@/context/QuickActionsContext'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Loader2,
    Send,
    Plus,
    RefreshCw,
    Mail as MailIcon,
    ChevronRight,
    ArrowLeft,
    Inbox,
    ChevronLeft,
    FileText,
    Image as ImageIcon,
    Download,
    Paperclip,
    X,
    AlertCircle
} from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Textarea } from '../../../components/ui/textarea'
import { toast } from 'sonner'

interface Attachment {
    id: string
    filename: string
    mimeType: string
    size: number
    contentId?: string
}

interface Thread {
    id: string
    threadId: string
    subject: string
    from: string
    date: string
    snippet: string
}

interface MessageDetail extends Thread {
    body: string
    to: string
    messageId: string
    references: string
    attachments: Attachment[]
}

interface InboxResponse {
    messages: Thread[]
    nextPageToken?: string
}

// Utility to decode HTML entities using the browser's DOMParser
function decodeHtmlEntities(text: string) {
    if (!text) return ''
    try {
        const doc = new DOMParser().parseFromString(text, 'text/html')
        return doc.documentElement.textContent || text
    } catch (e) {
        return text
    }
}

// Utility to format file size
function formatFileSize(bytes: number) {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default function MailPage() {
    const { mail } = useApi()
    const { reauthorizeGoogle } = useUser()
    const { requestAction, clearAction } = useQuickActions()
    const [threads, setThreads] = useState<Thread[]>([])
    const [loading, setLoading] = useState(true)
    const [openCompose, setOpenCompose] = useState(false)
    const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null)
    const [messageDetail, setMessageDetail] = useState<MessageDetail | null>(null)
    const [loadingDetail, setLoadingDetail] = useState(false)
    const [needsGoogleAuth, setNeedsGoogleAuth] = useState(false)

    // Pagination state
    const [pageToken, setPageToken] = useState<string | undefined>(undefined)
    const [historyTokens, setHistoryTokens] = useState<string[]>([])
    const [limit, setLimit] = useState(50)

    // Compose form state
    const [to, setTo] = useState('')
    const [subject, setSubject] = useState('')
    const [message, setMessage] = useState('')
    const [sending, setSending] = useState(false)
    const [replyThreadId, setReplyThreadId] = useState<string | undefined>(undefined)
    const [replyInReplyTo, setReplyInReplyTo] = useState<string | undefined>(undefined)
    const [replyReferences, setReplyReferences] = useState<string | undefined>(undefined)

    const fetchInbox = useCallback(async (token?: string) => {
        setLoading(true)
        setNeedsGoogleAuth(false)
        try {
            const data: InboxResponse = await mail.getInbox(token, limit)
            setThreads(data.messages)
            setPageToken(data.nextPageToken)
        } catch (error: any) {
            console.error('Error fetching inbox:', error)
            const errorMsg = error.message || ''
            if (errorMsg.includes('Google Token') || errorMsg.includes('Unauthorized')) {
                setNeedsGoogleAuth(true)
            } else {
                toast.error('Error al cargar la bandeja de entrada')
            }
        } finally {
            setLoading(false)
        }
    }, [mail, limit])

    useEffect(() => {
        fetchInbox()
    }, [limit])

    useEffect(() => {
        if (requestAction === 'newEmail') {
            resetCompose()
            setOpenCompose(true)
            clearAction()
        }
    }, [requestAction, clearAction])

    const handleNextPage = () => {
        if (pageToken) {
            setHistoryTokens([...historyTokens, pageToken])
            fetchInbox(pageToken)
        }
    }

    const handlePrevPage = () => {
        const newHistory = [...historyTokens]
        newHistory.pop()
        const prevToken = newHistory[newHistory.length - 1]
        setHistoryTokens(newHistory)
        fetchInbox(prevToken)
    }

    const fetchMessageDetail = async (id: string) => {
        setLoadingDetail(true)
        setSelectedMessageId(id)
        try {
            const data = await mail.getMessage(id)
            setMessageDetail(data)
        } catch (error) {
            console.error('Error fetching message details:', error)
            toast.error('Error al cargar los detalles del correo')
        } finally {
            setLoadingDetail(false)
        }
    }

    const handleSend = async () => {
        if (!to || !subject || !message) {
            toast.error('Por favor completa todos los campos')
            return
        }

        setSending(true)
        try {
            await mail.send({
                to,
                subject,
                message,
                threadId: replyThreadId,
                inReplyTo: replyInReplyTo,
                references: replyReferences
            })
            setOpenCompose(false)
            resetCompose()
            toast.success('Correo enviado exitosamente')
        } catch (error) {
            console.error('Error sending email:', error)
            toast.error('Error al enviar el correo')
        } finally {
            setSending(false)
        }
    }

    const resetCompose = () => {
        setTo('')
        setSubject('')
        setMessage('')
        setReplyThreadId(undefined)
        setReplyInReplyTo(undefined)
        setReplyReferences(undefined)
    }

    const handleReply = () => {
        if (!messageDetail) return

        const emailMatch = messageDetail.from.match(/<(.+?)>/)
        const replyTo = emailMatch ? emailMatch[1] : messageDetail.from

        setTo(replyTo)
        setSubject(`Re: ${decodeHtmlEntities(messageDetail.subject)}`)
        setReplyThreadId(messageDetail.threadId)
        setReplyInReplyTo(messageDetail.messageId)
        setReplyReferences(messageDetail.references ? `${messageDetail.references} ${messageDetail.messageId}` : messageDetail.messageId)

        const quotedBody = `\n\n--- El ${messageDetail.date}, ${messageDetail.from} escribió: ---\n\n${messageDetail.body || messageDetail.snippet}`
        setMessage(quotedBody)
        setOpenCompose(true)
    }

    const handleForward = () => {
        if (!messageDetail) return

        setTo('')
        setSubject(`Fwd: ${decodeHtmlEntities(messageDetail.subject)}`)

        let attachmentNote = ''
        if (messageDetail.attachments.length > 0) {
            attachmentNote = `\n\n[IMPORTANTE: Este mensaje original contenía ${messageDetail.attachments.length} archivos adjuntos. Por seguridad, el sistema no los incluye automáticamente en el reenvío. Por favor, descárgalos y adjúntalos manualmente si los necesitas.]`
        }

        const quotedBody = `\n\n--- Mensaje reenviado ---${attachmentNote}\nDe: ${messageDetail.from}\nFecha: ${messageDetail.date}\nAsunto: ${messageDetail.subject}\nPara: ${messageDetail.to}\n\n${messageDetail.body || messageDetail.snippet}`
        setMessage(quotedBody)
        setOpenCompose(true)
    }

    const downloadAttachment = async (attachment: Attachment) => {
        if (!messageDetail) return

        const loadingToast = toast.loading(`Descargando ${attachment.filename}...`)
        try {
            const data = await mail.getAttachment(messageDetail.id, attachment.id)

            // Gmail returns base64url content in data.data
            const byteString = atob(data.data.replace(/-/g, '+').replace(/_/g, '/'))
            const ab = new ArrayBuffer(byteString.length)
            const ia = new Uint8Array(ab)
            for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i)
            }
            const blob = new Blob([ab], { type: attachment.mimeType })
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = attachment.filename
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            toast.dismiss(loadingToast)
            toast.success('Descarga completada')
        } catch (error) {
            console.error('Error downloading attachment:', error)
            toast.dismiss(loadingToast)
            toast.error('Error al descargar el archivo')
        }
    }

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] bg-[#F8FAFC] dark:bg-slate-950">
            {/* Standardized Header */}
            <PageHeader
                title="Buzón de Correos"
                subtitle="Gestiona tus comunicaciones desde aquí."
                icon={Inbox}
            >
                <div className="flex flex-wrap gap-2 w-full md:w-auto px-2">
                    <select
                        value={limit}
                        onChange={(e) => setLimit(parseInt(e.target.value))}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[14px] px-2 md:px-3 py-1.5 md:py-2 text-[10px] md:text-xs font-bold text-slate-600 dark:text-slate-300 outline-none shadow-sm flex-1 md:flex-none"
                    >
                        <option value={50}>50 / pág</option>
                        <option value={100}>100 / pág</option>
                    </select>
                    <Button variant="outline" size="icon" onClick={() => fetchInbox()} disabled={loading} className="bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all rounded-[14px] border-slate-200 dark:border-slate-800 h-9 w-9 md:h-10 md:w-10">
                        <RefreshCw className={`h-4 w-4 text-slate-600 dark:text-slate-400 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button
                        onClick={() => {
                            resetCompose()
                            setOpenCompose(true)
                        }}
                        className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white gap-2 shadow-lg shadow-blue-200 dark:shadow-none py-1.5 md:py-6 px-4 md:px-6 rounded-[14px] md:rounded-2xl font-bold transition-all hover:scale-[1.02] flex-1 md:flex-none text-xs md:text-base h-9 md:h-auto"
                    >
                        <Plus className="h-4 w-4 md:h-5 md:w-5" />
                        <span>Redactar</span>
                    </Button>
                </div>
            </PageHeader>

            <div className="flex flex-1 gap-6 overflow-hidden min-h-0 bg-white dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm p-3">
                {/* Email List */}
                <div className={`flex flex-col bg-white dark:bg-slate-900 overflow-hidden ${selectedMessageId ? 'hidden lg:flex lg:w-80 lg:shrink-0 border-r border-slate-50 dark:border-slate-800' : 'flex-1'}`}>
                    <div className="p-4 flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] ml-2">Inbox</span>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={handlePrevPage} disabled={historyTokens.length === 0 || loading} className="h-6 w-6 rounded-lg">
                                <ChevronLeft className="w-3 h-3 text-slate-400" />
                            </Button>
                            <span className="text-[10px] font-bold text-slate-400">Pág. {historyTokens.length + 1}</span>
                            <Button variant="ghost" size="icon" onClick={handleNextPage} disabled={!pageToken || loading} className="h-6 w-6 rounded-lg">
                                <ChevronRight className="w-3 h-3 text-slate-400" />
                            </Button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto divide-y divide-slate-50 custom-scrollbar pr-1">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-64 gap-3">
                                <Loader2 className="h-8 w-8 animate-spin text-blue-600/30" />
                            </div>
                        ) : needsGoogleAuth ? (
                            <div className="text-center py-20 px-6">
                                <div className="mx-auto w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 text-blue-600">
                                    <AlertCircle className="h-6 w-6" />
                                </div>
                                <h3 className="text-sm font-bold text-slate-800">Conexión con Google requerida</h3>
                                <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-bold mb-4">La sesión de Google ha expirado o no está vinculada</p>
                                <Button
                                    onClick={reauthorizeGoogle}
                                    className="bg-blue-600 hover:bg-blue-700 text-white gap-2 py-2 px-4 rounded-xl font-bold transition-all text-xs"
                                >
                                    Reconectar cuenta
                                </Button>
                            </div>
                        ) : threads.length === 0 ? (
                            <div className="text-center py-20 px-6">
                                <div className="mx-auto w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 text-slate-200">
                                    <MailIcon className="h-6 w-6" />
                                </div>
                                <h3 className="text-sm font-bold text-slate-800">No hay correos</h3>
                                <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-bold">Bandeja limpia</p>
                            </div>
                        ) : (
                            threads.map((thread) => (
                                <motion.div
                                    key={thread.id}
                                    onClick={() => fetchMessageDetail(thread.id)}
                                    className={`p-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all cursor-pointer group rounded-3xl mx-1 my-1 border-2 ${selectedMessageId === thread.id ? 'bg-blue-50/20 dark:bg-blue-900/20 border-blue-50 dark:border-blue-900/50' : 'border-transparent'}`}
                                >
                                    <div className="flex justify-between items-start mb-1.5">
                                        <span className={`font-bold text-xs truncate max-w-[150px] ${selectedMessageId === thread.id ? 'text-blue-700 dark:text-blue-400' : 'text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors'}`}>
                                            {thread.from.split('<')[0].trim() || 'Desconocido'}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600 group-hover:text-slate-400 whitespace-nowrap ml-2">
                                            {thread.date.split(',')[1]?.split(' ')[1] + ' ' + thread.date.split(',')[1]?.split(' ')[2] || ''}
                                        </span>
                                    </div>
                                    <h4 className={`text-[13px] font-bold mb-1.5 line-clamp-1 ${selectedMessageId === thread.id ? 'text-slate-800 dark:text-slate-200' : 'text-slate-600 dark:text-slate-400'}`}>
                                        {decodeHtmlEntities(thread.subject)}
                                    </h4>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-1 leading-relaxed group-hover:text-slate-500 font-medium">
                                        {decodeHtmlEntities(thread.snippet)}
                                    </p>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>

                {/* Email Detail Panel */}
                <div className={`flex flex-col flex-1 bg-white dark:bg-slate-900 overflow-hidden ${selectedMessageId ? 'flex' : 'hidden lg:flex lg:items-center lg:justify-center bg-slate-50/5 dark:bg-slate-900/5'}`}>
                    <AnimatePresence mode="wait">
                        {!selectedMessageId ? (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center p-12"
                            >
                                <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700 mb-8 inline-block">
                                    <MailIcon className="w-12 h-12 text-blue-100 dark:text-slate-700" />
                                </div>
                                <h3 className="text-slate-900 dark:text-white font-bold text-xl tracking-tight">Selecciona un correo</h3>
                                <p className="text-slate-400 dark:text-slate-500 text-sm max-w-xs mx-auto mt-3 font-medium">Gestiona tus comunicaciones con clientes y proveedores de forma centralizada.</p>
                            </motion.div>
                        ) : loadingDetail ? (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center h-full gap-4"
                            >
                                <Loader2 className="h-10 w-10 animate-spin text-blue-600/40" />
                                <p className="text-xs text-slate-400 font-black tracking-[0.3em] uppercase">Sincronizando...</p>
                            </motion.div>
                        ) : messageDetail ? (
                            <motion.div
                                key="content"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden"
                            >
                                {/* Detail Header */}
                                <div className="p-10 border-b border-slate-50 dark:border-slate-800 bg-slate-50/10 dark:bg-slate-800/20">
                                    <div className="flex lg:hidden mb-10">
                                        <button
                                            onClick={() => setSelectedMessageId(null)}
                                            className="bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 p-3 rounded-2xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95"
                                        >
                                            <ArrowLeft className="w-6 h-6" />
                                        </button>
                                    </div>

                                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white leading-tight mb-10 tracking-tight">
                                        {decodeHtmlEntities(messageDetail.subject)}
                                    </h2>

                                    <div className="flex items-center justify-between flex-wrap gap-6">
                                        <div className="flex items-center gap-5">
                                            <div className="w-14 h-14 bg-blue-600 dark:bg-blue-500 rounded-[1.25rem] flex items-center justify-center text-white font-bold text-2xl shadow-xl shadow-blue-100 dark:shadow-none ring-4 ring-blue-50 dark:ring-blue-900/10">
                                                {messageDetail.from.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-slate-900 dark:text-slate-100 text-lg leading-none">{messageDetail.from}</p>
                                                </div>
                                                <div className="flex items-center gap-4 mt-2">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[10px] font-black text-slate-300 dark:text-slate-500 uppercase tracking-widest px-1.5 py-0.5 rounded-md border border-slate-100 dark:border-slate-800">Para</span>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">{messageDetail.to || 'mí'}</p>
                                                    </div>
                                                    <span className="w-1.5 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full"></span>
                                                    <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">{messageDetail.date}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            <Button
                                                onClick={handleReply}
                                                variant="ghost"
                                                className="h-11 px-6 rounded-2xl text-xs font-bold border-2 border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-300 transition-all"
                                            >
                                                Responder
                                            </Button>
                                            <Button
                                                onClick={handleForward}
                                                variant="ghost"
                                                className="h-11 px-6 rounded-2xl text-xs font-bold border-2 border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-300 transition-all"
                                            >
                                                Reenviar
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Detail Body */}
                                <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                                    <div className="max-w-3xl mx-auto space-y-8">
                                        <div className="text-slate-800 dark:text-slate-100 whitespace-pre-wrap leading-relaxed text-base font-medium selection:bg-blue-100 dark:selection:bg-blue-900/30">
                                            {messageDetail.body || messageDetail.snippet}
                                        </div>

                                        {/* Attachments UI */}
                                        {messageDetail.attachments.length > 0 && (
                                            <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <Paperclip className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                                                    <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                                        Adjuntos ({messageDetail.attachments.length})
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {messageDetail.attachments.map((att) => (
                                                        <div
                                                            key={att.id}
                                                            className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:bg-slate-100/50 dark:hover:bg-slate-800 transition-all group"
                                                        >
                                                            <div className="flex items-center gap-3 overflow-hidden">
                                                                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm">
                                                                    {att.mimeType.startsWith('image/') ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                                                                </div>
                                                                <div className="overflow-hidden">
                                                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{att.filename}</p>
                                                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">{formatFileSize(att.size)}</p>
                                                                </div>
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => downloadAttachment(att)}
                                                                className="h-10 w-10 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 opacity-0 group-hover:opacity-100"
                                                            >
                                                                <Download className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ) : null}
                    </AnimatePresence>
                </div>
            </div>

            {/* Compose Modal */}
            <AnimatePresence>
                {openCompose && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 60 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 60 }}
                            className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 dark:border-slate-800"
                        >
                            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                                        {replyThreadId ? 'Responder' : 'Redactar'}
                                    </h2>
                                    <p className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">Star Cargo Service S.A.</p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setOpenCompose(false)}
                                    className="rounded-xl hover:bg-slate-100 h-8 w-8"
                                >
                                    <X className="h-4 w-4 text-slate-400" />
                                </Button>
                            </div>
                            <div className="p-6 space-y-4 overflow-y-auto max-h-[50vh] custom-scrollbar">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Para</label>
                                    <Input
                                        placeholder="correo@cliente.com"
                                        value={to}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTo(e.target.value)}
                                        className="h-10 rounded-lg bg-slate-50 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 focus:border-blue-200 dark:focus:border-blue-800 transition-all font-bold px-4 text-slate-800 dark:text-white text-xs"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Asunto</label>
                                    <Input
                                        placeholder="Asunto del correo..."
                                        value={subject}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSubject(e.target.value)}
                                        className="h-10 rounded-lg bg-slate-50 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 focus:border-blue-200 dark:focus:border-blue-800 transition-all font-bold px-4 text-slate-800 dark:text-white text-xs"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Mensaje</label>
                                    <Textarea
                                        placeholder="Escribe aquí..."
                                        rows={6}
                                        value={message}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
                                        className="rounded-xl bg-slate-50 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 focus:border-blue-200 dark:focus:border-blue-800 transition-all font-medium p-4 resize-none text-slate-700 dark:text-slate-200 text-xs min-h-[120px]"
                                    />
                                </div>
                            </div>
                            <div className="p-6 bg-slate-50/50 flex gap-3">
                                <Button
                                    onClick={() => setOpenCompose(false)}
                                    variant="ghost"
                                    className="flex-1 h-10 rounded-lg font-bold text-slate-400 hover:text-slate-900 transition-all text-xs"
                                >
                                    Descartar
                                </Button>
                                <Button
                                    onClick={handleSend}
                                    disabled={sending}
                                    className="flex-[1.5] h-10 rounded-lg bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-md shadow-blue-100 font-bold text-xs transition-all"
                                >
                                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                    Enviar
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #334155;
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #475569;
                }
            `}</style>
        </div>
    )
}
