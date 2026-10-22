
import React, { useState, useEffect, useRef } from 'react';
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

export default function App() {
  const [telaAtual, setTelaAtual] = useState('HomeLanding');
  const [filmes, setFilmes] = useState([]);
  const [carregandoFilmes, setCarregandoFilmes] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const logoAnim = useRef(new Animated.Value(0.92)).current;
  const cardLeftAnim = useRef(new Animated.Value(24)).current;
  const cardCenterAnim = useRef(new Animated.Value(38)).current;
  const cardRightAnim = useRef(new Animated.Value(24)).current;

  // Carrega os filmes quando a landing page é exibida.
  useEffect(() => {
    if (telaAtual !== 'HomeLanding') return;

    let ativo = true;

    async function buscarFilmes() {
      setCarregandoFilmes(true);

      try {
        const TMDB_KEY = '5c1853c10d9752023da5ddce4ada3b77';

        const resposta = await fetch(
          `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_KEY}&language=pt-BR&page=1`
        );

        if (!resposta.ok) {
          throw new Error('Não foi possível carregar os filmes.');
        }

        const dados = await resposta.json();

        if (ativo && Array.isArray(dados.results)) {
          setFilmes(dados.results.slice(0, 3));
        }
      } catch (erro) {
        console.warn('Erro ao carregar filmes do TMDB:', erro);
        // A tela continua funcionando com os pôsteres locais.
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

  // Reinicia as animações ao voltar para a landing page.
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

  // Navegação.
  if (telaAtual === 'Cadastro') {
    return (
      <TelaCadastro
        onVoltar={() => setTelaAtual('HomeLanding')}
        onEntrar={() => setTelaAtual('Login')}
        onCadastroSucesso={() => setTelaAtual('Generos')}
      />
    );
  }

  if (telaAtual === 'Login') {
    return (
      <TelaLogin
        onVoltar={() => setTelaAtual('HomeLanding')}
        onLoginSucesso={() => setTelaAtual('Home')}
      />
    );
  }

  if (telaAtual === 'Generos') {
    return (
      <EscolhaGeneros
        onContinuar={() => setTelaAtual('Home')}
        onPular={() => setTelaAtual('Home')}
      />
    );
  }

  if (telaAtual === 'Home') {
    return <Home onLogout={() => setTelaAtual('HomeLanding')} />;
  }

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

  const abrirLink = async (url) => {
    try {
      await Linking.openURL(url);
    } catch (erro) {
      console.warn('Não foi possível abrir o link.', erro);
    }
  };

  const renderEstrelas = (quantidade = 5, tamanho = 12) => (
    <View style={styles.estrelas}>
      {Array.from({ length: 5 }, (_, indice) => (
        <Ionicons
          key={indice}
          name={indice < quantidade ? 'star' : 'star-outline'}
          size={tamanho}
          color={indice < quantidade ? CORES.dourado : '#64748B'}
          style={{ marginRight: 2 }}
        />
      ))}
    </View>
  );

  const renderOndaSonora = () => {
    const alturas = [8, 15, 10, 21, 13, 17, 7];

    return (
      <View style={styles.ondaSonora}>
        {alturas.map((altura, indice) => (
          <View
            key={indice}
            style={[styles.barraOnda, { height: altura }]}
          />
        ))}
        <Text style={styles.ondaLegenda}>TRILHA SONORA</Text>
      </View>
    );
  };

  const renderCardFilme = ({ filme, indice, tipo, animacao }) => {
    const central = tipo === 'central';

    return (
      <Animated.View
        style={[
          styles.cardFilme,
          central ? styles.cardCentral : styles.cardLateral,
          tipo === 'esquerda' && styles.cardEsquerdo,
          tipo === 'direita' && styles.cardDireito,
          {
            opacity: animacao.interpolate({
              inputRange: [0, 38],
              outputRange: [1, 0.55],
              extrapolate: 'clamp',
            }),
            transform: [{ translateY: animacao }],
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

          {central && (
            <View style={styles.seloPopular}>
              <Ionicons name="flame" size={14} color="#FFFFFF" />
              <Text style={styles.seloPopularTexto}>EM DESTAQUE</Text>
            </View>
          )}

          <View style={styles.infoFilme}>
            <Text
              numberOfLines={2}
              style={central ? styles.tituloCentral : styles.tituloLateral}
            >
              {obterTitulo(filme, indice)}
            </Text>

            {renderEstrelas(central ? 5 : 4, central ? 13 : 11)}

            {central && renderOndaSonora()}
          </View>
        </ImageBackground>
      </Animated.View>
    );
  };

  const filmesExibidos = [
    filmes[0] || null,
    filmes[1] || null,
    filmes[2] || null,
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={CORES.fundo}
      />

      <View pointerEvents="none" style={styles.fundo} />

      <ScrollView
        contentContainerStyle={styles.conteudo}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* CARROSSEL: permanece visível durante o carregamento */}
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
              <ActivityIndicator size="small" color={CORES.azul} />
              <Text style={styles.carregandoTexto}>
                Atualizando destaques...
              </Text>
            </View>
          )}
        </View>

        {/* IDENTIDADE VISUAL */}
        <Animated.View
          style={[
            styles.secaoMarca,
            {
              opacity: fadeAnim,
              transform: [{ scale: logoAnim }],
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
              CINE<Text style={styles.nomeMarcaAzul}>TRACK</Text>
            </Text>
          </View>

          <Text style={styles.submarca}>
            FILMES  ·  SÉRIES  ·  TRILHAS
          </Text>
        </Animated.View>

        {/* DESCRIÇÃO */}
        <Animated.View
          style={[styles.secaoDescricao, { opacity: fadeAnim }]}
        >
          <Text style={styles.descricao}>
            Seu{' '}
            <Text style={styles.descricaoDestaque}>
              diário audiovisual
            </Text>{' '}
            com a trilha sonora das obras que você ama — tudo em um só lugar.
          </Text>
        </Animated.View>

        {/* RECURSOS */}
        <Animated.View
          style={[styles.recursos, { opacity: fadeAnim }]}
        >
          <View style={styles.etiquetaRecurso}>
            <Ionicons name="videocam" size={16} color={CORES.azulClaro} />
            <Text style={styles.textoRecurso}>Filmes & Séries</Text>
          </View>

          <View style={styles.etiquetaRecurso}>
            <Ionicons name="musical-notes" size={16} color="#38BDF8" />
            <Text style={styles.textoRecurso}>Trilha via Spotify</Text>
          </View>

          <View style={styles.etiquetaRecurso}>
            <Ionicons name="people" size={16} color="#A5B4FC" />
            <Text style={styles.textoRecurso}>Conexões</Text>
          </View>
        </Animated.View>

        {/* AÇÕES PRINCIPAIS */}
        <Animated.View style={[styles.acoes, { opacity: fadeAnim }]}>
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
            <Feather name="arrow-right" size={19} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.divisorSocial}>
            <View style={styles.linhaDivisor} />
            <Text style={styles.textoDivisor}>ou continue com</Text>
            <View style={styles.linhaDivisor} />
          </View>

          <View style={styles.linhaSocial}>
            <TouchableOpacity
              style={styles.botaoSocial}
              activeOpacity={0.8}
              onPress={() => abrirLink('https://www.instagram.com/')}
              accessibilityRole="button"
            >
              <Ionicons name="logo-instagram" size={21} color="#F472B6" />
              <Text style={styles.textoSocial}>Instagram</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botaoSocial}
              activeOpacity={0.8}
              onPress={() => abrirLink('https://x.com/')}
              accessibilityRole="button"
            >
              <Ionicons name="logo-x" size={19} color="#FFFFFF" />
              <Text style={styles.textoSocial}>Twitter / X</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.botaoEntrar}
            activeOpacity={0.8}
            onPress={() => setTelaAtual('Login')}
            accessibilityRole="button"
          >
            <Text style={styles.textoEntrar}>
              Já tenho uma conta —{' '}
              <Text style={styles.textoEntrarDestaque}>Entrar</Text>
            </Text>
          </TouchableOpacity>

          <Text style={styles.termos}>
            Ao criar uma conta, você aceita nossos{' '}
            <Text style={styles.linkTermos}>Termos</Text>
            {' '}e{' '}
            <Text style={styles.linkTermos}>Privacidade</Text>.
          </Text>
        </Animated.View>

        <View style={styles.rodape}>
          <View style={styles.pontoRodape} />
          <Text style={styles.textoRodape}>CINETRACK</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const CARD_LATERAL = Math.min(132, SCREEN_WIDTH * 0.30);
const CARD_CENTRAL = Math.min(190, SCREEN_WIDTH * 0.43);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CORES.fundo,
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
    shadowOffset: { width: 0, height: 12 },
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
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.23,
    shadowRadius: 13,
    elevation: 13,
  },

  cardEsquerdo: {
    marginRight: -3,
    transform: [{ rotate: '-3deg' }],
  },

  cardDireito: {
    marginLeft: -3,
    transform: [{ rotate: '3deg' }],
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

  seloPopular: {
    position: 'absolute',
    top: 12,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#EF4444',
  },

  seloPopularTexto: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.3,
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

  ondaLegenda: {
    marginLeft: 5,
    color: '#91A5C4',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.6,
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
    shadowOffset: { width: 0, height: 7 },
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
