import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Animated,
  AppState,
  Dimensions,
  Image,
  Modal,
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

import AsyncStorage from './userStorage';
import { LinearGradient } from 'expo-linear-gradient';

import {
  Ionicons,
  Feather,
  MaterialCommunityIcons,
  AntDesign,
} from '@expo/vector-icons';

import {
  getFilmesEmAlta,
  getSeriesEmAlta,
} from './services';

import Buscar from './buscar';

// ============================================================
// CONFIGURAÇÕES
// ============================================================

const LOGO_CINETRACK = require('./assets/logo-cinetrack.png');

const CHAVE_AVALIACOES = '@CineTrack:avaliacoes';
const CHAVE_REGISTROS = '@CineTrack:registros';

const TMDB_KEY = '5c1853c10d9752023da5ddce4ada3b77';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMAGE = 'https://image.tmdb.org/t/p/w500';

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

const { width } = Dimensions.get('window');

const CARD_WIDTH = Math.min(
  142,
  Math.max(112, (width - 76) / 3)
);

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

const formatarData = valor => {
  if (!valor) return 'Data não informada';

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return 'Data não informada';
  }

  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const obterImagem = poster => {
  if (!poster) return null;

  const valor = String(poster);

  return valor.startsWith('http')
    ? valor
    : `${TMDB_IMAGE}${valor}`;
};

const lerJSON = texto => {
  if (!texto) return null;

  try {
    return JSON.parse(texto);
  } catch (erro) {
    console.warn(
      'Erro ao interpretar dados salvos:',
      erro
    );

    return null;
  }
};

const normalizarTipo = (
  tipo,
  chave = '',
  registro = {}
) => {
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
    /^(movie|tv|serie|série|filme)[-_]/i
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

// ============================================================
// EXTRAIR REGISTROS
// ============================================================

function obterEntradas(dados) {
  if (!dados) return [];

  if (Array.isArray(dados)) {
    return dados.map((item, index) => [
      String(item?.id || index),
      item,
    ]);
  }

  if (typeof dados !== 'object') {
    return [];
  }

  const possiveisChaves = [
    'avaliacoes',
    'registros',
    'itens',
    'filmes',
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
  }

  return Object.entries(dados).filter(
    ([, item]) =>
      item &&
      typeof item === 'object' &&
      !Array.isArray(item)
  );
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
    /^(movie|tv|serie|série|filme)[-_](.+)$/i
  );

  const id =
    combinado.tmdb_id ??
    combinado.media_id ??
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
    combinado.media_type ||
    combinado.mediaType,
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

  const status = String(
    combinado.status ||
    combinado.situacao ||
    combinado.progresso ||
    ''
  ).toLowerCase();

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

  const statusAssistido = [
    'assistido',
    'assistida',
    'watched',
    'completed',
    'complete',
    'concluido',
    'concluída',
    'concluida',
    'finalizado',
    'finalizada',
    'finished',
  ];

  const assistido =
    (nota !== null && nota > 0) ||
    combinado.assistido === true ||
    combinado.watched === true ||
    combinado.concluido === true ||
    statusAssistido.includes(status) ||
    Boolean(
      combinado.watch_date ||
      combinado.watched_at ||
      combinado.assistido_em ||
      combinado.data_assistido
    );

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

    data,

    atualizado_em:
      combinado.atualizado_em ||
      combinado.created_at ||
      data,

    status,
    assistido,

    review:
      combinado.review ||
      combinado.comentario ||
      combinado.comment ||
      '',

    runtime_total_minutos: Number(
      combinado.runtime_total_minutos ||
      combinado.duracao_total_minutos ||
      0
    ),

    duracao_minutos: Number(
      combinado.duracao_minutos ||
      combinado.duration_minutes ||
      0
    ),
  };
}

// ============================================================
// REMOVER DUPLICADOS
// ============================================================

function removerDuplicados(lista) {
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

      nota: item.nota ?? anterior.nota,

      review:
        item.review ||
        anterior.review,

      data:
        item.data ||
        anterior.data,

      runtime_total_minutos:
        item.runtime_total_minutos ||
        anterior.runtime_total_minutos,
    });
  });

  return Array.from(mapa.values());
}

// ============================================================
// CONSULTAR DETALHES E DURAÇÃO NO TMDB
// ============================================================

async function buscarDadosTMDB(tipo, id) {
  try {
    const resposta = await fetch(
      `${TMDB_BASE}/${tipo}/${id}?api_key=${TMDB_KEY}&language=pt-BR`
    );

    if (!resposta.ok) {
      return null;
    }

    const dados = await resposta.json();

    let duracaoTotal = 0;
    let duracaoUnidade = 0;
    let quantidadeEpisodios = 0;

    if (tipo === 'movie') {
      duracaoTotal = Number(dados.runtime || 0);
      duracaoUnidade = duracaoTotal;
    } else {
      const duracoes = Array.isArray(dados.episode_run_time)
        ? dados.episode_run_time
            .map(Number)
            .filter(valor => valor > 0)
        : [];

      quantidadeEpisodios = Number(
        dados.number_of_episodes || 0
      );

      if (
        duracoes.length &&
        quantidadeEpisodios > 0
      ) {
        duracaoUnidade = Math.round(
          duracoes.reduce(
            (total, valor) => total + valor,
            0
          ) / duracoes.length
        );

        duracaoTotal =
          duracaoUnidade * quantidadeEpisodios;
      }
    }

    return {
      title: dados.title || dados.name || null,
      titulo: dados.title || dados.name || null,

      poster_path: dados.poster_path || null,
      backdrop_path: dados.backdrop_path || null,

      release_date:
        dados.release_date ||
        dados.first_air_date ||
        null,

      vote_average: dados.vote_average || 0,

      runtime: duracaoUnidade,
      number_of_episodes: quantidadeEpisodios,

      runtime_total_minutos: duracaoTotal,
    };
  } catch (erro) {
    console.warn(
      `Erro ao consultar ${tipo}-${id} no TMDB:`,
      erro
    );

    return null;
  }
}

// ============================================================
// FORMATAR TEMPO
// ============================================================

function formatarTempoTotal(minutos) {
  const total = Math.max(
    0,
    Math.round(minutos || 0)
  );

  const horas = Math.floor(total / 60);
  const minutosRestantes = total % 60;

  if (horas === 0) {
    return `${minutosRestantes}min`;
  }

  if (minutosRestantes === 0) {
    return `${horas}h`;
  }

  return `${horas}h ${minutosRestantes}m`;
}

// ============================================================
// COMPONENTE HOME
// ============================================================

export default function Home({
  usuario = null,
  onLogout,
  onAbrirBusca,
  onAbrirDiario,
  onAbrirPerfil,
  onAdicionar,
  onAbrirDetalhes,
}) {
  const [filmes, setFilmes] = useState([]);
  const [series, setSeries] = useState([]);

  const [registrosLocais, setRegistrosLocais] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [carregandoDiario, setCarregandoDiario] = useState(true);

  const [abaAtiva, setAbaAtiva] = useState('Home');
  const [telaInterna, setTelaInterna] = useState('Home');

  // IMPORTANTE: este estado só é declarado uma vez.
  const [listaAberta, setListaAberta] = useState(null);

  const fade = useRef(new Animated.Value(0)).current;

  const nome = nomeUsuario(usuario);

  const avatarUrl =
    usuario?.avatar_url ||
    usuario?.avatar ||
    usuario?.foto ||
    null;

  const stats =
    usuario?.stats ||
    usuario?.estatisticas ||
    {};

  const conexoes = Array.isArray(usuario?.conexoes)
    ? usuario.conexoes
    : [];

  const atividadesUsuario = Array.isArray(usuario?.atividades)
    ? usuario.atividades
    : [];

  // ==========================================================
  // CARREGAR E SINCRONIZAR O DIÁRIO
  // ==========================================================

  const carregarDiario = useCallback(async () => {
    setCarregandoDiario(true);

    try {
      const valores = await AsyncStorage.multiGet([
        CHAVE_AVALIACOES,
        CHAVE_REGISTROS,
      ]);

      const dadosAvaliacoes = lerJSON(valores?.[0]?.[1]);
      const dadosRegistros = lerJSON(valores?.[1]?.[1]);

      const entradasAvaliacoes = obterEntradas(
        dadosAvaliacoes
      );

      const entradasRegistros = obterEntradas(
        dadosRegistros
      );

      const registrosUsuario = Array.isArray(usuario?.registros)
        ? usuario.registros.map((item, index) => [
            String(item?.id || index),
            item,
          ])
        : [];

      const entradas = [
        ...entradasAvaliacoes,
        ...entradasRegistros,
        ...registrosUsuario,
      ];

      const normalizados = entradas
        .map(([chave, item]) =>
          normalizarRegistro(item, chave)
        )
        .filter(Boolean);

      const registrosUnicos = removerDuplicados(
        normalizados
      );

      // Busca informações que não foram gravadas na avaliação.
      const enriquecidos = await Promise.all(
        registrosUnicos.map(async registro => {
          const precisaBuscar =
            !registro.title ||
            !registro.poster_path ||
            !registro.runtime_total_minutos;

          if (!precisaBuscar) {
            return registro;
          }

          const dadosTMDB = await buscarDadosTMDB(
            registro.tipo,
            registro.id
          );

          if (!dadosTMDB) {
            return registro;
          }

          return {
            ...registro,
            ...dadosTMDB,

            title:
              dadosTMDB.title ||
              registro.title ||
              'Obra sem título',

            titulo:
              dadosTMDB.title ||
              registro.title ||
              'Obra sem título',

            poster_path:
              dadosTMDB.poster_path ||
              registro.poster_path,

            poster:
              dadosTMDB.poster_path ||
              registro.poster_path,

            runtime_total_minutos:
              dadosTMDB.runtime_total_minutos ||
              registro.runtime_total_minutos ||
              0,
          };
        })
      );

      const registrosFinais = removerDuplicados(
        enriquecidos
      );

      setRegistrosLocais(registrosFinais);

      // Atualiza o cache das avaliações sem mudar seu formato.
      if (
        dadosAvaliacoes &&
        typeof dadosAvaliacoes === 'object'
      ) {
        let atualizadas = dadosAvaliacoes;

        if (Array.isArray(dadosAvaliacoes)) {
          atualizadas = dadosAvaliacoes.map(item => {
            const normalizado = normalizarRegistro(item);

            if (!normalizado) return item;

            const completo = registrosFinais.find(
              registro =>
                registro.tipo === normalizado.tipo &&
                registro.id === normalizado.id
            );

            return completo
              ? {
                  ...item,
                  title: completo.title,
                  poster_path: completo.poster_path,
                  runtime_total_minutos:
                    completo.runtime_total_minutos,
                  runtime: completo.runtime,
                  number_of_episodes:
                    completo.number_of_episodes,
                }
              : item;
          });
        } else {
          atualizadas = { ...dadosAvaliacoes };

          registrosFinais.forEach(registro => {
            const chave = `${registro.tipo}-${registro.id}`;

            const chaveOriginal = Object.keys(atualizadas).find(
              k => {
                const normalizado = normalizarRegistro(
                  atualizadas[k],
                  k
                );

                return (
                  normalizado &&
                  normalizado.tipo === registro.tipo &&
                  normalizado.id === registro.id
                );
              }
            );

            const chaveSalvar = chaveOriginal || chave;

            atualizadas[chaveSalvar] = {
              ...(atualizadas[chaveSalvar] || {}),

              id: registro.id,
              tmdb_id: registro.id,
              tipo: registro.tipo,

              title: registro.title,
              poster_path: registro.poster_path,

              nota: registro.nota,
              stars: registro.nota,

              runtime_total_minutos:
                registro.runtime_total_minutos,

              runtime: registro.runtime,

              number_of_episodes:
                registro.number_of_episodes,

              atualizado_em:
                registro.atualizado_em ||
                new Date().toISOString(),
            };
          });
        }

        await AsyncStorage.setItem(
          CHAVE_AVALIACOES,
          JSON.stringify(atualizadas)
        );
      }
    } catch (erro) {
      console.error(
        'Erro ao sincronizar o diário:',
        erro
      );
    } finally {
      setCarregandoDiario(false);
    }
  }, [usuario]);

  // ==========================================================
  // ESTATÍSTICAS
  // ==========================================================

  const registrosAssistidos = registrosLocais.filter(
    item => item.assistido
  );

  const filmesAssistidos = removerDuplicados(
    registrosAssistidos.filter(
      item => item.tipo === 'movie'
    )
  );

  const seriesAssistidas = removerDuplicados(
    registrosAssistidos.filter(
      item => item.tipo === 'tv'
    )
  );

  const todosAssistidos = removerDuplicados([
    ...filmesAssistidos,
    ...seriesAssistidas,
  ]);

  const totalFilmesLocal = filmesAssistidos.length;
  const totalSeriesLocal = seriesAssistidas.length;

  const totalMinutosLocal = todosAssistidos.reduce(
    (total, item) => {
      const duracao = Number(
        item.runtime_total_minutos ||
        item.duracao_total_minutos ||
        item.duracao_minutos ||
        0
      );

      return total + (
        Number.isFinite(duracao) ? duracao : 0
      );
    },
    0
  );

  const totalFilmesBackend = Number(
    stats.filmes_assistidos ??
    stats.filmes ??
    0
  );

  const totalSeriesBackend = Number(
    stats.series_avaliadas ??
    stats.series_em_andamento ??
    stats.series ??
    0
  );

  const totalHorasBackend = Number(
    stats.horas_assistidas ??
    stats.horas ??
    0
  );

  const totalFilmes = Math.max(
    totalFilmesLocal,
    totalFilmesBackend
  );

  const totalSeries = Math.max(
    totalSeriesLocal,
    totalSeriesBackend
  );

  const totalMinutos = Math.max(
    totalMinutosLocal,
    totalHorasBackend * 60
  );

  const tempoEmTela = formatarTempoTotal(totalMinutos);

  const registros = [...registrosLocais].sort((a, b) => {
    const dataA = new Date(
      a.data || a.atualizado_em || 0
    ).getTime() || 0;

    const dataB = new Date(
      b.data || b.atualizado_em || 0
    ).getTime() || 0;

    return dataB - dataA;
  });

  // ==========================================================
  // CARREGAMENTO DO CATÁLOGO
  // ==========================================================

  const carregarCatalogo = useCallback(async () => {
    try {
      const [f, s] = await Promise.all([
        getFilmesEmAlta(),
        getSeriesEmAlta(),
      ]);

      setFilmes(
        Array.isArray(f?.results)
          ? f.results.slice(0, 10)
          : []
      );

      setSeries(
        Array.isArray(s?.results)
          ? s.results.slice(0, 10)
          : []
      );
    } catch (erro) {
      console.warn(
        'Não foi possível carregar o catálogo:',
        erro
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================================
  // CARREGAMENTO INICIAL
  // ==========================================================

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 650,
      useNativeDriver: true,
    }).start();

    carregarCatalogo();
    carregarDiario();
  }, [
    carregarCatalogo,
    carregarDiario,
    fade,
  ]);

  // ==========================================================
  // ATUALIZAR QUANDO O APP VOLTAR AO PRIMEIRO PLANO
  // ==========================================================

  useEffect(() => {
    const inscricao = AppState.addEventListener(
      'change',
      estado => {
        if (estado === 'active') {
          carregarDiario();
        }
      }
    );

    return () => inscricao.remove();
  }, [carregarDiario]);

  // ==========================================================
  // ATUALIZAR MANUALMENTE
  // ==========================================================

  const atualizar = useCallback(async () => {
    setRefreshing(true);

    try {
      await Promise.all([
        carregarCatalogo(),
        carregarDiario(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [
    carregarCatalogo,
    carregarDiario,
  ]);

  // ==========================================================
  // NAVEGAÇÃO
  // ==========================================================

  const abrirAba = (aba, callback) => {
    setAbaAtiva(aba);

    if (aba === 'Buscar') {
      setTelaInterna('Buscar');
      return;
    }

    if (aba === 'Home') {
      setTelaInterna('Home');
      carregarDiario();
      return;
    }

    if (typeof callback === 'function') {
      callback();
      return;
    }

    Alert.alert(
      aba,
      'Esta área será conectada à tela correspondente na próxima etapa do desenvolvimento.'
    );
  };

  const voltarDaBusca = () => {
    setTelaInterna('Home');
    setAbaAtiva('Home');
    carregarDiario();
  };

  const abrirMidia = (item, tipoInformado = null) => {
    if (
      !item?.id ||
      typeof onAbrirDetalhes !== 'function'
    ) {
      return;
    }

    const tipo = normalizarTipo(
      tipoInformado ||
      item.tipo ||
      item.media_type,
      '',
      item
    );

    onAbrirDetalhes({
      ...item,
      id: item.id,
      tipo,
      media: item,
    });
  };

  // ==========================================================
  // MODAL DO DIÁRIO
  // Não declarar novamente o estado listaAberta aqui.
  // ==========================================================

  const abrirLista = tipo => {
    setListaAberta(tipo);
  };

  const fecharLista = () => {
    setListaAberta(null);
  };

  const midiasDaLista =
    listaAberta === 'filmes'
      ? filmesAssistidos
      : listaAberta === 'series'
        ? seriesAssistidas
        : todosAssistidos;

  const tituloDaLista =
    listaAberta === 'filmes'
      ? 'FILMES ASSISTIDOS'
      : listaAberta === 'series'
        ? 'SÉRIES AVALIADAS'
        : 'MEU DIÁRIO';

  // ==========================================================
  // TÍTULOS DAS SEÇÕES
  // ==========================================================

  const renderTituloSecao = titulo => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>
        {titulo}
      </Text>

      <View style={styles.sectionRule} />
    </View>
  );

  // ==========================================================
  // CARDS DO CATÁLOGO
  // ==========================================================

  const renderMidias = (lista, tipo) => {
    if (loading) {
      return (
        <ActivityIndicator
          color={COLORS.blue}
          style={{ marginVertical: 28 }}
        />
      );
    }

    if (!lista.length) {
      return (
        <Text style={styles.emptyText}>
          Não foi possível carregar o catálogo.
        </Text>
      );
    }

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalList}
      >
        {lista.map((item, index) => {
          const titulo =
            tipo === 'filme'
              ? item.title || item.original_title
              : item.name || item.original_name;

          return (
            <TouchableOpacity
              key={`${tipo}-${item.id}`}
              activeOpacity={0.85}
              style={styles.mediaCard}
              onPress={() =>
                abrirMidia(
                  item,
                  tipo === 'filme' ? 'movie' : 'tv'
                )
              }
            >
              {item.poster_path ? (
                <Image
                  source={{
                    uri: `${TMDB_IMAGE}${item.poster_path}`,
                  }}
                  style={styles.poster}
                />
              ) : (
                <View
                  style={[
                    styles.poster,
                    styles.posterPlaceholder,
                  ]}
                >
                  <Ionicons
                    name={tipo === 'filme' ? 'film' : 'tv'}
                    size={30}
                    color={COLORS.muted}
                  />
                </View>
              )}

              <Text
                numberOfLines={1}
                style={styles.mediaTitle}
              >
                {titulo || 'Sem título'}
              </Text>

              <View style={styles.ratingRow}>
                <AntDesign
                  name="star"
                  size={11}
                  color={COLORS.yellow}
                />

                <Text style={styles.rating}>
                  {Number(
                    item.vote_average || 0
                  ).toFixed(1)}
                </Text>
              </View>

              <View style={styles.rank}>
                <Text style={styles.rankText}>
                  {index + 1}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  // ==========================================================
  // CARDS DOS REGISTROS
  // ==========================================================

  const renderRegistro = (item, index) => {
    const titulo =
      item.title ||
      item.titulo ||
      'Obra sem título';

    const imagem = obterImagem(
      item.poster_path ||
      item.poster ||
      item.poster_url
    );

    return (
      <TouchableOpacity
        key={`${item.tipo}-${item.id || index}`}
        activeOpacity={0.85}
        style={styles.recordCard}
        onPress={() => abrirMidia(item)}
      >
        {imagem ? (
          <Image
            source={{ uri: imagem }}
            style={styles.recordPoster}
          />
        ) : (
          <View
            style={[
              styles.recordPoster,
              styles.posterPlaceholder,
            ]}
          >
            <Ionicons
              name={item.tipo === 'tv' ? 'tv-outline' : 'film-outline'}
              size={25}
              color={COLORS.muted}
            />
          </View>
        )}

        <View style={styles.recordInfo}>
          <Text
            style={styles.recordTitle}
            numberOfLines={1}
          >
            {titulo}
          </Text>

          <Text style={styles.recordDate}>
            {formatarData(
              item.data ||
              item.atualizado_em
            )}
          </Text>

          <Text style={styles.recordRating}>
            ★ {item.nota ?? item.rating ?? '—'}/5
          </Text>

          <Text style={styles.recordType}>
            {item.tipo === 'tv' ? 'SÉRIE' : 'FILME'}
          </Text>
        </View>

        <Feather
          name="chevron-right"
          size={18}
          color={COLORS.muted}
        />
      </TouchableOpacity>
    );
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
  // RENDERIZAÇÃO DA HOME
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

            <View style={styles.notificationDot} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.avatarSmall}
            onPress={() =>
              abrirAba('Perfil', onAbrirPerfil)
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

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={atualizar}
            tintColor={COLORS.blue}
          />
        }
        style={{ opacity: fade }}
      >
        {/* BOAS-VINDAS */}

        <View style={styles.welcome}>
          <Text style={styles.eyebrow}>
            SEU UNIVERSO AUDIOVISUAL
          </Text>

          <Text style={styles.greeting}>
            Olá,{' '}
            <Text style={styles.greetingName}>
              {nome}
            </Text>
          </Text>

          <Text style={styles.welcomeSub}>
            Continue explorando suas histórias favoritas.
          </Text>
        </View>

        {/* CONTINUAR ASSISTINDO */}

        {renderTituloSecao('CONTINUAR ASSISTINDO')}

        <View style={styles.heroCard}>
          <LinearGradient
            colors={[
              '#17113B',
              '#0D1424',
              '#0B0D12',
            ]}
            style={StyleSheet.absoluteFillObject}
          />

          <View style={styles.heroTop}>
            <View style={styles.heroStars}>
              {[1, 2, 3, 4, 5].map(n => (
                <AntDesign
                  key={n}
                  name="star"
                  size={13}
                  color={
                    n < 5
                      ? COLORS.blueLight
                      : '#35405A'
                  }
                />
              ))}
            </View>

            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>
                SEU DIÁRIO
              </Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>
            Seu próximo episódio começa aqui.
          </Text>

          <Text style={styles.heroSub}>
            Adicione filmes e séries ao seu diário para acompanhar seu progresso.
          </Text>

          <TouchableOpacity
            style={styles.heroAction}
            onPress={onAdicionar}
          >
            <Ionicons
              name="play"
              size={19}
              color="#fff"
            />
          </TouchableOpacity>
        </View>

        {/* MEU DIÁRIO */}

        {renderTituloSecao('MEU DIÁRIO')}

        <View style={styles.statsGrid}>
          {/* FILMES */}

          <TouchableOpacity
            activeOpacity={0.78}
            style={styles.statCard}
            onPress={() => abrirLista('filmes')}
          >
            <Feather
              name="film"
              size={17}
              color={COLORS.blue}
            />

            <Text style={styles.statNumber}>
              {carregandoDiario ? '...' : totalFilmes}
            </Text>

            <Text style={styles.statLabel}>
              filmes assistidos
            </Text>

            <Text style={styles.statVerTexto}>
              Ver lista
            </Text>

            <View
              style={[
                styles.statLine,
                { backgroundColor: COLORS.blue },
              ]}
            />
          </TouchableOpacity>

          {/* SÉRIES */}

          <TouchableOpacity
            activeOpacity={0.78}
            style={styles.statCard}
            onPress={() => abrirLista('series')}
          >
            <Feather
              name="tv"
              size={17}
              color={COLORS.green}
            />

            <Text style={styles.statNumber}>
              {carregandoDiario ? '...' : totalSeries}
            </Text>

            <Text style={styles.statLabel}>
              séries avaliadas
            </Text>

            <Text style={styles.statVerTexto}>
              Ver lista
            </Text>

            <View
              style={[
                styles.statLine,
                { backgroundColor: COLORS.green },
              ]}
            />
          </TouchableOpacity>

          {/* HORAS */}

          <TouchableOpacity
            activeOpacity={0.78}
            style={styles.statCard}
            onPress={() => abrirLista('todos')}
          >
            <Feather
              name="clock"
              size={17}
              color={COLORS.pink}
            />

            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={styles.statNumberHoras}
            >
              {carregandoDiario ? '...' : tempoEmTela}
            </Text>

            <Text style={styles.statLabel}>
              horas em tela
            </Text>

            <Text style={styles.statVerTexto}>
              Ver diário
            </Text>

            <View
              style={[
                styles.statLine,
                { backgroundColor: COLORS.pink },
              ]}
            />
          </TouchableOpacity>
        </View>

        {/* FILMES EM ALTA */}

        {renderTituloSecao('FILMES EM ALTA')}
        {renderMidias(filmes, 'filme')}

        {/* SÉRIES EM ALTA */}

        {renderTituloSecao('SÉRIES EM ALTA')}
        {renderMidias(series, 'serie')}

        {/* CONEXÕES */}

        {renderTituloSecao('CONEXÕES')}

        {conexoes.length ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          >
            {conexoes.map((pessoa, i) => {
              const n =
                pessoa.username ||
                pessoa.nome ||
                pessoa.name ||
                'Usuário';

              const foto =
                pessoa.avatar_url ||
                pessoa.avatar;

              return (
                <TouchableOpacity
                  key={pessoa.id || i}
                  style={styles.friend}
                  onPress={() =>
                    abrirAba('Perfil', onAbrirPerfil)
                  }
                >
                  <View style={styles.friendAvatar}>
                    {foto ? (
                      <Image
                        source={{ uri: foto }}
                        style={styles.avatarImage}
                      />
                    ) : (
                      <Text style={styles.friendInitial}>
                        {iniciais(n)}
                      </Text>
                    )}
                  </View>

                  <Text
                    style={styles.friendName}
                    numberOfLines={1}
                  >
                    {n}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : (
          <Text style={styles.emptyText}>
            Suas conexões aparecerão aqui quando você começar a seguir pessoas.
          </Text>
        )}

        {/* ATIVIDADE RECENTE */}

        {renderTituloSecao('ATIVIDADE RECENTE')}

        {registros.length ? (
          registros.slice(0, 5).map((item, index) => (
            <TouchableOpacity
              key={`atividade-${item.tipo}-${item.id || index}`}
              activeOpacity={0.85}
              style={styles.activityCard}
              onPress={() => abrirMidia(item)}
            >
              <View style={styles.activityIcon}>
                <Feather
                  name="activity"
                  size={17}
                  color={COLORS.blueLight}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.activityText}>
                  Você avaliou {item.title || 'uma produção'}
                </Text>

                <Text style={styles.recordDate}>
                  {formatarData(
                    item.data ||
                    item.atualizado_em
                  )}
                </Text>
              </View>

              <Feather
                name="chevron-right"
                size={16}
                color={COLORS.muted}
              />
            </TouchableOpacity>
          ))
        ) : atividadesUsuario.length ? (
          atividadesUsuario.slice(0, 5).map((item, index) => (
            <View
              key={item.id || index}
              style={styles.activityCard}
            >
              <View style={styles.activityIcon}>
                <Feather
                  name="activity"
                  size={17}
                  color={COLORS.blueLight}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.activityText}>
                  {item.descricao ||
                    item.texto ||
                    item.action ||
                    'Nova atividade'}
                </Text>

                <Text style={styles.recordDate}>
                  {formatarData(
                    item.created_at || item.data
                  )}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>
            Ainda não há atividades para mostrar.
          </Text>
        )}

        {/* ÚLTIMOS REGISTROS */}

        {renderTituloSecao('ÚLTIMOS REGISTROS')}

        {carregandoDiario ? (
          <ActivityIndicator
            color={COLORS.blue}
            style={{ marginVertical: 20 }}
          />
        ) : registros.length ? (
          registros.slice(0, 5).map(renderRegistro)
        ) : (
          <View style={styles.emptyCard}>
            <Feather
              name="book-open"
              size={25}
              color={COLORS.muted}
            />

            <Text style={styles.emptyTitle}>
              Seu diário está esperando por você
            </Text>

            <Text style={styles.emptyText}>
              Quando você avaliar um filme ou uma série, ele aparecerá aqui.
            </Text>

            <TouchableOpacity
              style={styles.emptyButton}
              onPress={onAdicionar}
            >
              <Feather
                name="plus"
                size={15}
                color="#FFFFFF"
              />

              <Text style={styles.emptyButtonText}>
                Adicionar produção
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 112 }} />
      </Animated.ScrollView>

      {/* ======================================================
          MODAL DO DIÁRIO
      ====================================================== */}

      <Modal
        visible={Boolean(listaAberta)}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={fecharLista}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* CABEÇALHO */}

            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalEyebrow}>
                  CINETRACK · MEU DIÁRIO
                </Text>

                <Text style={styles.modalTitle}>
                  {tituloDaLista}
                </Text>

                <Text style={styles.modalSubtitle}>
                  {midiasDaLista.length}{' '}
                  {midiasDaLista.length === 1
                    ? 'produção encontrada'
                    : 'produções encontradas'}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.modalClose}
                onPress={fecharLista}
                activeOpacity={0.8}
              >
                <Feather
                  name="x"
                  size={21}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.modalDivider} />

            {/* CONTEÚDO */}

            {carregandoDiario ? (
              <ActivityIndicator
                size="large"
                color={COLORS.blueLight}
                style={{ marginVertical: 35 }}
              />
            ) : midiasDaLista.length ? (
              <ScrollView
                style={styles.modalScroll}
                contentContainerStyle={styles.modalList}
                showsVerticalScrollIndicator={false}
              >
                {midiasDaLista.map((item, index) => {
                  const titulo =
                    item.title ||
                    item.titulo ||
                    'Obra sem título';

                  const imagem = obterImagem(
                    item.poster_path ||
                    item.poster ||
                    item.poster_url
                  );

                  return (
                    <TouchableOpacity
                      key={`${item.tipo}-${item.id}-${index}`}
                      activeOpacity={0.8}
                      style={styles.modalItem}
                      onPress={() => {
                        fecharLista();
                        abrirMidia(item);
                      }}
                    >
                      {imagem ? (
                        <Image
                          source={{ uri: imagem }}
                          style={styles.modalPoster}
                        />
                      ) : (
                        <View
                          style={[
                            styles.modalPoster,
                            styles.posterPlaceholder,
                          ]}
                        >
                          <Ionicons
                            name={
                              item.tipo === 'tv'
                                ? 'tv-outline'
                                : 'film-outline'
                            }
                            size={25}
                            color={COLORS.muted}
                          />
                        </View>
                      )}

                      <View style={styles.modalInfo}>
                        <Text
                          style={styles.modalItemTitle}
                          numberOfLines={2}
                        >
                          {titulo}
                        </Text>

                        <Text style={styles.modalItemType}>
                          {item.tipo === 'tv' ? 'SÉRIE' : 'FILME'}
                        </Text>

                        <View style={styles.modalRatingRow}>
                          <AntDesign
                            name="star"
                            size={13}
                            color={COLORS.yellow}
                          />

                          <Text style={styles.modalRating}>
                            {item.nota ?? item.rating ?? '—'} / 5
                          </Text>
                        </View>

                        <Text style={styles.modalItemDate}>
                          {formatarData(
                            item.data ||
                            item.atualizado_em
                          )}
                        </Text>
                      </View>

                      <Feather
                        name="chevron-right"
                        size={18}
                        color={COLORS.muted}
                      />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : (
              <View style={styles.modalEmpty}>
                <Feather
                  name="film"
                  size={35}
                  color={COLORS.muted}
                />

                <Text style={styles.modalEmptyTitle}>
                  Nenhuma produção encontrada
                </Text>

                <Text style={styles.modalEmptyText}>
                  As obras que você avaliar aparecerão nesta lista.
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.modalFooterButton}
              onPress={fecharLista}
              activeOpacity={0.8}
            >
              <Text style={styles.modalFooterText}>
                Fechar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MENU INFERIOR */}

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => abrirAba('Home')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="home"
            size={22}
            color={
              abaAtiva === 'Home'
                ? COLORS.blueLight
                : COLORS.muted
            }
          />

          <Text
            style={[
              styles.tabLabel,
              abaAtiva === 'Home' && styles.tabActive,
            ]}
          >
            Home
          </Text>
        </TouchableOpacity>

        {/* BUSCAR */}

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => abrirAba('Buscar')}
          activeOpacity={0.8}
        >
          <Feather
            name="search"
            size={21}
            color={
              abaAtiva === 'Buscar'
                ? COLORS.blueLight
                : COLORS.muted
            }
          />

          <Text
            style={[
              styles.tabLabel,
              abaAtiva === 'Buscar' && styles.tabActive,
            ]}
          >
            Buscar
          </Text>
        </TouchableOpacity>

        {/* ADICIONAR */}

        <TouchableOpacity
          style={styles.addButton}
          onPress={onAdicionar}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[
              '#3984FF',
              '#2563EB',
            ]}
            style={styles.addButtonGradient}
          >
            <Feather
              name="plus"
              size={26}
              color="#fff"
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
              abaAtiva === 'Diário'
                ? COLORS.blueLight
                : COLORS.muted
            }
          />

          <Text
            style={[
              styles.tabLabel,
              abaAtiva === 'Diário' && styles.tabActive,
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
              abaAtiva === 'Perfil'
                ? COLORS.blueLight
                : COLORS.muted
            }
          />

          <Text
            style={[
              styles.tabLabel,
              abaAtiva === 'Perfil' && styles.tabActive,
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
// ESTILOS
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

  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.blue,
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
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },

  scrollContent: {
    paddingHorizontal: 19,
    paddingTop: 20,
    paddingBottom: 20,
  },

  welcome: {
    marginBottom: 3,
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

  greetingName: {
    color: COLORS.blueLight,
  },

  welcomeSub: {
    color: COLORS.secondary,
    fontSize: 12,
    marginTop: 5,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 25,
    marginBottom: 13,
  },

  sectionTitle: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.8,
  },

  sectionRule: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },

  // DESTAQUE

  heroCard: {
    minHeight: 185,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 17,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },

  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  heroStars: {
    flexDirection: 'row',
    gap: 3,
  },

  heroBadge: {
    backgroundColor: 'rgba(59,130,246,0.18)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  heroBadgeText: {
    color: COLORS.blueLight,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },

  heroTitle: {
    color: '#fff',
    fontSize: 21,
    fontWeight: '800',
    maxWidth: '82%',
    marginTop: 19,
  },

  heroSub: {
    color: COLORS.secondary,
    fontSize: 12,
    lineHeight: 18,
    maxWidth: '82%',
    marginTop: 5,
  },

  heroAction: {
    position: 'absolute',
    right: 17,
    bottom: 18,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },

  // ESTATÍSTICAS

  statsGrid: {
    flexDirection: 'row',
    gap: 9,
  },

  statCard: {
    flex: 1,
    minHeight: 122,
    padding: 11,
    borderRadius: 16,
    backgroundColor: COLORS.elevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },

  statNumber: {
    color: '#fff',
    fontSize: 25,
    fontWeight: '900',
    marginTop: 8,
  },

  statNumberHoras: {
    color: '#fff',
    fontSize: 21,
    fontWeight: '900',
    marginTop: 8,
  },

  statLabel: {
    color: COLORS.text,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 3,
    minHeight: 24,
  },

  statVerTexto: {
    color: COLORS.blueLight,
    fontSize: 9,
    fontWeight: '800',
    marginTop: 7,
  },

  statLine: {
    position: 'absolute',
    bottom: 0,
    left: 12,
    width: 42,
    height: 2,
    borderRadius: 2,
  },

  // CATÁLOGO

  horizontalList: {
    gap: 12,
    paddingRight: 5,
  },

  mediaCard: {
    width: CARD_WIDTH,
    borderRadius: 15,
    backgroundColor: COLORS.elevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    paddingBottom: 10,
  },

  poster: {
    width: '100%',
    aspectRatio: 2 / 3,
  },

  posterPlaceholder: {
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },

  mediaTitle: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 9,
    paddingTop: 9,
  },

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingTop: 5,
  },

  rating: {
    color: COLORS.blueLight,
    fontSize: 10,
    fontWeight: '700',
  },

  rank: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 23,
    height: 23,
    borderRadius: 7,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  rankText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
  },

  emptyText: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    marginVertical: 8,
  },

  // CONEXÕES

  friend: {
    width: 62,
    alignItems: 'center',
  },

  friendAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.elevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },

  friendInitial: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },

  friendName: {
    color: COLORS.secondary,
    fontSize: 10,
    maxWidth: 62,
  },

  // ATIVIDADES

  activityCard: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    backgroundColor: COLORS.elevated,
    padding: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 9,
  },

  activityIcon: {
    width: 35,
    height: 35,
    borderRadius: 12,
    backgroundColor: 'rgba(59,130,246,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  activityText: {
    color: COLORS.text,
    fontSize: 12,
    lineHeight: 18,
  },

  // REGISTROS

  recordCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    backgroundColor: COLORS.elevated,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 9,
    alignItems: 'center',
  },

  recordPoster: {
    width: 55,
    height: 78,
    borderRadius: 9,
    backgroundColor: COLORS.surface,
  },

  recordInfo: {
    flex: 1,
    justifyContent: 'center',
  },

  recordTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '800',
  },

  recordDate: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 4,
  },

  recordRating: {
    color: COLORS.yellow,
    fontSize: 11,
    marginTop: 5,
    fontWeight: '700',
  },

  recordType: {
    color: COLORS.blueLight,
    fontSize: 9,
    fontWeight: '800',
    marginTop: 5,
    letterSpacing: 0.7,
  },

  // ESTADO VAZIO

  emptyCard: {
    alignItems: 'center',
    padding: 22,
    backgroundColor: COLORS.elevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },

  emptyTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },

  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: COLORS.blue,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 11,
    marginTop: 7,
  },

  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },

  // MODAL

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 35,
  },

  modalContainer: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: '#0D111A',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.18)',
    padding: 18,
    overflow: 'hidden',
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 13,
  },

  modalEyebrow: {
    color: COLORS.blueLight,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.6,
  },

  modalTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
    marginTop: 5,
  },

  modalSubtitle: {
    color: COLORS.secondary,
    fontSize: 11,
    marginTop: 4,
  },

  modalClose: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.elevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalDivider: {
    width: '100%',
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: 13,
  },

  modalScroll: {
    flexGrow: 0,
  },

  modalList: {
    paddingBottom: 8,
    gap: 10,
  },

  modalItem: {
    minHeight: 105,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    backgroundColor: COLORS.elevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  modalPoster: {
    width: 62,
    height: 88,
    borderRadius: 9,
    backgroundColor: COLORS.surface,
  },

  modalInfo: {
    flex: 1,
    justifyContent: 'center',
  },

  modalItemTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },

  modalItemType: {
    color: COLORS.blueLight,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.1,
    marginTop: 5,
  },

  modalRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },

  modalRating: {
    color: COLORS.yellow,
    fontSize: 11,
    fontWeight: '800',
  },

  modalItemDate: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 5,
  },

  modalEmpty: {
    alignItems: 'center',
    paddingVertical: 35,
    paddingHorizontal: 15,
    gap: 9,
  },

  modalEmptyTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },

  modalEmptyText: {
    color: COLORS.secondary,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 17,
  },

  modalFooterButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#172338',
    borderRadius: 12,
    marginTop: 13,
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.17)',
  },

  modalFooterText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  // MENU INFERIOR

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