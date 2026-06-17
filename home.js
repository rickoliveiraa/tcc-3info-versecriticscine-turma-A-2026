import React from 'react';
import { StyleSheet, Text, View, StatusBar, TouchableOpacity, SafeAreaView, ScrollView, Image, Platform, Dimensions } from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48 - 24) / 3; // Mantém a proporção perfeita para 3 colunas

// Ajustado de onVoltar para onLogout para conectar perfeitamente com seu App.js e Perfil
export default function Home({ onLogout }) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#040712" />

      {/* HEADER PRINCIPAL */}
      <View style={styles.header}>
        {/* BOTÃO VOLTAR INTEGRADO AQUI */}
        <TouchableOpacity style={styles.iconBadge} onPress={onLogout} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color="#ffffff" />
        </TouchableOpacity>

        <Text style={[styles.logoText, { flex: 1, marginLeft: 12 }]}>Cine<Text style={styles.logoBlueText}>Track</Text></Text>
        
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBadge} activeOpacity={0.7}>
            <Feather name="bell" size={18} color="#ffffff" />
            <View style={styles.badgeDot} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.avatarButton} activeOpacity={0.7}>
            <Text style={styles.avatarText}>G</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* SEÇÃO: CONTINUAR ASSISTINDO */}
        <Text style={styles.sectionLabel}>CONTINUAR ASSISTINDO</Text>
        <View style={styles.continueCard}>
          <View style={styles.continueHeader}>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4].map((s) => <Ionicons key={s} name="star" size={14} color="#3b82f6" style={{ marginRight: 2 }} />)}
              <Ionicons name="star" size={14} color="#1e293b" />
            </View>
          </View>

          <View style={styles.mediaTagRow}>
            <View style={styles.tagBadge}>
              <Text style={styles.tagText}>• SÉRIE</Text>
            </View>
            <View style={styles.tagBadge}>
              <Text style={styles.tagText}>• APPLE TV+</Text>
            </View>
          </View>

          <View style={styles.continueMainRow}>
            <View>
              <Text style={styles.mediaTitle}>Severance</Text>
              <Text style={styles.mediaSub}>T02 · E05 · Chikhai Bardo · 52 min</Text>
            </View>
            <TouchableOpacity style={styles.playButton} activeOpacity={0.8}>
              <Ionicons name="play" size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Barra de Progresso do Filme/Série */}
          <View style={styles.mediaProgressBg}>
            <View style={[styles.mediaProgressFill, { width: '62%' }]} />
          </View>
          <Text style={styles.progressPercentText}>62% assistido</Text>
        </View>

        {/* SEÇÃO: MEU DIÁRIO */}
        <Text style={styles.sectionLabel}>MEU DIÁRIO</Text>
        <View style={styles.diarioGrid}>
          <View style={styles.diarioCard}>
            <Text style={styles.diarioNum}>47 <Text style={styles.diarioUnit}>filmes</Text></Text>
            <Text style={styles.diarioLabel}>assistidos</Text>
            <View style={[styles.diarioIndicator, { backgroundColor: '#3b82f6' }]} />
          </View>

          <View style={styles.diarioCard}>
            <Text style={styles.diarioNum}>12 <Text style={styles.diarioUnit}>séries</Text></Text>
            <Text style={styles.diarioLabel}>em andamento</Text>
            <View style={[styles.diarioIndicator, { backgroundColor: '#22c55e' }]} />
          </View>

          <View style={styles.diarioCard}>
            <Text style={styles.diarioNum}>139 <Text style={styles.diarioUnit}>h</Text></Text>
            <Text style={styles.diarioLabel}>em tela</Text>
            <View style={[styles.diarioIndicator, { backgroundColor: '#ef4444' }]} />
          </View>
        </View>

        {/* SEÇÃO: FILMES EM ALTA */}
        <Text style={styles.sectionLabel}>FILMES EM ALTA</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
          {/* Filme 1 */}
          <View style={styles.showcaseCard}>
            <View style={[styles.posterPlaceholder, { backgroundColor: '#1e1b4b' }]}>
              <Text style={styles.rankNumber}>1</Text>
              <Text style={styles.emojiPoster}>🌌</Text>
            </View>
            <Text numberOfLines={1} style={styles.showcaseTitle}>Dune: Part Two</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={10} color="#3b82f6" />
              <Text style={styles.ratingText}>4.8</Text>
            </View>
          </View>

          {/* Filme 2 */}
          <View style={styles.showcaseCard}>
            <View style={[styles.posterPlaceholder, { backgroundColor: '#450a0a' }]}>
              <Text style={styles.rankNumber}>2</Text>
              <Text style={styles.emojiPoster}>🔺</Text>
            </View>
            <Text numberOfLines={1} style={styles.showcaseTitle}>Hereditary</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={10} color="#3b82f6" />
              <Text style={styles.ratingText}>4.9</Text>
            </View>
          </View>

          {/* Filme 3 */}
          <View style={styles.showcaseCard}>
            <View style={[styles.posterPlaceholder, { backgroundColor: '#0f172a' }]}>
              <Text style={styles.rankNumber}>3</Text>
              <Text style={styles.emojiPoster}>🚀</Text>
            </View>
            <Text numberOfLines={1} style={styles.showcaseTitle}>Interstellar</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={10} color="#3b82f6" />
              <Text style={styles.ratingText}>4.7</Text>
            </View>
          </View>
        </ScrollView>

        {/* SEÇÃO: SÉRIES EM ALTA */}
        <Text style={styles.sectionLabel}>SÉRIES EM ALTA</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
          {/* Série 1 */}
          <View style={styles.showcaseCard}>
            <View style={[styles.posterPlaceholder, { backgroundColor: '#0f172a' }]}>
              <Text style={styles.rankNumber}>1</Text>
              <Text style={styles.emojiPoster}>🏢</Text>
            </View>
            <Text numberOfLines={1} style={styles.showcaseTitle}>Severance</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={10} color="#3b82f6" />
              <Text style={styles.ratingText}>4.9</Text>
            </View>
          </View>

          {/* Série 2 */}
          <View style={styles.showcaseCard}>
            <View style={[styles.posterPlaceholder, { backgroundColor: '#4c0519' }]}>
              <Text style={styles.rankNumber}>2</Text>
              <Text style={styles.emojiPoster}>🌹</Text>
            </View>
            <Text numberOfLines={1} style={styles.showcaseTitle}>Euphoria</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={10} color="#3b82f6" />
              <Text style={styles.ratingText}>4.6</Text>
            </View>
          </View>

          {/* Série 3 */}
          <View style={styles.showcaseCard}>
            <View style={[styles.posterPlaceholder, { backgroundColor: '#064e3b' }]}>
              <Text style={styles.rankNumber}>3</Text>
              <Text style={styles.emojiPoster}>🦑</Text>
            </View>
            <Text numberOfLines={1} style={styles.showcaseTitle}>Squid Game</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={10} color="#3b82f6" />
              <Text style={styles.ratingText}>4.7</Text>
            </View>
          </View>
        </ScrollView>

        {/* SEÇÃO: CONEXÕES */}
        <Text style={styles.sectionLabel}>CONEXÕES</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.horizontalScroll, { marginBottom: 16 }]}>
          <View style={styles.friendContainer}>
            <View style={[styles.friendAvatar, { backgroundColor: '#3b82f6' }]}><Text style={styles.avatarLabelText}>😎</Text><View style={styles.onlineDot}/></View>
            <Text style={styles.friendName}>Lucas</Text>
          </View>
          <View style={styles.friendContainer}>
            <View style={[styles.friendAvatar, { backgroundColor: '#f43f5e' }]}><Text style={styles.avatarLabelText}>🎬</Text></View>
            <Text style={styles.friendName}>Ana</Text>
          </View>
          <View style={styles.friendContainer}>
            <View style={[styles.friendAvatar, { backgroundColor: '#a855f7' }]}><Text style={styles.avatarLabelText}>🍿</Text><View style={styles.onlineDot}/></View>
            <Text style={styles.friendName}>Pedro</Text>
          </View>
          <View style={styles.friendContainer}>
            <View style={[styles.friendAvatar, { backgroundColor: '#eab308' }]}><Text style={styles.avatarLabelText}>👻</Text></View>
            <Text style={styles.friendName}>Beatriz</Text>
          </View>
          <View style={styles.friendContainer}>
            <View style={[styles.friendAvatar, { backgroundColor: '#06b6d4' }]}><Text style={styles.avatarLabelText}>🎭</Text></View>
            <Text style={styles.friendName}>Mariana</Text>
          </View>
          <View style={styles.friendContainer}>
            <View style={[styles.friendAvatar, { backgroundColor: '#1e293b', borderStyle: 'dashed', borderWidth: 1, borderColor: '#46526a' }]}><Feather name="users" size={16} color="#46526a" /></View>
            <Text style={styles.friendName}>ver todos</Text>
          </View>
        </ScrollView>

        {/* REVIEWS DAS CONEXÕES */}
        <View style={styles.feedCard}>
          <View style={styles.feedHeader}>
            <View style={[styles.feedMiniAvatar, { backgroundColor: '#3b82f6' }]}><Text style={{ fontSize: 10 }}>😎</Text></View>
            <Text style={styles.feedHeaderText}>
              <Text style={styles.boldWhite}>Lucas</Text> avaliou <Text style={styles.boldWhite}>Scream VI</Text>
            </Text>
          </View>
          <View style={styles.feedContentRow}>
            <View style={styles.feedStarsRow}>
              {[1, 2, 3, 4, 5].map((s) => <Ionicons key={s} name="star" size={12} color="#3b82f6" style={{ marginRight: 2 }} />)}
              <Text style={styles.feedTimeText}>· há 2h</Text>
            </View>
            <View style={[styles.feedMiniPoster, { backgroundColor: '#450a0a' }]}><Text style={{ fontSize: 12 }}>🔪</Text></View>
          </View>
        </View>

        <View style={styles.feedCard}>
          <View style={styles.feedHeader}>
            <View style={[styles.feedMiniAvatar, { backgroundColor: '#a855f7' }]}><Text style={{ fontSize: 10 }}>🍿</Text></View>
            <Text style={styles.feedHeaderText}>
              <Text style={styles.boldWhite}>Pedro</Text> está assistindo <Text style={styles.boldWhite}>Severance</Text>
            </Text>
          </View>
          <View style={styles.feedContentRow}>
            <View style={styles.feedTagRow}>
              <Text style={styles.feedTagText}>T02 · E03</Text>
              <Text style={styles.feedTimeText}>· agora</Text>
              <View style={[styles.onlineDot, { position: 'relative', top: 0, right: 0, marginLeft: 6 }]} />
            </View>
            <View style={[styles.feedMiniPoster, { backgroundColor: '#0f172a' }]}><Text style={{ fontSize: 12 }}>🏢</Text></View>
          </View>
        </View>

        {/* ÚLTIMOS REGISTROS DO USUÁRIO */}
        <Text style={styles.sectionLabel}>ÚLTIMOS REGISTROS</Text>
        <View style={styles.logCard}>
          <View style={styles.logCardMain}>
            <View style={[styles.logPoster, { backgroundColor: '#1e1b4b' }]}><Text style={{ fontSize: 18 }}>🌌</Text></View>
            <View style={styles.logContent}>
              <View style={styles.logTitleRow}>
                <Text style={styles.logMediaTitle}>Dune: Part Two</Text>
                <Text style={styles.logDate}>hoje</Text>
              </View>
              <View style={styles.starsRow}>
                {[1,2,3,4,5].map((s) => <Ionicons key={s} name="star" size={11} color="#3b82f6" style={{ marginRight: 2 }} />)}
              </View>
              <Text numberOfLines={2} style={styles.logComment}>
                "Visualmente esmagador. Zimmer transcende mais uma vez."
              </Text>
              <View style={styles.logTagsContainer}>
                <View style={styles.logTag}><Text style={styles.logTagText}>• Paul Atreides</Text></View>
                <View style={styles.logTag}><Text style={styles.logTagText}>• Hans Zimmer</Text></View>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.logCard, { marginBottom: 40 }]}>
          <View style={styles.logCardMain}>
            <View style={[styles.logPoster, { backgroundColor: '#450a0a' }]}><Text style={{ fontSize: 18 }}>🔺</Text></View>
            <View style={styles.logContent}>
              <View style={styles.logTitleRow}>
                <Text style={styles.logMediaTitle}>Hereditary</Text>
                <Text style={styles.logDate}>ontem</Text>
              </View>
              <View style={styles.starsRow}>
                {[1,2,3,4].map((s) => <Ionicons key={s} name="star" size={11} color="#3b82f6" style={{ marginRight: 2 }} />)}
                <Ionicons name="star" size={11} color="#1e293b" />
              </View>
              <Text numberOfLines={2} style={styles.logComment}>
                "Toni Collette merecia o Oscar. Cena do jantar me assombra."
              </Text>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* NAVEGAÇÃO INFERIOR (BOTTOM TAB BAR) */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity style={styles.tabItem} activeOpacity={0.7}>
          <Ionicons name="home" size={20} color="#3b82f6" />
          <Text style={[styles.tabLabel, { color: '#3b82f6' }]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} activeOpacity={0.7}>
          <Feather name="search" size={20} color="#46526a" />
          <Text style={styles.tabLabel}>Buscar</Text>
        </TouchableOpacity>
        
        {/* BOTÃO FLUTUANTE CENTRAL DE ADICIONAR */}
        <TouchableOpacity style={styles.centerAddButton} activeOpacity={0.85}>
          <Feather name="plus" size={24} color="#ffffff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} activeOpacity={0.7}>
          <MaterialCommunityIcons name="notebook-outline" size={20} color="#46526a" />
          <Text style={styles.tabLabel}>Diário</Text>
        </TouchableOpacity>
        
        {/* BOTÃO DE VOLTAR 2: Ícone do Perfil conectado ao onLogout */}
        <TouchableOpacity style={styles.tabItem} activeOpacity={0.7} onPress={onLogout}>
          <Feather name="user" size={20} color="#46526a" />
          <Text style={styles.tabLabel}>Perfil</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#040712' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 40 : 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
  },
  logoText: { fontSize: 20, fontWeight: '700', color: '#ffffff', letterSpacing: -0.5 },
  logoBlueText: { color: '#3b82f6' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3b82f6',
  },
  avatarButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 100 },
  
  // SEÇÕES GERAIS
  sectionLabel: { color: '#46526a', fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginTop: 24, marginBottom: 14 },
  
  // CONTINUAR ASSISTINDO
  continueCard: {
    width: '100%',
    backgroundColor: '#090d1a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.2,
    borderColor: 'rgba(255,255,255,0.02)',
  },
  continueHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  starsRow: { flexDirection: 'row', alignItems: 'center' },
  mediaTagRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  tagBadge: { backgroundColor: 'rgba(59, 130, 246, 0.08)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  tagText: { color: '#3b82f6', fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  continueMainRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  mediaTitle: { color: '#ffffff', fontSize: 20, fontWeight: 'bold', letterSpacing: -0.3 },
  mediaSub: { color: '#46526a', fontSize: 11, marginTop: 2 },
  playButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center' },
  mediaProgressBg: { width: '100%', height: 4, backgroundColor: '#1e293b', borderRadius: 2 },
  mediaProgressFill: { height: '100%', backgroundColor: '#3b82f6', borderRadius: 2 },
  progressPercentText: { color: '#3b82f6', fontSize: 10, fontWeight: '600', marginTop: 8 },

  // MEU DIÁRIO
  diarioGrid: { flexDirection: 'row', gap: 12 },
  diarioCard: {
    flex: 1,
    height: 80,
    backgroundColor: '#090d1a',
    borderRadius: 14,
    padding: 12,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  diarioNum: { color: '#ffffff', fontSize: 22, fontWeight: 'bold' },
  diarioUnit: { fontSize: 12, color: '#46526a', fontWeight: '400' },
  diarioLabel: { color: '#46526a', fontSize: 10, marginTop: 4, fontWeight: '500' },
  diarioIndicator: { position: 'absolute', bottom: 0, left: 12, right: 12, height: 2, borderRadius: 1 },

  // SHOWCASE HORIZONTAL (FILMES E SÉRIES)
  horizontalScroll: { flexDirection: 'row', gap: 12 },
  showcaseCard: { width: CARD_WIDTH },
  posterPlaceholder: {
    width: '100%',
    height: 140,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 8,
  },
  rankNumber: { position: 'absolute', top: 8, left: 10, color: '#ffffff', fontSize: 18, fontWeight: '900', opacity: 0.8 },
  emojiPoster: { fontSize: 28 },
  showcaseTitle: { color: '#ffffff', fontSize: 12, fontWeight: '600' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  ratingText: { color: '#3b82f6', fontSize: 10, fontWeight: '700' },

  // CONEXÕES
  friendContainer: { alignItems: 'center', width: 60 },
  friendAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 6,
  },
  avatarLabelText: { fontSize: 20 },
  onlineDot: { position: 'absolute', bottom: 2, right: 2, width: 10, height: 10, borderRadius: 5, backgroundColor: '#22c55e', borderWidth: 2, borderColor: '#040712' },
  friendName: { color: '#46526a', fontSize: 11, fontWeight: '500' },

  // FEED CARDS
  feedCard: {
    width: '100%',
    backgroundColor: '#090d1a',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.01)',
  },
  feedHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  feedMiniAvatar: { width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  feedHeaderText: { color: '#46526a', fontSize: 12 },
  boldWhite: { color: '#ffffff', fontWeight: '600' },
  feedContentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  feedStarsRow: { flexDirection: 'row', alignItems: 'center' },
  feedTimeText: { color: '#46526a', fontSize: 11, marginLeft: 4 },
  feedMiniPoster: { width: 28, height: 38, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  feedTagRow: { flexDirection: 'row', alignItems: 'center' },
  feedTagText: { color: '#46526a', fontSize: 11, backgroundColor: 'rgba(255,255,255,0.03)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },

  // ÚLTIMOS REGISTROS
  logCard: {
    width: '100%',
    backgroundColor: '#090d1a',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  logCardMain: { flexDirection: 'row', gap: 12 },
  logPoster: { width: 44, height: 64, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  logContent: { flex: 1 },
  logTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  logMediaTitle: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  logDate: { color: '#46526a', fontSize: 11 },
  logComment: { color: '#46526a', fontSize: 12, marginTop: 6, fontStyle: 'italic', lineHeight: 16 },
  logTagsContainer: { flexDirection: 'row', gap: 6, marginTop: 8 },
  logTag: { backgroundColor: 'rgba(34, 197, 94, 0.05)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  logTagText: { color: '#22c55e', fontSize: 10, fontWeight: '600' },

  // TAB BAR INFERIOR
  bottomTabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 65,
    backgroundColor: '#040712',
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 15 : 0,
  },
  tabItem: { alignItems: 'center', justifyContent: 'center', flex: 1, height: '100%' },
  tabLabel: { fontSize: 10, color: '#46526a', marginTop: 4, fontWeight: '600' },
  centerAddButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    top: -10,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
});