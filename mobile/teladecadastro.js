import React, { useState } from 'react';
import { StyleSheet, Text, View, StatusBar, TouchableOpacity, SafeAreaView, TextInput, ScrollView, Image, Platform } from 'react-native';
import { FontAwesome, FontAwesome5, Ionicons, Feather } from '@expo/vector-icons';

export default function TelaCadastro({ onVoltar, onCadastroSucesso }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [verSenha, setVerSenha] = useState(false);
  const [verConfirmarSenha, setVerConfirmarSenha] = useState(false);

  // Lógica dinâmica para as cores da barra de força da senha
  const obterCoresSenha = () => {
    const tamanho = senha.length;
    if (tamanho === 0) return { c1: '#1e293b', c2: '#1e293b', c3: '#1e293b', text: '', color: '#1e293b' };
    if (tamanho > 0 && tamanho < 6) return { c1: '#ef4444', c2: '#1e293b', c3: '#1e293b', text: 'Fraca', color: '#ef4444' };
    if (tamanho >= 6 && tamanho < 8) return { c1: '#f59e0b', c2: '#f59e0b', c3: '#1e293b', text: 'Média', color: '#f59e0b' };
    return { c1: '#22c55e', c2: '#22c55e', c3: '#22c55e', text: 'Forte', color: '#22c55e' };
  };

  const forca = obterForcaSenha();

  const handleCadastrar = () => {
    if (!nome || !email || !senha) {
      return alert('Por favor, preencha todos os campos obrigatórios.');
    }
    if (senha !== confirmarSenha) {
      return alert('As senhas não coincidem!');
    }
    if (!aceitouTermos) {
      return alert('Você precisa aceitar os Termos de Uso.');
    }
    
    // Sucesso! Avança para a próxima tela configurada no App.js
    onCadastroSucesso();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#020617" translucent={Platform.OS === 'android'} />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* TOP ROW: BOTÃO VOLTAR + LOGO CINETRACK */}
        <View style={styles.topHeaderRow}>
          <TouchableOpacity onPress={onVoltar} style={styles.btnVoltar} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={20} color="#ffffff" />
          </TouchableOpacity>
          
          <View style={styles.logoContainer}>
            <Image
              source={require('./assets/logo-cinetrack.png')}
              style={styles.logoCustomIcon}
              resizeMode="contain"
            />
            <Text style={styles.logoText}>Cine<Text style={styles.logoBlueText}>Track</Text></Text>
          </View>
        </View>

        {/* TÍTULO PRINCIPAL */}
        <Text style={styles.mainTitle}>Criar sua{'\n'}conta gratuita</Text>
        <Text style={styles.subTitleText}>Preencha os dados abaixo ou entre com uma rede social.</Text>

        {/* FORMULÁRIO */}
        <View style={styles.form}>
          
          {/* CAMPO: NOME */}
          <Text style={styles.label}>NOME</Text>
          <View style={styles.inputContainer}>
            <Feather name="user" size={16} color="#46526a" style={styles.inputIcon} />
            <TextInput 
              style={styles.input} 
              placeholder="Seu nome completo" 
              placeholderTextColor="#46526a"
              value={nome}
              onChangeText={setNome}
            />
          </View>

          {/* CAMPO: E-MAIL */}
          <Text style={styles.label}>E-MAIL</Text>
          <View style={styles.inputContainer}>
            <Feather name="mail" size={16} color="#46526a" style={styles.inputIcon} />
            <TextInput 
              style={styles.input} 
              placeholder="seu@email.com" 
              placeholderTextColor="#46526a"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {/* CAMPO: SENHA */}
          <Text style={styles.label}>SENHA</Text>
          <View style={styles.inputContainer}>
            <Feather name="lock" size={16} color="#46526a" style={styles.inputIcon} />
            <TextInput 
              style={styles.input} 
              placeholder="Mínimo 8 caracteres" 
              placeholderTextColor="#46526a"
              secureTextEntry={!verSenha}
              value={senha}
              onChangeText={setSenha}
            />
            <TouchableOpacity onPress={() => setVerSenha(!verSenha)}>
              <Feather name={verSenha ? "eye" : "eye-off"} size={16} color="#46526a" />
            </TouchableOpacity>
          </View>

          {/* BARRA DE FORÇA DA SENHA DINÂMICA */}
          <View style={styles.passwordStrengthRow}>
            <View style={[styles.strengthLine, { backgroundColor: cores.c1 }]} />
            <View style={[styles.strengthLine, { backgroundColor: cores.c2 }]} />
            <View style={[styles.strengthLine, { backgroundColor: cores.c3 }]} />
          </View>

          {/* CAMPO: CONFIRMAR SENHA */}
          <Text style={styles.label}>CONFIRMAR SENHA</Text>
          <View style={styles.inputContainer}>
            <Feather name="lock" size={16} color="#46526a" style={styles.inputIcon} />
            <TextInput 
              style={styles.input} 
              placeholder="Repita a senha" 
              placeholderTextColor="#46526a"
              secureTextEntry={!verConfirmarSenha}
              value={confirmarSenha}
              onChangeText={setConfirmarSenha}
            />
            <TouchableOpacity onPress={() => setVerConfirmarSenha(!verConfirmarSenha)}>
              <Feather name={verConfirmarSenha ? "eye" : "eye-off"} size={16} color="#46526a" />
            </TouchableOpacity>
          </View>

          {/* CHECKBOX DE TERMOS */}
          <TouchableOpacity 
            style={styles.checkboxRow} 
            activeOpacity={0.8} 
            onPress={() => setAceitouTermos(!aceitouTermos)}
          >
            <View style={[styles.checkbox, aceitouTermos && styles.checkboxChecked]}>
              {aceitouTermos && <Ionicons name="checkmark" size={12} color="#ffffff" />}
            </View>
            <Text style={styles.checkboxText}>
              Concordo com os <Text style={styles.linkText}>Termos de Uso</Text> e a <Text style={styles.linkText}>Política de Privacidade</Text> do CineTrack.
            </Text>
          </TouchableOpacity>

          {/* BOTÃO CRIAR CONTA LINKADO */}
          <TouchableOpacity 
            style={styles.btnCriarConta} 
            activeOpacity={0.85}
            onPress={handleCadastrar}
          >
            <FontAwesome5 name="user-plus" size={14} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={styles.btnCriarContaText}>Criar conta</Text>
          </TouchableOpacity>

          {/* LINK DE RETORNO PARA QUEM JÁ TEM CONTA */}
          <TouchableOpacity onPress={onVoltar} style={styles.btnRecuperarLink} activeOpacity={0.7}>
            <Text style={styles.recuperarTextA}>Já tem uma conta? </Text>
            <Text style={styles.recuperarTextB}>Conecte-se</Text>
          </TouchableOpacity>

            {/* DIVISOR */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.orText}>ou registre-se com</Text>
              <View style={styles.dividerLine} />
            </View>

          {/* REDES SOCIAIS */}
          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.btnSocial} activeOpacity={0.8}>
              <FontAwesome name="instagram" size={14} color="#cf2b72" style={{ marginRight: 8 }} />
              <Text style={styles.btnSocialText}>Instagram</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnSocial} activeOpacity={0.8}>
              <Ionicons name="logo-x" size={13} color="#ffffff" style={{ marginRight: 8 }} />
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
  logoCustomIcon: { width: 18, height: 18, marginRight: 6 },
  logoText: { fontSize: 16, fontWeight: '700', color: '#ffffff', letterSpacing: 0.5 },
  logoBlueText: { color: '#3b82f6' },
  mainTitle: { fontSize: 32, fontWeight: 'bold', color: '#ffffff', letterSpacing: -0.5, lineHeight: 38, marginTop: 5, fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium' },
  subTitleText: { fontSize: 13, color: '#3a465d', marginTop: 12, lineHeight: 18 },
  form: { width: '100%', marginTop: 20 },
  label: { color: '#46526a', fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 8, marginTop: 14 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', width: '100%', height: 52, borderRadius: 12, backgroundColor: '#090d1a', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.03)', paddingHorizontal: 16 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: '#ffffff', fontSize: 13, fontWeight: '500' },
  passwordStrengthRow: { flexDirection: 'row', gap: 6, width: '100%', marginTop: 6, marginBottom: 2 },
  strengthLine: { flex: 1, height: 3, borderRadius: 1.5 },
  checkboxRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 18, paddingRight: 10 },
  checkbox: { width: 18, height: 18, borderRadius: 5, borderWidth: 1, borderColor: '#1e293b', backgroundColor: '#090d1a', justifyContent: 'center', alignItems: 'center', marginTop: 2, marginRight: 10 },
  checkboxChecked: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  checkboxText: { flex: 1, fontSize: 12, color: '#606d85', lineHeight: 18 },
  linkText: { color: '#3b82f6', fontWeight: '500' },
  btnCriarConta: { width: '100%', height: 54, borderRadius: 14, backgroundColor: '#3b82f6', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  btnCriarContaText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  btnRecuperarLink: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16, padding: 4 },
  recuperarTextA: { color: '#46526a', fontSize: 12, fontWeight: '500' },
  recuperarTextB: { color: '#3b82f6', fontSize: 12, fontWeight: '600' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255, 255, 255, 0.04)' },
  orText: { fontSize: 11, color: '#2e3747', fontWeight: '600', paddingHorizontal: 12 },
  socialRow: { flexDirection: 'row', gap: 12 },
  btnSocial: { flex: 1, height: 52, borderRadius: 14, backgroundColor: 'rgba(255, 255, 255, 0.04)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  btnSocialText: { color: '#f8fafc', fontSize: 13, fontWeight: '700' }
});