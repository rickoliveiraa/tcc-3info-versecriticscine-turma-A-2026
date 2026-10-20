import React, { useState } from 'react';
import {
  StyleSheet, Text, View, StatusBar, TouchableOpacity, SafeAreaView,
  ScrollView, TextInput, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TelaCadastro({ onVoltar, onCadastroSucesso }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCadastro = async () => {
    if (!nome || !email || !senha || !confirmarSenha) {
      Alert.alert('Campos obrigatórios', 'Preencha todos os campos.');
      return;
    }
    if (senha !== confirmarSenha) {
      Alert.alert('Erro', 'As senhas não coincidem.');
      return;
    }
    if (senha.length < 6) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const users = await AsyncStorage.getItem('users');
      const usersList = users ? JSON.parse(users) : [];

      if (usersList.find(u => u.email === email)) {
        Alert.alert('Erro', 'Este email já está cadastrado.');
        setLoading(false);
        return;
      }

      const newUser = {
        id: Date.now().toString(),
        username: nome,
        email: email,
        password_hash: senha,
        role: 'user',
        created_at: new Date().toISOString()
      };

      usersList.push(newUser);
      await AsyncStorage.setItem('users', JSON.stringify(usersList));

      Alert.alert('Sucesso!', 'Conta criada com sucesso!');
      onCadastroSucesso(newUser);
    } catch (error) {
      Alert.alert('Erro', 'Erro ao criar conta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.backButton} onPress={onVoltar} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>

          <View style={styles.header}>
            <Feather name="film" size={40} color="#3b82f6" style={{ marginBottom: 12 }} />
            <Text style={styles.title}>Crie sua conta</Text>
            <Text style={styles.subtitle}>gratuita agora</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>NOME COMPLETO</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#737373" style={{ marginRight: 12 }} />
                <TextInput style={styles.input} placeholder="Seu nome" placeholderTextColor="#737373"
                  value={nome} onChangeText={setNome} autoCapitalize="words" />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>E-MAIL</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#737373" style={{ marginRight: 12 }} />
                <TextInput style={styles.input} placeholder="seu@email.com" placeholderTextColor="#737373"
                  value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>SENHA</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#737373" style={{ marginRight: 12 }} />
                <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor="#737373"
                  value={senha} onChangeText={setSenha} secureTextEntry />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>CONFIRMAR SENHA</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#737373" style={{ marginRight: 12 }} />
                <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor="#737373"
                  value={confirmarSenha} onChangeText={setConfirmarSenha} secureTextEntry />
              </View>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleCadastro} disabled={loading} activeOpacity={0.85}>
              <Text style={styles.buttonText}>Criar minha conta</Text>
              <Ionicons name="arrow-forward" size={20} color="#ffffff" />
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Já tem uma conta? </Text>
              <TouchableOpacity onPress={onVoltar}>
                <Text style={styles.footerLink}>Entrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 40, paddingBottom: 30 },
  backButton: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  header: { alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 32, fontWeight: '800', color: '#ffffff', letterSpacing: -0.5 },
  subtitle: { fontSize: 28, fontWeight: '700', color: '#3b82f6', marginBottom: 16 },
  form: { flex: 1 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 12, fontWeight: '700', color: '#737373', marginBottom: 8, letterSpacing: 1 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#141414', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 16, paddingVertical: 14 },
  input: { flex: 1, fontSize: 16, color: '#ffffff', padding: 0 },
  button: { backgroundColor: '#3b82f6', borderRadius: 14, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24 },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: '#737373', fontSize: 14 },
  footerLink: { color: '#3b82f6', fontSize: 14, fontWeight: '600' },
});