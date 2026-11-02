import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from './apiConfig';
import { lerListas, salvarListas } from './listasStorage';

const CHAVE_TOKEN = '@CineTrack:token';
const PREFIXO_LISTA_WEB = 'web-';

// ============================================================
// CONSTRUIR URL DA API
// ============================================================

function construirUrl(caminho) {
  if (!API_URL || typeof API_URL !== 'string') {
    throw new Error(
      'API_URL não está configurada corretamente no apiConfig.js.'
    );
  }

  const base = API_URL.trim().replace(/\/+$/, '');
  const endpoint = String(caminho).replace(/^\/+/, '');

  if (!/^https?:\/\//i.test(base)) {
    throw new Error(
      'O endereço da API precisa começar com http:// ou https://.'
    );
  }

  return `${base}/${endpoint}`;
}

// ============================================================
// REQUISIÇÃO AUTENTICADA
// ============================================================

async function requisicaoAutenticada(caminho, opcoes = {}) {
  const token = await AsyncStorage.getItem(CHAVE_TOKEN);

  if (!token || !token.trim()) {
    throw new Error(
      'Token não encontrado. Saia e entre novamente na conta.'
    );
  }

  const url = construirUrl(caminho);

  let resposta;

  try {
    resposta = await fetch(url, {
      ...opcoes,
      headers: {
        Accept: 'application/json',
        ...(opcoes.body
          ? { 'Content-Type': 'application/json' }
          : {}),
        Authorization: `Bearer ${token.trim()}`,
        'Cache-Control': 'no-cache',
        ...(opcoes.headers || {}),
      },
    });

  } catch (erro) {
    console.error(
      'Falha na conexão com a API CineTrack:',
      {
        url,
        mensagem: erro?.message,
        nome: erro?.name,
      }
    );

    throw new Error(
      `Não foi possível conectar ao servidor CineTrack.\n\nEndereço: ${url}\n\nVerifique sua conexão e o endereço configurado no apiConfig.js.`
    );
  }

  let texto;

  try {
    texto = await resposta.text();

  } catch (erro) {
    console.error(
      'Erro ao ler resposta da API:',
      erro
    );

    throw new Error(
      'O servidor respondeu, mas não foi possível ler os dados recebidos.'
    );
  }

  let dados;

  try {
    dados = JSON.parse(texto);

  } catch {
    console.error(
      'Resposta não JSON recebida da API:',
      {
        status: resposta.status,
        url,
        resposta: texto.slice(0, 500),
      }
    );

    throw new Error(
      `Resposta inválida da API. Código HTTP: ${resposta.status}.`
    );
  }

  if (!resposta.ok || !dados?.sucesso) {
    throw new Error(
      dados?.mensagem ||
      `Erro HTTP ${resposta.status}.`
    );
  }

  return dados;
}

// ============================================================
// BAIXAR LISTAS DO SITE
// ============================================================

export async function carregarListasDaWeb() {
  const dados = await requisicaoAutenticada(
    'minhas_listas.php',
    {
      method: 'GET',
    }
  );

  const listasWeb = (
    Array.isArray(dados.listas)
      ? dados.listas
      : []
  ).map((lista, indice) => ({
    id: `${PREFIXO_LISTA_WEB}${lista.id ?? indice}`,

    nome:
      lista.nome ||
      `Lista do site ${indice + 1}`,

    descricao:
      lista.descricao || '',

    criada_em:
      lista.criada_em ||
      lista.created_at ||
      new Date().toISOString(),

    origem: 'web',

    itens: (
      Array.isArray(lista.itens)
        ? lista.itens
        : []
    ).map(item => ({
      id:
        item.tmdb_id ??
        item.media_id ??
        item.id,

      tmdb_id:
        item.tmdb_id ?? null,

      media_id:
        item.media_id ?? null,

      tipo:
        item.tipo ||
        item.tmdb_type ||
        item.type ||
        'movie',

      title:
        item.title ||
        item.name ||
        'Obra sem título',

      poster_path:
        item.poster_path ||
        item.cover_image_url ||
        null,

      release_date:
        item.release_date ||
        item.year ||
        '',

      vote_average: Number(
        item.vote_average ||
        item.rating_average ||
        0
      ),

      adicionada_em:
        item.adicionada_em ||
        item.created_at ||
        new Date().toISOString(),

      status:
        item.status ||
        'quer_ver',
    })),
  }));

  // Recupera somente as listas da conta atualmente ativa.
  const atuais = await lerListas();

  // Preserva as listas locais e substitui as listas vindas da web.
  const locais = atuais.filter(lista =>
    !String(lista?.id ?? '').startsWith(PREFIXO_LISTA_WEB)
  );

  await salvarListas([
    ...locais,
    ...listasWeb,
  ]);

  return {
    sucesso: true,

    total_listas: listasWeb.length,

    total_itens: listasWeb.reduce(
      (total, lista) =>
        total + lista.itens.length,
      0
    ),

    listas: listasWeb,
  };
}

// ============================================================
// ENVIAR OBRA PARA O BANCO WEB
// ============================================================

export async function salvarItemListaNaWeb({
  lista,
  item,
}) {
  if (!lista || !item) {
    throw new Error(
      'Lista ou obra não informada.'
    );
  }

  const idLocal = String(lista.id ?? '');

  const idWeb = idLocal.startsWith(PREFIXO_LISTA_WEB)
    ? Number(
        idLocal.slice(PREFIXO_LISTA_WEB.length)
      )
    : null;

  return requisicaoAutenticada(
    'salvar_item_lista.php',
    {
      method: 'POST',

      body: JSON.stringify({
        list_id:
          Number.isInteger(idWeb) && idWeb > 0
            ? idWeb
            : null,

        list_name:
          lista.nome || 'Minha lista',

        tmdb_id: Number(
          item.tmdb_id ?? item.id
        ),

        tipo:
          item.tipo === 'tv'
            ? 'tv'
            : 'movie',

        title:
          item.title ||
          item.name ||
          'Obra sem título',

        year:
          String(item.release_date || '').slice(0, 4) ||
          null,

        poster:
          item.poster_path || null,

        overview:
          item.overview || '',

        status:
          item.status || 'quer_ver',
      }),
    }
  );
}