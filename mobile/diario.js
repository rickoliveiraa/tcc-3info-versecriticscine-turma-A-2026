import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  AppState,
  Image,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

import {
  Ionicons,
  Feather,
  MaterialCommunityIcons,
} from '@expo/vector-icons';

import Buscar from './buscar';
import { lerListas } from './listasStorage';

// ============================================================
// CONFIGURAÇÕES
// ============================================================

const LOGO_CINETRACK = require('./assets/logo-cinetrack.png');

const TMDB_KEY = '5c1853c10d9752023da5ddce4ada3b77';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMAGE = 'https://image.tmdb.org/t/p/w500';

const CHAVE_AVALIACOES = '@CineTrack:avaliacoes';
const CHAVE_REGISTROS = '@CineTrack:registros';
const CHAVE_MINHA_LISTA = '@CineTrack:minhaLista';
const CHAVE_TOKEN = '@CineTrack:token';

const API_BASE_URL = String(
  process.env.EXPO_PUBLIC_API_URL || ''
).replace(/\/+$/, '');

const AVALIACOES_API_URL = API_BASE_URL
  ? `${API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`}/minhas_avaliacoes.php`
  : '';

const COLORS = {
  bg: '#050608',
  surface: '#0D0F13',
  elevated: '#12151B',
  border: 'rgba(255,255,255,0.08)',

  blue: '#3B82F6',
  blueLight: '#60A5FA',

  text: '#F5F7FA',
  secondary: '#9CA3AF',
  muted: '#687386',

  green: '#22C55E',
  yellow: '#FBBF24',
  pink: '#EC4899',
};

// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================

const nomeUsuario = usuario =>
  usuario?.username ||
  usuario?.nome ||
  usuario?.name ||
  usuario?.email?.split('@')?.[0] ||
  'Cinéfilo';

const iniciais = nome =>
  String(nome || 'C')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase() || '')
    .join('') || 'C';

const lerJSON = texto => {
  if (!texto) return null;

  try {
    return JSON.parse(texto);
  } catch (erro) {
    console.warn('Erro ao interpretar dados salvos:', erro);
    return null;
  }
};

const normalizarTipo = (tipo, chave = '', registro = {}) => {
  const valor = String(tipo || '').toLowerCase();

  if (
    ['tv', 'serie', 'série', 'series', 'show'].includes(valor)
  ) {
    return 'tv';
  }

  if (
    ['movie', 'filme', 'filmes', 'movies'].includes(valor)
  ) {
    return 'movie';
  }

  const correspondencia = String(chave).match(
    /(?:^|[.\_/])(movie|tv|serie|série|filme)[-_]/i
  );

  if (correspondencia) {
    return ['tv', 'serie', 'série'].includes(
      correspondencia[1].toLowerCase()
    )
      ? 'tv'
      : 'movie';
  }

  if (
    registro.first_air_date ||
    registro.original_name ||
    registro.name
  ) {
    return 'tv';
  }

  return 'movie';
};

const obterImagem = poster => {
  if (!poster) return null;

  const valor = String(poster);

  return valor.startsWith('http')
    ? valor
    : `${TMDB_IMAGE}${valor}`;
};

const converterData = valor => {
  if (!valor) return null;

  const data = new Date(valor);

  return Number.isNaN(data.getTime())
    ? null
    : data;
};

const formatarTempoDecorrido = valor => {
  const data = converterData(valor);

  if (!data) return '';

  const diferenca = Math.max(
    0,
    Date.now() - data.getTime()
  );

  const minutos = Math.floor(diferenca / 60000);
  const horas = Math.floor(minutos / 60);
  const dias = Math.floor(horas / 24);

  if (minutos < 1) return 'Agora';
  if (minutos < 60) return `Há ${minutos} min`;
  if (horas < 24) return `Há ${horas}h`;
  if (dias === 1) return 'Ontem';
  if (dias < 7) return `Há ${dias} dias`;

  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });
};

const obterGrupoData = valor => {
  const data = converterData(valor);

  if (!data) return 'Outras atividades';

  const hoje = new Date();

  const inicioHoje = new Date(
    hoje.getFullYear(),
    hoje.getMonth(),
    hoje.getDate()
  );

  const inicioData = new Date(
    data.getFullYear(),
    data.getMonth(),
    data.getDate()
  );

  const diferencaDias = Math.round(
    (inicioHoje.getTime() - inicioData.getTime()) / 86400000
  );

  if (diferencaDias === 0) return 'Hoje';
  if (diferencaDias === 1) return 'Ontem';

  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
  });
};

const obterEntradas = dados => {
  if (!dados) return [];

  if (Array.isArray(dados)) {
    return dados.map((item, index) => [
      String(item?.id || index),
      item,
    ]);
  }

  if (typeof dados !== 'object') return [];

  const possiveisChaves = [
    'avaliacoes',
    'registros',
    'ratings',
    'reviews',
    'items',
    'itens',
    'results',
    'data',
  ];

  for (const chave of possiveisChaves) {
    if (Array.isArray(dados[chave])) {
      return dados[chave].map((item, index) => [
        String(item?.id || index),
        item,
      ]);
    }

    if (
      dados[chave] &&
      typeof dados[chave] === 'object'
    ) {
      const resultado = obterEntradas(dados[chave]);

      if (resultado.length) return resultado;
    }
  }

  return Object.entries(dados).filter(
    ([, item]) =>
      item &&
      typeof item === 'object' &&
      !Array.isArray(item)
  );
};

// ============================================================
// EXTRAÇÃO MAIS ROBUSTA DE AVALIAÇÕES
// ============================================================

function extrairRegistrosRecursivos(dados, caminho = '') {
  if (!dados) return [];

  if (Array.isArray(dados)) {
    return dados.flatMap((item, index) => {
      const chave = `${caminho}.${index}`;

      if (!item || typeof item !== 'object') {
        return [];
      }

      return [[chave, item]];
    });
  }

  if (typeof dados !== 'object') {
    return [];
  }

  const colecoes = [
    'avaliacoes',
    'registros',
    'ratings',
    'reviews',
    'items',
    'itens',
    'results',
    'data',
  ];

  for (const chave of colecoes) {
    if (Array.isArray(dados[chave])) {
      return extrairRegistrosRecursivos(
        dados[chave],
        caminho ? `${caminho}.${chave}` : chave
      );
    }

    if (
      dados[chave] &&
      typeof dados[chave] === 'object'
    ) {
      const resultado = extrairRegistrosRecursivos(
        dados[chave],
        caminho ? `${caminho}.${chave}` : chave
      );

      if (resultado.length) return resultado;
    }
  }

  const entradas = Object.entries(dados).filter(
    ([, item]) =>
      item &&
      typeof item === 'object' &&
      !Array.isArray(item)
  );

  if (!entradas.length) return [];

  return entradas.map(([chave, item]) => [
    caminho ? `${caminho}.${chave}` : chave,
    item,
  ]);
}

// ============================================================
// NORMALIZAR REGISTRO
// ============================================================

function normalizarRegistro(registro, chave = '') {
  if (!registro || typeof registro !== 'object') {
    return null;
  }

  const midia =
    registro.media ||
    registro.midia ||
    registro.filme ||
    registro.serie ||
    registro.obra ||
    {};

  const combinado = {
    ...registro,
    ...midia,
  };

  const correspondencia = String(chave).match(
    /(?:^|[.\_/])(movie|tv|serie|série|filme)[-_](\d+)/i
  );

  const id =
    combinado.tmdb_id ??
    combinado.tmdbId ??
    combinado.media_id ??
    combinado.mediaId ??
    combinado.filme_id ??
    combinado.id ??
    correspondencia?.[2];

  if (
    id === undefined ||
    id === null ||
    id === ''
  ) {
    return null;
  }

  const tipo = normalizarTipo(
    combinado.tipo ||
    combinado.tipo_midia ||
    combinado.media_type ||
    combinado.mediaType ||
    combinado.type,
    chave,
    combinado
  );

  const notaOriginal =
    combinado.nota ??
    combinado.stars ??
    combinado.rating ??
    combinado.avaliacao ??
    null;

  const nota =
    notaOriginal !== null &&
    notaOriginal !== undefined &&
    Number.isFinite(Number(notaOriginal))
      ? Number(notaOriginal)
      : null;

  const comentario =
    combinado.review ||
    combinado.comentario ||
    combinado.comment ||
    combinado.resenha ||
    '';

  const data =
    combinado.watch_date ||
    combinado.watched_at ||
    combinado.assistido_em ||
    combinado.data_assistido ||
    combinado.data ||
    combinado.atualizado_em ||
    combinado.created_at ||
    combinado.updated_at ||
    null;

  const titulo =
    combinado.title ||
    combinado.name ||
    combinado.titulo ||
    combinado.media_title ||
    null;

  const poster =
    combinado.poster_path ||
    combinado.poster_url ||
    combinado.poster ||
    combinado.cover_image_url ||
    combinado.coverImageUrl ||
    null;

  return {
    ...combinado,

    id: String(id),
    tmdb_id: String(id),
    tipo,

    title: titulo,
    titulo,

    poster_path: poster,
    poster,

    nota,
    rating: nota,

    review: comentario,
    comentario,

    data,

    atualizado_em:
      combinado.atualizado_em ||
      combinado.created_at ||
      data,

    release_date:
      combinado.release_date ||
      combinado.first_air_date ||
      combinado.year ||
      combinado.ano ||
      '',

    // Só é uma avaliação quando existe nota ou comentário.
    tem_avaliacao:
      (nota !== null && nota > 0) ||
      Boolean(String(comentario).trim()),
  };
}

// ============================================================
// BUSCAR AVALIAÇÕES DO SERVIDOR PHP
// ============================================================

async function buscarAvaliacoesDoServidor() {
  try {
    if (!AVALIACOES_API_URL) {
      console.warn(
        'EXPO_PUBLIC_API_URL não configurada. Não foi possível consultar as avaliações do servidor.'
      );
      return [];
    }

    const token = await AsyncStorage.getItem(CHAVE_TOKEN);

    if (!token) {
      console.warn(
        'Token de autenticação não encontrado no AsyncStorage.'
      );
      return [];
    }

    const resposta = await fetch(AVALIACOES_API_URL, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!resposta.ok) {
      console.warn(
        'Erro ao buscar avaliações do servidor:',
        resposta.status
      );
      return [];
    }

    const dados = await resposta.json();

    // O endpoint pode retornar o array diretamente ou dentro de
    // avaliacaoes/data/results. Também aceitamos os formatos já
    // tratados pelo extrator utilizado nas fontes locais.
    const entradas = extrairRegistrosRecursivos(
      dados,
      'servidor'
    );

    const lista = Array.isArray(dados)
      ? dados
      : entradas.map(([, item]) => item);

    const avaliacoesNormalizadas = lista
      .map((item, indice) => {
        if (!item || typeof item !== 'object') {
          return null;
        }

        const midia =
          item.media ||
          item.midia ||
          item.filme ||
          item.serie ||
          item.obra ||
          {};

        const registro = normalizarRegistro(
          {
            ...item,

            // Identificador da obra no TMDB, não o ID interno
            // da linha de avaliação no banco SQLite.
            tmdb_id:
              item.tmdb_id ??
              item.tmdbId ??
              midia.tmdb_id ??
              midia.tmdbId ??
              midia.id_tmdb ??
              null,

            tipo:
              item.tipo_midia ||
              item.tipo ||
              item.media_type ||
              item.mediaType ||
              item.type ||
              midia.tipo ||
              midia.media_type ||
              midia.type ||
              null,

            stars:
              item.stars ??
              item.nota ??
              item.rating ??
              item.avaliacao ??
              null,

            title:
              item.title ||
              item.media_title ||
              item.titulo ||
              midia.title ||
              midia.name ||
              midia.titulo ||
              null,

            poster_path:
              item.poster_path ||
              item.cover_image_url ||
              item.coverImageUrl ||
              item.poster_url ||
              item.poster ||
              midia.poster_path ||
              midia.cover_image_url ||
              midia.coverImageUrl ||
              null,

            review:
              item.review ||
              item.comment ||
              item.comentario ||
              item.resenha ||
              '',

            data:
              item.watch_date ||
              item.watched_at ||
              item.assistido_em ||
              item.data_assistido ||
              item.created_at ||
              item.updated_at ||
              item.data ||
              null,
          },
          `servidor-${item.tipo_midia || item.tipo || item.media_type || midia.media_type || 'movie'}-${item.tmdb_id || midia.tmdb_id || indice}`
        );

        return registro;
      })
      .filter(Boolean);

    console.log(
      `CineTrack: ${avaliacoesNormalizadas.length} avaliações recebidas do servidor.`
    );

    return avaliacoesNormalizadas;
  } catch (erro) {
    console.warn(
      'Erro ao sincronizar avaliações com o servidor:',
      erro
    );

    return [];
  }
}

// ============================================================
// UNIFICAR AVALIAÇÕES SEM DUPLICAR
// ============================================================

function unificarAvaliacoes(lista) {
  const mapa = new Map();

  lista.forEach(item => {
    if (!item?.id || !item?.tipo) return;

    const chave = `${item.tipo}-${item.id}`;
    const anterior = mapa.get(chave);

    if (!anterior) {
      mapa.set(chave, item);
      return;
    }

    mapa.set(chave, {
      ...anterior,
      ...item,

      title: item.title || anterior.title,
      titulo: item.title || anterior.title,

      poster_path:
        item.poster_path ||
        anterior.poster_path,

      nota:
        item.nota !== null &&
        item.nota !== undefined
          ? item.nota
          : anterior.nota,

      review:
        item.review ||
        anterior.review,

      data:
        item.data ||
        anterior.data,

      tem_avaliacao:
        item.tem_avaliacao ||
        anterior.tem_avaliacao,
    });
  });

  return Array.from(mapa.values());
}

// ============================================================
// NORMALIZAR ITEM DE LISTA
// ============================================================

function normalizarItemDeLista(obra, lista, indice = 0) {
  if (!obra || typeof obra !== 'object') {
    return null;
  }

  const registro = normalizarRegistro(
    {
      ...obra,

      data:
        obra.adicionada_em ||
        obra.added_at ||
        obra.created_at ||
        lista?.criada_em ||
        lista?.created_at ||
        null,
    },
    `${obra.tipo || obra.media_type || 'movie'}-${obra.id || indice}`
  );

  if (!registro) return null;

  return {
    ...registro,

    atividade: 'item_lista',

    data_atividade:
      obra.adicionada_em ||
      obra.added_at ||
      obra.created_at ||
      lista?.criada_em ||
      lista?.created_at ||
      null,

    nome_lista:
      lista?.nome ||
      lista?.name ||
      lista?.title ||
      'Minha lista',

    lista_id: lista?.id || null,

    id_atividade:
      `lista-${lista?.id || 'sem-id'}-${registro.tipo}-${registro.id}-${indice}`,
  };
}

// ============================================================
// EXTRAIR FILMES E SÉRIES DE QUALQUER FORMATO DE LISTA
// ============================================================

const CHAVES_COLECAO = [
  'listas',
  'lists',
  'lista',
  'list',
  'assistidos',
  'watched',
  'concluidos',
  'concluídos',
  'queroAssistir',
  'quero_assistir',
  'watchlist',
  'watchlist_items',
  'favoritos',
  'favorites',
  'emAndamento',
  'em_andamento',
  'watching',
  'itens',
  'items',
  'filmes',
  'series',
  'obras',
  'results',
  'data',
];

const ROTULOS_COLECAO = {
  assistidos: 'Assistidos',
  watched: 'Assistidos',
  concluidos: 'Assistidos',
  'concluídos': 'Assistidos',
  queroAssistir: 'Quero assistir',
  quero_assistir: 'Quero assistir',
  watchlist: 'Quero assistir',
  watchlist_items: 'Quero assistir',
  favoritos: 'Favoritos',
  favorites: 'Favoritos',
  emAndamento: 'Em andamento',
  em_andamento: 'Em andamento',
  watching: 'Em andamento',
};

function extrairItensColecao(dados, nomePadrao = 'Minha lista') {
  const resultado = [];

  const percorrer = (
    valor,
    nomeLista = nomePadrao,
    chave = '',
    profundidade = 0
  ) => {
    if (!valor || profundidade > 8) return;

    if (Array.isArray(valor)) {
      valor.forEach((item, indice) => {
        percorrer(
          item,
          nomeLista,
          `${chave}.${indice}`,
          profundidade + 1
        );
      });
      return;
    }

    if (typeof valor !== 'object') return;

    // Quando o objeto é uma lista ou um agrupador, percorremos
    // seus itens em vez de contar o próprio objeto como produção.
    const chavesEncontradas = CHAVES_COLECAO.filter(chaveLista => {
      const filho = valor[chaveLista];
      return (
        Array.isArray(filho) ||
        (filho && typeof filho === 'object')
      );
    });

    if (chavesEncontradas.length > 0) {
      chavesEncontradas.forEach(chaveLista => {
        percorrer(
          valor[chaveLista],
          ROTULOS_COLECAO[chaveLista] ||
            valor.nome ||
            valor.name ||
            valor.title ||
            nomeLista,
          `${chave}.${chaveLista}`,
          profundidade + 1
        );
      });

      // Também considera campos personalizados que armazenem
      // coleções com nomes diferentes dos formatos conhecidos.
      Object.entries(valor).forEach(([chaveFilho, filho]) => {
        if (CHAVES_COLECAO.includes(chaveFilho)) return;
        if (!filho || typeof filho !== 'object') return;

        percorrer(
          filho,
          valor.nome || valor.name || valor.title || nomeLista,
          `${chave}.${chaveFilho}`,
          profundidade + 1
        );
      });

      return;
    }

    const possuiDadosDeMidia = Boolean(
      valor.tmdb_id ||
      valor.tmdbId ||
      valor.media_id ||
      valor.mediaId ||
      valor.poster_path ||
      valor.poster_url ||
      valor.media_type ||
      valor.mediaType ||
      valor.tipo_midia ||
      valor.media ||
      valor.midia ||
      valor.filme ||
      valor.serie ||
      ((valor.title || valor.name || valor.titulo) && valor.id)
    );

    if (possuiDadosDeMidia) {
      const registro = normalizarRegistro(valor, chave);

      if (registro) {
        resultado.push({
          ...registro,
          nome_lista:
            valor.nome_lista ||
            valor.list_name ||
            nomeLista,
        });
        return;
      }
    }

    // Formato antigo de objeto indexado pelo ID da produção.
    Object.entries(valor).forEach(([chaveFilho, filho]) => {
      if (!filho || typeof filho !== 'object') return;

      percorrer(
        filho,
        nomeLista,
        `${chave}.${chaveFilho}`,
        profundidade + 1
      );
    });
  };

  percorrer(dados, nomePadrao, 'colecao', 0);

  return resultado;
}

function obterChaveUnicaDaObra(obra) {
  const registro = normalizarRegistro(obra);
  if (!registro?.id) return null;
  return `${registro.tipo}-${String(registro.id)}`;
}

function extrairListasPersonalizadas(resultado) {
  if (Array.isArray(resultado)) return resultado;

  if (!resultado || typeof resultado !== 'object') {
    return [];
  }

  if (Array.isArray(resultado.listas)) {
    return resultado.listas;
  }

  if (Array.isArray(resultado.lists)) {
    return resultado.lists;
  }

  const possuiItens = objeto =>
    objeto &&
    typeof objeto === 'object' &&
    [
      'itens',
      'items',
      'obras',
      'filmes',
      'series',
    ].some(chave => Array.isArray(objeto[chave]));

  if (possuiItens(resultado)) {
    return [resultado];
  }

  return Object.values(resultado).filter(possuiItens);
}

function unificarItensColecao(...fontes) {
  const mapa = new Map();

  fontes.flat().forEach(item => {
    const registro = normalizarRegistro(item);
    if (!registro?.id) return;

    const chave = `${registro.tipo}-${String(registro.id)}`;
    const anterior = mapa.get(chave);

    if (!anterior) {
      mapa.set(chave, registro);
      return;
    }

    mapa.set(chave, {
      ...anterior,
      ...registro,
      title: registro.title || anterior.title,
      poster_path: registro.poster_path || anterior.poster_path,
      data: registro.data || anterior.data,
      nome_lista: registro.nome_lista || anterior.nome_lista,
    });
  });

  return Array.from(mapa.values());
}

// ============================================================
// NORMALIZAR ATIVIDADES DOS AMIGOS
// ============================================================

const obterTipoAtividade = item => {
  const valor = String(
    item?.atividade ||
    item?.tipo_atividade ||
    item?.event_type ||
    item?.activity_type ||
    item?.action ||
    item?.tipo ||
    ''
  ).toLowerCase();

  if (
    valor.includes('progresso') ||
    valor.includes('episodio') ||
    valor.includes('episódio') ||
    valor.includes('series_progress')
  ) {
    return 'progresso';
  }

  if (
    valor.includes('lista') ||
    valor.includes('collection')
  ) {
    return 'lista';
  }

  if (
    valor.includes('curtiu') ||
    valor.includes('like')
  ) {
    return 'curtida';
  }

  if (
    valor.includes('seguiu') ||
    valor.includes('follow')
  ) {
    return 'seguindo';
  }

  return 'avaliacao';
};

const normalizarAtividadeAmigo = item => {
  if (!item || typeof item !== 'object') return null;

  const midia =
    item.midia ||
    item.media ||
    item.obra ||
    item.filme ||
    item.serie ||
    item;

  return {
    ...item,

    atividade: obterTipoAtividade(item),

    usuario_nome:
      item.usuario_nome ||
      item.nome_usuario ||
      item.nome ||
      item.username ||
      item.usuario?.nome ||
      item.user?.name ||
      'Usuário',

    usuario_avatar:
      item.usuario_avatar ||
      item.avatar ||
      item.foto_perfil ||
      item.usuario?.foto_perfil ||
      item.user?.avatar ||
      null,

    title:
      midia.title ||
      midia.name ||
      midia.titulo ||
      'Produção sem título',

    poster_path:
      midia.poster_path ||
      item.poster_path ||
      item.poster ||
      null,

    tipo: normalizarTipo(
      item.tipo_midia ||
      midia.tipo ||
      midia.media_type ||
      item.tipo
    ),

    nota: Number(
      item.nota ??
      item.stars ??
      item.rating ??
      0
    ),

    comentario:
      item.comment ||
      item.comentario ||
      item.review ||
      '',

    data_atividade:
      item.watched_at ||
      item.created_at ||
      item.data ||
      item.updated_at ||
      null,
  };
};

// ============================================================
// CONSULTAR TMDB
// ============================================================

async function buscarDadosTMDB(tipo, id) {
  try {
    const resposta = await fetch(
      `${TMDB_BASE}/${tipo}/${id}?api_key=${TMDB_KEY}&language=pt-BR`
    );

    if (!resposta.ok) return null;

    const dados = await resposta.json();

    return {
      title: dados.title || dados.name || null,

      poster_path: dados.poster_path || null,

      release_date:
        dados.release_date ||
        dados.first_air_date ||
        null,

      vote_average: dados.vote_average || 0,
    };
  } catch (erro) {
    console.warn('Erro ao consultar TMDB:', erro);
    return null;
  }
}

// ============================================================
// AVATAR
// ============================================================

function Avatar({ nome, imagem, tamanho = 42 }) {
  if (imagem) {
    return (
      <Image
        source={{ uri: imagem }}
        style={[
          styles.avatar,
          {
            width: tamanho,
            height: tamanho,
            borderRadius: tamanho / 2,
          },
        ]}
      />
    );
  }

  return (
    <LinearGradient
      colors={['#236FFF', '#5636B8']}
      style={[
        styles.avatar,
        {
          width: tamanho,
          height: tamanho,
          borderRadius: tamanho / 2,
        },
      ]}
    >
      <Text style={styles.avatarTexto}>
        {iniciais(nome)}
      </Text>
    </LinearGradient>
  );
}

// ============================================================
// ESTRELAS
// ============================================================

function Estrelas({ nota = 0, tamanho = 14 }) {
  return (
    <View style={styles.estrelas}>
      {[1, 2, 3, 4, 5].map(numero => (
        <Ionicons
          key={numero}
          name={Number(nota) >= numero ? 'star' : 'star-outline'}
          size={tamanho}
          color={
            Number(nota) >= numero
              ? COLORS.yellow
              : COLORS.muted
          }
          style={{ marginRight: 2 }}
        />
      ))}
    </View>
  );
}

// ============================================================
// CABEÇALHO DE ATIVIDADE
// ============================================================

function CabecalhoAtividade({
  nome,
  avatar,
  acao,
  tempo,
  pessoal,
}) {
  return (
    <View style={styles.atividadeCabecalho}>
      <Avatar
        nome={nome}
        imagem={avatar}
        tamanho={42}
      />

      <View style={styles.atividadeAutor}>
        <Text style={styles.atividadeNome}>
          {pessoal ? 'Você' : nome}
        </Text>

        <Text style={styles.atividadeAcao}>
          {acao}
        </Text>
      </View>

      <Text style={styles.atividadeTempo}>
        {tempo}
      </Text>
    </View>
  );
}

// ============================================================
// CARD DE AVALIAÇÃO
// ============================================================

function CardAvaliacao({
  item,
  pessoal,
  onAbrirDetalhes,
}) {
  const titulo =
    item.title ||
    item.name ||
    item.titulo ||
    'Produção sem título';

  const tipo = normalizarTipo(item.tipo);
  const nota = Number(item.nota || item.rating || 0);

  const poster = obterImagem(
    item.poster_path ||
    item.poster ||
    item.poster_url
  );

  const comentario =
    item.review ||
    item.comentario ||
    item.comment ||
    '';

  const musica =
    item.musica ||
    item.trilha ||
    item.soundtrack ||
    null;

  const artista =
    item.artista ||
    item.artist ||
    item.trilha_artista ||
    null;

  const abrir = () => {
    const id =
      item.tmdb_id ||
      item.media_id ||
      item.id;

    if (!id || !onAbrirDetalhes) return;

    onAbrirDetalhes({
      ...item,
      id,
      tmdb_id: id,
      tipo,
      title: titulo,
      name: titulo,
      media: item,
    });
  };

  return (
    <View style={styles.atividadeCard}>
      <CabecalhoAtividade
        nome={item.usuario_nome || 'Você'}
        avatar={item.usuario_avatar}
        pessoal={pessoal}
        acao="avaliou uma produção"
        tempo={formatarTempoDecorrido(
          item.data_atividade || item.data
        )}
      />

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={abrir}
        style={styles.midiaLinha}
      >
        {poster ? (
          <Image
            source={{ uri: poster }}
            style={styles.poster}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.poster, styles.posterPlaceholder]}>
            <Ionicons
              name={tipo === 'tv' ? 'tv-outline' : 'film-outline'}
              size={26}
              color={COLORS.muted}
            />
          </View>
        )}

        <View style={styles.midiaInformacoes}>
          <View style={styles.tipoTag}>
            <Ionicons
              name={tipo === 'tv' ? 'tv-outline' : 'film-outline'}
              size={12}
              color={COLORS.blueLight}
            />

            <Text style={styles.tipoTagTexto}>
              {tipo === 'tv' ? 'SÉRIE' : 'FILME'}
            </Text>
          </View>

          <Text
            style={styles.midiaTitulo}
            numberOfLines={2}
          >
            {titulo}
          </Text>

          {!!(item.release_date || item.first_air_date) && (
            <Text style={styles.midiaAno}>
              {String(
                item.release_date || item.first_air_date
              ).slice(0, 4)}
            </Text>
          )}

          {nota > 0 && (
            <View style={styles.notaLinha}>
              <Estrelas nota={nota} />

              <Text style={styles.notaNumero}>
                {nota.toLocaleString('pt-BR')}
              </Text>
            </View>
          )}
        </View>

        <Feather
          name="chevron-right"
          size={18}
          color={COLORS.muted}
        />
      </TouchableOpacity>

      {!!comentario && (
        <View style={styles.comentarioContainer}>
          <Feather
            name="message-square"
            size={14}
            color={COLORS.blueLight}
          />

          <Text style={styles.comentarioTexto}>
            {comentario}
          </Text>
        </View>
      )}

      {!!musica && (
        <View style={styles.trilhaContainer}>
          <View style={styles.trilhaIcone}>
            <Ionicons
              name="musical-notes"
              size={17}
              color={COLORS.green}
            />
          </View>

          <View style={styles.trilhaInformacoes}>
            <Text style={styles.trilhaLabel}>
              TRILHA SONORA
            </Text>

            <Text style={styles.trilhaTitulo}>
              {musica}
            </Text>

            {!!artista && (
              <Text style={styles.trilhaArtista}>
                {artista}
              </Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

// ============================================================
// CARD DE OBRA ADICIONADA À LISTA
// ============================================================

function CardItemLista({
  item,
  pessoal,
  onAbrirDetalhes,
}) {
  const tipo = normalizarTipo(item.tipo);

  const titulo =
    item.title ||
    item.name ||
    item.titulo ||
    'Produção sem título';

  const poster = obterImagem(
    item.poster_path ||
    item.poster ||
    item.poster_url
  );

  const ano =
    item.release_date ||
    item.first_air_date ||
    item.year ||
    item.ano ||
    '';

  const nomeLista =
    item.nome_lista ||
    'Minha lista';

  const abrir = () => {
    const id =
      item.tmdb_id ||
      item.media_id ||
      item.id;

    if (!id || !onAbrirDetalhes) return;

    onAbrirDetalhes({
      ...item,
      id,
      tmdb_id: id,
      tipo,
      title: titulo,
      name: titulo,
      media: item,
    });
  };

  return (
    <View style={styles.atividadeCard}>
      <CabecalhoAtividade
        nome="Você"
        pessoal={pessoal}
        acao={
          tipo === 'tv'
            ? 'adicionou uma série à lista'
            : 'adicionou um filme à lista'
        }
        tempo={formatarTempoDecorrido(item.data_atividade)}
      />

      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.midiaLinha}
        onPress={abrir}
      >
        {poster ? (
          <Image
            source={{ uri: poster }}
            style={styles.poster}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.poster, styles.posterPlaceholder]}>
            <Ionicons
              name={tipo === 'tv' ? 'tv-outline' : 'film-outline'}
              size={27}
              color={COLORS.muted}
            />
          </View>
        )}

        <View style={styles.midiaInformacoes}>
          <View style={styles.tipoTag}>
            <Ionicons
              name={tipo === 'tv' ? 'tv-outline' : 'film-outline'}
              size={12}
              color={COLORS.blueLight}
            />

            <Text style={styles.tipoTagTexto}>
              {tipo === 'tv' ? 'SÉRIE' : 'FILME'}
            </Text>
          </View>

          <Text
            style={styles.midiaTitulo}
            numberOfLines={2}
          >
            {titulo}
          </Text>

          {!!ano && (
            <Text style={styles.midiaAno}>
              {String(ano).slice(0, 4)}
            </Text>
          )}

          <View style={styles.listaDestino}>
            <Feather
              name="bookmark"
              size={12}
              color={COLORS.green}
            />

            <Text
              style={styles.listaDestinoTexto}
              numberOfLines={1}
            >
              {nomeLista}
            </Text>
          </View>
        </View>

        <Feather
          name="chevron-right"
          size={18}
          color={COLORS.muted}
        />
      </TouchableOpacity>
    </View>
  );
}

// ============================================================
// CARD DE PROGRESSO
// ============================================================

function CardProgresso({ item, pessoal }) {
  const temporada =
    item?.temporada ||
    item?.season_number ||
    item?.season ||
    null;

  const episodio =
    item?.episodio ||
    item?.episode_number ||
    item?.episode ||
    null;

  const percentual = Math.min(
    100,
    Math.max(
      0,
      Number(
        item?.porcentagem ??
        item?.percentual ??
        item?.progress ??
        item?.progresso ??
        0
      )
    )
  );

  return (
    <View style={styles.atividadeCard}>
      <CabecalhoAtividade
        nome={item.usuario_nome || 'Você'}
        avatar={item.usuario_avatar}
        pessoal={pessoal}
        acao="atualizou o progresso de uma série"
        tempo={formatarTempoDecorrido(item.data_atividade)}
      />

      <View style={styles.progressoConteudo}>
        <View style={styles.progressoIcone}>
          <Ionicons
            name="play"
            size={23}
            color={COLORS.blueLight}
          />
        </View>

        <View style={styles.progressoInformacoes}>
          <Text style={styles.progressoTitulo}>
            {item.title || item.name || 'Série'}
          </Text>

          <Text style={styles.progressoEpisodio}>
            {temporada
              ? `T${String(temporada).padStart(2, '0')}`
              : 'Temporada'}
            {episodio
              ? ` · E${String(episodio).padStart(2, '0')}`
              : ''}
            {item.episode_name
              ? ` — ${item.episode_name}`
              : ''}
          </Text>
        </View>

        <Text style={styles.progressoPercentual}>
          {Math.round(percentual)}%
        </Text>
      </View>

      <View style={styles.progressoBarraFundo}>
        <View
          style={[
            styles.progressoBarraPreenchida,
            { width: `${percentual}%` },
          ]}
        />
      </View>
    </View>
  );
}

// ============================================================
// CARD DE LISTA CRIADA
// ============================================================

function CardLista({ item, pessoal }) {
  const nomeLista =
    item?.nome ||
    item?.titulo ||
    item?.name ||
    item?.nome_lista ||
    'Lista sem título';

  const descricao =
    item?.descricao ||
    item?.description ||
    '';

  const quantidade =
    item?.itens?.length ??
    item?.items?.length ??
    0;

  return (
    <View style={styles.atividadeCard}>
      <CabecalhoAtividade
        nome="Você"
        pessoal={pessoal}
        acao="criou uma lista"
        tempo={formatarTempoDecorrido(item.data_atividade)}
      />

      <View style={styles.listaConteudo}>
        <LinearGradient
          colors={['#123A2A', '#10271F']}
          style={styles.listaIcone}
        >
          <Ionicons
            name="albums-outline"
            size={27}
            color={COLORS.green}
          />
        </LinearGradient>

        <View style={styles.listaInformacoes}>
          <Text style={styles.listaTitulo}>
            {nomeLista}
          </Text>

          {!!descricao && (
            <Text style={styles.listaDescricao}>
              {descricao}
            </Text>
          )}

          <Text style={styles.listaQuantidade}>
            {quantidade}{' '}
            {quantidade === 1 ? 'produção' : 'produções'}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ============================================================
// CARD DE INTERAÇÃO
// ============================================================

function CardInteracao({ item, pessoal }) {
  const curtida = item.atividade === 'curtida';

  return (
    <View style={styles.interacaoCard}>
      <Avatar
        nome={item.usuario_nome}
        imagem={item.usuario_avatar}
        tamanho={40}
      />

      <View style={styles.interacaoTextoContainer}>
        <Text style={styles.interacaoNome}>
          {pessoal ? 'Você' : item.usuario_nome}
        </Text>

        <Text style={styles.interacaoDescricao}>
          {curtida
            ? 'curtiu uma avaliação'
            : 'começou a seguir um perfil'}
        </Text>

        <Text style={styles.interacaoTempo}>
          {formatarTempoDecorrido(item.data_atividade)}
        </Text>
      </View>

      <View style={styles.interacaoIcone}>
        <Ionicons
          name={curtida ? 'heart' : 'person-add'}
          size={18}
          color={curtida ? '#F87171' : COLORS.blueLight}
        />
      </View>
    </View>
  );
}

// ============================================================
// ITEM DO FEED
// ============================================================

function ItemAtividade({
  item,
  pessoal,
  onAbrirDetalhes,
}) {
  if (item.atividade === 'item_lista') {
    return (
      <CardItemLista
        item={item}
        pessoal={pessoal}
        onAbrirDetalhes={onAbrirDetalhes}
      />
    );
  }

  if (item.atividade === 'progresso') {
    return (
      <CardProgresso
        item={item}
        pessoal={pessoal}
      />
    );
  }

  if (item.atividade === 'lista') {
    return (
      <CardLista
        item={item}
        pessoal={pessoal}
      />
    );
  }

  if (
    item.atividade === 'curtida' ||
    item.atividade === 'seguindo'
  ) {
    return (
      <CardInteracao
        item={item}
        pessoal={pessoal}
      />
    );
  }

  return (
    <CardAvaliacao
      item={item}
      pessoal={pessoal}
      onAbrirDetalhes={onAbrirDetalhes}
    />
  );
}

// ============================================================
// ESTADO VAZIO
// ============================================================

function EstadoVazio({ tipo, onAdicionar }) {
  const amigos = tipo === 'amigos';

  return (
    <View style={styles.estadoVazio}>
      <View style={styles.estadoVazioIcone}>
        <Ionicons
          name={amigos ? 'people-outline' : 'film-outline'}
          size={35}
          color={COLORS.blueLight}
        />
      </View>

      <Text style={styles.estadoVazioTitulo}>
        {amigos
          ? 'Seu feed está tranquilo'
          : 'Seu diário começa aqui'}
      </Text>

      <Text style={styles.estadoVazioDescricao}>
        {amigos
          ? 'As atividades dos seus amigos aparecerão aqui quando estiverem disponíveis.'
          : 'Suas avaliações, filmes e séries adicionados às listas aparecerão aqui.'}
      </Text>

      {!amigos && (
        <TouchableOpacity
          style={styles.emptyButton}
          activeOpacity={0.85}
          onPress={onAdicionar}
        >
          <Feather
            name="plus"
            size={16}
            color="#FFFFFF"
          />

          <Text style={styles.emptyButtonText}>
            Adicionar produção
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function Diario({
  usuario = null,
  atividadesAmigos = [],

  onAbrirHome,
  onAbrirBusca,
  onVoltar,
  onAdicionar,
  onAbrirDetalhes,
  onAbrirDiario,
  onAbrirPerfil,
  onLogout,
}) {
  const [abaAtiva, setAbaAtiva] = useState('Amigos');

  const [telaInterna, setTelaInterna] = useState('Diário');
  const [abaNavegacao, setAbaNavegacao] = useState('Diário');

  const [avaliacoes, setAvaliacoes] = useState([]);
  const [registros, setRegistros] = useState([]);
  const [listas, setListas] = useState([]);
  const [itensMinhaLista, setItensMinhaLista] = useState([]);

  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

  const cacheTMDB = useRef(new Map());
  const carregamentoRef = useRef(false);

  const nome = nomeUsuario(usuario);

  const avatarUrl =
    usuario?.avatar_url ||
    usuario?.avatar ||
    usuario?.foto ||
    usuario?.foto_perfil ||
    null;

  const colecaoSnapshotRef = useRef('');

  // Carrega somente as listas e os itens salvos. Essa rotina é
  // independente da API de avaliações para o contador não ficar
  // esperando uma resposta do servidor.
  const carregarColecao = useCallback(async () => {
    try {
      const [valorMinhaLista, resultadoListas] = await Promise.all([
        AsyncStorage.getItem(CHAVE_MINHA_LISTA),
        Promise.resolve()
          .then(() => lerListas())
          .catch(erro => {
            console.warn('Erro ao ler listas personalizadas:', erro);
            return [];
          }),
      ]);

      const dadosMinhaLista = lerJSON(valorMinhaLista);
      const listasSalvas = extrairListasPersonalizadas(resultadoListas);

      const itensMinhaListaSalvos = extrairItensColecao(
        dadosMinhaLista,
        'Minha lista'
      );

      const itensDasListasPersonalizadas = extrairItensColecao(
        resultadoListas,
        'Listas personalizadas'
      );

      const itensUnicos = unificarItensColecao(
        itensMinhaListaSalvos,
        itensDasListasPersonalizadas
      );

      const assinatura = JSON.stringify({
        listas: listasSalvas,
        itens: itensUnicos,
      });

      // Evita renderizações repetidas quando nada mudou no armazenamento.
      if (assinatura !== colecaoSnapshotRef.current) {
        colecaoSnapshotRef.current = assinatura;
        setListas(listasSalvas);
        setItensMinhaLista(itensUnicos);
      }
    } catch (erro) {
      console.warn('Erro ao atualizar a coleção do Diário:', erro);
    }
  }, []);

  // ==========================================================
  // CARREGAR DADOS DO DISPOSITIVO E DO SERVIDOR
  // ==========================================================

  const carregarDados = useCallback(async (silencioso = false) => {
    if (carregamentoRef.current) return;

    carregamentoRef.current = true;

    if (silencioso) {
      setAtualizando(true);
    } else {
      setCarregando(true);
    }

    try {
      // Leituras locais e consulta ao servidor acontecem em paralelo.
      const [valores, avaliacoesServidor] = await Promise.all([
        AsyncStorage.multiGet([
          CHAVE_AVALIACOES,
          CHAVE_REGISTROS,
        ]),
        buscarAvaliacoesDoServidor(),
      ]);

      const dadosAvaliacoes = lerJSON(valores?.[0]?.[1]);
      const dadosRegistros = lerJSON(valores?.[1]?.[1]);
      // ------------------------------------------------------
      // 1. LER TODAS AS AVALIAÇÕES E REGISTROS LOCAIS
      // ------------------------------------------------------

      const entradasAvaliacoes = extrairRegistrosRecursivos(
        dadosAvaliacoes,
        'avaliacoes'
      );

      const entradasRegistros = extrairRegistrosRecursivos(
        dadosRegistros,
        'registros'
      );

      const entradasCombinadas = [
        ...entradasAvaliacoes,
        ...entradasRegistros,
      ];

      const registrosNormalizados = entradasCombinadas
        .map(([chave, item]) =>
          normalizarRegistro(item, chave)
        )
        .filter(Boolean);

      // Junta fontes locais e servidor pela chave tipo + ID TMDB.
      const registrosUnicos = unificarAvaliacoes([
        ...registrosNormalizados,
        ...avaliacoesServidor,
      ]);

      // ------------------------------------------------------
      // 2. IDENTIFICAR AVALIAÇÕES REAIS
      // ------------------------------------------------------

      const avaliacoesUnicas = registrosUnicos.filter(item => {
        const nota = Number(item.nota);

        const temNota =
          item.nota !== null &&
          item.nota !== undefined &&
          Number.isFinite(nota) &&
          nota > 0;

        const temComentario =
          Boolean(String(item.review || '').trim());

        return temNota || temComentario;
      });

      // ------------------------------------------------------
      // 3. COMPLETAR DADOS DA MÍDIA NO TMDB
      // ------------------------------------------------------

      const registrosCompletos = await Promise.all(
        registrosUnicos.map(async registro => {
          const chave = `${registro.tipo}-${registro.id}`;

          const cache = cacheTMDB.current.get(chave);

          const registroComCache = {
            ...cache,
            ...registro,

            title:
              registro.title ||
              cache?.title ||
              null,

            poster_path:
              registro.poster_path ||
              cache?.poster_path ||
              null,

            release_date:
              registro.release_date ||
              cache?.release_date ||
              null,
          };

          if (
            registroComCache.title &&
            registroComCache.poster_path
          ) {
            return registroComCache;
          }

          // Evita consultar o TMDB várias vezes para a mesma obra.
          if (cache?.consultado) {
            return registroComCache;
          }

          const dadosTMDB = await buscarDadosTMDB(
            registro.tipo,
            registro.id
          );

          cacheTMDB.current.set(chave, {
            ...dadosTMDB,
            consultado: true,
          });

          return {
            ...registroComCache,
            ...dadosTMDB,

            title:
              registroComCache.title ||
              dadosTMDB?.title ||
              'Obra sem título',

            poster_path:
              registroComCache.poster_path ||
              dadosTMDB?.poster_path ||
              null,
          };
        })
      );

      const avaliacoesCompletas = registrosCompletos.filter(item => {
        const nota = Number(item.nota);

        return (
          (item.nota !== null &&
            item.nota !== undefined &&
            Number.isFinite(nota) &&
            nota > 0) ||
          Boolean(String(item.review || '').trim())
        );
      });

      // ------------------------------------------------------
      // 4. ATUALIZAR AVALIAÇÕES
      // As listas são carregadas separadamente por carregarColecao.
      // ------------------------------------------------------

      setRegistros(registrosCompletos);
      setAvaliacoes(avaliacoesCompletas);
    } catch (erro) {
      console.error(
        'Erro ao carregar os dados do Diário:',
        erro
      );
    } finally {
      setCarregando(false);
      setAtualizando(false);
      carregamentoRef.current = false;
    }
  }, []);

  // ==========================================================
  // CARREGAMENTO INICIAL
  // ==========================================================

  useEffect(() => {
    carregarDados();

    const intervalo = setInterval(() => {
      carregarDados(true);
    }, 10000);

    return () => clearInterval(intervalo);
  }, [carregarDados]);

  // O contador consulta o armazenamento local a cada 3 segundos.
  // Assim, adicionar um filme/série a uma lista atualiza o número
  // sem depender de uma nova avaliação nem da API PHP.
  useEffect(() => {
    carregarColecao();

    const intervaloColecao = setInterval(() => {
      carregarColecao();
    }, 3000);

    return () => clearInterval(intervaloColecao);
  }, [carregarColecao]);

  // ==========================================================
  // ATUALIZAR AO VOLTAR PARA O APLICATIVO
  // ==========================================================

  useEffect(() => {
    const inscricao = AppState.addEventListener(
      'change',
      estado => {
        if (estado === 'active') {
          carregarDados(true);
          carregarColecao();
        }
      }
    );

    return () => inscricao.remove();
  }, [carregarDados, carregarColecao]);

  // ==========================================================
  // ATIVIDADES PESSOAIS
  // ==========================================================

  const atividadesPessoais = useMemo(() => {
    const resultado = [];

    // AVALIAÇÕES
    avaliacoes.forEach(item => {
      resultado.push({
        ...item,
        atividade: 'avaliacao',

        data_atividade:
          item.data ||
          item.atualizado_em ||
          item.created_at ||
          null,
      });
    });

    // REGISTROS QUE AINDA NÃO POSSUEM AVALIAÇÃO
    registros.forEach(item => {
      const jaAvaliado = avaliacoes.some(
        avaliacao =>
          avaliacao.tipo === item.tipo &&
          String(avaliacao.id) === String(item.id)
      );

      if (jaAvaliado) return;

      resultado.push({
        ...item,
        atividade: 'avaliacao',

        data_atividade:
          item.data ||
          item.atualizado_em ||
          item.created_at ||
          null,
      });
    });

    // MINHA LISTA ANTIGA
    itensMinhaLista.forEach((obra, indice) => {
      const registro = normalizarRegistro(
        obra,
        `${obra.tipo || obra.media_type || 'movie'}-${obra.id || indice}`
      );

      if (!registro) return;

      resultado.push({
        ...registro,

        atividade: 'item_lista',
        nome_lista: obra.nome_lista || 'Minha lista',

        data_atividade:
          obra.adicionada_em ||
          obra.added_at ||
          obra.created_at ||
          null,

        id_atividade:
          `minha-lista-${registro.tipo}-${registro.id}-${indice}`,
      });
    });

    // LISTAS PERSONALIZADAS
    listas.forEach(lista => {
      if (!lista || typeof lista !== 'object') return;

      // Criação da lista
      resultado.push({
        ...lista,
        atividade: 'lista',

        data_atividade:
          lista.criada_em ||
          lista.created_at ||
          lista.createdAt ||
          null,
      });

      // Os filmes e séries das listas já são incluídos acima,
      // em itensMinhaLista, sem duplicar atividades.
    });

    return resultado.sort((a, b) => {
      const dataA =
        converterData(a.data_atividade)?.getTime() || 0;

      const dataB =
        converterData(b.data_atividade)?.getTime() || 0;

      return dataB - dataA;
    });
  }, [
    avaliacoes,
    registros,
    listas,
    itensMinhaLista,
  ]);

  // ==========================================================
  // ATIVIDADES DOS AMIGOS
  // ==========================================================

  const atividadesDosAmigos = useMemo(() => {
    const lista = Array.isArray(atividadesAmigos)
      ? atividadesAmigos
      : [];

    return lista
      .map(normalizarAtividadeAmigo)
      .filter(Boolean)
      .sort((a, b) => {
        const dataA =
          converterData(a.data_atividade)?.getTime() || 0;

        const dataB =
          converterData(b.data_atividade)?.getTime() || 0;

        return dataB - dataA;
      });
  }, [atividadesAmigos]);

  // ==========================================================
  // FEED EXIBIDO
  // ==========================================================

  const atividadesExibidas =
    abaAtiva === 'Você'
      ? atividadesPessoais
      : atividadesDosAmigos;

  // ==========================================================
  // AGRUPAMENTO POR DATA
  // ==========================================================

  const grupos = useMemo(() => {
    const agrupados = {};

    atividadesExibidas.forEach(item => {
      const grupo = obterGrupoData(item.data_atividade);

      if (!agrupados[grupo]) {
        agrupados[grupo] = [];
      }

      agrupados[grupo].push(item);
    });

    return Object.entries(agrupados);
  }, [atividadesExibidas]);

  // ==========================================================
  // CONTADOR DA COLEÇÃO — FILMES E SÉRIES NAS LISTAS
  // ==========================================================

  // O total não depende das avaliações. Ele considera qualquer filme
  // ou série salvo em Minha Lista ou em uma lista personalizada.
  // A mesma produção só é contada uma vez, mesmo aparecendo em várias listas.
  const itensColecao = useMemo(
    () => unificarItensColecao(itensMinhaLista),
    [itensMinhaLista]
  );

  const quantidadeNaColecao = itensColecao.length;

  const quantidadeFilmesColecao = itensColecao.filter(
    item => item.tipo === 'movie'
  ).length;

  const quantidadeSeriesColecao = itensColecao.filter(
    item => item.tipo === 'tv'
  ).length;

  // ==========================================================
  // NAVEGAÇÃO — PADRÃO HOME.JS
  // ==========================================================

  const abrirAba = (aba, callback) => {
    setAbaNavegacao(aba);

    if (aba === 'Buscar') {
      setTelaInterna('Buscar');
      return;
    }

    if (aba === 'Home') {
      if (typeof callback === 'function') {
        callback();
      } else {
        Alert.alert(
          'Home',
          'A navegação para a tela inicial ainda não foi conectada no App.js.'
        );
      }

      return;
    }

    if (aba === 'Diário') {
      setTelaInterna('Diário');
      carregarDados(true);
      carregarColecao();

      if (typeof callback === 'function') {
        callback();
      }

      return;
    }

    if (aba === 'Adicionar') {
      if (typeof callback === 'function') {
        callback();
      } else {
        Alert.alert(
          'Novo registro',
          'A navegação para Novo Registro ainda não foi conectada no App.js.'
        );
      }

      return;
    }

    if (aba === 'Perfil') {
      if (typeof callback === 'function') {
        callback();
      } else {
        Alert.alert(
          'Perfil',
          'A navegação para o Perfil ainda não foi conectada no App.js.'
        );
      }
    }
  };

  // ==========================================================
  // ENTRAR NA ABA VOCÊ E RECARREGAR
  // ==========================================================

  const abrirAbaVoce = () => {
    setAbaAtiva('Você');
    carregarDados(true);
    carregarColecao();
  };

  // ==========================================================
  // VOLTAR DA BUSCA
  // ==========================================================

  const voltarDaBusca = () => {
    setTelaInterna('Diário');
    setAbaNavegacao('Diário');
    carregarDados(true);
    carregarColecao();
  };

  // ==========================================================
  // TELA DE BUSCA
  // ==========================================================

  if (telaInterna === 'Buscar') {
    return (
      <Buscar
        onVoltar={voltarDaBusca}
        onAbrirDetalhes={onAbrirDetalhes}
        onAbrirPerfil={onAbrirPerfil}
      />
    );
  }

  // ==========================================================
  // RENDERIZAÇÃO
  // ==========================================================

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.bg}
        translucent={false}
      />

      {/* CABEÇALHO */}

      <View style={styles.header}>
        <View style={styles.brandContainer}>
          <View style={styles.logoContainer}>
            <Image
              source={LOGO_CINETRACK}
              style={styles.headerLogo}
              resizeMode="contain"
              accessibilityLabel="Logo CineTrack"
            />
          </View>

          <View style={styles.brandTextContainer}>
            <Text style={styles.brandName}>
              CINE
              <Text style={styles.brandNameBlue}>
                TRACK
              </Text>
            </Text>

            <Text style={styles.brandSubtitle}>
              SEU UNIVERSO AUDIOVISUAL
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.8}
            onPress={() =>
              Alert.alert(
                'Notificações',
                'Você não tem notificações novas.'
              )
            }
          >
            <Feather
              name="bell"
              size={19}
              color={COLORS.text}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.avatarSmall}
            activeOpacity={0.8}
            onPress={() =>
              abrirAba(
                'Perfil',
                onAbrirPerfil || onLogout
              )
            }
          >
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={styles.avatarImage}
              />
            ) : (
              <Text style={styles.avatarInitial}>
                {iniciais(nome)}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* CONTEÚDO */}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={() => {
              carregarDados(true);
              carregarColecao();
            }}
            tintColor={COLORS.blue}
          />
        }
      >
        {/* TÍTULO */}

        <View style={styles.welcome}>
          <Text style={styles.eyebrow}>
            SEU UNIVERSO AUDIOVISUAL
          </Text>

          <Text style={styles.greeting}>
            Diário
          </Text>

          <Text style={styles.welcomeSub}>
            Acompanhe suas experiências e as atividades da sua comunidade.
          </Text>
        </View>

        {/* ABAS */}

        <View style={styles.feedTabs}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setAbaAtiva('Amigos')}
            style={[
              styles.feedTab,
              abaAtiva === 'Amigos' && styles.feedTabActive,
            ]}
          >
            <Ionicons
              name="people-outline"
              size={17}
              color={
                abaAtiva === 'Amigos'
                  ? COLORS.blueLight
                  : COLORS.muted
              }
            />

            <Text
              style={[
                styles.feedTabText,
                abaAtiva === 'Amigos' && styles.feedTabTextActive,
              ]}
            >
              Amigos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={abrirAbaVoce}
            style={[
              styles.feedTab,
              abaAtiva === 'Você' && styles.feedTabActive,
            ]}
          >
            <Feather
              name="user"
              size={17}
              color={
                abaAtiva === 'Você'
                  ? COLORS.blueLight
                  : COLORS.muted
              }
            />

            <Text
              style={[
                styles.feedTabText,
                abaAtiva === 'Você' && styles.feedTabTextActive,
              ]}
            >
              Você
            </Text>
          </TouchableOpacity>
        </View>

        {/* MINHA COLEÇÃO — CONTADOR DINÂMICO */}

        {abaAtiva === 'Você' && (
          <View style={styles.collectionCard}>
            <LinearGradient
              colors={['#14213B', '#101722', '#0D1118']}
              style={StyleSheet.absoluteFillObject}
            />

            <View style={styles.collectionHeader}>
              <View>
                <Text style={styles.collectionEyebrow}>
                  SUA BIBLIOTECA
                </Text>

                <Text style={styles.collectionTitle}>
                  Minha coleção
                </Text>

                <Text style={styles.collectionDescription}>
                  Filmes e séries adicionados às suas listas
                </Text>
              </View>

              <View style={styles.collectionIcon}>
                <Ionicons
                  name="library-outline"
                  size={23}
                  color={COLORS.blueLight}
                />
              </View>
            </View>

            <View style={styles.collectionTotalRow}>
              <Text style={styles.collectionTotal}>
                {quantidadeNaColecao}
              </Text>

              <View style={styles.collectionTotalText}>
                <Text style={styles.collectionTotalLabel}>
                  {quantidadeNaColecao === 1 ? 'produção salva' : 'produções salvas'}
                </Text>

                <Text style={styles.collectionTotalHint}>
                  Atualizado automaticamente quando você adiciona uma produção.
                </Text>
              </View>
            </View>

            <View style={styles.collectionBreakdown}>
              <View style={styles.collectionType}>
                <Ionicons
                  name="film-outline"
                  size={15}
                  color={COLORS.blueLight}
                />

                <Text style={styles.collectionTypeText}>
                  {quantidadeFilmesColecao} {quantidadeFilmesColecao === 1 ? 'filme' : 'filmes'}
                </Text>
              </View>

              <View style={styles.collectionTypeDivider} />

              <View style={styles.collectionType}>
                <Ionicons
                  name="tv-outline"
                  size={15}
                  color={COLORS.green}
                />

                <Text style={styles.collectionTypeText}>
                  {quantidadeSeriesColecao} {quantidadeSeriesColecao === 1 ? 'série' : 'séries'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* CABEÇALHO DO FEED */}

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              {abaAtiva === 'Amigos'
                ? 'ATIVIDADES DOS AMIGOS'
                : 'SUA LINHA DO TEMPO'}
            </Text>

            <Text style={styles.sectionSubtitle}>
              {abaAtiva === 'Amigos'
                ? 'Acompanhe o que estão assistindo'
                : 'Suas experiências audiovisuais'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.refreshButton}
            activeOpacity={0.8}
            onPress={() => {
              carregarDados(true);
              carregarColecao();
            }}
          >
            <Feather
              name="refresh-cw"
              size={17}
              color={COLORS.blueLight}
            />
          </TouchableOpacity>
        </View>

        {/* FEED */}

        {carregando ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color={COLORS.blue}
            />

            <Text style={styles.loadingText}>
              Organizando seu diário...
            </Text>
          </View>
        ) : atividadesExibidas.length === 0 ? (
          <EstadoVazio
            tipo={abaAtiva === 'Amigos' ? 'amigos' : 'voce'}
            onAdicionar={onAdicionar}
          />
        ) : (
          <View style={styles.feedList}>
            {grupos.map(([titulo, itens]) => (
              <View key={titulo}>
                <View style={styles.dateHeader}>
                  <View style={styles.dateIndicator} />

                  <Text style={styles.dateTitle}>
                    {titulo}
                  </Text>

                  <View style={styles.dateRule} />

                  <Text style={styles.dateCount}>
                    {itens.length}
                  </Text>
                </View>

                {itens.map((item, index) => (
                  <ItemAtividade
                    key={
                      item.id_atividade ||
                      `${item.atividade}-${item.tipo}-${item.id || index}-${index}`
                    }
                    item={item}
                    pessoal={abaAtiva === 'Você'}
                    onAbrirDetalhes={onAbrirDetalhes}
                  />
                ))}
              </View>
            ))}
          </View>
        )}

        <View style={styles.footer}>
          <View style={styles.footerLine} />

          <Text style={styles.footerText}>
            CINETRACK · SEU UNIVERSO AUDIOVISUAL
          </Text>

          <View style={styles.footerLine} />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* MENU INFERIOR — PADRÃO HOME.JS */}

      <View style={styles.tabBar}>
        {/* HOME */}

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() =>
            abrirAba(
              'Home',
              onAbrirHome || onVoltar
            )
          }
          activeOpacity={0.8}
        >
          <Ionicons
            name="home"
            size={22}
            color={
              abaNavegacao === 'Home'
                ? COLORS.blueLight
                : COLORS.muted
            }
          />

          <Text
            style={[
              styles.tabLabel,
              abaNavegacao === 'Home' && styles.tabActive,
            ]}
          >
            Home
          </Text>
        </TouchableOpacity>

        {/* BUSCAR */}

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => abrirAba('Buscar', onAbrirBusca)}
          activeOpacity={0.8}
        >
          <Feather
            name="search"
            size={21}
            color={
              abaNavegacao === 'Buscar'
                ? COLORS.blueLight
                : COLORS.muted
            }
          />

          <Text
            style={[
              styles.tabLabel,
              abaNavegacao === 'Buscar' && styles.tabActive,
            ]}
          >
            Buscar
          </Text>
        </TouchableOpacity>

        {/* ADICIONAR */}

        <TouchableOpacity
          style={styles.addButton}
          onPress={() =>
            abrirAba('Adicionar', onAdicionar)
          }
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#3984FF', '#2563EB']}
            style={styles.addButtonGradient}
          >
            <Feather
              name="plus"
              size={26}
              color="#FFFFFF"
            />
          </LinearGradient>
        </TouchableOpacity>

        {/* DIÁRIO */}

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() =>
            abrirAba('Diário', onAbrirDiario)
          }
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="notebook-outline"
            size={23}
            color={
              abaNavegacao === 'Diário'
                ? COLORS.blueLight
                : COLORS.muted
            }
          />

          <Text
            style={[
              styles.tabLabel,
              abaNavegacao === 'Diário' && styles.tabActive,
            ]}
          >
            Diário
          </Text>
        </TouchableOpacity>

        {/* PERFIL */}

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() =>
            abrirAba(
              'Perfil',
              onAbrirPerfil || onLogout
            )
          }
          activeOpacity={0.8}
        >
          <Feather
            name="user"
            size={21}
            color={
              abaNavegacao === 'Perfil'
                ? COLORS.blueLight
                : COLORS.muted
            }
          />

          <Text
            style={[
              styles.tabLabel,
              abaNavegacao === 'Perfil' && styles.tabActive,
            ]}
          >
            Perfil
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ============================================================
// ESTILOS — PADRÃO HOME.JS
// ============================================================

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: COLORS.bg,

    paddingTop:
      Platform.OS === 'android'
        ? StatusBar.currentHeight || 24
        : 0,
  },

  // CABEÇALHO

  header: {
    minHeight: 76,
    paddingHorizontal: 19,
    paddingVertical: 10,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,

    backgroundColor: COLORS.bg,
    zIndex: 2,
  },

  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },

  logoContainer: {
    width: 47,
    height: 47,
    borderRadius: 14,

    backgroundColor: '#101827',

    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.22)',

    alignItems: 'center',
    justifyContent: 'center',

    overflow: 'hidden',
  },

  headerLogo: {
    width: 39,
    height: 39,
  },

  brandTextContainer: {
    justifyContent: 'center',
  },

  brandName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.4,
  },

  brandNameBlue: {
    color: COLORS.blueLight,
  },

  brandSubtitle: {
    color: '#718096',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.55,
    marginTop: 4,
  },

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginLeft: 8,
  },

  iconButton: {
    width: 41,
    height: 41,
    borderRadius: 13,

    backgroundColor: COLORS.elevated,

    alignItems: 'center',
    justifyContent: 'center',

    borderWidth: 1,
    borderColor: COLORS.border,
  },

  avatarSmall: {
    width: 41,
    height: 41,
    borderRadius: 13,

    backgroundColor: COLORS.blue,

    alignItems: 'center',
    justifyContent: 'center',

    overflow: 'hidden',
  },

  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },

  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  // CONTEÚDO

  scrollContent: {
    paddingHorizontal: 19,
    paddingTop: 20,
    paddingBottom: 20,
  },

  welcome: {
    marginBottom: 19,
  },

  eyebrow: {
    color: COLORS.muted,
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '800',
    marginBottom: 8,
  },

  greeting: {
    color: COLORS.text,
    fontSize: 27,
    fontWeight: '800',
    letterSpacing: -0.7,
  },

  welcomeSub: {
    color: COLORS.secondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },

  // ABAS

  feedTabs: {
    flexDirection: 'row',
    gap: 9,
    marginBottom: 23,
  },

  feedTab: {
    flex: 1,
    height: 43,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,

    backgroundColor: COLORS.elevated,

    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 13,
  },

  feedTabActive: {
    backgroundColor: 'rgba(59,130,246,0.13)',
    borderColor: 'rgba(96,165,250,0.30)',
  },

  feedTabText: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '700',
  },

  feedTabTextActive: {
    color: COLORS.blueLight,
  },

  // MINHA COLEÇÃO — CONTADOR DINÂMICO

  collectionCard: {
    padding: 18,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.20)',
    overflow: 'hidden',
    marginBottom: 25,
  },

  collectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  collectionEyebrow: {
    color: COLORS.blueLight,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 5,
  },

  collectionTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '900',
  },

  collectionDescription: {
    color: COLORS.secondary,
    fontSize: 10,
    marginTop: 5,
  },

  collectionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(59,130,246,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  collectionTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 19,
  },

  collectionTotal: {
    color: '#FFFFFF',
    fontSize: 42,
    lineHeight: 48,
    fontWeight: '900',
    marginRight: 13,
  },

  collectionTotalText: {
    flex: 1,
  },

  collectionTotalLabel: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '800',
  },

  collectionTotalHint: {
    color: COLORS.muted,
    fontSize: 9,
    lineHeight: 14,
    marginTop: 4,
  },

  collectionBreakdown: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 15,
  },

  collectionType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  collectionTypeText: {
    color: COLORS.secondary,
    fontSize: 10,
    fontWeight: '700',
  },

  collectionTypeDivider: {
    width: 1,
    height: 15,
    backgroundColor: COLORS.border,
  },

  // SEÇÕES

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  sectionTitle: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.6,
  },

  sectionSubtitle: {
    color: COLORS.secondary,
    fontSize: 11,
    marginTop: 5,
  },

  refreshButton: {
    width: 38,
    height: 38,
    borderRadius: 12,

    backgroundColor: COLORS.elevated,

    borderWidth: 1,
    borderColor: COLORS.border,

    alignItems: 'center',
    justifyContent: 'center',
  },

  // FEED

  feedList: {
    gap: 8,
  },

  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginTop: 12,
    marginBottom: 13,
  },

  dateIndicator: {
    width: 4,
    height: 17,
    borderRadius: 5,
    backgroundColor: COLORS.blue,
  },

  dateTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'capitalize',
  },

  dateRule: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },

  dateCount: {
    color: COLORS.muted,
    fontSize: 10,
  },

  // CARDS

  atividadeCard: {
    backgroundColor: COLORS.elevated,

    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,

    padding: 14,
    marginBottom: 11,
  },

  atividadeCabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  atividadeAutor: {
    flex: 1,
    marginLeft: 10,
  },

  atividadeNome: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '800',
  },

  atividadeAcao: {
    color: COLORS.secondary,
    fontSize: 10,
    marginTop: 4,
  },

  atividadeTempo: {
    color: COLORS.muted,
    fontSize: 10,
    marginLeft: 8,
  },

  // AVATAR

  avatar: {
    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: COLORS.elevated,

    borderWidth: 1,
    borderColor: COLORS.border,
  },

  avatarTexto: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  // MÍDIAS

  midiaLinha: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  poster: {
    width: 73,
    height: 108,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
  },

  posterPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  midiaInformacoes: {
    flex: 1,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },

  tipoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,

    backgroundColor: 'rgba(59,130,246,0.13)',

    paddingHorizontal: 7,
    paddingVertical: 4,

    borderRadius: 6,
    marginBottom: 7,
  },

  tipoTagTexto: {
    color: COLORS.blueLight,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  midiaTitulo: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 19,
  },

  midiaAno: {
    color: COLORS.secondary,
    fontSize: 10,
    marginTop: 4,
  },

  notaLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },

  estrelas: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  notaNumero: {
    color: COLORS.yellow,
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 5,
  },

  // DESTINO DA LISTA

  listaDestino: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 9,
  },

  listaDestinoTexto: {
    color: COLORS.green,
    fontSize: 10,
    fontWeight: '700',
    flexShrink: 1,
  },

  // COMENTÁRIOS

  comentarioContainer: {
    flexDirection: 'row',
    gap: 9,

    backgroundColor: COLORS.surface,

    borderRadius: 11,
    borderWidth: 1,
    borderColor: COLORS.border,

    padding: 11,
    marginTop: 13,
  },

  comentarioTexto: {
    flex: 1,
    color: COLORS.text,
    fontSize: 11,
    lineHeight: 18,
    fontStyle: 'italic',
  },

  // TRILHA SONORA

  trilhaContainer: {
    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: 'rgba(34,197,94,0.07)',

    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.15)',

    padding: 10,
    marginTop: 12,
  },

  trilhaIcone: {
    width: 35,
    height: 35,
    borderRadius: 10,

    backgroundColor: 'rgba(34,197,94,0.12)',

    alignItems: 'center',
    justifyContent: 'center',
  },

  trilhaInformacoes: {
    flex: 1,
    marginLeft: 10,
  },

  trilhaLabel: {
    color: COLORS.green,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 3,
  },

  trilhaTitulo: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '700',
  },

  trilhaArtista: {
    color: COLORS.secondary,
    fontSize: 10,
    marginTop: 3,
  },

  // PROGRESSO DE SÉRIES

  progressoConteudo: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  progressoIcone: {
    width: 43,
    height: 43,
    borderRadius: 13,

    backgroundColor: 'rgba(59,130,246,0.14)',

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 11,
  },

  progressoInformacoes: {
    flex: 1,
  },

  progressoTitulo: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
  },

  progressoEpisodio: {
    color: COLORS.secondary,
    fontSize: 10,
    marginTop: 5,
  },

  progressoPercentual: {
    color: COLORS.blueLight,
    fontSize: 15,
    fontWeight: '900',
  },

  progressoBarraFundo: {
    height: 5,
    borderRadius: 5,
    backgroundColor: '#252D3A',
    marginTop: 15,
    overflow: 'hidden',
  },

  progressoBarraPreenchida: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: COLORS.blue,
  },

  // LISTAS CRIADAS

  listaConteudo: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  listaIcone: {
    width: 57,
    height: 57,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  listaInformacoes: {
    flex: 1,
    marginLeft: 13,
  },

  listaTitulo: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
  },

  listaDescricao: {
    color: COLORS.secondary,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 4,
  },

  listaQuantidade: {
    color: COLORS.green,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 7,
  },

  // INTERAÇÕES

  interacaoCard: {
    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: COLORS.elevated,

    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,

    padding: 14,
    marginBottom: 11,
  },

  interacaoTextoContainer: {
    flex: 1,
    marginLeft: 11,
  },

  interacaoNome: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '800',
  },

  interacaoDescricao: {
    color: COLORS.secondary,
    fontSize: 10,
    marginTop: 3,
  },

  interacaoTempo: {
    color: COLORS.muted,
    fontSize: 9,
    marginTop: 5,
  },

  interacaoIcone: {
    width: 35,
    height: 35,
    borderRadius: 11,

    backgroundColor: COLORS.surface,

    alignItems: 'center',
    justifyContent: 'center',
  },

  // ESTADO VAZIO

  estadoVazio: {
    alignItems: 'center',

    paddingHorizontal: 24,
    paddingVertical: 29,

    backgroundColor: COLORS.elevated,

    borderRadius: 17,
    borderWidth: 1,
    borderColor: COLORS.border,

    marginTop: 15,
    marginBottom: 25,
  },

  estadoVazioIcone: {
    width: 70,
    height: 70,
    borderRadius: 23,

    backgroundColor: 'rgba(59,130,246,0.13)',

    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.22)',

    alignItems: 'center',
    justifyContent: 'center',

    marginBottom: 17,
  },

  estadoVazioTitulo: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },

  estadoVazioDescricao: {
    color: COLORS.secondary,
    fontSize: 11,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 9,
  },

  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,

    backgroundColor: COLORS.blue,

    paddingHorizontal: 15,
    paddingVertical: 10,

    borderRadius: 11,
    marginTop: 17,
  },

  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },

  // CARREGAMENTO

  loadingContainer: {
    minHeight: 210,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    color: COLORS.secondary,
    fontSize: 12,
    marginTop: 13,
  },

  // RODAPÉ

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    paddingHorizontal: 15,
    marginTop: 15,
    marginBottom: 10,

    gap: 10,
  },

  footerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },

  footerText: {
    color: COLORS.muted,
    fontSize: 8,
    letterSpacing: 0.8,
  },

  // MENU INFERIOR — PADRÃO HOME.JS

  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,

    minHeight: 76,

    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 9,

    backgroundColor: 'rgba(8,10,14,0.98)',

    borderTopWidth: 1,
    borderTopColor: COLORS.border,

    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',

    zIndex: 10,
    elevation: 12,
  },

  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },

  tabLabel: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '700',
  },

  tabActive: {
    color: COLORS.blueLight,
  },

  addButton: {
    width: 54,
    height: 54,
    borderRadius: 17,

    top: -14,
    overflow: 'hidden',

    elevation: 8,
  },

  addButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

});