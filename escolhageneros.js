import React, { useState } from 'react';
import { StyleSheet, Text, View, StatusBar, TouchableOpacity, SafeAreaView, ScrollView, Platform, Dimensions } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48 - 24) / 3; // Calcula o tamanho exato para 3 colunas perfeitas com o espaçamento

// Lista com os gêneros, emojis e cores de destaque baseadas no seu design
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

  // Lógica para marcar/desmarcar itens na lista de selecionados
  const alternarGenero = (id) => {
    if (selecionados.includes(id)) {
      setSelecionados(selecionados.filter(item => item !== id));
    } else {
      setSelecionados([...selecionados, id]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#040712" />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* HEADER: LOGO + PASSO */}
        <View style={styles.headerRow}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>Cine<Text style={styles.logoBlueText}>Track</Text></Text>
          </View>
          <Text style={styles.stepText}>Passo <Text style={styles.whiteText}>2</Text> de 3</Text>
        </View>

        {/* BARRINHA DE PROGRESSO (PASSO 2 DE 3) */}
        <View style={styles.progressBarRow}>
          <View style={[styles.progressStep, styles.progressStepActive]} />
          <View style={[styles.progressStep, styles.progressStepActive]} />
          <View style={styles.progressStep} />
        </View>

        {/* TÍTULO E SUBTÍTULO */}
        <Text style={styles.mainTitle}>O que você curte{'\n'}assistir? 🎬</Text>
        <Text style={styles.subTitleText}>
          Escolha <Text style={styles.boldWhiteText}>seus gêneros favoritos</Text> — personalizamos tudo para você.
        </Text>

        {/* GRID DE GÊNEROS */}
        <View style={styles.gridContainer}>
          {GENEROS_DATA.map((genero) => {
            const isSelecionado = selecionados.includes(genero.id);
            return (
              <TouchableOpacity
                key={genero.id}
                style={[
                  styles.card,
                  isSelecionado && styles.cardSelecionado
                ]}
                activeOpacity={0.8}
                onPress={() => alternarGenero(genero.id)}
              >
                {/* CHECKMARK ICON QUANDO SELECIONADO */}
                {isSelecionado && (
                  <View style={styles.checkBadge}>
                    <Ionicons name="checkmark-circle" size={14} color="#3b82f6" />
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

        {/* TEXTO INFORMATIVO DE SELEÇÃO */}
        <Text style={styles.hintText}>
          {selecionados.length} gêneros selecionados · escolha quantos quiser
        </Text>

        {/* BOTÃO CONTINUAR */}
        <TouchableOpacity 
          style={styles.btnContinuar} 
          activeOpacity={0.85}
          onPress={() => onContinuar(selecionados)}
        >
          <Text style={styles.btnContinuarText}>Continuar</Text>
          <Feather name="arrow-right" size={16} color="#ffffff" style={{ marginLeft: 8 }} />
        </TouchableOpacity>

        {/* BOTÃO PULAR POR AGORA */}
        <TouchableOpacity style={styles.btnPular} activeOpacity={0.7} onPress={onPular}>
          <Text style={styles.pularText}>Pular por agora</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#040712' },
  scrollContent: { 
    paddingHorizontal: 24, 
    paddingTop: Platform.OS === 'android' ? 45 : 20, 
    paddingBottom: 30 
  },
  
  // HEADER
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  logoContainer: { flexDirection: 'row', alignItems: 'center' },
  logoText: { fontSize: 16, fontWeight: '700', color: '#ffffff', letterSpacing: 0.5 },
  logoBlueText: { color: '#3b82f6' },
  stepText: { fontSize: 12, color: '#46526a', fontWeight: '500' },
  whiteText: { color: '#ffffff', fontWeight: '700' },

  // BARRINHA DE PROGRESSO
  progressBarRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 8,
    marginTop: 4,
    marginBottom: 28,
  },
  progressStep: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1e293b',
  },
  progressStepActive: {
    backgroundColor: '#3b82f6',
  },

  // TEXTOS PRINCIPAIS
  mainTitle: { 
    fontSize: 30, 
    fontWeight: 'bold', 
    color: '#ffffff', 
    letterSpacing: -0.5, 
    lineHeight: 36,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium' 
  },
  subTitleText: { fontSize: 13, color: '#4d5b75', marginTop: 12, lineHeight: 20 },
  boldWhiteText: { color: '#cbd5e1', fontWeight: '600' },

  // GRID DOS CARDS
  gridContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 12, 
    width: '100%', 
    marginTop: 32, 
    justify: 'flex-start' 
  },
  card: { 
    width: CARD_WIDTH, 
    height: 95, 
    borderRadius: 14, 
    backgroundColor: '#090d1a', 
    borderWidth: 1.2, 
    borderColor: 'rgba(255, 255, 255, 0.02)', 
    justifyContent: 'center', 
    alignItems: 'center',
    position: 'relative'
  },
  cardSelecionado: { 
    borderColor: '#3b82f6', 
    backgroundColor: 'rgba(59, 130, 246, 0.04)' 
  },
  checkBadge: { 
    position: 'absolute', 
    top: 8, 
    right: 8 
  },
  cardEmoji: { fontSize: 24, marginBottom: 8 },
  cardNome: { fontSize: 11, fontWeight: '600', color: '#46526a' },
  cardNomeSelecionado: { color: '#ffffff' },

  // FOOTER
  hintText: { fontSize: 11, color: '#3a465d', textAlign: 'center', marginTop: 20, fontWeight: '500' },
  btnContinuar: { 
    width: '100%', 
    height: 54, 
    borderRadius: 14, 
    backgroundColor: '#3b82f6', 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 28 
  },
  btnContinuarText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  btnPular: { alignSelf: 'center', marginTop: 20, padding: 8 },
  pularText: { color: '#46526a', fontSize: 12, fontWeight: '600' },
});