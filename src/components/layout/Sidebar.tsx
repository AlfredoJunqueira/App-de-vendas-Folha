'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/clientes', label: 'Clientes', icon: '🏡' },
  { href: '/interacoes', label: 'Agenda', icon: '📅' },
  { href: '/pedidos', label: 'Pedidos', icon: '📦' },
  { href: '/carregamentos', label: 'Carregamentos', icon: '🚛' },
  { href: '/locais', label: 'Locais', icon: '📍' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="hidden md:flex md:flex-col md:w-56 md:fixed md:inset-y-0 bg-[#193337]">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-[#015046]">
        <div>
          <p className="text-base font-bold text-[#D2D82B] tracking-widest uppercase">Folha</p>
          <p className="text-xs text-[#49B171]">Feno e Pré-Secados</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-[#D2D82B] text-[#193337] font-semibold'
                  : 'text-[#EAF5F5] hover:bg-[#015046] hover:text-white'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-[#015046]">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-[#EAF5F5] hover:text-white hover:bg-[#015046] rounded-lg transition-colors"
        >
          <span className="text-base">🚪</span>
          Sair
        </button>
      </div>
    </aside>
  )
}
