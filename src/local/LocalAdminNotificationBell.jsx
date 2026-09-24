import React, { useState, useEffect, useRef } from 'react'
import { BellIcon, XIcon } from '../components/Icons'
import { getAdminNotifications, markAdminNotificationSeen, markAllAdminNotificationsSeen, subscribeToAdminNotifications } from './adminNotificationsStore'

const TYPE_ICON = { marketing: '🎯', support: '🛟' }
// Correctif "centre d'activité" (2026-09-22, retour client) : présentation
// alignée sur source/sender, type/contexte, lu/non lu — sans fusionner
// adminNotificationsStore.js avec les autres modèles (clientTrackingStore).
const TYPE_LABEL = { marketing: 'Marketing', support: 'Support' }

// Clone de LocalNotificationBell.jsx (même markup/comportement) côté ADMIN —
// avant ce correctif, le bouton cloche du header admin était statique (pas
// de badge, pas de liste : aucune alerte n'arrivait jamais à l'équipe, voir
// feedback "Marketing request does not notify admin"). onNavigate(context)
// laisse LocalAdminShell décider de la navigation (onglet + client concerné).
export default function LocalAdminNotificationBell({ onNavigate }) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState(() => getAdminNotifications())
  const [panelPos, setPanelPos] = useState(null)
  const ref = useRef(null)
  const btnRef = useRef(null)

  useEffect(() => subscribeToAdminNotifications(() => setItems(getAdminNotifications())), [])

  useEffect(() => {
    const handleClickOutside = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Correctif "Échap ne ferme pas la cloche" (audit inspection navigateur,
  // 2026-09-24) : seul un clic en dehors du panneau le fermait.
  useEffect(() => {
    if (!open) return
    const handleEscape = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open])

  const toggleOpen = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      const width = Math.min(384, window.innerWidth - 16)
      const maxRight = window.innerWidth - width - 8
      setPanelPos({ top: rect.bottom + 8, right: Math.min(maxRight, Math.max(8, window.innerWidth - rect.right)), width })
    }
    setOpen(o => !o)
  }

  const unreadCount = items.filter(n => !n.seenAt).length

  const handleItemClick = (item) => {
    if (!item.seenAt) markAdminNotificationSeen(item.id)
    setOpen(false)
    if (item.context) onNavigate?.(item.context)
  }

  const handleMarkAllRead = () => markAllAdminNotificationsSeen()

  return (
    <div className="relative" ref={ref}>
      <button
        ref={btnRef}
        onClick={toggleOpen}
        className={`relative p-2.5 rounded-xl transition-colors text-green-300 hover:text-white hover:bg-white/10 ${unreadCount > 0 ? 'bg-white/10' : ''}`}
        title="Notifications"
        aria-label="Notifications"
      >
        <BellIcon className="w-6 h-6" />
        {unreadCount > 0 && (
          <>
            <span className="absolute -top-1 -right-1 inline-flex h-5 w-5 animate-ping rounded-full bg-orias-gold opacity-60" />
            <span className="absolute -top-1 -right-1 bg-orias-gold text-orias-green text-[11px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </>
        )}
      </button>

      {open && panelPos && (
        <div className="fixed bg-white rounded-2xl shadow-2xl border border-orias-border overflow-hidden z-50" style={{ top: panelPos.top, right: panelPos.right, width: panelPos.width }}>
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-orias-border bg-orias-bg">
            <span className="font-extrabold text-base text-orias-green">🔔 Notifications équipe</span>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} className="text-xs font-semibold text-orias-gold hover:underline">Tout marquer lu</button>
              )}
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600"><XIcon className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-400">Aucune notification.</div>
            ) : (
              items.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`w-full text-left flex items-start gap-3 px-4 py-3.5 border-b border-orias-border/60 last:border-0 transition-colors hover:bg-orias-bg ${!item.seenAt ? 'bg-orias-gold/5' : ''}`}
                >
                  <span className="text-2xl flex-shrink-0">{TYPE_ICON[item.type] || '🔔'}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {!item.seenAt && <span className="w-2 h-2 rounded-full bg-orias-gold flex-shrink-0" />}
                      <p className={`text-sm truncate ${!item.seenAt ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>{item.title}</p>
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-orias-green/70 bg-orias-green/5 rounded-full px-1.5 py-0.5">{TYPE_LABEL[item.type] || item.type}</span>
                    </div>
                    {item.message && <p className="text-xs text-gray-500 truncate mt-0.5">{item.message}</p>}
                    <p className="text-[11px] text-gray-400 mt-1">{item.clientName ? `${item.clientName} · ` : ''}{item.createdAt}</p>
                    {/* Correctif "pas de contrôle de réponse dans l'inbox"
                        (audit inspection navigateur, 2026-09-24) : une
                        demande de support client passait à "Vu" au clic sans
                        aucune indication qu'elle ouvre la fiche client où
                        répondre réellement (ClientSendTracking, admin-reply-
                        box) — action explicite ajoutée ici, jamais une
                        deuxième zone de réponse dupliquée dans ce popup. */}
                    {item.type === 'support' && (
                      <p className="text-[11px] font-semibold text-orias-green mt-1">Ouvrir et répondre →</p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
