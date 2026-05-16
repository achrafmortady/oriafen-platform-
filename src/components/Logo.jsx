export default function Logo({ size = 'md', variant = 'light' }) {
  const sizes = { sm: { img: 32, text: 'text-lg' }, md: { img: 44, text: 'text-xl' }, lg: { img: 56, text: 'text-2xl' } }
  const s = sizes[size] || sizes.md
  const textColor = variant === 'dark' ? 'text-white' : 'text-orias-green'
  const subColor = variant === 'dark' ? 'text-orias-gold' : 'text-orias-gold'

  return (
    <div className="flex items-center gap-3">
      <svg width={s.img} height={s.img} viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="44" height="44" rx="10" fill="#1a3d2b"/>
        <path d="M22 8L34 15V29L22 36L10 29V15L22 8Z" fill="none" stroke="#c49a2a" strokeWidth="2"/>
        <path d="M22 14L29 18V26L22 30L15 26V18L22 14Z" fill="#c49a2a" opacity="0.3"/>
        <circle cx="22" cy="22" r="4" fill="#c49a2a"/>
        <path d="M22 8V14M22 30V36M10 15L15 18M29 26L34 29M10 29L15 26M29 18L34 15" stroke="#c49a2a" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
      <div>
        <div className={`font-bold leading-tight tracking-wide ${s.text} ${textColor}`}>ORIAFEN</div>
        <div className={`text-xs font-medium tracking-widest uppercase ${subColor}`}>Academy</div>
      </div>
    </div>
  )
}
