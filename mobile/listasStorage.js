
import AsyncStorage from '@react-native-async-storage/async-storage';

const CHAVE_LISTAS = '@CineTrack:listas';
const CHAVE_BACKUP = '@CineTrack:listas_backup';
const CHAVE_VERSAO = '@CineTrack:listas_versao';
const CHAVE_LEGADA = '@CineTrack:minhaLista';

let filaGravacao = Promise.resolve();

export function normalizarTipoLista(tipo) {
  const valor = String(tipo || '').toLowerCase();
  return ['tv', 'serie', 'série', 'series', 'show'].includes(valor)
    ? 'tv'
    : 'movie';
}

export function normalizarItemLista(item) {
  if (!item || typeof item !== 'object') return null;

  const midia = item.media || item.midia || {};
  const id = item.tmdb_id ?? item.media_id ?? item.id ?? midia.id;

  if (id === undefined || id === null || id === '') return null;

  return {
    id: Number(id) || id,
    tipo: normalizarTipoLista(
      item.tipo || item.media_type || item.mediaType ||
      midia.tipo || midia.media_type
    ),
    title:
      item.title || item.name || item.titulo || item.media_title ||
      midia.title || midia.name || 'Obra sem título',
    poster_path:
      item.poster_path || item.poster || item.poster_url ||
      midia.poster_path || null,
    release_date:
      item.release_date || item.first_air_date || item.year || item.ano ||
      midia.release_date || midia.first_air_date || '',
    vote_average: Number(item.vote_average || 0),
    adicionada_em:
      item.adicionada_em || item.added_at || item.created_at ||
      new Date().toISOString(),
  };
}

export function normalizarLista(lista, indice = 0) {
  if (!lista || typeof lista !== 'object' || Array.isArray(lista)) {
    return null;
  }

  const itensOriginais = [
    lista.itens,
    lista.items,
    lista.obras,
    lista.filmes,
    lista.results,
  ].find(Array.isArray) || [];

  const itensMapeados = itensOriginais
    .map(normalizarItemLista)
    .filter(Boolean);

  const vistos = new Set();

  const itens = itensMapeados.filter(item => {
    const chave = `${item.tipo}-${item.id}`;

    if (vistos.has(chave)) return false;

    vistos.add(chave);
    return true;
  });

  const nome =
    lista.nome ||
    lista.name ||
    lista.title ||
    `Minha lista ${indice + 1}`;

  return {
    id: String(
      lista.id ??
      lista.list_id ??
      `lista-recuperada-${indice}-${String(nome)
        .replace(/\s+/g, '-')
        .toLowerCase()}`
    ),
    nome,
    descricao: lista.descricao || lista.description || '',
    criada_em:
      lista.criada_em ||
      lista.created_at ||
      lista.createdAt ||
      new Date().toISOString(),
    itens,
  };
}

function converterListaLegada(dados) {
  if (!dados) return [];

  let itens = [];

  if (Array.isArray(dados)) {
    itens = dados;
  } else if (typeof dados === 'object') {
    itens = [
      dados.itens,
      dados.items,
      dados.filmes,
      dados.obras,
      dados.results,
      dados.data,
    ].find(Array.isArray) || [];
  }

  const normalizados = itens
    .map(normalizarItemLista)
    .filter(Boolean);

  if (!normalizados.length) return [];

  return [{
    id: 'cinetrack-lista-importada',
    nome: 'Minha lista',
    descricao: 'Obras recuperadas de uma lista anterior.',
    criada_em: new Date().toISOString(),
    itens: normalizados,
  }];
}

function interpretarListas(dados) {
  if (!dados) return [];

  if (!Array.isArray(dados) && typeof dados === 'object') {
    const colecoes = [
      dados.listas,
      dados.collections,
      dados.data,
      dados.results,
    ].find(Array.isArray);

    if (colecoes) {
      return interpretarListas(colecoes);
    }

    if (
      Array.isArray(dados.itens) ||
      Array.isArray(dados.items) ||
      Array.isArray(dados.obras) ||
      Array.isArray(dados.filmes) ||
      Array.isArray(dados.results)
    ) {
      const lista = normalizarLista(dados);
      return lista ? [lista] : [];
    }

    return [];
  }

  if (!Array.isArray(dados) || dados.length === 0) {
    return [];
  }

  // Evita confundir séries da TMDB (que possuem id e name)
  // com coleções criadas pelo usuário.
  const pareceListaDeColecoes = dados.some(item =>
    item &&
    typeof item === 'object' &&
    !Array.isArray(item) &&
    (
      Array.isArray(item.itens) ||
      Array.isArray(item.items) ||
      Array.isArray(item.obras) ||
      Array.isArray(item.filmes) ||
      Array.isArray(item.results) ||
      (item.id != null && Boolean(item.nome)) ||
      (item.list_id != null && Boolean(item.nome || item.name))
    )
  );

  if (pareceListaDeColecoes) {
    return dados
      .map((lista, indice) => normalizarLista(lista, indice))
      .filter(Boolean);
  }

  return converterListaLegada(dados);
}

function lerJSON(texto) {
  if (!texto) return null;

  try {
    return JSON.parse(texto);
  } catch (erro) {
    console.warn(
      'Não foi possível interpretar os dados das listas:',
      erro
    );
    return null;
  }
}

export async function lerListas() {
  const valores = await AsyncStorage.multiGet([
    CHAVE_LISTAS,
    CHAVE_BACKUP,
    CHAVE_VERSAO,
    CHAVE_LEGADA,
  ]);

  const principalTexto = valores[0]?.[1];
  const backupTexto = valores[1]?.[1];
  const versaoTexto = valores[2]?.[1];
  const legadoTexto = valores[3]?.[1];

  const principalDados = lerJSON(principalTexto);
  const backupDados = lerJSON(backupTexto);
  const legadoDados = lerJSON(legadoTexto);

  const principal = principalTexto != null
    ? interpretarListas(principalDados)
    : null;

  let backup = null;
  let versaoBackup = 0;

  if (backupDados !== null) {
    if (Array.isArray(backupDados)) {
      backup = interpretarListas(backupDados);
    } else {
      backup = interpretarListas(backupDados.listas);
      versaoBackup = Number(backupDados.versao || 0);
    }
  }

  const versaoConfirmada = Number(versaoTexto || 0);

  // Um backup mais novo indica uma gravação interrompida.
  if (backup !== null && versaoBackup > versaoConfirmada) {
    return backup;
  }

  if (principal !== null) return principal;
  if (backup !== null) return backup;

  return converterListaLegada(legadoDados);
}

async function gravarListasInternamente(listas) {
  const listasSeguras = (Array.isArray(listas) ? listas : [])
    .map((lista, indice) => normalizarLista(lista, indice))
    .filter(Boolean);

  const backupAtual = lerJSON(
    await AsyncStorage.getItem(CHAVE_BACKUP)
  );

  const versaoSalva = Number(
    await AsyncStorage.getItem(CHAVE_VERSAO) || 0
  );

  const versaoBackup = Number(backupAtual?.versao || 0);
  const novaVersao = Math.max(versaoSalva, versaoBackup) + 1;
  const json = JSON.stringify(listasSeguras);

  // Primeiro grava o backup; depois confirma a lista principal.
  await AsyncStorage.setItem(
    CHAVE_BACKUP,
    JSON.stringify({
      versao: novaVersao,
      listas: listasSeguras,
    })
  );

  await AsyncStorage.setItem(CHAVE_LISTAS, json);

  await AsyncStorage.setItem(
    CHAVE_VERSAO,
    String(novaVersao)
  );

  return listasSeguras;
}

export function salvarListas(listas) {
  const operacao = filaGravacao.then(
    () => gravarListasInternamente(listas),
    () => gravarListasInternamente(listas)
  );

  filaGravacao = operacao.catch(() => {});

  return operacao;
}

export function atualizarListas(atualizador) {
  const operacao = filaGravacao.then(async () => {
    const atuais = await lerListas();

    const resultado = typeof atualizador === 'function'
      ? atualizador(atuais)
      : atuais;

    return gravarListasInternamente(resultado);
  });

  filaGravacao = operacao.catch(() => {});

  return operacao;
}
