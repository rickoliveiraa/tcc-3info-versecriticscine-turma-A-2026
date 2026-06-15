import React, { useState } from 'react';
import { StyleSheet, Text, View, Image, StatusBar, TouchableOpacity, SafeAreaView, ScrollView, ImageBackground } from 'react-native';
import { FontAwesome, FontAwesome5, Ionicons } from '@expo/vector-icons';

import TelaCadastro from './teladecadastro';

export default function App() {
  const [telaAtual, setTelaAtual] = useState('Home');

  if (telaAtual === 'Cadastro') {
    return <TelaCadastro onVoltar={() => setTelaAtual('Home')} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#040712" />
      <View style={styles.backgroundOverlay} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <View style={styles.glowBackground} />
          <View style={styles.floatCards}>
            
            <View style={[styles.fcard, styles.fcardSideLeft]}>
              <ImageBackground 
                source={{ uri: 'https://estantedasala.com/wp-content/uploads/2014/07/the-notebook.jpg' }} 
                style={styles.posterBg}
                resizeMode="cover"
              >
                <View style={styles.cardInternalBottom}>
                  <Text numberOfLines={1} style={styles.cardTitle}>The Notebook</Text>
                  <View style={styles.cardStars}>
                    {[1, 2, 3, 4, 5].map((s) => <FontAwesome key={s} name="star" size={7} color="#3b82f6" />)}
                  </View>
                </View>
              </ImageBackground>
            </View>

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
                      {[1, 2, 3, 4, 5].map((s) => <FontAwesome key={s} name="star" size={7} color="#3b82f6" />)}
                    </View>
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

            <View style={[styles.fcard, styles.fcardSideRight]}>
              <ImageBackground 
                source={{ uri: 'https://br.web.img3.acsta.net/c_310_420/medias/nmedia/18/87/32/73/19874353.jpg' }} 
                style={styles.posterBg}
                resizeMode="cover"
              >
                <View style={styles.cardInternalBottom}>
                  <Text numberOfLines={1} style={styles.cardTitle}>Pânico 4</Text>
                  <View style={styles.cardStars}>
                    {[1, 2, 3, 4].map((s) => <FontAwesome key={s} name="star" size={7} color="#3b82f6" />)}
                    <FontAwesome name="star" size={7} color="rgba(59,130,246,0.15)" />
                  </View>
                </View>
              </ImageBackground>
            </View>

          </View>
        </View>

        <View style={styles.mainContent}>
          <View style={styles.logoContainer}>
            <Image
              source={require('./assets/logo-cinetrack.png')}
              style={styles.logoCustomIcon}
              resizeMode="contain"
            />
            <Text style={styles.logoText}>CINE<Text style={styles.logoBlueText}>T</Text>RACK</Text>
          </View>
          
          <Text style={styles.logoSubtext}>FILMES · SÉRIES · TRILHAS</Text>

          <Text style={styles.descriptionText}>
            Seu <Text style={styles.boldWhiteText}>diário audiovisual</Text> com a trilha sonora das obras que você ama — tudo em um só lugar.
          </Text>

          <View style={styles.pillsContainer}>
            <View style={styles.pillItem}>
              <View style={[styles.pillDot, { backgroundColor: '#3b82f6' }]} />
              <Text style={styles.pillText}>Filmes & Séries</Text>
            </View>
            <View style={styles.pillItem}>
              <View style={[styles.pillDot, { backgroundColor: '#22c55e' }]} />
              <Text style={styles.pillText}>Trilha via Spotify</Text>
            </View>
            <View style={styles.pillItem}>
              <View style={[styles.pillDot, { backgroundColor: '#64748b' }]} />
              <Text style={styles.pillText}>Conexões</Text>
            </View>
          </View>

          <View style={styles.actionContainer}>
            <TouchableOpacity 
              style={styles.btnRegister} 
              activeOpacity={0.85}
              onPress={() => setTelaAtual('Cadastro')}
            >
              <FontAwesome5 name="user-plus" size={15} color="#ffffff" style={{ marginRight: 10 }} />
              <Text style={styles.btnRegisterText}>Criar conta gratuita</Text>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.orText}>ou continue com</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialButtonsRow}>
              <TouchableOpacity style={styles.btnSocial} activeOpacity={0.8}>
                <FontAwesome name="instagram" size={16} color="#cf2b72" style={{ marginRight: 8 }} />
                <Text style={styles.btnSocialText}>Instagram</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.btnSocial} activeOpacity={0.8}>
                <Ionicons name="logo-x" size={15} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.btnSocialText}>Twitter / X</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.btnLoginContainer} activeOpacity={0.8}>
              <Text style={styles.btnLoginText}>
                Já tenho uma conta — <Text style={{ color: '#ffffff', fontWeight: '500' }}>Entrar</Text>
              </Text>
            </TouchableOpacity>

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
  container: { flex: 1, backgroundColor: '#040712' },
  backgroundOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#040712' },
  scrollContent: { paddingBottom: 40 },
  heroSection: { width: '100%', height: 330, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  glowBackground: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(59, 130, 246, 0.05)', top: 50 },
  floatCards: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', width: '100%', paddingTop: 30 },
  fcard: { borderRadius: 20, overflow: 'hidden', backgroundColor: '#070b19', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.04)' },
  posterBg: { flex: 1, width: '100%', height: '100%', justifyContent: 'flex-end' },
  cardInternalBottom: { paddingHorizontal: 10, paddingVertical: 12, backgroundColor: 'rgba(4, 7, 18, 0.85)' },
  cardTitle: { fontSize: 10, fontWeight: '600', color: '#ffffff', marginBottom: 3 },
  centerStarsRow: { flexDirection: 'column', gap: 3 },
  cardStars: { flexDirection: 'row', gap: 2 },
  miniAudioWave: { flexDirection: 'row', gap: 1.5, alignItems: 'flex-end' },
  miniWaveLine: { width: 1.5, backgroundColor: '#3b82f6', borderRadius: 0.5 },
  fcardSideLeft: { width: 120, height: 185, transform: [{ rotate: '-8deg' }, { translateX: 15 }, { translateY: -5 }] },
  fcardSideRight: { width: 120, height: 185, transform: [{ rotate: '8deg' }, { translateX: -15 }, { translateY: -5 }] },
  fcardCenter: { width: 170, height: 265, zIndex: 20, borderColor: 'rgba(255, 255, 255, 0.08)', borderWidth: 1.2 },
  mainContent: { paddingHorizontal: 24, alignItems: 'center' },
  logoContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 15 },
  logoCustomIcon: { width: 30, height: 30, marginRight: 10 },
  logoText: { fontSize: 24, fontWeight: 'bold', color: '#ffffff', letterSpacing: 2 },
  logoBlueText: { color: '#3b82f6' },
  logoSubtext: { fontSize: 10, color: '#3a465d', letterSpacing: 3, marginTop: 4, fontWeight: '600' },
  descriptionText: { fontSize: 14, color: '#606d85', textAlign: 'center', lineHeight: 22, marginTop: 20, maxWidth: '90%' },
  boldWhiteText: { color: '#cbd5e1', fontWeight: '600' },
  pillsContainer: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginTop: 22 },
  pillItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.015)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.04)' },
  pillDot: { width: 5, height: 5, borderRadius: 2.5, marginRight: 6 },
  pillText: { fontSize: 11, color: '#46526a', fontWeight: '500' },
  actionContainer: { width: '100%', marginTop: 30 },
  btnRegister: { width: '100%', height: 52, borderRadius: 14, backgroundColor: '#3b82f6', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  btnRegisterText: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255, 255, 255, 0.05)' },
  orText: { fontSize: 11, color: '#3a465d', paddingHorizontal: 10 },
  socialButtonsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  btnSocial: { flex: 1, height: 48, borderRadius: 12, backgroundColor: 'rgba(255, 255, 255, 0.015)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.04)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  btnSocialText: { color: '#cbd5e1', fontSize: 13, fontWeight: '500' },
  btnLoginContainer: { width: '100%', height: 48, borderRadius: 12, backgroundColor: 'rgba(255, 255, 255, 0.015)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.04)', alignItems: 'center', justifyContent: 'center' },
  btnLoginText: { fontSize: 13, color: '#46526a' },
  finePrint: { fontSize: 10, color: '#2e3747', marginTop: 25, textAlign: 'center' },
  linkText: { color: '#3b82f6' },
});