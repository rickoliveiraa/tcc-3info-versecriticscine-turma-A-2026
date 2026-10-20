import React, { useState } from 'react';
import { StyleSheet, Text, View, StatusBar, TouchableOpacity, SafeAreaView, ScrollView, Platform, Dimensions } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48 - 24) / 3; 

const GENEROS_DATA = [
  { id: 'acao', nome: 'Ação', emoji: '💥' },
  { id: 'terror', nome: 'Terror', emoji: '👻' },
  { id: 'slasher', nome: 'Slasher', emoji: '🔪' },
  { id: 'romance', nome: 'Romance', emoji: '💘' },
  { id: 'comedia', nome: 'Comédia', emoji: '😂' },
  { id: 'sci-fi', nome: 'Sci-Fi', emoji: '🚀' },
  { id: 'suspense', nome: 'Suspense', emoji: '🕵️‍♂️' },
  { id: 'drama', nome: 'Drama', emoji: '🎭' },
  { id: 'animacao', nome: 'Animação', emoji: '✨' },
  { id: 'doc', nome: 'Doc.', emoji: '🎙️' },
  { id: 'fantasia', nome: 'Fantasia', emoji: '🧙‍♀️' },
  { id: 'crime', nome: 'Crime', emoji: '🚓' },
];

export default function EscolhaGeneros({ onContinuar, onPular }) {
  const [selecionados, setSelecionados] = useState([]);

  const alternarGenero = (id) => {
    if (selecionados.includes(id)) {
      setSelecionados(selecionados.filter(item => item !== id));
    } else {
      setSelecionados([...selecionados, id]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.headerRow}>
          <View style={styles.logoContainer}>
            <Feather name="film" size={18} color="#3b82f6" style={{ marginRight: 6 }} />
            <Text style={styles.logoText}>Cine<Text style={styles.logoBlueText}>Track</Text></Text>
          </View>
          <Text style={styles.stepText}>Passo <Text style={styles.whiteText}>2</Text> de 3</Text>
        </View>

        <View style={styles.progressBarRow}>
          <View style={[styles.progressStep, styles.progressStepActive]} />
          <View style={[styles.progressStep, styles.progressStepActive]} />
          <View style={styles.progressStep} />
        </View>

        <Text style={styles.mainTitle}>O que você curte{'\n'}assistir? 🎬</Text>
        <Text style={styles.subTitleText}>
          Escolha <Text style={styles.boldWhiteText}>seus gêneros favoritos</Text> — personalizamos tudo para você.
        </Text>

        <View style={styles.gridContainer}>
          {GENEROS_DATA.map((genero) => {
            const isSelecionado = selecionados.includes(genero.id);
            return (
              <TouchableOpacity
                key={genero.id}
                style={[styles.card, isSelecionado && styles.cardSelecionado]}
                activeOpacity={0.8}
                onPress={() => alternarGenero(genero.id)}
              >
                {isSelecionado && (
                  <View style={styles.checkBadge}>
                    <Ionicons name="checkmark-circle" size={16} color="#3b82f6" />
                  </View>
                )}
                <Text style={styles.cardEmoji}>{genero.emoji}</Text>
                <Text numberOfLines={1} style={[styles.cardNome, isSelecionado && styles.cardNomeSelecionado]}>
                  {genero.nome}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.hintText}>
          {selecionados.length} gêneros selecionados · escolha quantos quiser
        </Text>

        <TouchableOpacity style={styles.btnContinuar} activeOpacity={0.85} onPress={() => onContinuar(selecionados)}>
          <Text style={styles.btnContinuarText}>Continuar</Text>
          <Feather name="arrow-right" size={16} color="#ffffff" style={{ marginLeft: 8 }} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnPular} activeOpacity={0.7} onPress={onPular}>
          <Text style={styles.pularText}>Pular por agora</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  scrollContent: { paddingHorizontal: 24, paddingTop: Platform.OS === 'android' ? 45 : 20, paddingBottom: 30 },
  
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  logoContainer: { flexDirection: 'row', alignItems: 'center' },
  logoText: { fontSize: 18, fontWeight: '800', color: '#ffffff', letterSpacing: -0.5 },
  logoBlueText: { color: '#3b82f6' },
  stepText: { fontSize: 12, color: '#737373', fontWeight: '500' },
  whiteText: { color: '#ffffff', fontWeight: '700' },

  progressBarRow: { flexDirection: 'row', width: '100%', gap: 8, marginTop: 4, marginBottom: 28 },
  progressStep: { flex: 1, height: 4, borderRadius: 2, backgroundColor: '#1a1a1a' },
  progressStepActive: { backgroundColor: '#3b82f6' },

  mainTitle: { fontSize: 28, fontWeight: '800', color: '#ffffff', letterSpacing: -0.5, lineHeight: 34 },
  subTitleText: { fontSize: 14, color: '#a3a3a3', marginTop: 12, lineHeight: 22 },
  boldWhiteText: { color: '#f5f5f5', fontWeight: '600' },

  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, width: '100%', marginTop: 32 },
  card: { 
    width: CARD_WIDTH, 
    height: 100, 
    borderRadius: 16, 
    backgroundColor: '#141414', 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.06)', 
    justifyContent: 'center', 
    alignItems: 'center',
    position: 'relative'
  },
  cardSelecionado: { borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.08)' },
  checkBadge: { position: 'absolute', top: 8, right: 8 },
  cardEmoji: { fontSize: 28, marginBottom: 8 },
  cardNome: { fontSize: 12, fontWeight: '600', color: '#737373', textAlign: 'center', paddingHorizontal: 4 },
  cardNomeSelecionado: { color: '#ffffff' },

  hintText: { fontSize: 12, color: '#737373', textAlign: 'center', marginTop: 24, fontWeight: '500' },
  btnContinuar: { width: '100%', height: 56, borderRadius: 16, backgroundColor: '#3b82f6', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 28, shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  btnContinuarText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  btnPular: { alignSelf: 'center', marginTop: 20, padding: 12 },
  pularText: { color: '#737373', fontSize: 14, fontWeight: '600' },
});