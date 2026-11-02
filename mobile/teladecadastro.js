import React, { useMemo, useRef, useState } from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  Feather,
  Ionicons,
  MaterialCommunityIcons,
} from '@expo/vector-icons';

import { LinearGradient } from 'expo-linear-gradient';
import { API_URL } from './apiConfig';

// ============================================================
// CHAVES DA SESSÃO
// ============================================================

const CHAVE_USUARIO = '@CineTrack:usuario';
const CHAVE_TOKEN = '@CineTrack:token';

// ============================================================
// IDENTIDADE VISUAL CINETRACK
// ============================================================

const C = {
  bg: '#050608',
  surface: '#0D0F13',
  card: '#101620',
  elevated: '#151C28',
  border: 'rgba(255,255,255,0.085)',
  blue: '#3B82F6',
  blueLight: '#60A5FA',
  text: '#F5F7FA',
  secondary: '#9CA3AF',
  muted: '#687386',
  red: '#F87171',
  yellow: '#FBBF24',
  green: '#34D399',
};

// ============================================================
// FUNÇÃO AUXILIAR — INTERPRETAR RESPOSTA DA API
// ============================================================

async function interpretarResposta(resposta) {
  const texto = await resposta.text();

  try {
    return JSON.parse(texto);
  } catch {
    throw new Error(
      'O servidor retornou uma resposta inválida. Verifique a API PHP.'
    );
  }
}

// ============================================================
// COMPONENTE
// ============================================================

export default function TelaCadastro({
  onVoltar,
  onEntrar,
  onCadastroSucesso,
}) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  const [verSenha, setVerSenha] = useState(false);
  const [verConfirmarSenha, setVerConfirmarSenha] = useState(false);

  const [aceitouTermos, setAceitouTermos] = useState(false);

  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const emailRef = useRef(null);
  const senhaRef = useRef(null);
  const confirmarSenhaRef = useRef(null);

  // ==========================================================
  // VALIDAÇÕES
  // ==========================================================

  const nomeNormalizado = nome.trim();
  const emailNormalizado = email.trim().toLowerCase();

  const nomeValido = nomeNormalizado.length >= 2;

  const emailValido =
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailNormalizado);

  const senhaValida =
    senha.length >= 8 &&
    /[A-Z]/.test(senha) &&
    /[a-z]/.test(senha) &&
    /\d/.test(senha);

  const senhasIguais =
    senha.length > 0 &&
    senha === confirmarSenha;

  // ==========================================================
  // FORÇA DA SENHA
  // ==========================================================

  const forcaSenha = useMemo(() => {
    if (!senha) {
      return {
        nivel: 0,
        cor: '#334155',
        texto: 'Use uma senha forte',
      };
    }

    let pontos = 0;

    if (senha.length >= 8) pontos++;
    if (senha.length >= 12) pontos++;

    if (
      /[A-Z]/.test(senha) &&
      /[a-z]/.test(senha)
    ) {
      pontos++;
    }

    if (/\d/.test(senha)) pontos++;

    if (/[^A-Za-z0-9]/.test(senha)) pontos++;

    if (pontos <= 1) {
      return {
        nivel: 1,
        cor: C.red,
        texto: 'Fraca',
      };
    }

    if (pontos === 2) {
      return {
        nivel: 2,
        cor: C.yellow,
        texto: 'Razoável',
      };
    }

    if (pontos <= 4) {
      return {
        nivel: 3,
        cor: C.blueLight,
        texto: 'Boa',
      };
    }

    return {
      nivel: 4,
      cor: C.green,
      texto: 'Forte',
    };
  }, [senha]);

  // ==========================================================
  // MENSAGENS DE ERRO
  // ==========================================================

  const mostrarErro = mensagem => {
    Alert.alert(
      'Confira seus dados',
      mensagem
    );
  };

  // ==========================================================
  // AUTENTICAÇÃO APÓS O CADASTRO
  // ==========================================================

  const autenticarNovaConta = async dadosCadastro => {
    let usuarioRetornado = dadosCadastro.usuario || {};

    let token = typeof dadosCadastro.token === 'string'
      ? dadosCadastro.token.trim()
      : '';

    let usuarioId =
      usuarioRetornado.id ??
      dadosCadastro.id ??
      null;

    /*
     * Se cadastro.php não retornar token ou ID válido,
     * fazemos login automático com os dados recém-cadastrados.
     *
     * Isso garante que a sessão seja vinculada ao usuário
     * realmente criado no banco de dados.
     */

    if (!token || usuarioId === null || usuarioId === '') {
      const dadosLogin = new URLSearchParams();

      dadosLogin.append('email', emailNormalizado);
      dadosLogin.append('senha', senha);

      const respostaLogin = await fetch(
        `${API_URL}/login.php`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
          },
          body: dadosLogin.toString(),
        }
      );

      const login = await interpretarResposta(respostaLogin);

      if (
        !respostaLogin.ok ||
        !login?.sucesso ||
        !login?.token ||
        !login?.usuario?.id
      ) {
        throw new Error(
          'Sua conta foi criada, mas não foi possível iniciar sua sessão automaticamente. Entre usando seu e-mail e sua senha.'
        );
      }

      usuarioRetornado = login.usuario;
      usuarioId = login.usuario.id;
      token = String(login.token).trim();
    }

    // Não aceita um ID inventado ou inexistente.
    if (
      usuarioId === null ||
      usuarioId === undefined ||
      String(usuarioId).trim() === '' ||
      !token
    ) {
      throw new Error(
        'O servidor não retornou os dados de autenticação necessários. Verifique o cadastro.php e o login.php.'
      );
    }

    const novoUsuario = {
      ...usuarioRetornado,
      id: usuarioId,
      username:
        usuarioRetornado.username ||
        usuarioRetornado.nome ||
        nomeNormalizado,
      nome:
        usuarioRetornado.nome ||
        nomeNormalizado,
      email:
        usuarioRetornado.email ||
        emailNormalizado,
      role:
        usuarioRetornado.role ||
        'user',
      created_at:
        usuarioRetornado.created_at ||
        new Date().toISOString(),
    };

    /*
     * IMPORTANTE:
     * A sessão e o token são salvos antes de chamar
     * onCadastroSucesso.
     *
     * O userStorage.js utiliza o ID de @CineTrack:usuario
     * para separar os dados de cada conta.
     */

    await AsyncStorage.multiSet([
      [
        CHAVE_USUARIO,
        JSON.stringify(novoUsuario),
      ],
      [
        CHAVE_TOKEN,
        token,
      ],
    ]);

    return novoUsuario;
  };

  // ==========================================================
  // CADASTRO — PHP + SQLITE
  // ==========================================================

  const handleCadastro = async () => {
    if (loading) return;

    Keyboard.dismiss();
    setSubmitted(true);

    if (!nomeValido) {
      mostrarErro(
        'Digite seu nome com pelo menos 2 caracteres.'
      );
      return;
    }

    if (!emailValido) {
      mostrarErro(
        'Digite um endereço de e-mail válido.'
      );
      return;
    }

    if (senha.length < 8) {
      mostrarErro(
        'Sua senha precisa ter pelo menos 8 caracteres.'
      );
      return;
    }

    if (
      !/[A-Z]/.test(senha) ||
      !/[a-z]/.test(senha) ||
      !/\d/.test(senha)
    ) {
      mostrarErro(
        'Use letras maiúsculas, minúsculas e pelo menos um número na senha.'
      );
      return;
    }

    if (!senhasIguais) {
      mostrarErro(
        'As senhas não coincidem. Confira os dois campos.'
      );
      return;
    }

    if (!aceitouTermos) {
      mostrarErro(
        'Você precisa aceitar os Termos de Uso e a Política de Privacidade.'
      );
      return;
    }

    setLoading(true);

    try {
      const dadosFormulario = new URLSearchParams();

      dadosFormulario.append('nome', nomeNormalizado);
      dadosFormulario.append('email', emailNormalizado);
      dadosFormulario.append('senha', senha);

      const resposta = await fetch(
        `${API_URL}/cadastro.php`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
          },
          body: dadosFormulario.toString(),
        }
      );

      const dados = await interpretarResposta(resposta);

      if (!resposta.ok || !dados?.sucesso) {
        throw new Error(
          dados?.mensagem ||
          'Não foi possível criar sua conta.'
        );
      }

      // Cria a sessão individual da conta recém-cadastrada.
      const novoUsuario = await autenticarNovaConta(dados);

      Alert.alert(
        'Sua conta está pronta!',
        'Bem-vindo ao CineTrack. Agora vamos conhecer seus gostos e escolher seus gêneros favoritos.',
        [
          {
            text: 'Continuar',
            onPress: () => {
              if (
                typeof onCadastroSucesso === 'function'
              ) {
                onCadastroSucesso(novoUsuario);
              }
            },
          },
        ]
      );

    } catch (erro) {
      console.error('Erro no cadastro:', erro);

      Alert.alert(
        'Não foi possível concluir o cadastro',
        erro.message ||
          'Verifique sua conexão e tente novamente.'
      );

    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // ESTILO DINÂMICO DOS CAMPOS
  // ==========================================================

  const fieldStyle = name => {
    const invalido =
      submitted &&
      (
        (name === 'nome' && !nomeValido) ||
        (name === 'email' && !emailValido) ||
        (name === 'senha' && !senhaValida) ||
        (name === 'confirmarSenha' && !senhasIguais)
      );

    return [
      styles.inputShell,
      focusedField === name && styles.inputShellFocused,
      invalido && styles.inputShellError,
    ];
  };

  // ==========================================================
  // LABEL
  // ==========================================================

  const renderLabel = (label, hint) => (
    <View style={styles.labelRow}>
      <Text style={styles.label}>
        {label}
      </Text>

      {hint ? (
        <Text style={styles.labelHint}>
          {hint}
        </Text>
      ) : null}
    </View>
  );

  // ==========================================================
  // INTERFACE
  // ==========================================================

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={C.bg}
      />

      {/* ILUMINAÇÃO DO FUNDO */}

      <View
        pointerEvents="none"
        style={styles.background}
      >
        <View style={styles.glowA} />
        <View style={styles.glowB} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : 'height'
        }
        keyboardVerticalOffset={
          Platform.OS === 'ios'
            ? 12
            : 0
        }
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* ==================================================
              CABEÇALHO
          ================================================== */}

          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={onVoltar}
              disabled={loading}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Voltar"
            >
              <Feather
                name="arrow-left"
                size={21}
                color={C.text}
              />
            </TouchableOpacity>

            <View style={styles.stepPill}>
              <View style={styles.stepDot} />

              <Text style={styles.stepText}>
                PASSO 1 DE 2
              </Text>
            </View>

            <View style={styles.topSpacer} />
          </View>

          {/* ==================================================
              MARCA E INTRODUÇÃO
          ================================================== */}

          <View style={styles.intro}>
            <View style={styles.logoContainer}>
              <Image
                source={require('./assets/logo-cinetrack.png')}
                style={styles.logoImage}
                resizeMode="contain"
                fadeDuration={0}
                accessibilityLabel="Logo CineTrack"
              />
            </View>

            <Text style={styles.kicker}>
              BEM-VINDO AO CINETRACK
            </Text>

            <Text style={styles.title}>
              Sua próxima história
            </Text>

            <Text style={styles.titleAccent}>
              começa aqui.
            </Text>

            <Text style={styles.subtitle}>
              Crie sua conta e organize os filmes,
              séries e trilhas que fazem parte de você.
            </Text>
          </View>

          {/* ==================================================
              FORMULÁRIO
          ================================================== */}

          <View style={styles.formCard}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardTitle}>
                  Criar conta
                </Text>

                <Text style={styles.cardSubtitle}>
                  Seu espaço começa com alguns dados.
                </Text>
              </View>

              <View style={styles.lockBadge}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={21}
                  color={C.blueLight}
                />
              </View>
            </View>

            {/* NOME */}

            <View style={styles.inputGroup}>
              {renderLabel(
                'NOME',
                'Como podemos te chamar?'
              )}

              <View style={fieldStyle('nome')}>
                <Ionicons
                  name="person-outline"
                  size={21}
                  color={
                    focusedField === 'nome'
                      ? C.blueLight
                      : C.muted
                  }
                  style={styles.fieldIcon}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Seu nome"
                  placeholderTextColor="#687386"
                  value={nome}
                  onChangeText={setNome}
                  autoCapitalize="words"
                  autoCorrect={false}
                  textContentType="name"
                  returnKeyType="next"
                  editable={!loading}
                  onFocus={() =>
                    setFocusedField('nome')
                  }
                  onBlur={() =>
                    setFocusedField('')
                  }
                  onSubmitEditing={() =>
                    emailRef.current?.focus()
                  }
                  accessibilityLabel="Nome"
                />

                {nomeValido && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={C.green}
                  />
                )}
              </View>

              {submitted && !nomeValido && (
                <Text style={styles.errorText}>
                  Informe seu nome.
                </Text>
              )}
            </View>

            {/* E-MAIL */}

            <View style={styles.inputGroup}>
              {renderLabel(
                'E-MAIL',
                'Será usado para entrar'
              )}

              <View style={fieldStyle('email')}>
                <Ionicons
                  name="mail-outline"
                  size={21}
                  color={
                    focusedField === 'email'
                      ? C.blueLight
                      : C.muted
                  }
                  style={styles.fieldIcon}
                />

                <TextInput
                  ref={emailRef}
                  style={styles.input}
                  placeholder="voce@exemplo.com"
                  placeholderTextColor="#687386"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="emailAddress"
                  returnKeyType="next"
                  editable={!loading}
                  onFocus={() =>
                    setFocusedField('email')
                  }
                  onBlur={() =>
                    setFocusedField('')
                  }
                  onSubmitEditing={() =>
                    senhaRef.current?.focus()
                  }
                  accessibilityLabel="E-mail"
                />

                {email.length > 0 && emailValido && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={C.green}
                  />
                )}
              </View>

              {submitted && !emailValido && (
                <Text style={styles.errorText}>
                  Digite um e-mail válido.
                </Text>
              )}
            </View>

            {/* SENHA */}

            <View style={styles.inputGroup}>
              {renderLabel(
                'SENHA',
                'Mínimo de 8 caracteres'
              )}

              <View style={fieldStyle('senha')}>
                <Ionicons
                  name="lock-closed-outline"
                  size={21}
                  color={
                    focusedField === 'senha'
                      ? C.blueLight
                      : C.muted
                  }
                  style={styles.fieldIcon}
                />

                <TextInput
                  ref={senhaRef}
                  style={styles.input}
                  placeholder="Crie uma senha"
                  placeholderTextColor="#687386"
                  value={senha}
                  onChangeText={setSenha}
                  secureTextEntry={!verSenha}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="newPassword"
                  returnKeyType="next"
                  editable={!loading}
                  onFocus={() =>
                    setFocusedField('senha')
                  }
                  onBlur={() =>
                    setFocusedField('')
                  }
                  onSubmitEditing={() =>
                    confirmarSenhaRef.current?.focus()
                  }
                  accessibilityLabel="Senha"
                />

                <TouchableOpacity
                  onPress={() =>
                    setVerSenha(value => !value)
                  }
                  hitSlop={10}
                  disabled={loading}
                  accessibilityLabel={
                    verSenha
                      ? 'Ocultar senha'
                      : 'Mostrar senha'
                  }
                >
                  <Ionicons
                    name={
                      verSenha
                        ? 'eye-off-outline'
                        : 'eye-outline'
                    }
                    size={22}
                    color={C.secondary}
                  />
                </TouchableOpacity>
              </View>

              {/* INDICADOR DE FORÇA */}

              {senha.length > 0 && (
                <View style={styles.strengthArea}>
                  <View style={styles.strengthBars}>
                    {[1, 2, 3, 4].map(level => (
                      <View
                        key={level}
                        style={[
                          styles.strengthBar,
                          level <= forcaSenha.nivel && {
                            backgroundColor: forcaSenha.cor,
                          },
                        ]}
                      />
                    ))}
                  </View>

                  <Text
                    style={[
                      styles.strengthLabel,
                      { color: forcaSenha.cor },
                    ]}
                  >
                    {forcaSenha.texto}
                  </Text>
                </View>
              )}

              <View style={styles.passwordRules}>
                <PasswordRule
                  valido={senha.length >= 8}
                  texto="8 caracteres"
                />

                <PasswordRule
                  valido={
                    /[A-Z]/.test(senha) &&
                    /[a-z]/.test(senha)
                  }
                  texto="Maiúscula e minúscula"
                />

                <PasswordRule
                  valido={/\d/.test(senha)}
                  texto="Um número"
                />
              </View>

              {submitted && !senhaValida && (
                <Text style={styles.errorText}>
                  Sua senha precisa atender aos requisitos acima.
                </Text>
              )}
            </View>

            {/* CONFIRMAR SENHA */}

            <View style={styles.inputGroup}>
              {renderLabel(
                'CONFIRMAR SENHA',
                'Repita a senha acima'
              )}

              <View style={fieldStyle('confirmarSenha')}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={21}
                  color={
                    focusedField === 'confirmarSenha'
                      ? C.blueLight
                      : C.muted
                  }
                  style={styles.fieldIcon}
                />

                <TextInput
                  ref={confirmarSenhaRef}
                  style={styles.input}
                  placeholder="Digite a senha novamente"
                  placeholderTextColor="#687386"
                  value={confirmarSenha}
                  onChangeText={setConfirmarSenha}
                  secureTextEntry={!verConfirmarSenha}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="newPassword"
                  returnKeyType="done"
                  editable={!loading}
                  onSubmitEditing={handleCadastro}
                  onFocus={() =>
                    setFocusedField('confirmarSenha')
                  }
                  onBlur={() =>
                    setFocusedField('')
                  }
                  accessibilityLabel="Confirmar senha"
                />

                <TouchableOpacity
                  onPress={() =>
                    setVerConfirmarSenha(value => !value)
                  }
                  hitSlop={10}
                  disabled={loading}
                  accessibilityLabel={
                    verConfirmarSenha
                      ? 'Ocultar confirmação'
                      : 'Mostrar confirmação'
                  }
                >
                  <Ionicons
                    name={
                      verConfirmarSenha
                        ? 'eye-off-outline'
                        : 'eye-outline'
                    }
                    size={22}
                    color={C.secondary}
                  />
                </TouchableOpacity>
              </View>

              {submitted && !senhasIguais && (
                <Text style={styles.errorText}>
                  As senhas precisam ser iguais.
                </Text>
              )}

              {senhasIguais && (
                <View style={styles.passwordMatch}>
                  <Ionicons
                    name="checkmark-circle"
                    size={15}
                    color={C.green}
                  />

                  <Text style={styles.passwordMatchText}>
                    As senhas coincidem.
                  </Text>
                </View>
              )}
            </View>

            {/* TERMOS */}

            <TouchableOpacity
              style={styles.termsRow}
              onPress={() =>
                setAceitouTermos(value => !value)
              }
              activeOpacity={0.8}
              disabled={loading}
              accessibilityRole="checkbox"
              accessibilityState={{
                checked: aceitouTermos,
              }}
            >
              <View
                style={[
                  styles.checkbox,
                  aceitouTermos && styles.checkboxChecked,
                ]}
              >
                {aceitouTermos && (
                  <Feather
                    name="check"
                    size={15}
                    color="#FFFFFF"
                  />
                )}
              </View>

              <Text style={styles.termsText}>
                Li e concordo com os{' '}
                <Text style={styles.termsLink}>
                  Termos de Uso
                </Text>
                {' '}e a{' '}
                <Text style={styles.termsLink}>
                  Política de Privacidade
                </Text>
                .
              </Text>
            </TouchableOpacity>

            {submitted && !aceitouTermos && (
              <Text style={styles.errorText}>
                Aceite os termos para continuar.
              </Text>
            )}

            {/* BOTÃO */}

            <TouchableOpacity
              style={[
                styles.submitButton,
                loading && styles.submitButtonDisabled,
              ]}
              onPress={handleCadastro}
              disabled={loading}
              activeOpacity={0.86}
              accessibilityRole="button"
            >
              <LinearGradient
                colors={['#438EFF', '#2563EB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialCommunityIcons
                      name="account-plus-outline"
                      size={22}
                      color="#FFFFFF"
                    />

                    <Text style={styles.submitText}>
                      Criar minha conta
                    </Text>

                    <Feather
                      name="arrow-right"
                      size={19}
                      color="#FFFFFF"
                    />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.secureNote}>
              <Feather
                name="lock"
                size={13}
                color={C.muted}
              />

              <Text style={styles.secureText}>
                Seus dados são usados para configurar sua conta.
              </Text>
            </View>
          </View>

          {/* ==================================================
              ENTRAR EM CONTA EXISTENTE
          ================================================== */}

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Já tem uma conta?
            </Text>

            <TouchableOpacity
              onPress={onEntrar || onVoltar}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.footerLink}>
                {' '}Entrar
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.bottomCaption}>
            CINEMA · SÉRIES · MÚSICA
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ============================================================
// COMPONENTE AUXILIAR — REQUISITOS DA SENHA
// ============================================================

function PasswordRule({ valido, texto }) {
  return (
    <View style={styles.passwordRule}>
      <Ionicons
        name={
          valido
            ? 'checkmark-circle'
            : 'ellipse-outline'
        }
        size={13}
        color={valido ? '#34D399' : '#62718A'}
      />

      <Text
        style={[
          styles.passwordRuleText,
          valido && styles.passwordRuleValid,
        ]}
      >
        {texto}
      </Text>
    </View>
  );
}

// ============================================================
// ESTILOS
// ============================================================

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  safeArea: {
    flex: 1,
    backgroundColor: C.bg,
  },

  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.bg,
    overflow: 'hidden',
  },

  glowA: {
    position: 'absolute',
    top: -130,
    right: -120,
    width: 330,
    height: 370,
    borderRadius: 200,
    backgroundColor: 'rgba(37,99,235,0.17)',
  },

  glowB: {
    position: 'absolute',
    bottom: -200,
    left: -130,
    width: 350,
    height: 400,
    borderRadius: 220,
    backgroundColor: 'rgba(14,165,233,0.09)',
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 28,
  },

  // CABEÇALHO

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.elevated,
    borderWidth: 1,
    borderColor: C.border,
  },

  stepPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(59,130,246,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.20)',
  },

  stepDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: C.blueLight,
  },

  stepText: {
    color: '#93C5FD',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },

  topSpacer: {
    width: 44,
  },

  // INTRODUÇÃO

  intro: {
    marginBottom: 23,
  },

  logoContainer: {
    width: 112,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 17,
    backgroundColor: 'transparent',
  },

  logoImage: {
    width: 112,
    height: 100,
    backgroundColor: 'transparent',
  },

  kicker: {
    color: '#7DA9E8',
    fontSize: 10,
    letterSpacing: 1.9,
    fontWeight: '900',
    marginBottom: 9,
  },

  title: {
    color: '#F8FAFC',
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '900',
    letterSpacing: -0.7,
  },

  titleAccent: {
    color: C.blueLight,
    fontSize: 32,
    lineHeight: 39,
    fontWeight: '900',
    letterSpacing: -0.7,
  },

  subtitle: {
    color: C.secondary,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 12,
    maxWidth: 360,
  },

  // CARTÃO DO FORMULÁRIO

  formCard: {
    padding: 19,
    borderRadius: 23,
    backgroundColor: 'rgba(13,17,26,0.96)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 8,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
  },

  cardTitle: {
    color: C.text,
    fontSize: 21,
    fontWeight: '900',
  },

  cardSubtitle: {
    color: C.muted,
    fontSize: 12,
    marginTop: 5,
  },

  lockBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59,130,246,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.20)',
  },

  // CAMPOS

  inputGroup: {
    marginBottom: 18,
  },

  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
    marginBottom: 9,
  },

  label: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
  },

  labelHint: {
    color: C.muted,
    fontSize: 11,
  },

  inputShell: {
    minHeight: 59,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#0B111C',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.17)',
  },

  inputShellFocused: {
    borderColor: 'rgba(96,165,250,0.75)',
    backgroundColor: '#0E192B',
  },

  inputShellError: {
    borderColor: 'rgba(248,113,113,0.75)',
  },

  fieldIcon: {
    marginRight: 12,
  },

  input: {
    flex: 1,
    minHeight: 57,
    color: C.text,
    fontSize: 15,
    paddingVertical: 0,
  },

  errorText: {
    color: C.red,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 7,
  },

  // FORÇA DA SENHA

  strengthArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 11,
  },

  strengthBars: {
    flex: 1,
    flexDirection: 'row',
    gap: 5,
  },

  strengthBar: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(148,163,184,0.16)',
  },

  strengthLabel: {
    minWidth: 72,
    textAlign: 'right',
    fontSize: 11,
    fontWeight: '900',
  },

  passwordRules: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 11,
  },

  passwordRule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  passwordRuleText: {
    color: '#65758E',
    fontSize: 10,
  },

  passwordRuleValid: {
    color: C.green,
  },

  passwordMatch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
  },

  passwordMatchText: {
    color: C.green,
    fontSize: 11,
    fontWeight: '700',
  },

  // TERMOS

  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 1,
    marginBottom: 18,
  },

  checkbox: {
    width: 23,
    height: 23,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#52627A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
    marginTop: 1,
  },

  checkboxChecked: {
    backgroundColor: C.blue,
    borderColor: C.blue,
  },

  termsText: {
    flex: 1,
    color: C.secondary,
    fontSize: 12,
    lineHeight: 19,
  },

  termsLink: {
    color: '#93C5FD',
    fontWeight: '900',
  },

  // BOTÃO DE CADASTRO

  submitButton: {
    minHeight: 60,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 7,
    shadowColor: C.blue,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },

  submitButtonDisabled: {
    opacity: 0.65,
  },

  submitGradient: {
    flex: 1,
    minHeight: 60,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 11,
  },

  submitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },

  secureNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 15,
  },

  secureText: {
    color: C.muted,
    fontSize: 10,
    textAlign: 'center',
  },

  // RODAPÉ

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 23,
  },

  footerText: {
    color: C.secondary,
    fontSize: 13,
  },

  footerLink: {
    color: C.blueLight,
    fontSize: 13,
    fontWeight: '900',
  },

  bottomCaption: {
    textAlign: 'center',
    color: '#46536A',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.7,
    marginTop: 23,
  },
});