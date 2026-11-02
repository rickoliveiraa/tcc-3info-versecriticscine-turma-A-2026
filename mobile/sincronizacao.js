import AsyncStorage from './userStorage';
import { obterUsuarioIdAtivo } from './userStorage';
import { API_URL } from './apiConfig';
import { lerListas, salvarListas } from './listasStorage';

// ============================================================
// CHAVES DE ARMAZENAMENTO
// ============================================================

// O token permanece global, pois representa a sessão autenticada.
// As demais chaves são automaticamente separadas pelo userStorage.

const CHAVE_TOKEN = '@CineTrack:token';
const CHAVE_AVALIACOES = '@CineTrack:avaliacoes';
const CHAVE_REGISTROS = '@CineTrack:registros';
const CHAVE_MINHA_LISTA = '@CineTrack:minhaLista';

// ============================================================
// LEITURA SEGURA DE JSON
// ============================================================

function lerJSONSeguro(texto) {
  if (!texto) return null;

  try {
    return JSON.parse(texto);
  } catch {
    return null;
  }
}

// ============================================================
// EXTRAIR AVALIAÇÕES
// ============================================================

function extrairAvaliacoes(dados) {
  if (!dados) return [];

  if (Array.isArray(dados)) {
    return dados.filter(
      item => item && typeof item === 'object'
    );
  }

  if (typeof dados !== 'object') {
    return [];
  }

  for (const chave of [
    'avaliacoes',
    'registros',
    'items',
    'itens',
    'data',
    'results',
  ]) {
    if (Array.isArray(dados[chave])) {
      return extrairAvaliacoes(dados[chave]);
    }
  }

  return Object.entries(dados)
    .filter(
      ([, valor]) =>
        valor &&
        typeof valor === 'object' &&
        !Array.isArray(valor)
    )
    .map(([chave, valor]) => {
      // Reconhece chaves no formato movie-123 ou tv-456.
       const match = String(chave).match(
  /^(movie|tv)[-_](\d+)$/i
);

      return {
        ...valor,

        ...(match
          ? {
              tmdb_id:
                valor.tmdb_id ?? Number(match[2]),

              tipo:
                valor.tipo ?? match[1].toLowerCase(),
            }
          : {}),
      };
    });
}

// ============================================================
// UNIFICAR AVALIAÇÕES
// ============================================================

function unificarAvaliacoes(...grupos) {
  const mapa = new Map();

  grupos.flat().forEach(item => {
    if (!item || typeof item !== 'object') {
      return;
    }

    const midia = item.media || item.midia || {};

    const id =
      item.tmdb_id ??
      item.tmdbId ??
      item.id ??
      midia.tmdb_id ??
      midia.id;

    if (
      id === undefined ||
      id === null ||
      String(id).trim() === ''
    ) {
      return;
    }

    const tipoRaw = String(
      item.tipo ??
      item.media_type ??
      item.mediaType ??
      midia.tipo ??
      midia.media_type ??
      'movie'
    ).toLowerCase();

    const tipo = [
      'tv',
      'serie',
      'série',
      'series',
      'show',
    ].includes(tipoRaw)
      ? 'tv'
      : 'movie';

    const chave = `${tipo}-${id}`;

    const anterior = mapa.get(chave) || {};

    mapa.set(chave, {
      ...anterior,
      ...item,

      tmdb_id: Number(id) || id,
      tipo,

      title:
        item.title ||
        item.name ||
        item.titulo ||
        item.media_title ||
        midia.title ||
        midia.name ||
        anterior.title ||
        'Obra sem título',

      poster_path:
        item.poster_path ||
        item.poster ||
        item.poster_url ||
        midia.poster_path ||
        anterior.poster_path ||
        null,

      stars:
        item.stars ??
        item.nota ??
        item.rating ??
        anterior.stars ??
        0,

      nota:
        item.nota ??
        item.stars ??
        item.rating ??
        anterior.nota ??
        0,

      comment:
        item.comment ??
        item.review ??
        item.resenha ??
        item.comentario ??
        anterior.comment ??
        '',

      review:
        item.review ??
        item.comment ??
        item.resenha ??
        item.comentario ??
        anterior.review ??
        '',

      watch_date:
        item.watch_date ??
        item.dataAssistida ??
        item.watchedAt ??
        item.data ??
        item.atualizado_em ??
        anterior.watch_date ??
        null,
    });
  });

  return [...mapa.values()];
}

// ============================================================
// EXTRAIR LISTA LEGADA
// ============================================================

// Esta função trabalha somente com os dados da conta ativa.
// O userStorage impede a leitura das antigas chaves globais.

function extrairListaLegada(dados) {
  if (!dados) return [];

  const itens = Array.isArray(dados)
    ? dados
    : (
        dados.itens ||
        dados.items ||
        dados.filmes ||
        dados.obras ||
        dados.results ||
        dados.data ||
        []
      );

  if (!Array.isArray(itens) || !itens.length) {
    return [];
  }

  return [
    {
      id: 'cinetrack-lista-importada',
      nome: 'Minha lista',
      descricao: 'Obras recuperadas de uma lista anterior.',
      criada_em: new Date().toISOString(),
      itens,
    },
  ];
}

// ============================================================
// IDENTIFICAR LISTAS
// ============================================================

function chaveIdentificacaoLista(lista, indice) {
  const id = String(lista?.id ?? '').trim();

  if (!id) {
    return `sem-id-${indice}`;
  }

  // web-123 e 123 representam a mesma lista do servidor.
  const idWeb = id.match(/^web-(\d+)$/);

  if (idWeb) {
    return `servidor-${idWeb[1]}`;
  }

  if (/^\d+$/.test(id)) {
    return `servidor-${id}`;
  }

  return `local-${id}`;
}

// ============================================================
// UNIFICAR ITENS DAS LISTAS
// ============================================================

function unificarItensLista(...grupos) {
  const mapa = new Map();

  grupos.flat().forEach(item => {
    if (!item || typeof item !== 'object') {
      return;
    }

    const id =
      item.tmdb_id ??
      item.tmdbId ??
      item.id;

    if (
      id === undefined ||
      id === null ||
      String(id).trim() === ''
    ) {
      return;
    }

    const tipoRaw = String(
      item.tipo ||
      item.media_type ||
      item.mediaType ||
      'movie'
    ).toLowerCase();

    const tipo = [
      'tv',
      'serie',
      'série',
      'series',
      'show',
    ].includes(tipoRaw)
      ? 'tv'
      : 'movie';

    const chave = `${tipo}-${id}`;

    mapa.set(chave, {
      ...(mapa.get(chave) || {}),
      ...item,
    });
  });

  return [...mapa.values()];
}

// ============================================================
// UNIFICAR LISTAS SEM MISTURAR COLEÇÕES
// ============================================================

function unificarListas(...grupos) {
  const mapa = new Map();

  let indice = 0;

  grupos.flat().forEach(lista => {
    if (!lista || typeof lista !== 'object') {
      return;
    }

    const chave = chaveIdentificacaoLista(
      lista,
      indice++
    );

    const anterior = mapa.get(chave);

    if (!anterior) {
      mapa.set(chave, {
        ...lista,

        itens: Array.isArray(lista.itens)
          ? [...lista.itens]
          : [],
      });

      return;
    }

    mapa.set(chave, {
      ...anterior,
      ...lista,

      itens: unificarItensLista(
        anterior.itens || [],
        lista.itens || []
      ),
    });
  });

  return [...mapa.values()];
}

// ============================================================
// FAZER REQUISIÇÃO DE SINCRONIZAÇÃO
// ============================================================

async function enviarSincronizacao(token, corpo) {
  const url = `${API_URL.replace(/\/+$/, '')}/sincronizar_dados.php`;

  let resposta;

  try {
    resposta = await fetch(url, {
      method: 'POST',

      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'Cache-Control': 'no-cache',
      },

      body: JSON.stringify(corpo),
    });

  } catch (erro) {
    console.error(
      'Erro de conexão durante a sincronização:',
      erro?.message || erro
    );

    throw new Error(
      'Não foi possível conectar ao servidor para sincronizar os dados. Verifique o endereço da API e a conexão.'
    );
  }

  let texto;

  try {
    texto = await resposta.text();

  } catch {
    throw new Error(
      'O servidor respondeu, mas não foi possível ler os dados da sincronização.'
    );
  }

  let dados;

  try {
    dados = JSON.parse(texto);

  } catch {
    console.error(
      'Resposta inválida da sincronização:',
      resposta.status,
      texto.slice(0, 500)
    );

    throw new Error(
      `Resposta inválida do servidor. HTTP ${resposta.status}.`
    );
  }

  if (!resposta.ok || !dados?.sucesso) {
    const diagnostico = dados?.diagnostico
      ? `\nDiagnóstico: ${dados.diagnostico}`
      : '';

    throw new Error(
      `${dados?.mensagem || `Falha na sincronização. HTTP ${resposta.status}.`}${diagnostico}`
    );
  }

  return dados;
}

// ============================================================
// SINCRONIZAÇÃO PRINCIPAL
// ============================================================

export async function sincronizarDadosLocais() {

  // ----------------------------------------------------------
  // 1. VALIDAR CONTA ATIVA
  // ----------------------------------------------------------

  const usuarioId = await obterUsuarioIdAtivo();

  if (!usuarioId) {
    throw new Error(
      'Não foi possível identificar a conta ativa.'
    );
  }

  // ----------------------------------------------------------
  // 2. RECUPERAR TOKEN
  // ----------------------------------------------------------

  const token = await AsyncStorage.getItem(CHAVE_TOKEN);

  if (
    typeof token !== 'string' ||
    token.trim() === ''
  ) {
    throw new Error(
      'Token de acesso não encontrado. Entre novamente na conta.'
    );
  }

  // ----------------------------------------------------------
  // 3. LER SOMENTE DADOS DA CONTA ATIVA
  // ----------------------------------------------------------

  const [
    avaliacoesTexto,
    registrosTexto,
    minhaListaTexto,
    listas,
  ] = await Promise.all([
    AsyncStorage.getItem(CHAVE_AVALIACOES),
    AsyncStorage.getItem(CHAVE_REGISTROS),
    AsyncStorage.getItem(CHAVE_MINHA_LISTA),
    lerListas(),
  ]);

  // ----------------------------------------------------------
  // 4. PREPARAR AVALIAÇÕES LOCAIS
  // ----------------------------------------------------------

  const locais = unificarAvaliacoes(
    extrairAvaliacoes(
      lerJSONSeguro(avaliacoesTexto)
    ),

    extrairAvaliacoes(
      lerJSONSeguro(registrosTexto)
    )
  );

  // ----------------------------------------------------------
  // 5. PREPARAR LISTAS LOCAIS
  // ----------------------------------------------------------

  const listasLocais = Array.isArray(listas)
    ? [...listas]
    : [];

  const legado = extrairListaLegada(
    lerJSONSeguro(minhaListaTexto)
  );

  const listasParaEnviar = unificarListas(
    listasLocais,
    legado
  );

  // ----------------------------------------------------------
  // 6. ENVIAR AO SERVIDOR
  // ----------------------------------------------------------

  const dados = await enviarSincronizacao(
    token.trim(),
    {
      avaliacoes: locais,
      listas: listasParaEnviar,
    }
  );

  // ----------------------------------------------------------
  // 7. UNIFICAR AVALIAÇÕES DO SERVIDOR E DO APP
  // ----------------------------------------------------------

  const avaliacoesServidor = extrairAvaliacoes(
    dados.avaliacoes
  );

  const unificadas = unificarAvaliacoes(
    locais,
    avaliacoesServidor
  );

  // Grava nas duas chaves pessoais.
  // Ambas são isoladas pelo ID da conta no userStorage.

  await Promise.all([
    AsyncStorage.setItem(
      CHAVE_AVALIACOES,
      JSON.stringify(unificadas)
    ),

    AsyncStorage.setItem(
      CHAVE_REGISTROS,
      JSON.stringify(unificadas)
    ),
  ]);

  console.log(
    `CineTrack: ${unificadas.length} avaliações recuperadas para a conta ${usuarioId}.`
  );

  // ----------------------------------------------------------
  // 8. ATUALIZAR LISTAS DA CONTA
  // ----------------------------------------------------------

  const listasServidor = Array.isArray(dados.listas)
    ? dados.listas.map((lista, indice) => ({
        ...lista,

        id: String(
          lista.id ?? `lista-servidor-${indice}`
        ),

        nome:
          lista.nome ||
          lista.name ||
          `Minha lista ${indice + 1}`,

        itens: Array.isArray(lista.itens)
          ? lista.itens
          : [],
      }))
    : [];

  const listasAtualizadas = unificarListas(
    listasLocais,
    legado,
    listasServidor
  );

  await salvarListas(listasAtualizadas);

  // ----------------------------------------------------------
  // 9. RETORNAR RESULTADO
  // ----------------------------------------------------------

  return {
    ...dados,

    usuario_id: usuarioId,

    total_avaliacoes: unificadas.length,

    total_listas: listasAtualizadas.length,

    total_itens: listasAtualizadas.reduce(
      (total, lista) =>
        total + (lista.itens?.length || 0),
      0
    ),

    avaliacoes: unificadas,

    listas: listasAtualizadas,
  };
}