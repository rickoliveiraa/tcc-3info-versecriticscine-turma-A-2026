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
  Image,
  Linking,
  Modal,
  Platform,
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
import YoutubePlayer from 'react-native-youtube-iframe';
import { WebView } from 'react-native-webview';

import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import {
  buscarTrilhaSonora,
  criarHtmlPlayerSpotify,
} from './spotify';

const TMDB_KEY = '5c1853c10d9752023da5ddce4ada3b77';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMAGE = 'https://image.tmdb.org/t/p/';

const CHAVE_LISTAS = '@CineTrack:listas';
const CHAVE_LISTA_LEGADA = '@CineTrack:minhaLista';
const CHAVE_AVALIACOES = '@CineTrack:avaliacoes';
const CHAVE_LISTAS_BACKUP = '@CineTrack:listas_backup';
const CHAVE_LISTAS_VERSAO = '@CineTrack:listas_versao';

// Fila para evitar duas gravações simultâneas nesta tela.
let filaGravacaoListas = Promise.resolve();

const C = {
  bg: '#050608',
  surface: '#0D0F13',
  elevated: '#12151B',
  border: 'rgba(255,255,255,0.08)',
  blue: '#3B82F6',
  blueLight: '#60A5FA',
  text: '#F5F7FA',
  secondary: '#9CA3AF',
  muted: '#687386',
  green: '#1DB954',
  yellow: '#FBBF24',
  red: '#EF4444',
};

const formatarAno = valor =>
  valor ? String(valor).slice(0, 4) : 'Ano não informado';

const formatarData = valor => {
  if (!valor) return 'Não informada';

  const partes = String(valor).split('-');

  if (partes.length !== 3) return valor;

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
};

const formatarDuracao = minutos => {
  if (!minutos) return null;

  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;

  return horas
    ? `${horas}h ${resto}min`
    : `${resto}min`;
};

const formatarTempo = ms => {
  if (!ms) return '';

  const total = Math.floor(ms / 1000);

  return `${Math.floor(total / 60)}:${String(
    total % 60
  ).padStart(2, '0')}`;
};

const imagemTMDB = (path, tamanho = 'w500') =>
  path ? `${TMDB_IMAGE}${tamanho}${path}` : null;

function dataParaISO(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');

  return `${ano}-${mes}-${dia}`;
}

function criarDataLocal(valor) {
  if (!valor) return null;

  const partes = String(valor).split('-');

  if (partes.length !== 3) return null;

  const ano = Number(partes[0]);
  const mes = Number(partes[1]);
  const dia = Number(partes[2]);

  if (!ano || !mes || !dia) return null;

  return new Date(ano, mes - 1, dia);
}

async function buscarTMDB(caminho) {
  const url =
    `${TMDB_BASE}${caminho}` +
    `${caminho.includes('?') ? '&' : '?'}api_key=${TMDB_KEY}`;

  const resposta = await fetch(url);

  if (!resposta.ok) {
    throw new Error(
      `TMDB respondeu com erro (${resposta.status}).`
    );
  }

  return resposta.json();
}

async function abrirLink(url) {
  if (!url) return;

  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert(
      'Não foi possível abrir',
      'Confira se há um aplicativo compatível instalado.'
    );
  }
}

function normalizarTipo(tipo) {
  const valor = String(tipo || '').toLowerCase();

  return [
    'tv',
    'serie',
    'série',
    'series',
    'show',
  ].includes(valor)
    ? 'tv'
    : 'movie';
}

function obterClassificacao(dados, tipo) {
  if (tipo === 'movie') {
    const lista = dados.release_dates?.results || [];

    const br =
      lista.find(item => item.iso_3166_1 === 'BR') ||
      lista[0];

    const registro =
      br?.release_dates?.find(item => item.certification) ||
      br?.release_dates?.[0];

    return registro?.certification || 'L';
  }

  const lista = dados.content_ratings?.results || [];

  const br =
    lista.find(item => item.iso_3166_1 === 'BR') ||
    lista[0];

  return br?.rating || 'L';
}

function corClassificacao(valor) {
  const n = parseInt(valor, 10);

  if (!n || valor === 'L') return '#22C55E';
  if (n >= 18) return '#EF4444';
  if (n >= 16) return '#F97316';
  if (n >= 14) return '#F59E0B';
  if (n >= 12) return '#EAB308';

  return '#22C55E';
}

function obterPaisNascimento(local) {
  if (!local) return 'Não informado';

  const partes = String(local)
    .split(',')
    .map(parte => parte.trim())
    .filter(Boolean);

  return partes.length > 1
    ? partes[partes.length - 1]
    : 'Não identificado';
}

function ordenarFilmografia(lista) {
  const unicos = new Map();

  (lista || []).forEach(item => {
    if (!item.id || !item.media_type) return;

    const chave = `${item.media_type}-${item.id}`;

    if (!unicos.has(chave)) {
      unicos.set(chave, item);
    }
  });

  return [...unicos.values()].sort((a, b) => {
    const dataA = a.release_date || a.first_air_date || '';
    const dataB = b.release_date || b.first_air_date || '';

    if (dataA !== dataB) {
      return dataB.localeCompare(dataA);
    }

    return (b.popularity || 0) - (a.popularity || 0);
  });
}

// ============================================================
// LISTAS: NORMALIZAÇÃO DOS DADOS
// ============================================================

function normalizarItemLista(item) {
  if (!item || typeof item !== 'object') return null;

  const midia = item.media || item.midia || {};

  const id =
    item.tmdb_id ??
    item.media_id ??
    midia.id ??
    item.id;

  if (id === undefined || id === null || id === '') {
    return null;
  }

  return {
    id: Number(id) || id,

    tipo: normalizarTipo(
      item.tipo ||
      item.media_type ||
      item.mediaType ||
      midia.tipo ||
      midia.media_type
    ),

    title:
      item.title ||
      item.name ||
      item.titulo ||
      item.media_title ||
      midia.title ||
      midia.name ||
      'Obra sem título',

    poster_path:
      item.poster_path ||
      item.poster ||
      item.poster_url ||
      midia.poster_path ||
      null,

    release_date:
      item.release_date ||
      item.first_air_date ||
      item.year ||
      item.ano ||
      midia.release_date ||
      midia.first_air_date ||
      '',

    vote_average: Number(item.vote_average || 0),

    adicionada_em:
      item.adicionada_em ||
      item.added_at ||
      item.created_at ||
      new Date().toISOString(),
  };
}

function normalizarListaUsuario(lista, indice = 0) {
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

  const itensNormalizados = itensOriginais
    .map(normalizarItemLista)
    .filter(Boolean);

  const vistos = new Set();

  const itens = itensNormalizados.filter(item => {
    const chave = `${item.tipo}-${item.id}`;

    if (vistos.has(chave)) return false;

    vistos.add(chave);
    return true;
  });

  return {
    id: String(
      lista.id ??
      lista.list_id ??
      `lista-${indice}`
    ),

    nome:
      lista.nome ||
      lista.name ||
      lista.title ||
      `Minha lista ${indice + 1}`,

    descricao:
      lista.descricao ||
      lista.description ||
      '',

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

  return [
    {
      id: 'cinetrack-lista-importada',
      nome: 'Minha lista',
      descricao: 'Obras importadas da sua lista anterior.',
      criada_em: new Date().toISOString(),
      itens: normalizados,
    },
  ];
}

function interpretarListasUsuario(dados) {
  if (!dados) return [];

  if (Array.isArray(dados)) {
    if (!dados.length) return [];

    const pareceColecaoDeListas = dados.some(item =>
      item &&
      typeof item === 'object' &&
      !Array.isArray(item) &&
      (
        Array.isArray(item.itens) ||
        Array.isArray(item.items) ||
        Array.isArray(item.obras) ||
        Array.isArray(item.filmes) ||
        item.nome ||
        item.name ||
        item.description
      )
    );

    if (pareceColecaoDeListas) {
      return dados
        .map(normalizarListaUsuario)
        .filter(Boolean);
    }

    return converterListaLegada(dados);
  }

  if (typeof dados === 'object') {
    const colecao = [
      dados.listas,
      dados.collections,
      dados.data,
      dados.results,
    ].find(Array.isArray);

    if (colecao) {
      return interpretarListasUsuario(colecao);
    }

    if (
      Array.isArray(dados.itens) ||
      Array.isArray(dados.items) ||
      Array.isArray(dados.obras) ||
      Array.isArray(dados.filmes)
    ) {
      const lista = normalizarListaUsuario(dados);

      return lista ? [lista] : [];
    }
  }

  return [];
}

// ============================================================
// LEITURA DO ARMAZENAMENTO E BACKUP
// Compatível com o formato usado no NovoRegistro atualizado.
// ============================================================

async function lerListasArmazenadas() {
  const valores = await AsyncStorage.multiGet([
    CHAVE_LISTAS,
    CHAVE_LISTAS_BACKUP,
    CHAVE_LISTAS_VERSAO,
    CHAVE_LISTA_LEGADA,
  ]);

  const textoPrincipal = valores[0]?.[1];
  const textoBackup = valores[1]?.[1];
  const textoVersao = valores[2]?.[1];
  const textoLegado = valores[3]?.[1];

  let listasPrincipais = null;
  let listasBackup = null;

  let versaoBackup = 0;
  let versaoPrincipal = Number(textoVersao || 0);

  try {
    if (textoPrincipal !== null && textoPrincipal !== undefined) {
      listasPrincipais = interpretarListasUsuario(
        JSON.parse(textoPrincipal)
      );
    }
  } catch (erro) {
    console.warn(
      'Erro ao interpretar a chave principal das listas:',
      erro
    );
  }

  try {
    if (textoBackup) {
      const backup = JSON.parse(textoBackup);

      if (Array.isArray(backup)) {
        listasBackup = interpretarListasUsuario(backup);
      } else {
        listasBackup = interpretarListasUsuario(
          backup?.listas
        );

        versaoBackup = Number(backup?.versao || 0);
      }
    }
  } catch (erro) {
    console.warn(
      'Erro ao interpretar o backup das listas:',
      erro
    );
  }

  /*
   * O NovoRegistro grava o backup primeiro, depois a lista
   * principal e, por último, a versão.
   *
   * Portanto, uma versão de backup maior indica que o app
   * pode ter sido fechado durante uma gravação.
   */
  if (
    listasBackup !== null &&
    versaoBackup > versaoPrincipal
  ) {
    return listasBackup;
  }

  if (listasPrincipais !== null) {
    return listasPrincipais;
  }

  if (listasBackup !== null) {
    return listasBackup;
  }

  if (textoLegado) {
    try {
      return converterListaLegada(
        JSON.parse(textoLegado)
      );
    } catch (erro) {
      console.warn(
        'Erro ao recuperar lista antiga:',
        erro
      );
    }
  }

  return [];
}

// ============================================================
// GRAVAÇÃO COMPATÍVEL COM O NOVO REGISTRO
// ============================================================

async function gravarListasArmazenadas(novasListas) {
  const listasSeguras = novasListas
    .map(normalizarListaUsuario)
    .filter(Boolean);

  const valores = await AsyncStorage.multiGet([
    CHAVE_LISTAS_BACKUP,
    CHAVE_LISTAS_VERSAO,
  ]);

  let versaoBackup = 0;

  try {
    const backupTexto = valores[0]?.[1];

    if (backupTexto) {
      const backup = JSON.parse(backupTexto);
      versaoBackup = Number(backup?.versao || 0);
    }
  } catch (_) {
    versaoBackup = 0;
  }

  const versaoAnterior = Number(valores[1]?.[1] || 0);

  const novaVersao =
    Math.max(versaoBackup, versaoAnterior) + 1;

  const json = JSON.stringify(listasSeguras);

  // 1. Grava o backup com versão.
  await AsyncStorage.setItem(
    CHAVE_LISTAS_BACKUP,
    JSON.stringify({
      versao: novaVersao,
      listas: listasSeguras,
    })
  );

  // 2. Grava a chave principal usada pelo NovoRegistro.
  await AsyncStorage.setItem(
    CHAVE_LISTAS,
    json
  );

  // 3. Atualiza a versão somente após a gravação principal.
  await AsyncStorage.setItem(
    CHAVE_LISTAS_VERSAO,
    String(novaVersao)
  );

  return listasSeguras;
}

function executarNaFilaListas(operacao) {
  const proxima = filaGravacaoListas.then(
    operacao,
    operacao
  );

  filaGravacaoListas = proxima.catch(() => {});

  return proxima;
}

// ============================================================
// CALENDÁRIO PERSONALIZADO
// ============================================================

function CalendarioModal({
  visible,
  value,
  onClose,
  onSelect,
}) {
  const [mesVisivel, setMesVisivel] = useState(() => {
    const selecionada = criarDataLocal(value);
    const data = selecionada || new Date();

    return new Date(
      data.getFullYear(),
      data.getMonth(),
      1
    );
  });

  useEffect(() => {
    if (!visible) return;

    const selecionada = criarDataLocal(value);
    const data = selecionada || new Date();

    setMesVisivel(
      new Date(
        data.getFullYear(),
        data.getMonth(),
        1
      )
    );
  }, [visible, value]);

  const ano = mesVisivel.getFullYear();
  const mes = mesVisivel.getMonth();

  const primeiroDia = new Date(ano, mes, 1);
  const deslocamento = (primeiroDia.getDay() + 6) % 7;

  const quantidadeDias = new Date(
    ano,
    mes + 1,
    0
  ).getDate();

  const dias = Array.from(
    { length: deslocamento + quantidadeDias },
    (_, index) =>
      index < deslocamento
        ? null
        : index - deslocamento + 1
  );

  const hoje = dataParaISO(new Date());

  const tituloMes = mesVisivel.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.calendarOverlay}>
        <View style={styles.calendarCard}>
          <View style={styles.calendarTop}>
            <View>
              <Text style={styles.calendarEyebrow}>
                DATA DE VISUALIZAÇÃO
              </Text>

              <Text style={styles.calendarTitle}>
                Quando você assistiu?
              </Text>
            </View>

            <TouchableOpacity
              style={styles.calendarClose}
              onPress={onClose}
            >
              <Ionicons
                name="close"
                size={21}
                color={C.text}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.calendarMonthRow}>
            <TouchableOpacity
              style={styles.calendarArrow}
              onPress={() =>
                setMesVisivel(new Date(ano, mes - 1, 1))
              }
            >
              <Ionicons
                name="chevron-back"
                color={C.text}
                size={18}
              />
            </TouchableOpacity>

            <Text style={styles.calendarMonth}>
              {tituloMes}
            </Text>

            <TouchableOpacity
              style={styles.calendarArrow}
              onPress={() =>
                setMesVisivel(new Date(ano, mes + 1, 1))
              }
            >
              <Ionicons
                name="chevron-forward"
                color={C.text}
                size={18}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.calendarGrid}>
            {[
              'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM',
            ].map(dia => (
              <View
                key={dia}
                style={styles.calendarWeekday}
              >
                <Text style={styles.calendarWeekdayText}>
                  {dia}
                </Text>
              </View>
            ))}

            {dias.map((dia, index) => {
              if (!dia) {
                return (
                  <View
                    key={`vazio-${index}`}
                    style={styles.calendarDay}
                  />
                );
              }

              const valorDia = dataParaISO(
                new Date(ano, mes, dia)
              );

              const selecionado = value === valorDia;
              const ehHoje = valorDia === hoje;
              const futuro = valorDia > hoje;

              return (
                <TouchableOpacity
                  key={valorDia}
                  disabled={futuro}
                  style={[
                    styles.calendarDay,
                    selecionado && styles.calendarDaySelected,
                    ehHoje && !selecionado && styles.calendarDayToday,
                    futuro && styles.calendarDayDisabled,
                  ]}
                  onPress={() => {
                    onSelect(valorDia);
                    onClose();
                  }}
                >
                  <Text
                    style={[
                      styles.calendarDayText,
                      selecionado && styles.calendarDayTextSelected,
                      futuro && styles.calendarDayTextDisabled,
                    ]}
                  >
                    {dia}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={styles.calendarTodayButton}
            onPress={() => {
              onSelect(hoje);
              onClose();
            }}
          >
            <Text style={styles.calendarTodayText}>
              Selecionar hoje
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ============================================================
// TÍTULOS DE SEÇÃO
// ============================================================

function SectionTitle({ icon, title }) {
  return (
    <View style={styles.sectionTitleRow}>
      <View style={styles.sectionAccent} />

      <Ionicons
        name={icon}
        size={18}
        color={C.blueLight}
      />

      <Text style={styles.sectionTitle}>
        {title}
      </Text>

      <View style={styles.sectionRule} />
    </View>
  );
}

// ============================================================
// CARTÃO DE FILMOGRAFIA
// ============================================================

function CartaoFilmografia({ item, aoAbrir }) {
  const tituloItem =
    item.title || item.name || 'Título não informado';

  const data = item.release_date || item.first_air_date || '';
  const anoItem = data ? data.slice(0, 4) : 'Ano N/A';

  const poster = imagemTMDB(item.poster_path, 'w185');

  return (
    <TouchableOpacity
      style={styles.actorFilmCard}
      activeOpacity={0.8}
      onPress={() => aoAbrir(item)}
    >
      {poster ? (
        <Image
          source={{ uri: poster }}
          style={styles.actorFilmPoster}
        />
      ) : (
        <View
          style={[
            styles.actorFilmPoster,
            styles.actorFilmPlaceholder,
          ]}
        >
          <Ionicons
            name="film-outline"
            size={25}
            color={C.muted}
          />
        </View>
      )}

      <Text
        numberOfLines={2}
        style={styles.actorFilmTitle}
      >
        {tituloItem}
      </Text>

      <Text style={styles.actorFilmYear}>
        {anoItem}
      </Text>

      {!!item.character && (
        <Text
          numberOfLines={2}
          style={styles.actorFilmRole}
        >
          {`como ${item.character}`}
        </Text>
      )}
    </TouchableOpacity>
  );
}

// ============================================================
// TELA PRINCIPAL
// ============================================================

export default function Detalhes({ midia, onVoltar }) {
  const tipo = normalizarTipo(
    midia?.tipo || midia?.media_type
  );

  const id = midia?.id;

  const scrollRef = useRef(null);
  const posicaoAvaliacao = useRef(0);
  const spotifyWebRef = useRef(null);

  const [detalhes, setDetalhes] = useState(null);
  const [creditos, setCreditos] = useState(null);
  const [provedores, setProvedores] = useState(null);

  const [trailerKey, setTrailerKey] = useState(null);
  const [trailerAberto, setTrailerAberto] = useState(false);

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  // Listas do usuário e modal de seleção.
  const [listasUsuario, setListasUsuario] = useState([]);
  const [modalListasVisivel, setModalListasVisivel] = useState(false);
  const [carregandoListas, setCarregandoListas] = useState(false);
  const [listaSalvandoId, setListaSalvandoId] = useState(null);

  // Avaliação.
  const [nota, setNota] = useState(0);
  const [resenha, setResenha] = useState('');
  const [dataAssistida, setDataAssistida] = useState('');
  const [salvandoNota, setSalvandoNota] = useState(false);
  const [calendarioAberto, setCalendarioAberto] = useState(false);

  // Spotify.
  const [trilha, setTrilha] = useState(null);
  const [loadingTrilha, setLoadingTrilha] = useState(false);
  const [erroTrilha, setErroTrilha] = useState('');

  const [faixaSelecionada, setFaixaSelecionada] = useState(null);
  const [faixaTocandoId, setFaixaTocandoId] = useState(null);
  const [mostrarTodasFaixas, setMostrarTodasFaixas] = useState(false);

  // Perfil do elenco.
  const [atorModalVisivel, setAtorModalVisivel] = useState(false);
  const [atorSelecionado, setAtorSelecionado] = useState(null);
  const [carregandoAtor, setCarregandoAtor] = useState(false);
  const [erroAtor, setErroAtor] = useState('');

  const titulo =
    detalhes?.title ||
    detalhes?.name ||
    midia?.media?.title ||
    midia?.media?.name ||
    'Título não encontrado';

  const tituloOriginal =
    detalhes?.original_title ||
    detalhes?.original_name ||
    titulo;

  const dataLancamento =
    detalhes?.release_date ||
    detalhes?.first_air_date ||
    '';

  const ano = formatarAno(dataLancamento);

  const notaTMDB = Number(
    detalhes?.vote_average || 0
  ).toFixed(1);

  const generos = detalhes?.genres || [];
  const elenco = (creditos?.cast || []).slice(0, 12);

  const diretor = useMemo(() => {
    const equipe = creditos?.crew || [];

    const diretorEncontrado = equipe.find(
      pessoa => pessoa.job === 'Director'
    );

    if (diretorEncontrado) {
      return diretorEncontrado.name;
    }

    return detalhes?.created_by
      ?.map(pessoa => pessoa.name)
      .filter(Boolean)
      .join(', ') || '';
  }, [creditos, detalhes]);

  const classificacao = detalhes
    ? obterClassificacao(detalhes, tipo)
    : 'L';

  const runtime =
    tipo === 'movie'
      ? formatarDuracao(detalhes?.runtime)
      : detalhes?.number_of_seasons
        ? `${detalhes.number_of_seasons} temporada(s) • ${
            detalhes.number_of_episodes || '?'
          } episódios`
        : null;

  // Calcula quantas listas já contêm esta produção.
  const listasComEstaObra = listasUsuario.filter(lista =>
    lista.itens.some(item =>
      String(item.id) === String(id) &&
      normalizarTipo(item.tipo) === tipo
    )
  );

  const naLista = listasComEstaObra.length > 0;
  const quantidadeListasComMidia = listasComEstaObra.length;

  // =========================================================
  // CARREGAR TODAS AS LISTAS DO USUÁRIO
  // =========================================================

  const carregarListasUsuario = useCallback(async () => {
    setCarregandoListas(true);

    try {
      const listas = await executarNaFilaListas(
        lerListasArmazenadas
      );

      setListasUsuario(listas);

      return listas;
    } catch (erro) {
      console.warn(
        'Erro ao carregar listas do usuário:',
        erro
      );

      Alert.alert(
        'Erro ao carregar listas',
        'Não foi possível ler suas listas salvas. Tente novamente.'
      );

      return [];
    } finally {
      setCarregandoListas(false);
    }
  }, []);

  useEffect(() => {
    carregarListasUsuario();
  }, [carregarListasUsuario, id, tipo]);

  // =========================================================
  // ABRIR SELETOR DE LISTAS
  // =========================================================

  const abrirSeletorListas = async () => {
    await carregarListasUsuario();
    setModalListasVisivel(true);
  };

  // =========================================================
  // ADICIONAR OU REMOVER A OBRA DE UMA LISTA
  // =========================================================

  const alternarObraNaLista = async lista => {
    if (!detalhes || !lista?.id || listaSalvandoId) {
      return;
    }

    const chaveLista = String(lista.id);

    setListaSalvandoId(chaveLista);

    try {
      let listaEncontrada = false;
      let obraFoiAdicionada = false;

      const atualizadas = await executarNaFilaListas(async () => {
        // Lê a versão mais recente no armazenamento.
        const listasAtuais = await lerListasArmazenadas();

        const novasListas = listasAtuais.map(listaAtual => {
          if (String(listaAtual.id) !== chaveLista) {
            return listaAtual;
          }

          listaEncontrada = true;

          const itensAtuais = Array.isArray(listaAtual.itens)
            ? listaAtual.itens
            : [];

          const jaExiste = itensAtuais.some(item =>
            String(item.id) === String(id) &&
            normalizarTipo(item.tipo) === tipo
          );

          const obra = {
            id: Number(id) || id,
            tipo,
            title: detalhes.title || detalhes.name || titulo,
            poster_path: detalhes.poster_path || null,
            release_date:
              detalhes.release_date ||
              detalhes.first_air_date ||
              '',
            vote_average: Number(detalhes.vote_average || 0),
            adicionada_em: new Date().toISOString(),
          };

          if (jaExiste) {
            obraFoiAdicionada = false;

            return {
              ...listaAtual,
              itens: itensAtuais.filter(item => !(
                String(item.id) === String(id) &&
                normalizarTipo(item.tipo) === tipo
              )),
            };
          }

          obraFoiAdicionada = true;

          return {
            ...listaAtual,
            itens: [...itensAtuais, obra],
          };
        });

        if (!listaEncontrada) {
          throw new Error(
            'A lista selecionada não existe mais no armazenamento.'
          );
        }

        return gravarListasArmazenadas(novasListas);
      });

      setListasUsuario(atualizadas);

      if (!listaEncontrada) {
        Alert.alert(
          'Lista não encontrada',
          'Atualize suas listas e tente novamente.'
        );

        return;
      }

      // A seleção permanece aberta para permitir adicionar
      // a mesma obra a outras listas sem sair do modal.
      if (obraFoiAdicionada) {
        // Não precisa fechar o modal.
      }
    } catch (erro) {
      console.warn('Erro ao atualizar lista:', erro);

      Alert.alert(
        'Não foi possível atualizar',
        erro.message ||
          'O CineTrack não conseguiu salvar esta alteração. Tente novamente.'
      );

      // Recarrega o estado visual caso tenha ocorrido erro.
      await carregarListasUsuario();
    } finally {
      setListaSalvandoId(null);
    }
  };

  // =========================================================
  // TRILHA SONORA
  // =========================================================

  const carregarTrilha = useCallback(
    async (nomePT, nomeOriginal, anoObra) => {
      if (!nomePT && !nomeOriginal) return;

      setLoadingTrilha(true);
      setErroTrilha('');
      setTrilha(null);
      setFaixaSelecionada(null);
      setFaixaTocandoId(null);
      setMostrarTodasFaixas(false);

      try {
        const resultado = await buscarTrilhaSonora(
          nomePT,
          nomeOriginal,
          anoObra
        );

        setTrilha(resultado);

        if (!resultado?.album) {
          setErroTrilha(
            'Não encontramos um álbum de trilha sonora correspondente no Spotify.'
          );
        }
      } catch (e) {
        console.warn('Erro ao carregar trilha do Spotify:', e);

        setTrilha(null);

        setErroTrilha(
          e.message ||
            'Não foi possível carregar a trilha sonora.'
        );
      } finally {
        setLoadingTrilha(false);
      }
    },
    []
  );

  // =========================================================
  // CARREGAMENTO DOS DETALHES
  // =========================================================

  const carregarDetalhes = useCallback(async () => {
    if (!id) {
      setErro('Não foi possível identificar esta produção.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setErro('');
    setTrilha(null);
    setErroTrilha('');
    setTrailerAberto(false);
    setFaixaSelecionada(null);
    setFaixaTocandoId(null);
    setMostrarTodasFaixas(false);

    try {
      const [
        dados,
        dadosCreditos,
        dadosProvedores,
      ] = await Promise.all([
        buscarTMDB(
          `/${tipo}/${id}?language=pt-BR&append_to_response=videos,release_dates,content_ratings`
        ),
        buscarTMDB(
          `/${tipo}/${id}/credits?language=pt-BR`
        ),
        buscarTMDB(
          `/${tipo}/${id}/watch/providers`
        ),
      ]);

      let sinopse = dados.overview;

      if (!sinopse) {
        try {
          const ingles = await buscarTMDB(
            `/${tipo}/${id}?language=en-US`
          );

          sinopse = ingles.overview;
        } catch {
          // Mantém a sinopse vazia se a tradução não estiver disponível.
        }
      }

      const dadosComSinopse = {
        ...dados,
        overview: sinopse || '',
      };

      setDetalhes(dadosComSinopse);
      setCreditos(dadosCreditos);
      setProvedores(dadosProvedores?.results?.BR || null);

      const videos = dados.videos?.results || [];

      const youtube = videos.filter(
        video => video.site === 'YouTube'
      );

      const trailer =
        youtube.find(
          video => video.type === 'Trailer' && video.official
        ) ||
        youtube.find(video => video.type === 'Trailer') ||
        youtube.find(video => video.type === 'Teaser') ||
        youtube[0];

      setTrailerKey(trailer?.key || null);

      const tituloPT =
        dadosComSinopse.title ||
        dadosComSinopse.name ||
        'Produção';

      const tituloEN =
        dadosComSinopse.original_title ||
        dadosComSinopse.original_name ||
        tituloPT;

      const anoObra = (
        dadosComSinopse.release_date ||
        dadosComSinopse.first_air_date ||
        ''
      ).slice(0, 4);

      carregarTrilha(tituloPT, tituloEN, anoObra);
    } catch (e) {
      console.error('Erro ao carregar detalhes:', e);

      setErro(
        e.message ||
          'Não foi possível carregar os detalhes.'
      );
    } finally {
      setLoading(false);
    }
  }, [id, tipo, carregarTrilha]);

  useEffect(() => {
    carregarDetalhes();
  }, [carregarDetalhes]);

  // =========================================================
  // CARREGAR AVALIAÇÃO LOCAL
  // =========================================================

  useEffect(() => {
    let ativo = true;

    async function carregarAvaliacao() {
      try {
        const notasTexto = await AsyncStorage.getItem(
          CHAVE_AVALIACOES
        );

        const notas = notasTexto
          ? JSON.parse(notasTexto)
          : {};

        if (!ativo) return;

        const chave = `${tipo}-${id}`;

        const avaliacao = Array.isArray(notas)
          ? notas.find(item =>
              String(item.tmdb_id || item.id) === String(id) &&
              normalizarTipo(item.tipo || tipo) === tipo
            )
          : (notas[chave] || notas[id]);

        const notaSalva = Number(
          avaliacao?.nota ??
          avaliacao?.stars ??
          avaliacao ??
          0
        );

        setNota(
          Number.isFinite(notaSalva) ? notaSalva : 0
        );

        setResenha(
          typeof avaliacao === 'object' && avaliacao
            ? avaliacao.resenha || avaliacao.review || ''
            : ''
        );

        setDataAssistida(
          typeof avaliacao === 'object' && avaliacao
            ? avaliacao.dataAssistida || avaliacao.watchedAt || ''
            : ''
        );
      } catch (erro) {
        console.warn('Erro ao recuperar avaliação:', erro);
      }
    }

    carregarAvaliacao();

    return () => {
      ativo = false;
    };
  }, [id, tipo]);

  // =========================================================
  // SALVAR AVALIAÇÃO COMPLETA
  // =========================================================

  const salvarAvaliacao = async () => {
    if (!id || !detalhes || salvandoNota) return;

    const notaValida =
      nota === 0 ||
      (
        Number.isFinite(nota) &&
        nota >= 0.5 &&
        nota <= 5 &&
        Math.abs(nota * 2 - Math.round(nota * 2)) < 0.00001
      );

    if (!notaValida) {
      Alert.alert(
        'Nota inválida',
        'Escolha uma nota entre 0,5 e 5 estrelas.'
      );
      return;
    }

    const resenhaLimpa = resenha.trim();

    if (!nota && !resenhaLimpa && !dataAssistida) {
      Alert.alert(
        'Avaliação vazia',
        'Escolha uma nota, escreva uma resenha ou informe quando assistiu.'
      );
      return;
    }

    setSalvandoNota(true);

    try {
      const texto = await AsyncStorage.getItem(
        CHAVE_AVALIACOES
      );

      const dados = texto ? JSON.parse(texto) : {};
      const chave = `${tipo}-${id}`;

      const registro = {
        id,
        tmdb_id: id,
        tipo,
        nota,
        stars: nota,
        resenha: resenhaLimpa,
        review: resenhaLimpa,
        dataAssistida,
        watchedAt: dataAssistida,
        title: detalhes.title || detalhes.name,
        poster: detalhes.poster_path || '',
        poster_path: detalhes.poster_path || '',
        year: ano,
        atualizado_em: new Date().toISOString(),
      };

      if (Array.isArray(dados)) {
        const indice = dados.findIndex(item =>
          String(item.tmdb_id || item.id) === String(id) &&
          normalizarTipo(item.tipo || tipo) === tipo
        );

        if (indice >= 0) {
          dados[indice] = {
            ...dados[indice],
            ...registro,
          };
        } else {
          dados.push(registro);
        }

        await AsyncStorage.setItem(
          CHAVE_AVALIACOES,
          JSON.stringify(dados)
        );
      } else {
        const objeto = (
          dados && typeof dados === 'object'
        ) ? { ...dados } : {};

        objeto[chave] = registro;

        await AsyncStorage.setItem(
          CHAVE_AVALIACOES,
          JSON.stringify(objeto)
        );
      }

      Alert.alert(
        'Avaliação salva!',
        'Sua avaliação foi registrada neste dispositivo.'
      );
    } catch (e) {
      Alert.alert(
        'Erro',
        'Não foi possível salvar sua avaliação.'
      );

      console.warn(e);
    } finally {
      setSalvandoNota(false);
    }
  };

  // =========================================================
  // PERFIL DOS ATORES E ATRIZES
  // =========================================================

  const abrirPerfilAtor = async actorId => {
    if (!actorId) return;

    setAtorModalVisivel(true);
    setCarregandoAtor(true);
    setErroAtor('');
    setAtorSelecionado(null);

    try {
      const dados = await buscarTMDB(
        `/person/${actorId}?language=pt-BR&append_to_response=combined_credits`
      );

      let biografia = dados.biography || '';

      if (!biografia.trim()) {
        try {
          const dadosIngles = await buscarTMDB(
            `/person/${actorId}?language=en-US`
          );

          biografia = dadosIngles.biography || '';
        } catch {
          // Mantém a biografia vazia se as duas consultas falharem.
        }
      }

      const creditosAtor =
        dados.combined_credits?.cast || [];

      const filmes = ordenarFilmografia(
        creditosAtor.filter(
          item => item.media_type === 'movie'
        )
      );

      const series = ordenarFilmografia(
        creditosAtor.filter(
          item => item.media_type === 'tv'
        )
      );

      const localNascimento =
        dados.place_of_birth || '';

      setAtorSelecionado({
        id: dados.id,
        nome: dados.name || 'Nome não informado',
        foto: imagemTMDB(dados.profile_path, 'h632'),
        dataNascimento: dados.birthday || '',
        localNascimento,
        paisNascimento: obterPaisNascimento(localNascimento),
        biografia,
        filmes,
        series,
        departamento: dados.known_for_department || '',
      });
    } catch (e) {
      console.error('Erro ao carregar perfil do ator:', e);

      setErroAtor(
        e.message ||
          'Não foi possível carregar as informações deste ator.'
      );
    } finally {
      setCarregandoAtor(false);
    }
  };

  const fecharPerfilAtor = () => {
    setAtorModalVisivel(false);
    setAtorSelecionado(null);
    setErroAtor('');
  };

  const abrirProducaoDaFilmografia = item => {
    const nome = item.title || item.name || 'Produção';

    const anoItem = (
      item.release_date ||
      item.first_air_date ||
      ''
    ).slice(0, 4);

    Alert.alert(
      nome,
      anoItem
        ? `Produção lançada em ${anoItem}.`
        : 'Produção encontrada na filmografia.'
    );
  };

  // =========================================================
  // NAVEGAÇÃO PARA A AVALIAÇÃO
  // =========================================================

  const irParaAvaliacao = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        y: Math.max(0, posicaoAvaliacao.current - 20),
        animated: true,
      });
    }
  };

  // =========================================================
  // STREAMINGS
  // =========================================================

  const urlJustWatch =
    provedores?.link ||
    `https://www.justwatch.com/br/busca?q=${encodeURIComponent(titulo)}`;

  const listaProvedores = [
    ...(provedores?.flatrate || []).map(p => ({
      ...p,
      modalidade: 'Assinatura',
    })),
    ...(provedores?.rent || []).map(p => ({
      ...p,
      modalidade: 'Aluguel',
    })),
    ...(provedores?.buy || []).map(p => ({
      ...p,
      modalidade: 'Compra',
    })),
  ];

  // =========================================================
  // PLAYER SPOTIFY
  // =========================================================

  const embedUrl = faixaSelecionada?.embedUrl || null;

  const htmlPlayerSpotify = useMemo(() => {
    if (!embedUrl) return null;

    return criarHtmlPlayerSpotify(
      embedUrl,
      152,
      true
    );
  }, [embedUrl]);

  const selecionarFaixa = faixa => {
    if (!faixa) return;

    if (!faixa.embedUrl) {
      abrirLink(faixa.spotifyUrl || trilha?.spotifyUrl);
      return;
    }

    if (faixaSelecionada?.id === faixa.id) {
      if (spotifyWebRef.current) {
        spotifyWebRef.current.injectJavaScript(`
          if (window.CineTrackSpotifyToggle) {
            window.CineTrackSpotifyToggle();
          }
          true;
        `);
      }

      return;
    }

    setFaixaTocandoId(null);
    setFaixaSelecionada(faixa);
  };

  const receberMensagemSpotify = event => {
    try {
      const mensagem = JSON.parse(
        event.nativeEvent.data
      );

      if (mensagem.type === 'playing') {
        setFaixaTocandoId(
          faixaSelecionada?.id || null
        );
      }

      if (mensagem.type === 'paused') {
        setFaixaTocandoId(null);
      }

      if (
        mensagem.type === 'api_error' ||
        mensagem.type === 'play_error'
      ) {
        console.warn(
          '[CineTrack Spotify]:',
          mensagem.message
        );
      }
    } catch (error) {
      console.warn(
        '[CineTrack Spotify] Mensagem inválida:',
        error
      );
    }
  };

  const fecharPlayerSpotify = () => {
    setFaixaSelecionada(null);
    setFaixaTocandoId(null);
  };

  const faixasDoAlbum = trilha?.tracks || [];

  const faixasVisiveis = mostrarTodasFaixas
    ? faixasDoAlbum
    : faixasDoAlbum.slice(0, 5);

  // =========================================================
  // CARREGAMENTO E ERRO
  // =========================================================

  if (loading && !detalhes) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={C.bg}
        />

        <ActivityIndicator
          size="large"
          color={C.blueLight}
        />

        <Text style={styles.loadingText}>
          Preparando os detalhes da produção...
        </Text>
      </SafeAreaView>
    );
  }

  if (erro && !detalhes) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={C.bg}
        />

        <Ionicons
          name="cloud-offline-outline"
          size={46}
          color={C.red}
        />

        <Text style={styles.errorTitle}>
          Não foi possível carregar
        </Text>

        <Text style={styles.errorText}>
          {erro}
        </Text>

        <TouchableOpacity
          style={styles.retryButton}
          onPress={carregarDetalhes}
        >
          <Feather
            name="refresh-cw"
            size={16}
            color="#fff"
          />

          <Text style={styles.retryText}>
            Tentar novamente
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backLink}
          onPress={onVoltar}
        >
          <Feather
            name="arrow-left"
            size={16}
            color={C.blueLight}
          />

          <Text style={styles.backLinkText}>
            Voltar
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const backdrop = imagemTMDB(
    detalhes?.backdrop_path,
    'w1280'
  );

  const poster = imagemTMDB(
    detalhes?.poster_path,
    'w500'
  );

  // =========================================================
  // RENDERIZAÇÃO DA TELA
  // =========================================================

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={C.bg}
      />

      <ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        <View style={styles.hero}>
          {backdrop ? (
            <Image
              source={{ uri: backdrop }}
              style={styles.backdrop}
            />
          ) : null}

          <LinearGradient
            colors={[
              'rgba(5,6,8,0.22)',
              'rgba(5,6,8,0.75)',
              C.bg,
            ]}
            locations={[0, 0.55, 1]}
            style={StyleSheet.absoluteFill}
          />

          <TouchableOpacity
            style={styles.backButton}
            onPress={onVoltar}
            activeOpacity={0.8}
          >
            <Feather
              name="arrow-left"
              size={19}
              color="#fff"
            />

            <Text style={styles.backButtonText}>
              Voltar
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.mainContent}>
          <View style={styles.topInfo}>
            <View style={styles.posterColumn}>
              {poster ? (
                <Image
                  source={{ uri: poster }}
                  style={styles.poster}
                />
              ) : (
                <View
                  style={[
                    styles.poster,
                    styles.posterFallback,
                  ]}
                >
                  <Ionicons
                    name="film-outline"
                    size={40}
                    color={C.muted}
                  />
                </View>
              )}

              <View style={styles.tmdbScore}>
                <Ionicons
                  name="star"
                  color={C.yellow}
                  size={13}
                />

                <Text style={styles.tmdbScoreText}>
                  {notaTMDB}
                </Text>

                <Text style={styles.tmdbScoreOut}>
                  /10
                </Text>
              </View>
            </View>

            <View style={styles.infoColumn}>
              <Text style={styles.eyebrow}>
                {tipo === 'movie' ? 'FILME' : 'SÉRIE'} • CINETRACK
              </Text>

              <Text style={styles.title}>
                {titulo}
              </Text>

              {!!detalhes?.original_title &&
                detalhes.original_title !== titulo && (
                  <Text style={styles.originalTitle}>
                    {detalhes.original_title}
                  </Text>
                )}

              <View style={styles.metaWrap}>
                <View style={styles.metaChip}>
                  <Ionicons
                    name="calendar-outline"
                    size={13}
                    color={C.blueLight}
                  />

                  <Text style={styles.metaText}>
                    {ano}
                  </Text>
                </View>

                {!!runtime && (
                  <View style={styles.metaChip}>
                    <Ionicons
                      name="time-outline"
                      size={13}
                      color={C.blueLight}
                    />

                    <Text style={styles.metaText}>
                      {runtime}
                    </Text>
                  </View>
                )}

                <View
                  style={[
                    styles.ageBadge,
                    {
                      borderColor: corClassificacao(classificacao),
                      backgroundColor: `${corClassificacao(classificacao)}18`,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.ageText,
                      {
                        color: corClassificacao(classificacao),
                      },
                    ]}
                  >
                    {classificacao}
                  </Text>
                </View>
              </View>

              {!!diretor && (
                <View style={styles.directorRow}>
                  <Feather
                    name="video"
                    size={14}
                    color={C.blueLight}
                  />

                  <Text style={styles.directorText}>
                    {tipo === 'movie' ? 'Direção: ' : 'Criação: '}

                    <Text style={styles.directorName}>
                      {diretor}
                    </Text>
                  </Text>
                </View>
              )}

              <View style={styles.heroActions}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.primaryButton,
                  ]}
                  onPress={irParaAvaliacao}
                >
                  <Ionicons
                    name="star"
                    size={16}
                    color="#fff"
                  />

                  <Text style={styles.primaryButtonText}>
                    Avaliar
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    naLista && styles.savedButton,
                  ]}
                  onPress={abrirSeletorListas}
                >
                  <Ionicons
                    name={naLista ? 'bookmark' : 'bookmark-outline'}
                    size={17}
                    color={naLista ? C.blueLight : C.text}
                  />

                  <Text style={styles.actionButtonText}>
                    {naLista
                      ? `Em ${quantidadeListasComMidia} lista(s)`
                      : 'Adicionar à lista'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* SINOPSE */}
          <View style={styles.section}>
            <SectionTitle
              icon="book-outline"
              title="Sinopse"
            />

            <Text style={styles.overview}>
              {detalhes?.overview ||
                'Sinopse não disponível para esta produção.'}
            </Text>

            {!!generos.length && (
              <View style={styles.genreWrap}>
                {generos.map(g => (
                  <View
                    key={g.id}
                    style={styles.genreChip}
                  >
                    <Text style={styles.genreText}>
                      {g.name}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* ONDE ASSISTIR */}
          <View style={styles.section}>
            <SectionTitle
              icon="tv-outline"
              title="Onde assistir"
            />

            <View style={styles.providerCard}>
              {listaProvedores.length ? (
                <View style={styles.providerGrid}>
                  {listaProvedores.map((p, index) => (
                    <TouchableOpacity
                      key={`${p.provider_id}-${p.modalidade}-${index}`}
                      style={styles.providerItem}
                      onPress={() => abrirLink(urlJustWatch)}
                    >
                      {p.logo_path ? (
                        <Image
                          source={{
                            uri: imagemTMDB(p.logo_path, 'w92'),
                          }}
                          style={styles.providerLogo}
                        />
                      ) : (
                        <View
                          style={[
                            styles.providerLogo,
                            styles.providerPlaceholder,
                          ]}
                        >
                          <Ionicons
                            name="play"
                            color={C.blueLight}
                            size={20}
                          />
                        </View>
                      )}

                      <View style={styles.providerInfo}>
                        <Text
                          style={styles.providerName}
                          numberOfLines={2}
                        >
                          {p.provider_name}
                        </Text>

                        <Text style={styles.providerType}>
                          {p.modalidade}
                        </Text>
                      </View>

                      <Feather
                        name="external-link"
                        size={14}
                        color={C.muted}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyText}>
                  Nenhuma plataforma foi informada para o Brasil no momento.
                </Text>
              )}

              <TouchableOpacity
                style={styles.justWatchButton}
                onPress={() => abrirLink(urlJustWatch)}
              >
                <Text style={styles.justWatchText}>
                  Ver disponibilidade completa
                </Text>

                <Feather
                  name="arrow-up-right"
                  size={15}
                  color={C.blueLight}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* ELENCO CLICÁVEL */}
          <View style={styles.section}>
            <SectionTitle
              icon="people-outline"
              title="Elenco principal"
            />

            {elenco.length ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.castList}
              >
                {elenco.map(actor => (
                  <TouchableOpacity
                    key={actor.id}
                    style={styles.castCard}
                    activeOpacity={0.78}
                    onPress={() => abrirPerfilAtor(actor.id)}
                  >
                    {actor.profile_path ? (
                      <Image
                        source={{
                          uri: imagemTMDB(actor.profile_path, 'w185'),
                        }}
                        style={styles.castImage}
                      />
                    ) : (
                      <View
                        style={[
                          styles.castImage,
                          styles.castPlaceholder,
                        ]}
                      >
                        <Ionicons
                          name="person"
                          size={28}
                          color={C.muted}
                        />
                      </View>
                    )}

                    <Text
                      numberOfLines={2}
                      style={styles.castName}
                    >
                      {actor.name}
                    </Text>

                    <Text
                      numberOfLines={2}
                      style={styles.castCharacter}
                    >
                      {actor.character || 'Personagem'}
                    </Text>

                    <Text style={styles.castProfileHint}>
                      VER PERFIL
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.emptyText}>
                Informações de elenco indisponíveis.
              </Text>
            )}
          </View>

          {/* TRAILER */}
          <View style={styles.section}>
            <SectionTitle
              icon="film-outline"
              title="Trailer oficial"
            />

            <View style={styles.videoCard}>
              {trailerAberto && trailerKey ? (
                <YoutubePlayer
                  height={215}
                  play
                  videoId={trailerKey}
                  onChangeState={state => {
                    if (state === 'ended') {
                      setTrailerAberto(false);
                    }
                  }}
                />
              ) : trailerKey ? (
                <TouchableOpacity
                  style={styles.trailerCover}
                  onPress={() => setTrailerAberto(true)}
                  activeOpacity={0.9}
                >
                  {backdrop ? (
                    <Image
                      source={{ uri: backdrop }}
                      style={StyleSheet.absoluteFill}
                    />
                  ) : null}

                  <View style={styles.trailerShade} />

                  <View style={styles.playCircle}>
                    <Ionicons
                      name="play"
                      size={26}
                      color="#fff"
                    />
                  </View>

                  <Text style={styles.trailerLabel}>
                    Assistir trailer
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.emptyMedia}>
                  <Ionicons
                    name="videocam-off-outline"
                    size={28}
                    color={C.muted}
                  />

                  <Text style={styles.emptyText}>
                    Trailer não encontrado.
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* TRILHA SONORA */}
          <View style={styles.section}>
            <View style={styles.soundtrackHeading}>
              <View style={styles.soundtrackTitleWrap}>
                <Ionicons
                  name="musical-notes"
                  size={19}
                  color={C.green}
                />

                <Text style={styles.soundtrackTitle}>
                  Trilha sonora
                </Text>
              </View>

              <Text style={styles.spotifyBadgeText}>
                SPOTIFY
              </Text>
            </View>

            <View style={styles.soundtrackCard}>
              {loadingTrilha ? (
                <View style={styles.soundtrackLoading}>
                  <ActivityIndicator
                    color={C.green}
                    size="small"
                  />

                  <Text style={styles.soundtrackLoadingText}>
                    Buscando trilha sonora...
                  </Text>
                </View>
              ) : trilha?.album ? (
                <>
                  <View style={styles.albumHeader}>
                    {trilha.album.image ? (
                      <Image
                        source={{ uri: trilha.album.image }}
                        style={styles.albumCover}
                      />
                    ) : (
                      <View
                        style={[
                          styles.albumCover,
                          styles.albumFallback,
                        ]}
                      >
                        <Ionicons
                          name="disc-outline"
                          size={25}
                          color={C.muted}
                        />
                      </View>
                    )}

                    <View style={styles.albumInfo}>
                      <Text
                        numberOfLines={2}
                        style={styles.albumName}
                      >
                        {trilha.album.name}
                      </Text>

                      <Text
                        numberOfLines={1}
                        style={styles.albumArtist}
                      >
                        {trilha.album.artists?.join(', ') ||
                          'Artista não informado'}
                      </Text>

                      <Text style={styles.albumTracks}>
                        {trilha.tracks?.length || 0} faixas
                        {trilha.album.releaseDate
                          ? ` • ${trilha.album.releaseDate.slice(0, 4)}`
                          : ''}
                      </Text>

                      <TouchableOpacity
                        style={styles.openAlbumButton}
                        onPress={() => abrirLink(trilha.spotifyUrl)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.openAlbumText}>
                          Abrir álbum no Spotify
                        </Text>

                        <Feather
                          name="external-link"
                          size={12}
                          color={C.green}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.trackDivider} />

                  <View style={styles.trackHeader}>
                    <Text style={styles.trackHeaderTitle}>
                      MÚSICAS
                    </Text>

                    <Text style={styles.trackHeaderCount}>
                      {faixasDoAlbum.length} faixas
                    </Text>
                  </View>

                  {faixasDoAlbum.length ? (
                    <View style={styles.trackList}>
                      {faixasVisiveis.map((faixa, index) => {
                        const selecionada =
                          faixaSelecionada?.id === faixa.id;

                        const tocando =
                          faixaTocandoId === faixa.id;

                        return (
                          <View
                            key={faixa.id || String(index)}
                            style={styles.trackItem}
                          >
                            <TouchableOpacity
                              style={[
                                styles.trackRow,
                                selecionada && styles.trackRowSelected,
                              ]}
                              activeOpacity={0.75}
                              onPress={() => selecionarFaixa(faixa)}
                            >
                              <View
                                style={[
                                  styles.trackPlayIcon,
                                  selecionada && styles.trackPlayIconSelected,
                                ]}
                              >
                                <Ionicons
                                  name={tocando ? 'pause' : 'play'}
                                  size={14}
                                  color={selecionada ? '#07130B' : C.green}
                                />
                              </View>

                              <View style={styles.trackInfo}>
                                <Text
                                  numberOfLines={1}
                                  style={[
                                    styles.trackName,
                                    selecionada && styles.trackNameSelected,
                                  ]}
                                >
                                  {faixa.name}
                                </Text>

                                <Text
                                  numberOfLines={1}
                                  style={styles.trackArtist}
                                >
                                  {faixa.artists?.join(', ') ||
                                    'Artista não informado'}
                                </Text>
                              </View>

                              <Text style={styles.trackDuration}>
                                {formatarTempo(faixa.durationMs)}
                              </Text>
                            </TouchableOpacity>

                            {selecionada && htmlPlayerSpotify && (
                              <View style={styles.inlinePlayerContainer}>
                                <View style={styles.inlinePlayerHeader}>
                                  <View style={styles.inlinePlayerDot} />

                                  <Text style={styles.inlinePlayerLabel}>
                                    PLAYER DO CINETRACK
                                  </Text>

                                  <View style={{ flex: 1 }} />

                                  <TouchableOpacity
                                    onPress={fecharPlayerSpotify}
                                    accessibilityLabel="Fechar player"
                                  >
                                    <Ionicons
                                      name="close"
                                      size={17}
                                      color={C.muted}
                                    />
                                  </TouchableOpacity>
                                </View>

                                <View style={styles.spotifyPlayer}>
                                  <WebView
                                    key={faixa.id}
                                    ref={spotifyWebRef}
                                    source={{
                                      html: htmlPlayerSpotify,
                                      baseUrl: 'https://open.spotify.com',
                                    }}
                                    style={styles.spotifyWebView}
                                    containerStyle={styles.spotifyWebContainer}
                                    originWhitelist={['*']}
                                    javaScriptEnabled
                                    domStorageEnabled
                                    allowsInlineMediaPlayback
                                    allowsFullscreenVideo
                                    allowsProtectedMedia
                                    mediaPlaybackRequiresUserAction={false}
                                    thirdPartyCookiesEnabled
                                    sharedCookiesEnabled
                                    setSupportMultipleWindows={false}
                                    scrollEnabled={false}
                                    nestedScrollEnabled={false}
                                    startInLoadingState
                                    onMessage={receberMensagemSpotify}
                                    renderLoading={() => (
                                      <View style={styles.webLoading}>
                                        <ActivityIndicator color={C.green} />
                                      </View>
                                    )}
                                    onError={event => {
                                      console.warn(
                                        '[CineTrack Spotify] Erro no player:',
                                        event.nativeEvent.description
                                      );
                                    }}
                                    onHttpError={event => {
                                      console.warn(
                                        '[CineTrack Spotify] Erro HTTP:',
                                        event.nativeEvent.statusCode
                                      );
                                    }}
                                  />
                                </View>

                                <Text style={styles.playerHelp}>
                                  A reprodução é controlada pelo player oficial do Spotify.
                                </Text>
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  ) : (
                    <Text style={styles.emptyText}>
                      O Spotify não retornou faixas para este álbum.
                    </Text>
                  )}

                  {faixasDoAlbum.length > 5 && (
                    <TouchableOpacity
                      style={styles.moreTracksButton}
                      activeOpacity={0.75}
                      onPress={() =>
                        setMostrarTodasFaixas(mostrar => !mostrar)
                      }
                    >
                      <Text style={styles.moreTracksText}>
                        {mostrarTodasFaixas
                          ? 'Mostrar menos'
                          : `Ver todas as ${faixasDoAlbum.length} músicas`}
                      </Text>

                      <Ionicons
                        name={mostrarTodasFaixas ? 'chevron-up' : 'chevron-down'}
                        size={15}
                        color={C.green}
                      />
                    </TouchableOpacity>
                  )}

                  <Text style={styles.spotifyAttribution}>
                    Reprodução fornecida pelo Spotify.
                  </Text>
                </>
              ) : (
                <View style={styles.soundtrackEmpty}>
                  <Ionicons
                    name="musical-notes-outline"
                    size={25}
                    color={C.muted}
                  />

                  <Text style={styles.emptyTitle}>
                    Trilha não encontrada
                  </Text>

                  <Text style={styles.emptyText}>
                    {erroTrilha ||
                      'Não encontramos um álbum correspondente no Spotify.'}
                  </Text>

                  <TouchableOpacity
                    style={styles.retrySmall}
                    onPress={() =>
                      carregarTrilha(
                        titulo,
                        tituloOriginal,
                        dataLancamento.slice(0, 4)
                      )
                    }
                  >
                    <Feather
                      name="refresh-cw"
                      size={14}
                      color={C.blueLight}
                    />

                    <Text style={styles.retrySmallText}>
                      Tentar novamente
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* AVALIAÇÃO COMPLETA */}
          <View
            style={styles.section}
            onLayout={event => {
              posicaoAvaliacao.current =
                event.nativeEvent.layout.y;
            }}
          >
            <SectionTitle
              icon="star-outline"
              title="Minha avaliação"
            />

            <View style={styles.ratingCard}>
              <Text style={styles.ratingIntro}>
                Registre sua experiência com esta produção.
              </Text>

              <Text style={styles.ratingFieldTitle}>
                SUA NOTA
              </Text>

              <View style={styles.ratingStars}>
                {Array.from({ length: 5 }, (_, index) => {
                  const valorEstrela = index + 1;

                  return (
                    <TouchableOpacity
                      key={valorEstrela}
                      onPress={() => setNota(valorEstrela)}
                      onLongPress={() =>
                        setNota(valorEstrela - 0.5)
                      }
                      activeOpacity={0.75}
                    >
                      <Ionicons
                        name={
                          nota >= valorEstrela
                            ? 'star'
                            : nota >= valorEstrela - 0.5
                              ? 'star-half'
                              : 'star-outline'
                        }
                        size={32}
                        color={
                          nota >= valorEstrela - 0.5
                            ? C.yellow
                            : '#485160'
                        }
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.ratingValueRow}>
                <Text style={styles.ratingValue}>
                  {nota ? `${nota.toFixed(1)} / 5` : 'Escolha sua nota'}
                </Text>

                <Text style={styles.ratingHint}>
                  Segure para meia estrela
                </Text>
              </View>

              <View style={styles.ratingDivider} />

              <Text style={styles.ratingFieldTitle}>
                SUA RESENHA
              </Text>

              <TextInput
                style={styles.reviewInput}
                value={resenha}
                onChangeText={setResenha}
                placeholder="O que você achou do filme? Escreva sua opinião..."
                placeholderTextColor={C.muted}
                multiline
                maxLength={1000}
                textAlignVertical="top"
                selectionColor={C.blueLight}
              />

              <Text style={styles.reviewCounter}>
                {resenha.length}/1000 caracteres
              </Text>

              <View style={styles.ratingDivider} />

              <Text style={styles.ratingFieldTitle}>
                DATA EM QUE ASSISTIU
              </Text>

              <TouchableOpacity
                style={styles.dateSelectButton}
                activeOpacity={0.75}
                onPress={() => setCalendarioAberto(true)}
              >
                <View style={styles.dateSelectLeft}>
                  <Ionicons
                    name="calendar-outline"
                    size={19}
                    color={C.blueLight}
                  />

                  <View>
                    <Text style={styles.dateSelectLabel}>
                      {dataAssistida ? 'Data escolhida' : 'Quando você assistiu?'}
                    </Text>

                    <Text style={styles.dateSelectValue}>
                      {dataAssistida
                        ? formatarData(dataAssistida)
                        : 'Selecionar data'}
                    </Text>
                  </View>
                </View>

                <Feather
                  name="chevron-right"
                  size={17}
                  color={C.muted}
                />
              </TouchableOpacity>

              {!!dataAssistida && (
                <TouchableOpacity
                  style={styles.clearDateButton}
                  onPress={() => setDataAssistida('')}
                >
                  <Text style={styles.clearDateText}>
                    Remover data
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.saveReviewButton,
                  salvandoNota && styles.saveReviewButtonDisabled,
                ]}
                onPress={salvarAvaliacao}
                disabled={salvandoNota}
                activeOpacity={0.8}
              >
                {salvandoNota ? (
                  <ActivityIndicator
                    size="small"
                    color="#07130B"
                  />
                ) : (
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={18}
                    color="#07130B"
                  />
                )}

                <Text style={styles.saveReviewText}>
                  {salvandoNota
                    ? 'Salvando avaliação...'
                    : 'Salvar minha avaliação'}
                </Text>
              </TouchableOpacity>

              <Text style={styles.ratingStorageHint}>
                Sua avaliação fica salva neste dispositivo.
              </Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerBrand}>
              CINE
              <Text style={{ color: C.blueLight }}>
                TRACK
              </Text>
            </Text>

            <Text style={styles.footerText}>
              Filmes • Séries • Trilhas sonoras
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* =====================================================
          MODAL: ESCOLHER UMA OU MAIS LISTAS
      ====================================================== */}

      <Modal
        visible={modalListasVisivel}
        transparent
        animationType="fade"
        onRequestClose={() => setModalListasVisivel(false)}
        statusBarTranslucent
      >
        <View style={styles.listModalOverlay}>
          <View style={styles.listModalCard}>
            <View style={styles.listModalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.listModalEyebrow}>
                  ORGANIZE SUAS OBRAS
                </Text>

                <Text style={styles.listModalTitle}>
                  Adicionar à lista
                </Text>

                <Text style={styles.listModalSubtitle}>
                  Escolha em quais listas deseja guardar esta produção.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.listModalClose}
                onPress={() => setModalListasVisivel(false)}
              >
                <Ionicons
                  name="close"
                  size={21}
                  color={C.text}
                />
              </TouchableOpacity>
            </View>

            {carregandoListas ? (
              <View style={styles.listModalLoading}>
                <ActivityIndicator
                  size="large"
                  color={C.blueLight}
                />

                <Text style={styles.listModalEmptyText}>
                  Carregando suas listas...
                </Text>
              </View>
            ) : listasUsuario.length ? (
              <ScrollView
                style={styles.listModalScroll}
                showsVerticalScrollIndicator={false}
              >
                {listasUsuario.map(lista => {
                  const adicionada = lista.itens.some(item =>
                    String(item.id) === String(id) &&
                    normalizarTipo(item.tipo) === tipo
                  );

                  const salvando =
                    listaSalvandoId === String(lista.id);

                  return (
                    <TouchableOpacity
                      key={lista.id}
                      style={[
                        styles.listChoice,
                        adicionada && styles.listChoiceSelected,
                      ]}
                      activeOpacity={0.8}
                      disabled={Boolean(listaSalvandoId)}
                      onPress={() => alternarObraNaLista(lista)}
                    >
                      <View style={styles.listChoiceIcon}>
                        <Ionicons
                          name="list"
                          size={20}
                          color={C.green}
                        />
                      </View>

                      <View style={styles.listChoiceInfo}>
                        <Text
                          style={styles.listChoiceName}
                          numberOfLines={1}
                        >
                          {lista.nome}
                        </Text>

                        <Text style={styles.listChoiceCount}>
                          {lista.itens.length}{' '}
                          {lista.itens.length === 1 ? 'obra' : 'obras'}
                        </Text>
                      </View>

                      {salvando ? (
                        <ActivityIndicator
                          size="small"
                          color={C.blueLight}
                        />
                      ) : (
                        <View
                          style={[
                            styles.listChoiceAction,
                            adicionada && styles.listChoiceActionAdded,
                          ]}
                        >
                          <Ionicons
                            name={adicionada ? 'checkmark' : 'add'}
                            size={17}
                            color={adicionada ? C.green : '#FFFFFF'}
                          />

                          <Text
                            style={[
                              styles.listChoiceActionText,
                              adicionada && styles.listChoiceActionTextAdded,
                            ]}
                          >
                            {adicionada ? 'Adicionada' : 'Adicionar'}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : (
              <View style={styles.listModalEmpty}>
                <Ionicons
                  name="file-tray-outline"
                  size={39}
                  color={C.muted}
                />

                <Text style={styles.listModalEmptyTitle}>
                  Nenhuma lista encontrada
                </Text>

                <Text style={styles.listModalEmptyText}>
                  Crie uma lista na área Novo Registro. Depois ela aparecerá aqui para você adicionar esta produção.
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.listModalDone}
              onPress={() => setModalListasVisivel(false)}
            >
              <Text style={styles.listModalDoneText}>
                Concluir
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* CALENDÁRIO */}
      <CalendarioModal
        visible={calendarioAberto}
        value={dataAssistida}
        onClose={() => setCalendarioAberto(false)}
        onSelect={setDataAssistida}
      />

      {/* MODAL DO ATOR OU ATRIZ */}
      <Modal
        visible={atorModalVisivel}
        transparent
        animationType="slide"
        onRequestClose={fecharPerfilAtor}
        statusBarTranslucent
      >
        <View style={styles.actorModalOverlay}>
          <SafeAreaView style={styles.actorModalSafe}>
            <View style={styles.actorModalContainer}>
              <View style={styles.actorModalTop}>
                <Text style={styles.actorModalTopTitle}>
                  PERFIL DO ARTISTA
                </Text>

                <TouchableOpacity
                  style={styles.actorCloseButton}
                  onPress={fecharPerfilAtor}
                >
                  <Ionicons
                    name="close"
                    size={23}
                    color={C.text}
                  />
                </TouchableOpacity>
              </View>

              {carregandoAtor ? (
                <View style={styles.actorLoading}>
                  <ActivityIndicator
                    size="large"
                    color={C.blueLight}
                  />

                  <Text style={styles.loadingText}>
                    Carregando informações do artista...
                  </Text>
                </View>
              ) : erroAtor ? (
                <View style={styles.actorLoading}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={42}
                    color={C.red}
                  />

                  <Text style={styles.errorText}>
                    {erroAtor}
                  </Text>

                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={fecharPerfilAtor}
                  >
                    <Text style={styles.retryText}>
                      Fechar
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : atorSelecionado ? (
                <ScrollView
                  style={styles.actorModalScroll}
                  contentContainerStyle={styles.actorModalContent}
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.actorProfileHeader}>
                    {atorSelecionado.foto ? (
                      <Image
                        source={{ uri: atorSelecionado.foto }}
                        style={styles.actorProfileImage}
                      />
                    ) : (
                      <View
                        style={[
                          styles.actorProfileImage,
                          styles.actorProfileImageFallback,
                        ]}
                      >
                        <Ionicons
                          name="person"
                          size={45}
                          color={C.muted}
                        />
                      </View>
                    )}

                    <View style={styles.actorProfileInfo}>
                      <Text style={styles.actorProfileName}>
                        {atorSelecionado.nome}
                      </Text>

                      {!!atorSelecionado.departamento && (
                        <Text style={styles.actorDepartment}>
                          {atorSelecionado.departamento}
                        </Text>
                      )}

                      <View style={styles.actorInfoLine}>
                        <Ionicons
                          name="calendar-outline"
                          size={15}
                          color={C.blueLight}
                        />

                        <Text style={styles.actorInfoText}>
                          Nascimento:{' '}
                          {formatarData(atorSelecionado.dataNascimento)}
                        </Text>
                      </View>

                      <View style={styles.actorInfoLine}>
                        <Ionicons
                          name="location-outline"
                          size={15}
                          color={C.blueLight}
                        />

                        <Text style={styles.actorInfoText}>
                          {atorSelecionado.localNascimento ||
                            'Local de nascimento não informado'}
                        </Text>
                      </View>

                      <View style={styles.actorInfoLine}>
                        <Ionicons
                          name="globe-outline"
                          size={15}
                          color={C.blueLight}
                        />

                        <Text style={styles.actorInfoText}>
                          País: {atorSelecionado.paisNascimento}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.actorBioSection}>
                    <SectionTitle
                      icon="person-outline"
                      title="Biografia"
                    />

                    <Text style={styles.actorBiography}>
                      {atorSelecionado.biografia ||
                        'Biografia não cadastrada no TMDB.'}
                    </Text>
                  </View>

                  <View style={styles.actorFilmographySection}>
                    <SectionTitle
                      icon="film-outline"
                      title={`Filmes (${atorSelecionado.filmes.length})`}
                    />

                    {atorSelecionado.filmes.length ? (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.actorFilmList}
                      >
                        {atorSelecionado.filmes.map(item => (
                          <CartaoFilmografia
                            key={`movie-${item.id}`}
                            item={item}
                            aoAbrir={abrirProducaoDaFilmografia}
                          />
                        ))}
                      </ScrollView>
                    ) : (
                      <Text style={styles.emptyText}>
                        Nenhum filme encontrado na filmografia.
                      </Text>
                    )}
                  </View>

                  <View style={styles.actorFilmographySection}>
                    <SectionTitle
                      icon="tv-outline"
                      title={`Séries (${atorSelecionado.series.length})`}
                    />

                    {atorSelecionado.series.length ? (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.actorFilmList}
                      >
                        {atorSelecionado.series.map(item => (
                          <CartaoFilmografia
                            key={`tv-${item.id}`}
                            item={item}
                            aoAbrir={abrirProducaoDaFilmografia}
                          />
                        ))}
                      </ScrollView>
                    ) : (
                      <Text style={styles.emptyText}>
                        Nenhuma série encontrada na filmografia.
                      </Text>
                    )}
                  </View>

                  <Text style={styles.actorSource}>
                    Informações de elenco e filmografia fornecidas pelo TMDB.
                  </Text>
                </ScrollView>
              ) : null}
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ============================================================
// ESTILOS
// ============================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.bg,
    paddingTop:
      Platform.OS === 'android'
        ? StatusBar.currentHeight || 24
        : 0,
  },

  container: {
    flex: 1,
    backgroundColor: C.bg,
  },

  scrollContent: {
    paddingBottom: 30,
  },

  loadingScreen: {
    flex: 1,
    backgroundColor: C.bg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
    gap: 15,
    paddingTop:
      Platform.OS === 'android'
        ? StatusBar.currentHeight || 24
        : 0,
  },

  loadingText: {
    color: C.secondary,
    fontSize: 13,
    textAlign: 'center',
  },

  errorTitle: {
    color: C.text,
    fontSize: 20,
    fontWeight: '800',
  },

  errorText: {
    color: C.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: C.blue,
    marginTop: 8,
  },

  retryText: {
    color: '#fff',
    fontWeight: '800',
  },

  backLink: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    padding: 10,
  },

  backLinkText: {
    color: C.blueLight,
    fontWeight: '700',
  },

  hero: {
    height: 285,
    position: 'relative',
    backgroundColor: '#101827',
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    opacity: 0.9,
  },

  backButton: {
    position: 'absolute',
    top: 15,
    left: 17,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: 'rgba(5,6,8,0.72)',
    borderWidth: 1,
    borderColor: C.border,
  },

  backButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },

  mainContent: {
    paddingHorizontal: 18,
    marginTop: -95,
  },

  topInfo: {
    flexDirection: 'row',
    gap: 17,
    alignItems: 'flex-end',
  },

  posterColumn: {
    width: 126,
    flexShrink: 0,
    alignItems: 'center',
  },

  poster: {
    width: 126,
    height: 188,
    borderRadius: 13,
    backgroundColor: C.elevated,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },

  posterFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  tmdbScore: {
    marginTop: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.elevated,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
  },

  tmdbScoreText: {
    color: C.text,
    fontWeight: '900',
    fontSize: 12,
  },

  tmdbScoreOut: {
    color: C.muted,
    fontSize: 10,
  },

  infoColumn: {
    flex: 1,
    paddingBottom: 3,
    minWidth: 0,
  },

  eyebrow: {
    color: C.blueLight,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.7,
    marginBottom: 7,
  },

  title: {
    color: '#fff',
    fontSize: 25,
    lineHeight: 30,
    fontWeight: '900',
    letterSpacing: -0.6,
  },

  originalTitle: {
    color: C.muted,
    fontSize: 11,
    marginTop: 4,
  },

  metaWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 11,
    alignItems: 'center',
  },

  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: C.elevated,
    borderWidth: 1,
    borderColor: C.border,
  },

  metaText: {
    color: C.secondary,
    fontSize: 10,
    fontWeight: '700',
  },

  ageBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  ageText: {
    fontSize: 10,
    fontWeight: '900',
  },

  directorRow: {
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
    marginTop: 10,
  },

  directorText: {
    color: C.secondary,
    fontSize: 10,
    flex: 1,
  },

  directorName: {
    color: C.text,
    fontWeight: '800',
  },

  heroActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 13,
    flexWrap: 'wrap',
  },

  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.elevated,
  },

  primaryButton: {
    backgroundColor: C.blue,
    borderColor: C.blue,
  },

  primaryButtonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
  },

  actionButtonText: {
    color: C.text,
    fontSize: 10,
    fontWeight: '800',
  },

  savedButton: {
    borderColor: 'rgba(96,165,250,0.45)',
    backgroundColor: 'rgba(59,130,246,0.13)',
  },

  section: {
    marginTop: 30,
  },

  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 14,
  },

  sectionAccent: {
    width: 3,
    height: 19,
    borderRadius: 2,
    backgroundColor: C.blue,
  },

  sectionTitle: {
    color: C.text,
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: -0.2,
  },

  sectionRule: {
    flex: 1,
    height: 1,
    backgroundColor: C.border,
    marginLeft: 3,
  },

  overview: {
    color: '#C5CEDA',
    fontSize: 13,
    lineHeight: 22,
  },

  genreWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 14,
  },

  genreChip: {
    backgroundColor: 'rgba(59,130,246,0.10)',
    borderColor: 'rgba(59,130,246,0.22)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },

  genreText: {
    color: C.blueLight,
    fontSize: 10,
    fontWeight: '700',
  },

  providerCard: {
    padding: 14,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
  },

  providerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },

  providerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    width: '48%',
    minHeight: 58,
    padding: 8,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.elevated,
  },

  providerLogo: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#fff',
  },

  providerPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.surface,
  },

  providerInfo: {
    flex: 1,
    minWidth: 0,
  },

  providerName: {
    color: C.text,
    fontSize: 10,
    fontWeight: '800',
  },

  providerType: {
    color: C.muted,
    fontSize: 9,
    marginTop: 3,
  },

  justWatchButton: {
    borderTopWidth: 1,
    borderTopColor: C.border,
    marginTop: 12,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
  },

  justWatchText: {
    color: C.blueLight,
    fontSize: 11,
    fontWeight: '800',
  },

  emptyText: {
    color: C.muted,
    fontSize: 11,
    lineHeight: 18,
  },

  castList: {
    gap: 11,
    paddingRight: 4,
  },

  castCard: {
    width: 104,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
    padding: 7,
  },

  castImage: {
    width: '100%',
    height: 112,
    borderRadius: 9,
    backgroundColor: C.elevated,
  },

  castPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  castName: {
    color: C.text,
    fontSize: 10,
    fontWeight: '800',
    marginTop: 8,
  },

  castCharacter: {
    color: C.muted,
    fontSize: 9,
    marginTop: 4,
    lineHeight: 13,
  },

  castProfileHint: {
    color: C.blueLight,
    fontSize: 8,
    fontWeight: '900',
    marginTop: 8,
    letterSpacing: 0.6,
  },

  videoCard: {
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: '#000',
  },

  trailerCover: {
    height: 205,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#101827',
  },

  trailerShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.48)',
  },

  playCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#E62117',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 3,
  },

  trailerLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 10,
  },

  emptyMedia: {
    height: 130,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 9,
  },

  // Spotify

  soundtrackHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 11,
  },

  soundtrackTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  soundtrackTitle: {
    color: C.text,
    fontSize: 15,
    fontWeight: '900',
  },

  spotifyBadgeText: {
    color: C.green,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },

  soundtrackCard: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 13,
    padding: 11,
    overflow: 'hidden',
  },

  soundtrackLoading: {
    minHeight: 75,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },

  soundtrackLoadingText: {
    color: C.secondary,
    fontSize: 11,
  },

  albumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  albumCover: {
    width: 59,
    height: 59,
    borderRadius: 7,
    backgroundColor: C.elevated,
  },

  albumFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  albumInfo: {
    flex: 1,
    minWidth: 0,
  },

  albumName: {
    color: C.text,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
  },

  albumArtist: {
    color: C.secondary,
    fontSize: 9,
    marginTop: 3,
  },

  albumTracks: {
    color: C.muted,
    fontSize: 9,
    marginTop: 3,
  },

  openAlbumButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
    paddingVertical: 2,
  },

  openAlbumText: {
    color: C.green,
    fontSize: 9,
    fontWeight: '800',
  },

  trackDivider: {
    height: 1,
    backgroundColor: C.border,
    marginTop: 12,
    marginBottom: 10,
  },

  trackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },

  trackHeaderTitle: {
    color: C.secondary,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },

  trackHeaderCount: {
    color: C.muted,
    fontSize: 9,
  },

  trackList: {
    width: '100%',
  },

  trackItem: {
    width: '100%',
  },

  trackRow: {
    minHeight: 43,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 5,
    paddingVertical: 5,
    borderRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.035)',
  },

  trackRowSelected: {
    backgroundColor: 'rgba(29,185,84,0.08)',
  },

  trackPlayIcon: {
    width: 27,
    height: 27,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(29,185,84,0.08)',
  },

  trackPlayIconSelected: {
    backgroundColor: C.green,
  },

  trackInfo: {
    flex: 1,
    minWidth: 0,
  },

  trackName: {
    color: C.text,
    fontSize: 10,
    fontWeight: '700',
  },

  trackNameSelected: {
    color: C.green,
  },

  trackArtist: {
    color: C.muted,
    fontSize: 9,
    marginTop: 2,
  },

  trackDuration: {
    color: C.muted,
    fontSize: 9,
    marginLeft: 3,
  },

  moreTracksButton: {
    minHeight: 37,
    marginTop: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(29,185,84,0.07)',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
  },

  moreTracksText: {
    color: C.green,
    fontSize: 10,
    fontWeight: '800',
  },

  inlinePlayerContainer: {
    marginHorizontal: 3,
    marginTop: 5,
    marginBottom: 8,
    padding: 7,
    borderRadius: 9,
    backgroundColor: '#101613',
    borderWidth: 1,
    borderColor: 'rgba(29,185,84,0.16)',
  },

  inlinePlayerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 7,
  },

  inlinePlayerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.green,
  },

  inlinePlayerLabel: {
    color: C.green,
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  spotifyPlayer: {
    height: 152,
    backgroundColor: '#121212',
    borderRadius: 8,
    overflow: 'hidden',
  },

  spotifyWebContainer: {
    backgroundColor: '#121212',
  },

  spotifyWebView: {
    flex: 1,
    backgroundColor: '#121212',
  },

  webLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#121212',
  },

  playerHelp: {
    color: C.muted,
    fontSize: 8,
    lineHeight: 12,
    marginTop: 6,
  },

  spotifyAttribution: {
    color: C.muted,
    fontSize: 8,
    textAlign: 'center',
    marginTop: 8,
  },

  soundtrackEmpty: {
    minHeight: 135,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
  },

  emptyTitle: {
    color: C.text,
    fontSize: 13,
    fontWeight: '800',
  },

  retrySmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    padding: 9,
    marginTop: 4,
  },

  retrySmallText: {
    color: C.blueLight,
    fontSize: 11,
    fontWeight: '800',
  },

  // Avaliação

  ratingCard: {
    padding: 16,
    borderRadius: 15,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },

  ratingIntro: {
    color: C.secondary,
    fontSize: 11,
    lineHeight: 17,
    marginBottom: 17,
  },

  ratingFieldTitle: {
    color: C.secondary,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.9,
  },

  ratingStars: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 11,
  },

  ratingValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 9,
  },

  ratingValue: {
    color: C.yellow,
    fontSize: 12,
    fontWeight: '900',
  },

  ratingHint: {
    color: C.muted,
    fontSize: 9,
  },

  ratingDivider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 16,
  },

  reviewInput: {
    minHeight: 105,
    maxHeight: 190,
    marginTop: 9,
    padding: 11,
    borderRadius: 10,
    backgroundColor: C.elevated,
    borderWidth: 1,
    borderColor: C.border,
    color: C.text,
    fontSize: 12,
    lineHeight: 19,
  },

  reviewCounter: {
    color: C.muted,
    fontSize: 9,
    textAlign: 'right',
    marginTop: 6,
  },

  dateSelectButton: {
    minHeight: 57,
    marginTop: 10,
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: C.elevated,
    borderWidth: 1,
    borderColor: C.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  dateSelectLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  dateSelectLabel: {
    color: C.muted,
    fontSize: 9,
  },

  dateSelectValue: {
    color: C.text,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 3,
  },

  clearDateButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 2,
  },

  clearDateText: {
    color: C.muted,
    fontSize: 9,
    fontWeight: '700',
  },

  saveReviewButton: {
    minHeight: 45,
    marginTop: 17,
    borderRadius: 10,
    backgroundColor: C.green,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  saveReviewButtonDisabled: {
    opacity: 0.65,
  },

  saveReviewText: {
    color: '#07130B',
    fontSize: 11,
    fontWeight: '900',
  },

  ratingStorageHint: {
    color: C.muted,
    fontSize: 8,
    textAlign: 'center',
    marginTop: 9,
  },

  // Modal do seletor de listas

  listModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.78)',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 25,
  },

  listModalCard: {
    maxHeight: '82%',
    backgroundColor: '#10141C',
    borderRadius: 19,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
  },

  listModalHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    marginBottom: 17,
  },

  listModalEyebrow: {
    color: C.green,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.2,
  },

  listModalTitle: {
    color: C.text,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 5,
  },

  listModalSubtitle: {
    color: C.secondary,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 5,
  },

  listModalClose: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: C.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },

  listModalLoading: {
    minHeight: 150,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },

  listModalScroll: {
    flexGrow: 0,
  },

  listChoice: {
    minHeight: 67,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderWidth: 1,
    borderColor: C.border,
  },

  listChoiceSelected: {
    backgroundColor: 'rgba(29,185,84,0.07)',
    borderColor: 'rgba(29,185,84,0.25)',
  },

  listChoiceIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: 'rgba(29,185,84,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  listChoiceInfo: {
    flex: 1,
  },

  listChoiceName: {
    color: C.text,
    fontSize: 12,
    fontWeight: '800',
  },

  listChoiceCount: {
    color: C.muted,
    fontSize: 9,
    marginTop: 4,
  },

  listChoiceAction: {
    minHeight: 32,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 8,
    backgroundColor: C.blue,
  },

  listChoiceActionAdded: {
    backgroundColor: 'rgba(29,185,84,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(29,185,84,0.20)',
  },

  listChoiceActionText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
  },

  listChoiceActionTextAdded: {
    color: C.green,
  },

  listModalEmpty: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 10,
  },

  listModalEmptyTitle: {
    color: C.text,
    fontSize: 13,
    fontWeight: '800',
  },

  listModalEmptyText: {
    color: C.secondary,
    fontSize: 10,
    lineHeight: 16,
    textAlign: 'center',
  },

  listModalDone: {
    minHeight: 44,
    marginTop: 15,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.blue,
  },

  listModalDoneText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },

  // Calendário

  calendarOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.78)',
    justifyContent: 'center',
    padding: 18,
  },

  calendarCard: {
    backgroundColor: '#10141C',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
  },

  calendarTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  calendarEyebrow: {
    color: C.blueLight,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },

  calendarTitle: {
    color: C.text,
    fontSize: 16,
    fontWeight: '900',
    marginTop: 5,
  },

  calendarClose: {
    width: 33,
    height: 33,
    borderRadius: 10,
    backgroundColor: C.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },

  calendarMonthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 12,
  },

  calendarArrow: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: C.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },

  calendarMonth: {
    color: C.text,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'capitalize',
  },

  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  calendarWeekday: {
    width: '14.2857%',
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },

  calendarWeekdayText: {
    color: C.muted,
    fontSize: 8,
    fontWeight: '900',
  },

  calendarDay: {
    width: '14.2857%',
    aspectRatio: 1,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },

  calendarDaySelected: {
    backgroundColor: C.blue,
  },

  calendarDayToday: {
    borderWidth: 1,
    borderColor: C.blueLight,
  },

  calendarDayDisabled: {
    opacity: 0.25,
  },

  calendarDayText: {
    color: C.text,
    fontSize: 11,
    fontWeight: '600',
  },

  calendarDayTextSelected: {
    color: '#fff',
    fontWeight: '900',
  },

  calendarDayTextDisabled: {
    color: C.muted,
  },

  calendarTodayButton: {
    minHeight: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(59,130,246,0.13)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
  },

  calendarTodayText: {
    color: C.blueLight,
    fontSize: 11,
    fontWeight: '800',
  },

  // Rodapé

  footer: {
    alignItems: 'center',
    marginTop: 35,
    paddingTop: 22,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },

  footerBrand: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
  },

  footerText: {
    color: C.muted,
    fontSize: 9,
    marginTop: 5,
  },

  // Perfil de atores

  actorModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 12,
  },

  actorModalSafe: {
    flex: 1,
    justifyContent: 'center',
  },

  actorModalContainer: {
    flex: 1,
    maxHeight: '96%',
    backgroundColor: '#0A0E16',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.22)',
    overflow: 'hidden',
  },

  actorModalTop: {
    minHeight: 58,
    paddingHorizontal: 17,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: '#0D111B',
  },

  actorModalTopTitle: {
    color: C.blueLight,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.4,
  },

  actorCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.elevated,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  actorLoading: {
    flex: 1,
    minHeight: 250,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 25,
    gap: 15,
  },

  actorModalScroll: {
    flex: 1,
  },

  actorModalContent: {
    padding: 17,
    paddingBottom: 35,
  },

  actorProfileHeader: {
    flexDirection: 'row',
    gap: 15,
    alignItems: 'flex-start',
  },

  actorProfileImage: {
    width: 112,
    height: 158,
    borderRadius: 13,
    backgroundColor: C.elevated,
    borderWidth: 1,
    borderColor: C.border,
  },

  actorProfileImageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  actorProfileInfo: {
    flex: 1,
    minWidth: 0,
    gap: 9,
  },

  actorProfileName: {
    color: C.text,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '900',
  },

  actorDepartment: {
    color: C.blueLight,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  actorInfoLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
  },

  actorInfoText: {
    flex: 1,
    color: C.secondary,
    fontSize: 10,
    lineHeight: 16,
  },

  actorBioSection: {
    marginTop: 25,
  },

  actorBiography: {
    color: '#C5CEDA',
    fontSize: 12,
    lineHeight: 20,
  },

  actorFilmographySection: {
    marginTop: 27,
  },

  actorFilmList: {
    gap: 11,
    paddingRight: 5,
  },

  actorFilmCard: {
    width: 112,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 7,
  },

  actorFilmPoster: {
    width: '100%',
    height: 145,
    borderRadius: 8,
    backgroundColor: C.elevated,
  },

  actorFilmPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  actorFilmTitle: {
    color: C.text,
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 14,
    marginTop: 8,
  },

  actorFilmYear: {
    color: C.blueLight,
    fontSize: 9,
    fontWeight: '800',
    marginTop: 4,
  },

  actorFilmRole: {
    color: C.muted,
    fontSize: 9,
    lineHeight: 13,
    marginTop: 4,
  },

  actorSource: {
    color: C.muted,
    fontSize: 9,
    textAlign: 'center',
    marginTop: 28,
  },
});