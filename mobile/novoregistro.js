
import React, { useCallback, useEffect, useRef, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
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
import { lerListas, atualizarListas } from './listasStorage';
import { salvarItemListaNaWeb } from './listasServidor';

import {
  Ionicons,
  Feather,
  MaterialCommunityIcons,
} from '@expo/vector-icons';

// ============================================================
// CONFIGURAÇÕES
// ============================================================

const TMDB_KEY = '5c1853c10d9752023da5ddce4ada3b77';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMAGE = 'https://image.tmdb.org/t/p/w500';

const CHAVE_AVALIACOES = '@CineTrack:avaliacoes';
const CHAVE_ESTADO_NOVO_REGISTRO = '@CineTrack:novoRegistroEstado';

const CORES = {
  fundo: '#07090D',
  card: '#10141D',
  cardClaro: '#151B27',
  branco: '#F4F6FA',
  texto: '#D5DFEF',
  secundario: '#8995A8',
  apagado: '#636B7A',
  azul: '#1A6FFF',
  azulClaro: '#64AAFF',
  verde: '#1DB954',
  roxo: '#B06BFF',
  vermelho: '#F87171',
  borda: 'rgba(255,255,255,0.075)',
};

// ============================================================
// NORMALIZAÇÃO
// ============================================================

const tipoNormalizado = tipo => {
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
};

const tituloDaMidia = item =>
  item?.title ||
  item?.name ||
  item?.titulo ||
  item?.media_title ||
  'Sem título';

const caminhoPoster = item => {
  const poster =
    item?.poster_path ||
    item?.poster_url ||
    item?.poster ||
    item?.media?.poster_path ||
    item?.midia?.poster_path;

  if (!poster) return null;

  return String(poster).startsWith('http')
    ? String(poster)
    : `${TMDB_IMAGE}${poster}`;
};

const anoDaMidia = item => {
  const data =
    item?.release_date ||
    item?.first_air_date ||
    item?.data_lancamento ||
    item?.year ||
    item?.ano ||
    '';

  return data ? String(data).slice(0, 4) : '';
};

const dataDoRegistro = item =>
  item?.watched_at ||
  item?.data_assistida ||
  item?.data ||
  item?.created_at ||
  item?.createdAt ||
  item?.updated_at ||
  null;

const formatarDataCurta = valor => {
  if (!valor) return '';

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) return '';

  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });
};

// ============================================================
// CONVERTER REGISTROS SALVOS
// CORREÇÃO: IDENTIFICAR TAMBÉM SERIES PELAS CHAVES tv-123
// ============================================================

function converterRegistrosSalvos(dados) {
  if (!dados) return [];

  let registros = [];

  if (Array.isArray(dados)) {
    registros = dados;
  } else if (typeof dados === 'object') {
    const colecao = [
      dados.registros,
      dados.avaliacoes,
      dados.items,
      dados.itens,
      dados.data,
      dados.filmes,
    ].find(Array.isArray);

    if (colecao) {
      registros = colecao;
    } else {
      registros = Object.entries(dados)
        .filter(([, valor]) =>
          valor && typeof valor === 'object'
        )
        .map(([chave, valor]) => ({
          ...valor,
          _chaveArmazenamento: chave,
        }));
    }
  }

  return registros
    .filter(item => item && typeof item === 'object')
    .map(item => {
      const midia =
        item.media ||
        item.midia ||
        item.filme ||
        {};

      const chaveArmazenamento = String(
        item._chaveArmazenamento || ''
      );

      // Primeiro tenta descobrir o tipo pelo próprio registro.
      const tipoInformado =
        item.tipo ||
        item.media_type ||
        item.mediaType ||
        midia.tipo ||
        midia.media_type;

      // Se não houver tipo, verifica a chave e os campos do TMDB.
      // Exemplo: tv-123 precisa continuar sendo uma série.
      const ehSeriePelaChave =
        /^(?:tv|serie|série)[-_]/i.test(
          chaveArmazenamento
        );

      const possuiDadosDeSerie =
        Boolean(
          midia.first_air_date ||
          midia.original_name ||
          midia.name ||
          item.first_air_date ||
          item.original_name
        );

      const tipo = tipoInformado
        ? tipoNormalizado(tipoInformado)
        : (
            ehSeriePelaChave || possuiDadosDeSerie
              ? 'tv'
              : 'movie'
          );

      let id =
        midia.id ||
        item.tmdb_id ||
        item.tmdbId ||
        item.media_id ||
        item.mediaId ||
        item.filme_id ||
        item.id;

      // CORREÇÃO: captura corretamente o número em movie-123 ou tv-123.
      if (!id && chaveArmazenamento) {
        const encontrado = chaveArmazenamento.match(
          /^(?:movie|tv|serie|série|filme)[-_](\d+)/i
        );

        if (encontrado) {
          id = encontrado[1];
        }
      }

      return {
        ...item,

        id: id ? Number(id) || id : null,

        tipo,

        title:
          midia.title ||
          midia.name ||
          item.titulo ||
          item.title ||
          item.media_title ||
          'Obra sem título',

        poster_path:
          midia.poster_path ||
          item.poster_path ||
          item.poster_url ||
          item.poster ||
          null,

        release_date:
          midia.release_date ||
          midia.first_air_date ||
          item.release_date ||
          item.first_air_date ||
          item.ano ||
          '',
      };
    })
    .filter(item => item.id)
    .sort((a, b) =>
      new Date(dataDoRegistro(b) || 0).getTime() -
      new Date(dataDoRegistro(a) || 0).getTime()
    );
}

// ============================================================
// COMPONENTE NOVO REGISTRO
// ============================================================

export default function NovoRegistro({
  onVoltar,
  onAbrirDetalhes,
}) {
  const [tipoAtivo, setTipoAtivo] = useState('filme');

  const [busca, setBusca] = useState('');
  const [resultadosBusca, setResultadosBusca] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [erroBusca, setErroBusca] = useState('');

  const [populares, setPopulares] = useState([]);
  const [carregandoPopulares, setCarregandoPopulares] = useState(true);

  const [recentes, setRecentes] = useState([]);
  const [carregandoRecentes, setCarregandoRecentes] = useState(true);

  const [listas, setListas] = useState([]);
  const [nomeLista, setNomeLista] = useState('');
  const [descricaoLista, setDescricaoLista] = useState('');
  const [salvandoLista, setSalvandoLista] = useState(false);

  const [listaSelecionadaId, setListaSelecionadaId] = useState(null);

  const [tipoPesquisaLista, setTipoPesquisaLista] = useState('movie');
  const [buscaLista, setBuscaLista] = useState('');
  const [resultadosLista, setResultadosLista] = useState([]);
  const [buscandoLista, setBuscandoLista] = useState(false);
  const [erroBuscaLista, setErroBuscaLista] = useState('');

  const [itemSalvandoId, setItemSalvandoId] = useState(null);
  const [itemRemovendoId, setItemRemovendoId] = useState(null);
  const [restaurandoEstado, setRestaurandoEstado] = useState(true);

  const buscaRequestRef = useRef(0);
  const listaRequestRef = useRef(0);

  const ehLista = tipoAtivo === 'lista';
  const ehSerie = tipoAtivo === 'serie';
  const tipoTMDB = ehSerie ? 'tv' : 'movie';

  const listaSelecionada =
    listas.find(lista =>
      String(lista.id) === String(listaSelecionadaId)
    ) || null;

  // ==========================================================
  // ATUALIZAR LISTAS PERSISTIDAS
  // ==========================================================

  const atualizarListasPersistidas = useCallback(
    async atualizador => {
      const atualizadas = await atualizarListas(atualizador);
      setListas(atualizadas);
      return atualizadas;
    },
    []
  );

  // ==========================================================
  // CARREGAR DADOS E RESTAURAR ESTADO
  // ==========================================================

  useEffect(() => {
    let ativo = true;

    async function inicializar() {
      try {
        const [listasSalvas, estadoSalvo] = await Promise.all([
          lerListas(),
          AsyncStorage.getItem(CHAVE_ESTADO_NOVO_REGISTRO),
        ]);

        if (!ativo) return;

        setListas(listasSalvas);

        if (estadoSalvo) {
          const estado = JSON.parse(estadoSalvo);

          if (estado?.tipoAtivo) {
            setTipoAtivo(estado.tipoAtivo);
          }

          if (estado?.listaSelecionadaId) {
            setTipoAtivo('lista');
            setListaSelecionadaId(
              String(estado.listaSelecionadaId)
            );
          }
        }
      } catch (erro) {
        console.warn(
          'Erro ao iniciar Novo Registro:',
          erro
        );
      } finally {
        if (ativo) setRestaurandoEstado(false);
      }
    }

    inicializar();

    return () => {
      ativo = false;
    };
  }, []);

  // ==========================================================
  // SALVAR ESTADO DA TELA
  // ==========================================================

  const salvarEstadoTela = async (
    tipo = tipoAtivo,
    listaId = listaSelecionadaId
  ) => {
    try {
      await AsyncStorage.setItem(
        CHAVE_ESTADO_NOVO_REGISTRO,
        JSON.stringify({
          tipoAtivo: tipo,
          listaSelecionadaId: listaId,
        })
      );
    } catch (erro) {
      console.warn(
        'Erro ao salvar estado da tela:',
        erro
      );
    }
  };

  useEffect(() => {
    if (!listaSelecionadaId || !listas.length) return;

    if (
      !listas.some(lista =>
        String(lista.id) === String(listaSelecionadaId)
      )
    ) {
      setListaSelecionadaId(null);
    }
  }, [listas, listaSelecionadaId]);

  // ==========================================================
  // VISTOS RECENTEMENTE
  // ==========================================================

  const carregarRecentes = useCallback(async () => {
    setCarregandoRecentes(true);

    try {
      const salvo = await AsyncStorage.getItem(
        CHAVE_AVALIACOES
      );

      const registros = salvo
        ? converterRegistrosSalvos(JSON.parse(salvo))
        : [];

      setRecentes(
        registros
          .filter(item => item.tipo === tipoTMDB)
          .slice(0, 10)
      );
    } catch (erro) {
      console.warn(
        'Erro ao carregar registros recentes:',
        erro
      );

      setRecentes([]);
    } finally {
      setCarregandoRecentes(false);
    }
  }, [tipoTMDB]);

  useEffect(() => {
    carregarRecentes();
  }, [carregarRecentes]);

  // ==========================================================
  // POPULARES DO TMDB
  // ==========================================================

  const carregarPopulares = useCallback(async () => {
    if (ehLista) return;

    setCarregandoPopulares(true);

    try {
      const resposta = await fetch(
        `${TMDB_BASE}/${tipoTMDB}/popular?api_key=${TMDB_KEY}&language=pt-BR&page=1`
      );

      if (!resposta.ok) {
        throw new Error(
          'Não foi possível carregar os populares.'
        );
      }

      const dados = await resposta.json();

      setPopulares(
        Array.isArray(dados.results)
          ? dados.results.slice(0, 12)
          : []
      );
    } catch (erro) {
      console.warn(
        'Erro ao carregar populares:',
        erro
      );

      setPopulares([]);
    } finally {
      setCarregandoPopulares(false);
    }
  }, [ehLista, tipoTMDB]);

  useEffect(() => {
    carregarPopulares();
  }, [carregarPopulares]);

  // ==========================================================
  // PESQUISA PRINCIPAL
  // ==========================================================

  useEffect(() => {
    const termo = busca.trim();
    const requisicao = ++buscaRequestRef.current;

    if (ehLista || termo.length < 2) {
      setResultadosBusca([]);
      setBuscando(false);
      setErroBusca('');
      return undefined;
    }

    const temporizador = setTimeout(async () => {
      setBuscando(true);
      setErroBusca('');

      try {
        const resposta = await fetch(
          `${TMDB_BASE}/search/${tipoTMDB}?api_key=${TMDB_KEY}&language=pt-BR&query=${encodeURIComponent(termo)}&page=1&include_adult=false`
        );

        if (!resposta.ok) {
          throw new Error(
            'A pesquisa não pôde ser concluída.'
          );
        }

        const dados = await resposta.json();

        if (buscaRequestRef.current === requisicao) {
          setResultadosBusca(
            Array.isArray(dados.results)
              ? dados.results.slice(0, 20)
              : []
          );
        }
      } catch (erro) {
        if (buscaRequestRef.current === requisicao) {
          setResultadosBusca([]);

          setErroBusca(
            'Não foi possível pesquisar agora. Tente novamente.'
          );
        }

        console.warn(
          'Erro na pesquisa TMDB:',
          erro
        );
      } finally {
        if (buscaRequestRef.current === requisicao) {
          setBuscando(false);
        }
      }
    }, 450);

    return () => clearTimeout(temporizador);
  }, [busca, tipoTMDB, ehLista]);

  // ==========================================================
  // PESQUISA DENTRO DE UMA LISTA
  // ==========================================================

  useEffect(() => {
    const termo = buscaLista.trim();
    const requisicao = ++listaRequestRef.current;

    if (
      !ehLista ||
      !listaSelecionadaId ||
      termo.length < 2
    ) {
      setResultadosLista([]);
      setBuscandoLista(false);
      setErroBuscaLista('');
      return undefined;
    }

    const temporizador = setTimeout(async () => {
      setBuscandoLista(true);
      setErroBuscaLista('');

      try {
        const resposta = await fetch(
          `${TMDB_BASE}/search/${tipoPesquisaLista}?api_key=${TMDB_KEY}&language=pt-BR&query=${encodeURIComponent(termo)}&page=1&include_adult=false`
        );

        if (!resposta.ok) {
          throw new Error(
            'Não foi possível pesquisar essa obra.'
          );
        }

        const dados = await resposta.json();

        if (listaRequestRef.current === requisicao) {
          setResultadosLista(
            Array.isArray(dados.results)
              ? dados.results.slice(0, 20)
              : []
          );
        }
      } catch (erro) {
        if (listaRequestRef.current === requisicao) {
          setResultadosLista([]);

          setErroBuscaLista(
            'Não foi possível pesquisar. Verifique sua conexão e tente novamente.'
          );
        }

        console.warn(
          'Erro ao pesquisar dentro da lista:',
          erro
        );
      } finally {
        if (listaRequestRef.current === requisicao) {
          setBuscandoLista(false);
        }
      }
    }, 450);

    return () => clearTimeout(temporizador);
  }, [
    buscaLista,
    tipoPesquisaLista,
    ehLista,
    listaSelecionadaId,
  ]);

  // ==========================================================
  // TROCAR O TIPO DO REGISTRO
  // ==========================================================

  const selecionarTipo = tipo => {
    Keyboard.dismiss();
    setBusca('');
    setResultadosBusca([]);
    setErroBusca('');
    setListaSelecionadaId(null);
    setTipoAtivo(tipo);
    salvarEstadoTela(tipo, null);
  };

  // ==========================================================
  // ABRIR DETALHES DE FILME OU SÉRIE
  // ==========================================================

  const abrirMidia = async (item, tipo = tipoTMDB) => {
    if (!item?.id) {
      Alert.alert(
        'Não foi possível abrir',
        'Não conseguimos identificar essa obra.'
      );

      return;
    }

    if (typeof onAbrirDetalhes !== 'function') {
      Alert.alert(
        'Indisponível',
        'A tela de detalhes ainda não está conectada.'
      );

      return;
    }

    Keyboard.dismiss();

    await salvarEstadoTela(
      tipoAtivo,
      listaSelecionadaId
    );

    onAbrirDetalhes({
      id: Number(item.id) || item.id,
      tipo: tipoNormalizado(tipo),
      media: item,
    });
  };

  // ==========================================================
  // CRIAR LISTA
  // ==========================================================

  const criarLista = async () => {
    const nome = nomeLista.trim();
    const descricao = descricaoLista.trim();

    if (!nome) {
      Alert.alert(
        'Dê um nome à sua lista',
        'Digite um título para conseguir salvar sua lista.'
      );

      return;
    }

    setSalvandoLista(true);

    try {
      const novaLista = {
        id: `lista-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,
        nome,
        descricao,
        criada_em: new Date().toISOString(),
        itens: [],
      };

      await atualizarListasPersistidas(atuais => [
        novaLista,
        ...atuais,
      ]);

      setNomeLista('');
      setDescricaoLista('');
      Keyboard.dismiss();

      Alert.alert(
        'Lista criada!',
        `A lista "${nome}" foi salva no seu CineTrack.`
      );
    } catch (erro) {
      console.warn('Erro ao criar lista:', erro);

      Alert.alert(
        'Erro ao salvar',
        'Não foi possível criar sua lista. Tente novamente.'
      );
    } finally {
      setSalvandoLista(false);
    }
  };

  // ==========================================================
  // ABRIR UMA LISTA
  // ==========================================================

  const abrirLista = lista => {
    setListaSelecionadaId(String(lista.id));
    setTipoAtivo('lista');
    setBuscaLista('');
    setResultadosLista([]);
    setErroBuscaLista('');
    setTipoPesquisaLista('movie');

    salvarEstadoTela('lista', String(lista.id));

    Keyboard.dismiss();
  };

  const voltarParaListas = () => {
    setListaSelecionadaId(null);
    setBuscaLista('');
    setResultadosLista([]);
    setErroBuscaLista('');

    salvarEstadoTela('lista', null);

    Keyboard.dismiss();
  };

  const voltarDaTela = async () => {
    if (listaSelecionadaId) {
      voltarParaListas();
      return;
    }

    try {
      await AsyncStorage.removeItem(
        CHAVE_ESTADO_NOVO_REGISTRO
      );
    } catch (erro) {
      console.warn(
        'Erro ao limpar estado da tela:',
        erro
      );
    }

    if (typeof onVoltar === 'function') {
      onVoltar();
    }
  };

  // ==========================================================
  // VERIFICAR DUPLICAÇÃO
  // ==========================================================

  const obraJaEstaNaLista = (lista, item, tipo) => {
    if (!lista || !item?.id) return false;

    return (lista.itens || []).some(obra =>
      String(obra.id) === String(item.id) &&
      tipoNormalizado(obra.tipo) === tipoNormalizado(tipo)
    );
  };

  // ==========================================================
  // ADICIONAR FILME OU SÉRIE À LISTA
  // ==========================================================

  const adicionarObraNaLista = async (item, tipo) => {
    if (!listaSelecionadaId || !item?.id) {
      Alert.alert(
        'Não foi possível adicionar',
        'Selecione uma lista e tente novamente.'
      );

      return;
    }

    const tipoObra = tipoNormalizado(tipo);
    const chaveItem = `${tipoObra}-${item.id}`;

    setItemSalvandoId(chaveItem);

    try {
      let listaEncontrada = false;
      let duplicada = false;

      const obra = {
        id: Number(item.id) || item.id,
        tipo: tipoObra,
        title: item.title || item.name || 'Sem título',
        poster_path: item.poster_path || null,
        release_date:
          item.release_date ||
          item.first_air_date ||
          '',
        vote_average: Number(item.vote_average || 0),
        adicionada_em: new Date().toISOString(),
      };

      const listaAlvo = listas.find(lista =>
        String(lista.id) === String(listaSelecionadaId)
      );

      await atualizarListasPersistidas(atuais =>
        atuais.map(lista => {
          if (
            String(lista.id) !== String(listaSelecionadaId)
          ) {
            return lista;
          }

          listaEncontrada = true;

          if (obraJaEstaNaLista(lista, obra, tipoObra)) {
            duplicada = true;
            return lista;
          }

          return {
            ...lista,
            itens: [...(lista.itens || []), obra],
          };
        })
      );

      if (!listaEncontrada) {
        Alert.alert(
          'Lista não encontrada',
          'Volte às listas e abra a coleção novamente.'
        );

        return;
      }

      if (duplicada) {
        try {
          await salvarItemListaNaWeb({
            lista: listaAlvo,
            item: obra,
          });

          Alert.alert(
            'Lista sincronizada',
            'Essa obra já estava no aplicativo e agora foi conferida/sincronizada com o site.'
          );
        } catch (erroWeb) {
          console.warn(
            'A obra já existe localmente, mas não sincronizou com o site:',
            erroWeb
          );

          Alert.alert(
            'Ainda não sincronizou',
            'A obra continua salva no aplicativo, mas não chegou ao site. Verifique o login e a conexão.'
          );
        }

        return;
      }

      // A gravação local é mantida mesmo se a rede falhar.
      // Em seguida, enviamos a mesma obra ao banco online.

      try {
        await salvarItemListaNaWeb({
          lista: listaAlvo,
          item: obra,
        });
      } catch (erroWeb) {
        console.warn(
          'Obra salva localmente, mas não sincronizou com o site:',
          erroWeb
        );

        Alert.alert(
          'Salvo no aplicativo',
          'A obra ficou salva neste aparelho, mas não chegou ao site. Verifique o login e a conexão e tente novamente.'
        );
      }

      setResultadosLista(prev =>
        prev.map(resultado =>
          String(resultado.id) === String(item.id)
            ? { ...resultado, _jaAdicionado: true }
            : resultado
        )
      );
    } catch (erro) {
      console.warn(
        'Erro ao adicionar obra à lista:',
        erro
      );

      Alert.alert(
        'Erro ao adicionar',
        'Não foi possível salvar essa obra. Tente novamente.'
      );
    } finally {
      setItemSalvandoId(null);
    }
  };

  // ==========================================================
  // REMOVER OBRA DA LISTA
  // ==========================================================

  const removerObraDaLista = obra => {
    if (!listaSelecionadaId || !obra?.id) return;

    Alert.alert(
      'Remover obra',
      `Deseja remover "${tituloDaMidia(obra)}" desta lista?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            const tipoObra = tipoNormalizado(obra.tipo);
            const chave = `${tipoObra}-${obra.id}`;

            setItemRemovendoId(chave);

            try {
              await atualizarListasPersistidas(atuais =>
                atuais.map(lista =>
                  String(lista.id) !== String(listaSelecionadaId)
                    ? lista
                    : {
                        ...lista,
                        itens: (lista.itens || []).filter(item =>
                          !(
                            String(item.id) === String(obra.id) &&
                            tipoNormalizado(item.tipo) === tipoObra
                          )
                        ),
                      }
                )
              );
            } catch (erro) {
              console.warn(
                'Erro ao remover obra:',
                erro
              );

              Alert.alert(
                'Erro',
                'Não foi possível remover essa obra.'
              );
            } finally {
              setItemRemovendoId(null);
            }
          },
        },
      ]
    );
  };

  // ==========================================================
  // EXCLUIR LISTA
  // ==========================================================

  const excluirLista = lista => {
    Alert.alert(
      'Excluir lista',
      `Tem certeza de que deseja excluir "${lista.nome}" e todas as obras dela?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await atualizarListasPersistidas(atuais =>
                atuais.filter(
                  item => String(item.id) !== String(lista.id)
                )
              );

              if (
                String(listaSelecionadaId) === String(lista.id)
              ) {
                voltarParaListas();
              }
            } catch (erro) {
              console.warn(
                'Erro ao excluir lista:',
                erro
              );

              Alert.alert(
                'Erro',
                'Não foi possível excluir esta lista.'
              );
            }
          },
        },
      ]
    );
  };

  // ==========================================================
  // TÍTULO DE SEÇÃO
  // ==========================================================

  const renderTituloSecao = (titulo, complemento = null) => (
    <View style={styles.tituloSecao}>
      <Text style={styles.textoTituloSecao}>
        {titulo}
      </Text>

      <View style={styles.linhaSecao} />

      {complemento}
    </View>
  );

  // ==========================================================
  // POSTER PEQUENO
  // ==========================================================

  const renderPosterPequeno = (item, ehTv = false) => {
    const poster = caminhoPoster(item);

    return (
      <View style={styles.posterPequeno}>
        {poster ? (
          <Image
            source={{ uri: poster }}
            style={styles.imagemPosterPequeno}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.posterVazio}>
            <Ionicons
              name={ehTv ? 'tv-outline' : 'film-outline'}
              size={20}
              color={CORES.secundario}
            />
          </View>
        )}
      </View>
    );
  };

  // ==========================================================
  // REGISTROS RECENTES
  // ==========================================================

  const renderRecente = (item, indice) => {
    const poster = caminhoPoster(item);
    const data = formatarDataCurta(dataDoRegistro(item));

    return (
      <TouchableOpacity
        key={`${item.tipo}-${item.id}-${indice}`}
        style={styles.recenteItem}
        activeOpacity={0.78}
        onPress={() => abrirMidia(item, tipoTMDB)}
      >
        <View style={styles.recentePoster}>
          {poster ? (
            <Image
              source={{ uri: poster }}
              style={styles.imagemRecente}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.posterVazio}>
              <Ionicons
                name={ehSerie ? 'tv-outline' : 'film-outline'}
                size={22}
                color={CORES.azulClaro}
              />
            </View>
          )}
        </View>

        <Text
          style={styles.nomeRecente}
          numberOfLines={1}
        >
          {tituloDaMidia(item)}
        </Text>

        {!!data && (
          <Text style={styles.dataRecente}>
            {data}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  // ==========================================================
  // ATALHOS
  // ==========================================================

  const renderAtalho = ({ tipo, icone, titulo, cor }) => (
    <TouchableOpacity
      key={tipo}
      style={[
        styles.atalho,
        {
          borderColor: `${cor}55`,
          backgroundColor: `${cor}12`,
        },
      ]}
      activeOpacity={0.8}
      onPress={() => selecionarTipo(tipo)}
    >
      <MaterialCommunityIcons
        name={icone}
        size={29}
        color={cor}
      />

      <Text style={[styles.textoAtalho, { color: cor }]}>
        {titulo}
      </Text>
    </TouchableOpacity>
  );

  // ==========================================================
  // RESULTADO DA BUSCA PRINCIPAL
  // ==========================================================

  const renderResultado = (item, indice) => (
    <TouchableOpacity
      key={`${item.id}-${indice}`}
      style={styles.itemResultado}
      activeOpacity={0.78}
      onPress={() => abrirMidia(item, tipoTMDB)}
    >
      {renderPosterPequeno(item, ehSerie)}

      <View style={styles.infoResultado}>
        <Text
          numberOfLines={2}
          style={styles.tituloResultado}
        >
          {tituloDaMidia(item)}
        </Text>

        <Text style={styles.metaResultado}>
          {anoDaMidia(item) || 'Ano não informado'}
          {item.vote_average
            ? `  ·  ★ ${Number(item.vote_average).toFixed(1)}`
            : ''}
        </Text>

        {!!item.overview && (
          <Text
            numberOfLines={2}
            style={styles.sinopseResultado}
          >
            {item.overview}
          </Text>
        )}
      </View>

      <View
        style={[
          styles.etiquetaTipo,
          ehSerie
            ? styles.etiquetaSerie
            : styles.etiquetaFilme,
        ]}
      >
        <Text
          style={[
            styles.textoEtiqueta,
            {
              color: ehSerie
                ? CORES.roxo
                : CORES.azulClaro,
            },
          ]}
        >
          {ehSerie ? 'SÉRIE' : 'FILME'}
        </Text>
      </View>

      <Feather
        name="chevron-right"
        size={18}
        color={CORES.apagado}
      />
    </TouchableOpacity>
  );

  // ==========================================================
  // POPULARES
  // ==========================================================

  const renderPopular = (item, indice) => {
    const poster = caminhoPoster(item);

    return (
      <TouchableOpacity
        key={`${item.id}-${indice}`}
        style={styles.itemPopular}
        activeOpacity={0.8}
        onPress={() => abrirMidia(item, tipoTMDB)}
      >
        {poster ? (
          <Image
            source={{ uri: poster }}
            style={styles.posterPopular}
            resizeMode="cover"
          />
        ) : (
          <View
            style={[
              styles.posterPopular,
              styles.posterVazio,
            ]}
          >
            <Ionicons
              name={ehSerie ? 'tv-outline' : 'film-outline'}
              size={21}
              color={CORES.secundario}
            />
          </View>
        )}

        <View style={styles.infoPopular}>
          <Text
            style={styles.tituloPopular}
            numberOfLines={2}
          >
            {tituloDaMidia(item)}
          </Text>

          <Text style={styles.metaPopular}>
            {anoDaMidia(item) || 'Ano não informado'}
          </Text>

          {!!item.vote_average && (
            <View style={styles.notaPopular}>
              <Ionicons
                name="star"
                size={12}
                color="#FBBF24"
              />

              <Text style={styles.textoNotaPopular}>
                {Number(item.vote_average).toFixed(1)}
              </Text>
            </View>
          )}
        </View>

        <View
          style={[
            styles.etiquetaTipo,
            ehSerie
              ? styles.etiquetaSerie
              : styles.etiquetaFilme,
          ]}
        >
          <Text
            style={[
              styles.textoEtiqueta,
              {
                color: ehSerie
                  ? CORES.roxo
                  : CORES.azulClaro,
              },
            ]}
          >
            {ehSerie ? 'SÉRIE' : 'FILME'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // ==========================================================
  // FORMULÁRIO DE LISTA
  // ==========================================================

  const renderFormularioLista = () => (
    <>
      <View style={styles.listaIntro}>
        <View style={styles.iconeListaIntro}>
          <MaterialCommunityIcons
            name="clipboard-list-outline"
            size={29}
            color={CORES.verde}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.listaIntroTitulo}>
            Suas listas, suas histórias.
          </Text>

          <Text style={styles.listaIntroTexto}>
            Organize filmes e séries por tema, gênero ou qualquer ideia sua.
          </Text>
        </View>
      </View>

      <View style={styles.formLista}>
        <Text style={styles.rotuloCampo}>
          NOME DA LISTA
        </Text>

        <TextInput
          value={nomeLista}
          onChangeText={setNomeLista}
          placeholder="Ex.: Filmes para assistir"
          placeholderTextColor={CORES.apagado}
          style={styles.campoLista}
          maxLength={60}
          returnKeyType="next"
        />

        <Text
          style={[
            styles.rotuloCampo,
            { marginTop: 18 },
          ]}
        >
          DESCRIÇÃO (OPCIONAL)
        </Text>

        <TextInput
          value={descricaoLista}
          onChangeText={setDescricaoLista}
          placeholder="Sobre o que é essa lista?"
          placeholderTextColor={CORES.apagado}
          style={[
            styles.campoLista,
            styles.campoDescricao,
          ]}
          maxLength={180}
          multiline
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[
            styles.botaoCriarLista,
            salvandoLista && styles.botaoDesabilitado,
          ]}
          activeOpacity={0.85}
          onPress={criarLista}
          disabled={salvandoLista}
        >
          {salvandoLista ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Feather
                name="plus"
                size={19}
                color="#FFFFFF"
              />

              <Text style={styles.textoBotaoCriarLista}>
                Criar lista
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </>
  );

  // ==========================================================
  // MINHAS LISTAS
  // ==========================================================

  const renderMinhasListas = () => (
    <>
      {renderTituloSecao('MINHAS LISTAS')}

      {listas.length ? (
        listas.map(lista => (
          <View
            key={lista.id}
            style={styles.cardLista}
          >
            <TouchableOpacity
              style={styles.abrirListaCard}
              activeOpacity={0.8}
              onPress={() => abrirLista(lista)}
            >
              <View style={styles.iconeCardLista}>
                <MaterialCommunityIcons
                  name="playlist-play"
                  size={25}
                  color={CORES.verde}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={styles.nomeCardLista}
                  numberOfLines={1}
                >
                  {lista.nome}
                </Text>

                <Text
                  style={styles.descricaoCardLista}
                  numberOfLines={1}
                >
                  {lista.descricao || 'Lista pessoal'}
                </Text>

                <Text style={styles.quantidadeCardLista}>
                  {(lista.itens || []).length}{' '}
                  {(lista.itens || []).length === 1
                    ? 'obra'
                    : 'obras'}
                </Text>
              </View>

              <Feather
                name="chevron-right"
                size={19}
                color={CORES.apagado}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botaoExcluirLista}
              onPress={() => excluirLista(lista)}
              accessibilityLabel={`Excluir lista ${lista.nome}`}
            >
              <Feather
                name="trash-2"
                size={16}
                color={CORES.vermelho}
              />
            </TouchableOpacity>
          </View>
        ))
      ) : (
        <View style={styles.vazioListas}>
          <Feather
            name="layers"
            size={24}
            color={CORES.apagado}
          />

          <Text style={styles.vazioTitulo}>
            Você ainda não criou listas
          </Text>

          <Text style={styles.vazioTexto}>
            Crie sua primeira coleção pelo formulário acima.
          </Text>
        </View>
      )}
    </>
  );

  // ==========================================================
  // RESULTADO DA PESQUISA DENTRO DE UMA LISTA
  // ==========================================================

  const renderResultadoParaLista = (item, indice) => {
    const jaAdicionado = obraJaEstaNaLista(
      listaSelecionada,
      item,
      tipoPesquisaLista
    );

    const chave = `${tipoPesquisaLista}-${item.id}`;
    const estaSalvando = itemSalvandoId === chave;

    return (
      <View
        key={`${item.id}-${indice}`}
        style={styles.resultadoLista}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() =>
            abrirMidia(item, tipoPesquisaLista)
          }
        >
          {renderPosterPequeno(
            item,
            tipoPesquisaLista === 'tv'
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.infoResultadoLista}
          activeOpacity={0.8}
          onPress={() =>
            abrirMidia(item, tipoPesquisaLista)
          }
        >
          <Text
            style={styles.tituloResultado}
            numberOfLines={2}
          >
            {tituloDaMidia(item)}
          </Text>

          <Text style={styles.metaResultado}>
            {anoDaMidia(item) || 'Ano não informado'}
            {item.vote_average
              ? `  ·  ★ ${Number(item.vote_average).toFixed(1)}`
              : ''}
          </Text>

          <Text
            style={[
              styles.tipoResultadoLista,
              {
                color:
                  tipoPesquisaLista === 'tv'
                    ? CORES.roxo
                    : CORES.azulClaro,
              },
            ]}
          >
            {tipoPesquisaLista === 'tv' ? 'SÉRIE' : 'FILME'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.botaoAdicionarObra,
            jaAdicionado && styles.botaoJaAdicionado,
            estaSalvando && styles.botaoDesabilitado,
          ]}
          activeOpacity={0.8}
          disabled={jaAdicionado || Boolean(itemSalvandoId)}
          onPress={() =>
            adicionarObraNaLista(item, tipoPesquisaLista)
          }
        >
          {estaSalvando ? (
            <ActivityIndicator
              size="small"
              color="#FFFFFF"
            />
          ) : jaAdicionado ? (
            <>
              <Feather
                name="check"
                size={15}
                color={CORES.verde}
              />

              <Text style={styles.textoJaAdicionado}>
                Adicionado
              </Text>
            </>
          ) : (
            <>
              <Feather
                name="plus"
                size={17}
                color="#FFFFFF"
              />

              <Text style={styles.textoAdicionarObra}>
                Adicionar
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  // ==========================================================
  // OBRAS SALVAS DENTRO DA LISTA
  // ==========================================================

  const renderObrasDaLista = () => {
    if (!listaSelecionada?.itens?.length) {
      return (
        <View style={styles.listaSemObras}>
          <MaterialCommunityIcons
            name="movie-open-outline"
            size={30}
            color={CORES.apagado}
          />

          <Text style={styles.vazioTitulo}>
            Sua lista ainda está vazia
          </Text>

          <Text style={styles.vazioTexto}>
            Pesquise um filme ou uma série acima e toque em Adicionar.
          </Text>
        </View>
      );
    }

    return listaSelecionada.itens.map((obra, indice) => {
      const tipoObra = tipoNormalizado(obra.tipo);
      const poster = caminhoPoster(obra);
      const chave = `${tipoObra}-${obra.id}`;
      const estaRemovendo = itemRemovendoId === chave;

      return (
        <View
          key={`${obra.id}-${tipoObra}-${indice}`}
          style={styles.obraSalva}
        >
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => abrirMidia(obra, tipoObra)}
            accessibilityRole="button"
            accessibilityLabel={`Ver detalhes de ${tituloDaMidia(obra)}`}
          >
            {poster ? (
              <Image
                source={{ uri: poster }}
                style={styles.posterObraSalva}
                resizeMode="cover"
              />
            ) : (
              <View
                style={[
                  styles.posterObraSalva,
                  styles.posterVazio,
                ]}
              >
                <Ionicons
                  name={
                    tipoObra === 'tv'
                      ? 'tv-outline'
                      : 'film-outline'
                  }
                  size={22}
                  color={CORES.secundario}
                />
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.infoObraSalva}
            activeOpacity={0.8}
            onPress={() => abrirMidia(obra, tipoObra)}
          >
            <Text
              style={styles.tituloObraSalva}
              numberOfLines={2}
            >
              {tituloDaMidia(obra)}
            </Text>

            <Text style={styles.metaObraSalva}>
              {anoDaMidia(obra) || 'Ano não informado'}
            </Text>

            <Text
              style={[
                styles.tipoObraSalva,
                {
                  color:
                    tipoObra === 'tv'
                      ? CORES.roxo
                      : CORES.azulClaro,
                },
              ]}
            >
              {tipoObra === 'tv' ? 'SÉRIE' : 'FILME'}
            </Text>

            <Text style={styles.abrirDetalhesHint}>
              TOQUE PARA VER DETALHES
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.botaoRemoverObra}
            activeOpacity={0.8}
            disabled={estaRemovendo}
            onPress={() => removerObraDaLista(obra)}
            accessibilityLabel={`Remover ${tituloDaMidia(obra)} da lista`}
          >
            {estaRemovendo ? (
              <ActivityIndicator
                size="small"
                color={CORES.vermelho}
              />
            ) : (
              <Feather
                name="trash-2"
                size={17}
                color={CORES.vermelho}
              />
            )}
          </TouchableOpacity>
        </View>
      );
    });
  };

  // ==========================================================
  // DETALHES DE UMA LISTA
  // ==========================================================

  const renderDetalheLista = () => {
    if (!listaSelecionada) {
      return (
        <View style={styles.estadoVazio}>
          <Text style={styles.estadoTexto}>
            Não foi possível encontrar essa lista.
          </Text>

          <TouchableOpacity
            style={styles.botaoTentarNovamente}
            onPress={voltarParaListas}
          >
            <Text style={styles.textoTentarNovamente}>
              Voltar às listas
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <>
        <View style={styles.cabecalhoListaAberta}>
          <View style={styles.iconeListaAberta}>
            <MaterialCommunityIcons
              name="playlist-play"
              size={26}
              color={CORES.verde}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.nomeListaAberta}>
              {listaSelecionada.nome}
            </Text>

            <Text style={styles.descricaoListaAberta}>
              {listaSelecionada.descricao || 'Sua coleção pessoal'}
            </Text>

            <Text style={styles.quantidadeListaAberta}>
              {listaSelecionada.itens.length}{' '}
              {listaSelecionada.itens.length === 1
                ? 'obra'
                : 'obras'}
            </Text>
          </View>
        </View>

        <View style={styles.blocoAdicionar}>
          <Text style={styles.tituloAdicionar}>
            Adicionar obras
          </Text>

          <Text style={styles.subtituloAdicionar}>
            Pesquise na TMDB e adicione filmes ou séries à sua coleção.
          </Text>

          <View style={styles.seletorTipoLista}>
            <TouchableOpacity
              style={[
                styles.botaoTipoListaBusca,
                tipoPesquisaLista === 'movie' &&
                  styles.botaoTipoFilmeAtivo,
              ]}
              onPress={() => {
                setTipoPesquisaLista('movie');
                setBuscaLista('');
                setResultadosLista([]);
                setErroBuscaLista('');
                Keyboard.dismiss();
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name="film-outline"
                size={15}
                color={
                  tipoPesquisaLista === 'movie'
                    ? '#FFFFFF'
                    : CORES.secundario
                }
              />

              <Text
                style={[
                  styles.textoTipoListaBusca,
                  tipoPesquisaLista === 'movie' &&
                    styles.textoTipoListaBuscaAtivo,
                ]}
              >
                Filmes
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.botaoTipoListaBusca,
                tipoPesquisaLista === 'tv' &&
                  styles.botaoTipoSerieAtivo,
              ]}
              onPress={() => {
                setTipoPesquisaLista('tv');
                setBuscaLista('');
                setResultadosLista([]);
                setErroBuscaLista('');
                Keyboard.dismiss();
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name="tv-outline"
                size={15}
                color={
                  tipoPesquisaLista === 'tv'
                    ? '#FFFFFF'
                    : CORES.secundario
                }
              />

              <Text
                style={[
                  styles.textoTipoListaBusca,
                  tipoPesquisaLista === 'tv' &&
                    styles.textoTipoListaBuscaAtivo,
                ]}
              >
                Séries
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.buscaDentroLista}>
            <Feather
              name="search"
              size={18}
              color={CORES.apagado}
            />

            <TextInput
              value={buscaLista}
              onChangeText={setBuscaLista}
              placeholder={
                tipoPesquisaLista === 'tv'
                  ? 'Pesquisar série...'
                  : 'Pesquisar filme...'
              }
              placeholderTextColor={CORES.apagado}
              style={styles.inputBuscaLista}
              returnKeyType="search"
              autoCorrect={false}
            />

            {!!buscaLista && (
              <TouchableOpacity
                onPress={() => {
                  setBuscaLista('');
                  setResultadosLista([]);
                  Keyboard.dismiss();
                }}
                hitSlop={10}
              >
                <Ionicons
                  name="close-circle"
                  size={19}
                  color={CORES.apagado}
                />
              </TouchableOpacity>
            )}
          </View>

          {buscaLista.trim().length < 2 ? (
            <View style={styles.dicaPesquisa}>
              <Feather
                name="info"
                size={15}
                color={CORES.secundario}
              />

              <Text style={styles.dicaPesquisaTexto}>
                Digite pelo menos duas letras para pesquisar.
              </Text>
            </View>
          ) : buscandoLista ? (
            <View style={styles.estadoCarregando}>
              <ActivityIndicator
                size="small"
                color={CORES.azulClaro}
              />

              <Text style={styles.estadoTexto}>
                Pesquisando na TMDB...
              </Text>
            </View>
          ) : erroBuscaLista ? (
            <View style={styles.estadoVazio}>
              <Feather
                name="alert-circle"
                size={23}
                color={CORES.apagado}
              />

              <Text style={styles.estadoTexto}>
                {erroBuscaLista}
              </Text>
            </View>
          ) : resultadosLista.length ? (
            <View style={styles.resultadosDentroLista}>
              <Text style={styles.rotuloResultados}>
                RESULTADOS ENCONTRADOS
              </Text>

              {resultadosLista.map(renderResultadoParaLista)}
            </View>
          ) : (
            <View style={styles.estadoVazio}>
              <Feather
                name="search"
                size={23}
                color={CORES.apagado}
              />

              <Text style={styles.estadoTexto}>
                Nenhuma obra encontrada com esse nome.
              </Text>
            </View>
          )}
        </View>

        {renderTituloSecao(
          'OBRAS DA LISTA',
          <Text style={styles.contadorObras}>
            {listaSelecionada.itens.length}
          </Text>
        )}

        {renderObrasDaLista()}
      </>
    );
  };

  // ==========================================================
  // CONTEÚDO PRINCIPAL: FILMES E SÉRIES
  // ==========================================================

  const renderConteudoCatalogo = () => {
    if (busca.trim().length >= 2) {
      return (
        <View style={styles.areaResultados}>
          {renderTituloSecao('RESULTADOS DA PESQUISA')}

          {buscando ? (
            <View style={styles.estadoCarregando}>
              <ActivityIndicator
                size="small"
                color={CORES.azulClaro}
              />

              <Text style={styles.estadoTexto}>
                Procurando na TMDB...
              </Text>
            </View>
          ) : erroBusca ? (
            <View style={styles.estadoVazio}>
              <Feather
                name="alert-circle"
                size={25}
                color={CORES.apagado}
              />

              <Text style={styles.estadoTexto}>
                {erroBusca}
              </Text>
            </View>
          ) : resultadosBusca.length ? (
            resultadosBusca.map(renderResultado)
          ) : (
            <View style={styles.estadoVazio}>
              <Feather
                name="search"
                size={26}
                color={CORES.apagado}
              />

              <Text style={styles.estadoTitulo}>
                Nenhum resultado encontrado
              </Text>

              <Text style={styles.estadoTexto}>
                Tente pesquisar usando outro título.
              </Text>
            </View>
          )}
        </View>
      );
    }

    return (
      <>
        {renderTituloSecao('VISTOS RECENTEMENTE')}

        {carregandoRecentes ? (
          <ActivityIndicator
            color={CORES.azulClaro}
            style={styles.carregandoRecentes}
          />
        ) : recentes.length ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listaRecentes}
          >
            {recentes.map(renderRecente)}
          </ScrollView>
        ) : (
          <View style={styles.semRecentes}>
            <Feather
              name="clock"
              size={17}
              color={CORES.apagado}
            />

            <Text style={styles.semRecentesTexto}>
              Seus últimos registros aparecerão aqui.
            </Text>
          </View>
        )}

        {renderTituloSecao('O QUE QUER REGISTRAR?')}

        <View style={styles.atalhos}>
          {renderAtalho({
            tipo: 'filme',
            icone: 'movie-open-outline',
            titulo: 'Filme',
            cor: CORES.azulClaro,
          })}

          {renderAtalho({
            tipo: 'serie',
            icone: 'television-play',
            titulo: 'Série',
            cor: CORES.roxo,
          })}

          {renderAtalho({
            tipo: 'lista',
            icone: 'clipboard-list-outline',
            titulo: 'Lista',
            cor: CORES.verde,
          })}
        </View>

        {renderTituloSecao('POPULARES AGORA')}

        {carregandoPopulares ? (
          <View style={styles.estadoCarregando}>
            <ActivityIndicator
              size="small"
              color={CORES.azulClaro}
            />

            <Text style={styles.estadoTexto}>
              Carregando catálogo...
            </Text>
          </View>
        ) : populares.length ? (
          populares.map(renderPopular)
        ) : (
          <View style={styles.estadoVazio}>
            <Feather
              name="wifi-off"
              size={24}
              color={CORES.apagado}
            />

            <Text style={styles.estadoTexto}>
              Não foi possível carregar os populares.
            </Text>

            <TouchableOpacity
              onPress={carregarPopulares}
              style={styles.botaoTentarNovamente}
            >
              <Text style={styles.textoTentarNovamente}>
                Tentar novamente
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </>
    );
  };

  // ==========================================================
  // CABEÇALHO E RETORNO
  // ==========================================================

  const voltarDoCabecalho = () => {
    if (ehLista && listaSelecionadaId) {
      voltarParaListas();
      return;
    }

    voltarDaTela();
  };

  // ==========================================================
  // INTERFACE
  // ==========================================================

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={CORES.fundo}
        translucent={false}
      />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.botaoVoltar}
          onPress={voltarDoCabecalho}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <Feather
            name="arrow-left"
            size={19}
            color={CORES.texto}
          />
        </TouchableOpacity>

        <Text
          style={styles.tituloHeader}
          numberOfLines={1}
        >
          {ehLista && listaSelecionada ? (
            listaSelecionada.nome
          ) : (
            <>
              Novo{' '}
              <Text style={styles.tituloHeaderDestaque}>
                registro
              </Text>
            </>
          )}
        </Text>

        <View style={styles.espacoHeader} />
      </View>

      {!listaSelecionadaId && (
        <View style={styles.seletorTipo}>
          {[
            { id: 'filme', nome: 'Filme' },
            { id: 'serie', nome: 'Série' },
            { id: 'lista', nome: 'Lista' },
          ].map(opcao => {
            const ativo = tipoAtivo === opcao.id;

            return (
              <TouchableOpacity
                key={opcao.id}
                style={[
                  styles.botaoTipo,
                  ativo && styles.botaoTipoAtivo,
                  ativo &&
                    opcao.id === 'serie' &&
                    styles.botaoTipoSerie,
                  ativo &&
                    opcao.id === 'lista' &&
                    styles.botaoTipoLista,
                ]}
                onPress={() => selecionarTipo(opcao.id)}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.textoBotaoTipo,
                    ativo && styles.textoBotaoTipoAtivo,
                  ]}
                >
                  {opcao.nome}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {!ehLista && (
        <View style={styles.areaBusca}>
          <Feather
            name="search"
            size={19}
            color={CORES.apagado}
          />

          <TextInput
            value={busca}
            onChangeText={setBusca}
            placeholder={
              ehSerie
                ? 'Qual série você assistiu?'
                : 'Qual filme você assistiu?'
            }
            placeholderTextColor={CORES.apagado}
            style={styles.inputBusca}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            accessibilityLabel="Pesquisar no catálogo"
          />

          {!!busca && (
            <TouchableOpacity
              onPress={() => {
                setBusca('');
                setResultadosBusca([]);
                Keyboard.dismiss();
              }}
              hitSlop={10}
            >
              <Ionicons
                name="close-circle"
                size={19}
                color={CORES.apagado}
              />
            </TouchableOpacity>
          )}
        </View>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.conteudo}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {restaurandoEstado ? (
          <ActivityIndicator
            color={CORES.azulClaro}
            style={{ marginTop: 30 }}
          />
        ) : ehLista ? (
          listaSelecionadaId ? (
            renderDetalheLista()
          ) : (
            <>
              {renderFormularioLista()}
              {renderMinhasListas()}
            </>
          )
        ) : (
          renderConteudoCatalogo()
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================
// ESTILOS
// ============================================================

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: CORES.fundo,
    paddingTop:
      Platform.OS === 'android'
        ? StatusBar.currentHeight || 24
        : 0,
  },

  header: {
    height: 62,
    paddingHorizontal: 19,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    borderBottomWidth: 1,
    borderBottomColor: CORES.borda,
  },

  botaoVoltar: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: CORES.borda,
    alignItems: 'center',
    justifyContent: 'center',
  },

  tituloHeader: {
    flex: 1,
    color: CORES.branco,
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.4,
  },

  tituloHeaderDestaque: {
    color: CORES.azulClaro,
    fontStyle: 'italic',
  },

  espacoHeader: {
    width: 38,
  },

  seletorTipo: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 14,
    padding: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: CORES.borda,
  },

  botaoTipo: {
    flex: 1,
    height: 37,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },

  botaoTipoAtivo: {
    backgroundColor: CORES.azul,
  },

  botaoTipoSerie: {
    backgroundColor: '#8745C9',
  },

  botaoTipoLista: {
    backgroundColor: '#168B45',
  },

  textoBotaoTipo: {
    color: CORES.apagado,
    fontSize: 13,
    fontWeight: '700',
  },

  textoBotaoTipoAtivo: {
    color: '#FFFFFF',
  },

  areaBusca: {
    height: 51,
    marginHorizontal: 20,
    marginTop: 14,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1.4,
    borderColor: 'rgba(100,170,255,0.22)',
  },

  inputBusca: {
    flex: 1,
    color: CORES.branco,
    fontSize: 14,
    paddingVertical: 0,
  },

  scroll: {
    flex: 1,
  },

  conteudo: {
    paddingTop: 22,
    paddingBottom: 20,
  },

  tituloSecao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginHorizontal: 20,
    marginTop: 3,
    marginBottom: 13,
  },

  textoTituloSecao: {
    color: CORES.apagado,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.7,
  },

  linhaSecao: {
    flex: 1,
    height: 1,
    backgroundColor: CORES.borda,
  },

  listaRecentes: {
    paddingHorizontal: 20,
    paddingBottom: 4,
    gap: 12,
  },

  recenteItem: {
    width: 62,
    alignItems: 'center',
  },

  recentePoster: {
    width: 58,
    height: 79,
    borderRadius: 9,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: CORES.borda,
    backgroundColor: CORES.card,
  },

  imagemRecente: {
    width: '100%',
    height: '100%',
  },

  nomeRecente: {
    color: 'rgba(244,246,250,0.72)',
    width: 62,
    textAlign: 'center',
    marginTop: 6,
    fontSize: 10,
    fontWeight: '600',
  },

  dataRecente: {
    color: CORES.apagado,
    fontSize: 9,
    marginTop: 2,
  },

  posterVazio: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CORES.cardClaro,
  },

  semRecentes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginHorizontal: 20,
    paddingVertical: 14,
    paddingHorizontal: 13,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.025)',
    borderWidth: 1,
    borderColor: CORES.borda,
  },

  semRecentesTexto: {
    color: CORES.secundario,
    fontSize: 11,
  },

  carregandoRecentes: {
    marginVertical: 20,
  },

  atalhos: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 24,
  },

  atalho: {
    flex: 1,
    minHeight: 91,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    paddingVertical: 12,
  },

  textoAtalho: {
    fontSize: 11,
    fontWeight: '800',
  },

  itemPopular: {
    minHeight: 86,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 9,
    padding: 10,
    gap: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.025)',
    borderWidth: 1,
    borderColor: CORES.borda,
  },

  posterPopular: {
    width: 48,
    height: 66,
    borderRadius: 7,
    backgroundColor: CORES.cardClaro,
  },

  infoPopular: {
    flex: 1,
    justifyContent: 'center',
  },

  tituloPopular: {
    color: CORES.branco,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },

  metaPopular: {
    color: CORES.secundario,
    fontSize: 10,
    marginTop: 4,
  },

  notaPopular: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 5,
  },

  textoNotaPopular: {
    color: '#FBBF24',
    fontSize: 10,
    fontWeight: '700',
  },

  etiquetaTipo: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },

  etiquetaFilme: {
    backgroundColor: 'rgba(26,111,255,0.10)',
    borderColor: 'rgba(26,111,255,0.22)',
  },

  etiquetaSerie: {
    backgroundColor: 'rgba(176,107,255,0.10)',
    borderColor: 'rgba(176,107,255,0.22)',
  },

  textoEtiqueta: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  estadoCarregando: {
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },

  estadoTexto: {
    color: CORES.secundario,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },

  estadoTitulo: {
    color: CORES.texto,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },

  estadoVazio: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 25,
    paddingVertical: 30,
    gap: 9,
  },

  botaoTentarNovamente: {
    marginTop: 5,
    paddingVertical: 9,
    paddingHorizontal: 15,
    borderRadius: 9,
    backgroundColor: 'rgba(26,111,255,0.14)',
  },

  textoTentarNovamente: {
    color: CORES.azulClaro,
    fontSize: 11,
    fontWeight: '800',
  },

  areaResultados: {
    paddingBottom: 20,
  },

  itemResultado: {
    minHeight: 100,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 9,
    padding: 10,
    gap: 11,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.025)',
    borderWidth: 1,
    borderColor: CORES.borda,
  },

  posterPequeno: {
    width: 49,
    height: 69,
    borderRadius: 7,
    overflow: 'hidden',
    backgroundColor: CORES.cardClaro,
  },

  imagemPosterPequeno: {
    width: '100%',
    height: '100%',
  },

  infoResultado: {
    flex: 1,
  },

  tituloResultado: {
    color: CORES.branco,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
  },

  metaResultado: {
    color: CORES.azulClaro,
    fontSize: 10,
    marginTop: 4,
    fontWeight: '700',
  },

  sinopseResultado: {
    color: CORES.secundario,
    fontSize: 10,
    lineHeight: 14,
    marginTop: 5,
  },

  listaIntro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 15,
    borderRadius: 15,
    backgroundColor: 'rgba(29,185,84,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(29,185,84,0.18)',
  },

  iconeListaIntro: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(29,185,84,0.12)',
  },

  listaIntroTitulo: {
    color: CORES.branco,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },

  listaIntroTexto: {
    color: CORES.secundario,
    fontSize: 10,
    lineHeight: 15,
  },

  formLista: {
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 16,
    backgroundColor: CORES.card,
    borderWidth: 1,
    borderColor: CORES.borda,
  },

  rotuloCampo: {
    color: CORES.secundario,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.3,
    marginBottom: 9,
  },

  campoLista: {
    minHeight: 47,
    paddingHorizontal: 13,
    borderRadius: 10,
    color: CORES.branco,
    fontSize: 13,
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: CORES.borda,
  },

  campoDescricao: {
    minHeight: 85,
    paddingTop: 12,
  },

  botaoCriarLista: {
    minHeight: 48,
    marginTop: 18,
    borderRadius: 12,
    backgroundColor: '#168B45',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  botaoDesabilitado: {
    opacity: 0.65,
  },

  textoBotaoCriarLista: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },

  cardLista: {
    minHeight: 77,
    marginHorizontal: 20,
    marginBottom: 9,
    padding: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.025)',
    borderWidth: 1,
    borderColor: CORES.borda,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  abrirListaCard: {
    flex: 1,
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  iconeCardLista: {
    width: 43,
    height: 43,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(29,185,84,0.10)',
  },

  nomeCardLista: {
    color: CORES.branco,
    fontSize: 13,
    fontWeight: '800',
  },

  descricaoCardLista: {
    color: CORES.secundario,
    fontSize: 10,
    marginTop: 3,
  },

  quantidadeCardLista: {
    color: CORES.verde,
    fontSize: 9,
    fontWeight: '800',
    marginTop: 4,
  },

  botaoExcluirLista: {
    width: 35,
    height: 35,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(248,113,113,0.08)',
  },

  vazioListas: {
    alignItems: 'center',
    padding: 25,
    gap: 9,
  },

  vazioTitulo: {
    color: CORES.texto,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },

  vazioTexto: {
    color: CORES.secundario,
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 16,
  },

  cabecalhoListaAberta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    marginHorizontal: 20,
    marginBottom: 23,
    padding: 15,
    borderRadius: 15,
    backgroundColor: 'rgba(29,185,84,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(29,185,84,0.18)',
  },

  iconeListaAberta: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(29,185,84,0.12)',
  },

  nomeListaAberta: {
    color: CORES.branco,
    fontSize: 15,
    fontWeight: '900',
  },

  descricaoListaAberta: {
    color: CORES.secundario,
    fontSize: 10,
    marginTop: 4,
  },

  quantidadeListaAberta: {
    color: CORES.verde,
    fontSize: 10,
    fontWeight: '800',
    marginTop: 5,
  },

  blocoAdicionar: {
    marginHorizontal: 20,
    padding: 15,
    borderRadius: 16,
    backgroundColor: CORES.card,
    borderWidth: 1,
    borderColor: CORES.borda,
    marginBottom: 25,
  },

  tituloAdicionar: {
    color: CORES.branco,
    fontSize: 15,
    fontWeight: '900',
  },

  subtituloAdicionar: {
    color: CORES.secundario,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 5,
    marginBottom: 15,
  },

  seletorTipoLista: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },

  botaoTipoListaBusca: {
    flex: 1,
    height: 38,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: CORES.borda,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
  },

  botaoTipoFilmeAtivo: {
    backgroundColor: CORES.azul,
    borderColor: CORES.azul,
  },

  botaoTipoSerieAtivo: {
    backgroundColor: '#8745C9',
    borderColor: '#8745C9',
  },

  textoTipoListaBusca: {
    color: CORES.secundario,
    fontSize: 11,
    fontWeight: '800',
  },

  textoTipoListaBuscaAtivo: {
    color: '#FFFFFF',
  },

  buscaDentroLista: {
    minHeight: 47,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(100,170,255,0.22)',
  },

  inputBuscaLista: {
    flex: 1,
    color: CORES.branco,
    fontSize: 12,
    paddingVertical: 0,
  },

  dicaPesquisa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 12,
  },

  dicaPesquisaTexto: {
    color: CORES.secundario,
    fontSize: 10,
  },

  resultadosDentroLista: {
    marginTop: 17,
  },

  rotuloResultados: {
    color: CORES.apagado,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.1,
    marginBottom: 10,
  },

  resultadoLista: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: CORES.borda,
  },

  infoResultadoLista: {
    flex: 1,
  },

  tipoResultadoLista: {
    fontSize: 9,
    fontWeight: '900',
    marginTop: 5,
    letterSpacing: 0.5,
  },

  botaoAdicionarObra: {
    minHeight: 35,
    paddingHorizontal: 10,
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: CORES.azul,
  },

  textoAdicionarObra: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },

  botaoJaAdicionado: {
    backgroundColor: 'rgba(29,185,84,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(29,185,84,0.24)',
  },

  textoJaAdicionado: {
    color: CORES.verde,
    fontSize: 9,
    fontWeight: '900',
  },

  contadorObras: {
    color: CORES.verde,
    fontSize: 10,
    fontWeight: '900',
  },

  listaSemObras: {
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingVertical: 24,
    gap: 9,
  },

  obraSalva: {
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginHorizontal: 20,
    marginBottom: 9,
    padding: 10,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.025)',
    borderWidth: 1,
    borderColor: CORES.borda,
  },

  posterObraSalva: {
    width: 49,
    height: 69,
    borderRadius: 7,
    backgroundColor: CORES.cardClaro,
  },

  infoObraSalva: {
    flex: 1,
    justifyContent: 'center',
  },

  tituloObraSalva: {
    color: CORES.branco,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
  },

  metaObraSalva: {
    color: CORES.secundario,
    fontSize: 10,
    marginTop: 5,
  },

  tipoObraSalva: {
    fontSize: 9,
    fontWeight: '900',
    marginTop: 5,
  },

  abrirDetalhesHint: {
    color: CORES.apagado,
    fontSize: 7,
    fontWeight: '800',
    marginTop: 5,
    letterSpacing: 0.4,
  },

  botaoRemoverObra: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(248,113,113,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.15)',
  },
});
