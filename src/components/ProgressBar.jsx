export default function ProgressBar({ value, max = 100, height = 'h-2', showLabel = false, label = '' }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-medium text-gray-600">{label}</span>
          <span className="text-xs font-bold text-orias-gold">{Math.round(pct)}%</span>
        </div>
      )}
      <div className={`progress-bar-bg ${height}`}>
        <div
          className="progress-bar-fill h-full"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
