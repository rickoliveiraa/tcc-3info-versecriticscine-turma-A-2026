
import React, { useRef, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Image,
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

import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { API_URL } from './apiConfig';

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
  green: '#34D399',
};

// ============================================================
// COMPONENTE
// ============================================================

export default function TelaLogin({
  onVoltar,
  onLoginSucesso,
  onCriarConta,
}) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [campoAtivo, setCampoAtivo] = useState('');
  const [enviado, setEnviado] = useState(false);

  const senhaRef = useRef(null);

  const emailLimpo = email.trim().toLowerCase();

  const emailValido =
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailLimpo);

  const emailComErro = enviado && !emailValido;
  const senhaComErro = enviado && !senha.trim();

  // ==========================================================
  // LOGIN
  // ==========================================================

  const realizarLogin = async () => {
    if (carregando) return;

    setEnviado(true);

    if (!emailLimpo || !senha) {
      Alert.alert(
        'Campos obrigatórios',
        'Digite seu e-mail e sua senha para continuar.'
      );
      return;
    }

    if (!emailValido) {
      Alert.alert(
        'E-mail inválido',
        'Confira o endereço de e-mail digitado.'
      );
      return;
    }

    setCarregando(true);

    try {
      const dadosFormulario = new URLSearchParams();

      dadosFormulario.append('email', emailLimpo);
      dadosFormulario.append('senha', senha);

      const resposta = await fetch(`${API_URL}/login.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: dadosFormulario.toString(),
      });

      const textoResposta = await resposta.text();

      let dados;

      try {
        dados = JSON.parse(textoResposta);
      } catch {
        throw new Error(
          'O servidor retornou uma resposta inválida. Verifique a API PHP.'
        );
      }

      if (!resposta.ok || !dados?.sucesso) {
        throw new Error(
          dados?.mensagem || 'E-mail ou senha incorretos.'
        );
      }

      const usuario = dados.usuario;
      const token = dados.token;

      // Verifica se o servidor retornou o usuário.
      if (!usuario || !usuario.id) {
        throw new Error(
          'O servidor não retornou os dados necessários do usuário.'
        );
      }

      // Verifica se o servidor retornou o token.
      if (!token || typeof token !== 'string' || !token.trim()) {
        throw new Error(
          'O servidor não retornou um token de autenticação válido. Verifique a API de login.'
        );
      }

      // ======================================================
      // SALVAR SESSÃO E TOKEN
      // ======================================================
      // As duas informações são salvas juntas.
      // O userStorage.js utiliza o ID desse usuário para
      // separar os dados pessoais de cada conta.

      await AsyncStorage.multiSet([
        [
          '@CineTrack:usuario',
          JSON.stringify(usuario),
        ],
        [
          '@CineTrack:token',
          token,
        ],
      ]);

      console.log(
        'Login realizado com sucesso:',
        usuario.id
      );

      // ======================================================
      // FINALIZAR LOGIN NO APP
      // ======================================================
      // O App.js recebe o usuário e assume a sessão.
      // A sincronização automática de dados antigos foi
      // retirada temporariamente para evitar que registros
      // armazenados em chaves globais sejam enviados para
      // uma conta diferente.
      
      if (typeof onLoginSucesso === 'function') {
        await onLoginSucesso(usuario);
      } else {
        Alert.alert(
          'Bem-vindo ao CineTrack!',
          `Olá, ${usuario.username || usuario.nome || 'cinéfilo'}!`
        );
      }

    } catch (erro) {
      console.error('Erro no login:', erro);

      Alert.alert(
        'Não foi possível entrar',
        erro.message ||
          'Verifique sua conexão e tente novamente.'
      );
    } finally {
      setCarregando(false);
    }
  };

  // ==========================================================
  // CAMPO DE ENTRADA
  // ==========================================================

  const renderCampo = ({
    nome,
    label,
    placeholder,
    valor,
    alterar,
    icone,
    erro,
    tipo = 'default',
    segredo = false,
    refInput,
    teclado = 'default',
    proximo,
    completar,
  }) => {
    const ativo = campoAtivo === nome;

    return (
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>
          {label}
        </Text>

        <View
          style={[
            styles.inputShell,
            ativo && styles.inputShellFocused,
            erro && styles.inputShellError,
          ]}
        >
          <Feather
            name={icone}
            size={19}
            color={
              ativo
                ? C.blueLight
                : C.muted
            }
            style={styles.inputIcon}
          />

          <TextInput
            ref={refInput}
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor="#687386"
            value={valor}
            onChangeText={alterar}
            keyboardType={teclado}
            secureTextEntry={segredo}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!carregando}
            returnKeyType={completar ? 'done' : 'next'}
            onFocus={() => setCampoAtivo(nome)}
            onBlur={() => setCampoAtivo('')}
            onSubmitEditing={completar || proximo}
            autoComplete={
              nome === 'email'
                ? 'email'
                : 'current-password'
            }
            textContentType={
              nome === 'email'
                ? 'emailAddress'
                : 'password'
            }
          />

          {nome === 'senha' && (
            <TouchableOpacity
              style={styles.passwordToggle}
              onPress={() =>
                setMostrarSenha(value => !value)
              }
              disabled={carregando}
              hitSlop={10}
              accessibilityLabel={
                mostrarSenha
                  ? 'Ocultar senha'
                  : 'Mostrar senha'
              }
            >
              <Feather
                name={
                  mostrarSenha
                    ? 'eye-off'
                    : 'eye'
                }
                size={19}
                color={C.secondary}
              />
            </TouchableOpacity>
          )}

          {nome === 'email' && emailValido && (
            <Ionicons
              name="checkmark-circle"
              size={19}
              color={C.green}
            />
          )}
        </View>

        {erro && (
          <Text style={styles.errorText}>
            {nome === 'email'
              ? 'Digite um e-mail válido.'
              : 'Informe sua senha.'}
          </Text>
        )}
      </View>
    );
  };

  // ==========================================================
  // INTERFACE
  // ==========================================================

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={C.bg}
      />

      <View
        pointerEvents="none"
        style={styles.background}
      >
        <View style={styles.glowTop} />
        <View style={styles.glowBottom} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : 'height'
        }
        keyboardVerticalOffset={
          Platform.OS === 'ios' ? 10 : 0
        }
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* CABEÇALHO */}

          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={onVoltar}
              disabled={carregando}
              activeOpacity={0.8}
            >
              <Feather
                name="arrow-left"
                size={21}
                color={C.text}
              />
            </TouchableOpacity>

            <View style={styles.securePill}>
              <Ionicons
                name="shield-checkmark-outline"
                size={14}
                color={C.blueLight}
              />

              <Text style={styles.securePillText}>
                ACESSO SEGURO
              </Text>
            </View>

            <View style={styles.topSpacer} />
          </View>

          {/* MARCA */}

          <View style={styles.brand}>
            <View style={styles.logoFrame}>
              <Image
                source={require('./assets/logo-cinetrack.png')}
                style={styles.logo}
                resizeMode="contain"
                fadeDuration={0}
              />
            </View>

            <Text style={styles.kicker}>
              SEU UNIVERSO AUDIOVISUAL
            </Text>
          </View>

          {/* TEXTO PRINCIPAL */}

          <View style={styles.intro}>
            <Text style={styles.title}>
              Que bom ter
            </Text>

            <Text style={styles.titleAccent}>
              você de volta.
            </Text>

            <Text style={styles.subtitle}>
              Entre na sua conta e continue registrando
              cada história que merece ser lembrada.
            </Text>
          </View>

          {/* FORMULÁRIO */}

          <View style={styles.formCard}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardTitle}>
                  Entrar na conta
                </Text>

                <Text style={styles.cardSubtitle}>
                  Acesse seu espaço no CineTrack.
                </Text>
              </View>

              <View style={styles.cardIcon}>
                <Feather
                  name="user"
                  size={21}
                  color={C.blueLight}
                />
              </View>
            </View>

            {renderCampo({
              nome: 'email',
              label: 'E-MAIL',
              placeholder: 'voce@exemplo.com',
              valor: email,
              alterar: setEmail,
              icone: 'mail',
              teclado: 'email-address',
              erro: emailComErro,
              proximo: () => senhaRef.current?.focus(),
            })}

            {renderCampo({
              nome: 'senha',
              label: 'SENHA',
              placeholder: 'Digite sua senha',
              valor: senha,
              alterar: setSenha,
              icone: 'lock',
              segredo: !mostrarSenha,
              refInput: senhaRef,
              erro: senhaComErro,
              completar: realizarLogin,
            })}

            <TouchableOpacity
              style={styles.forgotButton}
              onPress={() =>
                Alert.alert(
                  'Recuperação de senha',
                  'A recuperação automática ainda não está conectada ao servidor. Entre em contato com a equipe do CineTrack para recuperar seu acesso.'
                )
              }
              disabled={carregando}
            >
              <Text style={styles.forgotText}>
                Esqueci minha senha
              </Text>

              <Feather
                name="arrow-up-right"
                size={14}
                color={C.blueLight}
              />
            </TouchableOpacity>

            {/* BOTÃO */}

            <TouchableOpacity
              style={styles.loginButton}
              onPress={realizarLogin}
              disabled={carregando}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#438EFF', '#2563EB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginGradient}
              >
                {carregando ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.loginButtonText}>
                      Entrar no CineTrack
                    </Text>

                    <Feather
                      name="arrow-right"
                      size={20}
                      color="#FFFFFF"
                    />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.securityNote}>
              <Feather
                name="lock"
                size={13}
                color={C.muted}
              />

              <Text style={styles.securityNoteText}>
                Seus dados são protegidos pela sua conta.
              </Text>
            </View>
          </View>

          {/* CADASTRO */}

          <View style={styles.registerRow}>
            <Text style={styles.registerText}>
              Ainda não tem uma conta?
            </Text>

            <TouchableOpacity
              onPress={onCriarConta}
              disabled={!onCriarConta || carregando}
              activeOpacity={0.8}
            >
              <Text style={styles.registerLink}>
                {' '}Criar conta
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footerCaption}>
            CINEMA · SÉRIES · MÚSICA
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ============================================================
// ESTILOS
// ============================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.bg,
  },

  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.bg,
    overflow: 'hidden',
  },

  glowTop: {
    position: 'absolute',
    top: -160,
    right: -130,
    width: 360,
    height: 390,
    borderRadius: 200,
    backgroundColor: 'rgba(37,99,235,0.16)',
  },

  glowBottom: {
    position: 'absolute',
    bottom: -220,
    left: -150,
    width: 370,
    height: 390,
    borderRadius: 200,
    backgroundColor: 'rgba(14,165,233,0.08)',
  },

  scroll: {
    flexGrow: 1,
    paddingHorizontal: 23,
    paddingTop: Platform.OS === 'android' ? 12 : 8,
    paddingBottom: 30,
  },

  topBar: {
    height: 49,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 13,
  },

  backButton: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: C.elevated,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  securePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 7,
    backgroundColor: 'rgba(59,130,246,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.19)',
  },

  securePillText: {
    color: C.blueLight,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },

  topSpacer: {
    width: 43,
  },

  brand: {
    alignItems: 'center',
    marginBottom: 24,
  },

  logoFrame: {
    width: 126,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },

  logo: {
    width: 126,
    height: 100,
  },

  kicker: {
    color: '#7DA9E8',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2.2,
    marginTop: 4,
  },

  intro: {
    marginBottom: 23,
  },

  title: {
    color: C.text,
    fontSize: 34,
    lineHeight: 39,
    fontWeight: '900',
    letterSpacing: -0.8,
  },

  titleAccent: {
    color: C.blueLight,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '900',
    letterSpacing: -0.8,
  },

  subtitle: {
    color: C.secondary,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 12,
    maxWidth: 350,
  },

  formCard: {
    width: '100%',
    padding: 20,
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
    marginBottom: 23,
  },

  cardTitle: {
    color: C.text,
    fontSize: 20,
    fontWeight: '900',
  },

  cardSubtitle: {
    color: C.muted,
    fontSize: 12,
    marginTop: 5,
  },

  cardIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: 'rgba(59,130,246,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  inputGroup: {
    marginBottom: 19,
  },

  inputLabel: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.3,
    marginBottom: 9,
  },

  inputShell: {
    minHeight: 59,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
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

  inputIcon: {
    marginRight: 12,
  },

  input: {
    flex: 1,
    minHeight: 57,
    color: C.text,
    fontSize: 15,
    paddingVertical: 0,
  },

  passwordToggle: {
    padding: 7,
    marginLeft: 5,
  },

  errorText: {
    color: C.red,
    fontSize: 11,
    marginTop: 7,
  },

  forgotButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 5,
    paddingVertical: 5,
    marginTop: -5,
    marginBottom: 20,
  },

  forgotText: {
    color: C.blueLight,
    fontSize: 12,
    fontWeight: '800',
  },

  loginButton: {
    height: 59,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: C.blue,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.24,
    shadowRadius: 9,
  },

  loginGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },

  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },

  securityNote: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
    marginTop: 16,
  },

  securityNoteText: {
    color: C.muted,
    fontSize: 10,
  },

  registerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
  },

  registerText: {
    color: C.secondary,
    fontSize: 13,
  },

  registerLink: {
    color: C.blueLight,
    fontSize: 13,
    fontWeight: '900',
  },

  footerCaption: {
    color: '#46536A',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: 25,
  },
});
