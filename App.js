import React from 'react';
import { StyleSheet, Text, View, StatusBar, TouchableOpacity, SafeAreaView, ScrollView, ImageBackground } from 'react-native';
import { FontAwesome, Ionicons, SimpleLineIcons, Feather } from '@expo/vector-icons';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#040712" />
      
      <View style={styles.backgroundOverlay} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* ── SEÇÃO DOS POSTERS (HERO) ── */}
        <View style={styles.heroSection}>
          <View style={styles.floatCards}>
            
            {/* CARD LEFT: Diário de uma Paixão (The Notebook) */}
            <View style={[styles.fcard, styles.fcardSideLeft]}>
              <ImageBackground 
                source={{ uri: 'https://estantedasala.com/wp-content/uploads/2014/07/the-notebook.jpg' }} 
                style={styles.posterBg}
                resizeMode="cover"
              >
                <View style={styles.cardInternalBottom}>
                  <Text numberOfLines={1} style={styles.cardTitle}>The Notebook</Text>
                  <View style={styles.cardStars}>
                    {[1, 2, 3, 4, 5].map((s) => <FontAwesome key={s} name="star" size={6} color="#3b82f6" />)}
                  </View>
                </View>
              </ImageBackground>
            </View>

            {/* CARD CENTER: Challengers (Grande Destaque) */}
            <View style={[styles.fcard, styles.fcardCenter]}>
              <ImageBackground 
                source={{ uri: 'https://m.media-amazon.com/images/I/91GuJXf1PFL._AC_SY879_.jpg' }} 
                style={styles.posterBg}
                resizeMode="cover"
              >
                <View style={styles.cardInternalBottom}>
                  <Text numberOfLines={1} style={styles.cardTitle}>Challengers</Text>
                  <View style={styles.centerStarsRow}>
                    <View style={styles.cardStars}>
                      {[1, 2, 3, 4, 5].map((s) => <FontAwesome key={s} name="star" size={6} color="#3b82f6" />)}
                    </View>
                    {/* Linhas de áudio azuis */}
                    <View style={styles.miniAudioWave}>
                      <View style={[styles.miniWaveLine, { height: 3 }]} />
                      <View style={[styles.miniWaveLine, { height: 7 }]} />
                      <View style={[styles.miniWaveLine, { height: 5 }]} />
                      <View style={[styles.miniWaveLine, { height: 8 }]} />
                    </View>
                  </View>
                </View>
              </ImageBackground>
            </View>

            {/* CARD RIGHT: Pânico 4 */}
            <View style={[styles.fcard, styles.fcardSideRight]}>
              <ImageBackground 
                source={{ uri: 'https://br.web.img3.acsta.net/c_310_420/medias/nmedia/18/87/32/73/19874353.jpg' }} 
                style={styles.posterBg}
                resizeMode="cover"
              >
                <View style={styles.cardInternalBottom}>
                  <Text numberOfLines={1} style={styles.cardTitle}>Pânico 4</Text>
                  <View style={styles.cardStars}>
                    {[1, 2, 3, 4].map((s) => <FontAwesome key={s} name="star" size={6} color="#3b82f6" />)}
                    <FontAwesome name="star" size={6} color="rgba(59,130,246,0.15)" />
                  </View>
                </View>
              </ImageBackground>
            </View>

          </View>
        </View>

        {/* ── CONTEÚDO PRINCIPAL ── */}
        <View style={styles.mainContent}>
          
          {/* LOGOTIPO COMPLETO */}
          <View style={styles.logoContainer}>
            <View style={styles.logoIconContainer}>
              <Ionicons name="film-outline" size={28} color="#ffffff" style={styles.filmIconRotation} />
              <View style={styles.audioWaveOverlay}>
                <View style={[styles.waveLine, { height: 8 }]} />
                <View style={[styles.waveLine, { height: 15 }]} />
                <View style={[styles.waveLine, { height: 10 }]} />
                <View style={[styles.waveLine, { height: 5 }]} />
              </View>
            </View>
            <Text style={styles.logoText}>
              CINE<Text style={{ color: '#4491ff' }}>T</Text>RACK
            </Text>
          </View>
          
          <Text style={styles.logoSubtext}>FILMES · SÉRIES · TRILHAS</Text>

          {/* TEXTO DESCRITIVO */}
          <Text style={styles.descriptionText}>
            Seu <Text style={styles.boldWhiteText}>diário audiovisual</Text> com a trilha sonora das obras que você ama — tudo em um só lugar.
          </Text>

          {/* CAPSULAS (PILLS) */}
          <View style={styles.pillsContainer}>
            <View style={styles.pillItem}>
              <View style={[styles.pillDot, { backgroundColor: '#2563eb' }]} />
              <Text style={styles.pillText}>Filmes & Séries</Text>
            </View>
            <View style={styles.pillItem}>
              <View style={[styles.pillDot, { backgroundColor: '#16a34a' }]} />
              <Text style={styles.pillText}>Trilha via Spotify</Text>
            </View>
            <View style={styles.pillItem}>
              <View style={[styles.pillDot, { backgroundColor: '#4b5563' }]} />
              <Text style={styles.pillText}>Conexões</Text>
            </View>
          </View>

          {/* BOTÕES DE AÇÃO */}
          <View style={styles.actionContainer}>
            
            {/* Criar Conta Gratuita */}
            <TouchableOpacity style={styles.btnRegister} activeOpacity={0.85}>
              <SimpleLineIcons name="user-follow" size={15} color="#ffffff" style={{ marginRight: 10 }} />
              <Text style={styles.btnRegisterText}>Criar conta gratuita</Text>
            </TouchableOpacity>

            <Text style={styles.orText}>ou continue com</Text>

            {/* Redes Sociais */}
            <View style={styles.socialButtonsRow}>
              <TouchableOpacity style={styles.btnSocial} activeOpacity={0.8}>
                <Feather name="instagram" size={15} color="#cf2b72" style={{ marginRight: 8 }} />
                <Text style={styles.btnSocialText}>Instagram</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.btnSocial} activeOpacity={0.8}>
                <FontAwesome name="twitter" size={13} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.btnSocialText}>Twitter / X</Text>
              </TouchableOpacity>
            </View>

            {/* Já tenho uma conta */}
            <TouchableOpacity style={styles.btnLoginContainer} activeOpacity={0.8}>
              <Text style={styles.btnLoginText}>
                Já tenho uma conta — <Text style={{ color: '#ffffff', fontWeight: '500' }}>Entrar</Text>
              </Text>
            </TouchableOpacity>

            {/* Rodapé */}
            <Text style={styles.finePrint}>
              Ao criar uma conta, você aceita nossos <Text style={styles.linkText}>Termos</Text> e <Text style={styles.linkText}>Privacidade</Text>.
            </Text>

          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#040712',
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#040712',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  heroSection: {
    width: '100%',
    height: 310,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
  },
  floatCards: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    width: '100%',
  },
  fcard: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#050813',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
  },
  fcardSideLeft: {
    width: 105,
    height: 170,
    transform: [{ rotate: '-8deg' }, { translateX: 16 }, { translateY: -6 }],
    opacity: 0.45,
  },
  fcardSideRight: {
    width: 105,
    height: 170,
    transform: [{ rotate: '8deg' }, { translateX: -16 }, { translateY: -6 }],
    opacity: 0.45,
  },
  fcardCenter: {
    width: 135,
    height: 215,
    zIndex: 10,
    borderColor: 'rgba(68, 145, 255, 0.15)',
    borderWidth: 1.2,
  },
  posterBg: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  glowOrb: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignSelf: 'center',
  },
  cardInternalBottom: {
    padding: 12,
    width: '100%',
    backgroundColor: 'rgba(3, 5, 11, 0.85)',
  },
  cardTitle: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  centerStarsRow: {
    flexDirection: 'column',
    gap: 4,
  },
  cardStars: {
    flexDirection: 'row',
    gap: 2.5,
  },
  miniAudioWave: {
    flexDirection: 'row',
    gap: 1.5,
    alignItems: 'flex-end',
    marginTop: 2,
  },
  miniWaveLine: {
    width: 1.8,
    backgroundColor: '#4491ff',
    borderRadius: 0.5,
  },
  mainContent: {
    paddingHorizontal: 26,
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 5,
  },
  logoIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#070b16',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filmIconRotation: {
    transform: [{ rotate: '-8deg' }],
    opacity: 0.85,
  },
  audioWaveOverlay: {
    position: 'absolute',
    flexDirection: 'row',
    gap: 2,
    alignItems: 'center',
  },
  waveLine: {
    width: 2,
    backgroundColor: '#ffffff',
    borderRadius: 1,
  },
  logoText: {
    fontSize: 27,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 2.5,
  },
  logoSubtext: {
    fontSize: 9,
    color: '#3a465d',
    letterSpacing: 3,
    marginTop: 8,
    fontWeight: '600',
  },
  descriptionText: {
    fontSize: 14,
    color: '#606d85',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 24,
    maxWidth: '92%',
  },
  boldWhiteText: {
    color: '#cbd5e1',
    fontWeight: '600',
  },
  pillsContainer: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 26,
    width: '100%',
    flexWrap: 'wrap',
  },
  pillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.015)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  pillDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginRight: 6,
  },
  pillText: {
    fontSize: 11,
    color: '#46526a',
    fontWeight: '500',
  },
  actionContainer: {
    width: '100%',
    marginTop: 35,
    alignItems: 'center',
  },
  btnRegister: {
    width: '100%',
    height: 54,
    borderRadius: 15,
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnRegisterText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  orText: {
    fontSize: 11,
    color: '#3a465d',
    marginVertical: 16,
  },
  socialButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 12,
  },
  btnSocial: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.015)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSocialText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '500',
  },
  btnLoginContainer: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.015)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  btnLoginText: {
    fontSize: 13,
    color: '#46526a',
  },
  finePrint: {
    fontSize: 10,
    color: '#2e3747',
    marginTop: 25,
    textAlign: 'center',
  },
  linkText: {
    color: '#3b82f6',
  },
});