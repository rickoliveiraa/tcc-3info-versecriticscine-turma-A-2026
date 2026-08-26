import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, Image, StatusBar, TouchableOpacity, 
  SafeAreaView, ScrollView, ImageBackground, Platform, Dimensions, ActivityIndicator
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';

import TelaCadastro from './teladecadastro';
import RecuperarConta from './recuperarconta'; 
import EscolhaGeneros from './escolhageneros';
import Home from './home'; 

const { width, height } = Dimensions.get('window');

// Mantendo seus arquivos locais como FALLBACK
const FALLBACK_POSTERS = [
  require('./assets/notebook.jpg'),
  require('./assets/challengers.jpg'),
  require('./assets/panico4.webp')
];

export default function App() {
  const [telaAtual, setTelaAtual] = useState('HomeLanding');
  const [topMovies, setTopMovies] = useState([]);
  const [loadingMovies, setLoadingMovies] = useState(true);

  // --- BUSCANDO OS 3 FILMES MAIS POPULARES DIRETO DA API DO TMDB ---
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

  // --- FLUXO DE NAVEGAÇÃO ---
  if (telaAtual === 'Cadastro') return <TelaCadastro onVoltar={() => setTelaAtual('HomeLanding')} onCadastroSucesso={() => setTelaAtual('Generos')} />;
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

  // --- TELA INICIAL (LANDING PAGE AZUL FANTÁSTICA) ---
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#020617" translucent={Platform.OS === 'android'} />
      
      {/* 🌌 FUNDO DE CINEMA AZUL (PROJETORES E LUZES) 🌌 */}
      <View style={styles.cinemaBackground}>
        <View style={styles.projectorLightLeft} />
        <View style={styles.projectorLightRight} />
        <View style={styles.vignetteOverlay} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* HERO SECTION: CARDS FLUTUANTES DINÂMICOS */}
        <View style={styles.heroSection}>
          {loadingMovies ? (
            <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 100 }} />
          ) : (
            <View style={styles.floatCards}>
              
              {/* Card Esquerdo */}
              <View style={[styles.fcard, styles.fcardSideLeft]}>
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
              </View>

              {/* Card Central (Destaque) */}
              <View style={[styles.fcard, styles.fcardCenter]}>
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
              </View>

              {/* Card Direito */}
              <View style={[styles.fcard, styles.fcardSideRight]}>
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
              </View>

            </View>
          )}
        </View>

        {/* CONTEÚDO PRINCIPAL */}
        <View style={styles.mainContent}>
          
          <View style={styles.logoContainer}>
            <View style={styles.logoIconBox}>
              <Feather name="film" size={24} color="#60a5fa" />
            </View>
            <Text style={styles.logoText}>CINE<Text style={styles.logoBlueText}>TRACK</Text></Text>
          </View>
          
          <Text style={styles.logoSubtext}>FILMES · SÉRIES · TRILHAS</Text>

          <Text style={styles.descriptionText}>
            Seu <Text style={styles.boldWhiteText}>diário audiovisual</Text> definitivo. Registre o que assiste, descubra trilhas sonoras e conecte-se com amigos — tudo em um só lugar.
          </Text>

          {/* PÍLULAS DE FEATURES */}
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

          {/* AÇÕES */}
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

            {/* BOTÕES SOCIAIS: INSTAGRAM (IONICONS MODERNO) E X */}
            <View style={styles.socialButtonsRow}>
              <TouchableOpacity style={styles.btnSocial} activeOpacity={0.8}>
                {/* Ícone do Instagram com cor rosa oficial */}
                <Ionicons name="logo-instagram" size={22} color="#E1306C" style={{ marginRight: 8 }} />
                <Text style={styles.btnSocialText}>Instagram</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.btnSocial} activeOpacity={0.8}>
                <Ionicons name="logo-x" size={16} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.btnSocialText}>Twitter / X</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.btnLoginContainer} activeOpacity={0.8} onPress={() => setTelaAtual('Home')}>
              <Text style={styles.btnLoginText}>
                Já tem uma conta? <Text style={{ color: '#ffffff', fontWeight: '700' }}>Entrar</Text>
              </Text>
            </TouchableOpacity>

            <Text style={styles.finePrint}>
              Ao continuar, você aceita nossos <Text style={styles.linkText}>Termos de Uso</Text> e <Text style={styles.linkText}>Política de Privacidade</Text>.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' }, // Azul quase preto
  
  // 🌌 FUNDO DE CINEMA AZUL FANTÁSTICO 🌌
  cinemaBackground: { ...StyleSheet.absoluteFillObject, backgroundColor: '#020617', overflow: 'hidden' },
  projectorLightLeft: {
    position: 'absolute', top: -150, left: -100, width: 400, height: 600,
    backgroundColor: 'rgba(37, 99, 235, 0.35)', // Azul Vibrante
    transform: [{ rotate: '25deg' }], filter: 'blur(80px)', opacity: 0.9
  },
  projectorLightRight: {
    position: 'absolute', top: 100, right: -150, width: 450, height: 700,
    backgroundColor: 'rgba(14, 165, 233, 0.25)', // Azul Ciano Profundo
    transform: [{ rotate: '-15deg' }], filter: 'blur(90px)', opacity: 0.8
  },
  vignetteOverlay: {
    ...StyleSheet.absoluteFillObject,
    background: 'radial-gradient(circle at center, transparent 0%, #020617 90%)',
    backgroundColor: 'rgba(2, 6, 23, 0.5)'
  },

  scrollContent: { paddingBottom: 50 },
  
  // HERO SECTION
  heroSection: { width: '100%', height: 360, justifyContent: 'center', alignItems: 'center', position: 'relative', marginTop: 10 },
  floatCards: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', width: '100%', paddingTop: 30 },
  
  fcard: { 
    borderRadius: 24, overflow: 'hidden', backgroundColor: '#070b19', 
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.15)', 
    shadowColor: '#2563eb', shadowOffset: { width: 0, height: 15 }, shadowOpacity: 0.6, shadowRadius: 20, elevation: 15 
  },
  posterBg: { flex: 1, width: '100%', height: '100%', justifyContent: 'flex-end' },
  cardGradient: { 
    ...StyleSheet.absoluteFillObject, 
    background: 'linear-gradient(to top, rgba(2,6,23,0.98) 0%, rgba(2,6,23,0.5) 40%, transparent 100%)', 
    backgroundColor: 'rgba(2,6,23,0.3)' 
  },
  cardInternalBottom: { paddingHorizontal: 12, paddingVertical: 16, zIndex: 2 },
  cardTitle: { fontSize: 11, fontWeight: '800', color: '#ffffff', marginBottom: 6, textShadowColor: '#000', textShadowOffset: {width: 1, height: 2}, textShadowRadius: 4, letterSpacing: 0.5 },
  
  centerStarsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  cardStars: { flexDirection: 'row' },
  
  miniAudioWave: { flexDirection: 'row', gap: 2.5, alignItems: 'flex-end', height: 14 },
  miniWaveLine: { width: 3, backgroundColor: '#60a5fa', borderRadius: 1.5, shadowColor: '#60a5fa', shadowOpacity: 0.8, shadowRadius: 2 },
  
  fcardSideLeft: { width: 120, height: 185, transform: [{ rotate: '-8deg' }, { translateX: 22 }, { translateY: -15 }], opacity: 0.85 },
  fcardSideRight: { width: 120, height: 185, transform: [{ rotate: '8deg' }, { translateX: -22 }, { translateY: -15 }], opacity: 0.85 },
  fcardCenter: { width: 170, height: 265, zIndex: 20, borderColor: 'rgba(59, 130, 246, 0.6)', borderWidth: 2 },

  // MAIN CONTENT
  mainContent: { paddingHorizontal: 24, alignItems: 'center', marginTop: 5 },
  
  logoContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 15 },
  logoIconBox: { 
    width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(59, 130, 246, 0.15)', 
    justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.3)',
    shadowColor: '#3b82f6', shadowOffset: {width: 0, height: 0}, shadowOpacity: 0.5, shadowRadius: 10
  },
  logoText: { fontSize: 28, fontWeight: '900', color: '#ffffff', letterSpacing: 2, textShadowColor: '#3b82f6', textShadowOffset: {width: 0, height: 0}, textShadowRadius: 10 },
  logoBlueText: { color: '#60a5fa' },
  logoSubtext: { fontSize: 10, color: '#94a3b8', letterSpacing: 3, marginTop: 8, fontWeight: '700' },
  
  descriptionText: { fontSize: 15, color: '#cbd5e1', textAlign: 'center', lineHeight: 24, marginTop: 24, maxWidth: '95%' },
  boldWhiteText: { color: '#ffffff', fontWeight: '700' },
  
  // PILLS
  pillsContainer: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginTop: 28, flexWrap: 'wrap' },
  pillItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 30, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  pillText: { fontSize: 11, color: '#f8fafc', fontWeight: '600' },
  
  // ACTIONS
  actionContainer: { width: '100%', marginTop: 35 },
  
  btnRegister: { 
    width: '100%', height: 58, borderRadius: 18, 
    background: 'linear-gradient(to right, #1d4ed8, #3b82f6)', backgroundColor: '#2563eb',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#2563eb', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.6, shadowRadius: 15, elevation: 10
  },
  btnRegisterText: { color: '#ffffff', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)' },
  orText: { fontSize: 12, color: '#64748b', paddingHorizontal: 12, fontWeight: '600' },
  
  // BOTÕES SOCIAIS
  socialButtonsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  btnSocial: { 
    flex: 1, height: 54, borderRadius: 16, backgroundColor: 'rgba(255, 255, 255, 0.06)', 
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.12)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' 
  },
  btnSocialText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  
  btnLoginContainer: { 
    width: '100%', height: 54, borderRadius: 16, backgroundColor: 'transparent', 
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.15)', alignItems: 'center', justifyContent: 'center', marginTop: 8
  },
  btnLoginText: { fontSize: 14, color: '#cbd5e1', fontWeight: '600' },
  
  finePrint: { fontSize: 11, color: '#64748b', marginTop: 30, textAlign: 'center', lineHeight: 16 },
  linkText: { color: '#60a5fa', fontWeight: '700' },
});