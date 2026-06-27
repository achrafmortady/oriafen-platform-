import { useState } from 'react'
import { FAQ_ITEMS } from '../../data/mockData'
import { WhatsAppIcon, ChevronDownIcon, CalendarIcon, MessageIcon } from '../../components/Icons'
import { submitSupportTicket } from '../../lib/api'

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

export default function Support() {
  const [form, setForm] = useState({ sujet: '', message: '', priority: 'normal' })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const result = await submitSupportTicket({ subject: form.sujet, message: form.message, priority: form.priority })
    setSubmitting(false)
    if (result.success) {
      setSubmitted(true)
      setTimeout(() => { setSubmitted(false); setForm({ sujet: '', message: '', priority: 'normal' }) }, 4000)
    } else {
      setError(result.error || 'Erreur lors de l\'envoi. Réessayez ou contactez-nous sur WhatsApp.')
    }
  }

  return (
    <div className="space-y-6">
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
