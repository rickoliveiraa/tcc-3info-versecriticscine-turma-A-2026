
import React, { useMemo, useState } from 'react';
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

// Nova logo do CineTrack.
// Arquivo esperado: assets/logo-cinetrack.png
const LOGO_CINETRACK = require('./assets/logo-cinetrack.png');

// Protótipo local: os dados ficam apenas na memória.
// Para produção, conecte esta tela ao backend e use autenticação segura.
let usuariosCadastrados = [];

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

  const emailNormalizado = email.trim().toLowerCase();

  const emailValido =
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailNormalizado);

  const nomeValido = nome.trim().length >= 2;

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

    if (/[A-Z]/.test(senha) && /[a-z]/.test(senha)) {
      pontos++;
    }

    if (/\d/.test(senha) && /[^A-Za-z0-9]/.test(senha)) {
      pontos++;
    }

    if (pontos <= 1) {
      return { nivel: 1, cor: '#F87171', texto: 'Fraca' };
    }

    if (pontos === 2) {
      return { nivel: 2, cor: '#FBBF24', texto: 'Razoável' };
    }

    if (pontos === 3) {
      return { nivel: 3, cor: '#60A5FA', texto: 'Boa' };
    }

    return { nivel: 4, cor: '#34D399', texto: 'Forte' };
  }, [senha]);

  const mostrarErro = mensagem => {
    Alert.alert('Confira seus dados', mensagem);
  };

  const handleCadastro = () => {
    Keyboard.dismiss();
    setSubmitted(true);

    if (!nomeValido) {
      return mostrarErro(
        'Digite seu nome com pelo menos 2 caracteres.'
      );
    }

    if (!emailValido) {
      return mostrarErro(
        'Digite um endereço de e-mail válido.'
      );
    }

    if (senha.length < 8) {
      return mostrarErro(
        'Sua senha precisa ter pelo menos 8 caracteres.'
      );
    }

    if (
      !/[A-Z]/.test(senha) ||
      !/[a-z]/.test(senha) ||
      !/\d/.test(senha)
    ) {
      return mostrarErro(
        'Use letras maiúsculas, minúsculas e pelo menos um número na senha.'
      );
    }

    if (senha !== confirmarSenha) {
      return mostrarErro('As senhas não coincidem.');
    }

    if (!aceitouTermos) {
      return mostrarErro(
        'Você precisa aceitar os Termos de Uso e a Política de Privacidade.'
      );
    }

    const existe = usuariosCadastrados.some(
      user => user.email === emailNormalizado
    );

    if (existe) {
      return mostrarErro(
        'Este e-mail já foi cadastrado neste protótipo.'
      );
    }

    setLoading(true);

    const novoUsuario = {
      id: `${Date.now()}`,
      username: nome.trim(),
      email: emailNormalizado,

      // Protótipo apenas. Não armazene senhas assim em produção.
      password_hash: senha,

      role: 'user',
      created_at: new Date().toISOString(),
    };

    usuariosCadastrados.push(novoUsuario);

    setTimeout(() => {
      setLoading(false);

      Alert.alert(
        'Conta criada!',
        'Seu perfil CineTrack está pronto. Vamos escolher seus gêneros favoritos?',
        [
          {
            text: 'Continuar',
            onPress: () => onCadastroSucesso?.(novoUsuario),
          },
        ]
      );
    }, 500);
  };

  const fieldStyle = name => [
    styles.inputShell,
    focusedField === name && styles.inputShellFocused,
    submitted &&
      name === 'nome' &&
      !nomeValido &&
      styles.inputShellError,
    submitted &&
      name === 'email' &&
      !emailValido &&
      styles.inputShellError,
    submitted &&
      name === 'senha' &&
      senha.length < 8 &&
      styles.inputShellError,
    submitted &&
      name === 'confirmarSenha' &&
      senha !== confirmarSenha &&
      styles.inputShellError,
  ];

  const renderLabel = (label, hint) => (
    <View style={styles.labelRow}>
      <Text style={styles.label}>{label}</Text>

      {hint ? (
        <Text style={styles.labelHint}>{hint}</Text>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#050914"
      />

      <View
        pointerEvents="none"
        style={styles.background}
      >
        <View style={styles.glowA} />
        <View style={styles.glowB} />
        <View style={styles.backgroundLine} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={onVoltar}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Voltar para a tela inicial"
            >
              <Feather
                name="arrow-left"
                size={22}
                color="#E2E8F0"
              />
            </TouchableOpacity>

            <View style={styles.stepPill}>
              <View style={styles.stepDot} />
              <Text style={styles.stepText}>
                PASSO 1 DE 2
              </Text>
            </View>

            <View style={styles.topBarSpacer} />
          </View>

          <View style={styles.intro}>
            {/* NOVA LOGO CINETRACK */}
            <View style={styles.logoContainer}>
              <Image
                source={LOGO_CINETRACK}
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
              Crie sua conta e organize os filmes, séries e trilhas
              que fazem parte de você.
            </Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardTitle}>
                  Criar conta
                </Text>

                <Text style={styles.cardSubtitle}>
                  Leva menos de um minuto.
                </Text>
              </View>

              <View style={styles.lockBadge}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={21}
                  color="#60A5FA"
                />
              </View>
            </View>

            {/* NOME */}
            <View style={styles.inputGroup}>
              {renderLabel('NOME', 'Como podemos te chamar?')}

              <View style={fieldStyle('nome')}>
                <Ionicons
                  name="person-outline"
                  size={21}
                  color={
                    focusedField === 'nome'
                      ? '#60A5FA'
                      : '#71829D'
                  }
                  style={styles.fieldIcon}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Seu nome"
                  placeholderTextColor="#596A84"
                  value={nome}
                  onChangeText={setNome}
                  autoCapitalize="words"
                  autoCorrect={false}
                  textContentType="name"
                  returnKeyType="next"
                  onFocus={() => setFocusedField('nome')}
                  onBlur={() => setFocusedField('')}
                  accessibilityLabel="Nome"
                />

                {nomeValido ? (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color="#34D399"
                  />
                ) : null}
              </View>

              {submitted && !nomeValido ? (
                <Text style={styles.errorText}>
                  Informe seu nome.
                </Text>
              ) : null}
            </View>

            {/* E-MAIL */}
            <View style={styles.inputGroup}>
              {renderLabel('E-MAIL', 'Será usado para entrar')}

              <View style={fieldStyle('email')}>
                <Ionicons
                  name="mail-outline"
                  size={21}
                  color={
                    focusedField === 'email'
                      ? '#60A5FA'
                      : '#71829D'
                  }
                  style={styles.fieldIcon}
                />

                <TextInput
                  style={styles.input}
                  placeholder="voce@exemplo.com"
                  placeholderTextColor="#596A84"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="emailAddress"
                  returnKeyType="next"
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField('')}
                  accessibilityLabel="E-mail"
                />

                {email.length > 0 && emailValido ? (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color="#34D399"
                  />
                ) : null}
              </View>

              {submitted && !emailValido ? (
                <Text style={styles.errorText}>
                  Digite um e-mail válido.
                </Text>
              ) : null}
            </View>

            {/* SENHA */}
            <View style={styles.inputGroup}>
              {renderLabel('SENHA', 'Mínimo de 8 caracteres')}

              <View style={fieldStyle('senha')}>
                <Ionicons
                  name="lock-closed-outline"
                  size={21}
                  color={
                    focusedField === 'senha'
                      ? '#60A5FA'
                      : '#71829D'
                  }
                  style={styles.fieldIcon}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Crie uma senha"
                  placeholderTextColor="#596A84"
                  value={senha}
                  onChangeText={setSenha}
                  secureTextEntry={!verSenha}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="newPassword"
                  returnKeyType="next"
                  onFocus={() => setFocusedField('senha')}
                  onBlur={() => setFocusedField('')}
                  accessibilityLabel="Senha"
                />

                <TouchableOpacity
                  onPress={() => setVerSenha(v => !v)}
                  hitSlop={10}
                  accessibilityLabel={
                    verSenha ? 'Ocultar senha' : 'Mostrar senha'
                  }
                >
                  <Ionicons
                    name={
                      verSenha
                        ? 'eye-off-outline'
                        : 'eye-outline'
                    }
                    size={22}
                    color="#8292AA"
                  />
                </TouchableOpacity>
              </View>

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

              {submitted && senha.length < 8 ? (
                <Text style={styles.errorText}>
                  Use pelo menos 8 caracteres.
                </Text>
              ) : null}
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
                      ? '#60A5FA'
                      : '#71829D'
                  }
                  style={styles.fieldIcon}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Digite a senha novamente"
                  placeholderTextColor="#596A84"
                  value={confirmarSenha}
                  onChangeText={setConfirmarSenha}
                  secureTextEntry={!verConfirmarSenha}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="newPassword"
                  returnKeyType="done"
                  onSubmitEditing={handleCadastro}
                  onFocus={() =>
                    setFocusedField('confirmarSenha')
                  }
                  onBlur={() => setFocusedField('')}
                  accessibilityLabel="Confirmar senha"
                />

                <TouchableOpacity
                  onPress={() =>
                    setVerConfirmarSenha(v => !v)
                  }
                  hitSlop={10}
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
                    color="#8292AA"
                  />
                </TouchableOpacity>
              </View>

              {submitted && senha !== confirmarSenha ? (
                <Text style={styles.errorText}>
                  As senhas precisam ser iguais.
                </Text>
              ) : null}
            </View>

            {/* TERMOS */}
            <TouchableOpacity
              style={styles.termsRow}
              onPress={() =>
                setAceitouTermos(value => !value)
              }
              activeOpacity={0.8}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: aceitouTermos }}
            >
              <View
                style={[
                  styles.checkbox,
                  aceitouTermos && styles.checkboxChecked,
                ]}
              >
                {aceitouTermos ? (
                  <Feather
                    name="check"
                    size={16}
                    color="#FFFFFF"
                  />
                ) : null}
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

            {submitted && !aceitouTermos ? (
              <Text
                style={[
                  styles.errorText,
                  styles.termsError,
                ]}
              >
                Aceite os termos para continuar.
              </Text>
            ) : null}

            {/* BOTÃO DE CADASTRO */}
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
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="account-plus-outline"
                    size={23}
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
            </TouchableOpacity>

            <View style={styles.secureNote}>
              <Ionicons
                name="lock-closed-outline"
                size={15}
                color="#6F819D"
              />

              <Text style={styles.secureText}>
                Seus dados são usados para configurar seu perfil.
              </Text>
            </View>
          </View>

          {/* ENTRAR EM CONTA EXISTENTE */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Já tem uma conta?
            </Text>

            <TouchableOpacity
              onPress={onEntrar || onVoltar}
              activeOpacity={0.8}
            >
              <Text style={styles.footerLink}>
                {' '}Entrar
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.bottomCaption}>
            CINEMA, SÉRIES E MÚSICA. TUDO CONECTADO.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#050914',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    backgroundColor: '#050914',
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
  backgroundLine: {
    position: 'absolute',
    top: 280,
    right: -150,
    width: 260,
    height: 460,
    backgroundColor: 'rgba(30,64,175,0.06)',
    transform: [{ rotate: '-24deg' }],
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 28,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15,23,42,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.17)',
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
    backgroundColor: '#60A5FA',
  },
  stepText: {
    color: '#93C5FD',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.0,
  },
  topBarSpacer: {
    width: 46,
  },
  intro: {
    marginBottom: 23,
  },

  // A imagem não recebe fundo, borda ou círculo.
  // A transparência depende do arquivo PNG utilizado.
  logoContainer: {
    width: 112,
    height: 112,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    backgroundColor: 'transparent',
  },
  logoImage: {
    width: 112,
    height: 112,
    backgroundColor: 'transparent',
  },

  kicker: {
    color: '#7DA9E8',
    fontSize: 12,
    letterSpacing: 1.8,
    fontWeight: '900',
    marginBottom: 9,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.7,
  },
  titleAccent: {
    color: '#60A5FA',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.7,
  },
  subtitle: {
    color: '#9AAAC1',
    fontSize: 16,
    lineHeight: 24,
    marginTop: 12,
    maxWidth: 360,
  },
  formCard: {
    padding: 20,
    borderRadius: 24,
    backgroundColor: 'rgba(10,17,32,0.90)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.16)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
  },
  cardTitle: {
    color: '#F8FAFC',
    fontSize: 21,
    fontWeight: '900',
  },
  cardSubtitle: {
    color: '#71829D',
    fontSize: 13,
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
  inputGroup: {
    marginBottom: 18,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 9,
    flexWrap: 'wrap',
    gap: 5,
  },
  label: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.0,
  },
  labelHint: {
    color: '#64748B',
    fontSize: 12,
  },
  inputShell: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    borderRadius: 14,
    backgroundColor: 'rgba(15,23,42,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.17)',
  },
  inputShellFocused: {
    borderColor: 'rgba(96,165,250,0.8)',
    backgroundColor: 'rgba(15,32,58,0.95)',
  },
  inputShellError: {
    borderColor: 'rgba(248,113,113,0.75)',
  },
  fieldIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    minHeight: 58,
    color: '#F8FAFC',
    fontSize: 16,
    paddingVertical: 0,
  },
  strengthArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
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
    minWidth: 80,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '800',
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 13,
    marginTop: 7,
    lineHeight: 18,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 1,
    marginBottom: 18,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#52627A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: '#347FF2',
    borderColor: '#347FF2',
  },
  termsText: {
    flex: 1,
    color: '#91A0B7',
    fontSize: 13,
    lineHeight: 20,
  },
  termsLink: {
    color: '#93C5FD',
    fontWeight: '800',
  },
  termsError: {
    marginTop: -10,
    marginBottom: 12,
  },
  submitButton: {
    minHeight: 62,
    borderRadius: 15,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 11,
    backgroundColor: '#347FF2',
    borderWidth: 1,
    borderColor: 'rgba(147,197,253,0.55)',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 7,
  },
  submitButtonDisabled: {
    opacity: 0.65,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
  },
  secureNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 14,
  },
  secureText: {
    color: '#65758E',
    fontSize: 12,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 23,
  },
  footerText: {
    color: '#71829D',
    fontSize: 15,
  },
  footerLink: {
    color: '#93C5FD',
    fontSize: 15,
    fontWeight: '900',
  },
  bottomCaption: {
    textAlign: 'center',
    color: '#42516A',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 23,
  },
});
