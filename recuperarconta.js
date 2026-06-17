import React, { useState } from 'react';
import { StyleSheet, Text, View, StatusBar, TouchableOpacity, SafeAreaView, TextInput, ScrollView, Image, Platform } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';

export default function RecuperarConta({ onVoltar }) {
  // Gerencia o passo atual: 1 = E-mail, 2 = Código, 3 = Nova Senha
  const [passo, setPasso] = useState(1);
  
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [verSenha, setVerSenha] = useState(false);

  // Lógica dinâmica das cores para a força da nova senha (usada no passo 3)
  const obterCoresSenha = () => {
    const tamanho = novaSenha.length;
    if (tamanho === 0) return { c1: '#1e293b', c2: '#1e293b', c3: '#1e293b' };
    if (tamanho <= 4) return { c1: '#ef4444', c2: '#1e293b', c3: '#1e293b' };
    if (tamanho < 8) return { c1: '#ef4444', c2: '#f59e0b', c3: '#1e293b' };
    return { c1: '#ef4444', c2: '#f59e0b', c3: '#22c55e' };
  };

  const cores = obterCoresSenha();

  // Função para tratar o clique do botão principal dependendo do passo
  const handleAvancar = () => {
    if (passo === 1) {
      if (!email.includes('@')) return alert('Digite um e-mail válido');
      setPasso(2);
    } else if (passo === 2) {
      if (codigo.length < 4) return alert('Digite o código completo');
      setPasso(3);
    } else if (passo === 3) {
      if (novaSenha.length < 8) return alert('A senha precisa de pelo menos 8 caracteres');
      alert('Senha redefinida com sucesso! Redirecionando...');
      onVoltar();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#040712" />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* TOP ROW: BOTÃO VOLTAR */}
        <View style={styles.topHeaderRow}>
          <TouchableOpacity 
            onPress={() => passo > 1 ? setPasso(passo - 1) : onVoltar()} 
            style={styles.btnVoltar} 
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color="#ffffff" />
          </TouchableOpacity>
          
          <View style={styles.logoContainer}>
            <Image source={require('./assets/logo-cinetrack.png')} style={styles.logoCustomIcon} resizeMode="contain" />
            <Text style={styles.logoText}>Cine<Text style={styles.logoBlueText}>Track</Text></Text>
          </View>
        </View>

        {/* ÍCONE DINÂMICO DE ACORDO COM O PASSO */}
        <View style={styles.lockBadgeContainer}>
          <Feather 
            name={passo === 1 ? "lock" : passo === 2 ? "mail" : "shield"} 
            size={22} 
            color="#3b82f6" 
          />
        </View>

        {/* TÍTULOS DINÂMICOS */}
        <Text style={styles.mainTitle}>
          {passo === 1 && `Recuperar\nsua conta`}
          {passo === 2 && `Verifique seu\ne-mail`}
          {passo === 3 && `Escolha sua\nnova senha`}
        </Text>

        <Text style={styles.subTitleText}>
          {passo === 1 && <>Informe o <Text style={styles.boldWhiteText}>e-mail cadastrado</Text> e enviaremos um código de verificação para você redefinir sua senha.</>}
          {passo === 2 && <>Insira o <Text style={styles.boldWhiteText}>código de 6 dígitos</Text> que enviamos para o e-mail: {email}</>}
          {passo === 3 && <>Crie uma senha forte contendo letras, números e caracteres especiais.</>}
        </Text>

        {/* BARRINHA DE ETAPAS INTEGRADA E ATIVA (MUDOU DE LUGAR PARA FICAR IGUAL AO SEU DESIGN) */}
        <View style={styles.stepProgressRow}>
          <View style={[styles.stepLine, passo >= 1 ? styles.stepLineActive : styles.stepLineInactive]} />
          <View style={[styles.stepLine, passo >= 2 ? styles.stepLineActive : styles.stepLineInactive]} />
          <View style={[styles.stepLine, passo >= 3 ? styles.stepLineActive : styles.stepLineInactive]} />
        </View>

        {/* FORMULÁRIO */}
        <View style={styles.form}>
          
          {/* PASSO 1: INPUT DE E-MAIL */}
          {passo === 1 && (
            <>
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
              <Text style={styles.inputHint}>Você receberá um código neste endereço.</Text>
            </>
          )}

          {/* PASSO 2: INPUT DE CÓDIGO */}
          {passo === 2 && (
            <>
              <Text style={styles.label}>CÓDIGO DE VERIFICAÇÃO</Text>
              <View style={styles.inputContainer}>
                <Feather name="key" size={16} color="#46526a" style={styles.inputIcon} />
                <TextInput 
                  style={styles.input} 
                  placeholder="000000" 
                  placeholderTextColor="#46526a"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={codigo}
                  onChangeText={setCodigo}
                />
              </View>
              <TouchableOpacity style={{ marginTop: 12 }} onPress={() => alert('Código reenviado!')}>
                <Text style={{ color: '#3b82f6', fontSize: 12, fontWeight: '600' }}>Reenviar código</Text>
              </TouchableOpacity>
            </>
          )}

          {/* PASSO 3: INPUT DE NOVA SENHA + BARRINHAS DE FORÇA */}
          {passo === 3 && (
            <>
              <Text style={styles.label}>NOVA SENHA</Text>
              <View style={styles.inputContainer}>
                <Feather name="lock" size={16} color="#46526a" style={styles.inputIcon} />
                <TextInput 
                  style={styles.input} 
                  placeholder="Mínimo 8 caracteres" 
                  placeholderTextColor="#46526a"
                  secureTextEntry={!verSenha}
                  value={novaSenha}
                  onChangeText={novaSenha => setNovaSenha(novaSenha)}
                />
                <TouchableOpacity onPress={() => setVerSenha(!verSenha)}>
                  <Feather name={verSenha ? "eye" : "eye-off"} size={16} color="#46526a" />
                </TouchableOpacity>
              </View>

              {/* AS BARRINHAS DE FORÇA DA SENHA */}
              <View style={styles.passwordStrengthRow}>
                <View style={[styles.strengthLine, { backgroundColor: cores.c1 }]} />
                <View style={[styles.strengthLine, { backgroundColor: cores.c2 }]} />
                <View style={[styles.strengthLine, { backgroundColor: cores.c3 }]} />
              </View>
            </>
          )}

          {/* BOTÃO DINÂMICO */}
          <TouchableOpacity style={styles.btnEnviar} activeOpacity={0.85} onPress={handleAvancar}>
            <Feather name={passo === 3 ? "check" : "send"} size={14} color="#ffffff" style={{ marginRight: 10 }} />
            <Text style={styles.btnEnviarText}>
              {passo === 1 && "Enviar código de verificação"}
              {passo === 2 && "Validar código"}
              {passo === 3 && "Redefinir Senha"}
            </Text>
          </TouchableOpacity>

          {/* LINK: VOLTAR PARA O LOGIN */}
          <TouchableOpacity onPress={onVoltar} style={styles.btnVoltarLogin} activeOpacity={0.7}>
            <Ionicons name="arrow-back-outline" size={14} color="#606d85" style={{ marginRight: 6 }} />
            <Text style={styles.voltarLoginText}>Voltar para o login</Text>
          </TouchableOpacity>

        </View>

        {/* BANNER DE INFORMAÇÃO NO RODAPÉ */}
        <View style={styles.infoBannerContainer}>
          <Feather name="shield" size={16} color="#3b82f6" style={styles.bannerIcon} />
          <Text style={styles.bannerText}>
            O código expira em <Text style={styles.blueBannerText}>10 minutos</Text>. Verifique também sua pasta de spam caso não receba o e-mail.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#040712' },
  scrollContent: { paddingHorizontal: 24, paddingTop: Platform.OS === 'android' ? 45 : 20, paddingBottom: 30, flexGrow: 1 },
  topHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 32 },
  btnVoltar: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255, 255, 255, 0.03)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)', justifyContent: 'center', alignItems: 'center' },
  logoContainer: { flexDirection: 'row', alignItems: 'center', marginLeft: 12 },
  logoCustomIcon: { width: 18, height: 18, marginRight: 6 },
  logoText: { fontSize: 16, fontWeight: '700', color: '#ffffff', letterSpacing: 0.5 },
  logoBlueText: { color: '#3b82f6' },
  lockBadgeContainer: { width: 46, height: 46, borderRadius: 14, backgroundColor: 'rgba(59, 130, 246, 0.06)', borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 20, marginTop: 5 },
  mainTitle: { fontSize: 32, fontWeight: 'bold', color: '#ffffff', letterSpacing: -0.5, lineHeight: 38, fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium' },
  subTitleText: { fontSize: 13, color: '#4d5b75', marginTop: 14, lineHeight: 20 },
  boldWhiteText: { color: '#cbd5e1', fontWeight: '600' },
  
  // BARRINHA DE ETAPAS DO PROCESSO
  stepProgressRow: { flexDirection: 'row', gap: 8, width: '100%', marginTop: 28, marginBottom: 16 },
  stepLine: { flex: 1, height: 4, borderRadius: 2 },
  stepLineActive: { backgroundColor: '#3b82f6' },
  stepLineInactive: { backgroundColor: '#1e293b' }, // Cor cinza escuro correspondente ao design

  form: { width: '100%', marginTop: 5, flex: 1 },
  label: { color: '#46526a', fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 8, marginTop: 14 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', width: '100%', height: 52, borderRadius: 12, backgroundColor: '#090d1a', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.03)', paddingHorizontal: 16 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: '#ffffff', fontSize: 13, fontWeight: '500' },
  inputHint: { fontSize: 11, color: '#2e3747', marginTop: 8, fontWeight: '500' },
  passwordStrengthRow: { flexDirection: 'row', gap: 6, width: '100%', marginTop: 8, marginBottom: 2 },
  strengthLine: { flex: 1, height: 3, borderRadius: 1.5 },
  btnEnviar: { width: '100%', height: 54, borderRadius: 14, backgroundColor: '#3b82f6', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 28 },
  btnEnviarText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  btnVoltarLogin: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: 24, padding: 8 },
  voltarLoginText: { color: '#606d85', fontSize: 12, fontWeight: '600' },
  infoBannerContainer: { flexDirection: 'row', backgroundColor: '#060a14', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.01)', alignItems: 'flex-start', marginTop: 40, paddingBottom: 16 },
  bannerIcon: { marginRight: 12, marginTop: 2, color: '#3b82f6' },
  bannerText: { flex: 1, fontSize: 11, color: '#3a465d', lineHeight: 16 },
  blueBannerText: { color: '#3b82f6', fontWeight: '600' }
});