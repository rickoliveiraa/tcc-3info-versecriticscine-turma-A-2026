import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  StatusBar,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Platform,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { getFilmesEmAlta, getSeriesEmAlta } from './services';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48 - 24) / 3;

// URLs dos Posters Estáticos (Links atualizados e testados)
const POSTERS = {
  vampireDiaries: 'https://image.tmdb.org/t/p/w500/70e1PpsfhZQtr9UqNac6z4dWwG.jpg',
  screamVI: 'https://image.tmdb.org/t/p/w500/1SvWJ4n7tT8xVj2vFk4tkKf4sR.jpg',
  severance: 'https://image.tmdb.org/t/p/w500/lFGbYc4mdVlEUMNNtvlcgIsgN0H.jpg',
  dunePartTwo: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
  hereditary: 'https://image.tmdb.org/t/p/w500/lHV8HHlhwNup2VbpiACtlKzaGIQ.jpg',
};

export default function Home({ onLogout }) {
  const [filmes, setFilmes] = useState([]);
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const carregarDadosApi = useCallback(async () => {
    try {
      const [respostaFilmes, respostaSeries] = await Promise.all([
        getFilmesEmAlta(),
        getSeriesEmAlta(),
      ]);

      const listaFilmes = respostaFilmes?.results || [];
      const listaSeries = respostaSeries?.results || [];

      setFilmes(listaFilmes.slice(0, 10));
      setSeries(listaSeries.slice(0, 10));
    } catch (error) {
      console.error('Erro ao carregar dados do TMDB na Home:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    carregarDadosApi();
  }, [carregarDadosApi]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    carregarDadosApi();
  }, [carregarDadosApi]);

  // Componente reutilizável para os Cards de Mídia (API)
  const MediaCard = ({ item, index, isMovie }) => {
    const title = isMovie ? (item.title || item.original_title) : (item.name || item.original_name);
    const emoji = isMovie ? '🎬' : '📺';
    const placeholderBg = isMovie ? '#1e1b4b' : '#0f172a';

    return (
      <TouchableOpacity style={styles.showcaseCard} activeOpacity={0.8}>
        <View style={styles.posterContainer}>
          {item.poster_path ? (
            <Image
              source={{ uri: `https://image.tmdb.org/t/p/w500${item.poster_path}` }}
              style={styles.posterImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.posterPlaceholder, { backgroundColor: placeholderBg }]}>
              <Text style={styles.emojiPoster}>{emoji}</Text>
            </View>
          )}
          <View style={styles.rankBadge}>
            <Text style={styles.rankNumber}>{index + 1}</Text>
          </View>
        </View>
        <Text numberOfLines={1} style={styles.showcaseTitle}>{title}</Text>
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={10} color="#fbbf24" />
          <Text style={styles.ratingText}>
            {item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#040712" translucent={Platform.OS === 'android'} />

      {/* HEADER PRINCIPAL */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBadge} onPress={onLogout} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color="#ffffff" />
        </TouchableOpacity>

        <View style={{ flex: 1, marginLeft: 12, flexDirection: 'row', alignItems: 'center' }}>
          <Feather name="film" size={20} color="#3b82f6" style={{ marginRight: 6 }} />
          <Text style={styles.logoText}>
            Cine<Text style={styles.logoBlueText}>Track</Text>
          </Text>
        </View>

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

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" colors={['#3b82f6']} />
        }
      >
        
        {/* SEÇÃO: CONTINUAR ASSISTINDO (THE VAMPIRE DIARIES - LAYOUT ELEGANTE) */}
        <Text style={styles.sectionLabel}>CONTINUAR ASSISTINDO</Text>
        <View style={styles.heroCard}>
          <Image source={{ uri: POSTERS.vampireDiaries }} style={styles.heroImage} resizeMode="cover" />
          
          {/* Gradiente elegante por cima da imagem */}
          <View style={styles.heroGradientOverlay} />

          <View style={styles.heroContent}>
            <View style={styles.heroTopRow}>
              <View style={styles.tagBadgeSolid}>
                <Text style={styles.tagTextSolid}>SÉRIE</Text>
              </View>
              <View style={styles.tagBadgeOutline}>
                <Text style={styles.tagTextOutline}>THE CW</Text>
              </View>
            </View>

            <Text style={styles.heroTitle}>The Vampire Diaries</Text>
            <Text style={styles.heroSub}>T04 · E12 · A View to a Kill · 42 min</Text>

            <View style={styles.heroBottomRow}>
              <View style={{ flex: 1, marginRight: 15 }}>
                <View style={styles.mediaProgressBg}>
                  <View style={[styles.mediaProgressFill, { width: '45%' }]} />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                  <Text style={styles.progressPercentText}>45% assistido</Text>
                </View>
              </View>
              
              <TouchableOpacity style={styles.heroPlayButton} activeOpacity={0.8}>
                <Ionicons name="play" size={20} color="#ffffff" style={{ marginLeft: 3 }} />
                <Text style={styles.heroPlayText}>Assistir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* SEÇÃO: MEU DIÁRIO */}
        <Text style={styles.sectionLabel}>MEU DIÁRIO</Text>
        <View style={styles.diarioGrid}>
          {[
            { num: '47', unit: 'filmes', label: 'assistidos', color: '#3b82f6' },
            { num: '12', unit: 'séries', label: 'em andamento', color: '#22c55e' },
            { num: '139', unit: 'h', label: 'em tela', color: '#ef4444' },
          ].map((stat, idx) => (
            <View key={idx} style={styles.diarioCard}>
              <Text style={styles.diarioNum}>
                {stat.num} <Text style={styles.diarioUnit}>{stat.unit}</Text>
              </Text>
              <Text style={styles.diarioLabel}>{stat.label}</Text>
              <View style={[styles.diarioIndicator, { backgroundColor: stat.color }]} />
            </View>
          ))}
        </View>

        {/* SEÇÃO: FILMES EM ALTA (TMDB API) */}
        <Text style={styles.sectionLabel}>FILMES EM ALTA</Text>
        {loading && filmes.length === 0 ? (
          <View style={{ height: 180, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="small" color="#3b82f6" />
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
            {filmes.map((item, index) => (
              <MediaCard key={`movie-${item.id}`} item={item} index={index} isMovie={true} />
            ))}
          </ScrollView>
        )}

        {/* SEÇÃO: SÉRIES EM ALTA (TMDB API) */}
        <Text style={styles.sectionLabel}>SÉRIES EM ALTA</Text>
        {loading && series.length === 0 ? (
          <View style={{ height: 180, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="small" color="#3b82f6" />
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
            {series.map((item, index) => (
              <MediaCard key={`tv-${item.id}`} item={item} index={index} isMovie={false} />
            ))}
          </ScrollView>
        )}

        {/* SEÇÃO: CONEXÕES */}
        <Text style={styles.sectionLabel}>CONEXÕES</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.horizontalScroll, { marginBottom: 16 }]}>
          {[
            { name: 'Lucas', emoji: '😎', color: '#3b82f6', online: true },
            { name: 'Ana', emoji: '🎬', color: '#f43f5e', online: false },
            { name: 'Pedro', emoji: '🍿', color: '#a855f7', online: true },
            { name: 'Beatriz', emoji: '👻', color: '#eab308', online: false },
            { name: 'Mariana', emoji: '🎭', color: '#06b6d4', online: false },
          ].map((friend, idx) => (
            <View key={idx} style={styles.friendContainer}>
              <View style={[styles.friendAvatar, { backgroundColor: friend.color }]}>
                <Text style={styles.avatarLabelText}>{friend.emoji}</Text>
                {friend.online && <View style={styles.onlineDot} />}
              </View>
              <Text style={styles.friendName} numberOfLines={1}>{friend.name}</Text>
            </View>
          ))}
          
          <View style={styles.friendContainer}>
            <TouchableOpacity style={[styles.friendAvatar, { backgroundColor: '#1e293b', borderStyle: 'dashed', borderWidth: 1, borderColor: '#46526a' }]} activeOpacity={0.7}>
              <Feather name="users" size={16} color="#46526a" />
            </TouchableOpacity>
            <Text style={styles.friendName}>ver todos</Text>
          </View>
        </ScrollView>

        {/* REVIEWS DAS CONEXÕES (COM POSTERS REAIS FUNCIONANDO) */}
        <View style={styles.feedCard}>
          <View style={styles.feedHeader}>
            <View style={[styles.feedMiniAvatar, { backgroundColor: '#3b82f6' }]}>
              <Text style={{ fontSize: 10 }}>😎</Text>
            </View>
            <Text style={styles.feedHeaderText}>
              <Text style={styles.boldWhite}>Lucas</Text> avaliou <Text style={styles.boldWhite}>Scream VI</Text>
            </Text>
          </View>
          <View style={styles.feedContentRow}>
            <View style={styles.feedStarsRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Ionicons key={s} name="star" size={12} color="#fbbf24" style={{ marginRight: 2 }} />
              ))}
              <Text style={styles.feedTimeText}>· há 2h</Text>
            </View>
            {/* Poster Scream VI */}
            <Image source={{ uri: POSTERS.screamVI }} style={styles.feedMiniPoster} resizeMode="cover" />
          </View>
        </View>

        <View style={styles.feedCard}>
          <View style={styles.feedHeader}>
            <View style={[styles.feedMiniAvatar, { backgroundColor: '#a855f7' }]}>
              <Text style={{ fontSize: 10 }}>🍿</Text>
            </View>
            <Text style={styles.feedHeaderText}>
              <Text style={styles.boldWhite}>Pedro</Text> está assistindo <Text style={styles.boldWhite}>Severance</Text>
            </Text>
          </View>
          <View style={styles.feedContentRow}>
            <View style={styles.feedTagRow}>
              <Text style={styles.feedTagText}>T02 · E03</Text>
              <Text style={styles.feedTimeText}>· agora</Text>
              <View style={[styles.onlineDot, { position: 'relative', top: 0, right: 0, marginLeft: 6, bottom: 0, borderWidth: 0 }]} />
            </View>
            {/* Poster Severance */}
            <Image source={{ uri: POSTERS.severance }} style={styles.feedMiniPoster} resizeMode="cover" />
          </View>
        </View>

        {/* ÚLTIMOS REGISTROS DO USUÁRIO (POSTERS MAIORES) */}
        <Text style={styles.sectionLabel}>ÚLTIMOS REGISTROS</Text>
        
        {[
          {
            title: 'Dune: Part Two', date: 'hoje', stars: 5, poster: POSTERS.dunePartTwo,
            comment: '"Visualmente esmagador. Zimmer transcende mais uma vez."',
            tags: ['Paul Atreides', 'Hans Zimmer']
          },
          {
            title: 'Hereditary', date: 'ontem', stars: 4, poster: POSTERS.hereditary,
            comment: '"Toni Collette merecia o Oscar. Cena do jantar me assombra."',
            tags: []
          }
        ].map((log, idx) => (
          <View key={idx} style={[styles.logCard, idx === 1 && { marginBottom: 40 }]}>
            <View style={styles.logCardMain}>
              {/* Poster Maior */}
              <Image source={{ uri: log.poster }} style={styles.logPosterLarge} resizeMode="cover" />
              
              <View style={styles.logContent}>
                <View style={styles.logTitleRow}>
                  <Text style={styles.logMediaTitle} numberOfLines={1}>{log.title}</Text>
                  <Text style={styles.logDate}>{log.date}</Text>
                </View>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Ionicons key={s} name="star" size={12} color={s <= log.stars ? "#fbbf24" : "#334155"} style={{ marginRight: 2 }} />
                  ))}
                </View>
                <Text numberOfLines={3} style={styles.logComment}>{log.comment}</Text>
                {log.tags.length > 0 && (
                  <View style={styles.logTagsContainer}>
                    {log.tags.map((tag, tIdx) => (
                      <View key={tIdx} style={styles.logTag}>
                        <Text style={styles.logTagText}>• {tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          </View>
        ))}

      </ScrollView>

      {/* NAVEGAÇÃO INFERIOR */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity style={styles.tabItem} activeOpacity={0.7}>
          <Ionicons name="home" size={22} color="#3b82f6" />
          <Text style={[styles.tabLabel, { color: '#3b82f6' }]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} activeOpacity={0.7}>
          <Feather name="search" size={20} color="#46526a" />
          <Text style={styles.tabLabel}>Buscar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.centerAddButton} activeOpacity={0.85}>
          <Feather name="plus" size={24} color="#ffffff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} activeOpacity={0.7}>
          <MaterialCommunityIcons name="notebook-outline" size={22} color="#46526a" />
          <Text style={styles.tabLabel}>Diário</Text>
        </TouchableOpacity>

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
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight + 10) : 10,
    paddingBottom: 15,
    backgroundColor: 'rgba(4, 7, 18, 0.95)',
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    zIndex: 10,
  },
  logoText: { fontSize: 20, fontWeight: '800', color: '#ffffff', letterSpacing: -0.5 },
  logoBlueText: { color: '#3b82f6' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
    borderWidth: 1.5,
    borderColor: '#040712'
  },
  avatarButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 15, paddingBottom: 100 },

  sectionLabel: { color: '#64748b', fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginTop: 28, marginBottom: 12, textTransform: 'uppercase' },

  // --- NOVO LAYOUT: CONTINUAR ASSISTINDO (HERO CARD) ---
  heroCard: {
    width: '100%',
    height: 220,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 5,
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  heroGradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    // Simula um gradiente linear do transparente para o preto/azul escuro
    background: 'linear-gradient(to top, #040712 10%, rgba(4,7,18,0.4) 60%, transparent 100%)',
    backgroundColor: 'rgba(4, 7, 18, 0.3)', // Fallback
  },
  heroContent: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
  },
  heroTopRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  tagBadgeSolid: { backgroundColor: '#3b82f6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  tagTextSolid: { color: '#ffffff', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  tagBadgeOutline: { backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  tagTextOutline: { color: '#ffffff', fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  
  heroTitle: { 
    color: '#ffffff', 
    fontSize: 28, 
    fontWeight: '900', 
    letterSpacing: -0.5, 
    marginBottom: 4,
    textShadowColor: '#000', textShadowOffset: {width: 2, height: 2}, textShadowRadius: 4 
  },
  heroSub: { color: '#cbd5e1', fontSize: 13, marginBottom: 16, fontWeight: '500', textShadowColor: '#000', textShadowOffset: {width: 1, height: 1}, textShadowRadius: 2 },
  
  heroBottomRow: { flexDirection: 'row', alignItems: 'center' },
  heroPlayButton: { 
    flexDirection: 'row',
    backgroundColor: '#ffffff', 
    paddingHorizontal: 20, 
    paddingVertical: 10, 
    borderRadius: 30, 
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4
  },
  heroPlayText: { color: '#040712', fontSize: 14, fontWeight: '800', marginLeft: 6 },
  
  mediaProgressBg: { width: '100%', height: 6, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 3, overflow: 'hidden' },
  mediaProgressFill: { height: '100%', backgroundColor: '#3b82f6', borderRadius: 3 },
  progressPercentText: { color: '#ffffff', fontSize: 11, fontWeight: '600', textShadowColor: '#000', textShadowOffset: {width: 1, height: 1}, textShadowRadius: 2 },

  // MEU DIÁRIO
  diarioGrid: { flexDirection: 'row', gap: 10 },
  diarioCard: {
    flex: 1,
    height: 85,
    backgroundColor: '#0f1524',
    borderRadius: 14,
    padding: 12,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.02)'
  },
  diarioNum: { color: '#ffffff', fontSize: 20, fontWeight: 'bold' },
  diarioUnit: { fontSize: 11, color: '#64748b', fontWeight: '500' },
  diarioLabel: { color: '#64748b', fontSize: 10, marginTop: 4, fontWeight: '500' },
  diarioIndicator: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, opacity: 0.8 },

  // SHOWCASE HORIZONTAL (TMDB)
  horizontalScroll: { flexDirection: 'row', gap: 12, paddingVertical: 4 },
  showcaseCard: { width: CARD_WIDTH },
  posterContainer: {
    width: '100%',
    aspectRatio: 2 / 3,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 8,
    backgroundColor: '#0f1524',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  posterImage: { width: '100%', height: '100%' },
  posterPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  rankBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  rankNumber: { color: '#ffffff', fontSize: 12, fontWeight: '800' },
  emojiPoster: { fontSize: 28, opacity: 0.5 },
  showcaseTitle: { color: '#e2e8f0', fontSize: 12, fontWeight: '600', marginBottom: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { color: '#94a3b8', fontSize: 10, fontWeight: '700' },

  // CONEXÕES
  friendContainer: { alignItems: 'center', width: 64, marginRight: 4 },
  friendAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 6,
  },
  avatarLabelText: { fontSize: 22 },
  onlineDot: { position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: '#22c55e', borderWidth: 2.5, borderColor: '#040712' },
  friendName: { color: '#94a3b8', fontSize: 11, fontWeight: '500', textAlign: 'center' },

  // FEED CARDS
  feedCard: {
    width: '100%',
    backgroundColor: '#0f1524',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.02)',
  },
  feedHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  feedMiniAvatar: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  feedHeaderText: { color: '#94a3b8', fontSize: 13 },
  boldWhite: { color: '#ffffff', fontWeight: '600' },
  feedContentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  feedStarsRow: { flexDirection: 'row', alignItems: 'center' },
  feedTimeText: { color: '#64748b', fontSize: 11, marginLeft: 6 },
  feedMiniPoster: { width: 36, height: 54, borderRadius: 6 }, // Tamanho levemente aumentado
  feedTagRow: { flexDirection: 'row', alignItems: 'center' },
  feedTagText: { color: '#94a3b8', fontSize: 11, backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, fontWeight: '600' },

  // ÚLTIMOS REGISTROS (POSTERS MAIORES)
  logCard: {
    width: '100%',
    backgroundColor: '#0f1524',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  logCardMain: { flexDirection: 'row', gap: 16 },
  logPosterLarge: { width: 75, height: 112, borderRadius: 10 }, // BEM MAIOR AGORA (antes era 50x75)
  logContent: { flex: 1, justifyContent: 'center' },
  logTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  logMediaTitle: { color: '#ffffff', fontSize: 16, fontWeight: '700', flex: 1, paddingRight: 8 },
  logDate: { color: '#64748b', fontSize: 11, fontWeight: '500' },
  logComment: { color: '#cbd5e1', fontSize: 13, marginTop: 8, fontStyle: 'italic', lineHeight: 19 },
  logTagsContainer: { flexDirection: 'row', gap: 6, marginTop: 12, flexWrap: 'wrap' },
  logTag: { backgroundColor: 'rgba(34, 197, 94, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  logTagText: { color: '#4ade80', fontSize: 10, fontWeight: '600' },

  // TAB BAR INFERIOR
  bottomTabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: 'rgba(4, 7, 18, 0.95)',
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 20 : 5,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.5, shadowRadius: 10 },
      android: { elevation: 10 }
    })
  },
  tabItem: { alignItems: 'center', justifyContent: 'center', flex: 1, height: '100%' },
  tabLabel: { fontSize: 10, color: '#64748b', marginTop: 4, fontWeight: '600' },
  centerAddButton: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    top: -15,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 4,
    borderColor: '#040712'
  },
});