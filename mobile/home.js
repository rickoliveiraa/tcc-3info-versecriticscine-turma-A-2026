import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  StyleSheet, Text, View, StatusBar, TouchableOpacity, SafeAreaView,
  ScrollView, Image, Platform, Dimensions, ActivityIndicator, RefreshControl,
  Animated, Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather, MaterialCommunityIcons, AntDesign } from '@expo/vector-icons';
import { getFilmesEmAlta, getSeriesEmAlta } from './services';

const COLORS = {
  bg: '#000000',
  surface: '#0a0a0a',
  surfaceElevated: '#141414',
  surfaceHigh: '#1a1a1a',
  border: 'rgba(255, 255, 255, 0.08)',
  borderSubtle: 'rgba(255, 255, 255, 0.04)',
  primary: '#3b82f6',
  primaryLight: '#60a5fa',
  accent: '#fbbf24',
  text: '#ffffff',
  textPrimary: '#f5f5f5',
  textSecondary: '#a3a3a3',
  textTertiary: '#737373',
  success: '#22c55e',
  purple: '#a855f7',
  pink: '#ec4899',
};

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 64) / 3;

// 🎬 POSTERS REAIS DO TMDB (IDs oficiais)
const TMDB_POSTERS = {
  screamVI: '/wWba3TaojhK7NdycRhoQpsG0FaH.jpg',      // Scream VI
  severance: '/lFf6LLrQjYldcZItzOkGmMMigP7.jpg',    // Severance
  tvd: '/gbpbzM07UxwP9Ur8Q9sNqkFfNlC.jpg',          // The Vampire Diaries
};

export default function Home({ onLogout }) {
  const [filmes, setFilmes] = useState([]);
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  const carregarDadosApi = useCallback(async () => {
    try {
      const [respostaFilmes, respostaSeries] = await Promise.all([getFilmesEmAlta(), getSeriesEmAlta()]);
      setFilmes((respostaFilmes?.results || []).slice(0, 10));
      setSeries((respostaSeries?.results || []).slice(0, 10));
    } catch (error) { 
      console.error('Erro API:', error); 
    } finally { 
      setLoading(false); 
      setRefreshing(false); 
    }
  }, []);

  useEffect(() => { carregarDadosApi(); }, [carregarDadosApi]);

  const onRefresh = useCallback(() => { 
    setRefreshing(true); 
    carregarDadosApi(); 
  }, [carregarDadosApi]);

  const StarRating = ({ rating, size = 11, color = COLORS.accent }) => (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((s) => (
        <AntDesign key={s} name="star" size={size} color={s <= Math.round(rating / 2) ? color : '#262626'} />
      ))}
    </View>
  );

  const MediaCard = ({ item, index, isMovie }) => {
    const title = isMovie ? (item.title || item.original_title) : (item.name || item.original_name);
    const cardOpacity = useRef(new Animated.Value(0)).current;
    
    useEffect(() => {
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 500,
        delay: index * 100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }, []);

    return (
      <Animated.View style={[styles.mediaCardWrapper, { opacity: cardOpacity }]}>
        <TouchableOpacity style={styles.mediaCard} activeOpacity={0.85}>
          <View style={styles.posterContainer}>
            {item.poster_path ? (
              <>
                <Image source={{ uri: `https://image.tmdb.org/t/p/w342${item.poster_path}` }} style={styles.posterImage} resizeMode="cover" />
                <View style={styles.posterOverlay} />
              </>
            ) : (
              <View style={styles.posterPlaceholder}>
                <Ionicons name={isMovie ? "film" : "tv"} size={28} color={COLORS.textTertiary} />
              </View>
            )}
            <View style={styles.rankBadge}>
              <Text style={styles.rankNumber}>{index + 1}</Text>
            </View>
          </View>
          <Text numberOfLines={1} style={styles.mediaTitle}>{title}</Text>
          <View style={styles.mediaMeta}>
            <View style={styles.ratingContainer}>
              <AntDesign name="star" size={10} color={COLORS.accent} />
              <Text style={styles.ratingText}>{item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const SectionWithTitle = ({ title }) => (
    <View style={styles.sectionTitleContainer}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionLine} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} translucent />
      
      {/* HEADER FIXO */}
      <View style={styles.headerFixed}>
        <LinearGradient colors={['rgba(0,0,0,0.95)', 'rgba(0,0,0,0.8)']} style={styles.headerGradient}>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backButton} onPress={onLogout} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={22} color={COLORS.text} />
            </TouchableOpacity>
            
            <View style={styles.logoContainer}>
              <Feather name="film" size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
              <Text style={styles.logoText}>Cine<Text style={{ color: COLORS.primary }}>Track</Text></Text>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
                <Feather name="bell" size={18} color={COLORS.text} />
                <View style={styles.badge}><Text style={styles.badgeText}>3</Text></View>
              </TouchableOpacity>
              <View style={styles.avatar}><Text style={styles.avatarText}>G</Text></View>
            </View>
          </View>
        </LinearGradient>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} colors={[COLORS.primary]} />}
      >
        
        {/* CONTINUAR ASSISTINDO - THE VAMPIRE DIARIES (LANDSCAPE) */}
        <SectionWithTitle title="CONTINUAR ASSISTINDO" />
        
        <Animated.View style={[styles.heroSection, { opacity: fadeAnim }]}>
          <View style={styles.heroCardLandscape}>
            {/* Poster de fundo do TVD */}
            <Image 
              source={{ uri: `https://image.tmdb.org/t/p/w780${TMDB_POSTERS.tvd}` }} 
              style={styles.heroImageLandscape} 
              resizeMode="cover" 
            />
            <LinearGradient 
              colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.95)']} 
              style={styles.heroGradientLandscape}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
            />
            
            <View style={styles.heroContentLandscape}>
              {/* Estrelas azuis no topo */}
              <View style={styles.heroStarsRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <AntDesign 
                    key={s} 
                    name="star" 
                    size={14} 
                    color={s <= 4 ? COLORS.primary : 'rgba(59, 130, 246, 0.3)'}
                    style={{ marginRight: 4 }}
                  />
                ))}
              </View>

              {/* Badges */}
              <View style={styles.heroBadgesRow}>
                <View style={styles.heroBadgePill}>
                  <MaterialCommunityIcons name="television" size={10} color="#fff" />
                  <Text style={styles.heroBadgePillText}>SÉRIE</Text>
                  <Text style={styles.heroBadgePillDot}>•</Text>
                  <Text style={styles.heroBadgePillText}>THE CW</Text>
                </View>
              </View>
              
              {/* Título */}
              <Text style={styles.heroTitleLandscape}>The Vampire Diaries</Text>
              <Text style={styles.heroMetaLandscape}>T04 · E12 · A View to a Kill · 42 min</Text>
              
              {/* Barra de progresso */}
              <View style={styles.heroProgressRow}>
                <View style={styles.progressBarLandscape}>
                  <View style={[styles.progressFillLandscape, { width: '62%' }]} />
                </View>
                <Text style={styles.progressTextLandscape}>62% assistido</Text>
              </View>
            </View>

            {/* Botão play circular azul à direita */}
            <TouchableOpacity style={styles.playButtonCircle} activeOpacity={0.85}>
              <Ionicons name="play" size={24} color="#fff" style={{ marginLeft: 2 }} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* MEU DIÁRIO */}
        <SectionWithTitle title="MEU DIÁRIO" />
        <View style={styles.statsGrid}>
          {[
            { num: '47', label: 'filmes', sub: 'assistidos', color: COLORS.primary, icon: 'film' },
            { num: '12', label: 'séries', sub: 'em andamento', color: COLORS.success, icon: 'tv' },
            { num: '139', label: 'horas', sub: 'em tela', color: COLORS.pink, icon: 'clock' },
          ].map((stat, idx) => (
            <View key={idx} style={styles.statCard}>
              <View style={styles.statContent}>
                <Feather name={stat.icon} size={18} color={stat.color} style={{ marginBottom: 12 }} />
                <Text style={styles.statNumber}>{stat.num}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
                <Text style={styles.statSub}>{stat.sub}</Text>
              </View>
              <View style={[styles.statAccent, { backgroundColor: stat.color }]} />
            </View>
          ))}
        </View>

        {/* FILMES EM ALTA */}
        <SectionWithTitle title="FILMES EM ALTA" />
        {loading ? (
          <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 40 }} />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
            {filmes.map((item, index) => <MediaCard key={`m-${item.id}`} item={item} index={index} isMovie={true} />)}
          </ScrollView>
        )}

        {/* SÉRIES EM ALTA */}
        <SectionWithTitle title="SÉRIES EM ALTA" />
        {loading ? (
          <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 40 }} />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
            {series.map((item, index) => <MediaCard key={`s-${item.id}`} item={item} index={index} isMovie={false} />)}
          </ScrollView>
        )}

        {/* CONEXÕES */}
        <SectionWithTitle title="CONEXÕES" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.friendsScroll}>
          {[
            { name: 'Lucas', initial: 'L', color: '#3b82f6', online: true },
            { name: 'Ana', initial: 'A', color: '#ec4899', online: false },
            { name: 'Pedro', initial: 'P', color: '#a855f7', online: true },
            { name: 'Beatriz', initial: 'B', color: '#f59e0b', online: false },
            { name: 'Mariana', initial: 'M', color: '#06b6d4', online: true },
          ].map((friend, idx) => (
            <View key={idx} style={styles.friendItem}>
              <View style={[styles.friendAvatar, { backgroundColor: friend.color }]}>
                <Text style={styles.friendInitial}>{friend.initial}</Text>
                {friend.online && <View style={styles.onlineIndicator} />}
              </View>
              <Text style={styles.friendName} numberOfLines={1}>{friend.name}</Text>
            </View>
          ))}
          <TouchableOpacity style={styles.addFriend} activeOpacity={0.7}>
            <View style={styles.addFriendAvatar}>
              <Feather name="user-plus" size={20} color={COLORS.textTertiary} />
            </View>
            <Text style={styles.addFriendText}>ver todos</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* ATIVIDADE RECENTE - COM POSTERS REAIS DO TMDB */}
        <SectionWithTitle title="ATIVIDADE RECENTE" />
        
        <View style={styles.feedCard}>
          <View style={styles.feedHeader}>
            <View style={[styles.feedAvatar, { backgroundColor: COLORS.primary }]}><Text style={styles.feedAvatarText}>L</Text></View>
            <View style={styles.feedInfo}>
              <Text style={styles.feedText}><Text style={styles.feedBold}>Lucas</Text> avaliou <Text style={styles.feedBold}>Scream VI</Text></Text>
              <Text style={styles.feedTime}>há 2 horas</Text>
            </View>
          </View>
          <View style={styles.feedContent}>
            <Image 
              source={{ uri: `https://image.tmdb.org/t/p/w200${TMDB_POSTERS.screamVI}` }} 
              style={styles.feedPoster} 
              resizeMode="cover" 
            />
            <View style={styles.feedDetails}>
              <Text style={styles.feedMovieTitle}>Scream VI</Text>
              <StarRating rating={5} size={12} />
              <Text style={styles.feedReview}>"A melhor franquia da década. Gostei muito da evolução da personagem."</Text>
            </View>
          </View>
        </View>

        <View style={styles.feedCard}>
          <View style={styles.feedHeader}>
            <View style={[styles.feedAvatar, { backgroundColor: COLORS.purple }]}><Text style={styles.feedAvatarText}>P</Text></View>
            <View style={styles.feedInfo}>
              <Text style={styles.feedText}><Text style={styles.feedBold}>Pedro</Text> está assistindo <Text style={styles.feedBold}>Severance</Text></Text>
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>AO VIVO</Text>
              </View>
            </View>
          </View>
          <View style={styles.feedContent}>
            <Image 
              source={{ uri: `https://image.tmdb.org/t/p/w200${TMDB_POSTERS.severance}` }} 
              style={styles.feedPoster} 
              resizeMode="cover" 
            />
            <View style={styles.feedDetails}>
              <Text style={styles.feedMovieTitle}>Severance</Text>
              <Text style={styles.feedEpisode}>T02 · E03 · Who Is Alive?</Text>
            </View>
          </View>
        </View>

        {/* SEUS REGISTROS */}
        <SectionWithTitle title="SEUS REGISTROS" />
        
        {filmes.slice(0, 3).map((log, idx) => (
          <View key={idx} style={styles.logCardPremium}>
            <View style={styles.logHeaderPremium}>
              {log.poster_path ? (
                <Image 
                  source={{ uri: `https://image.tmdb.org/t/p/w200${log.poster_path}` }} 
                  style={styles.logPosterPremium} 
                  resizeMode="cover" 
                />
              ) : (
                <View style={[styles.logPosterPremium, styles.logPosterPlaceholder]}>
                  <Ionicons name="film" size={40} color={COLORS.textTertiary} />
                </View>
              )}
              <View style={styles.logInfoPremium}>
                <View style={styles.logTitleRow}>
                  <Text style={styles.logTitlePremium} numberOfLines={1}>{log.title || log.original_title}</Text>
                  <View style={styles.logRatingBadge}>
                    <AntDesign name="star" size={10} color={COLORS.accent} />
                    <Text style={styles.logRatingText}>{log.vote_average.toFixed(1)}</Text>
                  </View>
                </View>
                <Text style={styles.logDatePremium}>hoje</Text>
                <StarRating rating={Math.round(log.vote_average / 2)} size={11} />
                <View style={styles.logTagsPremium}>
                  <View style={styles.logTagPremium}><Text style={styles.logTagTextPremium}>Filme</Text></View>
                </View>
              </View>
            </View>
            
            <View style={styles.logCommentPremium}>
              <Text style={styles.logCommentTextPremium}>
                {log.overview ? log.overview.substring(0, 120) + '...' : 'Adicionado ao diário.'}
              </Text>
            </View>
            
            <View style={styles.logActionsPremium}>
              <TouchableOpacity style={styles.logActionPremium}>
                <Ionicons name="heart-outline" size={16} color={COLORS.textTertiary} />
                <Text style={styles.logActionTextPremium}>{Math.floor(Math.random() * 50)}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.logActionPremium}>
                <Feather name="message-circle" size={16} color={COLORS.textTertiary} />
                <Text style={styles.logActionTextPremium}>{Math.floor(Math.random() * 10)}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.logActionPremium}>
                <Feather name="share-2" size={16} color={COLORS.textTertiary} />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* TAB BAR */}
      <View style={styles.tabBar}>
        <LinearGradient colors={['rgba(10,10,10,0.98)', 'rgba(0,0,0,0.98)']} style={styles.tabGradient}>
          <TouchableOpacity style={styles.tabItem} activeOpacity={0.7}>
            <Ionicons name="home" size={24} color={COLORS.primary} />
            <Text style={[styles.tabLabel, { color: COLORS.primary }]}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} activeOpacity={0.7}>
            <Feather name="search" size={22} color={COLORS.textTertiary} />
            <Text style={styles.tabLabel}>Buscar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton} activeOpacity={0.85}>
            <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.addButtonGradient} start={{x: 0, y: 0}} end={{x: 1, y: 1}}>
              <Feather name="plus" size={26} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} activeOpacity={0.7}>
            <MaterialCommunityIcons name="notebook-outline" size={24} color={COLORS.textTertiary} />
            <Text style={styles.tabLabel}>Diário</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} activeOpacity={0.7} onPress={onLogout}>
            <Feather name="user" size={22} color={COLORS.textTertiary} />
            <Text style={styles.tabLabel}>Perfil</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  
  // Header Fixo
  headerFixed: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 },
  headerGradient: { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 10, paddingBottom: 15 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24 },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  logoContainer: { flexDirection: 'row', alignItems: 'center' },
  logoText: { fontSize: 22, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  badge: { position: 'absolute', top: 6, right: 6, width: 16, height: 16, borderRadius: 8, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.surface },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  avatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 16 },

  scrollContent: { paddingHorizontal: 24, paddingTop: 90 },
  sectionTitleContainer: { marginTop: 32, marginBottom: 16 },
  sectionTitle: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8 },
  sectionLine: { height: 1, backgroundColor: COLORS.border },
  
  // HERO CARD LANDSCAPE - THE VAMPIRE DIARIES
  heroSection: { marginTop: 10 },
  heroCardLandscape: { 
    width: '100%', 
    height: 220, 
    borderRadius: 20, 
    overflow: 'hidden', 
    position: 'relative',
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  heroImageLandscape: { 
    ...StyleSheet.absoluteFillObject, 
    width: '100%', 
    height: '100%' 
  },
  heroGradientLandscape: { 
    ...StyleSheet.absoluteFillObject 
  },
  heroContentLandscape: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 70,
    padding: 18,
    paddingBottom: 18,
  },
  heroStarsRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 10 
  },
  heroBadgesRow: { marginBottom: 8 },
  heroBadgePill: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(59, 130, 246, 0.25)', 
    paddingHorizontal: 12, 
    paddingVertical: 5, 
    borderRadius: 20, 
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.4)',
    gap: 6,
  },
  heroBadgePillText: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  heroBadgePillDot: { color: 'rgba(255,255,255,0.5)', fontSize: 10 },
  heroTitleLandscape: { 
    color: '#fff', 
    fontSize: 26, 
    fontWeight: '800', 
    letterSpacing: -0.5, 
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  heroMetaLandscape: { 
    color: COLORS.textSecondary, 
    fontSize: 13, 
    marginBottom: 12, 
    fontWeight: '500' 
  },
  heroProgressRow: { marginBottom: 4 },
  progressBarLandscape: { 
    height: 3, 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    borderRadius: 2, 
    overflow: 'hidden', 
    marginBottom: 6 
  },
  progressFillLandscape: { 
    height: '100%', 
    backgroundColor: COLORS.primary, 
    borderRadius: 2 
  },
  progressTextLandscape: { 
    color: COLORS.primaryLight, 
    fontSize: 11, 
    fontWeight: '600' 
  },
  playButtonCircle: { 
    position: 'absolute', 
    right: 18, 
    bottom: 18, 
    width: 52, 
    height: 52, 
    borderRadius: 26, 
    backgroundColor: COLORS.primary, 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },

  // Stats
  statsGrid: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, backgroundColor: COLORS.surfaceElevated, borderRadius: 20, padding: 20, position: 'relative', overflow: 'hidden', borderWidth: 1, borderColor: COLORS.borderSubtle },
  statContent: { position: 'relative', zIndex: 2 },
  statNumber: { color: '#fff', fontSize: 32, fontWeight: '800', marginBottom: 4 },
  statLabel: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '600', marginBottom: 2 },
  statSub: { color: COLORS.textTertiary, fontSize: 12, fontWeight: '400' },
  statAccent: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3 },

  // Media Cards
  horizontalScroll: { gap: 12 },
  mediaCardWrapper: { width: CARD_WIDTH },
  mediaCard: { backgroundColor: COLORS.surfaceElevated, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.borderSubtle },
  posterContainer: { width: '100%', aspectRatio: 2/3, position: 'relative', overflow: 'hidden' },
  posterImage: { width: '100%', height: '100%' },
  posterOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.2)' },
  posterPlaceholder: { width: '100%', height: '100%', backgroundColor: COLORS.surfaceHigh, justifyContent: 'center', alignItems: 'center' },
  rankBadge: { position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  rankNumber: { color: '#fff', fontSize: 12, fontWeight: '800' },
  mediaTitle: { color: '#fff', fontSize: 14, fontWeight: '600', paddingHorizontal: 14, paddingVertical: 12 },
  mediaMeta: { paddingHorizontal: 14, paddingBottom: 14 },
  ratingContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { color: COLORS.accent, fontSize: 12, fontWeight: '600' },

  // Friends
  friendsScroll: { flexDirection: 'row', gap: 16, marginTop: 4 },
  friendItem: { alignItems: 'center', width: 64 },
  friendAvatar: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', position: 'relative', marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  friendInitial: { color: '#fff', fontSize: 20, fontWeight: '800' },
  onlineIndicator: { position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.success, borderWidth: 2.5, borderColor: COLORS.surface },
  friendName: { color: COLORS.textTertiary, fontSize: 11, fontWeight: '500', textAlign: 'center' },
  addFriend: { alignItems: 'center', width: 64 },
  addFriendAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.surfaceElevated, borderWidth: 1.5, borderColor: COLORS.border, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  addFriendText: { color: COLORS.textTertiary, fontSize: 10, fontWeight: '500' },

  // Feed Cards
  feedCard: { backgroundColor: COLORS.surfaceElevated, borderRadius: 20, padding: 18, marginTop: 12, borderWidth: 1, borderColor: COLORS.borderSubtle },
  feedHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  feedAvatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  feedAvatarText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  feedInfo: { flex: 1 },
  feedText: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 20 },
  feedBold: { color: COLORS.textPrimary, fontWeight: '600' },
  feedTime: { color: COLORS.textTertiary, fontSize: 12, marginTop: 2 },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(34, 197, 94, 0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start', marginTop: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.success, marginRight: 4 },
  liveText: { color: COLORS.success, fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  feedContent: { flexDirection: 'row', gap: 14, marginTop: 12 },
  feedPoster: { width: 60, height: 90, borderRadius: 12 },
  feedDetails: { flex: 1, justifyContent: 'center' },
  feedMovieTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 6 },
  feedEpisode: { color: COLORS.textTertiary, fontSize: 13, marginBottom: 8 },
  feedReview: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 20, fontStyle: 'italic', marginTop: 8 },

  // Log Cards
  logCardPremium: { backgroundColor: COLORS.surfaceElevated, borderRadius: 20, padding: 18, marginTop: 12, borderWidth: 1, borderColor: COLORS.borderSubtle },
  logHeaderPremium: { flexDirection: 'row', marginBottom: 14 },
  logPosterPremium: { width: 70, height: 105, borderRadius: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
  logPosterPlaceholder: { backgroundColor: COLORS.surfaceHigh, justifyContent: 'center', alignItems: 'center' },
  logInfoPremium: { flex: 1, marginLeft: 14 },
  logTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  logTitlePremium: { color: '#fff', fontSize: 16, fontWeight: '700', flex: 1, marginRight: 8 },
  logRatingBadge: { flexDirection: 'row', backgroundColor: 'rgba(251, 191, 36, 0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignItems: 'center', gap: 4 },
  logRatingText: { color: COLORS.accent, fontSize: 11, fontWeight: '700' },
  logDatePremium: { color: COLORS.textTertiary, fontSize: 12, marginBottom: 8 },
  logTagsPremium: { flexDirection: 'row', gap: 6, marginTop: 10 },
  logTagPremium: { backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: COLORS.borderSubtle },
  logTagTextPremium: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '500' },
  logCommentPremium: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: 14, marginBottom: 12 },
  logCommentTextPremium: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 20, fontStyle: 'italic' },
  logActionsPremium: { flexDirection: 'row', gap: 20, borderTopWidth: 1, borderTopColor: COLORS.borderSubtle, paddingTop: 12 },
  logActionPremium: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logActionTextPremium: { color: COLORS.textTertiary, fontSize: 12, fontWeight: '600' },

  // Tab Bar
  tabBar: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  tabGradient: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingBottom: Platform.OS === 'ios' ? 24 : 10, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
  tabItem: { alignItems: 'center', justifyContent: 'center', flex: 1, gap: 4 },
  addButton: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', top: -20, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 10, borderWidth: 4, borderColor: COLORS.bg },
  addButtonGradient: { width: '100%', height: '100%', borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
  tabLabel: { fontSize: 11, fontWeight: '600' },

  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
});