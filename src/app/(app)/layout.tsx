import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TopNav from '@/components/layout/TopNav'
import MobileNav from '@/components/layout/MobileNav'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Busca identidade visual — ignora se perfis ainda não existir
  let config: { logo_url?: string | null; nome_app?: string | null; subtitulo_app?: string | null } | null = null
  try {
    const { data } = await supabase
      .from('perfis')
      .select('logo_url, nome_app, subtitulo_app')
      .eq('user_id', user.id)
      .maybeSingle()
    config = data
  } catch {
    // tabela não existe ainda
  }

  return (
    <div className="min-h-screen print:bg-white" style={{ background: 'var(--brand-mist)' }}>
      <div className="print:hidden">
        <TopNav
          logoUrl={config?.logo_url}
          nomeApp={config?.nome_app}
          subtituloApp={config?.subtitulo_app}
        />
      </div>
      <div className="pt-14 print:pt-0">
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-10 print:max-w-none print:p-0">
          {children}
        </main>
      </div>
      <div className="print:hidden">
        <MobileNav />
      </div>
    </div>
  )
}
