import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, StatusBar, TouchableOpacity, SafeAreaView, 
  TextInput, ScrollView, Alert, ActivityIndicator, Platform, KeyboardAvoidingView 
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';

// ⚙️ CONFIGURAÇÃO DA API - COLOQUE SEU IP AQUI
const API_BASE_URL = 'http://192.168.1.40/tcc-3info-versecriticscine-turma-A-2026/web-backend';

export default function TelaLogin({ onVoltar, onLoginSucesso }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [verSenha, setVerSenha] = useState(false);
  const [loading, setLoading] = useState(false);

  const [focusEmail, setFocusEmail] = useState(false);
  const [focusSenha, setFocusSenha] = useState(false);

  const handleLogin = async () => {
    if (!email || !senha) {
      return Alert.alert('Campos obrigatórios', 'Preencha email e senha.');
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api-login.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          senha: senha,
        }),
      });

      const data = await response.json();
      console.log('Resposta do login:', data);

      if (response.ok && data.success) {
        Alert.alert(
          'Bem-vindo! 🎉',
          `Olá, ${data.user.username}!`,
          [{ text: 'Continuar', onPress: onLoginSucesso }]
        );
      } else {
        Alert.alert('Erro no login', data.message || 'Email ou senha incorretos.');
      }

    } catch (error) {
      console.error('Erro na requisição:', error);
      Alert.alert(
        'Erro de conexão', 
        'Não foi possível conectar ao servidor. Verifique:\n• XAMPP está rodando?\n• IP está correto?\n• Wi-Fi está conectado?'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#020617" translucent={Platform.OS === 'android'} />
      
      <View style={styles.cinemaBackground}>
        <View style={styles.projectorLightLeft} />
        <View style={styles.projectorLightRight} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          
          <View style={styles.topHeaderRow}>
            <TouchableOpacity onPress={onVoltar} style={styles.btnVoltar} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={20} color="#ffffff" />
            </TouchableOpacity>
            
            <View style={styles.logoContainer}>
              <View style={styles.logoIconBoxSmall}>
                <Feather name="film" size={14} color="#60a5fa" />
              </View>
              <Text style={styles.logoText}>Cine<Text style={styles.logoBlueText}>Track</Text></Text>
            </View>
          </View>

          <View style={styles.titleContainer}>
            <View style={styles.badgePremium}>
              <Feather name="log-in" size={10} color="#fbbf24" style={{ marginRight: 4 }} />
              <Text style={styles.badgeText}>ACESSE SUA CONTA</Text>
            </View>
            <Text style={styles.mainTitle}>
              Bem-vindo de volta{'\n'}
              <Text style={styles.titleGradient}>faça seu login</Text>
            </Text>
            <Text style={styles.subTitleText}>
              Entre com suas credenciais para continuar assistindo e registrando seus filmes e séries favoritos.
            </Text>
          </View>

          <View style={styles.form}>
            
            <Text style={styles.label}>E-MAIL</Text>
            <View style={[styles.inputContainer, focusEmail && styles.inputContainerFocused]}>
              <Feather name="mail" size={16} color={focusEmail ? "#60a5fa" : "#475569"} style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                placeholder="seu@email.com" 
                placeholderTextColor="#475569"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocusEmail(true)}
                onBlur={() => setFocusEmail(false)}
                selectionColor="#60a5fa"
              />
            </View>

            <Text style={styles.label}>SENHA</Text>
            <View style={[styles.inputContainer, focusSenha && styles.inputContainerFocused]}>
              <Feather name="lock" size={16} color={focusSenha ? "#60a5fa" : "#475569"} style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                placeholder="Sua senha" 
                placeholderTextColor="#475569"
                secureTextEntry={!verSenha}
                value={senha}
                onChangeText={setSenha}
                onFocus={() => setFocusSenha(true)}
                onBlur={() => setFocusSenha(false)}
                selectionColor="#60a5fa"
              />
              <TouchableOpacity onPress={() => setVerSenha(!verSenha)} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                <Feather name={verSenha ? "eye" : "eye-off"} size={16} color="#475569" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.forgotPassword} activeOpacity={0.7}>
              <Text style={styles.forgotPasswordText}>Esqueceu sua senha?</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.btnLogin, loading && styles.btnDisabled]} 
              activeOpacity={0.85} 
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Text style={styles.btnLoginText}>Entrar</Text>
                  <Ionicons name="log-in" size={18} color="#ffffff" style={{ marginLeft: 8 }} />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={onVoltar} style={styles.btnCadastroLink} activeOpacity={0.7}>
              <Text style={styles.cadastroTextA}>Ainda não tem conta? </Text>
              <Text style={styles.cadastroTextB}>Criar conta</Text>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.orText}>ou continue com</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialRow}>
              <TouchableOpacity style={styles.btnSocial} activeOpacity={0.8}>
                <Ionicons name="logo-instagram" size={18} color="#E1306C" style={{ marginRight: 8 }} />
                <Text style={styles.btnSocialText}>Instagram</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.btnSocial} activeOpacity={0.8}>
                <Ionicons name="logo-x" size={14} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.btnSocialText}>Twitter / X</Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  cinemaBackground: { ...StyleSheet.absoluteFillObject, backgroundColor: '#020617', overflow: 'hidden' },
  projectorLightLeft: { position: 'absolute', top: -100, left: -100, width: 300, height: 500, backgroundColor: 'rgba(37, 99, 235, 0.25)', transform: [{ rotate: '25deg' }], filter: 'blur(80px)' },
  projectorLightRight: { position: 'absolute', bottom: -50, right: -100, width: 350, height: 600, backgroundColor: 'rgba(14, 165, 233, 0.15)', transform: [{ rotate: '-15deg' }], filter: 'blur(90px)' },
  scrollContent: { paddingHorizontal: 24, paddingTop: Platform.OS === 'android' ? 40 : 20, paddingBottom: 50 },
  topHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  btnVoltar: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', justifyContent: 'center', alignItems: 'center' },
  logoContainer: { flexDirection: 'row', alignItems: 'center', marginLeft: 12 },
  logoIconBoxSmall: { width: 24, height: 24, borderRadius: 6, backgroundColor: 'rgba(59, 130, 246, 0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 8, borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.3)' },
  logoText: { fontSize: 18, fontWeight: '800', color: '#ffffff', letterSpacing: 1 },
  logoBlueText: { color: '#60a5fa' },
  titleContainer: { marginBottom: 30 },
  badgePremium: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(251, 191, 36, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(251, 191, 36, 0.2)', marginBottom: 16 },
  badgeText: { color: '#fbbf24', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  mainTitle: { fontSize: 36, fontWeight: '900', color: '#ffffff', letterSpacing: -1, lineHeight: 42 },
  titleGradient: { color: '#60a5fa', textShadowColor: 'rgba(59, 130, 246, 0.5)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 },
  subTitleText: { fontSize: 14, color: '#94a3b8', marginTop: 16, lineHeight: 22, paddingRight: 20 },
  form: { width: '100%' },
  label: { color: '#94a3b8', fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: 8, marginTop: 18 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', width: '100%', height: 54, borderRadius: 14, backgroundColor: 'rgba(255, 255, 255, 0.03)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)', paddingHorizontal: 16 },
  inputContainerFocused: { borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.08)' },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: '#ffffff', fontSize: 14, fontWeight: '500', paddingVertical: 0 },
  forgotPassword: { alignSelf: 'flex-end', marginTop: 12, marginBottom: 24 },
  forgotPasswordText: { color: '#60a5fa', fontSize: 12, fontWeight: '600' },
  btnLogin: { 
    width: '100%', height: 56, borderRadius: 16, 
    background: 'linear-gradient(to right, #1d4ed8, #3b82f6)', backgroundColor: '#2563eb',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10,
    shadowColor: '#2563eb', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8
  },
  btnDisabled: { opacity: 0.6 },
  btnLoginText: { color: '#ffffff', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  btnCadastroLink: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20, padding: 4 },
  cadastroTextA: { color: '#64748b', fontSize: 13, fontWeight: '500' },
  cadastroTextB: { color: '#60a5fa', fontSize: 13, fontWeight: '700' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 28 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255, 255, 255, 0.08)' },
  orText: { fontSize: 11, color: '#475569', fontWeight: '600', paddingHorizontal: 12 },
  socialRow: { flexDirection: 'row', gap: 12 },
  btnSocial: { flex: 1, height: 52, borderRadius: 14, backgroundColor: 'rgba(255, 255, 255, 0.04)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  btnSocialText: { color: '#f8fafc', fontSize: 13, fontWeight: '700' }
});