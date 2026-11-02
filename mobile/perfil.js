
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import AsyncStorage from './userStorage';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';

import {
  Ionicons,
  Feather,
  MaterialCommunityIcons,
  AntDesign,
} from '@expo/vector-icons';

import Buscar from './buscar';
import { lerListas } from './listasStorage';

// ============================================================
// CONFIGURAÇÕES — PADRÃO VISUAL DO CINETRACK
// ============================================================

const TMDB_KEY = '5c1853c10d9752023da5ddce4ada3b77';
const TMDB_IMAGE = 'https://image.tmdb.org/t/p/';
const TMDB_BASE = 'https://api.themoviedb.org/3';

const CHAVE_AVALIACOES = '@CineTrack:avaliacoes';
const CHAVE_REGISTROS = '@CineTrack:registros';
const CHAVE_PERFIL = '@CineTrack:perfil';

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

const PERFIL_PADRAO = {
  bio: '',
  avatar: null,
  capa: null,
};

// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================

const lerJSON = texto => {
  if (!texto) return null;

  try {
    return JSON.parse(texto);
  } catch (erro) {
    console.warn('Erro ao interpretar dados:', erro);
    return null;
  }
};

const nomeUsuario = usuario =>
  usuario?.nome ||
  usuario?.name ||
  usuario?.username ||
  usuario?.email?.split('@')?.[0] ||
  'Cinéfilo';

const identificadorUsuario = usuario => {
  const nome =
    usuario?.username ||
    usuario?.email?.split('@')?.[0] ||
    nomeUsuario(usuario);

  return `@${String(nome).replace(/^@/, '')}`;
};

const iniciais = nome =>
  String(nome || 'C')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(parte => parte[0]?.toUpperCase() || '')
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
    : `${TMDB_IMAGE}w500${valor}`;
};

// ============================================================
// NORMALIZAÇÃO DO TIPO DE MÍDIA
// ============================================================

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
// OBTER ENTRADAS DOS DADOS SALVOS
// ============================================================

function obterEntradas(dados) {
  if (!dados) return [];

  if (Array.isArray(dados)) {
    return dados.map((item, index) => [
      String(item?.id ?? item?.tmdb_id ?? index),
      item,
    ]);
  }

  if (typeof dados !== 'object') return [];

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
        String(item?.id ?? item?.tmdb_id ?? index),
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

  // CORREÇÃO: identificação correta de chaves movie-123 e tv-123.
  const correspondencia = String(chave).match(
    /^(movie|tv|serie|série|filme)[-_](.+)$/i
  );

  const id =
    combinado.tmdb_id ??
    combinado.tmdbId ??
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

  const dataAssistido =
    combinado.watch_date ||
    combinado.watched_at ||
    combinado.assistido_em ||
    combinado.data_assistido ||
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
    Boolean(dataAssistido);

  const titulo =
    combinado.title ||
    combinado.name ||
    combinado.titulo ||
    combinado.media_title ||
    'Obra sem título';

  const poster =
    combinado.poster_path ||
    combinado.poster_url ||
    combinado.poster ||
    null;

  const data =
    dataAssistido ||
    combinado.data ||
    combinado.atualizado_em ||
    combinado.created_at ||
    combinado.updated_at ||
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
    status,
    assistido,

    runtime_total_minutos: Number(
      combinado.runtime_total_minutos ||
      combinado.duracao_total_minutos ||
      combinado.duration_total_minutes ||
      0
    ),

    duracao_minutos: Number(
      combinado.duracao_minutos ||
      combinado.duration_minutes ||
      combinado.runtime ||
      0
    ),
  };
}

// ============================================================
// REMOVER REGISTROS DUPLICADOS
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
      titulo: item.title || anterior.titulo,
      poster_path: item.poster_path || anterior.poster_path,

      nota: item.nota ?? anterior.nota,
      review: item.review || anterior.review,
      data: item.data || anterior.data,

      runtime_total_minutos:
        item.runtime_total_minutos ||
        anterior.runtime_total_minutos,
    });
  });

  return Array.from(mapa.values());
}

// ============================================================
// CORREÇÃO PRINCIPAL — DURAÇÃO TOTAL DAS SÉRIES
// ============================================================

// Evita consultar a mesma série repetidamente.
const cacheDuracaoSeries = new Map();

async function completarDuracaoSerie(item) {
  if (!item || item.tipo !== 'tv') {
    return item;
  }

  const duracaoExistente = Number(
    item.runtime_total_minutos ||
    item.duracao_total_minutos ||
    item.duration_total_minutes ||
    item.total_runtime_minutes ||
    0
  );

  if (duracaoExistente > 0) {
    return {
      ...item,
      runtime_total_minutos: duracaoExistente,
    };
  }

  const id = item.tmdb_id || item.id;

  if (!id) return item;

  const chave = String(id);

  if (cacheDuracaoSeries.has(chave)) {
    return {
      ...item,
      runtime_total_minutos: cacheDuracaoSeries.get(chave),
    };
  }

  try {
    const resposta = await fetch(
      `${TMDB_BASE}/tv/${encodeURIComponent(chave)}?api_key=${TMDB_KEY}&language=pt-BR`
    );

    if (!resposta.ok) {
      throw new Error(
        `TMDB respondeu com status ${resposta.status}`
      );
    }

    const dados = await resposta.json();

    const duracoesEpisodios = Array.isArray(
      dados.episode_run_time
    )
      ? dados.episode_run_time
          .map(Number)
          .filter(
            valor =>
              Number.isFinite(valor) &&
              valor > 0
          )
      : [];

    const quantidadeEpisodios = Number(
      dados.number_of_episodes || 0
    );

    if (
      duracoesEpisodios.length === 0 ||
      quantidadeEpisodios <= 0
    ) {
      return item;
    }

    const duracaoMedia =
      duracoesEpisodios.reduce(
        (total, valor) => total + valor,
        0
      ) / duracoesEpisodios.length;

    const duracaoTotal = Math.round(
      duracaoMedia * quantidadeEpisodios
    );

    if (
      !Number.isFinite(duracaoTotal) ||
      duracaoTotal <= 0
    ) {
      return item;
    }

    cacheDuracaoSeries.set(chave, duracaoTotal);

    console.log(
      `CineTrack: ${item.title || item.name} — ` +
      `${quantidadeEpisodios} episódios, ` +
      `${duracaoTotal} minutos totais.`
    );

    return {
      ...item,
      runtime_total_minutos: duracaoTotal,
      duracao_total_minutos: duracaoTotal,
      number_of_episodes: quantidadeEpisodios,
      episode_run_time: duracoesEpisodios,
    };
  } catch (erro) {
    console.warn(
      `Não foi possível calcular a duração da série ${chave}:`,
      erro.message
    );

    return item;
  }
}

// ============================================================
// FORMATAR TEMPO TOTAL
// ============================================================

function formatarTempoTotal(minutos) {
  const total = Math.max(
    0,
    Math.round(Number(minutos) || 0)
  );

  if (!total) return '—';

  const horas = Math.floor(total / 60);
  const resto = total % 60;

  if (horas === 0) return `${resto}min`;
  if (resto === 0) return `${horas}h`;

  return `${horas}h ${resto}m`;
}

// ============================================================
// OBTER GÊNEROS
// ============================================================

function obterGeneros(obras) {
  const nomes = [];

  obras.forEach(obra => {
    const generos = obra.genres || obra.generos || [];

    if (Array.isArray(generos)) {
      generos.forEach(genero => {
        const nome =
          typeof genero === 'string'
            ? genero
            : genero?.name;

        if (nome) nomes.push(nome);
      });
    } else if (typeof generos === 'string') {
      generos.split(',').forEach(nome => {
        if (nome.trim()) nomes.push(nome.trim());
      });
    }
  });

  return [...new Set(nomes)].slice(0, 5);
}

// ============================================================
// COMPONENTE PERFIL
// ============================================================

export default function Perfil({
  usuario = null,
  onVoltar,
  onAbrirHome,
  onAbrirDiario,
  onAdicionar,
  onAbrirDetalhes,
  onLogout,
}) {
  const [registrosLocais, setRegistrosLocais] = useState([]);
  const [listas, setListas] = useState([]);
  const [perfilSalvo, setPerfilSalvo] = useState(PERFIL_PADRAO);

  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

  const [telaInterna, setTelaInterna] = useState('Perfil');

  const [modalEditar, setModalEditar] = useState(false);
  const [modalCapas, setModalCapas] = useState(false);
  const [listaSelecionada, setListaSelecionada] = useState(null);

  const [bioEditada, setBioEditada] = useState('');
  const [opcoesCapa, setOpcoesCapa] = useState([]);
  const [buscandoCapas, setBuscandoCapas] = useState(false);

  const nome = nomeUsuario(usuario);
  const identificador = identificadorUsuario(usuario);

  // ==========================================================
  // CARREGAR DADOS DO USUÁRIO
  // ==========================================================

  const carregarDados = useCallback(async () => {
    try {
      const [valores, listasSalvas] = await Promise.all([
        AsyncStorage.multiGet([
          CHAVE_REGISTROS,
          CHAVE_AVALIACOES,
          CHAVE_PERFIL,
        ]),
        lerListas(),
      ]);

      const mapa = Object.fromEntries(valores);

      const dadosRegistros = lerJSON(mapa[CHAVE_REGISTROS]);
      const dadosAvaliacoes = lerJSON(mapa[CHAVE_AVALIACOES]);

      const entradas = [
        ...obterEntradas(dadosRegistros),
        ...obterEntradas(dadosAvaliacoes),
      ];

      const normalizados = entradas
        .map(([chave, item]) =>
          normalizarRegistro(item, chave)
        )
        .filter(Boolean);

      const obrasUnicas = removerDuplicados(normalizados);

      // Mostra imediatamente os registros locais.
      setRegistrosLocais(obrasUnicas);

      // Consulta o tempo total das séries assistidas.
      const obrasComDuracao = await Promise.all(
        obrasUnicas.map(item => {
          if (item.tipo === 'tv' && item.assistido) {
            return completarDuracaoSerie(item);
          }

          return item;
        })
      );

      // Atualiza as estatísticas com as durações calculadas.
      setRegistrosLocais(
        removerDuplicados(obrasComDuracao)
      );

      setListas(
        Array.isArray(listasSalvas)
          ? listasSalvas
          : []
      );

      const perfilLido = lerJSON(mapa[CHAVE_PERFIL]) || {};

      setPerfilSalvo({
        ...PERFIL_PADRAO,
        bio: perfilLido.bio ?? usuario?.bio ?? '',
        avatar:
          perfilLido.avatar ||
          usuario?.avatar_url ||
          usuario?.avatar ||
          usuario?.foto ||
          null,
        capa: perfilLido.capa || null,
      });
    } catch (erro) {
      console.error('Erro ao carregar perfil:', erro);

      Alert.alert(
        'Ops!',
        'Não foi possível carregar todos os dados do perfil.'
      );
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, [usuario]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // ==========================================================
  // DADOS E ESTATÍSTICAS
  // ==========================================================

  const obras = useMemo(
    () => removerDuplicados(registrosLocais),
    [registrosLocais]
  );

  const assistidos = useMemo(
    () => obras.filter(item => item.assistido),
    [obras]
  );

  const filmes = useMemo(
    () => assistidos.filter(item => item.tipo === 'movie'),
    [assistidos]
  );

  const series = useMemo(
    () => assistidos.filter(item => item.tipo === 'tv'),
    [assistidos]
  );

  const notas = obras
    .map(item => Number(item.nota))
    .filter(nota => Number.isFinite(nota) && nota > 0);

  const mediaNota = notas.length
    ? (
        notas.reduce((total, nota) => total + nota, 0) /
        notas.length
      ).toFixed(1)
    : '—';

  const anoAtual = new Date().getFullYear();

  const desteAno = assistidos.filter(item => {
    if (!item.data) return false;

    const data = new Date(item.data);

    return (
      !Number.isNaN(data.getTime()) &&
      data.getFullYear() === anoAtual
    );
  });

  const notaAno = desteAno
    .map(item => Number(item.nota))
    .filter(nota => Number.isFinite(nota) && nota > 0);

  const mediaAno = notaAno.length
    ? (
        notaAno.reduce((total, nota) => total + nota, 0) /
        notaAno.length
      ).toFixed(1)
    : '—';

  const recentes = useMemo(
    () =>
      [...assistidos].sort((a, b) => {
        const dataA = new Date(a.data || 0).getTime() || 0;
        const dataB = new Date(b.data || 0).getTime() || 0;
        return dataB - dataA;
      }),
    [assistidos]
  );

  const generos = useMemo(
    () => obterGeneros(assistidos),
    [assistidos]
  );

  // ==========================================================
  // CORREÇÃO — TOTAL DE HORAS ASSISTIDAS
  // ==========================================================

  const totalMinutos = assistidos.reduce((total, item) => {
    let duracao = 0;

    if (item.tipo === 'tv') {
      // Séries: usa a duração de todos os episódios.
      duracao = Number(
        item.runtime_total_minutos ||
        item.duracao_total_minutos ||
        item.duration_total_minutes ||
        item.total_runtime_minutes ||
        0
      );
    } else {
      // Filmes: usa a duração do próprio filme.
      duracao = Number(
        item.runtime_total_minutos ||
        item.duracao_total_minutos ||
        item.duracao_minutos ||
        item.duration_minutes ||
        item.runtime ||
        0
      );
    }

    return total + (
      Number.isFinite(duracao) && duracao > 0
        ? duracao
        : 0
    );
  }, 0);

  const tempoTela = formatarTempoTotal(totalMinutos);

  // ==========================================================
  // SALVAR E EDITAR PERFIL
  // ==========================================================

  const salvarPerfil = async alteracoes => {
    const atualizado = {
      ...perfilSalvo,
      ...alteracoes,
    };

    setPerfilSalvo(atualizado);

    try {
      await AsyncStorage.setItem(
        CHAVE_PERFIL,
        JSON.stringify(atualizado)
      );
    } catch (erro) {
      console.warn('Erro ao salvar perfil:', erro);

      Alert.alert(
        'Erro',
        'Não foi possível salvar essa alteração.'
      );
    }
  };

  // ==========================================================
  // ESCOLHER FOTO DO PERFIL OU CAPA
  // ==========================================================

  const escolherImagem = async campo => {
    try {
      const permissao =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissao.granted) {
        Alert.alert(
          'Permissão necessária',
          'Autorize o acesso à galeria para escolher uma imagem.'
        );

        return;
      }

      const resultado =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: campo === 'avatar' ? [1, 1] : [16, 5],
          quality: 0.88,
        });

      if (
        !resultado.canceled &&
        resultado.assets?.[0]?.uri
      ) {
        await salvarPerfil({
          [campo]: resultado.assets[0].uri,
        });
      }
    } catch (erro) {
      console.warn('Erro ao selecionar imagem:', erro);

      Alert.alert(
        'Erro',
        'Não foi possível abrir sua galeria.'
      );
    }
  };

  // ==========================================================
  // ESCOLHER UMA CAPA DO CATÁLOGO
  // ==========================================================

  const abrirOpcoesCapa = async () => {
    setModalCapas(true);

    if (opcoesCapa.length > 0) return;

    setBuscandoCapas(true);

    try {
      const [respostaFilmes, respostaSeries] = await Promise.all([
        fetch(
          `${TMDB_BASE}/trending/movie/week?api_key=${TMDB_KEY}&language=pt-BR`
        ),
        fetch(
          `${TMDB_BASE}/trending/tv/week?api_key=${TMDB_KEY}&language=pt-BR`
        ),
      ]);

      if (!respostaFilmes.ok || !respostaSeries.ok) {
        throw new Error('Falha ao consultar catálogo.');
      }

      const [dadosFilmes, dadosSeries] = await Promise.all([
        respostaFilmes.json(),
        respostaSeries.json(),
      ]);

      const destaques = [
        ...(dadosFilmes.results || []).map(item => ({
          ...item,
          tipo: 'movie',
        })),
        ...(dadosSeries.results || []).map(item => ({
          ...item,
          tipo: 'tv',
        })),
      ]
        .filter(item => item.backdrop_path || item.poster_path)
        .slice(0, 24);

      setOpcoesCapa(destaques);
    } catch (erro) {
      console.warn('Erro ao carregar capas:', erro);

      Alert.alert(
        'Erro',
        'Não foi possível carregar as sugestões de capa.'
      );
    } finally {
      setBuscandoCapas(false);
    }
  };

  const selecionarCapa = async item => {
    const caminho = item.backdrop_path || item.poster_path;

    if (!caminho) return;

    await salvarPerfil({
      capa: `${TMDB_IMAGE}w780${caminho}`,
    });

    setModalCapas(false);
  };

  // ==========================================================
  // ABRIR DETALHES DE UMA OBRA
  // ==========================================================

  const abrirMidia = item => {
    if (!item) return;

    const id =
      item.id ??
      item.tmdb_id ??
      item.media_id;

    if (!id) return;

    const tipo = normalizarTipo(
      item.tipo || item.media_type,
      '',
      item
    );

    if (typeof onAbrirDetalhes === 'function') {
      onAbrirDetalhes({
        ...item,
        id,
        tipo,
        media: item,
      });
    }
  };

  // ==========================================================
  // NAVEGAÇÃO
  // ==========================================================

  const abrirBusca = () => {
    setTelaInterna('Buscar');
  };

  const voltarDaBusca = () => {
    setTelaInterna('Perfil');
    carregarDados();
  };

  const abrirHome = () => {
    if (typeof onAbrirHome === 'function') {
      onAbrirHome();
    } else if (typeof onVoltar === 'function') {
      onVoltar();
    }
  };

  const abrirDiario = () => {
    if (typeof onAbrirDiario === 'function') {
      onAbrirDiario();
    }
  };

  const abrirAdicionar = () => {
    if (typeof onAdicionar === 'function') {
      onAdicionar();
    }
  };

  const sairDaConta = () => {
    Alert.alert(
      'Sair da conta',
      'Deseja realmente sair do CineTrack?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: onLogout,
        },
      ]
    );
  };

  // ==========================================================
  // COMPONENTES VISUAIS LOCAIS
  // ==========================================================

  const renderEstrelas = nota => (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map(numero => (
        <AntDesign
          key={numero}
          name={
            Number(nota || 0) >= numero
              ? 'star'
              : 'staro'
          }
          size={10}
          color={COLORS.blueLight}
        />
      ))}
    </View>
  );

  const renderSecao = (titulo, acao, callback) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>
        {titulo}
      </Text>

      <View style={styles.sectionRule} />

      {acao ? (
        <TouchableOpacity
          onPress={callback}
          activeOpacity={0.75}
        >
          <Text style={styles.sectionAction}>
            {acao}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  // ==========================================================
  // TELA DE BUSCA
  // ==========================================================

  if (telaInterna === 'Buscar') {
    return (
      <Buscar
        onVoltar={voltarDaBusca}
        onAbrirDetalhes={onAbrirDetalhes}
      />
    );
  }

  // ==========================================================
  // CARREGAMENTO
  // ==========================================================

  if (carregando) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={COLORS.bg}
        />

        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={COLORS.blue}
          />

          <Text style={styles.loadingText}>
            Preparando seu universo audiovisual...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================================
  // INTERFACE PRINCIPAL
  // ==========================================================

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.bg}
        translucent={false}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={async () => {
              setAtualizando(true);
              await carregarDados();
            }}
            tintColor={COLORS.blue}
            colors={[COLORS.blue]}
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* ==================================================
            BANNER
        ================================================== */}

        <View style={styles.profileHero}>
          <ImageBackground
            source={
              perfilSalvo.capa
                ? { uri: perfilSalvo.capa }
                : undefined
            }
            style={styles.banner}
            imageStyle={styles.bannerImage}
          >
            {!perfilSalvo.capa && (
              <LinearGradient
                colors={[
                  '#17113B',
                  '#111B3E',
                  '#07111F',
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
            )}

            <View
              pointerEvents="none"
              style={styles.bannerOrb}
            />

            <View style={styles.bannerActions}>
              <TouchableOpacity
                style={styles.bannerAction}
                onPress={abrirOpcoesCapa}
                activeOpacity={0.8}
              >
                <Feather
                  name="image"
                  size={17}
                  color={COLORS.text}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.bannerAction}
                onPress={sairDaConta}
                activeOpacity={0.8}
              >
                <Feather
                  name="more-horizontal"
                  size={19}
                  color={COLORS.text}
                />
              </TouchableOpacity>
            </View>
          </ImageBackground>

          {/* AVATAR E NOME */}

          <View style={styles.identityRow}>
            <TouchableOpacity
              style={styles.avatarOuter}
              onPress={() => escolherImagem('avatar')}
              activeOpacity={0.85}
            >
              {perfilSalvo.avatar ? (
                <Image
                  source={{ uri: perfilSalvo.avatar }}
                  style={styles.avatarImage}
                />
              ) : (
                <LinearGradient
                  colors={[
                    '#3984FF',
                    '#2563EB',
                  ]}
                  style={styles.avatarFallback}
                >
                  <Text style={styles.avatarInitials}>
                    {iniciais(nome)}
                  </Text>
                </LinearGradient>
              )}

              <View style={styles.avatarCamera}>
                <Feather
                  name="camera"
                  size={12}
                  color="#FFFFFF"
                />
              </View>
            </TouchableOpacity>

            <View style={styles.identityText}>
              <Text
                style={styles.profileName}
                numberOfLines={1}
              >
                {nome}
              </Text>

              <Text
                style={styles.profileHandle}
                numberOfLines={1}
              >
                {identificador}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.editProfileButton}
              onPress={() => {
                setBioEditada(perfilSalvo.bio || '');
                setModalEditar(true);
              }}
              activeOpacity={0.8}
            >
              <Feather
                name="edit-2"
                size={14}
                color={COLORS.secondary}
              />

              <Text style={styles.editProfileText}>
                Editar perfil
              </Text>
            </TouchableOpacity>
          </View>

          {/* BIOGRAFIA */}

          <Text style={styles.bioText}>
            {perfilSalvo.bio ||
              'Conte um pouco sobre seu universo audiovisual.'}
          </Text>

          {/* ESTATÍSTICAS */}

          <View style={styles.metricsBar}>
            <Metric
              value={filmes.length}
              label="FILMES"
            />

            <Metric
              value={series.length}
              label="SÉRIES"
            />

            <Metric
              value={tempoTela}
              label="EM TELA"
            />

            <Metric
              value={listas.length}
              label="LISTAS"
              last
            />
          </View>

          {/* GÊNEROS PREFERIDOS */}

          {generos.length > 0 && (
            <View style={styles.genresWrap}>
              {generos.map((genero, index) => (
                <View
                  key={`${genero}-${index}`}
                  style={[
                    styles.genreChip,
                    index % 3 === 0 && styles.genreBlue,
                    index % 3 === 1 && styles.genrePurple,
                    index % 3 === 2 && styles.genrePink,
                  ]}
                >
                  <Text style={styles.genreText}>
                    {genero}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ==================================================
            CINETRACK WRAPPED
        ================================================== */}

        <View style={styles.section}>
          {renderSecao(`CINE TRACK WRAPPED · ${anoAtual}`)}

          <LinearGradient
            colors={[
              '#11072A',
              '#211044',
              '#10152F',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.wrappedCard}
          >
            <View
              pointerEvents="none"
              style={styles.wrappedOrb}
            />

            <Text style={styles.wrappedEyebrow}>
              ✦ SEU ANO EM AUDIOVISUAL
            </Text>

            <Text style={styles.wrappedTitle}>
              {desteAno.length > 0
                ? `${anoAtual} está sendo seu ano no CineTrack`
                : `Sua jornada em ${anoAtual}`}
            </Text>

            <View style={styles.wrappedMetrics}>
              <WrappedMetric
                value={desteAno.length}
                label="obras registradas"
              />

              <WrappedMetric
                value={
                  desteAno.filter(item => item.tipo === 'movie').length
                }
                label="filmes"
              />

              <WrappedMetric
                value={mediaAno === '—' ? '—' : `${mediaAno}★`}
                label="nota média"
              />
            </View>

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(
                      100,
                      desteAno.length * 5
                    )}%`,
                  },
                ]}
              />
            </View>

            <Text style={styles.wrappedFooter}>
              Dados calculados a partir dos seus registros salvos.
            </Text>
          </LinearGradient>
        </View>

        {/* ==================================================
            ASSISTIDOS RECENTEMENTE
        ================================================== */}

        <View style={styles.section}>
          {renderSecao(
            'ASSISTIDOS RECENTEMENTE',
            'Ver todos',
            abrirDiario
          )}

          {recentes.length > 0 ? (
            <View style={styles.posterGrid}>
              {recentes.slice(0, 8).map((item, index) => {
                const imagem = obterImagem(
                  item.poster_path ||
                  item.poster ||
                  item.poster_url
                );

                return (
                  <TouchableOpacity
                    key={`${item.tipo}-${item.id}-${index}`}
                    style={styles.posterTile}
                    activeOpacity={0.85}
                    onPress={() => abrirMidia(item)}
                  >
                    {imagem ? (
                      <Image
                        source={{ uri: imagem }}
                        style={styles.posterImage}
                      />
                    ) : (
                      <View style={styles.posterPlaceholder}>
                        <Ionicons
                          name={
                            item.tipo === 'tv'
                              ? 'tv-outline'
                              : 'film-outline'
                          }
                          size={23}
                          color={COLORS.muted}
                        />
                      </View>
                    )}

                    {item.nota ? (
                      <View style={styles.posterScore}>
                        {renderEstrelas(item.nota)}
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="movie-open-outline"
                size={27}
                color={COLORS.muted}
              />

              <Text style={styles.emptyStateText}>
                Seus filmes e séries registrados aparecerão aqui.
              </Text>
            </View>
          )}
        </View>

        {/* ==================================================
            MINHAS LISTAS
        ================================================== */}

        <View style={styles.section}>
          {renderSecao('MINHAS LISTAS')}

          {listas.length > 0 ? (
            listas.map((lista, index) => {
              const itens = Array.isArray(lista.itens)
                ? lista.itens
                : [];

              return (
                <TouchableOpacity
                  key={`${lista.id || lista.nome}-${index}`}
                  style={styles.listCard}
                  activeOpacity={0.82}
                  onPress={() => {
                    setListaSelecionada({
                      ...lista,
                      itens,
                    });
                  }}
                >
                  <View style={styles.listMosaic}>
                    {[0, 1, 2, 3].map(posicao => {
                      const obra = itens[posicao];

                      const imagem = obra
                        ? obterImagem(
                            obra.poster_path ||
                            obra.poster ||
                            obra.poster_url
                          )
                        : null;

                      return (
                        <View
                          key={posicao}
                          style={styles.mosaicCell}
                        >
                          {imagem ? (
                            <Image
                              source={{ uri: imagem }}
                              style={styles.mosaicImage}
                            />
                          ) : (
                            <MaterialCommunityIcons
                              name="movie-open-outline"
                              size={15}
                              color={COLORS.muted}
                            />
                          )}
                        </View>
                      );
                    })}
                  </View>

                  <View style={styles.listInfo}>
                    <Text
                      style={styles.listName}
                      numberOfLines={1}
                    >
                      {lista.nome ||
                        lista.name ||
                        'Minha lista'}
                    </Text>

                    <Text style={styles.listMeta}>
                      {itens.length}{' '}
                      {itens.length === 1 ? 'obra' : 'obras'}
                    </Text>
                  </View>

                  <View style={styles.listRight}>
                    <Text style={styles.listBadge}>
                      LISTA
                    </Text>

                    <Feather
                      name="chevron-right"
                      size={17}
                      color={COLORS.muted}
                    />
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Feather
                name="layers"
                size={23}
                color={COLORS.muted}
              />

              <Text style={styles.emptyStateText}>
                Quando você criar listas, elas aparecerão aqui.
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: 105 }} />
      </ScrollView>

      {/* =====================================================
          MODAL DE EDIÇÃO DO PERFIL
      ===================================================== */}

      <Modal
        visible={modalEditar}
        transparent
        animationType="fade"
        onRequestClose={() => setModalEditar(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editModalCard}>
            <View style={styles.modalTitleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalEyebrow}>
                  CINETRACK · PERFIL
                </Text>

                <Text style={styles.editModalTitle}>
                  Editar apresentação
                </Text>
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalEditar(false)}
              >
                <Feather
                  name="x"
                  size={19}
                  color={COLORS.text}
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>
              SOBRE VOCÊ
            </Text>

            <TextInput
              value={bioEditada}
              onChangeText={setBioEditada}
              placeholder="Conte um pouco sobre seu universo audiovisual..."
              placeholderTextColor={COLORS.muted}
              multiline
              maxLength={180}
              textAlignVertical="top"
              style={styles.bioInput}
            />

            <Text style={styles.characterCount}>
              {bioEditada.length}/180
            </Text>

            <View style={styles.editActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalEditar(false)}
              >
                <Text style={styles.cancelButtonText}>
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={async () => {
                  await salvarPerfil({
                    bio: bioEditada.trim(),
                  });

                  setModalEditar(false);
                }}
              >
                <Text style={styles.saveButtonText}>
                  Salvar alterações
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* =====================================================
          MODAL DE DETALHES DA LISTA
      ===================================================== */}

      <Modal
        visible={Boolean(listaSelecionada)}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setListaSelecionada(null)}
      >
        <View style={styles.listModalOverlay}>
          <View style={styles.listModalSheet}>
            <View style={styles.sheetHandle} />

            <View style={styles.listModalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalEyebrow}>
                  COLEÇÃO CINETRACK
                </Text>

                <Text
                  style={styles.listModalTitle}
                  numberOfLines={2}
                >
                  {listaSelecionada?.nome ||
                    listaSelecionada?.name ||
                    'Minha lista'}
                </Text>

                <Text style={styles.listModalSubtitle}>
                  {listaSelecionada?.itens?.length || 0} obras · toque em uma obra para abrir
                </Text>
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setListaSelecionada(null)}
              >
                <Feather
                  name="x"
                  size={19}
                  color={COLORS.text}
                />
              </TouchableOpacity>
            </View>

            {listaSelecionada?.itens?.length > 0 ? (
              <ScrollView
                style={styles.listModalScroll}
                contentContainerStyle={styles.listModalContent}
                showsVerticalScrollIndicator={false}
              >
                {listaSelecionada.itens.map((itemOriginal, index) => {
                  const item =
                    normalizarRegistro(itemOriginal) ||
                    itemOriginal;

                  const imagem = obterImagem(
                    item.poster_path ||
                    item.poster ||
                    item.poster_url
                  );

                  const tipo = normalizarTipo(
                    item.tipo || item.media_type,
                    '',
                    item
                  );

                  const id =
                    item.id ??
                    item.tmdb_id ??
                    item.media_id;

                  return (
                    <TouchableOpacity
                      key={`${tipo}-${id || index}-${index}`}
                      style={styles.listModalItem}
                      activeOpacity={0.82}
                      onPress={() => {
                        setListaSelecionada(null);

                        abrirMidia({
                          ...item,
                          id,
                          tipo,
                        });
                      }}
                    >
                      {imagem ? (
                        <Image
                          source={{ uri: imagem }}
                          style={styles.listModalPoster}
                        />
                      ) : (
                        <View
                          style={[
                            styles.listModalPoster,
                            styles.posterPlaceholder,
                          ]}
                        >
                          <Ionicons
                            name={
                              tipo === 'tv'
                                ? 'tv-outline'
                                : 'film-outline'
                            }
                            size={22}
                            color={COLORS.muted}
                          />
                        </View>
                      )}

                      <View style={styles.listModalInfo}>
                        <Text
                          style={styles.listModalItemTitle}
                          numberOfLines={2}
                        >
                          {item.title ||
                            item.name ||
                            item.titulo ||
                            'Obra sem título'}
                        </Text>

                        <Text style={styles.listModalItemType}>
                          {tipo === 'tv' ? 'SÉRIE' : 'FILME'}
                          {(item.release_date || item.first_air_date)
                            ? ` · ${String(
                                item.release_date ||
                                item.first_air_date
                              ).slice(0, 4)}`
                            : ''}
                        </Text>

                        {Number(
                          item.nota ||
                          item.rating ||
                          item.stars
                        ) > 0 && (
                          <View style={styles.listModalRating}>
                            <AntDesign
                              name="star"
                              size={12}
                              color={COLORS.yellow}
                            />

                            <Text style={styles.listModalRatingText}>
                              {item.nota ??
                                item.rating ??
                                item.stars}/5
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
                  );
                })}
              </ScrollView>
            ) : (
              <View style={styles.modalEmpty}>
                <MaterialCommunityIcons
                  name="movie-open-outline"
                  size={32}
                  color={COLORS.muted}
                />

                <Text style={styles.modalEmptyTitle}>
                  Esta lista ainda está vazia
                </Text>

                <Text style={styles.modalEmptyText}>
                  As obras adicionadas à coleção aparecerão aqui.
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.modalFooterButton}
              onPress={() => setListaSelecionada(null)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalFooterText}>
                Fechar lista
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* =====================================================
          MODAL DE CAPAS
      ===================================================== */}

      <Modal
        visible={modalCapas}
        animationType="slide"
        onRequestClose={() => setModalCapas(false)}
      >
        <SafeAreaView style={styles.coverModalScreen}>
          <View style={styles.coverModalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalEyebrow}>
                PERSONALIZAÇÃO
              </Text>

              <Text style={styles.coverModalTitle}>
                Escolher banner
              </Text>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalCapas(false)}
            >
              <Feather
                name="x"
                size={19}
                color={COLORS.text}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.coverModalDescription}>
            Escolha uma imagem de filme ou série em alta, ou use uma foto da sua galeria.
          </Text>

          <TouchableOpacity
            style={styles.galleryButton}
            onPress={() => {
              setModalCapas(false);
              escolherImagem('capa');
            }}
          >
            <Feather
              name="image"
              size={17}
              color={COLORS.blueLight}
            />

            <Text style={styles.galleryButtonText}>
              Selecionar da galeria
            </Text>
          </TouchableOpacity>

          {buscandoCapas ? (
            <ActivityIndicator
              color={COLORS.blueLight}
              style={{ marginTop: 30 }}
            />
          ) : (
            <ScrollView
              contentContainerStyle={styles.coverGrid}
              showsVerticalScrollIndicator={false}
            >
              {opcoesCapa.map(item => {
                const imagem =
                  item.backdrop_path || item.poster_path;

                return (
                  <TouchableOpacity
                    key={`${item.tipo}-${item.id}`}
                    style={styles.coverOption}
                    activeOpacity={0.82}
                    onPress={() => selecionarCapa(item)}
                  >
                    <Image
                      source={{
                        uri: `${TMDB_IMAGE}w780${imagem}`,
                      }}
                      style={styles.coverOptionImage}
                    />

                    <LinearGradient
                      colors={[
                        'transparent',
                        'rgba(0,0,0,0.78)',
                      ]}
                      style={styles.coverOptionGradient}
                    />

                    <Text
                      style={styles.coverOptionTitle}
                      numberOfLines={2}
                    >
                      {item.title || item.name || 'Produção'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* =====================================================
          MENU INFERIOR — MESMO PADRÃO DA HOME.JS
      ===================================================== */}

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={abrirHome}
          activeOpacity={0.8}
        >
          <Ionicons
            name="home"
            size={22}
            color={COLORS.muted}
          />

          <Text style={styles.tabLabel}>
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={abrirBusca}
          activeOpacity={0.8}
        >
          <Feather
            name="search"
            size={21}
            color={COLORS.muted}
          />

          <Text style={styles.tabLabel}>
            Buscar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.addButton}
          onPress={abrirAdicionar}
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
              color="#FFFFFF"
            />
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={abrirDiario}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="notebook-outline"
            size={23}
            color={COLORS.muted}
          />

          <Text style={styles.tabLabel}>
            Diário
          </Text>
        </TouchableOpacity>

        <View style={styles.tabItem}>
          <Feather
            name="user"
            size={21}
            color={COLORS.blueLight}
          />

          <Text style={[styles.tabLabel, styles.tabActive]}>
            Perfil
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ============================================================
// COMPONENTES AUXILIARES
// ============================================================

function Metric({ value, label, last = false }) {
  return (
    <View
      style={[
        styles.metric,
        !last && styles.metricDivider,
      ]}
    >
      <Text
        style={styles.metricValue}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>

      <Text style={styles.metricLabel}>
        {label}
      </Text>
    </View>
  );
}

function WrappedMetric({ value, label }) {
  return (
    <View style={styles.wrappedMetric}>
      <Text
        style={styles.wrappedMetricValue}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>

      <Text style={styles.wrappedMetricLabel}>
        {label}
      </Text>
    </View>
  );
}

// ============================================================
// ESTILOS
// ============================================================

const styles = StyleSheet.create({

  // BASE

  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingTop:
      Platform.OS === 'android'
        ? StatusBar.currentHeight || 24
        : 0,
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },

  loadingText: {
    color: COLORS.secondary,
    fontSize: 12,
    marginTop: 4,
  },

  scrollContent: {
    paddingBottom: 18,
  },

  // CABEÇALHO DO PERFIL

  profileHero: {
    paddingHorizontal: 19,
  },

  banner: {
    height: 184,
    marginHorizontal: -19,
    overflow: 'hidden',
    backgroundColor: '#10152B',
  },

  bannerImage: {
    resizeMode: 'cover',
  },

  bannerOrb: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 110,
    right: -55,
    top: -92,
    backgroundColor: 'rgba(65,96,220,0.18)',
  },

  bannerActions: {
    position: 'absolute',
    right: 17,
    top: 15,
    flexDirection: 'row',
    gap: 9,
  },

  bannerAction: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: 'rgba(5,6,8,0.58)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // AVATAR E IDENTIDADE

  identityRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: -54,
    gap: 12,
    marginBottom: 15,
  },

  avatarOuter: {
    width: 112,
    height: 112,
    borderRadius: 58,
    borderWidth: 4,
    borderColor: COLORS.bg,
    backgroundColor: COLORS.bg,
  },

  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 56,
  },

  avatarFallback: {
    flex: 1,
    borderRadius: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 31,
    fontWeight: '900',
  },

  avatarCamera: {
    position: 'absolute',
    right: -1,
    bottom: 2,
    width: 28,
    height: 28,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: COLORS.bg,
    backgroundColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },

  identityText: {
    flex: 1,
    minWidth: 0,
    paddingBottom: 8,
  },

  profileName: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },

  profileHandle: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 4,
  },

  editProfileButton: {
    minHeight: 43,
    paddingHorizontal: 12,
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginBottom: 5,
    backgroundColor: COLORS.elevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  editProfileText: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: '800',
  },

  bioText: {
    color: COLORS.secondary,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 20,
  },

  // ESTATÍSTICAS

  metricsBar: {
    flexDirection: 'row',
    minHeight: 91,
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 5,
    borderRadius: 19,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  metric: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },

  metricDivider: {
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },

  metricValue: {
    color: COLORS.text,
    fontSize: 25,
    fontWeight: '900',
    letterSpacing: -0.5,
  },

  metricLabel: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.25,
    marginTop: 5,
  },

  // GÊNEROS

  genresWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 15,
  },

  genreChip: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 11,
    paddingVertical: 7,
    backgroundColor: 'rgba(255,255,255,0.025)',
  },

  genreBlue: {
    borderColor: 'rgba(59,130,246,0.42)',
    backgroundColor: 'rgba(59,130,246,0.09)',
  },

  genrePurple: {
    borderColor: 'rgba(155,91,255,0.42)',
    backgroundColor: 'rgba(155,91,255,0.08)',
  },

  genrePink: {
    borderColor: 'rgba(236,72,153,0.40)',
    backgroundColor: 'rgba(236,72,153,0.08)',
  },

  genreText: {
    color: COLORS.secondary,
    fontSize: 10,
    fontWeight: '800',
  },

  // SEÇÕES

  section: {
    paddingHorizontal: 19,
    marginTop: 27,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginBottom: 13,
  },

  sectionTitle: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.9,
  },

  sectionRule: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },

  sectionAction: {
    color: COLORS.blueLight,
    fontSize: 10,
    fontWeight: '800',
  },

  // WRAPPED

  wrappedCard: {
    minHeight: 230,
    padding: 20,
    borderRadius: 21,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.20)',
  },

  wrappedOrb: {
    position: 'absolute',
    width: 205,
    height: 205,
    borderRadius: 110,
    right: -45,
    top: -90,
    backgroundColor: 'rgba(83,91,220,0.18)',
  },

  wrappedEyebrow: {
    color: COLORS.blueLight,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },

  wrappedTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '900',
    maxWidth: '90%',
    marginTop: 13,
    marginBottom: 19,
  },

  wrappedMetrics: {
    flexDirection: 'row',
    gap: 19,
  },

  wrappedMetric: {
    flex: 1,
    minWidth: 0,
  },

  wrappedMetricValue: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
  },

  wrappedMetricLabel: {
    color: 'rgba(230,235,255,0.55)',
    fontSize: 10,
    marginTop: 3,
  },

  progressTrack: {
    height: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
    marginTop: 19,
  },

  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: COLORS.blueLight,
  },

  wrappedFooter: {
    color: 'rgba(230,235,255,0.42)',
    fontSize: 10,
    marginTop: 9,
  },

  // PÔSTERES

  posterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 9,
  },

  posterTile: {
    width: '23.5%',
    aspectRatio: 2 / 3,
    borderRadius: 11,
    overflow: 'hidden',
    backgroundColor: COLORS.elevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  posterImage: {
    width: '100%',
    height: '100%',
  },

  posterPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.elevated,
  },

  posterScore: {
    position: 'absolute',
    left: 5,
    right: 4,
    bottom: 5,
  },

  starsRow: {
    flexDirection: 'row',
    gap: 1,
  },

  emptyState: {
    minHeight: 105,
    borderRadius: 15,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.11)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 17,
    gap: 9,
  },

  emptyStateText: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },

  // LISTAS

  listCard: {
    minHeight: 91,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    marginBottom: 9,
    borderRadius: 17,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  listMosaic: {
    width: 55,
    height: 55,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: COLORS.elevated,
  },

  mosaicCell: {
    width: 26.5,
    height: 26.5,
    backgroundColor: COLORS.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },

  mosaicImage: {
    width: '100%',
    height: '100%',
  },

  listInfo: {
    flex: 1,
    minWidth: 0,
  },

  listName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
  },

  listMeta: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 5,
  },

  listRight: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },

  listBadge: {
    color: COLORS.green,
    backgroundColor: 'rgba(34,197,94,0.09)',
    borderRadius: 7,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.7,
  },

  // MODAIS

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },

  editModalCard: {
    width: '100%',
    backgroundColor: '#0D111A',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.18)',
    padding: 19,
  },

  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 19,
  },

  modalEyebrow: {
    color: COLORS.blueLight,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.7,
    marginBottom: 5,
  },

  editModalTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '900',
  },

  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.elevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  inputLabel: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 9,
  },

  bioInput: {
    minHeight: 112,
    maxHeight: 150,
    color: COLORS.text,
    backgroundColor: '#080D16',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 13,
    fontSize: 13,
    lineHeight: 20,
  },

  characterCount: {
    color: COLORS.muted,
    fontSize: 9,
    textAlign: 'right',
    marginTop: 6,
  },

  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 9,
    marginTop: 18,
  },

  cancelButton: {
    paddingHorizontal: 13,
    paddingVertical: 11,
  },

  cancelButtonText: {
    color: COLORS.secondary,
    fontSize: 12,
    fontWeight: '700',
  },

  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 11,
    backgroundColor: COLORS.blue,
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },

  // MODAL DAS LISTAS

  listModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.80)',
    justifyContent: 'flex-end',
  },

  listModalSheet: {
    maxHeight: '84%',
    minHeight: '48%',
    paddingHorizontal: 19,
    paddingTop: 11,
    paddingBottom: 22,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(148,163,184,0.18)',
    backgroundColor: '#0D111A',
  },

  sheetHandle: {
    width: 42,
    height: 4,
    borderRadius: 3,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
    marginBottom: 19,
  },

  listModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 17,
  },

  listModalTitle: {
    color: COLORS.text,
    fontSize: 23,
    lineHeight: 28,
    fontWeight: '900',
  },

  listModalSubtitle: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 6,
  },

  listModalScroll: {
    flexGrow: 0,
  },

  listModalContent: {
    paddingBottom: 10,
  },

  listModalItem: {
    minHeight: 91,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  listModalPoster: {
    width: 53,
    height: 75,
    borderRadius: 8,
    backgroundColor: COLORS.elevated,
  },

  listModalInfo: {
    flex: 1,
    minWidth: 0,
  },

  listModalItemTitle: {
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
  },

  listModalItemType: {
    color: COLORS.blueLight,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.1,
    marginTop: 5,
  },

  listModalRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },

  listModalRatingText: {
    color: COLORS.yellow,
    fontSize: 10,
    fontWeight: '800',
  },

  modalEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 35,
    gap: 9,
  },

  modalEmptyTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
  },

  modalEmptyText: {
    color: COLORS.secondary,
    fontSize: 11,
    textAlign: 'center',
  },

  modalFooterButton: {
    minHeight: 45,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#172338',
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.17)',
    marginTop: 12,
  },

  modalFooterText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },

  // MODAL DE CAPAS

  coverModalScreen: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 17,
  },

  coverModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    paddingBottom: 13,
  },

  coverModalTitle: {
    color: COLORS.text,
    fontSize: 23,
    fontWeight: '900',
  },

  coverModalDescription: {
    color: COLORS.secondary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 13,
  },

  galleryButton: {
    minHeight: 47,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    borderRadius: 12,
    backgroundColor: 'rgba(59,130,246,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.18)',
    marginBottom: 15,
  },

  galleryButtonText: {
    color: COLORS.blueLight,
    fontSize: 12,
    fontWeight: '800',
  },

  coverGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    paddingBottom: 24,
  },

  coverOption: {
    width: '48.5%',
    height: 112,
    borderRadius: 11,
    overflow: 'hidden',
    backgroundColor: COLORS.elevated,
  },

  coverOptionImage: {
    width: '100%',
    height: '100%',
  },

  coverOptionGradient: {
    ...StyleSheet.absoluteFillObject,
  },

  coverOptionTitle: {
    position: 'absolute',
    left: 9,
    right: 9,
    bottom: 8,
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },

  // BARRA INFERIOR — PADRÃO EXATO DA HOME.JS

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
