export default function Logo({ size = 'md', variant = 'light' }) {
  const scales = { sm: 0.7, md: 1, lg: 1.4 }
  const sc = scales[size] || 1

  const goldColor = '#c9a84c'
  const textColor = variant === 'dark' ? '#ffffff' : '#1a3d2b'

  return (
    <div style={{ display:'flex', alignItems:'center', gap: `${10 * sc}px` }}>
      {/* Shield */}
      <svg width={Math.round(30 * sc)} height={Math.round(36 * sc)} viewBox="0 0 30 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 1L28 7V18C28 26 22 32 15 35C8 32 2 26 2 18V7L15 1Z" fill="none" stroke={goldColor} strokeWidth="1.8" strokeLinejoin="round"/>
        <path d="M15 6L24 11V18C24 24 20 28.5 15 31C10 28.5 6 24 6 18V11L15 6Z" fill="none" stroke={goldColor} strokeWidth="1" strokeLinejoin="round" opacity="0.5"/>
      </svg>

      {/* Text */}
      <div style={{ display:'flex', flexDirection:'column' }}>
        <span style={{
          fontSize: `${Math.round(18 * sc)}px`,
          fontWeight: '400',
          color: textColor,
          fontFamily: "'Georgia', 'Times New Roman', serif",
          letterSpacing: '1px',
          lineHeight: 1.1,
        }}>oriafen</span>
        <span style={{
          fontSize: `${Math.round(7 * sc)}px`,
          fontWeight: '500',
          color: goldColor,
          fontFamily: "'Montserrat', Arial, sans-serif",
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          marginTop: `${2 * sc}px`,
        }}>Votre Orias, Notre Priorité</span>
      </div>
    </div>
  )
}
