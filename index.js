const prompt = require('prompt-sync')();
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

console.log('Conectado ao Supabase ✅');

//  UTILITÁRIOS

function linha() {
    console.log('='.repeat(40));
}

function cabecalho(titulo) {
    console.log('\n' + '='.repeat(40));
    console.log(` ${titulo}`);
    console.log('='.repeat(40));
}

//  CLIENTES

async function cadastrarCliente() {
    cabecalho('CADASTRAR CLIENTE');

    const nome = prompt('Nome: ');
    const cpf = prompt('CPF (somente números): ');
    const email = prompt('E-mail: ');
    const telefone = prompt('Telefone: ');

    const { data, error } = await supabase
        .from('clientes')
        .insert({ nome, cpf, email, telefone })
        .select();

    if (error) { console.error('Erro:', error.message); }
    else { console.log(`Cliente "${data[0].nome}" cadastrado com ID ${data[0].id}.`); }
}

async function listarClientes() {
    cabecalho('LISTA DE CLIENTES');

    const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('nome', { ascending: true });

    if (error) { console.error('❌ Erro:', error.message); return; }
    if (data.length === 0) { console.log('Nenhum cliente cadastrado.'); return; }

    data.forEach(c => {
        console.log(`\n  ID: ${c.id} | Nome: ${c.nome} | CPF: ${c.cpf}`);
        console.log(`  E-mail: ${c.email} | Telefone: ${c.telefone}`);
        linha();
    });
}

async function buscarCliente() {
    cabecalho('BUSCAR CLIENTE');

    const termo = prompt('Nome (parcial) ou CPF: ');

    const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .or(`nome.ilike.%${termo}%,cpf.eq.${termo}`);

    if (error) { console.error('Erro:', error.message); return; }
    if (data.length === 0) { console.log('Nenhum cliente encontrado.'); return; }

    data.forEach(c => {
        console.log(`\n  ID: ${c.id} | Nome: ${c.nome} | CPF: ${c.cpf} | E-mail: ${c.email}`);
    });
}

async function atualizarCliente() {
    cabecalho('ATUALIZAR CLIENTE');

    const id = prompt('ID do cliente: ');
    const campo = prompt('Campo (nome / email / telefone): ');
    const novoValor = prompt('Novo valor: ');

    const camposPermitidos = ['nome', 'email', 'telefone'];
    if (!camposPermitidos.includes(campo)) {
        console.log('Campo inválido.'); return;
    }

    const { error } = await supabase
        .from('clientes')
        .update({ [campo]: novoValor })
        .eq('id', id);

    if (error) { console.error('Erro:', error.message); }
    else { console.log(`Campo "${campo}" atualizado.`); }
}

async function deletarCliente() {
    cabecalho('DELETAR CLIENTE');

    const id = prompt('ID do cliente: ');
    const confirmacao = prompt(`Confirmar exclusão do ID ${id}? (s/n): `);

    if (confirmacao.toLowerCase() !== 's') { console.log('Cancelado.'); return; }

    const { error } = await supabase.from('clientes').delete().eq('id', id);

    if (error) { console.error('Erro:', error.message); }
    else { console.log('Cliente deletado.'); }
}

//  CONTAS

async function cadastrarConta() {
    cabecalho('CADASTRAR CONTA');

    const cliente_id = prompt('ID do cliente: ');
    const tipo = prompt('Tipo (corrente / poupança): ');
    const saldo = prompt('Saldo inicial: ');

    const { data, error } = await supabase
        .from('contas')
        .insert({ cliente_id, tipo, saldo: parseFloat(saldo) })
        .select();

    if (error) { console.error('Erro:', error.message); }
    else { console.log(`Conta ${data[0].tipo} criada com ID ${data[0].id}.`); }
}

async function listarContas() {
    cabecalho('LISTA DE CONTAS');

    const { data, error } = await supabase
        .from('contas')
        .select('id, tipo, saldo, clientes(nome, cpf)')
        .order('id', { ascending: true });

    if (error) { console.error('Erro:', error.message); return; }
    if (data.length === 0) { console.log('Nenhuma conta cadastrada.'); return; }

    data.forEach(c => {
        console.log(`\n  ID: ${c.id} | Tipo: ${c.tipo} | Saldo: R$ ${Number(c.saldo).toFixed(2)}`);
        console.log(`  Titular: ${c.clientes?.nome || '—'} (CPF: ${c.clientes?.cpf || '—'})`);
        linha();
    });
}

//  TRANSAÇÕES

async function registrarTransacao() {
    cabecalho('REGISTRAR TRANSAÇÃO');

    const conta_id = prompt('ID da conta: ');
    const tipo = prompt('Tipo (deposito / saque / transferencia): ');
    const valor = prompt('Valor: ');
    const descricao = prompt('Descrição (opcional): ');

    const valorNum = parseFloat(valor);
    if (isNaN(valorNum) || valorNum <= 0) { console.log('Valor inválido.'); return; }

    const { data, error } = await supabase
        .from('transacoes')
        .insert({ conta_id, tipo, valor: valorNum, descricao })
        .select();

    if (error) { console.error('Erro:', error.message); return; }

    // Atualiza saldo
    const { data: conta } = await supabase
        .from('contas').select('saldo').eq('id', conta_id).single();

    if (conta) {
        const novoSaldo = tipo === 'deposito'
            ? parseFloat(conta.saldo) + valorNum
            : parseFloat(conta.saldo) - valorNum;

        await supabase.from('contas').update({ saldo: novoSaldo }).eq('id', conta_id);
        console.log(`Transação registrada! Novo saldo: R$ ${novoSaldo.toFixed(2)}`);
    }
}

async function listarTransacoes() {
    cabecalho('LISTAR TRANSAÇÕES');
    console.log('  1 - Todas  2 - Por tipo  3 - Valor mínimo  4 - Valor máximo');

    const opcao = prompt('Filtro: ');

    let query = supabase
        .from('transacoes')
        .select('id, tipo, valor, descricao, created_at, contas(id, tipo)')
        .order('created_at', { ascending: false })
        .limit(50);

    if (opcao === '2') {
        const tipo = prompt('Tipo (deposito / saque / transferencia): ');
        query = query.eq('tipo', tipo);
    } else if (opcao === '3') {
        query = query.gte('valor', parseFloat(prompt('Valor mínimo: ')));
    } else if (opcao === '4') {
        query = query.lte('valor', parseFloat(prompt('Valor máximo: ')));
    }

    const { data, error } = await query;

    if (error) { console.error('Erro:', error.message); return; }
    if (data.length === 0) { console.log('Nenhuma transação.'); return; }

    data.forEach(t => {
        console.log(`\n  ID: ${t.id} | Tipo: ${t.tipo} | Valor: R$ ${Number(t.valor).toFixed(2)}`);
        console.log(`  Conta: ${t.contas?.id} | Descrição: ${t.descricao || '—'}`);
        console.log(`  Data: ${new Date(t.created_at).toLocaleString('pt-BR')}`);
        linha();
    });
}

//  SERVIÇOS

async function cadastrarServico() {
    cabecalho('CADASTRAR SERVIÇO');

    const nome = prompt('Nome: ');
    const descricao = prompt('Descrição: ');
    const mensalidade = prompt('Mensalidade (R$): ');

    const { data, error } = await supabase
        .from('servicos')
        .insert({ nome, descricao, mensalidade: parseFloat(mensalidade) })
        .select();

    if (error) { console.error('Erro:', error.message); }
    else { console.log(`Serviço "${data[0].nome}" cadastrado com ID ${data[0].id}.`); }
}

async function listarServicos() {
    cabecalho('LISTA DE SERVIÇOS');

    const { data, error } = await supabase
        .from('servicos').select('*').order('nome', { ascending: true });

    if (error) { console.error('Erro:', error.message); return; }
    if (data.length === 0) { console.log('Nenhum serviço.'); return; }

    data.forEach(s => {
        console.log(`\n  ID: ${s.id} | Nome: ${s.nome}`);
        console.log(`  Descrição: ${s.descricao} | Mensalidade: R$ ${Number(s.mensalidade).toFixed(2)}`);
        linha();
    });
}

async function contratarServico() {
    cabecalho('CONTRATAR SERVIÇO');

    const cliente_id = prompt('ID do cliente: ');
    const servico_id = prompt('ID do serviço: ');
    const data_inicio = prompt('Data de início (AAAA-MM-DD): ');

    const { data, error } = await supabase
        .from('cliente_servicos')
        .insert({ cliente_id, servico_id, data_inicio })
        .select();

    if (error) { console.error('Erro:', error.message); }
    else { console.log(`Serviço contratado! Registro ID ${data[0].id}.`); }
}

async function listarServicosContratados() {
    cabecalho('SERVIÇOS CONTRATADOS');

    const filtro = prompt('ID do cliente (Enter para todos): ');

    let query = supabase
        .from('cliente_servicos')
        .select('id, data_inicio, ativo, clientes(nome), servicos(nome, mensalidade)')
        .order('id', { ascending: true });

    if (filtro.trim() !== '') query = query.eq('cliente_id', filtro);

    const { data, error } = await query;

    if (error) { console.error('Erro:', error.message); return; }
    if (data.length === 0) { console.log('Nenhum serviço contratado.'); return; }

    data.forEach(cs => {
        console.log(`\n  ID: ${cs.id} | Cliente: ${cs.clientes?.nome || '—'}`);
        console.log(`  Serviço: ${cs.servicos?.nome || '—'} | R$ ${Number(cs.servicos?.mensalidade || 0).toFixed(2)}`);
        console.log(`  Início: ${cs.data_inicio} | Ativo: ${cs.ativo ? 'Sim' : 'Não'}`);
        linha();
    });
}

//  MENU PRINCIPAL

function exibirMenu() {
    console.log('\n' + '='.repeat(40));
    console.log('        SISTEMA BANCÁRIO');
    console.log('='.repeat(40));
    console.log('  1 - Cadastrar cliente   2 - Listar clientes');
    console.log('  3 - Buscar cliente      4 - Atualizar cliente');
    console.log('  5 - Deletar cliente');
    console.log('  6 - Cadastrar conta     7 - Listar contas');
    console.log('  8 - Registrar transação 9 - Listar transações');
    console.log(' 10 - Cadastrar serviço  11 - Contratar serviço');
    console.log(' 12 - Serviços contratados 13 - Listar serviços');
    console.log('  0 - Sair');
    console.log('='.repeat(40));
}

async function main() {
    console.log('\n🏦 Bem-vindo ao Sistema Bancário!');

    while (true) {
        exibirMenu();
        const opcao = prompt('\nOpção: ');

        switch (opcao.trim()) {
            case '1': await cadastrarCliente(); break;
            case '2': await listarClientes(); break;
            case '3': await buscarCliente(); break;
            case '4': await atualizarCliente(); break;
            case '5': await deletarCliente(); break;
            case '6': await cadastrarConta(); break;
            case '7': await listarContas(); break;
            case '8': await registrarTransacao(); break;
            case '9': await listarTransacoes(); break;
            case '10': await cadastrarServico(); break;
            case '11': await contratarServico(); break;
            case '12': await listarServicosContratados(); break;
            case '13': await listarServicos(); break;
            case '0':
                console.log('\n Até logo!\n');
                process.exit(0);
            default:
                console.log('\n Opção inválida.');
        }
    }
}

main();