import React, { useState } from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';

import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API oficial de login do CineTrack
const API_URL =
  'https://reynolds-christ-while-take.trycloudflare.com/TCC/TCC/api/login.php';

export default function TelaLogin({
  onVoltar,
  onLoginSucesso,
  onCriarConta,
}) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const realizarLogin = async () => {
    const emailLimpo = email.trim().toLowerCase();

    if (!emailLimpo || !senha) {
      Alert.alert(
        'Campos obrigatórios',
        'Digite seu e-mail e sua senha para continuar.'
      );
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpo)) {
      Alert.alert('E-mail inválido', 'Confira o e-mail digitado.');
      return;
    }

    if (carregando) return;

    setCarregando(true);

    try {
      const dadosFormulario = new URLSearchParams();

      dadosFormulario.append('email', emailLimpo);
      dadosFormulario.append('senha', senha);

      const resposta = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: dadosFormulario.toString(),
      });

      const textoResposta = await resposta.text();

      console.log('STATUS HTTP:', resposta.status);
      console.log('RESPOSTA DA API:', textoResposta);

      let dados;

      try {
        dados = JSON.parse(textoResposta);
      } catch (erro) {
        throw new Error(
          'O servidor retornou uma resposta inválida. Verifique o PHP e a conexão.'
        );
      }

      if (!resposta.ok || !dados.sucesso) {
        throw new Error(
          dados.mensagem || 'E-mail ou senha incorretos.'
        );
      }

      const usuario = dados.usuario;

      if (!usuario || !usuario.id) {
        throw new Error(
          'O servidor não retornou os dados necessários do usuário.'
        );
      }

      await AsyncStorage.setItem(
        '@CineTrack:usuario',
        JSON.stringify(usuario)
      );

      console.log('Login realizado:', usuario.email);

      if (typeof onLoginSucesso === 'function') {
        onLoginSucesso(usuario);
      } else {
        Alert.alert(
          'Login realizado!',
          `Bem-vindo ao CineTrack, ${
            usuario.username || 'usuário'
          }!`
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

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topo}>
            {onVoltar && (
              <TouchableOpacity
                style={styles.botaoVoltar}
                onPress={onVoltar}
                accessibilityLabel="Voltar"
              >
                <Feather
                  name="arrow-left"
                  size={23}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            )}

            <Image
              source={require('./assets/logo-cinetrack.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.conteudo}>
            <Text style={styles.titulo}>
              Que bom ter você de volta!
            </Text>

            <Text style={styles.subtitulo}>
              Entre na sua conta e continue acompanhando
              {'\n'}sua jornada audiovisual.
            </Text>

            <View style={styles.formulario}>
              <Text style={styles.label}>E-mail</Text>

              <View style={styles.campo}>
                <Feather
                  name="mail"
                  size={19}
                  color="#8B93A7"
                  style={styles.icone}
                />

                <TextInput
                  style={styles.input}
                  placeholder="seuemail@exemplo.com"
                  placeholderTextColor="#747D91"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  editable={!carregando}
                  returnKeyType="next"
                />
              </View>

              <Text style={styles.label}>Senha</Text>

              <View style={styles.campo}>
                <Feather
                  name="lock"
                  size={19}
                  color="#8B93A7"
                  style={styles.icone}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Digite sua senha"
                  placeholderTextColor="#747D91"
                  value={senha}
                  onChangeText={setSenha}
                  secureTextEntry={!mostrarSenha}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="current-password"
                  textContentType="password"
                  editable={!carregando}
                  returnKeyType="done"
                  onSubmitEditing={realizarLogin}
                />

                <TouchableOpacity
                  onPress={() => setMostrarSenha(!mostrarSenha)}
                  style={styles.botaoOlho}
                  accessibilityLabel={
                    mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'
                  }
                >
                  <Feather
                    name={mostrarSenha ? 'eye-off' : 'eye'}
                    size={19}
                    color="#8B93A7"
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.esqueciSenha}
                onPress={() =>
                  Alert.alert(
                    'Recuperar senha',
                    'A recuperação de senha ainda precisa ser conectada ao servidor.'
                  )
                }
              >
                <Text style={styles.textoEsqueciSenha}>
                  Esqueci minha senha
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.botaoEntrar,
                  carregando && styles.botaoDesativado,
                ]}
                onPress={realizarLogin}
                disabled={carregando}
                activeOpacity={0.8}
              >
                {carregando ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.textoBotaoEntrar}>
                      Entrar
                    </Text>

                    <Feather
                      name="arrow-right"
                      size={19}
                      color="#FFFFFF"
                    />
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.divisor}>
              <View style={styles.linha} />

              <Text style={styles.textoDivisor}>OU</Text>

              <View style={styles.linha} />
            </View>

            <View style={styles.rodape}>
              <Text style={styles.textoRodape}>
                Ainda não tem uma conta?{' '}
              </Text>

              <TouchableOpacity
                onPress={onCriarConta}
                disabled={!onCriarConta || carregando}
              >
                <Text style={styles.linkCadastro}>
                  Criar conta
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.termos}>
            Sua próxima história favorita começa aqui.
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

  container: {
    flex: 1,
    backgroundColor: '#080B14',
  },

  scroll: {
    flexGrow: 1,
    paddingHorizontal: 26,
    paddingTop: Platform.OS === 'android' ? 28 : 12,
    paddingBottom: 28,
  },

  topo: {
    minHeight: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    position: 'relative',
  },

  botaoVoltar: {
    position: 'absolute',
    left: 0,
    top: 20,
    zIndex: 1,
    padding: 8,
  },

  logo: {
    width: 190,
    height: 76,
  },

  conteudo: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },

  titulo: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },

  subtitulo: {
    color: '#A0A8BA',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 36,
  },

  formulario: {
    width: '100%',
  },

  label: {
    color: '#E8EBF3',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    marginTop: 4,
  },

  campo: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111725',
    borderWidth: 1,
    borderColor: '#252D40',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 22,
  },

  icone: {
    marginRight: 12,
  },

  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    minHeight: 54,
    paddingVertical: 10,
  },

  botaoOlho: {
    padding: 7,
    marginLeft: 6,
  },

  esqueciSenha: {
    alignSelf: 'flex-end',
    marginTop: -8,
    marginBottom: 26,
    paddingVertical: 4,
  },

  textoEsqueciSenha: {
    color: '#8C9EFF',
    fontSize: 13,
    fontWeight: '500',
  },

  botaoEntrar: {
    minHeight: 55,
    borderRadius: 12,
    backgroundColor: '#536DFE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 18,
  },

  botaoDesativado: {
    opacity: 0.7,
  },

  textoBotaoEntrar: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  divisor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 30,
    marginBottom: 26,
  },

  linha: {
    flex: 1,
    height: 1,
    backgroundColor: '#252D40',
  },

  textoDivisor: {
    color: '#747D91',
    fontSize: 11,
    fontWeight: '600',
  },

  rodape: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },

  textoRodape: {
    color: '#A0A8BA',
    fontSize: 14,
  },

  linkCadastro: {
    color: '#8C9EFF',
    fontSize: 14,
    fontWeight: '700',
  },

  termos: {
    color: '#687186',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 42,
  },
});