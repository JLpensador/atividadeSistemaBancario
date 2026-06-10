# 🏦 Sistema Bancário — Node.js + Supabase

## Pré-requisitos
- Node.js 18+
- Projeto criado no [Supabase](https://supabase.com)

---

## Configuração

### 1. Criar as tabelas no Supabase
Abra o **SQL Editor** do seu projeto Supabase, cole o conteúdo de `banco.sql` e execute.

### 2. Instalar dependências
```bash
npm install
```

### 3. Configurar credenciais
Edite as linhas iniciais de `index.js` com sua URL e chave anon do Supabase:

```js
const SUPABASE_URL = "https://SEU_PROJETO.supabase.co";
const SUPABASE_KEY = "SUA_CHAVE_ANON";
```

Você encontra essas informações em: **Supabase > Project Settings > API**.

### 4. Executar
```bash
node index.js
```
ou
```bash
npm start
```

---

## Funcionalidades

| Opção | Ação |
|-------|------|
| 1  | Cadastrar cliente |
| 2  | Listar todos os clientes |
| 3  | Buscar cliente por nome ou CPF |
| 4  | Atualizar campo de um cliente |
| 5  | Deletar cliente |
| 6  | Cadastrar conta bancária (corrente/poupança) |
| 7  | Listar contas com nome do titular |
| 8  | Registrar transação (depósito/saque/transferência) + atualiza saldo |
| 9  | Listar transações com filtros (tipo, valor mínimo, valor máximo) |
| 10 | Cadastrar serviço |
| 11 | Contratar serviço para um cliente |
| 12 | Listar serviços contratados (filtro por cliente) |
| 13 | Listar serviços disponíveis |
| 0  | Sair |

---

## Consultas Supabase utilizadas

```js
.select()         // buscar registros
.insert()         // inserir registro
.update()         // atualizar registro
.delete()         // deletar registro
.eq()             // igualdade
.or()             // OU lógico
.gte() / .lte()   // maior/menor ou igual
.ilike()          // busca textual case-insensitive
.order()          // ordenação
.limit()          // limitar resultados
.single()         // retorna um único objeto
```
