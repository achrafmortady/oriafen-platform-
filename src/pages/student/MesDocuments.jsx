import { useState } from 'react'
import { UploadIcon, DownloadIcon, FileIcon, SendIcon } from '../../components/Icons'

const INITIAL_DOCS = [
  { id: 1, name: "Pièce d'identité.pdf",    size: '2.3 MB', date: '12/03/2026', status: 'valid' },
  { id: 2, name: 'Casier judiciaire B3.pdf', size: '1.1 MB', date: '15/03/2026', status: 'valid' },
  { id: 3, name: 'Kbis société.pdf',         size: '0.8 MB', date: '18/03/2026', status: 'valid' },
  { id: 4, name: 'Attestation RCP.pdf',      size: '3.2 MB', date: '20/03/2026', status: 'valid' },
]

const statusLabel = { valid: 'Validé', pending: 'En attente', missing: 'Manquant' }
const statusCls   = {
  valid:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  missing: 'bg-red-50 text-red-700 border-red-200',
}

export default function MesDocuments() {
  const [docs, setDocs] = useState(INITIAL_DOCS)
  const [dragOver, setDragOver] = useState(false)
  const [sent, setSent] = useState(false)

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer?.files || [])
    files.forEach(f => {
      setDocs(prev => [...prev, {
        id: Date.now() + Math.random(),
        name: f.name,
        size: `${(f.size / 1024 / 1024).toFixed(1)} MB`,
        date: new Date().toLocaleDateString('fr-FR'),
        status: 'pending',
      }])
    })
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || [])
    files.forEach(f => {
      setDocs(prev => [...prev, {
        id: Date.now() + Math.random(),
        name: f.name,
        size: `${(f.size / 1024 / 1024).toFixed(1)} MB`,
        date: new Date().toLocaleDateString('fr-FR'),
        status: 'pending',
      }])
    })
  }

  const handleSendAll = () => {
    setSent(true)
    setTimeout(() => setSent(false), 3000)
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h2 className="section-title">Mes Documents</h2>
        <p className="section-subtitle">Gérez et envoyez vos documents à votre conseiller</p>

        {/* Upload area */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 cursor-pointer mb-6 ${
            dragOver
              ? 'border-orias-gold bg-orias-gold/5 scale-[1.01]'
              : 'border-orias-border hover:border-orias-gold hover:bg-orias-gold/3'
          }`}
          onClick={() => document.getElementById('file-input').click()}
        >
          <input id="file-input" type="file" multiple className="hidden" onChange={handleFileSelect} />
          <UploadIcon className="w-12 h-12 text-orias-gold mx-auto mb-3" />
          <p className="font-semibold text-gray-700 text-lg">Déposer vos documents ici</p>
          <p className="text-gray-400 text-sm mt-2">ou <span className="text-orias-gold font-medium">cliquez pour parcourir</span></p>
          <p className="text-gray-300 text-xs mt-1">PDF, JPG, PNG — Taille maximale: 10 MB par fichier</p>
        </div>

        {/* Documents list */}
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-orias-green">Documents ({docs.length})</h3>
            <button
              onClick={handleSendAll}
              className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-200 ${
                sent
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                  : 'btn-outline-green'
              }`}
            >
              <SendIcon className="w-4 h-4" />
              {sent ? 'Documents envoyés !' : 'Envoyer à mon conseiller'}
            </button>
          </div>

          {docs.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <FileIcon className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>Aucun document pour le moment</p>
            </div>
          )}

          {docs.map(doc => (
            <div key={doc.id} className="flex items-center gap-4 p-4 rounded-xl border border-orias-border hover:border-orias-gold/30 hover:bg-orias-bg/50 transition-all duration-200">
              <div className="w-10 h-10 rounded-xl bg-orias-green/10 flex items-center justify-center flex-shrink-0">
                <FileIcon className="w-5 h-5 text-orias-green" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 text-sm truncate">{doc.name}</p>
                <p className="text-xs text-gray-400">{doc.size} · {doc.date}</p>
              </div>
              <span className={`status-badge border ${statusCls[doc.status]} hidden sm:inline-flex`}>
                {statusLabel[doc.status]}
              </span>
              <button
                className="p-2 rounded-lg text-gray-400 hover:text-orias-green hover:bg-orias-bg transition-colors"
                title="Télécharger"
              >
                <DownloadIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
