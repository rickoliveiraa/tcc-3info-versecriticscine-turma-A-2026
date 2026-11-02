import React, { useState, useEffect, useRef } from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  StyleSheet,
  Text,
  View,
  Image,
  StatusBar,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ImageBackground,
  Dimensions,
  ActivityIndicator,
  Animated,
  Linking,
  Alert,
} from 'react-native';

import {
  Ionicons,
  Feather,
  MaterialCommunityIcons,
} from '@expo/vector-icons';

import TelaLogin from './teladelogin';
import TelaCadastro from './teladecadastro';
import EscolhaGeneros from './escolhageneros';
import Home from './home';
import Detalhes from './detalhes';
import NovoRegistro from './novoregistro';
import Diario from './diario';
import Perfil from './perfil';

import { sincronizarDadosLocais } from './sincronizacao';

// ============================================================
// CONFIGURAÇÕES
// ============================================================

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CHAVE_SESSAO = '@CineTrack:usuario';
const CHAVE_TOKEN = '@CineTrack:token';

const CORES = {
  fundo: '#050914',
  fundoCard: '#0C1424',
  azul: '#3984FF',
  azulClaro: '#60A5FA',
  branco: '#FFFFFF',
  texto: '#D5DFEF',
  textoSecundario: '#8B9BB3',
  borda: 'rgba(148,163,184,0.16)',
  dourado: '#FBBF24',
};

// ============================================================
// IMAGENS
// ============================================================

const POSTER_FALLBACKS = [
  require('./assets/notebook.jpg'),
  require('./assets/challengers.jpg'),
  require('./assets/panico4.webp'),
];

const LOGO = require('./assets/logo-cinetrack.png');

const TITULOS_FALLBACK = [
  'The Notebook',
  'Challengers',
  'Pânico 4',
];

// ============================================================
// VERIFICAÇÃO DE USUÁRIO
// ============================================================

function usuarioValido(usuario) {
  return (
    usuario &&
    typeof usuario === 'object' &&
    usuario.id !== undefined &&
    usuario.id !== null &&
    String(usuario.id).trim() !== ''
  );
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function App() {
  const [telaAtual, setTelaAtual] = useState('HomeLanding');

  const [usuarioAtual, setUsuarioAtual] = useState(null);

  const [verificandoSessao, setVerificandoSessao] = useState(true);

  const [filmes, setFilmes] = useState([]);

  const [carregandoFilmes, setCarregandoFilmes] = useState(true);

  const [midiaSelecionada, setMidiaSelecionada] = useState(null);

  const [telaAnteriorDetalhes, setTelaAnteriorDetalhes] = useState('Home');

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const logoAnim = useRef(new Animated.Value(0.92)).current;

  const cardLeftAnim = useRef(new Animated.Value(24)).current;

  const cardCenterAnim = useRef(new Animated.Value(38)).current;

  const cardRightAnim = useRef(new Animated.Value(24)).current;

  // ==========================================================
  // NORMALIZAR MÍDIA
  // ==========================================================

  const normalizarMidia = midia => {
    if (
      !midia ||
      midia.id === undefined ||
      midia.id === null ||
      midia.id === ''
    ) {
      return null;
    }

    let tipo = midia.tipo || midia.media_type;

    if (!tipo) {
      tipo =
        midia.name || midia.first_air_date
          ? 'tv'
          : 'movie';
    }

    if (tipo !== 'movie' && tipo !== 'tv') {
      console.warn('Tipo de mídia inválido:', tipo);
      return null;
    }

    return {
      ...midia,
      tipo,
    };
  };

  // ==========================================================
  // SINCRONIZAR DADOS DA CONTA ATIVA
  // ==========================================================

  const sincronizarConta = async contexto => {
    try {
      const resultado = await sincronizarDadosLocais();

      console.log(
        `Sincronização concluída (${contexto}):`,
        resultado
      );

      return resultado;

    } catch (erro) {
      console.warn(
        `Não foi possível sincronizar os dados (${contexto}):`,
        erro?.message || erro
      );

      return null;
    }
  };

  // ==========================================================
  // RECUPERAR SESSÃO
  // ==========================================================

  useEffect(() => {
    let ativo = true;

    async function recuperarSessao() {
      try {
        const [usuarioSalvo, tokenSalvo] =
          await AsyncStorage.multiGet([
            CHAVE_SESSAO,
            CHAVE_TOKEN,
          ]);

        if (!ativo) return;

        const textoUsuario = usuarioSalvo?.[1];
        const token = tokenSalvo?.[1];

        if (!textoUsuario || !token) {
          await AsyncStorage.multiRemove([
            CHAVE_SESSAO,
            CHAVE_TOKEN,
          ]);

          setUsuarioAtual(null);
          setTelaAtual('HomeLanding');

          return;
        }

        let usuario;

        try {
          usuario = JSON.parse(textoUsuario);
        } catch {
          usuario = null;
        }

        /*
         * Uma sessão só é válida para o CineTrack
         * quando contém o ID real do usuário e um token.
         *
         * O userStorage utiliza o ID para separar
         * os dados pessoais de cada conta.
         */

        if (
          !usuarioValido(usuario) ||
          typeof token !== 'string' ||
          token.trim() === ''
        ) {
          await AsyncStorage.multiRemove([
            CHAVE_SESSAO,
            CHAVE_TOKEN,
          ]);

          setUsuarioAtual(null);
          setTelaAtual('HomeLanding');

          return;
        }

        if (!ativo) return;

        setUsuarioAtual(usuario);

        /*
         * RECUPERAÇÃO DOS DADOS:
         * primeiro confirma a sessão;
         * depois busca avaliações e listas no servidor.
         */

        await sincronizarConta('recuperação da sessão');

        if (!ativo) return;

        setTelaAtual('Home');

      } catch (erro) {
        console.warn(
          'Não foi possível recuperar a sessão:',
          erro
        );

        /*
         * Uma falha de rede na sincronização não deve
         * apagar a sessão ou os dados locais.
         *
         * Só limpamos as chaves de autenticação quando
         * a sessão estiver realmente inválida.
         */

        if (ativo) {
          setUsuarioAtual(null);
          setTelaAtual('HomeLanding');
        }

      } finally {
        if (ativo) {
          setVerificandoSessao(false);
        }
      }
    }

    recuperarSessao();

    return () => {
      ativo = false;
    };
  }, []);

  // ==========================================================
  // SALVAR SESSÃO — LOGIN
  // ==========================================================

  const salvarSessao = async usuario => {
    try {
      if (!usuarioValido(usuario)) {
        throw new Error(
          'O servidor não retornou um ID válido para o usuário.'
        );
      }

      const token = await AsyncStorage.getItem(CHAVE_TOKEN);

      if (
        typeof token !== 'string' ||
        token.trim() === ''
      ) {
        throw new Error(
          'Token de autenticação não encontrado. Faça login novamente.'
        );
      }

      /*
       * O teladelogin.js já deve ter armazenado
       * o token da conta autenticada.
       *
       * Salvamos o usuário antes de acessar o userStorage.
       */

      await AsyncStorage.setItem(
        CHAVE_SESSAO,
        JSON.stringify(usuario)
      );

      setUsuarioAtual(usuario);

      setTelaAnteriorDetalhes('Home');

      setMidiaSelecionada(null);

      /*
       * Recupera os dados do servidor usando o token
       * e o ID da conta que acabou de entrar.
       */

      await sincronizarConta('login');

      setTelaAtual('Home');

    } catch (erro) {
      console.error(
        'Erro ao salvar sessão:',
        erro
      );

      Alert.alert(
        'Erro na autenticação',
        erro.message ||
          'Não foi possível iniciar sua sessão.'
      );
    }
  };

  // ==========================================================
  // SALVAR SESSÃO — CADASTRO
  // ==========================================================

  const finalizarCadastro = async usuario => {
    try {
      if (!usuarioValido(usuario)) {
        throw new Error(
          'O cadastro não retornou um ID válido.'
        );
      }

      /*
       * O teladecadastro.js já deve ter gravado
       * o usuário e o token antes de chamar esta função.
       */

      const token = await AsyncStorage.getItem(CHAVE_TOKEN);

      if (
        typeof token !== 'string' ||
        token.trim() === ''
      ) {
        throw new Error(
          'O token da nova conta não foi encontrado. Não foi possível iniciar a sessão.'
        );
      }

      // Confirma a sessão com o ID verdadeiro do usuário.
      await AsyncStorage.setItem(
        CHAVE_SESSAO,
        JSON.stringify(usuario)
      );

      setUsuarioAtual(usuario);

      setMidiaSelecionada(null);

      setTelaAnteriorDetalhes('Home');

      /*
       * A conta recém-criada passa pela sincronização
       * usando seu próprio token.
       */

      await sincronizarConta('cadastro');

      // Depois da sessão, abre a escolha de gêneros.
      setTelaAtual('Generos');

    } catch (erro) {
      console.error(
        'Erro ao finalizar cadastro:',
        erro
      );

      Alert.alert(
        'Erro ao iniciar sua conta',
        erro.message ||
          'Não foi possível iniciar a sessão da nova conta.'
      );
    }
  };

  // ==========================================================
  // ENCERRAR SESSÃO
  // ==========================================================

  const encerrarSessao = async () => {
    try {
      /*
       * Remove somente as credenciais da sessão.
       *
       * As avaliações, listas e registros locais
       * permanecem armazenados nas chaves individuais
       * de cada conta dentro do userStorage.js.
       */

      await AsyncStorage.multiRemove([
        CHAVE_SESSAO,
        CHAVE_TOKEN,
      ]);

    } catch (erro) {
      console.warn(
        'Erro ao encerrar sessão:',
        erro
      );

      Alert.alert(
        'Aviso',
        'Não foi possível limpar completamente a sessão local.'
      );

    } finally {
      setUsuarioAtual(null);

      setMidiaSelecionada(null);

      setTelaAnteriorDetalhes('Home');

      setTelaAtual('HomeLanding');
    }
  };

  // ==========================================================
  // ABRIR DIÁRIO
  // ==========================================================

  const abrirDiario = () => {
    setTelaAtual('Diario');
  };

  // ==========================================================
  // ABRIR DETALHES
  // ==========================================================

  const abrirDetalhes = (
    midia,
    telaDeOrigem = 'Home'
  ) => {
    const midiaNormalizada = normalizarMidia(midia);

    if (!midiaNormalizada) {
      console.warn(
        'Não foi possível abrir os detalhes. Mídia inválida:',
        midia
      );

      return;
    }

    const origensPermitidas = [
      'NovoRegistro',
      'Diario',
      'Perfil',
    ];

    const origem = origensPermitidas.includes(telaDeOrigem)
      ? telaDeOrigem
      : 'Home';

    setMidiaSelecionada(midiaNormalizada);

    setTelaAnteriorDetalhes(origem);

    setTelaAtual('Detalhes');
  };

  // ==========================================================
  // VOLTAR DOS DETALHES
  // ==========================================================

  const voltarDaTelaDetalhes = () => {
    const telaDestino = telaAnteriorDetalhes || 'Home';

    setMidiaSelecionada(null);

    setTelaAtual(telaDestino);
  };

  // ==========================================================
  // CARREGAR FILMES DA TELA INICIAL
  // ==========================================================

  useEffect(() => {
    if (telaAtual !== 'HomeLanding') return;

    let ativo = true;

    async function buscarFilmes() {
      setCarregandoFilmes(true);

      try {
        const TMDB_KEY =
          '5c1853c10d9752023da5ddce4ada3b77';

        const resposta = await fetch(
          `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_KEY}&language=pt-BR&page=1`
        );

        if (!resposta.ok) {
          throw new Error(
            'Não foi possível carregar os filmes.'
          );
        }

        const dados = await resposta.json();

        if (ativo && Array.isArray(dados.results)) {
          setFilmes(dados.results.slice(0, 3));
        }

      } catch (erro) {
        console.warn(
          'Erro ao carregar filmes do TMDB:',
          erro
        );

      } finally {
        if (ativo) {
          setCarregandoFilmes(false);
        }
      }
    }

    buscarFilmes();

    return () => {
      ativo = false;
    };
  }, [telaAtual]);

  // ==========================================================
  // ANIMAÇÕES DA TELA INICIAL
  // ==========================================================

  useEffect(() => {
    if (telaAtual !== 'HomeLanding') return;

    fadeAnim.setValue(0);

    logoAnim.setValue(0.92);

    cardLeftAnim.setValue(24);

    cardCenterAnim.setValue(38);

    cardRightAnim.setValue(24);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 650,
        useNativeDriver: true,
      }),

      Animated.spring(logoAnim, {
        toValue: 1,
        friction: 7,
        tension: 45,
        useNativeDriver: true,
      }),

      Animated.spring(cardLeftAnim, {
        toValue: 0,
        friction: 8,
        tension: 42,
        useNativeDriver: true,
      }),

      Animated.spring(cardCenterAnim, {
        toValue: 0,
        friction: 7,
        tension: 38,
        useNativeDriver: true,
      }),

      Animated.spring(cardRightAnim, {
        toValue: 0,
        friction: 8,
        tension: 42,
        useNativeDriver: true,
      }),
    ]).start();

  }, [
    telaAtual,
    fadeAnim,
    logoAnim,
    cardLeftAnim,
    cardCenterAnim,
    cardRightAnim,
  ]);

  // ==========================================================
  // CARREGAMENTO DA SESSÃO
  // ==========================================================

  if (verificandoSessao) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          styles.telaCarregamento,
        ]}
      >
        <StatusBar
          barStyle="light-content"
          backgroundColor={CORES.fundo}
        />

        <Image
          source={LOGO}
          style={styles.logoCarregamento}
          resizeMode="contain"
        />

        <ActivityIndicator
          size="large"
          color={CORES.azul}
        />

        <Text style={styles.textoCarregamentoSessao}>
          Preparando seu CineTrack...
        </Text>
      </SafeAreaView>
    );
  }

  // ==========================================================
  // CADASTRO
  // ==========================================================

  if (telaAtual === 'Cadastro') {
    return (
      <TelaCadastro
        onVoltar={() => setTelaAtual('HomeLanding')}
        onEntrar={() => setTelaAtual('Login')}
        onCadastroSucesso={finalizarCadastro}
      />
    );
  }

  // ==========================================================
  // LOGIN
  // ==========================================================

  if (telaAtual === 'Login') {
    return (
      <TelaLogin
        onVoltar={() => setTelaAtual('HomeLanding')}
        onLoginSucesso={salvarSessao}
      />
    );
  }

  // ==========================================================
  // ESCOLHA DE GÊNEROS
  // ==========================================================

  if (telaAtual === 'Generos') {
    return (
      <EscolhaGeneros
        onContinuar={() => setTelaAtual('Home')}
        onPular={() => setTelaAtual('Home')}
      />
    );
  }

  // ==========================================================
  // DETALHES DE FILMES E SÉRIES
  // ==========================================================

  if (
    telaAtual === 'Detalhes' &&
    midiaSelecionada
  ) {
    return (
      <Detalhes
        usuario={usuarioAtual}
        midia={midiaSelecionada}
        onVoltar={voltarDaTelaDetalhes}
      />
    );
  }

  // ==========================================================
  // NOVO REGISTRO
  // ==========================================================

  if (telaAtual === 'NovoRegistro') {
    return (
      <NovoRegistro
        usuario={usuarioAtual}
        onVoltar={() => {
          setTelaAtual('Home');
        }}
        onAbrirDetalhes={midia => {
          abrirDetalhes(midia, 'NovoRegistro');
        }}
      />
    );
  }

  // ==========================================================
  // DIÁRIO
  // ==========================================================

  if (telaAtual === 'Diario') {
    return (
      <Diario
        usuario={usuarioAtual}
        atividadesAmigos={[]}
        onAbrirHome={() => {
          setTelaAtual('Home');
        }}
        onVoltar={() => {
          setTelaAtual('Home');
        }}
        onAdicionar={() => {
          setTelaAtual('NovoRegistro');
        }}
        onAbrirDetalhes={midia => {
          abrirDetalhes(midia, 'Diario');
        }}
      />
    );
  }

  // ==========================================================
  // PERFIL
  // ==========================================================

  if (telaAtual === 'Perfil') {
    return (
      <Perfil
        usuario={usuarioAtual}
        onVoltar={() => setTelaAtual('Home')}
        onAbrirHome={() => setTelaAtual('Home')}
        onAbrirDiario={() => setTelaAtual('Diario')}
        onAdicionar={() => setTelaAtual('NovoRegistro')}
        onAbrirDetalhes={midia => {
          abrirDetalhes(midia, 'Perfil');
        }}
        onLogout={encerrarSessao}
      />
    );
  }

  // ==========================================================
  // HOME
  // ==========================================================

  if (telaAtual === 'Home') {
    return (
      <Home
        usuario={usuarioAtual}
        onLogout={encerrarSessao}
        onAbrirDetalhes={midia => {
          abrirDetalhes(midia, 'Home');
        }}
        onAdicionar={() => {
          setTelaAtual('NovoRegistro');
        }}
        onAbrirDiario={abrirDiario}
        onAbrirPerfil={() => setTelaAtual('Perfil')}
      />
    );
  }

  // ==========================================================
  // FUNÇÕES DA LANDING PAGE
  // ==========================================================

  const obterPoster = (filme, indice) => {
    if (filme?.poster_path) {
      return {
        uri: `https://image.tmdb.org/t/p/w500${filme.poster_path}`,
      };
    }

    return POSTER_FALLBACKS[indice];
  };

  const obterTitulo = (filme, indice) => {
    if (filme?.title) return filme.title;

    if (filme?.name) return filme.name;

    return TITULOS_FALLBACK[indice];
  };

  const abrirLink = async url => {
    try {
      await Linking.openURL(url);
    } catch (erro) {
      console.warn(
        'Não foi possível abrir o link:',
        erro
      );
    }
  };

  // ==========================================================
  // ESTRELAS
  // ==========================================================

  const renderEstrelas = (
    quantidade = 5,
    tamanho = 12
  ) => (
    <View style={styles.estrelas}>
      {Array.from({ length: 5 }, (_, indice) => (
        <Ionicons
          key={indice}
          name={
            indice < quantidade
              ? 'star'
              : 'star-outline'
          }
          size={tamanho}
          color={
            indice < quantidade
              ? CORES.dourado
              : '#64748B'
          }
          style={{ marginRight: 2 }}
        />
      ))}
    </View>
  );

  // ==========================================================
  // ONDA SONORA
  // ==========================================================

  const renderOndaSonora = () => {
    const alturas = [8, 15, 10, 21, 13, 17, 7];

    return (
      <View style={styles.ondaSonora}>
        {alturas.map((altura, indice) => (
          <View
            key={indice}
            style={[
              styles.barraOnda,
              { height: altura },
            ]}
          />
        ))}
      </View>
    );
  };

  // ==========================================================
  // CARD DE FILME
  // ==========================================================

  const renderCardFilme = ({
    filme,
    indice,
    tipo,
    animacao,
  }) => {
    const central = tipo === 'central';

    const rotacao =
      tipo === 'esquerda'
        ? [{ rotate: '-3deg' }]
        : tipo === 'direita'
          ? [{ rotate: '3deg' }]
          : [];

    return (
      <Animated.View
        style={[
          styles.cardFilme,
          central
            ? styles.cardCentral
            : styles.cardLateral,
          tipo === 'esquerda' &&
            styles.cardEsquerdo,
          tipo === 'direita' &&
            styles.cardDireito,
          {
            opacity: animacao.interpolate({
              inputRange: [0, 38],
              outputRange: [1, 0.55],
              extrapolate: 'clamp',
            }),
            transform: [
              ...rotacao,
              { translateY: animacao },
            ],
          },
        ]}
      >
        <ImageBackground
          source={obterPoster(filme, indice)}
          style={styles.poster}
          resizeMode="cover"
          imageStyle={styles.posterImagem}
        >
          <View style={styles.posterSombra} />

          <View style={styles.infoFilme}>
            <Text
              numberOfLines={2}
              style={
                central
                  ? styles.tituloCentral
                  : styles.tituloLateral
              }
            >
              {obterTitulo(filme, indice)}
            </Text>

            {renderEstrelas(
              central ? 5 : 4,
              central ? 13 : 11
            )}

            {central && renderOndaSonora()}
          </View>
        </ImageBackground>
      </Animated.View>
    );
  };

  // ==========================================================
  // FILMES EXIBIDOS
  // ==========================================================

  const filmesExibidos = [
    filmes[0] || null,
    filmes[1] || null,
    filmes[2] || null,
  ];

  // ==========================================================
  // TELA INICIAL
  // ==========================================================

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={CORES.fundo}
      />

      <View style={styles.fundo} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.conteudo}
      >
        <View style={styles.secaoDestaques}>
          <View style={styles.carrossel}>
            {renderCardFilme({
              filme: filmesExibidos[0],
              indice: 0,
              tipo: 'esquerda',
              animacao: cardLeftAnim,
            })}

            {renderCardFilme({
              filme: filmesExibidos[1],
              indice: 1,
              tipo: 'central',
              animacao: cardCenterAnim,
            })}

            {renderCardFilme({
              filme: filmesExibidos[2],
              indice: 2,
              tipo: 'direita',
              animacao: cardRightAnim,
            })}
          </View>

          {carregandoFilmes && (
            <View style={styles.statusCarregamento}>
              <ActivityIndicator
                size="small"
                color={CORES.azul}
              />

              <Text style={styles.carregandoTexto}>
                Atualizando destaques...
              </Text>
            </View>
          )}
        </View>

        <Animated.View
          style={[
            styles.secaoMarca,
            {
              opacity: fadeAnim,
              transform: [
                { scale: logoAnim },
              ],
            },
          ]}
        >
          <View style={styles.marcaLinha}>
            <Image
              source={LOGO}
              style={styles.logoImagem}
              resizeMode="contain"
              accessibilityLabel="Logo CineTrack"
            />

            <Text style={styles.nomeMarca}>
              CINE
              <Text style={styles.nomeMarcaAzul}>
                TRACK
              </Text>
            </Text>
          </View>

          <Text style={styles.submarca}>
            FILMES · SÉRIES · TRILHAS
          </Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.secaoDescricao,
            { opacity: fadeAnim },
          ]}
        >
          <Text style={styles.descricao}>
            Seu{' '}
            <Text style={styles.descricaoDestaque}>
              diário audiovisual
            </Text>{' '}
            com a trilha sonora das obras que você ama
            — tudo em um só lugar.
          </Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.recursos,
            { opacity: fadeAnim },
          ]}
        >
          <View style={styles.etiquetaRecurso}>
            <Ionicons
              name="videocam"
              size={16}
              color={CORES.azulClaro}
            />

            <Text style={styles.textoRecurso}>
              Filmes & Séries
            </Text>
          </View>

          <View style={styles.etiquetaRecurso}>
            <Ionicons
              name="musical-notes"
              size={16}
              color="#38BDF8"
            />

            <Text style={styles.textoRecurso}>
              Trilha via Spotify
            </Text>
          </View>

          <View style={styles.etiquetaRecurso}>
            <Ionicons
              name="people"
              size={16}
              color="#A5B4FC"
            />

            <Text style={styles.textoRecurso}>
              Conexões
            </Text>
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.acoes,
            { opacity: fadeAnim },
          ]}
        >
          <TouchableOpacity
            style={styles.botaoCadastro}
            activeOpacity={0.82}
            onPress={() => setTelaAtual('Cadastro')}
            accessibilityRole="button"
          >
            <MaterialCommunityIcons
              name="account-plus"
              size={22}
              color="#FFFFFF"
            />

            <Text style={styles.textoBotaoCadastro}>
              Criar conta gratuita
            </Text>

            <Feather
              name="arrow-right"
              size={19}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <View style={styles.divisorSocial}>
            <View style={styles.linhaDivisor} />

            <Text style={styles.textoDivisor}>
              ou continue com
            </Text>

            <View style={styles.linhaDivisor} />
          </View>

          <View style={styles.linhaSocial}>
            <TouchableOpacity
              style={styles.botaoSocial}
              activeOpacity={0.8}
              onPress={() =>
                abrirLink('https://www.instagram.com/')
              }
            >
              <Ionicons
                name="logo-instagram"
                size={21}
                color="#F472B6"
              />

              <Text style={styles.textoSocial}>
                Instagram
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botaoSocial}
              activeOpacity={0.8}
              onPress={() =>
                abrirLink('https://x.com/')
              }
            >
              <Ionicons
                name="logo-x"
                size={19}
                color="#FFFFFF"
              />

              <Text style={styles.textoSocial}>
                Twitter / X
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.botaoEntrar}
            activeOpacity={0.8}
            onPress={() => setTelaAtual('Login')}
          >
            <Text style={styles.textoEntrar}>
              Já tenho uma conta —{' '}
              <Text style={styles.textoEntrarDestaque}>
                Entrar
              </Text>
            </Text>
          </TouchableOpacity>

          <Text style={styles.termos}>
            Ao criar uma conta, você aceita nossos{' '}
            <Text style={styles.linkTermos}>
              Termos
            </Text>{' '}
            e{' '}
            <Text style={styles.linkTermos}>
              Privacidade
            </Text>.
          </Text>
        </Animated.View>

        <View style={styles.rodape}>
          <View style={styles.pontoRodape} />

          <Text style={styles.textoRodape}>
            CINETRACK
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================
// DIMENSÕES DOS CARDS
// ============================================================

const CARD_LATERAL = Math.min(
  132,
  SCREEN_WIDTH * 0.30
);

const CARD_CENTRAL = Math.min(
  190,
  SCREEN_WIDTH * 0.43
);

// ============================================================
// ESTILOS
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CORES.fundo,
  },

  telaCarregamento: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 18,
  },

  logoCarregamento: {
    width: 105,
    height: 105,
  },

  textoCarregamentoSessao: {
    color: CORES.textoSecundario,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  fundo: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: CORES.fundo,
  },

  conteudo: {
    flexGrow: 1,
    paddingBottom: 28,
  },

  secaoDestaques: {
    height: 320,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 12,
  },

  carrossel: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },

  statusCarregamento: {
    position: 'absolute',
    bottom: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  carregandoTexto: {
    color: CORES.textoSecundario,
    fontSize: 12,
  },

  cardFilme: {
    overflow: 'hidden',
    borderRadius: 20,
    backgroundColor: CORES.fundoCard,
    borderWidth: 1,
    borderColor: CORES.borda,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.34,
    shadowRadius: 14,
    elevation: 9,
  },

  cardLateral: {
    width: CARD_LATERAL,
    height: 192,
    opacity: 0.86,
  },

  cardCentral: {
    width: CARD_CENTRAL,
    height: 260,
    marginHorizontal: -1,
    zIndex: 3,
    borderWidth: 2,
    borderColor: CORES.azul,
    shadowColor: CORES.azul,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.23,
    shadowRadius: 13,
    elevation: 13,
  },

  cardEsquerdo: {
    marginRight: -3,
  },

  cardDireito: {
    marginLeft: -3,
  },

  poster: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  },

  posterImagem: {
    borderRadius: 18,
  },

  posterSombra: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.39)',
  },

  infoFilme: {
    paddingHorizontal: 10,
    paddingBottom: 13,
    paddingTop: 22,
  },

  tituloLateral: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
    marginBottom: 6,
  },

  tituloCentral: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 19,
    marginBottom: 7,
  },

  estrelas: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  ondaSonora: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 27,
    gap: 3,
    marginTop: 8,
  },

  barraOnda: {
    width: 3,
    borderRadius: 3,
    backgroundColor: CORES.azul,
  },

  secaoMarca: {
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 8,
    paddingHorizontal: 12,
  },

  marcaLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },

  logoImagem: {
    width: 90,
    height: 90,
    backgroundColor: 'transparent',
  },

  nomeMarca: {
    color: '#FFFFFF',
    fontSize: Math.min(31, SCREEN_WIDTH * 0.075),
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  nomeMarcaAzul: {
    color: CORES.azul,
  },

  submarca: {
    marginTop: 8,
    color: '#7787A0',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 3,
  },

  secaoDescricao: {
    paddingHorizontal: 24,
    marginTop: 22,
  },

  descricao: {
    color: '#A8B6CB',
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
  },

  descricaoDestaque: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  recursos: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 14,
    marginTop: 23,
  },

  etiquetaRecurso: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    minHeight: 39,
    paddingHorizontal: 13,
    borderRadius: 22,
    backgroundColor: '#101827',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.13)',
  },

  textoRecurso: {
    color: '#DCE5F3',
    fontSize: 12,
    fontWeight: '700',
  },

  acoes: {
    width: '100%',
    alignItems: 'center',
    marginTop: 26,
    paddingHorizontal: 20,
  },

  botaoCadastro: {
    width: '100%',
    minHeight: 56,
    borderRadius: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: CORES.azul,
    borderWidth: 1,
    borderColor: 'rgba(147,197,253,0.40)',
    shadowColor: CORES.azul,
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 7,
  },

  textoBotaoCadastro: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },

  divisorSocial: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 24,
    marginBottom: 15,
  },

  linhaDivisor: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(148,163,184,0.15)',
  },

  textoDivisor: {
    color: '#7888A1',
    fontSize: 12,
    fontWeight: '600',
  },

  linhaSocial: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
  },

  botaoSocial: {
    flex: 1,
    minHeight: 49,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 15,
    backgroundColor: '#101827',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.15)',
  },

  textoSocial: {
    color: '#F1F5F9',
    fontSize: 14,
    fontWeight: '800',
  },

  botaoEntrar: {
    width: '100%',
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 13,
    borderRadius: 15,
    backgroundColor: '#0D1524',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.14)',
  },

  textoEntrar: {
    color: '#A6B4C9',
    fontSize: 14,
    fontWeight: '600',
  },

  textoEntrarDestaque: {
    color: '#FFFFFF',
    fontWeight: '900',
  },

  termos: {
    color: '#77869D',
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 18,
    marginTop: 18,
    paddingHorizontal: 8,
  },

  linkTermos: {
    color: '#93C5FD',
    fontWeight: '800',
  },

  rodape: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 23,
    paddingBottom: 8,
  },

  pontoRodape: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: CORES.azul,
  },

  textoRodape: {
    color: '#53647D',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
});