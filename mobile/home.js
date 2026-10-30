import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import {
  Ionicons,
  Feather,
  MaterialCommunityIcons,
  AntDesign,
} from '@expo/vector-icons';

import { getFilmesEmAlta, getSeriesEmAlta } from './services';

const LOGO_CINETRACK = require('./assets/logo-cinetrack.png');

const COLORS = {
  bg: '#050608',
  surface: '#0D0F13',
  elevated: '#12151B',
  border: 'rgba(255,255,255,0.08)',
  blue: '#3B82F6',
  blueLight: '#60A5FA',
  text: '#F5F7FA',
  secondary: '#9CA3AF',
  muted: '#687386',
  green: '#22C55E',
  yellow: '#FBBF24',
  pink: '#EC4899',
};

const { width } = Dimensions.get('window');
const CARD_WIDTH = Math.min(142, Math.max(112, (width - 76) / 3));
const TMDB_IMAGE = 'https://image.tmdb.org/t/p/w500';

const nomeUsuario = usuario =>
  usuario?.username ||
  usuario?.nome ||
  usuario?.name ||
  usuario?.email?.split('@')?.[0] ||
  'Cinéfilo';

const iniciais = nome =>
  String(nome || 'C')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase() || '')
    .join('') || 'C';

const formatarData = valor => {
  if (!valor) return 'Recentemente';

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) return 'Recentemente';

  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });
};

export default function Home({
  usuario = null,
  onLogout,
  onAbrirBusca,
  onAbrirDiario,
  onAbrirPerfil,
  onAdicionar,
}) {
  const [filmes, setFilmes] = useState([]);
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState('Home');

  const fade = useRef(new Animated.Value(0)).current;

  const nome = nomeUsuario(usuario);

  const avatarUrl =
    usuario?.avatar_url ||
    usuario?.avatar ||
    usuario?.foto ||
    null;

  const stats = usuario?.stats || usuario?.estatisticas || {};

  const registros = Array.isArray(usuario?.registros)
    ? usuario.registros
    : [];

  const atividades = Array.isArray(usuario?.atividades)
    ? usuario.atividades
    : [];

  const conexoes = Array.isArray(usuario?.conexoes)
    ? usuario.conexoes
    : [];

  const totalFilmes = Number(
    stats.filmes_assistidos ?? stats.filmes ?? 0
  );

  const totalSeries = Number(
    stats.series_em_andamento ?? stats.series ?? 0
  );

  const totalHoras = Number(
    stats.horas_assistidas ?? stats.horas ?? 0
  );

  const carregarCatalogo = useCallback(async () => {
    try {
      const [f, s] = await Promise.all([
        getFilmesEmAlta(),
        getSeriesEmAlta(),
      ]);

      setFilmes(
        Array.isArray(f?.results)
          ? f.results.slice(0, 10)
          : []
      );

      setSeries(
        Array.isArray(s?.results)
          ? s.results.slice(0, 10)
          : []
      );
    } catch (e) {
      console.warn('Não foi possível carregar o catálogo:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 650,
      useNativeDriver: true,
    }).start();

    carregarCatalogo();
  }, [carregarCatalogo, fade]);

  const atualizar = useCallback(() => {
    setRefreshing(true);
    carregarCatalogo();
  }, [carregarCatalogo]);

  const abrirAba = (aba, callback) => {
    setAbaAtiva(aba);

    if (callback) {
      callback();
    } else if (aba !== 'Home') {
      Alert.alert(
        aba,
        'Esta área será conectada à tela correspondente na próxima etapa do desenvolvimento.'
      );
    }
  };

  const renderTituloSecao = titulo => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{titulo}</Text>
      <View style={styles.sectionRule} />
    </View>
  );

  const renderMidias = (lista, tipo) => {
    if (loading) {
      return (
        <ActivityIndicator
          color={COLORS.blue}
          style={{ marginVertical: 28 }}
        />
      );
    }

    if (!lista.length) {
      return (
        <Text style={styles.emptyText}>
          Não foi possível carregar o catálogo.
        </Text>
      );
    }

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalList}
      >
        {lista.map((item, index) => {
          const titulo =
            tipo === 'filme'
              ? item.title || item.original_title
              : item.name || item.original_name;

          return (
            <TouchableOpacity
              key={`${tipo}-${item.id}`}
              activeOpacity={0.85}
              style={styles.mediaCard}
            >
              {item.poster_path ? (
                <Image
                  source={{
                    uri: `${TMDB_IMAGE}${item.poster_path}`,
                  }}
                  style={styles.poster}
                />
              ) : (
                <View
                  style={[
                    styles.poster,
                    styles.posterPlaceholder,
                  ]}
                >
                  <Ionicons
                    name={tipo === 'filme' ? 'film' : 'tv'}
                    size={30}
                    color={COLORS.muted}
                  />
                </View>
              )}

              <Text
                numberOfLines={1}
                style={styles.mediaTitle}
              >
                {titulo || 'Sem título'}
              </Text>

              <View style={styles.ratingRow}>
                <AntDesign
                  name="star"
                  size={11}
                  color={COLORS.yellow}
                />
                <Text style={styles.rating}>
                  {Number(item.vote_average || 0).toFixed(1)}
                </Text>
              </View>

              <View style={styles.rank}>
                <Text style={styles.rankText}>
                  {index + 1}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  const renderRegistro = (item, index) => {
    const titulo =
      item.titulo ||
      item.title ||
      item.media_title ||
      'Obra sem título';

    const poster =
      item.poster_url ||
      item.poster ||
      item.poster_path;

    const imagem = poster
      ? String(poster).startsWith('http')
        ? poster
        : `${TMDB_IMAGE}${poster}`
      : null;

    const nota = item.nota ?? item.rating;

    return (
      <View
        key={item.id || `${titulo}-${index}`}
        style={styles.recordCard}
      >
        {imagem ? (
          <Image
            source={{ uri: imagem }}
            style={styles.recordPoster}
          />
        ) : (
          <View
            style={[
              styles.recordPoster,
              styles.posterPlaceholder,
            ]}
          >
            <Ionicons
              name="film-outline"
              size={25}
              color={COLORS.muted}
            />
          </View>
        )}

        <View style={styles.recordInfo}>
          <Text
            style={styles.recordTitle}
            numberOfLines={1}
          >
            {titulo}
          </Text>

          <Text style={styles.recordDate}>
            {formatarData(
              item.created_at ||
              item.data ||
              item.watched_at
            )}
          </Text>

          {nota !== undefined && nota !== null ? (
            <Text style={styles.recordRating}>
              ★ {nota}/5
            </Text>
          ) : (
            <Text style={styles.recordDescription}>
              Registro no diário
            </Text>
          )}

          {!!(
            item.review ||
            item.comentario ||
            item.comment
          ) && (
            <Text
              style={styles.recordReview}
              numberOfLines={2}
            >
              {item.review ||
                item.comentario ||
                item.comment}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.bg}
        translucent={false}
      />

      {/* CABEÇALHO DA MARCA */}

      <View style={styles.header}>
        <View style={styles.brandContainer}>
          <View style={styles.logoContainer}>
            <Image
              source={LOGO_CINETRACK}
              style={styles.headerLogo}
              resizeMode="contain"
              accessibilityLabel="Logo CineTrack"
            />
          </View>

          <View style={styles.brandTextContainer}>
            <Text style={styles.brandName}>
              CINE<Text style={styles.brandNameBlue}>TRACK</Text>
            </Text>

            <Text style={styles.brandSubtitle}>
              SEU UNIVERSO AUDIOVISUAL
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() =>
              Alert.alert(
                'Notificações',
                'Você não tem notificações novas.'
              )
            }
            accessibilityLabel="Notificações"
          >
            <Feather
              name="bell"
              size={19}
              color={COLORS.text}
            />
            <View style={styles.notificationDot} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.avatarSmall}
            onPress={() =>
              abrirAba('Perfil', onAbrirPerfil)
            }
          >
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={styles.avatarImage}
              />
            ) : (
              <Text style={styles.avatarInitial}>
                {iniciais(nome)}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={atualizar}
            tintColor={COLORS.blue}
          />
        }
        style={{ opacity: fade }}
      >
        <View style={styles.welcome}>
          <Text style={styles.eyebrow}>
            SEU UNIVERSO AUDIOVISUAL
          </Text>

          <Text style={styles.greeting}>
            Olá,{' '}
            <Text style={styles.greetingName}>
              {nome}
            </Text>
          </Text>

          <Text style={styles.welcomeSub}>
            Continue explorando suas histórias favoritas.
          </Text>
        </View>

        {renderTituloSecao('CONTINUAR ASSISTINDO')}

        <View style={styles.heroCard}>
          <LinearGradient
            colors={['#17113B', '#0D1424', '#0B0D12']}
            style={StyleSheet.absoluteFillObject}
          />

          <View style={styles.heroTop}>
            <View style={styles.heroStars}>
              {[1, 2, 3, 4, 5].map(n => (
                <AntDesign
                  key={n}
                  name="star"
                  size={13}
                  color={
                    n < 5
                      ? COLORS.blueLight
                      : '#35405A'
                  }
                />
              ))}
            </View>

            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>
                SEU DIÁRIO
              </Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>
            Seu próximo episódio começa aqui.
          </Text>

          <Text style={styles.heroSub}>
            Adicione filmes e séries ao seu diário para acompanhar seu progresso.
          </Text>

          <TouchableOpacity
            style={styles.heroAction}
            onPress={() =>
              abrirAba('Adicionar', onAdicionar)
            }
          >
            <Ionicons
              name="play"
              size={19}
              color="#fff"
            />
          </TouchableOpacity>
        </View>

        {renderTituloSecao('MEU DIÁRIO')}

        <View style={styles.statsGrid}>
          {[
            {
              value: totalFilmes,
              label: 'filmes',
              sub: 'assistidos',
              color: COLORS.blue,
              icon: 'film',
            },
            {
              value: totalSeries,
              label: 'séries',
              sub: 'em andamento',
              color: COLORS.green,
              icon: 'tv',
            },
            {
              value: totalHoras,
              label: 'horas',
              sub: 'em tela',
              color: COLORS.pink,
              icon: 'clock',
            },
          ].map((stat, i) => (
            <View
              key={i}
              style={styles.statCard}
            >
              <Feather
                name={stat.icon}
                size={17}
                color={stat.color}
              />

              <Text style={styles.statNumber}>
                {stat.value}
              </Text>

              <Text style={styles.statLabel}>
                {stat.label}
              </Text>

              <Text style={styles.statSub}>
                {stat.sub}
              </Text>

              <View
                style={[
                  styles.statLine,
                  { backgroundColor: stat.color },
                ]}
              />
            </View>
          ))}
        </View>

        {renderTituloSecao('FILMES EM ALTA')}
        {renderMidias(filmes, 'filme')}

        {renderTituloSecao('SÉRIES EM ALTA')}
        {renderMidias(series, 'serie')}

        {renderTituloSecao('CONEXÕES')}

        {conexoes.length ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          >
            {conexoes.map((pessoa, i) => {
              const n =
                pessoa.username ||
                pessoa.nome ||
                pessoa.name ||
                'Usuário';

              const foto =
                pessoa.avatar_url ||
                pessoa.avatar;

              return (
                <TouchableOpacity
                  key={pessoa.id || i}
                  style={styles.friend}
                >
                  <View style={styles.friendAvatar}>
                    {foto ? (
                      <Image
                        source={{ uri: foto }}
                        style={styles.avatarImage}
                      />
                    ) : (
                      <Text style={styles.friendInitial}>
                        {iniciais(n)}
                      </Text>
                    )}
                  </View>

                  <Text
                    style={styles.friendName}
                    numberOfLines={1}
                  >
                    {n}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : (
          <Text style={styles.emptyText}>
            Suas conexões aparecerão aqui quando você começar a seguir pessoas.
          </Text>
        )}

        {renderTituloSecao('ATIVIDADE RECENTE')}

        {atividades.length ? (
          atividades.slice(0, 5).map((item, i) => (
            <View
              key={item.id || i}
              style={styles.activityCard}
            >
              <View style={styles.activityIcon}>
                <Feather
                  name="activity"
                  size={17}
                  color={COLORS.blueLight}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.activityText}>
                  {item.descricao ||
                    item.texto ||
                    item.action ||
                    'Nova atividade'}
                </Text>

                <Text style={styles.recordDate}>
                  {formatarData(
                    item.created_at || item.data
                  )}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>
            Ainda não há atividades para mostrar.
          </Text>
        )}

        {renderTituloSecao('ÚLTIMOS REGISTROS')}

        {registros.length ? (
          registros.slice(0, 5).map(renderRegistro)
        ) : (
          <View style={styles.emptyCard}>
            <Feather
              name="book-open"
              size={25}
              color={COLORS.muted}
            />

            <Text style={styles.emptyTitle}>
              Seu diário está esperando por você
            </Text>

            <Text style={styles.emptyText}>
              Quando você registrar um filme ou série, ele aparecerá aqui.
            </Text>
          </View>
        )}

        <View style={{ height: 112 }} />
      </Animated.ScrollView>

      {/* NAVEGAÇÃO INFERIOR */}

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => abrirAba('Home')}
        >
          <Ionicons
            name="home"
            size={22}
            color={
              abaAtiva === 'Home'
                ? COLORS.blueLight
                : COLORS.muted
            }
          />
          <Text
            style={[
              styles.tabLabel,
              abaAtiva === 'Home' && styles.tabActive,
            ]}
          >
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() =>
            abrirAba('Buscar', onAbrirBusca)
          }
        >
          <Feather
            name="search"
            size={21}
            color={
              abaAtiva === 'Buscar'
                ? COLORS.blueLight
                : COLORS.muted
            }
          />
          <Text
            style={[
              styles.tabLabel,
              abaAtiva === 'Buscar' && styles.tabActive,
            ]}
          >
            Buscar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() =>
            abrirAba('Adicionar', onAdicionar)
          }
        >
          <LinearGradient
            colors={['#3984FF', '#2563EB']}
            style={styles.addButtonGradient}
          >
            <Feather
              name="plus"
              size={26}
              color="#fff"
            />
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() =>
            abrirAba('Diário', onAbrirDiario)
          }
        >
          <MaterialCommunityIcons
            name="notebook-outline"
            size={23}
            color={
              abaAtiva === 'Diário'
                ? COLORS.blueLight
                : COLORS.muted
            }
          />
          <Text
            style={[
              styles.tabLabel,
              abaAtiva === 'Diário' && styles.tabActive,
            ]}
          >
            Diário
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() =>
            abrirAba('Perfil', onAbrirPerfil || onLogout)
          }
        >
          <Feather
            name="user"
            size={21}
            color={
              abaAtiva === 'Perfil'
                ? COLORS.blueLight
                : COLORS.muted
            }
          />
          <Text
            style={[
              styles.tabLabel,
              abaAtiva === 'Perfil' && styles.tabActive,
            ]}
          >
            Perfil
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingTop:
      Platform.OS === 'android'
        ? StatusBar.currentHeight || 24
        : 0,
  },

  // CABEÇALHO REORGANIZADO

  header: {
    minHeight: 76,
    paddingHorizontal: 19,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.bg,
    zIndex: 2,
  },

  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },

  logoContainer: {
    width: 47,
    height: 47,
    borderRadius: 14,
    backgroundColor: '#101827',
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  headerLogo: {
    width: 39,
    height: 39,
  },

  brandTextContainer: {
    justifyContent: 'center',
  },

  brandName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.4,
  },

  brandNameBlue: {
    color: COLORS.blueLight,
  },

  brandSubtitle: {
    color: '#718096',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.55,
    marginTop: 4,
  },

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginLeft: 8,
  },

  iconButton: {
    width: 41,
    height: 41,
    borderRadius: 13,
    backgroundColor: COLORS.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.blue,
  },

  avatarSmall: {
    width: 41,
    height: 41,
    borderRadius: 13,
    backgroundColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },

  avatarInitial: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },

  scrollContent: {
    paddingHorizontal: 19,
    paddingTop: 20,
    paddingBottom: 20,
  },

  welcome: {
    marginBottom: 3,
  },

  eyebrow: {
    color: COLORS.muted,
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '800',
    marginBottom: 8,
  },

  greeting: {
    color: COLORS.text,
    fontSize: 27,
    fontWeight: '800',
    letterSpacing: -0.7,
  },

  greetingName: {
    color: COLORS.blueLight,
  },

  welcomeSub: {
    color: COLORS.secondary,
    fontSize: 12,
    marginTop: 5,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 25,
    marginBottom: 13,
  },

  sectionTitle: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.8,
  },

  sectionRule: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },

  heroCard: {
    minHeight: 185,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 17,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },

  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  heroStars: {
    flexDirection: 'row',
    gap: 3,
  },

  heroBadge: {
    backgroundColor: 'rgba(59,130,246,0.18)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  heroBadgeText: {
    color: COLORS.blueLight,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },

  heroTitle: {
    color: '#fff',
    fontSize: 21,
    fontWeight: '800',
    maxWidth: '82%',
    marginTop: 19,
  },

  heroSub: {
    color: COLORS.secondary,
    fontSize: 12,
    lineHeight: 18,
    maxWidth: '82%',
    marginTop: 5,
  },

  heroAction: {
    position: 'absolute',
    right: 17,
    bottom: 18,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },

  statsGrid: {
    flexDirection: 'row',
    gap: 9,
  },

  statCard: {
    flex: 1,
    minHeight: 116,
    padding: 12,
    borderRadius: 16,
    backgroundColor: COLORS.elevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },

  statNumber: {
    color: '#fff',
    fontSize: 25,
    fontWeight: '900',
    marginTop: 8,
  },

  statLabel: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
  },

  statSub: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 2,
  },

  statLine: {
    position: 'absolute',
    bottom: 0,
    left: 12,
    width: 42,
    height: 2,
    borderRadius: 2,
  },

  horizontalList: {
    gap: 12,
    paddingRight: 5,
  },

  mediaCard: {
    width: CARD_WIDTH,
    borderRadius: 15,
    backgroundColor: COLORS.elevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    paddingBottom: 10,
  },

  poster: {
    width: '100%',
    aspectRatio: 2 / 3,
  },

  posterPlaceholder: {
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },

  mediaTitle: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 9,
    paddingTop: 9,
  },

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingTop: 5,
  },

  rating: {
    color: COLORS.blueLight,
    fontSize: 10,
    fontWeight: '700',
  },

  rank: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 23,
    height: 23,
    borderRadius: 7,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  rankText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
  },

  emptyText: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    marginVertical: 8,
  },

  friend: {
    width: 62,
    alignItems: 'center',
  },

  friendAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.elevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },

  friendInitial: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },

  friendName: {
    color: COLORS.secondary,
    fontSize: 10,
    maxWidth: 62,
  },

  activityCard: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    backgroundColor: COLORS.elevated,
    padding: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 9,
  },

  activityIcon: {
    width: 35,
    height: 35,
    borderRadius: 12,
    backgroundColor: 'rgba(59,130,246,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  activityText: {
    color: COLORS.text,
    fontSize: 12,
    lineHeight: 18,
  },

  recordCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    backgroundColor: COLORS.elevated,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 9,
  },

  recordPoster: {
    width: 55,
    height: 78,
    borderRadius: 9,
    backgroundColor: COLORS.surface,
  },

  recordInfo: {
    flex: 1,
    justifyContent: 'center',
  },

  recordTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '800',
  },

  recordDate: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 4,
  },

  recordRating: {
    color: COLORS.yellow,
    fontSize: 11,
    marginTop: 5,
    fontWeight: '700',
  },

  recordDescription: {
    color: COLORS.secondary,
    fontSize: 11,
    marginTop: 5,
  },

  recordReview: {
    color: COLORS.secondary,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 5,
  },

  emptyCard: {
    alignItems: 'center',
    padding: 22,
    backgroundColor: COLORS.elevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },

  emptyTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },

  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    minHeight: 76,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 9,
    backgroundColor: 'rgba(8,10,14,0.98)',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },

  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },

  tabLabel: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '700',
  },

  tabActive: {
    color: COLORS.blueLight,
  },

  addButton: {
    width: 54,
    height: 54,
    borderRadius: 17,
    top: -14,
    overflow: 'hidden',
    elevation: 8,
  },

  addButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});