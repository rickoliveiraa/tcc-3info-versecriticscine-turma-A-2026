
import React, { useCallback, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  StatusBar,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Platform,
  Dimensions,
  AccessibilityInfo,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const HORIZONTAL_PADDING = 24;
const CARD_GAP = 12;
const CARD_WIDTH =
  (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - CARD_GAP * 2) / 3;

// Logo oficial do CineTrack
const LOGO = require('./assets/logo-cinetrack.png');

export const GENEROS_DATA = [
  {
    id: 'acao',
    nome: 'Ação',
    emoji: '💥',
    tmdbIds: [28],
    descricao: 'Aventura, lutas e adrenalina',
  },
  {
    id: 'terror',
    nome: 'Terror',
    emoji: '👻',
    tmdbIds: [27],
    descricao: 'Histórias assustadoras',
  },
  {
    id: 'slasher',
    nome: 'Slasher',
    emoji: '🔪',
    tmdbIds: [27],
    descricao: 'Assassinos e tensão',
  },
  {
    id: 'romance',
    nome: 'Romance',
    emoji: '💘',
    tmdbIds: [10749],
    descricao: 'Amor e relacionamentos',
  },
  {
    id: 'comedia',
    nome: 'Comédia',
    emoji: '😂',
    tmdbIds: [35],
    descricao: 'Filmes para dar risada',
  },
  {
    id: 'sci-fi',
    nome: 'Sci-Fi',
    emoji: '🚀',
    tmdbIds: [878],
    descricao: 'Futuro e tecnologia',
  },
  {
    id: 'suspense',
    nome: 'Suspense',
    emoji: '🕵️',
    tmdbIds: [53],
    descricao: 'Mistérios e tensão',
  },
  {
    id: 'drama',
    nome: 'Drama',
    emoji: '🎭',
    tmdbIds: [18],
    descricao: 'Histórias emocionantes',
  },
  {
    id: 'animacao',
    nome: 'Animação',
    emoji: '✨',
    tmdbIds: [16],
    descricao: 'Mundos animados',
  },
  {
    id: 'doc',
    nome: 'Documentário',
    emoji: '🎙️',
    tmdbIds: [99],
    descricao: 'Histórias reais',
  },
  {
    id: 'fantasia',
    nome: 'Fantasia',
    emoji: '🧙',
    tmdbIds: [14],
    descricao: 'Magia e mundos fantásticos',
  },
  {
    id: 'crime',
    nome: 'Crime',
    emoji: '🚓',
    tmdbIds: [80],
    descricao: 'Investigações e criminosos',
  },
];

export const obterIdsTMDB = (generosSelecionados = []) => {
  const ids = generosSelecionados.flatMap((id) => {
    const genero = GENEROS_DATA.find((item) => item.id === id);
    return genero ? genero.tmdbIds : [];
  });

  return [...new Set(ids)];
};

export default function EscolhaGeneros({
  onContinuar = () => {},
  onPular = () => {},
}) {
  const [selecionados, setSelecionados] = useState([]);
  const [erro, setErro] = useState('');

  const totalSelecionados = selecionados.length;

  const alternarGenero = useCallback((id) => {
    setSelecionados((atuais) =>
      atuais.includes(id)
        ? atuais.filter((item) => item !== id)
        : [...atuais, id]
    );

    setErro('');
  }, []);

  const idsTMDB = useMemo(
    () => obterIdsTMDB(selecionados),
    [selecionados]
  );

  const continuar = useCallback(() => {
    if (selecionados.length === 0) {
      setErro('Selecione pelo menos um gênero para continuar.');
      AccessibilityInfo.announceForAccessibility?.(
        'Selecione pelo menos um gênero para continuar.'
      );
      return;
    }

    setErro('');

    // Mantém compatibilidade com o App.js atual.
    // Exemplo: ['acao', 'terror', 'romance']
    onContinuar(selecionados);
  }, [selecionados, onContinuar]);

  const pular = useCallback(() => {
    setErro('');
    onPular();
  }, [onPular]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#050505"
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* CABEÇALHO PADRONIZADO */}
        <View style={styles.header}>
          <View style={styles.brandContainer}>
            <Image
              source={LOGO}
              style={styles.logoImagem}
              resizeMode="contain"
              accessibilityLabel="CineTrack"
            />

            <View style={styles.brandDivider} />

            <View style={styles.brandDescription}>
              <Text style={styles.brandTitle}>SEU UNIVERSO</Text>
              <Text style={styles.brandSubtitle}>AUDIOVISUAL</Text>
            </View>
          </View>

          <View style={styles.stepBadge}>
            <Text style={styles.stepLabel}>ETAPA</Text>
            <Text style={styles.stepNumber}>02 / 03</Text>
          </View>
        </View>

        {/* PROGRESSO */}
        <View style={styles.progressBarRow}>
          <View style={[styles.progressStep, styles.progressActive]} />
          <View style={[styles.progressStep, styles.progressActive]} />
          <View style={styles.progressStep} />
        </View>

        {/* INTRODUÇÃO */}
        <View style={styles.introContainer}>
          <View style={styles.eyebrow}>
            <Feather name="sliders" size={13} color="#60A5FA" />
            <Text style={styles.eyebrowText}>
              PERSONALIZE SEU PERFIL
            </Text>
          </View>

          <Text style={styles.mainTitle}>
            O que você curte
            {'\n'}
            <Text style={styles.titleHighlight}>assistir?</Text>
          </Text>

          <Text style={styles.subTitleText}>
            Escolha seus gêneros favoritos e deixe o CineTrack
            ajudar você a descobrir filmes que combinam com seu gosto.
          </Text>
        </View>

        {/* TÍTULO DA SELEÇÃO */}
        <View style={styles.selectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Seus gêneros</Text>
            <Text style={styles.sectionSubtitle}>
              Toque para selecionar ou remover
            </Text>
          </View>

          <View style={styles.counterBadge}>
            <Text style={styles.counterNumber}>
              {String(totalSelecionados).padStart(2, '0')}
            </Text>
            <Text style={styles.counterLabel}>selecionados</Text>
          </View>
        </View>

        {/* GRADE DE GÊNEROS */}
        <View style={styles.gridContainer}>
          {GENEROS_DATA.map((genero) => {
            const selecionado = selecionados.includes(genero.id);

            return (
              <TouchableOpacity
                key={genero.id}
                style={[
                  styles.card,
                  selecionado && styles.cardSelecionado,
                ]}
                activeOpacity={0.75}
                onPress={() => alternarGenero(genero.id)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selecionado }}
                accessibilityLabel={`${genero.nome}. ${genero.descricao}`}
              >
                <View
                  style={[
                    styles.cardIndicator,
                    selecionado && styles.cardIndicatorSelected,
                  ]}
                >
                  {selecionado && (
                    <Ionicons
                      name="checkmark"
                      size={12}
                      color="#FFFFFF"
                    />
                  )}
                </View>

                <View
                  style={[
                    styles.emojiContainer,
                    selecionado && styles.emojiContainerSelected,
                  ]}
                >
                  <Text style={styles.cardEmoji}>
                    {genero.emoji}
                  </Text>
                </View>

                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  style={[
                    styles.cardNome,
                    selecionado && styles.cardNomeSelecionado,
                  ]}
                >
                  {genero.nome}
                </Text>

                <View
                  style={[
                    styles.cardBottomLine,
                    selecionado && styles.cardBottomLineSelected,
                  ]}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* RESUMO DAS ESCOLHAS */}
        {totalSelecionados > 0 && (
          <View style={styles.selectedSummary}>
            <View style={styles.summaryHeader}>
              <Ionicons
                name="checkmark-circle"
                size={17}
                color="#60A5FA"
              />
              <Text style={styles.summaryTitle}>
                Suas preferências
              </Text>
              <Text style={styles.summaryCount}>
                {totalSelecionados}
              </Text>
            </View>

            <View style={styles.chipsContainer}>
              {selecionados.map((id) => {
                const genero = GENEROS_DATA.find(
                  (item) => item.id === id
                );

                if (!genero) return null;

                return (
                  <TouchableOpacity
                    key={id}
                    style={styles.selectedChip}
                    onPress={() => alternarGenero(id)}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                    accessibilityLabel={`Remover ${genero.nome}`}
                  >
                    <Text style={styles.chipText}>
                      {genero.emoji} {genero.nome}
                    </Text>
                    <Ionicons
                      name="close"
                      size={13}
                      color="#93C5FD"
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* VALIDAÇÃO */}
        {erro ? (
          <View style={styles.errorContainer} accessibilityRole="alert">
            <Feather
              name="alert-circle"
              size={16}
              color="#FCA5A5"
            />
            <Text style={styles.errorText}>{erro}</Text>
          </View>
        ) : null}

        {/* DICA DE RECOMENDAÇÕES */}
        <View style={styles.recommendationHint}>
          <View style={styles.hintIcon}>
            <Feather name="film" size={17} color="#60A5FA" />
          </View>

          <View style={styles.hintContent}>
            <Text style={styles.hintTitle}>
              Recomendações com a sua cara
            </Text>
            <Text style={styles.hintDescription}>
              Seus gêneros podem ser usados para personalizar
              as sugestões de filmes do CineTrack.
            </Text>
          </View>
        </View>

        {/* CONTINUAR */}
        <TouchableOpacity
          style={styles.btnContinuar}
          activeOpacity={0.85}
          onPress={continuar}
          accessibilityRole="button"
          accessibilityLabel="Continuar"
        >
          <Text style={styles.btnContinuarText}>Continuar</Text>

          <View style={styles.arrowContainer}>
            <Feather
              name="arrow-right"
              size={17}
              color="#FFFFFF"
            />
          </View>
        </TouchableOpacity>

        {/* PULAR */}
        <TouchableOpacity
          style={styles.btnPular}
          activeOpacity={0.7}
          onPress={pular}
          accessibilityRole="button"
          accessibilityLabel="Pular por agora"
        >
          <Text style={styles.pularText}>Pular por agora</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          VOCÊ PODERÁ ALTERAR SUAS PREFERÊNCIAS DEPOIS
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },

  scrollContent: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: Platform.OS === 'android' ? 16 : 10,
    paddingBottom: 32,
  },

  // Cabeçalho: logo, identidade e etapa
  header: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 17,
    gap: 10,
  },

  brandContainer: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },

  logoImagem: {
    width: 104,
    height: 34,
  },

  brandDivider: {
    width: 1,
    height: 26,
    backgroundColor: '#292D35',
    marginHorizontal: 11,
  },

  brandDescription: {
    justifyContent: 'center',
  },

  brandTitle: {
    fontSize: 8,
    color: '#D5D9E0',
    fontWeight: '800',
    letterSpacing: 0.7,
  },

  brandSubtitle: {
    fontSize: 8,
    color: '#737B8A',
    fontWeight: '600',
    letterSpacing: 0.9,
    marginTop: 3,
  },

  stepBadge: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingLeft: 7,
  },

  stepLabel: {
    fontSize: 8,
    color: '#737B8A',
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 3,
  },

  stepNumber: {
    color: '#60A5FA',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },

  // Progresso
  progressBarRow: {
    flexDirection: 'row',
    gap: 7,
    marginBottom: 32,
  },

  progressStep: {
    flex: 1,
    height: 3,
    borderRadius: 3,
    backgroundColor: '#202020',
  },

  progressActive: {
    backgroundColor: '#3B82F6',
  },

  // Introdução
  introContainer: {
    marginBottom: 28,
  },

  eyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 7,
    marginBottom: 14,
  },

  eyebrowText: {
    fontSize: 9,
    color: '#60A5FA',
    fontWeight: '800',
    letterSpacing: 1,
  },

  mainTitle: {
    fontSize: 31,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.8,
    lineHeight: 38,
  },

  titleHighlight: {
    color: '#60A5FA',
  },

  subTitleText: {
    fontSize: 13,
    color: '#9298A4',
    marginTop: 12,
    lineHeight: 21,
    maxWidth: 350,
  },

  // Título da grade
  selectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },

  sectionTitle: {
    fontSize: 15,
    color: '#F5F5F5',
    fontWeight: '700',
  },

  sectionSubtitle: {
    fontSize: 11,
    color: '#717784',
    marginTop: 4,
  },

  counterBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 76,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#10151D',
    borderWidth: 1,
    borderColor: '#1D2C42',
  },

  counterNumber: {
    color: '#60A5FA',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
  },

  counterLabel: {
    color: '#8C96A6',
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
  },

  // Cartões
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
    width: '100%',
  },

  card: {
    width: CARD_WIDTH,
    height: 108,
    borderRadius: 15,
    backgroundColor: '#101010',
    borderWidth: 1,
    borderColor: '#202020',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    paddingHorizontal: 4,
  },

  cardSelecionado: {
    backgroundColor: '#0D1828',
    borderColor: '#3B82F6',
  },

  cardIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 17,
    height: 17,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#333333',
    backgroundColor: '#181818',
  },

  cardIndicatorSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },

  emojiContainer: {
    width: 43,
    height: 43,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A1A',
    marginBottom: 8,
  },

  emojiContainerSelected: {
    backgroundColor: '#172B46',
  },

  cardEmoji: {
    fontSize: 24,
  },

  cardNome: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8B8B8B',
    textAlign: 'center',
    paddingHorizontal: 2,
  },

  cardNomeSelecionado: {
    color: '#FFFFFF',
  },

  cardBottomLine: {
    position: 'absolute',
    bottom: 0,
    height: 2,
    width: '35%',
    borderRadius: 2,
    backgroundColor: 'transparent',
  },

  cardBottomLineSelected: {
    width: '55%',
    backgroundColor: '#3B82F6',
  },

  // Preferências selecionadas
  selectedSummary: {
    marginTop: 23,
    padding: 14,
    borderRadius: 15,
    backgroundColor: '#0D1015',
    borderWidth: 1,
    borderColor: '#20242B',
  },

  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 11,
  },

  summaryTitle: {
    flex: 1,
    color: '#E5E7EB',
    fontSize: 12,
    fontWeight: '700',
  },

  summaryCount: {
    color: '#60A5FA',
    fontSize: 12,
    fontWeight: '800',
  },

  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 7,
    paddingHorizontal: 9,
    borderRadius: 9,
    backgroundColor: '#142238',
    borderWidth: 1,
    borderColor: '#243D60',
  },

  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#DCEBFF',
  },

  // Erro
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#251414',
    borderWidth: 1,
    borderColor: '#512020',
  },

  errorText: {
    flex: 1,
    color: '#FCA5A5',
    fontSize: 12,
    lineHeight: 18,
  },

  // Sugestão de recomendações
  recommendationHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 23,
    padding: 14,
    borderRadius: 15,
    backgroundColor: '#0D1118',
    borderWidth: 1,
    borderColor: '#1C293A',
  },

  hintIcon: {
    width: 35,
    height: 35,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#142238',
  },

  hintContent: {
    flex: 1,
  },

  hintTitle: {
    color: '#E5E7EB',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 5,
  },

  hintDescription: {
    color: '#9298A4',
    fontSize: 11,
    lineHeight: 18,
  },

  // Botões
  btnContinuar: {
    width: '100%',
    minHeight: 54,
    borderRadius: 15,
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    paddingHorizontal: 18,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 9,
    elevation: 5,
  },

  btnContinuarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  arrowContainer: {
    position: 'absolute',
    right: 14,
    width: 29,
    height: 29,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },

  btnPular: {
    alignSelf: 'center',
    marginTop: 12,
    paddingVertical: 11,
    paddingHorizontal: 18,
  },

  pularText: {
    color: '#9298A4',
    fontSize: 12,
    fontWeight: '600',
  },

  footerText: {
    color: '#555B65',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.6,
    textAlign: 'center',
    marginTop: 10,
  },
});
