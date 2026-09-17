import { useEffect, useState } from 'react'
import { fetchMySendHistory, replyToTrackedSend, subscribeToMySendHistory } from '../lib/api'
import { useAuth } from '../context/AuthContext'

function fmtDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function MyTrackedCommunications() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [drafts, setDrafts] = useState({})
  const [sendingId, setSendingId] = useState(null)
  const [error, setError] = useState('')

  const load = async () => {
    const data = await fetchMySendHistory()
    setItems(data)
    setLoading(false)
  }

  useEffect(() => {
    load()
    const unsubscribe = subscribeToMySendHistory(user?.id, load)
    return unsubscribe
  }, [user?.id])

  const sendReply = async (sendId) => {
    const message = (drafts[sendId] || '').trim()
    if (!message) return
    setError('')
    setSendingId(sendId)
    const result = await replyToTrackedSend(sendId, message)
    setSendingId(null)
    if (!result.success) {
      setError(result.error || 'Impossible d\'envoyer la réponse.')
      return
    }
    setDrafts(prev => ({ ...prev, [sendId]: '' }))
    load()
  }

  if (loading) return <p className="text-sm text-gray-400 py-4">Chargement des envois…</p>
  if (!items.length) return null

  return (
    <div className="space-y-3">
      {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>}
      {items.map(item => (
        <div key={item.id} className="rounded-xl border border-orias-border overflow-hidden">
          <div className="p-4 bg-orias-bg/60">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-orias-gold">Envoyé par l'équipe Oriafen</p>
                {item.title && <p className="font-semibold text-gray-800 mt-1">{item.title}</p>}
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0">{fmtDate(item.sentAt)}</span>
            </div>
            {item.message && <p className="text-sm text-gray-700 whitespace-pre-wrap mt-2">{item.message}</p>}
            {item.fileUrl && (
              <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex mt-2 text-sm font-medium text-orias-green hover:underline">
                {item.fileName || 'Voir le fichier'}
              </a>
            )}
          </div>

          {item.replies.length > 0 && (
            <div className="p-4 border-t border-orias-border space-y-2">
              {item.replies.map(reply => (
                <div key={reply.id} className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                  <p className="text-xs font-semibold text-emerald-700 mb-1">Votre réponse — {fmtDate(reply.createdAt)}</p>
                  <p className="text-sm text-emerald-900 whitespace-pre-wrap">{reply.message}</p>
                </div>
              ))}
            </div>
          )}

          {item.responseRequired && (
            <div className="p-4 border-t border-orias-border bg-white">
              <textarea
                value={drafts[item.id] || ''}
                onChange={e => setDrafts(prev => ({ ...prev, [item.id]: e.target.value }))}
                rows={2}
                className="input-field text-sm resize-none"
                placeholder={item.replies.length ? 'Ajouter une autre réponse…' : 'Répondre à cet envoi…'}
              />
              <button
                onClick={() => sendReply(item.id)}
                disabled={sendingId === item.id || !(drafts[item.id] || '').trim()}
                className="btn-green mt-2 text-sm disabled:opacity-50"
              >
                {sendingId === item.id ? 'Envoi…' : 'Envoyer ma réponse'}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
