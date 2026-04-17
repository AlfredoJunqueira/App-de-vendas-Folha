# Plano de Testes — App Representante (Gestão de Feno)

> **Versão:** 1.0 — Abril 2026
> **Stack:** Next.js 16 + Supabase + React 19 + TypeScript + TailwindCSS 4

---

## Índice

1. [Autenticação](#1-autenticação)
2. [Dashboard](#2-dashboard)
3. [Clientes](#3-clientes)
4. [Pedidos](#4-pedidos)
5. [Carregamentos](#5-carregamentos)
6. [Parada Pública do Transportador](#6-página-pública-do-transportador)
7. [Interações](#7-interações)
8. [Locais de Carregamento](#8-locais-de-carregamento)
9. [Produtos](#9-produtos)
10. [Navegação e Layout](#10-navegação-e-layout)
11. [Segurança e Multi-Tenant](#11-segurança-e-multi-tenant)
12. [Fluxo End-to-End](#12-fluxo-end-to-end-pedido--entrega)

---

## 1. Autenticação

### 1.1 Login com sucesso

**Pré-condição:** Conta válida cadastrada no Supabase.

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Acessar `/login` | Exibir formulário com campos E-mail e Senha, ícone 🌾, título "App Representante" |
| 2 | Preencher e-mail e senha corretos → clicar "Entrar" | Botão muda para "Entrando...", redireciona para `/dashboard` |
| 3 | Tentar acessar `/dashboard` sem sessão | Redirecionar automaticamente para `/login` |

### 1.2 Login com credenciais inválidas

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Preencher senha incorreta → "Entrar" | Exibir mensagem "E-mail ou senha incorretos." em fundo vermelho |
| 2 | Deixar campo e-mail vazio → "Entrar" | Validação HTML nativa impede envio |
| 3 | Deixar campo senha vazio → "Entrar" | Validação HTML nativa impede envio |

### 1.3 Logout

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Clicar em "Sair" no TopNav | Sessão encerrada, redirecionar para `/login` |
| 2 | Após logout, pressionar voltar no browser | Não reentrar na área autenticada |

---

## 2. Dashboard

**Rota:** `/dashboard`

### 2.1 KPIs do mês atual

| # | KPI | Lógica Verificada |
|---|-----|-------------------|
| 1 | **Toneladas no mês** | Soma de `quantidade_kg / 1000` dos pedidos não cancelados com `data_fechamento` no mês atual |
| 2 | **Receita no mês** | Soma de `valor_total` dos pedidos não cancelados no mês, formatado em R$ BRL |
| 3 | **Pedidos ativos** | Contagem de pedidos com status `em_aberto` ou `confirmado` no mês |
| 4 | **Clientes atendidos** | Contagem de clientes únicos (Set) presentes nos pedidos do mês |

**Casos de teste:**
- Com dados: valores numéricos corretos nas 4 cards
- Sem dados no mês: exibir `0.0 t`, `R$ 0,00`, `0`, `0`

### 2.2 Próximos carregamentos (7 dias)

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Existem carregamentos nos próximos 7 dias | Listar com data formatada pt-BR, nome do transportador, badge de status colorido |
| 2 | Nenhum carregamento nos próximos 7 dias | Exibir "Nenhum carregamento nos próximos 7 dias" |
| 3 | Clicar em um carregamento | Navegar para `/carregamentos/[id]` |
| 4 | Clicar "Ver todos" | Navegar para `/carregamentos` |

**Badges de status:**
- `rascunho` → fundo cinza
- `confirmado` → fundo azul
- `em_rota` → fundo amarelo
- `entregue` → fundo verde

### 2.3 Clientes sem contato (alerta 30 dias)

| # | Cenário | Resultado Esperado |
|---|---------|-------------------|
| 1 | Cliente ativo sem interação nos últimos 30 dias | Aparecer no card "Clientes sem contato" com ⚠️, fundo laranja |
| 2 | Cliente com interação recente (< 30 dias) | Não aparecer no card de alerta |
| 3 | Mais de 5 clientes sem contato | Exibir 5 primeiros + "+N outros clientes" |
| 4 | Todos contactados | Exibir "Todos os clientes foram contactados nos últimos 30 dias" |
| 5 | Badge de contagem | Exibir número total de clientes em alerta ao lado do título |
| 6 | Clicar no cliente | Navegar para `/clientes/[id]` |

---

## 3. Clientes

**Rota base:** `/clientes`

### 3.1 Listagem de clientes

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Acessar `/clientes` | Listar clientes do usuário logado. Exibir nome da propriedade, contato, cidade/estado, status |
| 2 | Filtro de busca por texto | Filtrar por nome da propriedade ou contato em tempo real |
| 3 | Filtro por status (`ativo`, `inativo`, `prospecto`) | Exibir apenas clientes com o status selecionado |
| 4 | Filtro por tipo de animal (`bovino`, `equino`, `ambos`) | Filtrar corretamente |
| 5 | Sem clientes cadastrados | Exibir estado vazio com mensagem adequada |

### 3.2 Criar cliente — `/clientes/novo`

**Campos obrigatórios:** `nome_propriedade`, `contato`

| # | Campo | Validação Esperada |
|---|-------|--------------------|
| 1 | `nome_propriedade` | Obrigatório — bloquear envio se vazio |
| 2 | `contato` | Obrigatório |
| 3 | `telefone` | Opcional — formatar para WhatsApp |
| 4 | `cidade` + `estado` (UF 2 letras) | Opcional |
| 5 | `tipo_animal` | Select: bovino / equino / ambos |
| 6 | `num_cabecas` | Numérico, opcional |
| 7 | `produto_preferido` | Select: feno / pré-secado / ambos |
| 8 | `volume_medio_ton` | Numérico decimal, opcional |
| 9 | `status` | Select: ativo / inativo / prospecto. Default: `ativo` |
| 10 | `observacoes` | Textarea, opcional |
| 11 | Submeter formulário válido | Criar cliente, redirecionar para `/clientes/[id]` |
| 12 | `owner_id` | Deve ser preenchido automaticamente com o `user.id` autenticado |

### 3.3 Detalhes do cliente — `/clientes/[id]`

| # | Elemento | Resultado Esperado |
|---|----------|--------------------|
| 1 | Informações cadastrais | Exibir todos os campos preenchidos |
| 2 | Botão "Editar" | Navegar para `/clientes/[id]/editar` |
| 3 | Histórico de interações | Listar interações ordenadas por data decrescente |
| 4 | Botão "Nova interação" | Navegar para `/interacoes/nova?cliente_id=[id]` |
| 5 | Pedidos do cliente | Listar pedidos associados com status, valor, produto |
| 6 | Botão "Novo pedido" | Navegar para `/pedidos/novo?cliente_id=[id]` |
| 7 | Cliente inexistente / de outro usuário | Retornar 404 |

### 3.4 Editar cliente — `/clientes/[id]/editar`

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Acessar | Formulário pré-preenchido com dados atuais |
| 2 | Alterar campos e salvar | Atualizar dados, redirecionar para `/clientes/[id]` |
| 3 | Limpar campo obrigatório e salvar | Bloquear envio |

### 3.5 Excluir / Inativar cliente

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Ação de excluir | Setar `status = 'inativo'` (soft delete — não apaga do banco) |
| 2 | Cliente inativado | Não aparecer em listas filtradas por status `ativo` |

---

## 4. Pedidos

**Rota base:** `/pedidos`

### 4.1 Listagem de pedidos

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Acessar `/pedidos` | Listar pedidos do mês atual por padrão |
| 2 | Filtro por mês | `?mes=YYYY-MM` — exibir pedidos do mês selecionado |
| 3 | Filtro por status | `em_aberto`, `confirmado`, `entregue`, `cancelado` |
| 4 | Cada item da lista | Exibir cliente, produto, quantidade, valor, status, data de entrega prevista |

### 4.2 Criar pedido — `/pedidos/novo`

| # | Campo | Validação Esperada |
|---|-------|--------------------|
| 1 | `cliente_id` | Obrigatório — select com clientes ativos do usuário |
| 2 | `produto` | Select com produtos ativos do usuário |
| 3 | `quantidade_kg` | Numérico positivo, obrigatório |
| 4 | `preco_ton` | Numérico positivo |
| 5 | `valor_total` | Calculado automaticamente: `quantidade_ton * preco_ton` (campo gerado) |
| 6 | `data_fechamento` | Data |
| 7 | `data_entrega_prevista` | Data |
| 8 | `status` | Default: `em_aberto` |
| 9 | `condicao_pagamento` | Texto livre |
| 10 | `data_vencimento` | Data |
| 11 | `num_parcelas` | Inteiro |
| 12 | `local_carregamento_id` | Select com locais ativos |
| 13 | `observacoes` | Textarea |
| 14 | Submeter válido | Criar pedido, redirecionar para `/pedidos/[id]` |

### 4.3 Detalhes do pedido — `/pedidos/[id]`

| # | Elemento | Resultado Esperado |
|---|----------|--------------------|
| 1 | Todos os campos do pedido | Exibidos corretamente |
| 2 | `valor_total` | Exibido em formato R$ BRL |
| 3 | Botão "Editar" | Navegar para `/pedidos/[id]/editar` |
| 4 | Botão "Criar carregamento" | Acionar `criarCarregamentoDoPedido()`, criar carregamento com 1 parada |
| 5 | Após criar carregamento | Campo `carregamento_id` preenchido no pedido, link para o carregamento exibido |
| 6 | Botão "Excluir" | Exibir confirmação, excluir pedido, redirecionar para `/pedidos` |

### 4.4 Editar pedido — `/pedidos/[id]/editar`

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Acessar | Formulário pré-preenchido |
| 2 | Alterar e salvar | Atualizar, redirecionar para `/pedidos/[id]` |

---

## 5. Carregamentos

**Rota base:** `/carregamentos`

### 5.1 Calendário de carregamentos — `/carregamentos`

| # | Elemento | Resultado Esperado |
|---|----------|-------------------|
| 1 | Visualização padrão | Mês atual em grade calendario (Dom–Sáb) |
| 2 | Navegação entre meses | Botões `<` e `>` alteram o parâmetro `?mes=YYYY-MM` e recarregam |
| 3 | Dias com carregamentos | Exibir chips coloridos por status dentro da célula do dia |
| 4 | Dias com pedidos sem carregamento | Exibir chips diferenciados (cores âmbar/azul) |
| 5 | Dia de hoje | Destaque visual na célula |
| 6 | Legenda de cores | Exibida abaixo do calendário |
| 7 | Resumo do mês | Cards: total de carregamentos, toneladas carregadas, toneladas a entregar |
| 8 | Pedidos pendentes do mês | Lista com cliente, data prevista, quantidade, status |
| 9 | Clicar em um item do calendário | Navegar para `/carregamentos/[id]` ou `/pedidos/[id]` |
| 10 | Botão "+ Novo carregamento" | Navegar para `/carregamentos/novo` |

**Cores por status de carregamento:**
- `rascunho` → `#9ca3af` (cinza)
- `confirmado` → `#015046` (verde escuro)
- `em_rota` → `#D2D82B` (amarelo-limão)
- `entregue` → `#49B171` (verde)

### 5.2 Criar carregamento — `/carregamentos/novo`

| # | Seção | Campo | Validação |
|---|-------|-------|-----------|
| 1 | Cabeçalho | `data` | Obrigatório, tipo date |
| 2 | Transportador | `transportador_nome` | Opcional |
| 3 | Transportador | `transportador_telefone` | Opcional |
| 4 | Transportador | `transportador_placa` | Opcional |
| 5 | Paradas | Adicionar parada | Botão "+ Adicionar parada" |
| 6 | Parada | `cliente_id` | Select com clientes ativos |
| 7 | Parada | `produto` | Select com produtos ativos |
| 8 | Parada | `quantidade_kg` | Numérico positivo |
| 9 | Parada | `ordem` | Preenchido automaticamente pela ordem de inserção |
| 10 | Parada | `observacoes` | Opcional |
| 11 | Paradas | Remover parada | Botão de remoção por parada |
| 12 | Paradas | Reordenar | Possibilidade de alterar ordem das paradas |
| 13 | Status | `status` | Default: `rascunho` |
| 14 | Submeter | Formulário válido com ≥ 1 parada | Criar carregamento + paradas, redirecionar para `/carregamentos/[id]` |
| 15 | `link_publico_token` | Gerado automaticamente (UUID) pelo banco | Token único por carregamento |

### 5.3 Detalhes do carregamento — `/carregamentos/[id]`

| # | Elemento | Resultado Esperado |
|---|----------|--------------------|
| 1 | Informações do carregamento | Data, transportador, placa, status |
| 2 | Lista de paradas ordenadas por `ordem` | Nome da propriedade, cidade/estado, produto, quantidade |
| 3 | Total de toneladas | Soma de todas as paradas |
| 4 | Status badge | Colorido conforme status atual |
| 5 | Link público | URL `/c/[token]` copiável para enviar ao transportador |
| 6 | Botão "Editar" | Navegar para `/carregamentos/[id]/editar` |
| 7 | Botão "Excluir" | Confirmação → excluir (cascade deleta paradas), redirecionar para `/carregamentos` |
| 8 | Botão "Mover data" | Alterar `data` do carregamento sem editar todo o registro |

### 5.4 Editar carregamento — `/carregamentos/[id]/editar`

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Acessar | Formulário pré-preenchido com carregamento e paradas atuais |
| 2 | Adicionar nova parada | Parada inserida na lista |
| 3 | Remover parada existente | Parada removida visualmente e do banco ao salvar |
| 4 | Alterar ordem das paradas | Ordem refletida no campo `ordem` |
| 5 | Salvar | Atualizar carregamento e todas as paradas |

### 5.5 Status do carregamento

**Transições válidas:** `rascunho` → `confirmado` → `em_rota` → `entregue`

| # | Cenário | Resultado Esperado |
|---|---------|-------------------|
| 1 | Status atual `rascunho` | Exibir botão "Confirmar" |
| 2 | Status atual `confirmado` | Exibir botão "Iniciar rota" |
| 3 | Status atual `em_rota` | Exibir botão "Marcar como entregue" |
| 4 | Status atual `entregue` | Nenhum botão de avanço |
| 5 | Retroceder status | Não permitido pela lógica de negócio |

---

## 6. Página Pública do Transportador

**Rota:** `/c/[token]` (sem autenticação)

### 6.1 Acesso via token

| # | Cenário | Resultado Esperado |
|---|---------|-------------------|
| 1 | Token válido | Exibir roteiro completo do carregamento |
| 2 | Token inválido / inexistente | Retornar página 404 |

### 6.2 Conteúdo da página

| # | Elemento | Resultado Esperado |
|---|----------|-------------------|
| 1 | Cabeçalho | Fundo verde escuro, ícone 🚛, "Roteiro de entrega", data por extenso em pt-BR |
| 2 | Nome e placa do transportador | Exibidos no cabeçalho |
| 3 | Status atual | Badge branco translúcido no cabeçalho |
| 4 | Paradas numeradas | Número circular verde, nome da propriedade, cidade/estado, telefone clicável (`tel:`), produto, quantidade em kg e toneladas |
| 5 | Observações por parada | Exibidas em fundo âmbar com ⚠️ quando presentes |
| 6 | Telefone do cliente | Link `tel:` clicável para ligar diretamente |

### 6.3 Botões de atualização de status (StatusButtons)

| # | Status Atual | Botão Exibido | Ação |
|---|---|---|---|
| 1 | `rascunho` | "Confirmar viagem" | Chama `PATCH /api/carregamento/[token]/status` com `confirmado` |
| 2 | `confirmado` | "Iniciar rota" | Atualiza para `em_rota` |
| 3 | `em_rota` | "Confirmar entrega" | Atualiza para `entregue` |
| 4 | `entregue` | Sem botão / mensagem de conclusão | — |

### 6.4 API de status — `PATCH /api/carregamento/[token]/status`

| # | Cenário | Resultado Esperado |
|---|---------|-------------------|
| 1 | Transição válida (`confirmado → em_rota`) | `{ success: true, status: "em_rota" }`, HTTP 200 |
| 2 | Token inválido | HTTP 404 |
| 3 | Transição inválida (tentar voltar status) | HTTP 400 ou manter status atual |
| 4 | Usa `SUPABASE_SERVICE_ROLE_KEY` | Não requer autenticação de usuário |

---

## 7. Interações

**Rota base:** `/interacoes`

### 7.1 Listagem de interações

| # | Elemento | Resultado Esperado |
|---|----------|-------------------|
| 1 | Listar todas as interações do usuário | Ordenadas por data decrescente |
| 2 | Cada item | Tipo de interação (ícone/label), data, cliente, assunto, próxima ação |

### 7.2 Criar interação — `/interacoes/nova`

| # | Campo | Validação Esperada |
|---|-------|--------------------|
| 1 | `cliente_id` | Obrigatório — select com clientes ativos. Pré-selecionado se `?cliente_id=` na URL |
| 2 | `data` | Obrigatório, tipo date, default hoje |
| 3 | `tipo` | Select: `visita` / `ligacao` / `whatsapp` / `email` — obrigatório |
| 4 | `assunto` | Textarea, opcional |
| 5 | `proxima_acao` | Textarea com ação de follow-up, opcional |
| 6 | `data_proxima_acao` | Data futura para lembrete, opcional |
| 7 | Submeter válido | Criar interação, redirecionar para `/clientes/[cliente_id]` |

### 7.3 Editar interação — `/interacoes/[id]/editar`

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Acessar | Formulário pré-preenchido |
| 2 | Alterar e salvar | Atualizar, redirecionar |
| 3 | Interação de outro usuário | Retornar 404 ou acesso negado |

### 7.4 Integração com alerta do dashboard

| # | Cenário | Resultado Esperado |
|---|---------|-------------------|
| 1 | Registrar interação para cliente em alerta | Cliente some do card "Sem contato" do dashboard |
| 2 | Interação com `data_proxima_acao` | Visível nos detalhes do cliente como próxima ação pendente |

---

## 8. Locais de Carregamento

**Rota base:** `/locais`

### 8.1 Listagem de locais

| # | Elemento | Resultado Esperado |
|---|----------|-------------------|
| 1 | Listar locais ativos | Nome, responsável, cidade/estado, capacidade, produto |
| 2 | Locais inativos | Não exibidos por padrão (ou com indicador) |

### 8.2 Criar local — `/locais/novo`

| # | Campo | Validação |
|---|-------|-----------|
| 1 | `nome` | Obrigatório |
| 2 | `responsavel` | Opcional |
| 3 | `telefone` | Opcional |
| 4 | `cidade` + `estado` | Opcional |
| 5 | `endereco` | Opcional |
| 6 | `produto` | Select: feno / pré-secado / ambos |
| 7 | `capacidade_ton` | Numérico decimal |
| 8 | `observacoes` | Textarea |
| 9 | `ativo` | Checkbox, default `true` |
| 10 | Submeter | Criar local, redirecionar |

### 8.3 Detalhes — `/locais/[id]`

| # | Elemento | Resultado Esperado |
|---|----------|-------------------|
| 1 | Todas as informações do local | Exibidas corretamente |
| 2 | Botão "Editar" | Navegar para `/locais/[id]/editar` |

### 8.4 Editar local — `/locais/[id]/editar`

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Formulário pré-preenchido | Dados atuais carregados |
| 2 | Salvar | Atualizar, redirecionar |

### 8.5 Excluir / Inativar local

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Excluir | `ativo = false` (soft delete) |
| 2 | Local inativo | Não aparecer em selects de pedidos/carregamentos |

---

## 9. Produtos

**Rota base:** `/produtos`

### 9.1 Listagem de produtos

| # | Elemento | Resultado Esperado |
|---|----------|-------------------|
| 1 | Listar todos os produtos do usuário | `label`, `curto`, status ativo/inativo, ordem |
| 2 | Ordenação | Ordenados pelo campo `ordem` |

### 9.2 Criar produto — `/produtos/novo`

| # | Campo | Validação |
|---|-------|-----------|
| 1 | `label` | Nome completo, ex: "Feno Premium" — obrigatório |
| 2 | `curto` | Abreviação para calendário, ex: "FP" |
| 3 | `value` | Slug/identificador, ex: "feno_premium" |
| 4 | `ordem` | Inteiro para ordenação |
| 5 | `ativo` | Default `true` |
| 6 | Submeter | Criar produto, redirecionar |

### 9.3 Editar produto — `/produtos/[id]/editar`

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Formulário pré-preenchido | Dados atuais |
| 2 | Salvar | Atualizar, redirecionar |

### 9.4 Ativar / Desativar produto

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Toggle `ativo` via `toggleProdutoAtivo()` | Estado alterna, lista atualiza |
| 2 | Produto inativo | Não aparecer em selects de pedidos e paradas |

### 9.5 Excluir produto

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Excluir | Removido da lista e dos selects |
| 2 | Produto com pedidos vinculados | Verificar se a exclusão é bloqueada ou permite (depende de FK constraint) |

---

## 10. Navegação e Layout

### 10.1 TopNav (desktop)

| # | Elemento | Resultado Esperado |
|---|----------|-------------------|
| 1 | Logo "Folha" | Clicável, navega para `/dashboard` |
| 2 | Links de navegação | Dashboard, Clientes, Carregamentos, Pedidos, Interações, Locais, Produtos |
| 3 | Link ativo | Destaque visual no link da página atual |
| 4 | Botão "Sair" | Faz logout e redireciona para `/login` |

### 10.2 MobileNav (mobile — bottom tab bar)

| # | Elemento | Resultado Esperado |
|---|----------|-------------------|
| 1 | Visível apenas em telas pequenas | Hidden em desktop |
| 2 | 7 abas | Dashboard, Clientes, Agenda (Carregamentos), Pedidos, Carreg., Locais, Produtos |
| 3 | Tab ativa | Destaque visual |
| 4 | Tocar em tab | Navegar para a rota correspondente |

### 10.3 Responsividade

| # | Componente | Teste |
|---|------------|-------|
| 1 | Dashboard KPIs | 2 colunas em mobile, 4 em desktop |
| 2 | Formulários | Usável em viewport 375px |
| 3 | Tabelas/listas | Não transbordar horizontalmente |
| 4 | Calendário | Visualizável em mobile |

---

## 11. Segurança e Multi-Tenant

### 11.1 Isolamento de dados (Row Level Security)

| # | Cenário | Resultado Esperado |
|---|---------|-------------------|
| 1 | Usuário A tenta acessar `/clientes/[id]` do usuário B | Retornar 404 (RLS bloqueia no banco) |
| 2 | Usuário A tenta listar pedidos | Ver apenas pedidos com `owner_id = auth.uid()` |
| 3 | Usuário A tenta acessar carregamento de B via token público | Token funciona (page pública usa service key), mas não expõe `owner_id` |

### 11.2 Acesso de fornecedor (supplier_profiles)

| # | Permissão | Resultado Esperado |
|---|-----------|-------------------|
| 1 | Fornecedor acessa clientes do representante vinculado | Permitido (read-only via RLS) |
| 2 | Fornecedor tenta criar cliente | Bloqueado pelo RLS |
| 3 | Fornecedor confirma carregamento (`rascunho → confirmado`) | Permitido |
| 4 | Fornecedor tenta avançar além de `confirmado` | Bloqueado pela lógica RLS |

### 11.3 Proteção de rotas

| # | Rota | Comportamento sem auth |
|---|------|------------------------|
| 1 | Qualquer rota em `/(app)/` | Redirecionar para `/login` |
| 2 | `/c/[token]` | Acessível sem auth (página pública) |
| 3 | `PATCH /api/carregamento/[token]/status` | Usa service role key, sem necessidade de auth de usuário |

---

## 12. Fluxo End-to-End: Pedido → Entrega

Este cenário valida a integração completa entre todos os módulos.

| # | Passo | Ação | Resultado Esperado |
|---|-------|------|-------------------|
| 1 | **Pré-requisito** | Criar produto "Feno Tifton" em `/produtos/novo` | Produto ativo disponível nos selects |
| 2 | **Pré-requisito** | Criar local "Fazenda Origem" em `/locais/novo` | Local disponível nos selects de pedido |
| 3 | **Cliente** | Criar cliente "Fazenda Silva" em `/clientes/novo` (tipo: bovino, status: ativo) | Cliente listado em `/clientes` |
| 4 | **Pedido** | Criar pedido em `/pedidos/novo` para "Fazenda Silva", 5.000 kg de "Feno Tifton" | Pedido criado com status `em_aberto` |
| 5 | **Carregamento** | Em `/pedidos/[id]`, clicar "Criar carregamento" | Carregamento criado com 1 parada, status `rascunho` |
| 6 | **Carregamento** | Adicionar transportador e placa em `/carregamentos/[id]/editar` | Dados atualizados |
| 7 | **Link público** | Copiar URL `/c/[token]` e abrir em aba anônima | Página exibida sem login: roteiro com 1 parada |
| 8 | **Transportador** | Na página pública, clicar "Confirmar viagem" | Status muda para `confirmado`, API retorna `{ success: true }` |
| 9 | **Em rota** | Clicar "Iniciar rota" | Status muda para `em_rota` |
| 10 | **Entregue** | Clicar "Confirmar entrega" | Status muda para `entregue` |
| 11 | **Dashboard** | Verificar KPIs | Toneladas e receita do mês refletem o pedido entregue |
| 12 | **Interação** | Registrar interação de "visita" para "Fazenda Silva" | Cliente some do card de alerta do dashboard |
| 13 | **Calendário** | Acessar `/carregamentos` no mês do carregamento | Célula do dia exibe chip verde (entregue), contagem de toneladas atualizada |

---

## Matriz de Cobertura

| Módulo | CRUD | Filtros | Validação | Integração | Segurança |
|--------|------|---------|-----------|------------|-----------|
| Autenticação | — | — | ✓ | ✓ | ✓ |
| Dashboard | R | ✓ | — | ✓ | ✓ |
| Clientes | ✓ | ✓ | ✓ | ✓ | ✓ |
| Pedidos | ✓ | ✓ | ✓ | ✓ | ✓ |
| Carregamentos | ✓ | ✓ | ✓ | ✓ | ✓ |
| Transportador (público) | R/U | — | ✓ | ✓ | ✓ |
| Interações | ✓ | — | ✓ | ✓ | ✓ |
| Locais | ✓ | — | ✓ | ✓ | ✓ |
| Produtos | ✓ | — | ✓ | ✓ | ✓ |
| Multi-Tenant/RLS | — | — | — | — | ✓ |

---

*Gerado automaticamente com base na análise do código-fonte em `src/` e `supabase/`.*
