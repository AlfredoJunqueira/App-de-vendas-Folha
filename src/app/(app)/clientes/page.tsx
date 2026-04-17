import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatDate } from '@/lib/utils/format'

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string; status?: string; tipo_animal?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const limite30dias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  let query = supabase
    .from('clientes')
    .select('*')
    .eq('owner_id', user!.id)
    .order('nome_propriedade')

  if (params.status) query = query.eq('status', params.status)
  if (params.tipo_animal) query = query.eq('tipo_animal', params.tipo_animal)
  if (params.busca) query = query.ilike('nome_propriedade', `%${params.busca}%`)

  const { data: clientes } = await query

  // Busca última interação de cada cliente
  const { data: ultimasInteracoes } = await supabase
    .from('interacoes')
    .select('cliente_id, data')
    .eq('owner_id', user!.id)
    .order('data', { ascending: false })

  const ultimaInteracaoPorCliente: Record<string, string> = {}
  ultimasInteracoes?.forEach(i => {
    if (!ultimaInteracaoPorCliente[i.cliente_id]) {
      ultimaInteracaoPorCliente[i.cliente_id] = i.data
    }
  })

  const statusLabel: Record<string, string> = {
    ativo: 'Ativo',
    inativo: 'Inativo',
    prospecto: 'Prospecto',
  }

  const statusColor: Record<string, string> = {
    ativo: 'bg-green-100 text-green-700',
    inativo: 'bg-gray-100 text-gray-500',
    prospecto: 'bg-blue-100 text-blue-700',
  }

  const tipoAnimalLabel: Record<string, string> = {
    bovino: 'Bovino',
    equino: 'Equino',
    ambos: 'Bovino + Equino',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Clientes</h1>
        <Link
          href="/clientes/novo"
          className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Novo cliente
        </Link>
      </div>

      {/* Filtros */}
      <form className="flex flex-wrap gap-2">
        <input
          name="busca"
          type="text"
          placeholder="Buscar por nome..."
          defaultValue={params.busca}
          className="flex-1 min-w-[180px] px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <select
          name="status"
          defaultValue={params.status}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">Todos os status</option>
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
          <option value="prospecto">Prospecto</option>
        </select>
        <select
          name="tipo_animal"
          defaultValue={params.tipo_animal}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">Todos os animais</option>
          <option value="bovino">Bovino</option>
          <option value="equino">Equino</option>
          <option value="ambos">Ambos</option>
        </select>
        <button
          type="submit"
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-sm rounded-lg transition-colors"
        >
          Filtrar
        </button>
      </form>

      {/* Lista */}
      {clientes && clientes.length > 0 ? (
        <div className="space-y-2">
          {clientes.map(cliente => {
            const ultimaInteracao = ultimaInteracaoPorCliente[cliente.id]
            const semContato = !ultimaInteracao || ultimaInteracao < limite30dias

            return (
              <Link
                key={cliente.id}
                href={`/clientes/${cliente.id}`}
                className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-4 hover:border-green-300 hover:shadow-sm transition-all"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-gray-900 truncate">{cliente.nome_propriedade}</p>
                    {semContato && cliente.status === 'ativo' && (
                      <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                        ⚠️ +30 dias
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{cliente.contato}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    {cliente.cidade && <span>{cliente.cidade}/{cliente.estado}</span>}
                    {cliente.tipo_animal && <span>{tipoAnimalLabel[cliente.tipo_animal]}</span>}
                    {ultimaInteracao && <span>Último contato: {formatDate(ultimaInteracao)}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[cliente.status]}`}>
                    {statusLabel[cliente.status]}
                  </span>
                  <span className="text-gray-400 text-sm">›</span>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <p className="text-4xl mb-3">🏡</p>
          <p className="font-medium">Nenhum cliente encontrado</p>
          <Link href="/clientes/novo" className="text-sm text-green-600 hover:underline mt-1 inline-block">
            Cadastrar primeiro cliente
          </Link>
        </div>
      )}
    </div>
  )
}
