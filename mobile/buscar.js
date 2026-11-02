
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
  ImageBackground,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// IMPORTANTE:
// Este é o mesmo serviço de armazenamento utilizado pelo NovoRegistro.js.
import {
  lerListas,
  atualizarListas,
  normalizarItemLista,
  normalizarTipoLista,
} from './listasStorage';

// ============================================================
// CONFIGURAÇÕES
// ============================================================

const TMDB_KEY = '5c1853c10d9752023da5ddce4ada3b77';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMAGE = 'https://image.tmdb.org/t/p/';

const SERVER_ROOT =
  (typeof process !== 'undefined' &&
    process.env?.EXPO_PUBLIC_CINETRACK_SERVER_URL) ||
  'https://compatible-assumed-williams-felt.trycloudflare.com/TCC/TCC';

const USERS_SEARCH_URL =
  typeof process !== 'undefined'
    ? process.env?.EXPO_PUBLIC_CINETRACK_USERS_SEARCH_URL || ''
    : '';

const LISTS_SEARCH_URL =
  typeof process !== 'undefined'
    ? process.env?.EXPO_PUBLIC_CINETRACK_LISTS_SEARCH_URL || ''
    : '';

const KEY_GENEROS = [
  '@CineTrack:generosFavoritos',
  '@CineTrack:generos',
  '@CineTrack:preferencias',
];

const COLORS = {
  bg: '#050608',
  surface: '#0D0F13',
  elevated: '#12151B',
  elevated2: '#171C25',
  border: 'rgba(255,255,255,0.08)',
  blue: '#3B82F6',
  blueLight: '#60A5FA',
  text: '#F5F7FA',
  secondary: '#9CA3AF',
  muted: '#687386',
  green: '#22C55E',
  red: '#EF4444',
  yellow: '#FBBF24',
  purple: '#A855F7',
  pink: '#EC4899',
};

const TABS = [
  { id: 'all', label: 'Tudo' },
  { id: 'movie', label: 'Filmes' },
  { id: 'tv', label: 'Séries' },
  { id: 'person', label: 'Pessoas' },
  { id: 'users', label: 'Usuários' },
  { id: 'lists', label: 'Listas' },
];

const GENRES = [
  { id: 27, name: 'Terror', icon: 'skull-outline', color: '#A855F7' },
  { id: 10749, name: 'Romance', icon: 'heart-outline', color: '#EC4899' },
  { id: 878, name: 'Ficção científica', icon: 'planet-outline', color: '#38BDF8' },
  { id: 28, name: 'Ação', icon: 'flash-outline', color: '#F97316' },
  { id: 18, name: 'Drama', icon: 'theater-outline', color: '#60A5FA' },
  { id: 35, name: 'Comédia', icon: 'happy-outline', color: '#FBBF24' },
  { id: 14, name: 'Fantasia', icon: 'sparkles-outline', color: '#A78BFA' },
  { id: 9648, name: 'Mistério', icon: 'eye-outline', color: '#2DD4BF' },
  { id: 53, name: 'Suspense', icon: 'alert-circle-outline', color: '#FB7185' },
  { id: 16, name: 'Animação', icon: 'color-palette-outline', color: '#34D399' },
  { id: 99, name: 'Documentário', icon: 'videocam-outline', color: '#93C5FD' },
  { id: 12, name: 'Aventura', icon: 'compass-outline', color: '#F59E0B' },
];

const GENRE_NAMES = {
  acao: 28,
  'ação': 28,
  aventura: 12,
  animacao: 16,
  'animação': 16,
  comedia: 35,
  'comédia': 35,
  crime: 80,
  documentario: 99,
  'documentário': 99,
  drama: 18,
  familia: 10751,
  'família': 10751,
  fantasia: 14,
  historia: 36,
  'história': 36,
  terror: 27,
  musica: 10402,
  'música': 10402,
  misterio: 9648,
  'mistério': 9648,
  romance: 10749,
  'ficcao cientifica': 878,
  'ficção científica': 878,
  suspense: 53,
  thriller: 53,
  guerra: 10752,
  faroeste: 37,
  'sci-fi': 878,
};

const FALLBACK_POSTER = null;

// ============================================================
// FUNÇÕES DE MÍDIA
// ============================================================

const tituloMidia = item =>
  item?.title ||
  item?.name ||
  item?.original_title ||
  item?.original_name ||
  'Sem título';

const anoMidia = item => {
  const data = item?.release_date || item?.first_air_date;

  return data
    ? String(data).slice(0, 4)
    : 'Ano não informado';
};

const imagemMidia = (path, tamanho = 'w500') =>
  path
    ? `${TMDB_IMAGE}${tamanho}${path}`
    : FALLBACK_POSTER;

const tipoDetalhes = item => {
  return normalizarTipoLista(
    item?.media_type ||
    item?.tipo ||
    item?.mediaType
  );
};

const chaveMidia = item =>
  `${tipoDetalhes(item)}-${item.id}`;

async function requisicaoTMDB(endpoint, params = {}) {
  const query = new URLSearchParams({
    api_key: TMDB_KEY,
    language: 'pt-BR',
    ...Object.fromEntries(
      Object.entries(params).map(([key, value]) => [
        key,
        String(value),
      ])
    ),
  });

  const resposta = await fetch(
    `${TMDB_BASE}${endpoint}?${query.toString()}`
  );

  if (!resposta.ok) {
    throw new Error(
      `Erro ao consultar o catálogo (${resposta.status}).`
    );
  }

  return resposta.json();
}

function extrairLista(dados, possiveisChaves) {
  if (Array.isArray(dados)) return dados;

  for (const chave of possiveisChaves) {
    if (Array.isArray(dados?.[chave])) {
      return dados[chave];
    }
  }

  return [];
}

// ============================================================
// GÊNEROS FAVORITOS
// ============================================================

function normalizarGeneros(valor) {
  if (!valor) return [];

  let lista = valor;

  if (typeof lista === 'string') {
    try {
      lista = JSON.parse(lista);
    } catch {
      lista = lista.split(',');
    }
  }

  if (!Array.isArray(lista)) {
    lista =
      lista.generos ||
      lista.generosSelecionados ||
      lista.selectedGenres ||
      lista.favoritos ||
      lista.preferences ||
      [];
  }

  const ids = [];

  lista.forEach(item => {
    let id = null;

    if (typeof item === 'number') {
      id = item;
    } else if (typeof item === 'string') {
      const texto = item.trim().toLowerCase();

      id = GENRE_NAMES[texto] || Number(texto) || null;
    } else if (item && typeof item === 'object') {
      id =
        Number(item.id || item.genre_id || item.tmdb_id) ||
        GENRE_NAMES[
          String(item.name || item.nome || '').toLowerCase()
        ] ||
        null;
    }

    if (
      id &&
      !Number.isNaN(Number(id)) &&
      !ids.includes(Number(id))
    ) {
      ids.push(Number(id));
    }
  });

  return ids;
}

async function carregarGenerosSalvos() {
  for (const chave of KEY_GENEROS) {
    try {
      const valor = await AsyncStorage.getItem(chave);

      if (valor) {
        const generos = normalizarGeneros(valor);

        if (generos.length) return generos;
      }
    } catch (erro) {
      console.warn('Erro ao ler gêneros:', erro);
    }
  }

  try {
    const usuarioTexto = await AsyncStorage.getItem(
      '@CineTrack:usuario'
    );

    if (usuarioTexto) {
      const usuario = JSON.parse(usuarioTexto);

      const possiveis =
        usuario.generos ||
        usuario.generos_favoritos ||
        usuario.favorite_genres ||
        usuario.preferencias?.generos ||
        [];

      return normalizarGeneros(possiveis);
    }
  } catch (erro) {
    console.warn(
      'Não foi possível ler os gêneros do perfil:',
      erro
    );
  }

  return [];
}

// ============================================================
// AVALIAÇÕES DO CINETRACK
// ============================================================

async function buscarMediaCineTrack(id, tipo) {
  try {
    const url =
      `${SERVER_ROOT.replace(/\/+$/, '')}/listar_avaliacoes.php` +
      `?tmdb_id=${encodeURIComponent(id)}` +
      `&tipo=${encodeURIComponent(tipo)}`;

    const resposta = await fetch(url);

    if (!resposta.ok) return null;

    const dados = await resposta.json();

    const avaliacoes = Array.isArray(dados.avaliacoes)
      ? dados.avaliacoes
      : [];

    if (!avaliacoes.length) return null;

    const notas = avaliacoes
      .map(item => Number(item.stars))
      .filter(nota => Number.isFinite(nota) && nota > 0);

    if (!notas.length) return null;

    const media =
      notas.reduce((total, nota) => total + nota, 0) /
      notas.length;

    return {
      media: Number((media * 2).toFixed(1)),
      quantidade: notas.length,
    };
  } catch {
    return null;
  }
}

// ============================================================
// BUSCA DE USUÁRIOS E LISTAS NO BACKEND
// ============================================================

async function buscarNoBackend(urlBase, termo) {
  if (!urlBase) return [];

  try {
    const separador = urlBase.includes('?') ? '&' : '?';

    const url =
      `${urlBase}${separador}q=${encodeURIComponent(termo)}`;

    const resposta = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!resposta.ok) return [];

    const dados = await resposta.json();

    return extrairLista(dados, [
      'results',
      'resultados',
      'usuarios',
      'users',
      'listas',
      'lists',
      'data',
    ]);
  } catch (erro) {
    console.warn('Erro na busca do backend:', erro);
    return [];
  }
}

// ============================================================
// LISTAS PESSOAIS
// Todas as operações usam listasStorage.js.
// Não existe mais uma segunda interpretação ou gravação aqui.
// ============================================================

function obterTodasAsObrasSalvas(listas) {
  const resultado = [];

  (listas || []).forEach(lista => {
    const itens = Array.isArray(lista.itens)
      ? lista.itens
      : [];

    itens.forEach(item => {
      const normalizado = normalizarItemLista(item);

      if (normalizado) {
        resultado.push(normalizado);
      }
    });
  });

  return resultado;
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function Buscar({
  onVoltar,
  onAbrirDetalhes,
  onAbrirPerfil,
  onAbrirLista,
}) {
  const [textoBusca, setTextoBusca] = useState('');
  const [consulta, setConsulta] = useState('');
  const [aba, setAba] = useState('all');

  const [generosFavoritos, setGenerosFavoritos] = useState([]);
  const [generosCarregados, setGenerosCarregados] = useState(false);

  const [categoriaAtiva, setCategoriaAtiva] = useState(null);

  const [serieDestaque, setSerieDestaque] = useState(null);
  const [populares, setPopulares] = useState([]);
  const [recomendacoes, setRecomendacoes] = useState([]);

  const [resultados, setResultados] = useState([]);

  const [loadingInicial, setLoadingInicial] = useState(true);
  const [loadingBusca, setLoadingBusca] = useState(false);

  const [erroBusca, setErroBusca] = useState('');

  const [avaliacoes, setAvaliacoes] = useState({});
  const [itensSalvos, setItensSalvos] = useState([]);

  // Estados do seletor de listas.
  const [listasUsuario, setListasUsuario] = useState([]);
  const [modalListasVisivel, setModalListasVisivel] = useState(false);
  const [itemParaLista, setItemParaLista] = useState(null);
  const [carregandoListas, setCarregandoListas] = useState(false);
  const [listaSalvandoId, setListaSalvandoId] = useState(null);

  const [ouvindo, setOuvindo] = useState(false);
  const [erroVoz, setErroVoz] = useState('');

  const campoBuscaRef = useRef(null);

  const requestIdRef = useRef(0);
  const modalRequestIdRef = useRef(0);

  // ==========================================================
  // CARREGAR LISTAS COMPARTILHADAS
  // ==========================================================

  const carregarItensSalvos = useCallback(async () => {
    try {
      const listas = await lerListas();

      setListasUsuario(listas);
      setItensSalvos(obterTodasAsObrasSalvas(listas));

      return listas;
    } catch (erro) {
      console.error(
        'Não foi possível carregar as listas:',
        erro
      );

      throw erro;
    }
  }, []);

  // ==========================================================
  // ABRIR SELETOR DE LISTAS PELO BOTÃO +
  // ==========================================================

  const abrirSeletorListas = async item => {
    if (!item?.id) return;

    // Guarda o identificador desta abertura específica.
    const requestId = ++modalRequestIdRef.current;

    setItemParaLista(item);
    setModalListasVisivel(true);
    setCarregandoListas(true);
    setListaSalvandoId(null);

    try {
      const listas = await carregarItensSalvos();

      // Impede que uma abertura antiga atualize um modal
      // que já foi fechado ou aberto novamente.
      if (requestId !== modalRequestIdRef.current) {
        return;
      }

      setListasUsuario(listas);
    } catch (erro) {
      if (requestId === modalRequestIdRef.current) {
        console.warn(
          'Erro ao abrir seletor de listas:',
          erro
        );

        Alert.alert(
          'Erro',
          'Não foi possível carregar suas listas.'
        );
      }
    } finally {
      if (requestId === modalRequestIdRef.current) {
        setCarregandoListas(false);
      }
    }
  };

  const fecharSeletorListas = () => {
    // Invalida qualquer leitura anterior do modal.
    modalRequestIdRef.current += 1;

    setModalListasVisivel(false);
    setItemParaLista(null);
    setListaSalvandoId(null);
    setCarregandoListas(false);
  };

  // ==========================================================
  // ADICIONAR OU REMOVER UMA OBRA DE UMA LISTA ESPECÍFICA
  // ==========================================================

  const alternarObraNaLista = async lista => {
    if (
      !itemParaLista?.id ||
      !lista?.id ||
      listaSalvandoId
    ) {
      return;
    }

    const item = itemParaLista;
    const tipo = tipoDetalhes(item);
    const id = String(item.id);
    const idLista = String(lista.id);

    setListaSalvandoId(idLista);

    try {
      let listaEncontrada = false;

      const novasListas = await atualizarListas(
        listasAtuais =>
          listasAtuais.map(listaAtual => {
            if (String(listaAtual.id) !== idLista) {
              return listaAtual;
            }

            listaEncontrada = true;

            const itensAtuais = Array.isArray(listaAtual.itens)
              ? listaAtual.itens
              : [];

            const jaExiste = itensAtuais.some(registro =>
              String(registro.id) === id &&
              tipoDetalhes(registro) === tipo
            );

            // Se já existe, remove somente desta coleção.
            if (jaExiste) {
              return {
                ...listaAtual,
                itens: itensAtuais.filter(registro => !(
                  String(registro.id) === id &&
                  tipoDetalhes(registro) === tipo
                )),
              };
            }

            // Se não existe, adiciona à coleção selecionada.
            const novoRegistro = normalizarItemLista({
              id: item.id,
              tmdb_id: item.id,
              tipo,
              media_type: tipo,
              title: tituloMidia(item),
              name: tituloMidia(item),
              poster_path: item.poster_path || null,
              release_date:
                item.release_date ||
                item.first_air_date ||
                '',
              vote_average: item.vote_average || 0,
              overview: item.overview || '',
              adicionada_em: new Date().toISOString(),
            });

            if (!novoRegistro) {
              return listaAtual;
            }

            return {
              ...listaAtual,
              itens: [
                ...itensAtuais,
                novoRegistro,
              ],
            };
          })
      );

      if (!listaEncontrada) {
        Alert.alert(
          'Lista não encontrada',
          'Essa lista não está mais disponível. Feche o seletor e abra novamente.'
        );

        await carregarItensSalvos();
        return;
      }

      // Atualiza a tela imediatamente com o resultado gravado.
      setListasUsuario(novasListas);
      setItensSalvos(obterTodasAsObrasSalvas(novasListas));

      // O modal permanece aberto para permitir adicionar a mesma
      // produção em mais de uma coleção.
    } catch (erro) {
      console.error('Erro ao atualizar a lista:', erro);

      Alert.alert(
        'Não foi possível salvar',
        erro.message ||
          'Ocorreu um erro ao atualizar essa lista. Tente novamente.'
      );

      try {
        await carregarItensSalvos();
      } catch (erroLeitura) {
        console.warn(
          'Não foi possível atualizar a visualização das listas:',
          erroLeitura
        );
      }
    } finally {
      setListaSalvandoId(null);
    }
  };

  // ==========================================================
  // RECUPERAR LISTAS NA ABERTURA E AO VOLTAR AO APP
  // ==========================================================

  useEffect(() => {
    carregarItensSalvos().catch(erro => {
      console.warn('Erro na leitura inicial das listas:', erro);
    });

    const inscricao = AppState.addEventListener(
      'change',
      estado => {
        if (estado === 'active') {
          carregarItensSalvos().catch(erro => {
            console.warn(
              'Erro ao atualizar listas ao retornar ao app:',
              erro
            );
          });
        }
      }
    );

    return () => inscricao.remove();
  }, [carregarItensSalvos]);

  // ==========================================================
  // CARREGAR AVALIAÇÕES DO CINETRACK
  // ==========================================================

  const carregarAvaliacoes = useCallback(async lista => {
    const midias = (lista || []).filter(
      item =>
        item.id &&
        item.media_type !== 'person' &&
        item.media_type !== 'user' &&
        item.media_type !== 'list'
    );

    const primeiras = midias.slice(0, 12);

    const respostas = await Promise.all(
      primeiras.map(async item => {
        const tipo = tipoDetalhes(item);

        const nota = await buscarMediaCineTrack(
          item.id,
          tipo
        );

        return [
          chaveMidia({
            ...item,
            media_type: tipo,
          }),
          nota,
        ];
      })
    );

    setAvaliacoes(atual => {
      const novo = { ...atual };

      respostas.forEach(([chave, nota]) => {
        if (nota) novo[chave] = nota;
      });

      return novo;
    });
  }, []);

  // ==========================================================
  // CARREGAR INÍCIO
  // ==========================================================

  const carregarInicio = useCallback(async () => {
    setLoadingInicial(true);

    try {
      const [
        generos,
        trending,
        filmes,
        series,
      ] = await Promise.all([
        carregarGenerosSalvos(),
        requisicaoTMDB('/trending/tv/week'),
        requisicaoTMDB('/movie/popular'),
        requisicaoTMDB('/tv/popular'),
      ]);

      setGenerosFavoritos(generos);

      const seriePrincipal =
        trending.results?.[0] || null;

      setSerieDestaque(seriePrincipal);

      const listaFilmes = (
        filmes.results || []
      ).map(item => ({
        ...item,
        media_type: 'movie',
      }));

      const listaSeries = (
        series.results || []
      ).map(item => ({
        ...item,
        media_type: 'tv',
      }));

      const misturados = [];

      const total = Math.max(
        listaFilmes.length,
        listaSeries.length
      );

      for (let i = 0; i < total; i++) {
        if (listaFilmes[i]) {
          misturados.push(listaFilmes[i]);
        }

        if (listaSeries[i]) {
          misturados.push(listaSeries[i]);
        }
      }

      setPopulares(misturados.slice(0, 10));

      const idsRecomendados = generos.length
        ? generos.slice(0, 4)
        : [27, 10749, 878];

      const respostas = await Promise.all(
        idsRecomendados.map(async (genreId, indice) => {
          const [f, s] = await Promise.all([
            requisicaoTMDB('/discover/movie', {
              with_genres: genreId,
              sort_by: 'popularity.desc',
              'vote_count.gte': 15,
              page: 1,
            }),

            requisicaoTMDB('/discover/tv', {
              with_genres: genreId,
              sort_by: 'popularity.desc',
              'vote_count.gte': 10,
              page: 1,
            }),
          ]);

          const nome =
            GENRES.find(g => g.id === genreId)?.name ||
            'Recomendado';

          const itens = [
            ...(f.results || []).slice(0, 4).map(item => ({
              ...item,
              media_type: 'movie',
            })),

            ...(s.results || []).slice(0, 4).map(item => ({
              ...item,
              media_type: 'tv',
            })),
          ];

          return {
            id: genreId,
            nome,
            prioridade: indice,
            itens,
          };
        })
      );

      setRecomendacoes(respostas);

      await carregarAvaliacoes([
        ...misturados,
        ...(seriePrincipal
          ? [{
              ...seriePrincipal,
              media_type: 'tv',
            }]
          : []),
      ]);
    } catch (erro) {
      console.error(
        'Erro ao carregar a tela Buscar:',
        erro
      );

      setErroBusca(
        'Não foi possível carregar as recomendações. Verifique sua conexão.'
      );
    } finally {
      setGenerosCarregados(true);
      setLoadingInicial(false);
    }
  }, [carregarAvaliacoes]);

  useEffect(() => {
    carregarInicio();
  }, [carregarInicio]);

  // ==========================================================
  // EXECUTAR BUSCA
  // ==========================================================

  const executarBusca = useCallback(
    async termoInformado => {
      const termo = String(
        termoInformado ?? textoBusca
      ).trim();

      if (!termo) return;

      const requestId = ++requestIdRef.current;

      setConsulta(termo);
      setCategoriaAtiva(null);
      setLoadingBusca(true);
      setErroBusca('');

      try {
        let lista = [];

        if (aba === 'movie') {
          const dados = await requisicaoTMDB(
            '/search/movie',
            {
              query: termo,
              include_adult: false,
              page: 1,
            }
          );

          lista = (dados.results || []).map(item => ({
            ...item,
            media_type: 'movie',
          }));
        } else if (aba === 'tv') {
          const dados = await requisicaoTMDB(
            '/search/tv',
            {
              query: termo,
              page: 1,
            }
          );

          lista = (dados.results || []).map(item => ({
            ...item,
            media_type: 'tv',
          }));
        } else if (aba === 'person') {
          const dados = await requisicaoTMDB(
            '/search/person',
            {
              query: termo,
              page: 1,
            }
          );

          lista = (dados.results || []).map(item => ({
            ...item,
            media_type: 'person',
          }));
        } else if (aba === 'users') {
          lista = (
            await buscarNoBackend(
              USERS_SEARCH_URL,
              termo
            )
          ).map(item => ({
            ...item,
            media_type: 'user',
          }));
        } else if (aba === 'lists') {
          lista = (
            await buscarNoBackend(
              LISTS_SEARCH_URL,
              termo
            )
          ).map(item => ({
            ...item,
            media_type: 'list',
          }));
        } else {
          const [tmdb, usuarios, listas] =
            await Promise.all([
              requisicaoTMDB('/search/multi', {
                query: termo,
                include_adult: false,
                page: 1,
              }),

              USERS_SEARCH_URL
                ? buscarNoBackend(
                    USERS_SEARCH_URL,
                    termo
                  )
                : Promise.resolve([]),

              LISTS_SEARCH_URL
                ? buscarNoBackend(
                    LISTS_SEARCH_URL,
                    termo
                  )
                : Promise.resolve([]),
            ]);

          const conteudo = (tmdb.results || [])
            .filter(item =>
              ['movie', 'tv', 'person'].includes(
                item.media_type
              )
            );

          lista = [
            ...conteudo,

            ...usuarios.map(item => ({
              ...item,
              media_type: 'user',
            })),

            ...listas.map(item => ({
              ...item,
              media_type: 'list',
            })),
          ];
        }

        if (requestId !== requestIdRef.current) {
          return;
        }

        setResultados(lista);

        const obras = lista.filter(item =>
          ['movie', 'tv'].includes(item.media_type)
        );

        if (obras.length) {
          carregarAvaliacoes(obras);
        }

        if (
          !lista.length &&
          (
            (aba === 'users' && !USERS_SEARCH_URL) ||
            (aba === 'lists' && !LISTS_SEARCH_URL)
          )
        ) {
          setErroBusca(
            aba === 'users'
              ? 'A pesquisa de usuários precisa da rota de busca de usuários do backend.'
              : 'A pesquisa de listas precisa da rota de busca de listas do backend.'
          );
        }
      } catch (erro) {
        if (requestId !== requestIdRef.current) {
          return;
        }

        console.error('Erro na pesquisa:', erro);

        setErroBusca(
          erro.message ||
          'Não foi possível realizar a pesquisa.'
        );
      } finally {
        if (requestId === requestIdRef.current) {
          setLoadingBusca(false);
        }
      }
    },
    [
      aba,
      textoBusca,
      carregarAvaliacoes,
    ]
  );

  // ==========================================================
  // PESQUISA ENQUANTO DIGITA
  // ==========================================================

  useEffect(() => {
    const termo = textoBusca.trim();

    if (!termo) return;

    if (
      (aba === 'users' || aba === 'lists') &&
      termo.length < 2
    ) {
      setResultados([]);
      setLoadingBusca(false);
      return;
    }

    const temporizador = setTimeout(() => {
      executarBusca(termo);
    }, 350);

    return () => clearTimeout(temporizador);
  }, [textoBusca, aba, executarBusca]);

  // ==========================================================
  // MUDANÇA DO TEXTO DE PESQUISA
  // ==========================================================

  const alterarTextoBusca = texto => {
    setTextoBusca(texto);
    setCategoriaAtiva(null);
    setErroBusca('');

    if (!texto.trim()) {
      requestIdRef.current += 1;

      setConsulta('');
      setResultados([]);
      setLoadingBusca(false);
      return;
    }

    setConsulta(texto.trim());
    setLoadingBusca(true);
  };

  // ==========================================================
  // PESQUISA POR VOZ
  // ==========================================================

  const alternarMicrofone = () => {
    Alert.alert(
      'Pesquisa por voz indisponível',
      'A pesquisa por voz ainda não está disponível nesta versão do Expo Go. Por enquanto, digite o nome do filme ou da série.'
    );
  };

  // ==========================================================
  // TROCAR ABA
  // ==========================================================

  const trocarAba = novaAba => {
    requestIdRef.current += 1;

    setAba(novaAba);
    setCategoriaAtiva(null);
    setErroBusca('');
  };

  // ==========================================================
  // EXPLORAR GÊNERO
  // ==========================================================

  const explorarGenero = async genero => {
    requestIdRef.current += 1;

    setCategoriaAtiva(genero);
    setConsulta('');
    setTextoBusca('');
    setLoadingBusca(true);
    setErroBusca('');
    setResultados([]);

    try {
      const [
        filmesGenero,
        seriesGenero,
      ] = await Promise.all([
        requisicaoTMDB('/discover/movie', {
          with_genres: genero.id,
          sort_by: 'popularity.desc',
          'vote_count.gte': 10,
        }),

        requisicaoTMDB('/discover/tv', {
          with_genres: genero.id,
          sort_by: 'popularity.desc',
          'vote_count.gte': 10,
        }),
      ]);

      const lista = [
        ...(filmesGenero.results || []).map(item => ({
          ...item,
          media_type: 'movie',
        })),

        ...(seriesGenero.results || []).map(item => ({
          ...item,
          media_type: 'tv',
        })),
      ].sort(
        (a, b) =>
          Number(b.popularity || 0) -
          Number(a.popularity || 0)
      );

      setResultados(lista);

      carregarAvaliacoes(lista);
    } catch (erro) {
      setErroBusca(
        'Não foi possível carregar esta categoria.'
      );
    } finally {
      setLoadingBusca(false);
    }
  };

  // ==========================================================
  // ABRIR CONTEÚDO
  // ==========================================================

  const abrirMidia = item => {
    if (!item) return;

    const tipo = tipoDetalhes(item);

    if (typeof onAbrirDetalhes === 'function') {
      onAbrirDetalhes({
        id: item.id,
        tipo,
        media: item,
      });

      return;
    }

    Alert.alert(
      'Detalhes da produção',
      'Conecte a navegação do Buscar à tela Detalhes no App.js.'
    );
  };

  const abrirPessoa = pessoa => {
    if (typeof onAbrirPerfil === 'function') {
      onAbrirPerfil(pessoa);
      return;
    }

    Alert.alert(
      pessoa.name || 'Pessoa',
      'A tela de perfil de atores será conectada na próxima etapa.'
    );
  };

  const abrirLista = lista => {
    if (typeof onAbrirLista === 'function') {
      onAbrirLista(lista);
      return;
    }

    Alert.alert(
      lista.name || lista.titulo || 'Lista',
      'A tela de listas será conectada à navegação do CineTrack.'
    );
  };

  // ==========================================================
  // DADOS DERIVADOS
  // ==========================================================

  const categoriasExibidas = useMemo(() => {
    if (!generosFavoritos.length) {
      return GENRES;
    }

    const favoritas = generosFavoritos
      .map(id => GENRES.find(g => g.id === id))
      .filter(Boolean);

    const restantes = GENRES.filter(
      g => !generosFavoritos.includes(g.id)
    );

    return [...favoritas, ...restantes];
  }, [generosFavoritos]);

  const destaqueImagem = imagemMidia(
    serieDestaque?.backdrop_path ||
    serieDestaque?.poster_path,
    'w1280'
  );

  const pesquisando = Boolean(
    textoBusca.trim() ||
    consulta.trim() ||
    categoriaAtiva
  );

  const notaExibida = item => {
    const avaliacao =
      avaliacoes[chaveMidia(item)];

    if (avaliacao) {
      return {
        valor: avaliacao.media.toFixed(1),
        legenda: `CineTrack · ${avaliacao.quantidade}`,
        fonte: 'cine',
      };
    }

    return {
      valor: Number(item.vote_average || 0).toFixed(1),
      legenda: 'TMDB',
      fonte: 'tmdb',
    };
  };

  // Verifica se a obra existe em pelo menos uma lista.
  const obraEstaEmAlgumaLista = item => {
    const tipo = tipoDetalhes(item);

    return listasUsuario.some(lista =>
      (lista.itens || []).some(registro =>
        String(registro.id) === String(item.id) &&
        tipoDetalhes(registro) === tipo
      )
    );
  };

  // ==========================================================
  // RESULTADOS: PESSOAS, USUÁRIOS E LISTAS
  // ==========================================================

  const renderResultado = item => {
    const tipo = item.media_type;

    if (tipo === 'person') {
      const foto = imagemMidia(
        item.profile_path,
        'w185'
      );

      return (
        <TouchableOpacity
          key={`person-${item.id}`}
          style={styles.personCard}
          activeOpacity={0.82}
          onPress={() => abrirPessoa(item)}
        >
          {foto ? (
            <Image
              source={{ uri: foto }}
              style={styles.personImage}
            />
          ) : (
            <View style={styles.personPlaceholder}>
              <Ionicons
                name="person"
                size={25}
                color={COLORS.muted}
              />
            </View>
          )}

          <View style={styles.personInfo}>
            <Text style={styles.personName}>
              {item.name || 'Pessoa sem nome'}
            </Text>

            <Text style={styles.personDepartment}>
              {item.known_for_department || 'Artista'}
            </Text>

            <Text
              style={styles.personKnownFor}
              numberOfLines={2}
            >
              {(item.known_for || [])
                .slice(0, 2)
                .map(tituloMidia)
                .join(' · ') ||
                'Artista do audiovisual'}
            </Text>
          </View>

          <Feather
            name="chevron-right"
            size={19}
            color={COLORS.muted}
          />
        </TouchableOpacity>
      );
    }

    if (tipo === 'user') {
      const nome =
        item.username ||
        item.nome ||
        item.name ||
        'Usuário CineTrack';

      const avatar =
        item.avatar_url ||
        item.avatar ||
        item.foto ||
        item.foto_perfil;

      return (
        <TouchableOpacity
          key={`user-${item.id || item.username}`}
          style={styles.personCard}
          activeOpacity={0.82}
          onPress={() => abrirPessoa(item)}
        >
          {avatar ? (
            <Image
              source={{ uri: avatar }}
              style={styles.userAvatar}
            />
          ) : (
            <View style={styles.userAvatarPlaceholder}>
              <Ionicons
                name="person"
                size={24}
                color={COLORS.blueLight}
              />
            </View>
          )}

          <View style={styles.personInfo}>
            <Text style={styles.personName}>
              {nome}
            </Text>

            <Text style={styles.personDepartment}>
              @{item.username || item.usuario || 'cinéfilo'}
            </Text>

            <Text
              style={styles.personKnownFor}
              numberOfLines={1}
            >
              {item.bio ||
                item.biografia ||
                'Membro da comunidade CineTrack'}
            </Text>
          </View>

          <Feather
            name="chevron-right"
            size={19}
            color={COLORS.muted}
          />
        </TouchableOpacity>
      );
    }

    if (tipo === 'list') {
      const nome =
        item.name ||
        item.titulo ||
        item.nome ||
        'Lista sem título';

      return (
        <TouchableOpacity
          key={`list-${item.id}`}
          style={styles.listResultCard}
          activeOpacity={0.82}
          onPress={() => abrirLista(item)}
        >
          <View style={styles.listIcon}>
            <Ionicons
              name="albums-outline"
              size={25}
              color={COLORS.blueLight}
            />
          </View>

          <View style={styles.personInfo}>
            <Text style={styles.personName}>
              {nome}
            </Text>

            <Text style={styles.personDepartment}>
              {item.username
                ? `Criada por @${item.username}`
                : 'Lista da comunidade'}
            </Text>

            <Text
              style={styles.personKnownFor}
              numberOfLines={2}
            >
              {item.description ||
                item.descricao ||
                `${item.total_midia || item.quantidade || 0} produções`}
            </Text>
          </View>

          <Feather
            name="chevron-right"
            size={19}
            color={COLORS.muted}
          />
        </TouchableOpacity>
      );
    }

    // FILMES E SÉRIES

    const tipoObra = tipoDetalhes(item);
    const poster = imagemMidia(item.poster_path, 'w185');
    const notaItem = notaExibida(item);

    const generoPrincipal = (item.genre_ids || [])
      .map(id => GENRES.find(g => g.id === id)?.name)
      .filter(Boolean)[0];

    const salvo = obraEstaEmAlgumaLista(item);
    const salvando = Boolean(listaSalvandoId);

    return (
      <TouchableOpacity
        key={`${tipoObra}-${item.id}`}
        style={styles.resultCard}
        activeOpacity={0.84}
        onPress={() => abrirMidia(item)}
      >
        {poster ? (
          <Image
            source={{ uri: poster }}
            style={styles.resultPoster}
          />
        ) : (
          <View style={styles.resultPosterPlaceholder}>
            <Ionicons
              name="film-outline"
              size={27}
              color={COLORS.muted}
            />
          </View>
        )}

        <View style={styles.resultInfo}>
          <View style={styles.resultTopLine}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>
                {tipoObra === 'movie' ? 'FILME' : 'SÉRIE'}
              </Text>
            </View>

            <Text style={styles.resultYear}>
              {anoMidia(item)}
            </Text>
          </View>

          <Text
            style={styles.resultTitle}
            numberOfLines={2}
          >
            {tituloMidia(item)}
          </Text>

          <Text
            style={styles.resultOverview}
            numberOfLines={2}
          >
            {item.overview || 'Sinopse não disponível.'}
          </Text>

          <View style={styles.resultBottomLine}>
            <View style={styles.resultRating}>
              <Ionicons
                name="star"
                size={12}
                color={COLORS.yellow}
              />

              <Text style={styles.resultRatingValue}>
                {notaItem.valor}
              </Text>

              <Text style={styles.resultRatingSource}>
                {notaItem.fonte === 'cine'
                  ? 'CineTrack'
                  : 'TMDB'}
              </Text>
            </View>

            {!!generoPrincipal && (
              <Text style={styles.resultGenre}>
                {generoPrincipal}
              </Text>
            )}
          </View>
        </View>

        {/* O botão + abre o seletor de listas. */}

        <TouchableOpacity
          style={[
            styles.addButton,
            salvo && styles.addButtonSaved,
          ]}
          activeOpacity={0.8}
          disabled={salvando}
          onPress={evento => {
            evento?.stopPropagation?.();
            abrirSeletorListas(item);
          }}
        >
          {salvando ? (
            <ActivityIndicator
              size="small"
              color="#FFFFFF"
            />
          ) : (
            <Ionicons
              name={salvo ? 'bookmark' : 'add'}
              size={20}
              color={salvo ? COLORS.green : '#fff'}
            />
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // ==========================================================
  // RENDERIZAR POPULARES
  // ==========================================================

  const renderPopular = item => {
    const tipo = tipoDetalhes(item);
    const poster = imagemMidia(item.poster_path, 'w185');
    const notaItem = notaExibida(item);

    const genero = (item.genre_ids || [])
      .map(id => GENRES.find(g => g.id === id)?.name)
      .filter(Boolean)
      .slice(0, 2)
      .join(' · ');

    const salvo = obraEstaEmAlgumaLista(item);
    const salvando = Boolean(listaSalvandoId);

    return (
      <TouchableOpacity
        key={chaveMidia(item)}
        style={styles.popularCard}
        activeOpacity={0.84}
        onPress={() => abrirMidia(item)}
      >
        {poster ? (
          <Image
            source={{ uri: poster }}
            style={styles.popularPoster}
          />
        ) : (
          <View style={styles.popularPosterPlaceholder}>
            <Ionicons
              name="film-outline"
              size={25}
              color={COLORS.muted}
            />
          </View>
        )}

        <View style={styles.popularInfo}>
          <View style={styles.popularTop}>
            <Text style={styles.popularType}>
              {tipo === 'movie' ? 'FILME' : 'SÉRIE'}
            </Text>

            <Text style={styles.popularYear}>
              {anoMidia(item)}
            </Text>
          </View>

          <Text
            style={styles.popularTitle}
            numberOfLines={2}
          >
            {tituloMidia(item)}
          </Text>

          <Text
            style={styles.popularGenre}
            numberOfLines={1}
          >
            {genero || 'Produção popular'}
          </Text>

          <View style={styles.popularRating}>
            <Ionicons
              name="star"
              size={12}
              color={COLORS.yellow}
            />

            <Text style={styles.popularRatingText}>
              {notaItem.valor}
            </Text>

            <Text style={styles.popularRatingSource}>
              {notaItem.fonte === 'cine'
                ? 'CineTrack'
                : 'TMDB'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.popularAdd,
            salvo && styles.popularAdded,
          ]}
          disabled={salvando}
          onPress={evento => {
            evento?.stopPropagation?.();
            abrirSeletorListas(item);
          }}
          activeOpacity={0.8}
        >
          {salvando ? (
            <ActivityIndicator
              size="small"
              color="#FFFFFF"
            />
          ) : (
            <Ionicons
              name={salvo ? 'bookmark' : 'add'}
              size={21}
              color={salvo ? COLORS.green : '#fff'}
            />
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // ==========================================================
  // RECOMENDAÇÕES
  // ==========================================================

  const renderRecomendacaoCard = item => {
    const tipo = tipoDetalhes(item);
    const poster = imagemMidia(item.poster_path, 'w342');
    const notaItem = notaExibida(item);

    return (
      <TouchableOpacity
        key={chaveMidia(item)}
        style={styles.recommendCard}
        activeOpacity={0.83}
        onPress={() => abrirMidia(item)}
      >
        {poster ? (
          <Image
            source={{ uri: poster }}
            style={styles.recommendPoster}
          />
        ) : (
          <View style={styles.recommendPlaceholder}>
            <Ionicons
              name="film-outline"
              size={28}
              color={COLORS.muted}
            />
          </View>
        )}

        <Text
          style={styles.recommendTitle}
          numberOfLines={2}
        >
          {tituloMidia(item)}
        </Text>

        <View style={styles.recommendMeta}>
          <Ionicons
            name="star"
            size={10}
            color={COLORS.yellow}
          />

          <Text style={styles.recommendRating}>
            {notaItem.valor}
          </Text>

          <Text style={styles.recommendYear}>
            {anoMidia(item)}
          </Text>
        </View>

        <Text style={styles.recommendType}>
          {tipo === 'movie' ? 'FILME' : 'SÉRIE'}
        </Text>
      </TouchableOpacity>
    );
  };

  // ==========================================================
  // CATEGORIAS
  // ==========================================================

  const renderCategoria = genero => {
    const favorita = generosFavoritos.includes(genero.id);
    const ativa = categoriaAtiva?.id === genero.id;

    return (
      <TouchableOpacity
        key={genero.id}
        activeOpacity={0.82}
        style={[
          styles.categoryCard,
          ativa && styles.categoryCardActive,
          favorita && styles.categoryCardFavorite,
        ]}
        onPress={() => explorarGenero(genero)}
      >
        <View
          style={[
            styles.categoryIcon,
            { backgroundColor: `${genero.color}20` },
          ]}
        >
          <Ionicons
            name={genero.icon}
            size={20}
            color={genero.color}
          />
        </View>

        <View style={styles.categoryTextWrap}>
          <Text style={styles.categoryName}>
            {genero.name}
          </Text>

          <Text style={styles.categorySub}>
            {favorita
              ? 'Seu gênero favorito'
              : 'Explorar produções'}
          </Text>
        </View>

        <Feather
          name="arrow-up-right"
          size={16}
          color={genero.color}
        />
      </TouchableOpacity>
    );
  };

  // ==========================================================
  // TÍTULOS DE SEÇÃO
  // ==========================================================

  const renderTituloSecao = (titulo, subtitulo) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleGroup}>
        <Text style={styles.sectionTitle}>
          {titulo}
        </Text>

        {!!subtitulo && (
          <Text style={styles.sectionSubtitle}>
            {subtitulo}
          </Text>
        )}
      </View>

      <View style={styles.sectionLine} />
    </View>
  );

  // ==========================================================
  // TELA DE BUSCA
  // ==========================================================

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.bg}
      />

      <View style={styles.container}>
        {/* CABEÇALHO */}

        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {onVoltar && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={onVoltar}
                activeOpacity={0.8}
              >
                <Feather
                  name="arrow-left"
                  size={20}
                  color={COLORS.text}
                />
              </TouchableOpacity>
            )}

            <View>
              <Text style={styles.headerEyebrow}>
                DESCUBRA SEU PRÓXIMO FILME
              </Text>

              <Text style={styles.headerTitle}>
                Buscar
              </Text>
            </View>
          </View>

          <View style={styles.headerMark}>
            <Ionicons
              name="compass-outline"
              size={22}
              color={COLORS.blueLight}
            />
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* PESQUISA */}

          <View style={styles.searchBox}>
            <Feather
              name="search"
              size={19}
              color={COLORS.secondary}
            />

            <TextInput
              ref={campoBuscaRef}
              style={styles.searchInput}
              placeholder="Buscar filmes, séries, pessoas..."
              placeholderTextColor={COLORS.muted}
              value={textoBusca}
              onChangeText={alterarTextoBusca}
              onSubmitEditing={() =>
                executarBusca(textoBusca)
              }
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
            />

            {textoBusca.length > 0 && (
              <TouchableOpacity
                onPress={() => alterarTextoBusca('')}
                style={styles.clearButton}
              >
                <Ionicons
                  name="close-circle"
                  size={19}
                  color={COLORS.muted}
                />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.micButton,
                ouvindo && styles.micButtonActive,
              ]}
              onPress={alternarMicrofone}
              activeOpacity={0.8}
            >
              <Ionicons
                name="mic-outline"
                size={19}
                color={COLORS.blueLight}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.searchSubmit}
              onPress={() =>
                executarBusca(textoBusca)
              }
              activeOpacity={0.8}
            >
              <Feather
                name="arrow-right"
                size={19}
                color="#fff"
              />
            </TouchableOpacity>
          </View>

          {/* ABAS */}

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabs}
          >
            {TABS.map(item => {
              const ativo = aba === item.id;

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.tab,
                    ativo && styles.tabActive,
                  ]}
                  onPress={() => trocarAba(item.id)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.tabText,
                      ativo && styles.tabTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* RESULTADOS */}

          {pesquisando ? (
            <View style={styles.searchResultsSection}>
              {renderTituloSecao(
                categoriaAtiva
                  ? `Explorar ${categoriaAtiva.name}`
                  : `Resultados para "${consulta || textoBusca}"`,
                loadingBusca
                  ? 'Pesquisando...'
                  : `${resultados.length} resultado(s)`
              )}

              {loadingBusca && !resultados.length ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator
                    size="large"
                    color={COLORS.blueLight}
                  />

                  <Text style={styles.loadingText}>
                    Procurando no CineTrack...
                  </Text>
                </View>
              ) : resultados.length > 0 ? (
                <View style={styles.resultList}>
                  {resultados.map(renderResultado)}
                </View>
              ) : loadingBusca ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator
                    size="large"
                    color={COLORS.blueLight}
                  />

                  <Text style={styles.loadingText}>
                    Procurando no CineTrack...
                  </Text>
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons
                    name="search-outline"
                    size={38}
                    color={COLORS.muted}
                  />

                  <Text style={styles.emptyTitle}>
                    Nenhum resultado encontrado
                  </Text>

                  <Text style={styles.emptyDescription}>
                    Tente outro título ou escolha uma categoria diferente.
                  </Text>

                  {!!erroBusca && (
                    <Text style={styles.backendNotice}>
                      {erroBusca}
                    </Text>
                  )}
                </View>
              )}
            </View>
          ) : (
            <>
              {/* RECOMENDAÇÕES */}

              {renderTituloSecao(
                'FEITO PARA SEUS GOSTOS',
                generosFavoritos.length
                  ? 'Recomendações baseadas nos seus gêneros favoritos'
                  : 'Descubra produções que estão em alta'
              )}

              {loadingInicial ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator
                    size="large"
                    color={COLORS.blueLight}
                  />

                  <Text style={styles.loadingText}>
                    Preparando suas recomendações...
                  </Text>
                </View>
              ) : (
                <>
                  {recomendacoes.map(grupo => (
                    <View
                      key={grupo.id}
                      style={styles.recommendSection}
                    >
                      <View style={styles.recommendHeading}>
                        <View style={styles.recommendHeadingLeft}>
                          <View
                            style={[
                              styles.recommendDot,
                              {
                                backgroundColor:
                                  GENRES.find(g => g.id === grupo.id)?.color ||
                                  COLORS.blue,
                              },
                            ]}
                          />

                          <Text style={styles.recommendHeadingTitle}>
                            {grupo.nome}
                          </Text>

                          {grupo.prioridade === 0 && (
                            <View style={styles.favoriteTag}>
                              <Text style={styles.favoriteTagText}>
                                SEU FAVORITO
                              </Text>
                            </View>
                          )}
                        </View>

                        <TouchableOpacity
                          onPress={() =>
                            explorarGenero({
                              id: grupo.id,
                              name: grupo.nome,
                            })
                          }
                        >
                          <Text style={styles.seeAll}>
                            Ver todos
                          </Text>
                        </TouchableOpacity>
                      </View>

                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.recommendList}
                      >
                        {grupo.itens
                          .slice(0, 8)
                          .map(renderRecomendacaoCard)}
                      </ScrollView>
                    </View>
                  ))}

                  {!recomendacoes.length && (
                    <Text style={styles.emptyDescription}>
                      Ainda não há recomendações disponíveis.
                    </Text>
                  )}
                </>
              )}

              {/* SÉRIE EM DESTAQUE */}

              {renderTituloSecao(
                'EM DESTAQUE',
                'Uma produção para colocar na sua lista'
              )}

              {serieDestaque ? (
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={styles.featuredCard}
                  onPress={() =>
                    abrirMidia({
                      ...serieDestaque,
                      media_type: 'tv',
                    })
                  }
                >
                  {destaqueImagem ? (
                    <ImageBackground
                      source={{ uri: destaqueImagem }}
                      style={styles.featuredBackground}
                      imageStyle={styles.featuredImage}
                    >
                      <LinearGradient
                        colors={[
                          'transparent',
                          'rgba(5,6,8,0.48)',
                          'rgba(5,6,8,0.97)',
                        ]}
                        style={StyleSheet.absoluteFill}
                      />

                      <View style={styles.featuredContent}>
                        <View style={styles.featuredTag}>
                          <Ionicons
                            name="flame"
                            size={12}
                            color="#fff"
                          />

                          <Text style={styles.featuredTagText}>
                            SÉRIE EM ALTA
                          </Text>
                        </View>

                        <Text
                          style={styles.featuredTitle}
                          numberOfLines={2}
                        >
                          {tituloMidia(serieDestaque)}
                        </Text>

                        <Text
                          style={styles.featuredOverview}
                          numberOfLines={2}
                        >
                          {serieDestaque.overview ||
                            'Conheça mais sobre esta produção.'}
                        </Text>

                        <View style={styles.featuredFooter}>
                          <View style={styles.featuredRating}>
                            <Ionicons
                              name="star"
                              size={13}
                              color={COLORS.yellow}
                            />

                            <Text style={styles.featuredRatingText}>
                              {Number(
                                serieDestaque.vote_average || 0
                              ).toFixed(1)}
                            </Text>

                            <Text style={styles.featuredRatingSource}>
                              TMDB
                            </Text>
                          </View>

                          <View style={styles.featuredAction}>
                            <Text style={styles.featuredActionText}>
                              Ver detalhes
                            </Text>

                            <Feather
                              name="arrow-up-right"
                              size={15}
                              color="#fff"
                            />
                          </View>
                        </View>
                      </View>
                    </ImageBackground>
                  ) : (
                    <View style={styles.featuredFallback}>
                      <Text style={styles.featuredTitle}>
                        Explore novas séries
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ) : null}

              {/* CATEGORIAS */}

              {renderTituloSecao(
                'EXPLORAR POR CATEGORIA',
                'Encontre histórias do seu jeito'
              )}

              {generosCarregados &&
                generosFavoritos.length > 0 && (
                  <View style={styles.preferenceNote}>
                    <Ionicons
                      name="heart"
                      size={14}
                      color={COLORS.pink}
                    />

                    <Text style={styles.preferenceNoteText}>
                      Seus gêneros favoritos aparecem primeiro.
                    </Text>
                  </View>
                )}

              <View style={styles.categoryGrid}>
                {categoriasExibidas.map(renderCategoria)}
              </View>

              {/* POPULARES */}

              {renderTituloSecao(
                'POPULARES AGORA',
                'Filmes e séries que estão chamando atenção'
              )}

              {loadingInicial ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator color={COLORS.blueLight} />
                </View>
              ) : populares.length > 0 ? (
                <View style={styles.popularList}>
                  {populares.map(renderPopular)}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyDescription}>
                    Não foi possível carregar as produções populares.
                  </Text>
                </View>
              )}
            </>
          )}

          {/* RODAPÉ */}

          <View style={styles.footer}>
            <Text style={styles.footerBrand}>
              CINE
              <Text style={styles.footerBlue}>
                TRACK
              </Text>
            </Text>

            <Text style={styles.footerText}>
              Descubra. Assista. Avalie. Relembre.
            </Text>
          </View>

          <View style={{ height: 35 }} />
        </ScrollView>

        {/* ====================================================
            MODAL DE SELEÇÃO DAS LISTAS PESSOAIS
        ===================================================== */}

        <Modal
          visible={modalListasVisivel}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={fecharSeletorListas}
        >
          <View style={styles.listModalOverlay}>
            <View style={styles.listModalCard}>
              <View style={styles.listModalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listModalEyebrow}>
                    ORGANIZE SUAS PRODUÇÕES
                  </Text>

                  <Text style={styles.listModalTitle}>
                    Adicionar à lista
                  </Text>

                  <Text style={styles.listModalSubtitle}>
                    {itemParaLista
                      ? `Escolha onde deseja guardar "${tituloMidia(itemParaLista)}".`
                      : 'Escolha uma das suas coleções.'}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.listModalClose}
                  onPress={fecharSeletorListas}
                >
                  <Ionicons
                    name="close"
                    size={21}
                    color={COLORS.text}
                  />
                </TouchableOpacity>
              </View>

              {carregandoListas ? (
                <View style={styles.listModalLoading}>
                  <ActivityIndicator
                    size="large"
                    color={COLORS.blueLight}
                  />

                  <Text style={styles.listModalEmptyText}>
                    Carregando suas listas...
                  </Text>
                </View>
              ) : listasUsuario.length > 0 ? (
                <ScrollView
                  style={styles.listModalScroll}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {listasUsuario.map(lista => {
                    const adicionada = (lista.itens || []).some(registro =>
                      String(registro.id) === String(itemParaLista?.id) &&
                      tipoDetalhes(registro) === tipoDetalhes(itemParaLista)
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
                            color={COLORS.green}
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
                            {(lista.itens || []).length}{' '}
                            {(lista.itens || []).length === 1 ? 'obra' : 'obras'}
                          </Text>
                        </View>

                        {salvando ? (
                          <ActivityIndicator
                            size="small"
                            color={COLORS.blueLight}
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
                              color={adicionada ? COLORS.green : '#FFFFFF'}
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
                    color={COLORS.muted}
                  />

                  <Text style={styles.listModalEmptyTitle}>
                    Nenhuma lista encontrada
                  </Text>

                  <Text style={styles.listModalEmptyText}>
                    Crie suas coleções na seção Lista do Novo Registro.
                    Depois elas aparecerão aqui automaticamente.
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.listModalDone}
                onPress={fecharSeletorListas}
              >
                <Text style={styles.listModalDoneText}>
                  Concluir
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

// ============================================================
// ESTILOS
// ============================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  header: {
    height: 76,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.elevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  headerEyebrow: {
    color: COLORS.muted,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 3,
  },

  headerTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },

  headerMark: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59,130,246,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.2)',
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 17,
    paddingBottom: 20,
  },

  searchBox: {
    minHeight: 54,
    borderRadius: 15,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.26)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    gap: 10,
  },

  searchInput: {
    flex: 1,
    minWidth: 0,
    color: COLORS.text,
    fontSize: 12,
    paddingVertical: 12,
  },

  clearButton: {
    padding: 3,
  },

  micButton: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59,130,246,0.12)',
  },

  micButtonActive: {
    backgroundColor: COLORS.red,
  },

  searchSubmit: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },

  tabs: {
    gap: 8,
    paddingVertical: 15,
    paddingRight: 10,
  },

  tab: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 22,
    backgroundColor: COLORS.elevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  tabActive: {
    backgroundColor: 'rgba(59,130,246,0.17)',
    borderColor: 'rgba(59,130,246,0.48)',
  },

  tabText: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: '700',
  },

  tabTextActive: {
    color: COLORS.blueLight,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
    marginBottom: 14,
  },

  sectionTitleGroup: {
    gap: 4,
  },

  sectionTitle: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },

  sectionSubtitle: {
    color: COLORS.muted,
    fontSize: 9,
  },

  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },

  loadingBox: {
    minHeight: 115,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },

  loadingText: {
    color: COLORS.secondary,
    fontSize: 11,
  },

  recommendSection: {
    marginBottom: 18,
  },

  recommendHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },

  recommendHeadingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flexWrap: 'wrap',
  },

  recommendDot: {
    width: 7,
    height: 7,
    borderRadius: 5,
  },

  recommendHeadingTitle: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '800',
  },

  favoriteTag: {
    backgroundColor: 'rgba(236,72,153,0.12)',
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },

  favoriteTagText: {
    color: COLORS.pink,
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  seeAll: {
    color: COLORS.blueLight,
    fontSize: 10,
    fontWeight: '700',
  },

  recommendList: {
    gap: 11,
    paddingRight: 5,
  },

  recommendCard: {
    width: 116,
  },

  recommendPoster: {
    width: 116,
    height: 166,
    borderRadius: 12,
    backgroundColor: COLORS.elevated,
  },

  recommendPlaceholder: {
    width: 116,
    height: 166,
    borderRadius: 12,
    backgroundColor: COLORS.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },

  recommendTitle: {
    color: COLORS.text,
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 14,
    marginTop: 8,
    minHeight: 28,
  },

  recommendMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 5,
  },

  recommendRating: {
    color: COLORS.secondary,
    fontSize: 9,
    fontWeight: '800',
  },

  recommendYear: {
    color: COLORS.muted,
    fontSize: 9,
    marginLeft: 4,
  },

  recommendType: {
    color: COLORS.blueLight,
    fontSize: 7,
    fontWeight: '900',
    marginTop: 5,
    letterSpacing: 0.8,
  },

  featuredCard: {
    width: '100%',
    height: 235,
    borderRadius: 19,
    overflow: 'hidden',
    backgroundColor: COLORS.elevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  featuredBackground: {
    flex: 1,
    justifyContent: 'flex-end',
  },

  featuredImage: {
    resizeMode: 'cover',
  },

  featuredContent: {
    padding: 17,
  },

  featuredTag: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.blue,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
    marginBottom: 9,
  },

  featuredTagText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  featuredTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
  },

  featuredOverview: {
    color: '#D2D8E2',
    fontSize: 10,
    lineHeight: 16,
    marginTop: 5,
  },

  featuredFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },

  featuredRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  featuredRatingText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 11,
  },

  featuredRatingSource: {
    color: COLORS.secondary,
    fontSize: 8,
  },

  featuredAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(59,130,246,0.86)',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 9,
  },

  featuredActionText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },

  featuredFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  preferenceNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 3,
    marginBottom: 11,
  },

  preferenceNoteText: {
    color: COLORS.secondary,
    fontSize: 9,
  },

  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 9,
  },

  categoryCard: {
    width: '48.5%',
    minHeight: 69,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 9,
    paddingVertical: 9,
    borderRadius: 13,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  categoryCardActive: {
    borderColor: COLORS.blueLight,
    backgroundColor: 'rgba(59,130,246,0.12)',
  },

  categoryCardFavorite: {
    borderColor: 'rgba(236,72,153,0.22)',
  },

  categoryIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  categoryTextWrap: {
    flex: 1,
    minWidth: 0,
  },

  categoryName: {
    color: COLORS.text,
    fontSize: 10,
    fontWeight: '800',
  },

  categorySub: {
    color: COLORS.muted,
    fontSize: 7,
    marginTop: 4,
  },

  popularList: {
    gap: 10,
  },

  popularCard: {
    minHeight: 116,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 9,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  popularPoster: {
    width: 70,
    height: 98,
    borderRadius: 9,
    backgroundColor: COLORS.elevated,
  },

  popularPosterPlaceholder: {
    width: 70,
    height: 98,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.elevated,
  },

  popularInfo: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },

  popularTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 5,
  },

  popularType: {
    color: COLORS.blueLight,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.7,
  },

  popularYear: {
    color: COLORS.muted,
    fontSize: 9,
  },

  popularTitle: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 16,
  },

  popularGenre: {
    color: COLORS.secondary,
    fontSize: 9,
    marginTop: 5,
  },

  popularRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 7,
  },

  popularRatingText: {
    color: COLORS.text,
    fontSize: 10,
    fontWeight: '800',
  },

  popularRatingSource: {
    color: COLORS.muted,
    fontSize: 8,
  },

  popularAdd: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },

  popularAdded: {
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.25)',
  },

  searchResultsSection: {
    marginTop: 2,
  },

  resultList: {
    gap: 10,
  },

  resultCard: {
    minHeight: 136,
    flexDirection: 'row',
    padding: 10,
    gap: 11,
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  resultPoster: {
    width: 78,
    height: 114,
    borderRadius: 9,
    backgroundColor: COLORS.elevated,
  },

  resultPosterPlaceholder: {
    width: 78,
    height: 114,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.elevated,
  },

  resultInfo: {
    flex: 1,
    minWidth: 0,
  },

  resultTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },

  typeBadge: {
    backgroundColor: 'rgba(59,130,246,0.15)',
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },

  typeBadgeText: {
    color: COLORS.blueLight,
    fontSize: 7,
    fontWeight: '900',
  },

  resultYear: {
    color: COLORS.muted,
    fontSize: 9,
  },

  resultTitle: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 16,
  },

  resultOverview: {
    color: COLORS.secondary,
    fontSize: 9,
    lineHeight: 14,
    marginTop: 5,
  },

  resultBottomLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginTop: 8,
  },

  resultRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  resultRatingValue: {
    color: COLORS.text,
    fontSize: 9,
    fontWeight: '800',
  },

  resultRatingSource: {
    color: COLORS.muted,
    fontSize: 7,
  },

  resultGenre: {
    color: COLORS.blueLight,
    fontSize: 8,
    fontWeight: '700',
  },

  addButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },

  addButtonSaved: {
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.25)',
  },

  personCard: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 11,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  personImage: {
    width: 53,
    height: 62,
    borderRadius: 9,
    backgroundColor: COLORS.elevated,
  },

  personPlaceholder: {
    width: 53,
    height: 62,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.elevated,
  },

  userAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.elevated,
  },

  userAvatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(59,130,246,0.13)',
  },

  personInfo: {
    flex: 1,
    minWidth: 0,
  },

  personName: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '900',
  },

  personDepartment: {
    color: COLORS.blueLight,
    fontSize: 9,
    marginTop: 4,
    fontWeight: '700',
  },

  personKnownFor: {
    color: COLORS.muted,
    fontSize: 9,
    marginTop: 4,
    lineHeight: 13,
  },

  listResultCard: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  listIcon: {
    width: 48,
    height: 48,
    borderRadius: 13,
    backgroundColor: 'rgba(59,130,246,0.13)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyState: {
    minHeight: 180,
    padding: 25,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },

  emptyTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
  },

  emptyDescription: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 16,
    textAlign: 'center',
  },

  backendNotice: {
    color: '#F59E0B',
    fontSize: 9,
    lineHeight: 14,
    textAlign: 'center',
    marginTop: 5,
  },

  footer: {
    alignItems: 'center',
    marginTop: 35,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  footerBrand: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },

  footerBlue: {
    color: COLORS.blueLight,
  },

  footerText: {
    color: COLORS.muted,
    fontSize: 9,
    marginTop: 5,
  },

  // ==========================================================
  // MODAL DE LISTAS
  // ==========================================================

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
    borderColor: COLORS.border,
  },

  listModalHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    marginBottom: 17,
  },

  listModalEyebrow: {
    color: COLORS.green,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.2,
  },

  listModalTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 5,
  },

  listModalSubtitle: {
    color: COLORS.secondary,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 5,
  },

  listModalClose: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.elevated,
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
    maxHeight: 420,
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
    borderColor: COLORS.border,
  },

  listChoiceSelected: {
    backgroundColor: 'rgba(34,197,94,0.07)',
    borderColor: 'rgba(34,197,94,0.28)',
  },

  listChoiceIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: 'rgba(34,197,94,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  listChoiceInfo: {
    flex: 1,
    minWidth: 0,
  },

  listChoiceName: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '800',
  },

  listChoiceCount: {
    color: COLORS.muted,
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
    backgroundColor: COLORS.blue,
  },

  listChoiceActionAdded: {
    backgroundColor: 'rgba(34,197,94,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.22)',
  },

  listChoiceActionText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
  },

  listChoiceActionTextAdded: {
    color: COLORS.green,
  },

  listModalEmpty: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 10,
  },

  listModalEmptyTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '800',
  },

  listModalEmptyText: {
    color: COLORS.secondary,
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
    backgroundColor: COLORS.blue,
  },

  listModalDoneText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
});
