import React from 'react'
import {createRoot} from 'react-dom/client'
import LocalAdminShell from './local/LocalAdminShell'
import './index.css'
import './local/crm.css'
// Garde-fou d'hôte : ce build V2 (mock/localStorage, Supabase désactivé —
// voir src/lib/supabase.js) peut tourner en local (dev machine) ET sur un
// déploiement Preview Vercel de staging-v2 (ex : *-git-staging-v2-*.vercel.app),
// mais ne doit JAMAIS s'exécuter sur le domaine de production réel — double
// sécurité en plus de la séparation de branche/déploiement.
const host = location.hostname
const isLocalHost = ['localhost', '127.0.0.1', '[::1]'].includes(host)
const isVercelPreviewHost = /\.vercel\.app$/.test(host)
const isForbiddenProductionHost = ['app.oriafen.com', 'oriafen.com', 'www.oriafen.com'].includes(host)
if (isForbiddenProductionHost) throw new Error('Ce build V2 (aperçu local/staging) ne doit jamais s\'exécuter sur le domaine de production.')
if (!isLocalHost && !isVercelPreviewHost) throw new Error('Aperçu réservé à cette machine ou à un déploiement Preview Vercel de staging-v2.')
createRoot(document.getElementById('root')).render(<LocalAdminShell/>);
