import { useState, useEffect, useRef } from 'react'
import { BellIcon, XIcon } from './Icons'
import {
  fetchMyNotifications,
  fetchAdminNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  subscribeToNotifications,
} from '../lib/api'

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diffMin = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
  if (diffMin < 1) return 'à l\'instant'
  if (diffMin < 60) return `il y a ${diffMin} min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `il y a ${diffH}h`
  return `il y a ${Math.floor(diffH / 24)}j`
}

const TYPE_ICON = {
  document_received: '📥',
  document_final: '🏆',
  message: '💬',
  ticket_response: '💬',
  ticket_new: '🔔',
  appointment_soon: '📅',
  appointment_overdue: '⏰',
  task_soon: '✅',
  task_overdue: '⚠️',
}

/**
 * Cloche de notifications partagée entre l'espace admin et l'espace client.
 * - audience: 'client' | 'admin'
 * - userId: requis pour audience 'client' (filtre les notifs de ce client)
 * - onNavigate(linkTab): appelé au clic sur une notification pour ouvrir le bon onglet
 * - dark: true pour un header sombre (variante de couleur)
 */
export default function NotificationBell({ audience, userId, onNavigate, dark = false }) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const ref = useRef(null)

  const load = () => {
    const fetcher = audience === 'admin' ? fetchAdminNotifications : fetchMyNotifications
    fetcher().then(data => { setItems(data); setLoading(false) })
  }

  useEffect(() => {
    if (audience === 'client' && !userId) return
    load()
    const unsubscribe = subscribeToNotifications(audience, userId, (row) => {
      setItems(prev => [row, ...prev])
    })
    return unsubscribe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audience, userId])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const unreadCount = items.filter(n => !n.read_at).length

  const handleItemClick = async (item) => {
    if (!item.read_at) {
      setItems(prev => prev.map(n => n.id === item.id ? { ...n, read_at: new Date().toISOString() } : n))
      markNotificationRead(item.id)
    }
    setOpen(false)
    if (item.link_tab && onNavigate) onNavigate(item.link_tab)
  }

  const handleMarkAllRead = () => {
    setItems(prev => prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })))
    markAllNotificationsRead(audience)
  }

  const btnColor = dark ? 'text-green-300 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:text-orias-green hover:bg-orias-bg'

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`relative p-2.5 rounded-xl transition-colors ${btnColor} ${unreadCount > 0 ? (dark ? 'bg-white/10' : 'bg-orias-gold/10') : ''}`}
        title="Notifications"
      >
        <BellIcon className="w-7 h-7" />
        {unreadCount > 0 && (
          <>
            <span className="absolute -top-1 -right-1 inline-flex h-5 w-5 animate-ping rounded-full bg-orias-gold opacity-60" />
            <span className="absolute -top-1 -right-1 bg-orias-gold text-orias-green text-[11px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 max-w-[92vw] bg-white rounded-2xl shadow-2xl border border-orias-border overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-orias-border bg-orias-bg">
            <span className="font-extrabold text-base text-orias-green">🔔 Notifications</span>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} className="text-xs font-semibold text-orias-gold hover:underline">
                  Tout marquer lu
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <XIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="text-center py-8 text-sm text-gray-400">Chargement...</div>
            ) : items.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-400">Aucune notification.</div>
            ) : (
              items.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`w-full text-left flex items-start gap-3 px-4 py-3.5 border-b border-orias-border/60 last:border-0 transition-colors hover:bg-orias-bg ${!item.read_at ? 'bg-orias-gold/5' : ''}`}
                >
                  <span className="text-2xl flex-shrink-0">{TYPE_ICON[item.type] || '🔔'}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      {!item.read_at && <span className="w-2 h-2 rounded-full bg-orias-gold flex-shrink-0" />}
                      <p className={`text-sm truncate ${!item.read_at ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>{item.title}</p>
                    </div>
                    {item.body && <p className="text-xs text-gray-500 truncate mt-0.5">{item.body}</p>}
                    <p className="text-[11px] text-gray-400 mt-1">{timeAgo(item.created_at)}</p>
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
