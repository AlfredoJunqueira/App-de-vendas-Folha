'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/dashboard',      label: 'Dashboard' },
  { href: '/clientes',       label: 'Clientes' },
  { href: '/interacoes',     label: 'Agenda' },
  { href: '/pedidos',        label: 'Pedidos' },
  { href: '/planejamento',   label: 'Planejamento' },
  { href: '/carregamentos',  label: 'Carregamentos' },
  { href: '/pesagens',       label: 'Pesagens' },
  { href: '/locais',         label: 'Locais' },
  { href: '/produtos',       label: 'Produtos' },
]

interface Props {
  logoUrl?: string | null
  nomeApp?: string | null
  subtituloApp?: string | null
}

export default function TopNav({ logoUrl, nomeApp, subtituloApp }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const appName = nomeApp || 'Folha'
  const appSub  = subtituloApp || 'Feno e Pré-Secados'

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        background: 'linear-gradient(135deg, #0f2225 0%, #193337 60%, #1a3a3f 100%)',
        borderBottom: '1px solid rgba(210,216,43,0.12)',
        boxShadow: '0 2px 16px rgba(0,0,0,0.18)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center h-14 gap-6">

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0 group">
            {logoUrl ? (
              /* Custom logo */
              <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shrink-0"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <Image src={logoUrl} alt={appName} width={32} height={32}
                  className="w-full h-full object-contain" unoptimized />
              </div>
            ) : (
              /* Default leaf mark */
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'rgba(210,216,43,0.15)', border: '1px solid rgba(210,216,43,0.25)' }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M8 13C8 13 2 10.5 2 5.5C2 3.5 4 2 6 2.5C7 2.75 8 3.5 8 3.5C8 3.5 9 2.75 10 2.5C12 2 14 3.5 14 5.5C14 10.5 8 13 8 13Z"
                    fill="#D2D82B" opacity="0.9"
                  />
                  <line x1="8" y1="13" x2="8" y2="6" stroke="#193337" strokeWidth="1" strokeLinecap="round" opacity="0.6"/>
                </svg>
              </div>
            )}

            <div className="flex flex-col leading-none">
              <span
                className="font-bold tracking-[0.2em] text-xs uppercase"
                style={{ color: '#D2D82B', letterSpacing: '0.18em' }}
              >
                {appName}
              </span>
              <span className="text-[10px] tracking-wide hidden sm:block" style={{ color: '#6a9a95', marginTop: '1px' }}>
                {appSub}
              </span>
            </div>
          </Link>

          {/* Divisor */}
          <div className="h-5 w-px shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }} />

          {/* Nav desktop */}
          <nav className="hidden md:flex items-center gap-0.5 flex-1 overflow-x-auto no-scrollbar">
            {navItems.map(item => {
              const active = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative px-3 py-1.5 text-[13px] whitespace-nowrap rounded-md font-medium transition-all"
                  style={{
                    color: active ? '#ffffff' : '#7aada8',
                    background: active ? 'rgba(1,80,70,0.55)' : 'transparent',
                    letterSpacing: '0.01em',
                  }}
                  onMouseEnter={e => {
                    if (!active) (e.currentTarget as HTMLElement).style.color = '#c8e8e4'
                  }}
                  onMouseLeave={e => {
                    if (!active) (e.currentTarget as HTMLElement).style.color = '#7aada8'
                  }}
                >
                  {item.label}
                  {active && (
                    <span
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                      style={{ background: '#D2D82B', bottom: '2px' }}
                    />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Right: Config gear + Sair */}
          <div className="ml-auto shrink-0 flex items-center gap-2">
            <Link
              href="/configuracoes"
              title="Configurações"
              className="p-1.5 rounded-md transition-all"
              style={{ color: pathname.startsWith('/configuracoes') ? '#D2D82B' : '#6a9a95' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#ffffff' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = pathname.startsWith('/configuracoes') ? '#D2D82B' : '#6a9a95' }}
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="10" cy="10" r="2.5"/>
                <path d="M10 2v1.5M10 16.5V18M2 10h1.5M16.5 10H18M4.22 4.22l1.06 1.06M14.72 14.72l1.06 1.06M4.22 15.78l1.06-1.06M14.72 5.28l1.06-1.06"/>
              </svg>
            </Link>

            <button
              onClick={handleLogout}
              className="text-xs font-medium px-3 py-1.5 rounded-md transition-all"
              style={{ color: '#6a9a95', border: '1px solid rgba(255,255,255,0.06)' }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.color = '#ffffff'
                ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.15)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.color = '#6a9a95'
                ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'
              }}
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
