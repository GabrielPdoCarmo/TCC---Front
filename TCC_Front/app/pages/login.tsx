import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  ImageBackground,
  SafeAreaView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Link, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import  login  from '../../services/api/auth'; // Importando a função de login

// Interface para tipagem de erros da API
interface ApiError {
  error?: string;
  message?: string;
}

export default function App() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [emailErro, setEmailErro] = useState('');
  const [senhaErro, setSenhaErro] = useState('');
  const [loading, setLoading] = useState(false);

  // Limpar erros conforme o campo é alterado
  useEffect(() => {
    if (email) setEmailErro('');
  }, [email]);

  useEffect(() => {
    if (senha) setSenhaErro('');
  }, [senha]);

  // Função para tratar mensagens de erro da API e retornar mensagens amigáveis
  const getErrorMessage = (error: unknown): string => {
    // Converter o erro para o tipo ApiError
    const apiError = error as ApiError;

    // Verificar se é um erro com informações técnicas para filtrar
    if (apiError?.message?.includes('Email e senha são obrigatórios')) {
      return 'Por favor, preencha todos os campos de login.';
    }

    if (apiError?.error?.includes('Erro ao fazer login')) {
      return 'Não foi possível fazer login. Verifique sua conexão.';
    }

    // Verificar se contém strings de depuração como NOBRIDGE ou ERROR
    if (JSON.stringify(error).includes('NOBRIDGE') || JSON.stringify(error).includes('ERROR')) {
      return 'Não foi possível completar sua solicitação. Tente novamente mais tarde.';
    }

    // Mensagem genérica para outros erros
    return apiError?.error || apiError?.message || 'Ocorreu um erro inesperado. Tente novamente.';
  };

  const handleLogin = async () => {
    setEmailErro('');
    setSenhaErro('');

    // Validações
    let temErros = false;

    if (!email) {
      setEmailErro('O e-mail é obrigatório');
      temErros = true;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailErro('E-mail inválido');
      temErros = true;
    }

    if (!senha) {
      setSenhaErro('A senha é obrigatória');
      temErros = true;
    } else if (senha.length < 8) {
      setSenhaErro('A senha deve ter pelo menos 8 caracteres');
      temErros = true;
    }

    if (temErros) {
      return; // Não prossegue se houver erros de validação
    }

    // Iniciar o processo de login
    setLoading(true);
    try {
      // Executa o login e aguarda a resposta
      const data = await login(email, senha);

      // Importante: Dar um pequeno tempo para garantir que o AsyncStorage
      // tenha concluído as operações assíncronas
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Agora verificamos se os dados foram salvos
      const userId = await AsyncStorage.getItem('@App:userId');
      const userJson = await AsyncStorage.getItem('@App:user');

      // Apenas para depuração - remover ou usar um sistema de logging mais sofisticado
      if (__DEV__) {
        console.log('Dados salvos no AsyncStorage:', { userId, userJson });
      }

      if (!userId || !userJson) {
        throw { error: 'Falha ao finalizar login' };
      }

      // Login bem-sucedido, exibe mensagem de boas-vindas
      Alert.alert(
        'Sucesso',
        `Bem-vindo, ${data.usuario?.nome || 'usuário'}!`,
        [
          {
            text: 'OK',
            onPress: () => router.push('/pages/PetAdoptionScreen'),
          },
        ],
        { cancelable: false }
      );
    } catch (error: unknown) {
      // Ao invés de exibir o erro técnico, exibimos uma mensagem amigável
      if (__DEV__) {
        // Em modo de desenvolvimento, registramos o erro completo para depuração
        console.error('Erro original:', error);
      }

      // Obter mensagem amigável para o usuário
      const userFriendlyMessage = getErrorMessage(error);

      Alert.alert('Erro ao fazer login', userFriendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground source={require('../../assets/images/backgrounds/Fundo_01.png')} style={styles.backgroundImage}>
      <SafeAreaView style={styles.container}>
        <View style={styles.mainContent}>
          <Image source={require('../../assets/images/Icone/Pets_Up.png')} style={styles.logoImage} />
          <Text style={styles.loginText}>Login:</Text>
          {/* Campo de E-mail */}
          <TextInput
            style={[styles.input, emailErro ? { borderColor: 'red' } : {}]}
            placeholder="E-mail:"
            placeholderTextColor="#666"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {emailErro ? <Text style={styles.errorTextEmail}>{emailErro}</Text> : null}
          {/* Campo de Senha */}
          <View style={[styles.senhaContainer, senhaErro ? { borderColor: 'red', borderWidth: 1 } : {}]}>
            <TextInput
              style={styles.inputSenha}
              placeholder="Senha:"
              placeholderTextColor="#666"
              secureTextEntry={!mostrarSenha}
              value={senha}
              onChangeText={setSenha}
            />
            <TouchableOpacity style={styles.touchableOpacity} onPress={() => setMostrarSenha(!mostrarSenha)}>
              <Icon name={mostrarSenha ? 'eye-off' : 'eye'} size={24} color="#555" />
            </TouchableOpacity>
          </View>
          <Text style={styles.errorTextSenha}>{senhaErro}</Text>
          <Text style={[styles.forgotPassword, (emailErro || senhaErro) && { marginTop: 0 }]}>Esqueceu sua senha?</Text>
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
            <Text style={styles.loginButtonText}>{loading ? 'Carregando...' : 'Entrar'}</Text>
          </TouchableOpacity>
          <View style={styles.registerContainer}>
            <Text style={styles.noAccountText}>Não possui cadastro?</Text>
            <Link href="/pages/userCadastro">
              <Text style={styles.registerText}>Cadastra-se aqui!!</Text>
            </Link>
          </View>
        </View>
        <View style={styles.bottomIcons}></View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    backgroundColor: '#4285F4',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  bottomIcons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  mainContent: {
    width: '100%',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderRadius: 35,
    padding: 20,
    marginTop: 25,
  },
  loginText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#000',
    alignSelf: 'center',
    marginLeft: 0,
    marginTop: 10,
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#E8E8E8',
    width: '90%',
    height: 50,
    borderRadius: 25,
    paddingHorizontal: 20,
    fontSize: 16,
    marginBottom: 5,
    borderColor: '#ccc',
    borderWidth: 1,
  },
  senhaContainer: {
    flexDirection: 'row',
    backgroundColor: '#E8E8E8',
    width: '90%',
    height: 50,
    borderRadius: 25,
    paddingHorizontal: 20,
    marginBottom: 5,
  },
  inputSenha: {
    flex: 1,
    fontSize: 16,
  },
  forgotPassword: {
    fontSize: 14,
    color: '#000',
    alignSelf: 'flex-start',
    marginLeft: 30,
    marginTop: -20,
    marginBottom: 10,
  },
  loginButton: {
    backgroundColor: '#E8E8E8',
    width: '60%',
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  registerContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  noAccountText: {
    fontSize: 16,
    color: '#000',
  },
  registerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  logoImage: {
    width: 650,
    height: 235,
    resizeMode: 'contain',
  },
  errorTextEmail: {
    color: 'red',
    fontSize: 12,
    marginTop: 0,
    paddingLeft: 20,
    width: '100%',
  },
  errorTextSenha: {
    color: 'red',
    fontSize: 12,
    marginTop: 0,
    paddingLeft: 20,
    width: '100%',
  },
  touchableOpacity: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
