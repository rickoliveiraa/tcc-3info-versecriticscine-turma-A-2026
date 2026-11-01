
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from './apiConfig';
import { lerListas } from './listasStorage';

const CHAVE_TOKEN = '@CineTrack:token';
const CHAVE_AVALIACOES = '@CineTrack:avaliacoes';
const CHAVE_REGISTROS = '@CineTrack:registros';
const CHAVE_MINHA_LISTA = '@CineTrack:minhaLista';

function lerJSONSeguro(texto) {
  if (!texto) return null;
  try {
    return JSON.parse(texto);
  } catch {
    return null;
  }
}

function extrairAvaliacoes(dados) {
  if (!dados) return [];

  if (Array.isArray(dados)) {
    return dados.filter(x => x && typeof x === 'object');
  }

  if (typeof dados !== 'object') return [];

  for (const chave of [
    'avaliacoes',
    'registros',
    'items',
    'itens',
    'data',
    'results'
  ]) {
    if (Array.isArray(dados[chave])) {
      return extrairAvaliacoes(dados[chave]);
    }
  }

  return Object.entries(dados)
    .filter(([, valor]) =>
      valor && typeof valor === 'object' && !Array.isArray(valor)
    )
    .map(([chave, valor]) => {
      const match = String(chave).match(/^(movie|tv)[-_](\d+)$/i);

      return {
        ...valor,
        ...(match
          ? {
              tmdb_id: valor.tmdb_id ?? Number(match[2]),
              tipo: valor.tipo ?? match[1]
            }
          : {})
      };
    });
}

function unificarAvaliacoes(...grupos) {
  const mapa = new Map();

  grupos.flat().forEach(item => {
    if (!item || typeof item !== 'object') return;

    const midia = item.media || item.midia || {};

    const id =
      item.tmdb_id ??
      item.tmdbId ??
      item.media_id ??
      item.id ??
      midia.id;

    if (!id) return;

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
      'show'
    ].includes(tipoRaw) ? 'tv' : 'movie';

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
        anterior.poster_path ||
        null,
      stars:
        item.stars ??
        item.nota ??
        item.rating ??
        anterior.stars ??
        anterior.nota ??
        0,
      nota:
        item.nota ??
        item.stars ??
        item.rating ??
        anterior.nota ??
        anterior.stars ??
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
        null
    });
  });

  return [...mapa.values()];
}

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

  if (!Array.isArray(itens) || !itens.length) return [];

  return [{
    id: 'cinetrack-lista-importada',
    nome: 'Minha lista',
    descricao: 'Obras recuperadas de uma lista anterior.',
    criada_em: new Date().toISOString(),
    itens
  }];
}

export async function sincronizarDadosLocais() {
  const token = await AsyncStorage.getItem(CHAVE_TOKEN);

  if (!token) {
    throw new Error('Token de acesso não encontrado.');
  }

  const [
    avaliacoesTexto,
    registrosTexto,
    minhaListaTexto,
    listas
  ] = await Promise.all([
    AsyncStorage.getItem(CHAVE_AVALIACOES),
    AsyncStorage.getItem(CHAVE_REGISTROS),
    AsyncStorage.getItem(CHAVE_MINHA_LISTA),
    lerListas()
  ]);

  const avaliacoes = unificarAvaliacoes(
    extrairAvaliacoes(lerJSONSeguro(avaliacoesTexto)),
    extrairAvaliacoes(lerJSONSeguro(registrosTexto))
  );

  const listasNormalizadas = Array.isArray(listas)
    ? [...listas]
    : [];

  const listaLegada = extrairListaLegada(
    lerJSONSeguro(minhaListaTexto)
  );

  const idsExistentes = new Set(
    listasNormalizadas.map(l => String(l.id))
  );

  listaLegada.forEach(lista => {
    if (!idsExistentes.has(String(lista.id))) {
      listasNormalizadas.push(lista);
    }
  });

  const resposta = await fetch(
    `${API_URL}/sincronizar_dados.php`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        avaliacoes,
        listas: listasNormalizadas
      })
    }
  );

  const texto = await resposta.text();

  let dados;

  try {
    dados = JSON.parse(texto);
  } catch {
    throw new Error(
      'O servidor respondeu em formato inválido durante a sincronização.'
    );
  }

  if (!resposta.ok || !dados.sucesso) {
    throw new Error(
      dados.mensagem ||
      `Falha HTTP ${resposta.status} ao sincronizar.`
    );
  }

  return dados;
}
