import { useState, useEffect } from 'react'
import { FAQ_ITEMS } from '../../data/mockData'
import { WhatsAppIcon, ChevronDownIcon, CalendarIcon, MessageIcon } from '../../components/Icons'
import { submitSupportTicket, fetchMyTickets, fetchMyMessages, markMessageRead, subscribeToMyCommunications, TICKET_CATEGORY_LABELS } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { getClientSends, replyToClientSend, subscribeToClientTracking } from '../../local/clientTrackingStore'

const TICKET_STATUS_STYLES = {
  nouveau:  { label: 'En attente de réponse', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  en_cours: { label: 'En cours de traitement', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  resolu:   { label: 'Répondu', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatDuration(fromStr, toStr) {
  if (!fromStr || !toStr) return ''
  const ms = new Date(toStr).getTime() - new Date(fromStr).getTime()
  if (ms < 0) return ''
  const minutes = Math.round(ms / 60000)
  if (minutes < 60) return `${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} h`
  const days = Math.round(hours / 24)
  return `${days} j`
}

function MesMessages() {
  const { user } = useAuth()
  const [tickets, setTickets] = useState([])
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)

  const load = () => {
    Promise.all([fetchMyTickets(), fetchMyMessages()]).then(([t, m]) => {
      setTickets(t)
      setMessages(m)
      setLoading(false)
      // Marque les messages non lus comme lus une fois affichés
      m.filter(msg => !msg.read_at).forEach(msg => markMessageRead(msg.id))
    })
  }

  useEffect(() => {
    load()
    const unsubscribe = subscribeToMyCommunications(user?.id, () => load())
    return unsubscribe
  }, [user?.id])

  const items = [
    ...tickets.map(t => ({ type: 'ticket', date: t.created_at, data: t })),
    ...messages.map(m => ({ type: 'message', date: m.created_at, data: m })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date))

  if (loading) {
    return <div className="text-center py-8 text-gray-400 text-sm">Chargement de vos échanges...</div>
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        Aucun échange pour l'instant. Utilisez le formulaire ci-dessous pour nous écrire.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {items.map(item => {
        if (item.type === 'message') {
          const m = item.data
          const key = `msg-${m.id}`
          const isOpen = expandedId === key
          return (
            <div key={key} className="rounded-xl border border-orias-gold/30 bg-orias-gold/5 overflow-hidden">
              <button
                onClick={() => setExpandedId(isOpen ? null : key)}
                className="w-full text-left px-4 py-3 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <span className="text-xs font-bold text-orias-gold uppercase tracking-wide">Message de l'équipe Oriafen</span>
                  {!isOpen && <p className="text-sm text-gray-700 truncate mt-0.5">{m.message}</p>}
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">{formatDate(m.created_at)}</span>
              </button>
              {isOpen && (
                <div className="px-4 pb-4">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{m.message}</p>
                </div>
              )}
            </div>
          )
        }
        const t = item.data
        const key = `ticket-${t.id}`
        const isOpen = expandedId === key
        const statusStyle = TICKET_STATUS_STYLES[t.status] || TICKET_STATUS_STYLES.nouveau
        const duration = t.response ? formatDuration(t.created_at, t.updated_at) : ''
        return (
          <div key={key} className="rounded-xl border border-orias-border overflow-hidden">
            <button
              onClick={() => setExpandedId(isOpen ? null : key)}
              className="w-full text-left bg-orias-bg px-4 py-3 flex items-center justify-between gap-2 flex-wrap"
            >
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <span className="font-semibold text-gray-800 text-sm truncate">{t.subject}</span>
                {t.category && TICKET_CATEGORY_LABELS[t.category] && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orias-green/10 text-orias-green flex-shrink-0">{TICKET_CATEGORY_LABELS[t.category]}</span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${statusStyle.cls}`}>{statusStyle.label}</span>
                <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </div>
            </button>
            {isOpen && (
              <div className="p-4 space-y-3">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Envoyé le {formatDate(t.created_at)} — vous</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{t.message}</p>
                </div>
                {t.response ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                    <p className="text-xs text-emerald-600 font-semibold mb-1">
                      Réponse de l'équipe Oriafen — {formatDate(t.updated_at)}
                      {duration && <span className="font-normal text-emerald-500"> (traité en {duration})</span>}
                    </p>
                    <p className="text-sm text-emerald-800 whitespace-pre-wrap">{t.response}</p>
                  </div>
                ) : (
                  <p className="text-xs text-amber-600 font-medium">En attente de réponse de notre équipe.</p>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

const LOCAL_SEND_STATUS = {
  waiting: { label: 'En attente de réponse', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  replied: { label: 'Répondu', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  no_response_required: { label: 'Information', cls: 'bg-orias-bg text-gray-600 border-orias-border' },
}

function LocalTrackedCommunications({ onNavigate }) {
  const [items, setItems] = useState(() => getClientSends(6))
  const [drafts, setDrafts] = useState({})
  const [sendingId, setSendingId] = useState(null)

  useEffect(() => subscribeToClientTracking(() => setItems(getClientSends(6))), [])

  const sendReply = (item) => {
    const message = (drafts[item.id] || '').trim()
    if (!message || sendingId === item.id || item.status === 'replied') return
    setSendingId(item.id)
    if (replyToClientSend(item.id, message)) {
      setDrafts(prev => ({ ...prev, [item.id]: '' }))
    }
    setSendingId(null)
  }

  return (
    <div className="space-y-3">
      {items.map(item => {
        const status = LOCAL_SEND_STATUS[item.status] || LOCAL_SEND_STATUS.waiting
        return (
          <article key={item.id} className="rounded-2xl border border-[#e8e2d6] bg-white p-5 space-y-3 shadow-[0_4px_18px_rgba(26,61,43,0.04)]">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-orias-gold">{item.kind}</span>
                <h3 className="font-bold text-orias-green mt-1">{item.title}</h3>
              </div>
              <time className="text-xs text-gray-400 flex-shrink-0">{item.sentAt}</time>
            </div>
            {item.message && <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.message}</p>}
            {item.fileName && (
              <button type="button" onClick={() => onNavigate?.('documents')} className="inline-flex items-center gap-2 rounded-xl bg-orias-bg border border-orias-border px-3 py-2 text-sm font-medium text-orias-green hover:bg-orias-green/10 transition-colors">
                <span className="text-orias-gold" aria-hidden="true">▣</span>{item.fileName}
              </button>
            )}
            <span className={`inline-flex text-xs font-semibold px-2.5 py-1 rounded-full border ${status.cls}`}>{status.label}</span>
            {item.response && (
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                <p className="text-xs text-emerald-700 font-semibold mb-1">Votre réponse · {item.response.respondedAt}</p>
                <p className="text-sm text-emerald-900 whitespace-pre-wrap">{item.response.message}</p>
              </div>
            )}
            {item.responseRequired && item.status !== 'replied' && (
              <div className="border-t border-orias-border pt-3">
                <textarea
                  value={drafts[item.id] || ''}
                  onChange={e => setDrafts(prev => ({ ...prev, [item.id]: e.target.value }))}
                  rows={2}
                  className="input-field text-sm resize-none border-[#e8e2d6] focus:border-orias-gold"
                  placeholder="Écrire une réponse à l'équipe…"
                />
                <button
                  onClick={() => sendReply(item)}
                  disabled={sendingId === item.id || !(drafts[item.id] || '').trim()}
                  className="btn-green mt-2 text-sm shadow-sm disabled:opacity-50"
                >
                  {sendingId === item.id ? 'Envoi…' : 'Répondre'}
                </button>
              </div>
            )}
          </article>
        )
      })}
    </div>
  )
}

function FAQItem({ item }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-orias-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left flex items-center justify-between gap-3 p-5 hover:bg-orias-bg transition-colors"
      >
        <span className="font-semibold text-gray-800 text-sm leading-relaxed pr-4">{item.question}</span>
        <ChevronDownIcon className={`w-5 h-5 text-orias-gold flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-orias-border">
          <p className="text-sm text-gray-600 leading-relaxed pt-4">{item.answer}</p>
        </div>
      )}
    </div>
  )
}

export default function Support({ onNavigate }) {
  const [form, setForm] = useState({ sujet: '', message: '', priority: 'normal', category: '' })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const result = await submitSupportTicket({ subject: form.sujet, message: form.message, priority: form.priority, category: form.category })
    setSubmitting(false)
    if (result.success) {
      setSubmitted(true)
      setTimeout(() => { setSubmitted(false); setForm({ sujet: '', message: '', priority: 'normal', category: '' }) }, 4000)
    } else {
      setError(result.error || 'Erreur lors de l\'envoi. Réessayez ou contactez-nous sur WhatsApp.')
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <div style={{
          background: 'linear-gradient(135deg, #3d604d 0%, #1a3d2b 100%)',
          borderRadius: '20px',
          padding: '30px 34px',
          boxShadow: '0 4px 24px rgba(26,61,43,0.14)',
          border: '1px solid rgba(201,168,76,0.18)',
        }}>
          <div style={{ height: '2px', background: 'linear-gradient(90deg, transparent, #c9a84c, transparent)', marginBottom: '22px', borderRadius: '2px' }} />
          <p style={{ margin: 0, color: '#c9a84c', fontSize: '10px', fontWeight: 700, letterSpacing: '1.6px', textTransform: 'uppercase', fontFamily: "'Montserrat', sans-serif" }}>
            Espace client
          </p>
          <h2 style={{ margin: '8px 0 6px', color: '#fff', fontSize: '30px', fontWeight: 400, letterSpacing: '0.5px', fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
            Mes échanges
          </h2>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.68)', fontSize: '13px', fontWeight: 300, fontFamily: "'Montserrat', sans-serif" }}>
            Retrouvez ici vos messages, documents et réponses avec l’équipe Oriafen.
          </p>
          <p style={{ margin: '16px 0 0', color: 'rgba(255,255,255,0.42)', fontSize: '10px', fontFamily: "'Montserrat', sans-serif" }}>
            Démonstration locale · données fictives
          </p>
        </div>
        <div style={{ marginTop: '22px' }}>
          <LocalTrackedCommunications onNavigate={onNavigate} />
        </div>
      </section>

      <div className="card p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-full bg-orias-gold/10 flex items-center justify-center">
            <MessageIcon className="w-4 h-4 text-orias-gold" />
          </div>
          <div>
            <h3 className="font-bold text-orias-green text-lg">Demandes de support</h3>
            <p className="text-xs text-gray-500">Vos échanges avec l’équipe de support</p>
          </div>
        </div>
        <MesMessages />
      </div>

      <div className="card p-6">
        <h2 className="section-title">Support & Assistance</h2>
        <p className="section-subtitle">Notre équipe est là pour vous accompagner</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* WhatsApp */}
          <a
            href="https://wa.me/212600000000"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-[#25d366] bg-[#25d366]/5 hover:bg-[#25d366]/10 transition-all duration-200 group"
          >
            <div className="w-12 h-12 rounded-full bg-[#25d366] flex items-center justify-center shadow-lg shadow-[#25d366]/30 group-hover:scale-110 transition-transform">
              <WhatsAppIcon className="w-6 h-6 text-white" />
            </div>
            <div className="text-center">
              <p className="font-bold text-gray-800">WhatsApp Direct</p>
              <p className="text-xs text-gray-500 mt-0.5">Réponse en moins de 2h</p>
              <p className="text-xs text-[#25d366] font-semibold mt-1">9h – 20h GMT+1</p>
            </div>
          </a>

          {/* Calendly */}
          <div className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-orias-gold bg-orias-gold/5 hover:bg-orias-gold/10 transition-all duration-200 cursor-pointer group">
            <div className="w-12 h-12 rounded-full bg-orias-gold flex items-center justify-center shadow-lg shadow-orias-gold/30 group-hover:scale-110 transition-transform">
              <CalendarIcon className="w-6 h-6 text-white" />
            </div>
            <div className="text-center">
              <p className="font-bold text-gray-800">Prendre RDV</p>
              <p className="text-xs text-gray-500 mt-0.5">Appel de suivi personnalisé</p>
              <p className="text-xs text-orias-gold font-semibold mt-1">Réservation Calendly</p>
            </div>
          </div>

          {/* Message */}
          <div
            className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-orias-green bg-orias-green/5 hover:bg-orias-green/10 transition-all duration-200 cursor-pointer group"
            onClick={() => document.getElementById('support-form').scrollIntoView({ behavior: 'smooth' })}
          >
            <div className="w-12 h-12 rounded-full bg-orias-green flex items-center justify-center shadow-lg shadow-orias-green/30 group-hover:scale-110 transition-transform">
              <MessageIcon className="w-6 h-6 text-white" />
            </div>
            <div className="text-center">
              <p className="font-bold text-gray-800">Envoyer un message</p>
              <p className="text-xs text-gray-500 mt-0.5">Formulaire de contact</p>
              <p className="text-xs text-orias-green font-semibold mt-1">Réponse sous 24h</p>
            </div>
          </div>
        </div>
      </div>

      {/* Calendly placeholder */}
      <div className="card p-6">
        <h3 className="font-bold text-orias-green text-lg mb-4 flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-orias-gold" />
          Réserver un appel de suivi
        </h3>
        <div className="bg-orias-bg rounded-xl border-2 border-dashed border-orias-border p-10 text-center">
          <CalendarIcon className="w-12 h-12 text-orias-gold/40 mx-auto mb-3" />
          <p className="font-semibold text-gray-600">Calendly — Réservation en ligne</p>
          <p className="text-sm text-gray-400 mt-1">Intégration Calendly disponible après configuration</p>
          <button className="btn-gold mt-4">Ouvrir le calendrier</button>
        </div>
      </div>

      {/* FAQ */}
      <div className="card p-6">
        <h3 className="font-bold text-orias-green text-lg mb-2">Questions fréquentes</h3>
        <p className="text-sm text-gray-500 mb-5">Retrouvez les réponses aux questions les plus posées</p>
        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => <FAQItem key={i} item={item} />)}
        </div>
      </div>

      {/* Message form */}
      <div id="support-form" className="card p-6">
        <h3 className="font-bold text-orias-green text-lg mb-5 flex items-center gap-2">
          <MessageIcon className="w-5 h-5 text-orias-gold" />
          Envoyer un message
        </h3>
        {submitted ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>
              </svg>
            </div>
            <p className="font-bold text-emerald-700">Message envoyé avec succès !</p>
            <p className="text-sm text-emerald-600 mt-1">Notre équipe vous répondra dans les 24 heures.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Sujet</label>
                <input
                  value={form.sujet}
                  onChange={e => setForm(p => ({ ...p, sujet: e.target.value }))}
                  className="input-field"
                  placeholder="Sujet de votre message"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Priorité</label>
                <select
                  value={form.priority}
                  onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                  className="input-field"
                >
                  <option value="normal">Normale</option>
                  <option value="urgent">Urgente</option>
                  <option value="low">Faible</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Concerne</label>
              <select
                value={form.category}
                onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                className="input-field"
              >
                <option value="">Sélectionner...</option>
                <option value="dossier">Mon dossier ORIAS</option>
                <option value="formation">Formation IAS1</option>
                <option value="marketing">Marketing & communication</option>
                <option value="facturation">Facturation</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
              <textarea
                value={form.message}
                onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                className="input-field resize-none"
                rows={5}
                placeholder="Décrivez votre question ou problème en détail..."
                required
              />
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={submitting} className="btn-gold flex items-center gap-2 disabled:opacity-60">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
                {submitting ? 'Envoi...' : 'Envoyer le message'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
