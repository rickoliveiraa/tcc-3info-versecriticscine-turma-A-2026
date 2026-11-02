
/* =========================================================
   CINETRACK — SPOTIFY
   Busca de álbuns e faixas + player oficial incorporado.
========================================================= */

const SERVER_BASE_URL =
  'https://compatible-assumed-williams-felt.trycloudflare.com/TCC/TCC';

const SPOTIFY_TOKEN_URL =
  `${SERVER_BASE_URL}/spotify_token.php`;

const SPOTIFY_API_URL =
  'https://api.spotify.com/v1';

const TIMEOUT_MS = 20000;

/* =========================================================
   REQUISIÇÕES
========================================================= */

async function fetchComTimeout(
  url,
  options = {},
  timeoutMs = TIMEOUT_MS
) {
  const controller = new AbortController();

  const timer = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error(
        'A conexão demorou demais. Verifique se o Cloudflare Tunnel está ativo.'
      );
    }

    throw new Error(
      `Falha de conexão: ${error?.message || 'Não foi possível acessar o servidor.'}`
    );
  } finally {
    clearTimeout(timer);
  }
}

async function lerJson(resposta, contexto) {
  const texto = await resposta.text();

  let dados;

  try {
    dados = texto ? JSON.parse(texto) : {};
  } catch {
    throw new Error(
      `${contexto}: o servidor não retornou JSON válido.`
    );
  }

  if (!resposta.ok) {
    let mensagem =
      dados?.error?.message ||
      dados?.error?.error_description ||
      dados?.mensagem ||
      `HTTP ${resposta.status}`;

    if (resposta.status === 401) {
      mensagem = 'Token do Spotify inválido ou expirado.';
    }

    if (resposta.status === 403) {
      mensagem =
        'O Spotify recusou a requisição. Verifique as permissões do aplicativo.';
    }

    if (resposta.status === 429) {
      mensagem =
        'Limite de requisições do Spotify atingido. Tente novamente depois.';
    }

    throw new Error(`${contexto}: ${mensagem}`);
  }

  return dados;
}

async function requisicaoJson(url, options, contexto) {
  const resposta = await fetchComTimeout(url, options);
  return lerJson(resposta, contexto);
}

/* =========================================================
   TOKEN DO SPOTIFY — SERVIDOR PHP
========================================================= */

export async function obterTokenSpotify() {
  const dados = await requisicaoJson(
    SPOTIFY_TOKEN_URL,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    },
    'Não foi possível obter o token do Spotify'
  );

  const token =
    dados.access_token ||
    dados.token ||
    dados.accessToken;

  if (!token || typeof token !== 'string') {
    throw new Error(
      dados.mensagem ||
      'O servidor não retornou um token válido.'
    );
  }

  return token;
}

/* =========================================================
   CONSULTAS À API SPOTIFY
========================================================= */

async function spotifyGet(caminho, token) {
  return requisicaoJson(
    `${SPOTIFY_API_URL}${caminho}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    },
    'Erro ao consultar o catálogo do Spotify'
  );
}

async function buscarAlbuns(token, consulta) {
  const parametros = new URLSearchParams({
    q: consulta,
    type: 'album',
    limit: '10',
    market: 'BR',
  });

  const dados = await spotifyGet(
    `/search?${parametros.toString()}`,
    token
  );

  return dados?.albums?.items || [];
}

/* =========================================================
   PLAYER OFICIAL — SPOTIFY IFRAME API

   O player é criado para uma faixa individual.
   A API permite chamar play() e togglePlay().
   Se o autoplay for bloqueado pelo ambiente, os controles
   oficiais continuam disponíveis no próprio player.
========================================================= */

export function criarHtmlPlayerSpotify(
  embedUrl,
  altura = 152,
  iniciarAutomaticamente = true
) {
  const correspondencia = String(embedUrl || '').match(
    /^https:\/\/open\.spotify\.com\/embed\/track\/([A-Za-z0-9]+)/
  );

  if (!correspondencia) {
    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
      </head>
      <body style="
        margin:0;
        background:#121212;
        color:white;
        font-family:Arial,sans-serif;
        padding:12px;
      ">
        Não foi possível carregar esta faixa.
      </body>
      </html>
    `;
  }

  const trackId = correspondencia[1];

  const alturaSegura = Math.max(
    152,
    Math.min(Number(altura) || 152, 180)
  );

  const urlFallback =
    `https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0`;

  const autoPlay = iniciarAutomaticamente ? 'true' : 'false';

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">

      <meta
        name="viewport"
        content="width=device-width, initial-scale=1, maximum-scale=1"
      >

      <meta
        name="referrer"
        content="strict-origin-when-cross-origin"
      >

      <style>
        * {
          box-sizing: border-box;
        }

        html,
        body {
          width: 100%;
          height: 100%;
          min-height: ${alturaSegura}px;
          margin: 0;
          padding: 0;
          overflow: hidden;
          background: #121212;
        }

        #embed-iframe {
          width: 100%;
          height: ${alturaSegura}px;
          overflow: hidden;
          background: #121212;
          border-radius: 8px;
        }

        iframe {
          display: block;
          width: 100% !important;
          height: ${alturaSegura}px !important;
          border: 0;
          border-radius: 8px;
          background: #121212;
        }
      </style>
    </head>

    <body>
      <div id="embed-iframe">
        <iframe
          src="${urlFallback}"
          width="100%"
          height="${alturaSegura}"
          frameborder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          title="Player do Spotify"
        ></iframe>
      </div>

      <script>
        (function () {
          var controller = null;
          var playPendente = ${autoPlay};
          var apiPronta = false;
          var fallbackAtivo = true;

          var elemento = document.getElementById('embed-iframe');

          function enviarMensagem(tipo, extra) {
            try {
              if (
                window.ReactNativeWebView &&
                window.ReactNativeWebView.postMessage
              ) {
                window.ReactNativeWebView.postMessage(
                  JSON.stringify(
                    Object.assign(
                      { type: tipo },
                      extra || {}
                    )
                  )
                );
              }
            } catch (e) {}
          }

          function tocar() {
            if (!controller) {
              playPendente = true;
              return;
            }

            try {
              controller.play();
              enviarMensagem('play_requested');
            } catch (e) {
              enviarMensagem('play_error', {
                message: String(e)
              });
            }
          }

          function alternarReproducao() {
            if (!controller) {
              playPendente = true;
              return;
            }

            try {
              controller.togglePlay();
            } catch (e) {
              enviarMensagem('play_error', {
                message: String(e)
              });
            }
          }

          window.CineTrackSpotifyPlay = tocar;

          window.CineTrackSpotifyToggle =
            alternarReproducao;

          window.CineTrackSpotifyPause = function () {
            if (!controller) return;

            try {
              controller.pause();
            } catch (e) {}
          };

          window.onSpotifyIframeApiReady = function (IFrameAPI) {
            try {
              elemento.innerHTML = '';

              var opcoes = {
                width: '100%',
                height: ${alturaSegura},
                uri: 'spotify:track:${trackId}'
              };

              IFrameAPI.createController(
                elemento,
                opcoes,
                function (EmbedController) {
                  controller = EmbedController;
                  fallbackAtivo = false;

                  controller.addListener(
                    'ready',
                    function () {
                      apiPronta = true;

                      enviarMensagem('ready');

                      if (playPendente) {
                        playPendente = false;

                        setTimeout(function () {
                          tocar();
                        }, 250);
                      }
                    }
                  );

                  controller.addListener(
                    'playback_started',
                    function () {
                      enviarMensagem('playing');
                    }
                  );

                  controller.addListener(
                    'playback_update',
                    function (evento) {
                      var dados = evento.data || {};

                      if (dados.isBuffering) {
                        enviarMensagem('buffering');
                      } else if (dados.isPaused) {
                        enviarMensagem('paused');
                      } else {
                        enviarMensagem('playing');
                      }
                    }
                  );

                  enviarMensagem('controller_created');
                }
              );
            } catch (e) {
              enviarMensagem('api_error', {
                message: String(e)
              });
            }
          };

          enviarMensagem('loading');

          var script = document.createElement('script');

          script.src =
            'https://open.spotify.com/embed/iframe-api/v1';

          script.async = true;

          script.onerror = function () {
            enviarMensagem('api_error', {
              message: 'Não foi possível carregar a API do player.'
            });
          };

          document.body.appendChild(script);
        })();
      </script>
    </body>
    </html>
  `;
}

/* =========================================================
   NORMALIZAÇÃO E PONTUAÇÃO
========================================================= */

function normalizarTexto(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function pontuarAlbum(
  album,
  tituloPT,
  tituloOriginal,
  ano
) {
  const nome = normalizarTexto(album?.name);

  const original = normalizarTexto(tituloOriginal);
  const portugues = normalizarTexto(tituloPT);

  let pontos = 0;

  if (nome.includes('official soundtrack')) {
    pontos += 22;
  } else if (nome.includes('soundtrack')) {
    pontos += 18;
  }

  if (nome.includes('motion picture')) {
    pontos += 15;
  }

  if (nome.includes('original score')) {
    pontos += 15;
  } else if (nome.includes('score')) {
    pontos += 9;
  }

  if (nome.includes('original music')) {
    pontos += 11;
  }

  if (nome.includes('music from')) {
    pontos += 9;
  }

  if (nome.includes('complete')) {
    pontos += 3;
  }

  if (original && nome.includes(original)) {
    pontos += 24;
  } else if (original) {
    const termos = original
      .split(' ')
      .filter(t => t.length > 2);

    const coincidencias = termos.filter(
      t => nome.includes(t)
    ).length;

    pontos += Math.min(15, coincidencias * 4);
  }

  if (portugues && nome.includes(portugues)) {
    pontos += 14;
  }

  const anoAlbum = String(
    album?.release_date || ''
  ).slice(0, 4);

  if (ano && anoAlbum === String(ano)) {
    pontos += 5;
  }

  return pontos;
}

/* =========================================================
   CONSULTAS DE BUSCA
========================================================= */

function montarConsultas(
  tituloPT,
  tituloOriginal,
  ano
) {
  const pt = String(tituloPT || '').trim();

  const original = String(
    tituloOriginal || pt
  ).trim();

  const consultas = [];

  if (original && ano) {
    consultas.push(
      `album:"${original}" year:${ano}`
    );
  }

  if (original) {
    consultas.push(
      `album:"${original}" soundtrack`,
      `"${original}" original motion picture soundtrack`,
      `"${original}" original score`,
      `"${original}" soundtrack`,
      `"${original}" score`,
      `${original} soundtrack`,
      `${original} original score`,
      original
    );
  }

  if (
    pt &&
    normalizarTexto(pt) !== normalizarTexto(original)
  ) {
    consultas.push(
      `"${pt}" trilha sonora`,
      `"${pt}" soundtrack`,
      `${pt} original score`,
      pt
    );
  }

  return [...new Set(consultas.filter(Boolean))];
}

/* =========================================================
   LOCALIZA O MELHOR ÁLBUM
========================================================= */

async function localizarMelhorAlbum(
  token,
  tituloPT,
  tituloOriginal,
  ano
) {
  const consultas = montarConsultas(
    tituloPT,
    tituloOriginal,
    ano
  );

  const candidatos = new Map();

  for (const consulta of consultas) {
    const albuns = await buscarAlbuns(
      token,
      consulta
    );

    for (const album of albuns) {
      if (album?.id && !candidatos.has(album.id)) {
        candidatos.set(album.id, album);
      }
    }

    if (candidatos.size >= 40) {
      break;
    }
  }

  const classificados = [...candidatos.values()]
    .map(album => ({
      album,
      pontos: pontuarAlbum(
        album,
        tituloPT,
        tituloOriginal,
        ano
      ),
    }))
    .sort((a, b) => b.pontos - a.pontos);

  return classificados[0]?.album || null;
}

/* =========================================================
   DETALHES DO ÁLBUM
========================================================= */

async function carregarDadosAlbum(token, albumId) {
  return spotifyGet(
    `/albums/${encodeURIComponent(albumId)}?market=BR`,
    token
  );
}

/* =========================================================
   FAIXAS DO ÁLBUM
========================================================= */

async function carregarFaixasDoAlbum(
  token,
  albumId
) {
  let faixas = [];

  let offset = 0;
  const limite = 50;

  let total = Infinity;

  while (
    offset < total &&
    faixas.length < 250
  ) {
    const dados = await spotifyGet(
      `/albums/${encodeURIComponent(albumId)}/tracks?market=BR&limit=${limite}&offset=${offset}`,
      token
    );

    const itens = dados?.items || [];

    faixas = faixas.concat(itens);

    total = Number(dados?.total || 0);

    if (!itens.length) {
      break;
    }

    offset += itens.length;
  }

  return faixas;
}

/* =========================================================
   MONTA ALBUM E FAIXAS
========================================================= */

function formatarAlbum(
  albumSpotify,
  dadosAlbum,
  faixas
) {
  const albumId = albumSpotify.id;

  const albumUrl =
    dadosAlbum?.external_urls?.spotify ||
    albumSpotify?.external_urls?.spotify ||
    `https://open.spotify.com/album/${albumId}`;

  const imagem =
    dadosAlbum?.images?.[0]?.url ||
    albumSpotify?.images?.[0]?.url ||
    null;

  const albumEmbedUrl =
    `https://open.spotify.com/embed/album/${albumId}?utm_source=generator&theme=0`;

  const album = {
    id: albumId,

    name:
      dadosAlbum?.name ||
      albumSpotify.name ||
      'Trilha sonora',

    artists: (
      dadosAlbum?.artists ||
      albumSpotify?.artists ||
      []
    )
      .map(a => a.name)
      .filter(Boolean),

    image: imagem,

    releaseDate:
      dadosAlbum?.release_date ||
      albumSpotify?.release_date ||
      null,

    totalTracks:
      dadosAlbum?.total_tracks ||
      albumSpotify?.total_tracks ||
      faixas.length,

    spotifyUrl: albumUrl,

    embedUrl: albumEmbedUrl,

    embedHtml: null,
  };

  const tracks = faixas.map(
    (faixa, index) => {
      const trackUrl =
        faixa.external_urls?.spotify ||
        (faixa.id
          ? `https://open.spotify.com/track/${faixa.id}`
          : albumUrl);

      const trackEmbedUrl = faixa.id
        ? `https://open.spotify.com/embed/track/${faixa.id}?utm_source=generator&theme=0`
        : null;

      return {
        id:
          faixa.id ||
          `${albumId}-${index}`,

        name:
          faixa.name ||
          'Faixa sem título',

        artists: (
          faixa.artists || []
        )
          .map(a => a.name)
          .filter(Boolean),

        trackNumber:
          faixa.track_number ||
          index + 1,

        durationMs:
          faixa.duration_ms ||
          0,

        spotifyUrl: trackUrl,

        embedUrl: trackEmbedUrl,

        embedHtml: null,

        previewUrl: faixa.preview_url || null,

        albumImage: imagem,
      };
    }
  );

  return {
    album,
    tracks,
    embedUrl: album.embedUrl,
    embedHtml: null,
    spotifyUrl: album.spotifyUrl,
  };
}

/* =========================================================
   FUNÇÃO PRINCIPAL
========================================================= */

export async function buscarTrilhaSonora(
  tituloPT,
  tituloOriginal,
  ano
) {
  if (!tituloPT && !tituloOriginal) {
    throw new Error(
      'Não há título suficiente para buscar a trilha sonora.'
    );
  }

  try {
    console.log(
      '[CineTrack Spotify] Iniciando:',
      tituloPT,
      tituloOriginal,
      ano
    );

    const token = await obterTokenSpotify();

    console.log(
      '[CineTrack Spotify] Token recebido.'
    );

    const albumEncontrado = await localizarMelhorAlbum(
      token,
      tituloPT,
      tituloOriginal,
      ano
    );

    if (!albumEncontrado?.id) {
      console.log(
        '[CineTrack Spotify] Nenhum álbum encontrado.'
      );

      return {
        album: null,
        tracks: [],
        embedUrl: null,
        embedHtml: null,
        spotifyUrl: null,
      };
    }

    console.log(
      '[CineTrack Spotify] Álbum encontrado:',
      albumEncontrado.name
    );

    const dadosAlbum = await carregarDadosAlbum(
      token,
      albumEncontrado.id
    );

    const faixas = await carregarFaixasDoAlbum(
      token,
      albumEncontrado.id
    );

    const resultado = formatarAlbum(
      albumEncontrado,
      dadosAlbum,
      faixas
    );

    console.log(
      '[CineTrack Spotify] Concluído:',
      resultado.album.name,
      '—',
      resultado.tracks.length,
      'faixas.'
    );

    return resultado;
  } catch (error) {
    console.error(
      '[CineTrack Spotify] Erro:',
      error
    );

    throw error;
  }
}

export default buscarTrilhaSonora;
