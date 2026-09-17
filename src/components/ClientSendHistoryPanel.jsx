import { useEffect, useState } from 'react'
import { fetchClientSendHistory, subscribeToClientSendHistory } from '../lib/api'

const KIND_LABELS = {
  message: 'Message',
  document: 'Document',
  final_document: 'Document final',
  marketing_file: 'Fichier marketing',
}

function fmtDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function ClientSendHistoryPanel({ clientId }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const data = await fetchClientSendHistory(clientId)
    setItems(data)
    setLoading(false)
  }

  useEffect(() => {
    setLoading(true)
    load()
    const unsubscribe = subscribeToClientSendHistory(clientId, load)
    return unsubscribe
  }, [clientId])

  if (loading) return <div className="card p-5 text-sm text-gray-400">Chargement de l'historique…</div>

  const waiting = items.filter(item => item.responseRequired && item.replies.length === 0).length
  const answered = items.filter(item => item.replies.length > 0).length

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h4 className="font-bold text-orias-green">Historique des envois et réponses</h4>
          <p className="text-xs text-gray-500 mt-1">Messages, documents et fichiers envoyés au client.</p>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">{waiting} en attente</span>
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">{answered} répondu</span>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-gray-400">Aucun envoi suivi pour ce client.</p>
      ) : (
        <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
          {items.map(item => {
            const hasReply = item.replies.length > 0
            const statusLabel = !item.responseRequired ? 'Pas de réponse requise' : hasReply ? 'Répondu' : 'En attente de réponse'
            const statusCls = !item.responseRequired
              ? 'bg-gray-50 text-gray-600 border-gray-200'
              : hasReply
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'

            return (
              <div key={item.id} className="rounded-xl border border-orias-border overflow-hidden">
                <div className="p-4 bg-orias-bg/50">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold uppercase tracking-wide text-orias-gold">{KIND_LABELS[item.kind] || item.kind}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${statusCls}`}>{statusLabel}</span>
                      </div>
                      {item.title && <p className="font-semibold text-gray-800 mt-1">{item.title}</p>}
                    </div>
                    <span className="text-xs text-gray-400">{fmtDate(item.sentAt)}</span>
                  </div>
                  {item.message && <p className="text-sm text-gray-700 whitespace-pre-wrap mt-2">{item.message}</p>}
                  {item.fileUrl && (
                    <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex mt-2 text-sm font-medium text-orias-green hover:underline">
                      {item.fileName || 'Ouvrir le fichier'}
                    </a>
                  )}
                </div>

                {item.replies.length > 0 && (
                  <div className="p-4 space-y-2 bg-white border-t border-orias-border">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Réponses reçues</p>
                    {item.replies.map(reply => (
                      <div key={reply.id} className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                        <p className="text-sm text-emerald-900 whitespace-pre-wrap">{reply.message}</p>
                        <p className="text-xs text-emerald-600 mt-1">{fmtDate(reply.createdAt)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
