// ============================================================
// NOTIFICATIONS — production implementation (NOT activated, see ./_guard.js).
// Thin wrapper around src/lib/api.js (V1, unmodified).
//
// Schema CONFIRMED live (repo note, supabase/migrations/
// 20260916_notes_notifications_schema_TODO.sql:15-26, reconfirmed
// 20260920_notes_admin_notifications_mapping.sql) — this is the one table
// with the strongest evidence in this audit:
//   id, audience ('client'|'admin'), user_id (nullable when audience=
//   'admin'), type, title, body, link_tab, related_id, read_at, created_at.
// Classification: A — table already exists and is already compatible, no
// migration needed. Only two points to confirm before activation (per the
// same note): the RLS INSERT policy for a row with audience='admin', and
// whether a UNIQUE index exists for dedupe (currently client-side only,
// via a dedupeKey param on createNotification — see below).
// ============================================================
import { assertProductionAdapterActive } from './_guard'
import {
  fetchMyNotifications, fetchAdminNotifications, markNotificationRead,
  markAllNotificationsRead, subscribeToNotifications, createNotification,
} from '../../../lib/api'

function guard() { assertProductionAdapterActive('notifications.supabase.js') }

export function getMine(userId) { guard(); return fetchMyNotifications(userId) }
export function getAdmin() { guard(); return fetchAdminNotifications() }
export function markRead(id) { guard(); return markNotificationRead(id) }
export function markAllRead(audience) { guard(); return markAllNotificationsRead(audience) }
export function subscribe(audience, userId, callback) { guard(); return subscribeToNotifications(audience, userId, callback) }

// Dédoublonnage : createNotification() (api.js:2012) est déjà le SEUL point
// d'insertion — aucune duplication introduite ici. Le dédoublonnage
// aujourd'hui local (dedupeKey côté adminNotificationsStore.js) doit être
// reproduit en production soit par cette même clé applicative (vérifier
// l'absence de doublon avant insert), soit par un index UNIQUE côté DB — À
// CONFIRMER (non vérifiable sans accès live, voir §"RLS/dedupe" du rapport).
export function notify(payload) { guard(); return createNotification(payload) }
