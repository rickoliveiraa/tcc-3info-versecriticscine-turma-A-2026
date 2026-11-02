import AsyncStorageNativo from '@react-native-async-storage/async-storage';

/**
 * Armazenamento local separado por conta do CineTrack.
 *
 * As chaves de sessão e autenticação continuam globais:
 * - @CineTrack:usuario
 * - @CineTrack:token
 *
 * Todas as outras chaves @CineTrack:* são automaticamente convertidas
 * para @CineTrack:contas:<ID_DO_USUARIO>:<chave_original>.
 *
 * Importante: telas do app devem importar este módulo no lugar de
 * @react-native-async-storage/async-storage. O App.js e as telas de
 * autenticação podem continuar usando o AsyncStorage nativo para gravar
 * e ler a sessão.
 */

const CHAVE_SESSAO = '@CineTrack:usuario';
const CHAVE_TOKEN = '@CineTrack:token';
const PREFIXO_DADOS = '@CineTrack:';
const PREFIXO_CONTA = '@CineTrack:contas:';

const CHAVES_GLOBAIS = new Set([
  CHAVE_SESSAO,
  CHAVE_TOKEN,
]);

let cacheUsuarioId = null;
let cacheSessaoTexto = null;

async function obterIdUsuarioAtivo() {
  const sessaoTexto = await AsyncStorageNativo.getItem(CHAVE_SESSAO);

  if (sessaoTexto === cacheSessaoTexto && cacheUsuarioId) {
    return cacheUsuarioId;
  }

  cacheSessaoTexto = sessaoTexto;
  cacheUsuarioId = null;

  if (!sessaoTexto) {
    throw new Error(
      'Não há uma conta CineTrack ativa para acessar os dados pessoais.'
    );
  }

  let usuario;

  try {
    usuario = JSON.parse(sessaoTexto);
  } catch {
    throw new Error('A sessão do CineTrack está inválida. Entre novamente.');
  }

  const id = usuario?.id;

  if (id === undefined || id === null || String(id).trim() === '') {
    throw new Error(
      'A conta ativa não possui um ID válido. Entre novamente para carregar seus dados.'
    );
  }

  cacheUsuarioId = String(id);
  return cacheUsuarioId;
}

async function resolverChave(chave) {
  if (typeof chave !== 'string') {
    throw new TypeError('A chave do AsyncStorage precisa ser uma string.');
  }

  if (!chave.startsWith(PREFIXO_DADOS) || CHAVES_GLOBAIS.has(chave)) {
    return chave;
  }

  const usuarioId = await obterIdUsuarioAtivo();
  const parteFinal = chave.slice(PREFIXO_DADOS.length);

  return `${PREFIXO_CONTA}${encodeURIComponent(usuarioId)}:${parteFinal}`;
}

async function resolverPares(pares) {
  return Promise.all(
    (pares || []).map(async par => [
      await resolverChave(par[0]),
      par[1],
    ])
  );
}

const AsyncStoragePorUsuario = {
  async getItem(chave) {
    return AsyncStorageNativo.getItem(await resolverChave(chave));
  },

  async setItem(chave, valor) {
    return AsyncStorageNativo.setItem(
      await resolverChave(chave),
      String(valor)
    );
  },

  async removeItem(chave) {
    return AsyncStorageNativo.removeItem(await resolverChave(chave));
  },

  async multiGet(chaves) {
    const originais = Array.isArray(chaves) ? chaves : [];
    const resolvidas = await Promise.all(originais.map(resolverChave));
    const pares = await AsyncStorageNativo.multiGet(resolvidas);

    // Mantém as chaves lógicas originais para não quebrar Object.fromEntries.
    const valoresPorChave = new Map(pares);

    return originais.map((chave, indice) => [
      chave,
      valoresPorChave.get(resolvidas[indice]) ?? null,
    ]);
  },

  async multiSet(pares) {
    return AsyncStorageNativo.multiSet(await resolverPares(pares));
  },

  async multiRemove(chaves) {
    const resolvidas = await Promise.all(
      (chaves || []).map(resolverChave)
    );

    return AsyncStorageNativo.multiRemove(resolvidas);
  },

  async mergeItem(chave, valor) {
    return AsyncStorageNativo.mergeItem(
      await resolverChave(chave),
      String(valor)
    );
  },

  async multiMerge(pares) {
    return AsyncStorageNativo.multiMerge(await resolverPares(pares));
  },

  async getAllKeys() {
    const usuarioId = await obterIdUsuarioAtivo();
    const prefixoAtual =
      `${PREFIXO_CONTA}${encodeURIComponent(usuarioId)}:`;

    const chaves = await AsyncStorageNativo.getAllKeys();

    return chaves
      .filter(chave =>
        chave.startsWith(prefixoAtual) || CHAVES_GLOBAIS.has(chave)
      )
      .map(chave =>
        chave.startsWith(prefixoAtual)
          ? `${PREFIXO_DADOS}${chave.slice(prefixoAtual.length)}`
          : chave
      );
  },

  async clear() {
    const usuarioId = await obterIdUsuarioAtivo();
    const prefixoAtual =
      `${PREFIXO_CONTA}${encodeURIComponent(usuarioId)}:`;

    const chaves = await AsyncStorageNativo.getAllKeys();

    const chavesDaConta = chaves.filter(
      chave => chave.startsWith(prefixoAtual)
    );

    if (chavesDaConta.length) {
      return AsyncStorageNativo.multiRemove(chavesDaConta);
    }
  },

  flushGetRequests() {
    if (typeof AsyncStorageNativo.flushGetRequests === 'function') {
      return AsyncStorageNativo.flushGetRequests();
    }
  },
};

export async function obterChaveDaConta(chave) {
  return resolverChave(chave);
}

export async function obterUsuarioIdAtivo() {
  return obterIdUsuarioAtivo();
}

/**
 * Migração MANUAL e explícita dos dados antigos sem ID de conta.
 * Execute somente depois de entrar na conta que era dona dos dados antigos.
 * A função não apaga as chaves legadas; apenas copia para a área da conta.
 */
export async function migrarDadosLegadosParaContaAtual() {
  const usuarioId = await obterIdUsuarioAtivo();

  const chavesLegadas = [
    '@CineTrack:registros',
    '@CineTrack:avaliacoes',
    '@CineTrack:listas',
    '@CineTrack:listas_backup',
    '@CineTrack:listas_versao',
    '@CineTrack:minhaLista',
    '@CineTrack:perfil',
    '@CineTrack:novoRegistroEstado',
  ];

  const prefixoAtual =
    `${PREFIXO_CONTA}${encodeURIComponent(usuarioId)}:`;

  const paresLegados =
    await AsyncStorageNativo.multiGet(chavesLegadas);

  const paresComDados = paresLegados.filter(
    ([, valor]) => valor !== null
  );

  if (!paresComDados.length) {
    return { migrados: 0, usuarioId };
  }

  const destinos = paresComDados.map(([chave]) =>
    `${prefixoAtual}${chave.slice(PREFIXO_DADOS.length)}`
  );

  const destinosExistentes =
    await AsyncStorageNativo.multiGet(destinos);

  if (destinosExistentes.some(([, valor]) => valor !== null)) {
    throw new Error(
      'A conta já possui dados separados. A migração foi cancelada para não sobrescrever listas ou avaliações.'
    );
  }

  await AsyncStorageNativo.multiSet(
    paresComDados.map(([chave, valor], indice) => [
      destinos[indice],
      valor,
    ])
  );

  return {
    migrados: paresComDados.length,
    usuarioId,
  };
}

export default AsyncStoragePorUsuario;