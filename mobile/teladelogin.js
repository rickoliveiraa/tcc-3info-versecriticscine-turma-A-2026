import React, { useState } from 'react';
import {
  StyleSheet, Text, View, StatusBar, TouchableOpacity, SafeAreaView,
  ScrollView, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TelaLogin({ onVoltar, onLoginSucesso }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [verSenha, setVerSenha] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !senha) {
      Alert.alert('Campos obrigatórios', 'Preencha email e senha.');
      return;
    }

    setLoading(true);
    try {
      const users = await AsyncStorage.getItem('users');
      const usersList = users ? JSON.parse(users) : [];
      const user = usersList.find(u => u.email === email && u.password_hash === senha);
      
      if (user) {
        await AsyncStorage.setItem('currentUser', JSON.stringify(user));
        onLoginSucesso(user);
      } else {
        Alert.alert('Erro', 'Email ou senha incorretos.');
      }
    } catch (error) {
      Alert.alert('Erro', 'Erro ao fazer login.');
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
            <Text style={styles.title}>Bem-vindo de volta</Text>
            <Text style={styles.subtitle}>faça seu login</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>EMAIL</Text>
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
                  value={senha} onChangeText={setSenha} secureTextEntry={!verSenha} />
                <TouchableOpacity onPress={() => setVerSenha(!verSenha)}>
                  <Ionicons name={verSenha ? "eye-off-outline" : "eye-outline"} size={20} color="#737373" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleLogin} activeOpacity={0.85} disabled={loading}>
              {loading ? <ActivityIndicator color="#ffffff" /> : (
                <><Text style={styles.buttonText}>Entrar</Text><Ionicons name="arrow-forward" size={20} color="#ffffff" /></>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Ainda não tem uma conta? </Text>
              <TouchableOpacity onPress={onVoltar}>
                <Text style={styles.footerLink}>Criar conta</Text>
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
  header: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 28, fontWeight: '800', color: '#ffffff', marginBottom: 8 },
  subtitle: { fontSize: 24, fontWeight: '700', color: '#3b82f6' },
  form: { flex: 1 },
  inputGroup: { marginBottom: 24 },
  label: { fontSize: 12, fontWeight: '700', color: '#737373', marginBottom: 8, letterSpacing: 1 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#141414', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 16, paddingVertical: 14 },
  input: { flex: 1, fontSize: 16, color: '#ffffff', padding: 0 },
  button: { backgroundColor: '#3b82f6', borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: '#737373', fontSize: 14 },
  footerLink: { color: '#3b82f6', fontSize: 14, fontWeight: '600' },
});