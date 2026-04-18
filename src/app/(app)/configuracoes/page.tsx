import { createClient } from '@/lib/supabase/server'
import ConfiguracaoForm from '@/components/configuracoes/ConfiguracaoForm'
import Link from 'next/link'

export default async function ConfiguracoesPage({ searchParams }: { searchParams: Promise<{ google?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { google } = await searchParams

  let perfil = null
  try {
    const { data } = await supabase
      .from('perfis')
      .select('logo_url, nome_app, subtitulo_app, nome, empresa, telefone, email, cnpj, inscricao_estadual, endereco, cidade, estado, cep')
      .eq('user_id', user!.id)
      .maybeSingle()
    perfil = data
  } catch {
    // tabela ainda não existe
  }

  let googleConectado = false
  try {
    const { data: gt } = await supabase.from('google_tokens').select('id').eq('owner_id', user!.id).maybeSingle()
    googleConectado = !!gt
  } catch {}

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Configurações</h1>

      {/* Google Calendar */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
        <h2 className="font-medium text-gray-900 mb-1">Google Calendar</h2>
        <p className="text-sm text-gray-500 mb-4">
          Sincroniza automaticamente os carregamentos com um calendário separado no Google Calendar.
        </p>
        {google === 'success' && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
            Google Calendar conectado com sucesso!
          </div>
        )}
        {google === 'error' && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            Erro ao conectar. Tente novamente.
          </div>
        )}
        {googleConectado ? (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
              Conectado
            </span>
            <Link href="/api/google/auth" className="text-sm text-gray-500 hover:text-gray-700 underline">
              Reconectar
            </Link>
          </div>
        ) : (
          <Link
            href="/api/google/auth"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-sm font-medium rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Conectar com Google Calendar
          </Link>
        )}
      </div>

      {/* Storage notice */}
      <div className="mb-5 px-4 py-3 rounded-lg border text-sm"
        style={{ background: 'rgba(210,216,43,0.08)', borderColor: 'rgba(210,216,43,0.25)', color: '#4a6366' }}>
        <strong className="font-medium text-gray-700">Antes de enviar um logo:</strong> crie um bucket
        público chamado <code className="font-mono text-xs bg-black/5 px-1 py-0.5 rounded">logos</code> no
        Supabase Storage com acesso de leitura público.
      </div>

      <ConfiguracaoForm perfil={perfil} />
    </div>
  )
}
