import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import OrcamentoView from '@/components/pedidos/OrcamentoView'

export default async function OrcamentoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: p } = await supabase
    .from('pedidos')
    .select(`
      *,
      clientes(id, nome_propriedade, contato, telefone, cidade, estado),
      locais_carregamento(id, nome, cidade, estado)
    `)
    .eq('id', id)
    .eq('owner_id', user!.id)
    .single()

  if (!p) notFound()

  const { data: produtosDb } = await supabase
    .from('produtos')
    .select('value, label')
    .eq('owner_id', user!.id)

  const produtoLabel: Record<string, string> = Object.fromEntries(
    (produtosDb ?? []).map(p => [p.value, p.label])
  )

  // Busca perfil do representante — tabela pode não existir ainda
  let perfil = null
  try {
    const { data } = await supabase
      .from('perfis')
      .select('nome, telefone, email, empresa, cnpj, inscricao_estadual, endereco, cidade, estado, cep')
      .eq('user_id', user!.id)
      .maybeSingle()
    perfil = data
  } catch {
    // tabela ainda não existe — ignora
  }

  return (
    <OrcamentoView
      pedido={p}
      produtoLabel={produtoLabel}
      perfil={perfil}
    />
  )
}
