import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  fetchDossier,
  createDossierIfNeeded,
  fetchDocumentsByCategory,
  uploadDocumentFile,
  subscribeToDocuments,
} from '../../lib/api'
import { DOSSIER_STEPS, REQUIRED_DOCUMENTS } from '../../data/mockData'
import {
  CheckCircleIcon, ClockIcon, XCircleIcon, LockIcon, WhatsAppIcon,
} from '../../components/Icons'

// ── Step descriptions ─────────────────────────────────────────

const STEP_LABELS_FULL = [
  { id: 1, description: "Premier entretien avec votre conseiller pour évaluer votre projet et définir les étapes." },
  { id: 2, description: "Rassemblement et vérification de tous les documents nécessaires à votre dossier ORIAS." },
  { id: 3, description: "Création ou validation de votre structure juridique (SASU, SAS, auto-entrepreneur…)." },
  { id: 4, description: "Envoi officiel de votre dossier complet à l'ORIAS pour immatriculation." },
  { id: 5, description: "Réception de votre numéro ORIAS et validation officielle de votre statut d'intermédiaire." },
  { id: 6, description: "Vous êtes officiellement autorisé à exercer ! Lancement de votre activité." },
]

// ── Toast notifications ───────────────────────────────────────

function Toast({ toasts, onDismiss }) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none" style={{ maxWidth: 360 }}>
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium pointer-events-auto animate-slide-in ${
            t.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
            t.type === 'error'   ? 'bg-red-50 border-red-200 text-red-800' :
            t.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                                   'bg-white border-orias-border text-gray-700'
          }`}
        >
          <span className="flex-shrink-0 text-base leading-tight">
            {t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : t.type === 'warning' ? '⚠️' : 'ℹ️'}
          </span>
          <p className="flex-1 leading-snug">{t.message}</p>
          <button onClick={() => onDismiss(t.id)} className="flex-shrink-0 opacity-50 hover:opacity-100 ml-1">✕</button>
        </div>
      ))}
    </div>
  )
}

// ── Step icon ─────────────────────────────────────────────────

function StepIcon({ status }) {
  if (status === 'done')    return <CheckCircleIcon className="w-5 h-5 text-white" />
  if (status === 'current') return <ClockIcon className="w-5 h-5 text-orias-green" />
  return <LockIcon className="w-4 h-4 text-gray-400" />
}

// ── Document status badge ─────────────────────────────────────

function DocStatusBadge({ status }) {
  const cfg = {
    valid:      { icon: '✅', label: 'Validé',              cls: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    pending:    { icon: '⏳', label: 'En attente',          cls: 'text-amber-700 bg-amber-50 border-amber-200' },
    missing:    { icon: '❌', label: 'Rejeté',              cls: 'text-red-700 bg-red-50 border-red-200' },
    correction: { icon: '💬', label: 'Correction demandée', cls: 'text-orange-700 bg-orange-50 border-orange-200' },
    none:       { icon: '➖', label: 'Manquant',            cls: 'text-gray-500 bg-gray-50 border-gray-200' },
  }
  const { icon, label, cls } = cfg[status] ?? cfg.none
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${cls}`}>
      <span>{icon}</span>{label}
    </span>
  )
}

// ── Individual document row ───────────────────────────────────

function DocRow({ required, doc, uploading, onUpload }) {
  const inputRef = useRef(null)
  const status   = doc?.status ?? 'none'
  const hasFile  = !!doc?.fileName

  const rowBg = {
    valid:      'bg-emerald-50/60 border-emerald-100',
    pending:    'bg-amber-50/60 border-amber-100',
    missing:    'bg-red-50/60 border-red-100',
    correction: 'bg-orange-50/60 border-orange-100',
    none:       'bg-gray-50/40 border-gray-100',
  }[status] ?? 'bg-gray-50/40 border-gray-100'

  const btnLabel = status === 'none' || status === 'missing' || status === 'correction'
    ? 'Envoyer'
    : 'Remplacer'

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      onUpload(required.id, required.label, file)
      e.target.value = ''  // allow re-selecting same file
    }
  }

  return (
    <div className={`rounded-xl border p-3.5 transition-all ${rowBg}`}>
      <div className="flex flex-wrap items-center gap-3">
        {/* Icon */}
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
          status === 'valid'      ? 'bg-emerald-100' :
          status === 'pending'    ? 'bg-amber-100' :
          status === 'missing'    ? 'bg-red-100' :
          status === 'correction' ? 'bg-orange-100' :
                                    'bg-gray-100'
        }`}>
          {status === 'valid'      ? <CheckCircleIcon className="w-4 h-4 text-emerald-600" /> :
           status === 'pending'    ? <ClockIcon className="w-4 h-4 text-amber-600" /> :
           status === 'missing'    ? <XCircleIcon className="w-4 h-4 text-red-600" /> :
           status === 'correction' ? <span className="text-sm">💬</span> :
                                     <span className="text-xs text-gray-400 font-bold">?</span>}
        </div>

        {/* Label */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 text-sm">{required.label}</p>
          <p className="text-xs text-gray-400">{required.sublabel}</p>
          {hasFile && (
            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">
              📎 {doc.fileName}
            </p>
          )}
        </div>

        {/* Status + upload */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <DocStatusBadge status={status} />
          {status !== 'valid' && (
            <>
              <input
                ref={inputRef}
                type="file"
                accept={required.accept}
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  uploading
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-orias-green text-white hover:bg-orias-green-light shadow-sm'
                }`}
              >
                {uploading ? (
                  <><svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>Envoi…</>
                ) : (
                  <><svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>{btnLabel}</>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Rejection / correction message */}
      {(status === 'missing' || status === 'correction') && doc?.rejectionReason && (
        <div className={`mt-2.5 px-3 py-2 rounded-lg text-xs leading-relaxed ${
          status === 'missing' ? 'bg-red-100 text-red-700 border border-red-200' :
                                 'bg-orange-100 text-orange-700 border border-orange-200'
        }`}>
          {status === 'missing' ? '❌ Raison du rejet : ' : '💬 Correction demandée : '}
          <span className="font-medium">{doc.rejectionReason}</span>
          {' '}— Veuillez renvoyer le document corrigé.
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────

export default function MonDossier() {
  const { user } = useAuth()

  const [steps,         setSteps]         = useState(DOSSIER_STEPS)
  const [dossierNumber, setDossierNumber] = useState('OR-2026-0001')
  const [status,        setStatus]        = useState('En cours')
  const [currentStep,   setCurrentStep]   = useState(4)
  const [loadingData,   setLoadingData]   = useState(true)
  const [selectedStep,  setSelectedStep]  = useState(null)

  // docs: { [categoryId]: { id, status, fileName, fileUrl, rejectionReason } }
  const [docs,       setDocs]      = useState({})
  const [uploading,  setUploading] = useState({})  // { [categoryId]: bool }
  const [toasts,     setToasts]    = useState([])

  const toastIdRef = useRef(0)

  const pushToast = useCallback((message, type = 'info', duration = 5000) => {
    const id = ++toastIdRef.current
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration)
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // Handle realtime update from Supabase
  const handleDocChange = useCallback((updated) => {
    const { category, status: newStatus, rejectionReason, fileName, fileUrl } = updated
    if (!category) return

    setDocs(prev => {
      const old = prev[category]
      const oldStatus = old?.status

      // Trigger notification only if status actually changed
      if (oldStatus && oldStatus !== newStatus) {
        const reqDoc = REQUIRED_DOCUMENTS.find(r => r.id === category)
        const label  = reqDoc?.label ?? category

        if (newStatus === 'valid') {
          pushToast(`Votre ${label} a été validé ✓`, 'success')
        } else if (newStatus === 'missing') {
          pushToast(
            `Votre ${label} a été rejeté.${rejectionReason ? ` Raison : ${rejectionReason}` : ''} Veuillez renvoyer le document.`,
            'error', 8000
          )
        } else if (newStatus === 'correction') {
          pushToast(
            `Correction demandée pour ${label}.${rejectionReason ? ` ${rejectionReason}` : ''}`,
            'warning', 8000
          )
        }
      }

      return {
        ...prev,
        [category]: {
          ...old,
          status: newStatus,
          rejectionReason,
          fileName:  fileName ?? old?.fileName,
          fileUrl:   fileUrl  ?? old?.fileUrl,
        },
      }
    })
  }, [pushToast])

  useEffect(() => {
    if (!user?.id) { setLoadingData(false); return }

    createDossierIfNeeded(user.id).then(() =>
      Promise.all([
        fetchDossier(user.id),
        fetchDocumentsByCategory(user.id),
      ]).then(([dossierData, docsData]) => {
        setSteps(dossierData.steps)
        setDossierNumber(dossierData.dossierNumber)
        setStatus(dossierData.status)
        setCurrentStep(dossierData.currentStep)
        setDocs(docsData)
      }).finally(() => setLoadingData(false))
    )

    const unsub = subscribeToDocuments(user.id, handleDocChange)
    return unsub
  }, [user?.id, handleDocChange])

  const handleUpload = async (categoryId, categoryLabel, file) => {
    setUploading(prev => ({ ...prev, [categoryId]: true }))

    const result = await uploadDocumentFile(user?.id, categoryId, categoryLabel, file)

    if (result.autoRejected) {
      pushToast(result.message, 'error')
    } else if (result.success) {
      setDocs(prev => ({ ...prev, [categoryId]: result.doc }))
      pushToast(`${categoryLabel} envoyé — en attente de validation par votre conseiller.`, 'success')
    } else {
      pushToast(`Erreur lors de l'envoi : ${result.error ?? 'réessayez.'}`, 'error')
    }

    setUploading(prev => ({ ...prev, [categoryId]: false }))
  }

  const completedCount  = steps.filter(s => s.status === 'done').length
  const validDocs       = REQUIRED_DOCUMENTS.filter(r => docs[r.id]?.status === 'valid').length
  const pendingDocs     = REQUIRED_DOCUMENTS.filter(r => docs[r.id]?.status === 'pending').length
  const missingDocs     = REQUIRED_DOCUMENTS.filter(r => !docs[r.id] || docs[r.id].status === 'none').length

  return (
    <>
      <Toast toasts={toasts} onDismiss={dismissToast} />

      <div className="space-y-6">
        {/* Dossier overview */}
        <div className="card p-6">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <h2 className="section-title">Mon Dossier ORIAS</h2>
              <p className="section-subtitle">Suivi de votre immatriculation en temps réel</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="bg-orias-bg rounded-lg px-4 py-2 border border-orias-border">
                <p className="text-xs text-gray-500 font-medium">N° Dossier</p>
                <p className="font-bold text-orias-green text-sm">{dossierNumber}</p>
              </div>
              <div className="bg-orias-bg rounded-lg px-4 py-2 border border-orias-border">
                <p className="text-xs text-gray-500 font-medium">Pack</p>
                <p className="font-bold text-orias-green text-sm">{user?.pack ?? 'Essentiel'}</p>
              </div>
              <div className="bg-amber-50 rounded-lg px-4 py-2 border border-amber-200">
                <p className="text-xs text-amber-600 font-medium">Statut</p>
                <p className="font-bold text-amber-700 text-sm">{status}</p>
              </div>
            </div>
          </div>

          {loadingData ? (
            <div className="h-24 flex items-center justify-center">
              <svg className="animate-spin w-6 h-6 text-orias-gold" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            </div>
          ) : (
            <>
              {/* Progress line */}
              <div className="relative mb-2">
                <div className="absolute top-5 left-[calc(1/12*100%)] right-[calc(1/12*100%)] h-0.5 bg-gray-200 hidden sm:block">
                  <div className="h-full bg-orias-gold transition-all duration-700" style={{ width: `${(completedCount / 5) * 100}%` }} />
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 relative z-10">
                  {steps.map(step => (
                    <button
                      key={step.id}
                      onClick={() => setSelectedStep(selectedStep?.id === step.id ? null : step)}
                      className="flex flex-col items-center text-center gap-2 group focus:outline-none"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all duration-300 group-hover:scale-110 ${
                        step.status === 'done'    ? 'bg-orias-green border-orias-green shadow-md' :
                        step.status === 'current' ? 'bg-orias-gold border-orias-gold shadow-lg ring-4 ring-orias-gold/20' :
                                                    'bg-gray-100 border-gray-300'
                      }`}>
                        <StepIcon status={step.status} />
                      </div>
                      <p className={`text-xs font-semibold leading-tight ${
                        step.status === 'done'    ? 'text-orias-green' :
                        step.status === 'current' ? 'text-orias-gold' : 'text-gray-400'
                      }`}>{step.label}</p>
                      <p className={`text-xs ${
                        step.status === 'done'    ? 'text-emerald-500' :
                        step.status === 'current' ? 'text-orias-gold'  : 'text-gray-300'
                      }`}>
                        {step.status === 'done' ? 'Complété' : step.status === 'current' ? 'En cours' : 'En attente'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {selectedStep && (
                <div className={`mt-4 p-4 rounded-xl border text-sm transition-all duration-200 ${
                  selectedStep.status === 'done'    ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                  selectedStep.status === 'current' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                                                      'bg-gray-50 border-gray-200 text-gray-600'
                }`}>
                  <p className="font-semibold mb-1">Étape {selectedStep.id} — {selectedStep.label}</p>
                  <p>{STEP_LABELS_FULL.find(s => s.id === selectedStep.id)?.description}</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Documents section */}
          <div className="lg:col-span-2 space-y-4">
            <div className="card p-6">
              {/* Header + counters */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <h3 className="font-bold text-orias-green text-lg">Documents du dossier</h3>
                <div className="flex gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700">
                    ✅ {validDocs} validé{validDocs > 1 ? 's' : ''}
                  </span>
                  {pendingDocs > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-700">
                      ⏳ {pendingDocs} en attente
                    </span>
                  )}
                  {missingDocs > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-50 border border-gray-200 text-gray-600">
                      ➖ {missingDocs} manquant{missingDocs > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-5">
                <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                  <span>Documents complétés</span>
                  <span className="font-bold text-orias-green">{validDocs} / {REQUIRED_DOCUMENTS.length}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orias-gold transition-all duration-700 rounded-full"
                    style={{ width: `${(validDocs / REQUIRED_DOCUMENTS.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Document rows */}
              <div className="space-y-2.5">
                {REQUIRED_DOCUMENTS.map(req => (
                  <DocRow
                    key={req.id}
                    required={req}
                    doc={docs[req.id]}
                    uploading={!!uploading[req.id]}
                    onUpload={handleUpload}
                  />
                ))}
              </div>

              {/* Info banner */}
              <div className="mt-5 flex items-start gap-3 p-4 rounded-xl bg-orias-bg border border-orias-border text-sm text-gray-600">
                <span className="text-lg flex-shrink-0">ℹ️</span>
                <p>
                  Formats acceptés : <strong>PDF, JPG, PNG</strong> — max 10 Mo par fichier.
                  Les documents sont vérifiés sous <strong>24–48h</strong> par votre conseiller.
                  En cas de rejet, vous recevrez une notification avec la raison.
                </p>
              </div>
            </div>
          </div>

          {/* Conseiller card */}
          <div className="space-y-4">
            <div className="card-dark p-6 text-white">
              <h3 className="font-bold text-orias-gold text-sm uppercase tracking-wider mb-4">Votre Conseiller Dédié</h3>
              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 rounded-full bg-orias-gold/20 border-2 border-orias-gold flex items-center justify-center text-xl font-bold text-orias-gold flex-shrink-0">MA</div>
                <div>
                  <p className="font-bold text-white text-lg">Mehdi Alaoui</p>
                  <p className="text-green-300 text-sm">Conseiller ORIAS</p>
                </div>
              </div>
              <div className="space-y-2 mb-5">
                <div className="flex items-center gap-2 text-green-200 text-sm">
                  <svg className="w-4 h-4 text-orias-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  Disponible 9h – 20h GMT+1
                </div>
                <div className="flex items-center gap-2 text-green-200 text-sm">
                  <svg className="w-4 h-4 text-orias-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  Lundi – Samedi
                </div>
              </div>
              <a
                href="https://wa.me/33600000000"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-white bg-[#25d366] hover:bg-[#20bd5a] transition-colors shadow-lg"
              >
                <WhatsAppIcon className="w-5 h-5" />
                Contacter sur WhatsApp
              </a>
            </div>

            <div className="card p-5">
              <h3 className="font-bold text-orias-green text-sm mb-3">Étape actuelle</h3>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-orias-gold/10 border border-orias-gold/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-orias-gold">{currentStep}</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{steps.find(s => s.status === 'current')?.label ?? 'Terminé'}</p>
                  <p className="text-xs text-gray-500 mt-1">Cliquez sur une étape ci-dessus pour voir les détails.</p>
                </div>
              </div>
            </div>

            {/* Document summary card */}
            <div className="card p-5">
              <h3 className="font-bold text-orias-green text-sm mb-3">Résumé documents</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Validés</span>
                  <span className="font-bold text-emerald-600">{validDocs} / {REQUIRED_DOCUMENTS.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">En attente</span>
                  <span className="font-bold text-amber-600">{pendingDocs}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Manquants</span>
                  <span className="font-bold text-gray-500">{missingDocs}</span>
                </div>
                <div className="pt-2 border-t border-orias-border">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Complétude</span>
                    <span className="font-bold">{Math.round((validDocs / REQUIRED_DOCUMENTS.length) * 100)}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orias-gold rounded-full transition-all duration-700"
                      style={{ width: `${(validDocs / REQUIRED_DOCUMENTS.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
