import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, Text, View, Image, StatusBar, TouchableOpacity, 
  SafeAreaView, ScrollView, ImageBackground, Platform, Dimensions, ActivityIndicator,
  Animated, Easing, Linking
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import TelaLogin from './teladelogin';
import TelaCadastro from './teladecadastro';
import RecuperarConta from './recuperarconta'; 
import EscolhaGeneros from './escolhageneros';
import Home from './home';

const { width, height } = Dimensions.get('window');

const FALLBACK_POSTERS = [
  require('./assets/notebook.jpg'),
  require('./assets/challengers.jpg'),
  require('./assets/panico4.webp')
];

export default function App() {
  const [telaAtual, setTelaAtual] = useState('HomeLanding');
  const [topMovies, setTopMovies] = useState([]);
  const [loadingMovies, setLoadingMovies] = useState(true);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const card1Y = useRef(new Animated.Value(0)).current;
  const card2Y = useRef(new Animated.Value(0)).current;
  const card3Y = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const logoScaleAnim = useRef(new Animated.Value(0.9)).current;
  const logoGlowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    async function fetchTopMovies() {
      try {
        const TMDB_KEY = '5c1853c10d9752023da5ddce4ada3b77';
        const response = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_KEY}&language=pt-BR&page=1`);
        const data = await response.json();
        
        if (data.results && data.results.length >= 3) {
          setTopMovies(data.results.slice(0, 3));
        } else {
          setTopMovies(null);
        }
      } catch (error) {
        console.error("Erro ao buscar filmes populares:", error);
        setTopMovies(null);
      } finally {
        setLoadingMovies(false);
      }
    }

    if (telaAtual === 'HomeLanding') {
      fetchTopMovies();
    }
  }, [telaAtual]);

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.spring(card1Y, { toValue: 1, friction: 9, tension: 40, useNativeDriver: true }),
        Animated.spring(card2Y, { toValue: 1, friction: 9, tension: 40, useNativeDriver: true }),
        Animated.spring(card3Y, { toValue: 1, friction: 9, tension: 40, useNativeDriver: true }),
      ]),
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: 1,
            duration: 4000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: -1,
            duration: 4000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(logoGlowAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(logoGlowAnim, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();
  }, []);

  if (telaAtual === 'Cadastro') return <TelaCadastro onVoltar={() => setTelaAtual('HomeLanding')} onCadastroSucesso={() => setTelaAtual('Generos')} />;
  if (telaAtual === 'Login') return <TelaLogin onVoltar={() => setTelaAtual('HomeLanding')} onLoginSucesso={() => setTelaAtual('Home')} />;
  if (telaAtual === 'Recuperar') return <RecuperarConta onVoltar={() => setTelaAtual('HomeLanding')} />;
  if (telaAtual === 'Generos') return <EscolhaGeneros onContinuar={() => setTelaAtual('Home')} onPular={() => setTelaAtual('Home')} />;
  if (telaAtual === 'Home') return <Home onLogout={() => setTelaAtual('HomeLanding')} />;

  const cardLeft = topMovies ? topMovies[0] : null;
  const cardCenter = topMovies ? topMovies[1] : null;
  const cardRight = topMovies ? topMovies[2] : null;

  const getPosterSource = (movieObj, fallbackIndex) => {
    if (movieObj && movieObj.poster_path) return { uri: `https://image.tmdb.org/t/p/w500${movieObj.poster_path}` };
    return FALLBACK_POSTERS[fallbackIndex];
  };

  const getTitle = (movieObj, fallbackTitles) => movieObj ? (movieObj.title || movieObj.original_title) : fallbackTitles;

  const floatY = floatAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-6, 6],
  });

  const abrirInstagram = async () => {
    const instagramUrl = 'https://www.instagram.com/cinetrack';
    try {
      await Linking.openURL(instagramUrl);
    } catch (error) {
      console.error('Erro ao abrir Instagram:', error);
    }
  };

  const abrirTwitter = async () => {
    const twitterUrl = 'https://twitter.com/cinetrack';
    try {
      await Linking.openURL(twitterUrl);
    } catch (error) {
      console.error('Erro ao abrir Twitter:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#020617" translucent={Platform.OS === 'android'} />
      
      <View style={styles.cinemaBackground}>
        <View style={styles.projectorLightLeft} />
        <View style={styles.projectorLightRight} />
        <View style={styles.vignetteOverlay} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        
        <View style={styles.heroSection}>
          {loadingMovies ? (
            <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 80 }} />
          ) : (
            <Animated.View style={[styles.floatCards, { opacity: fadeAnim }]}>
              
              <Animated.View 
                style={[
                  styles.fcard, 
                  styles.fcardSideLeft,
                  {
                    transform: [
                      { translateY: card1Y.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) },
                      { translateY: floatY },
                    ]
                  }
                ]}
              >
                <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: '#1e3a8a' }} />
                <ImageBackground source={getPosterSource(cardLeft, 0)} style={styles.posterBg} resizeMode="cover">
                  <View style={styles.cardGradient} />
                  <View style={styles.cardInternalBottom}>
                    <Text numberOfLines={1} style={styles.cardTitle}>{getTitle(cardLeft, 'Diário de uma Paixão')}</Text>
                    <View style={styles.cardStars}>
                      {[1, 2, 3, 4, 5].map((s) => <Ionicons key={s} name="star" size={9} color="#fbbf24" style={{marginRight: 2}} />)}
                    </View>
                  </View>
                </ImageBackground>
              </Animated.View>

              <Animated.View 
                style={[
                  styles.fcard, 
                  styles.fcardCenter,
                  {
                    transform: [
                      { translateY: card2Y.interpolate({ inputRange: [0, 1], outputRange: [60, 0] }) },
                      { translateY: floatY },
                    ]
                  }
                ]}
              >
                <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: '#1d4ed8' }} />
                <ImageBackground source={getPosterSource(cardCenter, 1)} style={styles.posterBg} resizeMode="cover">
                  <View style={styles.cardGradient} />
                  <View style={styles.cardInternalBottom}>
                    <Text numberOfLines={1} style={[styles.cardTitle, { fontSize: 13 }]}>
                      {getTitle(cardCenter, 'Challengers')}
                    </Text>
                    <View style={styles.centerStarsRow}>
                      <View style={styles.cardStars}>
                        {[1, 2, 3, 4, 5].map((s) => <Ionicons key={s} name="star" size={10} color="#fbbf24" style={{marginRight: 2}} />)}
                      </View>
                      <View style={styles.miniAudioWave}>
                        <View style={[styles.miniWaveLine, { height: 4 }]} />
                        <View style={[styles.miniWaveLine, { height: 10 }]} />
                        <View style={[styles.miniWaveLine, { height: 6 }]} />
                        <View style={[styles.miniWaveLine, { height: 12 }]} />
                        <View style={[styles.miniWaveLine, { height: 5 }]} />
                      </View>
                    </View>
                  </View>
                </ImageBackground>
              </Animated.View>

              <Animated.View 
                style={[
                  styles.fcard, 
                  styles.fcardSideRight,
                  {
                    transform: [
                      { translateY: card3Y.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) },
                      { translateY: floatY },
                    ]
                  }
                ]}
              >
                <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: '#0f172a' }} />
                <ImageBackground source={getPosterSource(cardRight, 2)} style={styles.posterBg} resizeMode="cover">
                  <View style={styles.cardGradient} />
                  <View style={styles.cardInternalBottom}>
                    <Text numberOfLines={1} style={styles.cardTitle}>{getTitle(cardRight, 'Pânico VI')}</Text>
                    <View style={styles.cardStars}>
                      {[1, 2, 3, 4].map((s) => <Ionicons key={s} name="star" size={9} color="#fbbf24" style={{marginRight: 2}} />)}
                      <Ionicons name="star" size={9} color="#334155" />
                    </View>
                  </View>
                </ImageBackground>
              </Animated.View>

            </Animated.View>
          )}
        </View>

        <Animated.View style={[styles.mainContent, { opacity: fadeAnim }]}>
          
          {/* LOGO PREMIUM COM EFEITO GLOW */}
          <View style={styles.logoContainer}>
            {/* Glow animado externo */}
            <Animated.View 
              style={[
                styles.logoGlowOuter,
                { 
                  opacity: logoGlowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.8] }),
                  transform: [{ scale: logoGlowAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] }) }]
                }
              ]}
            />
            
            {/* Container principal com gradiente */}
            <Animated.View 
              style={[
                styles.logoCircle,
                { transform: [{ scale: logoScaleAnim }] }
              ]}
            >
              <LinearGradient
                colors={['#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoGradientBg}
              >
                {/* Caixa interna menor para esconder fundo preto */}
                <View style={styles.logoInnerBox}>
                  <Image 
                    source={require('./assets/logo.png')} 
                    style={styles.logoReal}
                    resizeMode="contain"
                  />
                </View>
              </LinearGradient>
            </Animated.View>
            
            <Text style={styles.logoText}>CINE<Text style={styles.logoBlueText}>TRACK</Text></Text>
          </View>
          
          <Text style={styles.logoSubtext}>FILMES · SÉRIES · TRILHAS</Text>

          <Text style={styles.descriptionText}>
            Seu <Text style={styles.boldWhiteText}>diário audiovisual</Text> definitivo. Registre o que assiste, descubra trilhas sonoras e conecte-se com amigos — tudo em um só lugar.
          </Text>

          <View style={styles.pillsContainer}>
            <View style={styles.pillItem}>
              <Ionicons name="videocam-outline" size={12} color="#60a5fa" style={{ marginRight: 6 }} />
              <Text style={styles.pillText}>Filmes & Séries</Text>
            </View>
            <View style={styles.pillItem}>
              <Ionicons name="musical-notes-outline" size={12} color="#38bdf8" style={{ marginRight: 6 }} />
              <Text style={styles.pillText}>Trilhas Sonoras</Text>
            </View>
            <View style={styles.pillItem}>
              <Ionicons name="people-outline" size={12} color="#818cf8" style={{ marginRight: 6 }} />
              <Text style={styles.pillText}>Conexões</Text>
            </View>
          </View>

          <View style={styles.actionContainer}>
            
            <TouchableOpacity style={styles.btnRegister} activeOpacity={0.85} onPress={() => setTelaAtual('Cadastro')}>
              <Text style={styles.btnRegisterText}>Criar conta gratuita</Text>
              <Feather name="arrow-right" size={18} color="#ffffff" style={{ marginLeft: 8 }} />
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.orText}>ou continue com</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialButtonsRow}>
              <TouchableOpacity 
                style={styles.btnSocial} 
                activeOpacity={0.8}
                onPress={abrirInstagram}
              >
                <Ionicons name="logo-instagram" size={22} color="#E1306C" />
                <Text style={styles.btnSocialText}>Instagram</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.btnSocial} 
                activeOpacity={0.8}
                onPress={abrirTwitter}
              >
                <Ionicons name="logo-x" size={16} color="#ffffff" />
                <Text style={styles.btnSocialText}>Twitter / X</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.btnLoginContainer} activeOpacity={0.8} onPress={() => setTelaAtual('Login')}>
              <Text style={styles.btnLoginText}>
                Já tem uma conta? <Text style={{ color: '#ffffff', fontWeight: '700' }}>Entrar</Text>
              </Text>
            </TouchableOpacity>

            <Text style={styles.finePrint}>
              Ao continuar, você aceita nossos <Text style={styles.linkText}>Termos de Uso</Text> e <Text style={styles.linkText}>Política de Privacidade</Text>.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  
  cinemaBackground: { ...StyleSheet.absoluteFillObject, backgroundColor: '#020617', overflow: 'hidden' },
  projectorLightLeft: {
    position: 'absolute', top: -120, left: -80, width: 350, height: 500,
    backgroundColor: 'rgba(37, 99, 235, 0.30)',
    transform: [{ rotate: '25deg' }], filter: 'blur(80px)', opacity: 0.9
  },
  projectorLightRight: {
    position: 'absolute', top: 80, right: -100, width: 400, height: 600,
    backgroundColor: 'rgba(14, 165, 233, 0.20)',
    transform: [{ rotate: '-15deg' }], filter: 'blur(90px)', opacity: 0.8
  },
  vignetteOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 6, 23, 0.4)'
  },

  scrollContent: { paddingBottom: 40, flexGrow: 1 },
  
  heroSection: { 
    width: '100%', 
    height: 300, 
    justifyContent: 'center', 
    alignItems: 'center', 
    position: 'relative', 
    marginTop: 5,
    minHeight: 300,
  },
  floatCards: { 
    flexDirection: 'row', 
    alignItems: 'flex-end', 
    justifyContent: 'center', 
    width: '100%', 
    paddingTop: 20,
  },
  
  fcard: { 
    borderRadius: 20, 
    overflow: 'hidden', 
    backgroundColor: '#070b19', 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.15)', 
    shadowColor: '#2563eb', 
    shadowOffset: { width: 0, height: 12 }, 
    shadowOpacity: 0.6, 
    shadowRadius: 16, 
    elevation: 12 
  },
  posterBg: { flex: 1, width: '100%', height: '100%', justifyContent: 'flex-end' },
  cardGradient: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(2,6,23,0.4)' },
  cardInternalBottom: { paddingHorizontal: 10, paddingVertical: 12, zIndex: 2 },
  cardTitle: { 
    fontSize: 11, 
    fontWeight: '800', 
    color: '#ffffff', 
    marginBottom: 5, 
    textShadowColor: '#000', 
    textShadowOffset: {width: 0, height: 1}, 
    textShadowRadius: 3, 
    letterSpacing: 0.3 
  },
  
  centerStarsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 },
  cardStars: { flexDirection: 'row' },
  
  miniAudioWave: { flexDirection: 'row', gap: 2, alignItems: 'flex-end', height: 12 },
  miniWaveLine: { width: 2.5, backgroundColor: '#60a5fa', borderRadius: 1, shadowColor: '#60a5fa', shadowOpacity: 0.8, shadowRadius: 2 },
  
  fcardSideLeft: { width: 100, height: 150, transform: [{ rotate: '-8deg' }, { translateX: 18 }, { translateY: -10 }], opacity: 0.85 },
  fcardSideRight: { width: 100, height: 150, transform: [{ rotate: '8deg' }, { translateX: -18 }, { translateY: -10 }], opacity: 0.85 },
  fcardCenter: { 
    width: 140, 
    height: 210, 
    zIndex: 20, 
    borderColor: 'rgba(59, 130, 246, 0.6)', 
    borderWidth: 2,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.7,
    shadowRadius: 20,
    elevation: 18
  },

  mainContent: { paddingHorizontal: 24, alignItems: 'center', marginTop: 10 },
  
  // LOGO PREMIUM COM GLOW ANIMADO
  logoContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 10,
    marginBottom: 5,
    position: 'relative',
  },
  logoGlowOuter: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 28,
    backgroundColor: 'rgba(96, 165, 250, 0.5)',
    top: -5,
    left: -5,
    zIndex: 0,
    filter: 'blur(15px)',
  },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 24,
    overflow: 'hidden',
    marginRight: 16,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 15,
    zIndex: 1,
  },
  logoGradientBg: {
    width: 90,
    height: 90,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoInnerBox: {
    width: 60,
    height: 60,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoReal: {
    width: 60,
    height: 60,
  },
  logoText: { 
    fontSize: 30, 
    fontWeight: '900', 
    color: '#ffffff', 
    letterSpacing: 2.5,
    textShadowColor: '#3b82f6', 
    textShadowOffset: {width: 0, height: 0}, 
    textShadowRadius: 15 
  },
  logoBlueText: { color: '#60a5fa' },
  logoSubtext: { 
    fontSize: 10, 
    color: '#94a3b8', 
    letterSpacing: 3.5, 
    marginTop: 6, 
    fontWeight: '700',
    textAlign: 'center',
  },
  
  descriptionText: { 
    fontSize: 15, 
    color: '#cbd5e1', 
    textAlign: 'center', 
    lineHeight: 23, 
    marginTop: 18, 
    maxWidth: '95%',
    paddingHorizontal: 5,
  },
  boldWhiteText: { color: '#ffffff', fontWeight: '700' },
  
  pillsContainer: { 
    flexDirection: 'row', 
    gap: 8, 
    justifyContent: 'center', 
    marginTop: 24, 
    flexWrap: 'wrap',
    paddingHorizontal: 10,
  },
  pillItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 7, 
    paddingHorizontal: 12, 
    borderRadius: 28, 
    backgroundColor: 'rgba(255, 255, 255, 0.05)', 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.1)' 
  },
  pillText: { fontSize: 11, color: '#f8fafc', fontWeight: '600' },
  
  actionContainer: { width: '100%', marginTop: 30 },
  
  btnRegister: { 
    width: '100%', 
    height: 56, 
    borderRadius: 16, 
    backgroundColor: '#2563eb',
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    shadowColor: '#2563eb', 
    shadowOffset: { width: 0, height: 8 }, 
    shadowOpacity: 0.6, 
    shadowRadius: 12, 
    elevation: 10 
  },
  btnRegisterText: { color: '#ffffff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
  
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)' },
  orText: { fontSize: 12, color: '#64748b', paddingHorizontal: 12, fontWeight: '600' },
  
  socialButtonsRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  btnSocial: { 
    flex: 1, 
    height: 52, 
    borderRadius: 14, 
    backgroundColor: 'rgba(255, 255, 255, 0.06)', 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.12)', 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  btnSocialText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  
  btnLoginContainer: { 
    width: '100%', 
    height: 52, 
    borderRadius: 14, 
    backgroundColor: 'transparent', 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.15)', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 6 
  },
  btnLoginText: { fontSize: 14, color: '#cbd5e1', fontWeight: '600' },
  
  finePrint: { 
    fontSize: 11, 
    color: '#64748b', 
    marginTop: 24, 
    textAlign: 'center', 
    lineHeight: 16,
    paddingHorizontal: 10,
  },
  linkText: { color: '#60a5fa', fontWeight: '700' },
});