import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Feather,
  Ionicons,
  MaterialCommunityIcons,
} from '@expo/vector-icons';

const TMDB_KEY = '5c1853c10d9752023da5ddce4ada3b77';
const TMDB_IMAGE = 'https://image.tmdb.org/t/p/w500';

const CHAVE_REGISTROS = '@CineTrack:registros';
const CHAVE_AVALIACOES = '@CineTrack:avaliacoes';
const CHAVE_LISTAS = '@CineTrack:listas';
const CHAVE_MINHA_LISTA = '@CineTrack:minhaLista';
const CHAVE_PERFIL = '@CineTrack:perfil';

let ImagePicker = null;

try {
  ImagePicker = require('expo-image-picker');
} catch (e) {
  ImagePicker = null;
}

const C = {
  bg: '#07090D',
  surface: '#10141D',
  card: '#0D1119',
  blue: '#1A6FFF',
  blueLight: '#64AAFF',
  text: '#F4F6FA',
  muted: '#737D8E',
  soft: '#AAB4C4',
  border: 'rgba(255,255,255,0.075)',
  green: '#1DB954',
  purple: '#9B5BFF',
};

// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================

const lerJSON = (valor, fallback = []) => {
  if (!valor) return fallback;

  try {
    return JSON.parse(valor);
  } catch {
    return fallback;
  }
};

const nomeDoUsuario = usuario =>
  usuario?.nome ||
  usuario?.name ||
  usuario?.username ||
  usuario?.email?.split('@')?.[0] ||
  'Cinéfilo';

const iniciais = nome =>
  String(nome || 'C')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase() || '')
    .join('') || 'C';

const tipoMidia = item => {
  const t = String(
    item?.tipo ||
    item?.media_type ||
    item?.type ||
    ''
  ).toLowerCase();

  return (
    ['tv', 'serie', 'série', 'series'].includes(t) ||
    (!t && (item?.name || item?.first_air_date))
  )
    ? 'tv'
    : 'movie';
};

const tituloMidia = item =>
  item?.title ||
  item?.name ||
  item?.titulo ||
  item?.media_title ||
  'Obra sem título';

const posterUri = item => {
  const p =
    item?.poster_path ||
    item?.poster_url ||
    item?.poster;

  if (!p) return null;

  return String(p).startsWith('http')
    ? String(p)
    : `${TMDB_IMAGE}${p}`;
};

const itensDe = dados => {
  if (Array.isArray(dados)) return dados;

  if (!dados || typeof dados !== 'object') {
    return [];
  }

  if (Array.isArray(dados.results)) return dados.results;
  if (Array.isArray(dados.registros)) return dados.registros;
  if (Array.isArray(dados.avaliacoes)) return dados.avaliacoes;
  if (Array.isArray(dados.items)) return dados.items;
  if (Array.isArray(dados.itens)) return dados.itens;

  return Object.values(dados).filter(
    x => x && typeof x === 'object'
  );
};

const normalizarObra = item => {
  const media =
    item?.media ||
    item?.midia ||
    item?.filme ||
    item?.serie ||
    item?.obra ||
    {};

  const x = {
    ...item,
    ...media,
  };

  const id =
    x.tmdb_id ??
    x.tmdbId ??
    x.media_id ??
    x.mediaId ??
    x.id;

  if (id === undefined || id === null) {
    return null;
  }

  const nota = Number(
    x.nota ??
    x.rating ??
    x.stars ??
    x.avaliacao
  );

  return {
    ...x,
    id: String(id),
    tipo: tipoMidia(x),
    title: tituloMidia(x),
    poster_path:
      x.poster_path ||
      x.poster_url ||
      x.poster,
    nota:
      Number.isFinite(nota) && nota > 0
        ? nota
        : null,
    data:
      x.watch_date ||
      x.watched_at ||
      x.assistido_em ||
      x.data ||
      x.created_at ||
      null,
  };
};

const extrairListas = dados => {
  if (Array.isArray(dados)) return dados;

  if (!dados || typeof dados !== 'object') {
    return [];
  }

  if (Array.isArray(dados.listas)) return dados.listas;
  if (Array.isArray(dados.lists)) return dados.lists;
  if (Array.isArray(dados.items)) return dados.items;

  if (Array.isArray(dados.itens)) {
    return [dados];
  }

  return Object.values(dados).filter(
    x =>
      x &&
      typeof x === 'object' &&
      (
        Array.isArray(x.itens) ||
        Array.isArray(x.items) ||
        Array.isArray(x.obras)
      )
  );
};

// ============================================================
// COMPONENTE PERFIL
// ============================================================

export default function Perfil({
  usuario = null,
  onVoltar,
  onAbrirHome,
  onAbrirDiario,
  onAdicionar,
  onAbrirDetalhes,
  onLogout,
}) {
  const [registros, setRegistros] = useState([]);
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [listas, setListas] = useState([]);

  const [perfil, setPerfil] = useState({
    bio: '',
    avatar: null,
    capa: null,
  });

  const [carregando, setCarregando] = useState(true);

  const [modalEditar, setModalEditar] = useState(false);
  const [modalCapas, setModalCapas] = useState(false);

  const [bioEditada, setBioEditada] = useState('');

  const [opcoesCapa, setOpcoesCapa] = useState([]);
  const [buscandoCapas, setBuscandoCapas] = useState(false);

  const nome = nomeDoUsuario(usuario);

  const identificador = usuario?.username
    ? `@${String(usuario.username).replace(/^@/, '')}`
    : usuario?.email
      ? `@${usuario.email.split('@')[0]}`
      : `@${nome.toLowerCase().replace(/\s+/g, '')}`;

  // ==========================================================
  // CARREGAR DADOS DO PERFIL
  // ==========================================================

  const carregarDados = useCallback(async () => {
    setCarregando(true);

    try {
      const pares = await AsyncStorage.multiGet([
        CHAVE_REGISTROS,
        CHAVE_AVALIACOES,
        CHAVE_LISTAS,
        CHAVE_MINHA_LISTA,
        CHAVE_PERFIL,
      ]);

      const mapa = Object.fromEntries(pares);

      const regs = itensDe(
        lerJSON(mapa[CHAVE_REGISTROS], [])
      );

      const avs = itensDe(
        lerJSON(mapa[CHAVE_AVALIACOES], [])
      );

      const listasSalvas = extrairListas(
        lerJSON(mapa[CHAVE_LISTAS], [])
      );

      const minhaLista = itensDe(
        lerJSON(mapa[CHAVE_MINHA_LISTA], [])
      );

      setRegistros(
        regs
          .map(normalizarObra)
          .filter(Boolean)
      );

      setAvaliacoes(
        avs
          .map(normalizarObra)
          .filter(Boolean)
      );

      const colecoes = listasSalvas.map((l, i) => ({
        ...l,
        id: String(l.id ?? i),
        nome:
          l.nome ||
          l.name ||
          l.title ||
          'Minha lista',
        itens: itensDe(
          l.itens ||
          l.items ||
          l.obras ||
          l.filmes ||
          []
        ),
      }));

      if (
        minhaLista.length &&
        !colecoes.some(l => /minha lista/i.test(l.nome))
      ) {
        colecoes.unshift({
          id: 'minha-lista',
          nome: 'Minha lista',
          itens: minhaLista,
        });
      }

      setListas(colecoes);

      setPerfil(
        lerJSON(
          mapa[CHAVE_PERFIL],
          {
            bio: '',
            avatar: null,
            capa: null,
          }
        )
      );
    } catch (e) {
      console.warn(
        'Erro ao carregar perfil:',
        e
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // ==========================================================
  // ORGANIZAR OBRAS
  // ==========================================================

  const obras = useMemo(() => {
    const mapa = new Map();

    [...registros, ...avaliacoes].forEach(item => {
      const key = `${item.tipo}-${item.id}`;

      const anterior = mapa.get(key) || {};

      mapa.set(key, {
        ...anterior,
        ...item,
        title:
          item.title ||
          anterior.title,
        poster_path:
          item.poster_path ||
          anterior.poster_path,
        nota:
          item.nota ||
          anterior.nota,
        data:
          item.data ||
          anterior.data,
      });
    });

    return [...mapa.values()];
  }, [registros, avaliacoes]);

  const assistidos = useMemo(() => {
    const comData = obras.filter(
      o =>
        o.data ||
        o.status === 'assistido' ||
        o.status === 'watched' ||
        o.assistido === true
    );

    return comData.length
      ? comData
      : registros;
  }, [obras, registros]);

  const filmes = assistidos.filter(
    o => o.tipo === 'movie'
  );

  const series = assistidos.filter(
    o => o.tipo === 'tv'
  );

  const notas = obras
    .map(o => Number(o.nota))
    .filter(
      n => Number.isFinite(n) && n > 0
    );

  const mediaNota = notas.length
    ? (
        notas.reduce((a, b) => a + b, 0) /
        notas.length
      ).toFixed(1)
    : '—';

  const anoAtual = new Date().getFullYear();

  const desteAno = assistidos.filter(
    o =>
      o.data &&
      new Date(o.data).getFullYear() === anoAtual
  );

  const notaAno = desteAno
    .map(o => Number(o.nota))
    .filter(n => n > 0);

  const mediaAno = notaAno.length
    ? (
        notaAno.reduce((a, b) => a + b, 0) /
        notaAno.length
      ).toFixed(1)
    : '—';

  const recentes = [...assistidos]
    .sort(
      (a, b) =>
        new Date(b.data || 0) -
        new Date(a.data || 0)
    )
    .slice(0, 8);

  const generos = [
    ...new Set(
      assistidos.flatMap(o =>
        Array.isArray(o.genres)
          ? o.genres.map(g => g.name || g)
          : []
      )
    ),
  ].slice(0, 5);

  const minutos = assistidos.reduce(
    (total, o) =>
      total +
      (
        Number(o.runtime || o.duracao || 0) ||
        0
      ),
    0
  );

  const tempoTela = minutos
    ? `${Math.floor(minutos / 60)}h`
    : '—';

  // ==========================================================
  // SALVAR PERFIL
  // ==========================================================

  const salvarPerfil = async novo => {
    const atualizado = {
      ...perfil,
      ...novo,
    };

    setPerfil(atualizado);

    try {
      await AsyncStorage.setItem(
        CHAVE_PERFIL,
        JSON.stringify(atualizado)
      );
    } catch (e) {
      Alert.alert(
        'Ops!',
        'Não foi possível salvar as alterações do perfil.'
      );
    }
  };

  // ==========================================================
  // ESCOLHER IMAGEM DA GALERIA
  // ==========================================================

  const escolherImagem = async campo => {
    if (!ImagePicker) {
      Alert.alert(
        'Galeria indisponível',
        'Instale a dependência expo-image-picker para selecionar imagens.'
      );

      return;
    }

    try {
      const permissao =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissao.granted) {
        Alert.alert(
          'Permissão necessária',
          'Permita o acesso à galeria nas configurações do aparelho.'
        );

        return;
      }

      const resultado =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect:
            campo === 'avatar'
              ? [1, 1]
              : [16, 5],
          quality: 0.85,
        });

      if (
        !resultado.canceled &&
        resultado.assets?.[0]?.uri
      ) {
        await salvarPerfil({
          [campo]: resultado.assets[0].uri,
        });
      }
    } catch (e) {
      Alert.alert(
        'Erro',
        'Não foi possível abrir sua galeria.'
      );
    }
  };

  // ==========================================================
  // ESCOLHER CAPA COM FILMES E SÉRIES DO TMDB
  // ==========================================================

  const abrirOpcoesCapa = async () => {
    setModalCapas(true);

    if (opcoesCapa.length) return;

    setBuscandoCapas(true);

    try {
      const [a, b] = await Promise.all([
        fetch(
          `https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_KEY}&language=pt-BR`
        ),
        fetch(
          `https://api.themoviedb.org/3/trending/tv/week?api_key=${TMDB_KEY}&language=pt-BR`
        ),
      ]);

      const [da, db] = await Promise.all([
        a.json(),
        b.json(),
      ]);

      const items = [
        ...(da.results || []).map(x => ({
          ...x,
          tipo: 'movie',
        })),

        ...(db.results || []).map(x => ({
          ...x,
          tipo: 'tv',
        })),
      ]
        .filter(
          x => x.backdrop_path || x.poster_path
        )
        .slice(0, 24);

      setOpcoesCapa(items);
    } catch (e) {
      Alert.alert(
        'Erro',
        'Não foi possível carregar filmes e séries para a capa.'
      );
    } finally {
      setBuscandoCapas(false);
    }
  };

  const selecionarCapa = async item => {
    await salvarPerfil({
      capa: `${
        TMDB_IMAGE.replace('/w500', '/w780')
      }${item.backdrop_path || item.poster_path}`,
    });

    setModalCapas(false);
  };

  // ==========================================================
  // ESTRELAS
  // ==========================================================

  const renderEstrelas = nota => (
    <View style={s.stars}>
      {[1, 2, 3, 4, 5].map(n => (
        <Ionicons
          key={n}
          name={
            Number(nota || 0) >= n
              ? 'star'
              : 'star-outline'
          }
          size={10}
          color={C.blueLight}
        />
      ))}
    </View>
  );

  // ==========================================================
  // CARREGAMENTO
  // ==========================================================

  if (carregando) {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={C.bg}
        />

        <View style={s.loading}>
          <ActivityIndicator
            size="large"
            color={C.blueLight}
          />

          <Text style={s.loadingText}>
            Carregando seu perfil...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================================
  // INTERFACE
  // ==========================================================

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={C.bg}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        {/* CABEÇALHO E CAPA */}

        <View style={s.hero}>
          <ImageBackground
            source={
              perfil.capa
                ? { uri: perfil.capa }
                : undefined
            }
            style={s.banner}
            imageStyle={s.bannerImage}
          >
            {!perfil.capa && (
              <LinearGradient
                colors={[
                  '#09051B',
                  '#1A0A3E',
                  '#0E1A40',
                  '#07101D',
                ]}
                style={StyleSheet.absoluteFill}
              />
            )}

            <View style={s.bannerGlow} />

            <View style={s.bannerActions}>
              <TouchableOpacity
                style={s.iconButton}
                onPress={abrirOpcoesCapa}
              >
                <Feather
                  name="image"
                  size={16}
                  color={C.text}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={s.iconButton}
                onPress={() => escolherImagem('capa')}
              >
                <Feather
                  name="camera"
                  size={16}
                  color={C.text}
                />
              </TouchableOpacity>
            </View>
          </ImageBackground>

          {/* AVATAR E NOME */}

          <View style={s.avatarRow}>
            <TouchableOpacity
              style={s.avatarWrap}
              onPress={() => escolherImagem('avatar')}
              activeOpacity={0.8}
            >
              {perfil.avatar ? (
                <Image
                  source={{ uri: perfil.avatar }}
                  style={s.avatarImage}
                />
              ) : (
                <LinearGradient
                  colors={[C.blue, '#3D8EFF']}
                  style={s.avatar}
                >
                  <Text style={s.avatarText}>
                    {iniciais(nome)}
                  </Text>
                </LinearGradient>
              )}

              <View style={s.avatarCamera}>
                <Feather
                  name="camera"
                  size={11}
                  color="#fff"
                />
              </View>
            </TouchableOpacity>

            <View style={s.nameBlock}>
              <Text
                style={s.name}
                numberOfLines={1}
              >
                {nome}
              </Text>

              <Text style={s.handle}>
                {identificador}
              </Text>
            </View>

            <TouchableOpacity
              style={s.editButton}
              onPress={() => {
                setBioEditada(perfil.bio || '');
                setModalEditar(true);
              }}
            >
              <Feather
                name="edit-2"
                size={12}
                color={C.soft}
              />

              <Text style={s.editText}>
                Editar
              </Text>
            </TouchableOpacity>
          </View>

          {/* BIO */}

          <Text style={s.bio}>
            {perfil.bio ||
              'Conte um pouco sobre seu universo audiovisual.'}
          </Text>

          {/* ESTATÍSTICAS */}

          <View style={s.stats}>
            <Stat
              valor={filmes.length}
              label="Filmes"
            />

            <Stat
              valor={series.length}
              label="Séries"
            />

            <Stat
              valor={tempoTela}
              label="Em tela"
            />

            <Stat
              valor={listas.length}
              label="Listas"
            />
          </View>

          {/* CONEXÕES */}

          <View style={s.followLine}>
            <View style={s.followIcon}>
              <Feather
                name="users"
                size={14}
                color={C.blueLight}
              />
            </View>

            <Text style={s.followText}>
              Conecte-se com outros cinéfilos no CineTrack
            </Text>
          </View>

          {/* GÊNEROS */}

          {generos.length > 0 && (
            <View style={s.genres}>
              {generos.map((g, i) => (
                <View
                  key={`${g}-${i}`}
                  style={[
                    s.genre,
                    {
                      borderColor:
                        [
                          C.blue,
                          C.purple,
                          '#FF5B75',
                        ][i % 3] + '66',
                    },
                  ]}
                >
                  <Text style={s.genreText}>
                    {g}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* WRAPPED */}

        <View style={s.section}>
          <SectionTitle>
            CINE TRACK WRAPPED · {anoAtual}
          </SectionTitle>

          <LinearGradient
            colors={[
              '#0A0520',
              '#1A0A3E',
              '#0E1530',
            ]}
            style={s.wrapped}
          >
            <View style={s.wrappedGlow} />

            <Text style={s.wrappedTag}>
              ✦ SEU ANO EM AUDIOVISUAL
            </Text>

            <Text style={s.wrappedTitle}>
              {desteAno.length
                ? `Seu ${anoAtual} no CineTrack`
                : `Sua jornada em ${anoAtual}`}
            </Text>

            <View style={s.wrappedStats}>
              <WrappedStat
                value={desteAno.length}
                label="obras registradas"
              />

              <WrappedStat
                value={
                  desteAno.filter(
                    o => o.tipo === 'movie'
                  ).length
                }
                label="filmes"
              />

              <WrappedStat
                value={mediaAno}
                label="nota média"
              />
            </View>

            <View style={s.progressTrack}>
              <View
                style={[
                  s.progressFill,
                  {
                    width: `${
                      Math.min(
                        100,
                        desteAno.length * 5
                      )
                    }%`,
                  },
                ]}
              />
            </View>

            <Text style={s.wrappedFoot}>
              Dados calculados a partir dos seus registros salvos.
            </Text>
          </LinearGradient>
        </View>

        {/* ASSISTIDOS RECENTEMENTE */}

        <View style={s.section}>
          <SectionTitle>
            ASSISTIDOS RECENTEMENTE
          </SectionTitle>

          {recentes.length ? (
            <View style={s.posterGrid}>
              {recentes.map((item, i) => (
                <TouchableOpacity
                  key={`${item.tipo}-${item.id}-${i}`}
                  style={s.posterItem}
                  onPress={() =>
                    onAbrirDetalhes?.(item)
                  }
                  activeOpacity={0.85}
                >
                  {posterUri(item) ? (
                    <Image
                      source={{
                        uri: posterUri(item),
                      }}
                      style={s.poster}
                    />
                  ) : (
                    <View style={s.posterFallback}>
                      <Feather
                        name="film"
                        size={22}
                        color={C.muted}
                      />
                    </View>
                  )}

                  <View style={s.posterShade} />

                  {item.nota ? (
                    <View style={s.posterRating}>
                      {renderEstrelas(item.nota)}
                    </View>
                  ) : null}
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Empty
              texto="Seus filmes e séries registrados aparecerão aqui."
            />
          )}
        </View>

        {/* MINHAS LISTAS */}

        <View style={s.section}>
          <SectionTitle>
            MINHAS LISTAS
          </SectionTitle>

          {listas.length ? (
            listas.map((lista, i) => {
              const itens = itensDe(
                lista.itens ||
                lista.items ||
                lista.obras ||
                []
              );

              const capas = itens.slice(0, 4);

              return (
                <View
                  key={`${lista.id}-${i}`}
                  style={s.listCard}
                >
                  <View style={s.listCovers}>
                    {[0, 1, 2, 3].map(n => (
                      <View
                        key={n}
                        style={s.listCover}
                      >
                        {posterUri(capas[n] || {}) ? (
                          <Image
                            source={{
                              uri: posterUri(capas[n]),
                            }}
                            style={s.coverImg}
                          />
                        ) : (
                          <MaterialCommunityIcons
                            name="movie-open-outline"
                            size={15}
                            color={C.muted}
                          />
                        )}
                      </View>
                    ))}
                  </View>

                  <View style={s.listInfo}>
                    <Text
                      style={s.listName}
                      numberOfLines={1}
                    >
                      {lista.nome}
                    </Text>

                    <Text style={s.listMeta}>
                      {itens.length}{' '}
                      {itens.length === 1
                        ? 'obra'
                        : 'obras'}
                    </Text>
                  </View>

                  <Text style={s.listBadge}>
                    {lista.publica === false ||
                    lista.privada
                      ? 'PRIVADA'
                      : 'LISTA'}
                  </Text>
                </View>
              );
            })
          ) : (
            <Empty
              texto="Quando você criar listas, elas serão exibidas aqui."
            />
          )}
        </View>

        <View style={s.bottomSpace} />
      </ScrollView>

      {/* NAVEGAÇÃO INFERIOR */}

      <View style={s.bottomNav}>
        <NavItem
          icon="home"
          label="Home"
          onPress={onAbrirHome || onVoltar}
        />

        <NavItem
          icon="book-open"
          label="Diário"
          onPress={onAbrirDiario}
        />

        <TouchableOpacity
          style={s.addButton}
          onPress={onAdicionar}
        >
          <Feather
            name="plus"
            size={24}
            color="#fff"
          />
        </TouchableOpacity>

        <View style={s.navItem}>
          <Feather
            name="user"
            size={21}
            color={C.blueLight}
          />

          <Text
            style={[
              s.navLabel,
              { color: C.blueLight },
            ]}
          >
            Perfil
          </Text>
        </View>

        <TouchableOpacity
          style={s.navItem}
          onPress={() =>
            Alert.alert(
              'Conta',
              'Deseja sair da sua conta?',
              [
                {
                  text: 'Cancelar',
                  style: 'cancel',
                },
                {
                  text: 'Sair',
                  style: 'destructive',
                  onPress: onLogout,
                },
              ]
            )
          }
        >
          <Feather
            name="log-out"
            size={20}
            color={C.muted}
          />

          <Text style={s.navLabel}>
            Sair
          </Text>
        </TouchableOpacity>
      </View>

      {/* MODAL EDITAR PERFIL */}

      <Modal
        visible={modalEditar}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setModalEditar(false)
        }
      >
        <View style={s.modalBackdrop}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>
              Editar perfil
            </Text>

            <Text style={s.inputLabel}>
              BIO
            </Text>

            <TextInput
              value={bioEditada}
              onChangeText={setBioEditada}
              placeholder="Fale sobre seus gostos audiovisuais..."
              placeholderTextColor={C.muted}
              multiline
              maxLength={180}
              style={s.bioInput}
            />

            <Text style={s.charCount}>
              {bioEditada.length}/180
            </Text>

            <View style={s.modalActions}>
              <TouchableOpacity
                onPress={() =>
                  setModalEditar(false)
                }
                style={s.cancelButton}
              >
                <Text style={s.cancelText}>
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={async () => {
                  await salvarPerfil({
                    bio: bioEditada.trim(),
                  });

                  setModalEditar(false);
                }}
                style={s.saveButton}
              >
                <Text style={s.saveText}>
                  Salvar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL ESCOLHER CAPA */}

      <Modal
        visible={modalCapas}
        animationType="slide"
        onRequestClose={() =>
          setModalCapas(false)
        }
      >
        <SafeAreaView style={s.coverModal}>
          <View style={s.coverHeader}>
            <Text style={s.modalTitle}>
              Escolher capa
            </Text>

            <TouchableOpacity
              onPress={() =>
                setModalCapas(false)
              }
            >
              <Feather
                name="x"
                size={24}
                color={C.text}
              />
            </TouchableOpacity>
          </View>

          <Text style={s.coverSubtitle}>
            Escolha uma imagem de filme ou série em alta,
            ou use uma foto da galeria.
          </Text>

          <TouchableOpacity
            style={s.galleryButton}
            onPress={() => {
              setModalCapas(false);
              escolherImagem('capa');
            }}
          >
            <Feather
              name="image"
              size={17}
              color={C.blueLight}
            />

            <Text style={s.galleryText}>
              Escolher da galeria
            </Text>
          </TouchableOpacity>

          {buscandoCapas ? (
            <ActivityIndicator
              color={C.blueLight}
              style={{ marginTop: 30 }}
            />
          ) : (
            <ScrollView
              contentContainerStyle={s.coverGrid}
            >
              {opcoesCapa.map(item => (
                <TouchableOpacity
                  key={`${item.tipo}-${item.id}`}
                  style={s.coverOption}
                  onPress={() =>
                    selecionarCapa(item)
                  }
                >
                  <Image
                    source={{
                      uri: `${
                        TMDB_IMAGE.replace(
                          '/w500',
                          '/w780'
                        )
                      }${
                        item.backdrop_path ||
                        item.poster_path
                      }`,
                    }}
                    style={s.coverOptionImage}
                  />

                  <View style={s.coverOptionShade} />

                  <Text
                    style={s.coverOptionTitle}
                    numberOfLines={2}
                  >
                    {tituloMidia(item)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// ============================================================
// COMPONENTES AUXILIARES
// ============================================================

function Stat({ valor, label }) {
  return (
    <View style={s.stat}>
      <Text style={s.statValue}>
        {valor}
      </Text>

      <Text style={s.statLabel}>
        {label}
      </Text>
    </View>
  );
}

function WrappedStat({ value, label }) {
  return (
    <View style={s.wrappedStat}>
      <Text style={s.wrappedValue}>
        {value}
      </Text>

      <Text style={s.wrappedLabel}>
        {label}
      </Text>
    </View>
  );
}

function SectionTitle({ children }) {
  return (
    <View style={s.sectionTitleRow}>
      <Text style={s.sectionTitle}>
        {children}
      </Text>

      <View style={s.sectionRule} />
    </View>
  );
}

function Empty({ texto }) {
  return (
    <View style={s.empty}>
      <Feather
        name="film"
        size={20}
        color={C.muted}
      />

      <Text style={s.emptyText}>
        {texto}
      </Text>
    </View>
  );
}

function NavItem({ icon, label, onPress }) {
  return (
    <TouchableOpacity
      style={s.navItem}
      onPress={onPress}
    >
      <Feather
        name={icon}
        size={21}
        color={C.muted}
      />

      <Text style={s.navLabel}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ============================================================
// ESTILOS
// ============================================================

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
  },

  scroll: {
    paddingBottom: 12,
  },

  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },

  loadingText: {
    color: C.muted,
    fontSize: 12,
  },

  hero: {
    paddingHorizontal: 20,
  },

  banner: {
    height: 116,
    marginHorizontal: -20,
    overflow: 'hidden',
    backgroundColor: '#10152B',
  },

  bannerImage: {
    resizeMode: 'cover',
  },

  bannerGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20,70,150,0.12)',
  },

  bannerActions: {
    position: 'absolute',
    top: 12,
    right: 14,
    flexDirection: 'row',
    gap: 8,
  },

  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.48)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: -37,
    marginBottom: 10,
    gap: 12,
  },

  avatarWrap: {
    width: 82,
    height: 82,
    borderRadius: 42,
    borderWidth: 3,
    borderColor: C.bg,
    overflow: 'visible',
  },

  avatar: {
    flex: 1,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarImage: {
    width: 76,
    height: 76,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: C.bg,
  },

  avatarText: {
    color: '#fff',
    fontSize: 27,
    fontWeight: '900',
  },

  avatarCamera: {
    position: 'absolute',
    right: -1,
    bottom: 1,
    width: 23,
    height: 23,
    borderRadius: 12,
    backgroundColor: C.blue,
    borderWidth: 2,
    borderColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  nameBlock: {
    flex: 1,
    paddingBottom: 5,
  },

  name: {
    color: C.text,
    fontSize: 20,
    fontWeight: '900',
  },

  handle: {
    color: C.muted,
    fontSize: 11,
    marginTop: 3,
  },

  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 5,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: C.border,
  },

  editText: {
    color: C.soft,
    fontSize: 11,
    fontWeight: '700',
  },

  bio: {
    color: 'rgba(244,246,250,0.62)',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 15,
  },

  stats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.025)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    marginBottom: 14,
  },

  stat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 13,
  },

  statValue: {
    color: C.text,
    fontSize: 21,
    fontWeight: '900',
  },

  statLabel: {
    color: C.muted,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 4,
  },

  followLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 14,
  },

  followIcon: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: 'rgba(26,111,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  followText: {
    color: 'rgba(244,246,250,0.48)',
    fontSize: 11,
  },

  genres: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },

  genre: {
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255,255,255,0.025)',
  },

  genreText: {
    color: C.soft,
    fontSize: 10,
    fontWeight: '700',
  },

  section: {
    paddingHorizontal: 20,
    marginTop: 18,
  },

  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },

  sectionTitle: {
    color: C.muted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.7,
  },

  sectionRule: {
    flex: 1,
    height: 1,
    backgroundColor: C.border,
  },

  wrapped: {
    borderRadius: 17,
    padding: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(26,111,255,0.22)',
  },

  wrappedGlow: {
    position: 'absolute',
    top: -30,
    right: -25,
    width: 160,
    height: 130,
    borderRadius: 100,
    backgroundColor: 'rgba(80,140,255,0.12)',
  },

  wrappedTag: {
    color: C.blueLight,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.7,
  },

  wrappedTitle: {
    color: C.text,
    fontSize: 19,
    fontWeight: '900',
    marginTop: 7,
    marginBottom: 15,
  },

  wrappedStats: {
    flexDirection: 'row',
    gap: 22,
  },

  wrappedStat: {
    minWidth: 70,
  },

  wrappedValue: {
    color: C.text,
    fontSize: 23,
    fontWeight: '900',
  },

  wrappedLabel: {
    color: 'rgba(244,246,250,0.48)',
    fontSize: 9,
    marginTop: 3,
  },

  progressTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginTop: 15,
    overflow: 'hidden',
  },

  progressFill: {
    height: 3,
    borderRadius: 2,
    backgroundColor: C.blueLight,
  },

  wrappedFoot: {
    color: 'rgba(244,246,250,0.35)',
    fontSize: 9,
    marginTop: 8,
  },

  posterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },

  posterItem: {
    width: '23.5%',
    aspectRatio: 2 / 3,
    borderRadius: 9,
    overflow: 'hidden',
    backgroundColor: C.surface,
  },

  poster: {
    width: '100%',
    height: '100%',
  },

  posterFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  posterShade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '35%',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },

  posterRating: {
    position: 'absolute',
    bottom: 5,
    left: 4,
  },

  stars: {
    flexDirection: 'row',
    gap: 1,
  },

  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 11,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.025)',
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 8,
  },

  listCovers: {
    width: 50,
    height: 50,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },

  listCover: {
    width: 24,
    height: 24,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  coverImg: {
    width: '100%',
    height: '100%',
  },

  listInfo: {
    flex: 1,
  },

  listName: {
    color: C.text,
    fontSize: 13,
    fontWeight: '800',
  },

  listMeta: {
    color: C.muted,
    fontSize: 10,
    marginTop: 4,
  },

  listBadge: {
    color: C.green,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.7,
    backgroundColor: 'rgba(29,185,84,0.09)',
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 6,
  },

  empty: {
    minHeight: 76,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    gap: 7,
  },

  emptyText: {
    color: C.muted,
    fontSize: 11,
    textAlign: 'center',
  },

  bottomSpace: {
    height: 90,
  },

  bottomNav: {
    height: 68,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(7,9,13,0.98)',
    borderTopWidth: 1,
    borderTopColor: C.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 5,
  },

  navItem: {
    minWidth: 52,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },

  navLabel: {
    color: C.muted,
    fontSize: 9,
  },

  addButton: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: C.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -13,
    elevation: 6,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    padding: 22,
  },

  modalCard: {
    backgroundColor: '#111722',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: C.border,
  },

  modalTitle: {
    color: C.text,
    fontSize: 19,
    fontWeight: '900',
  },

  inputLabel: {
    color: C.muted,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginTop: 20,
    marginBottom: 8,
  },

  bioInput: {
    minHeight: 100,
    color: C.text,
    backgroundColor: '#080D16',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    padding: 12,
    textAlignVertical: 'top',
  },

  charCount: {
    color: C.muted,
    textAlign: 'right',
    fontSize: 9,
    marginTop: 5,
  },

  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 18,
  },

  cancelButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  cancelText: {
    color: C.soft,
    fontWeight: '700',
  },

  saveButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 9,
    backgroundColor: C.blue,
  },

  saveText: {
    color: '#fff',
    fontWeight: '800',
  },

  coverModal: {
    flex: 1,
    backgroundColor: C.bg,
    paddingHorizontal: 16,
  },

  coverHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
  },

  coverSubtitle: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },

  galleryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: 'rgba(26,111,255,0.12)',
    padding: 13,
    borderRadius: 10,
    marginBottom: 14,
  },

  galleryText: {
    color: C.blueLight,
    fontWeight: '800',
    fontSize: 12,
  },

  coverGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    paddingBottom: 25,
  },

  coverOption: {
    width: '48%',
    height: 105,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: C.surface,
  },

  coverOptionImage: {
    width: '100%',
    height: '100%',
  },

  coverOptionShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },

  coverOptionTitle: {
    position: 'absolute',
    bottom: 7,
    left: 8,
    right: 8,
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    textShadowColor: '#000',
    textShadowRadius: 5,
  },
});