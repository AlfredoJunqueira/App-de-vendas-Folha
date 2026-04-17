'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  {
    href: '/dashboard', label: 'Início',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L10 3l7 6.5V17a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
        <path d="M7 18V11h6v7"/>
      </svg>
    ),
  },
  {
    href: '/clientes', label: 'Clientes',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="6" r="3"/>
        <path d="M2 17c0-3.314 2.686-5 6-5s6 1.686 6 5"/>
        <path d="M15 3c1.657 0 3 1.343 3 3s-1.343 3-3 3"/>
        <path d="M18 17c0-2.5-1.5-4-3-4.5"/>
      </svg>
    ),
  },
  {
    href: '/interacoes', label: 'Agenda',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="14" height="14" rx="2"/>
        <path d="M14 2v4M6 2v4M3 9h14"/>
        <path d="M7 13h2M11 13h2M7 16h2"/>
      </svg>
    ),
  },
  {
    href: '/pedidos', label: 'Pedidos',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2h8a1 1 0 011 1v14a1 1 0 01-1 1H6a1 1 0 01-1-1V3a1 1 0 011-1z"/>
        <path d="M7 7h6M7 10h6M7 13h4"/>
      </svg>
    ),
  },
  {
    href: '/planejamento', label: 'Plano',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 14l4-5 3 3 3-4 4 6"/>
        <path d="M3 17h14"/>
      </svg>
    ),
  },
  {
    href: '/carregamentos', label: 'Carreg.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="8" width="12" height="8" rx="1"/>
        <path d="M13 11h3l3 3v3h-6V11z"/>
        <circle cx="5" cy="17" r="1.5"/>
        <circle cx="15" cy="17" r="1.5"/>
      </svg>
    ),
  },
  {
    href: '/pesagens', label: 'Pesagens',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 2a5 5 0 00-5 5c0 1.5.67 2.84 1.72 3.75L10 18l3.28-7.25A4.99 4.99 0 0015 7a5 5 0 00-5-5z"/>
        <circle cx="10" cy="7" r="1.5"/>
      </svg>
    ),
  },
  {
    href: '/locais', label: 'Locais',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 2C7.24 2 5 4.24 5 7c0 4 5 11 5 11s5-7 5-11c0-2.76-2.24-5-5-5z"/>
        <circle cx="10" cy="7" r="2"/>
      </svg>
    ),
  },
  {
    href: '/produtos', label: 'Produtos',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 2L2 6v8l8 4 8-4V6l-8-4z"/>
        <path d="M2 6l8 4 8-4"/>
        <path d="M10 10v8"/>
      </svg>
    ),
  },
  {
    href: '/configuracoes', label: 'Config',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="10" cy="10" r="2.5"/>
        <path d="M10 2v1.5M10 16.5V18M2 10h1.5M16.5 10H18M4.22 4.22l1.06 1.06M14.72 14.72l1.06 1.06M4.22 15.78l1.06-1.06M14.72 5.28l1.06-1.06"/>
      </svg>
    ),
  },
]

export default function MobileNav() {
  const pathname = usePathname()

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: 'linear-gradient(135deg, #0f2225 0%, #193337 100%)',
        borderTop: '1px solid rgba(210,216,43,0.1)',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
      }}
    >
      <div className="flex items-stretch">
        {navItems.map(item => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 relative"
              style={{ color: active ? '#D2D82B' : '#5a8a85' }}
            >
              {active && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 rounded-b-full"
                  style={{ width: '28px', height: '2px', background: '#D2D82B' }}
                />
              )}
              <span style={{ opacity: active ? 1 : 0.75 }}>{item.icon}</span>
              <span
                className="text-[9px] font-medium tracking-wide"
                style={{ letterSpacing: '0.03em', color: active ? '#D2D82B' : '#5a8a85' }}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
