import { createClient } from '@/lib/supabase/server'
import ConfiguracaoForm from '@/components/configuracoes/ConfiguracaoForm'

export default async function ConfiguracoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

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

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Configurações</h1>

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
