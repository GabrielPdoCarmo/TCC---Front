// pages/LoginScreen.tsx - Versão com debug e modal garantido + validação granular de email
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
import { useAuth } from '@/contexts/AuthContext';
import login from '../../services/api/auth';
import getUsuarioById from '../../services/api/Usuario/getUsuarioById';
import WelcomeModal from '../../components/Welcome/WelcomeModal';
import validator from 'validator';

// Interface para tipagem de erros da API
interface ApiError {
  error?: string;
  message?: string;
  status?: number;
}

// FUNÇÃO ATUALIZADA: Validação granular de email usando validator
const validarEmailCompleto = (email: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!email) {
    errors.push('O e-mail é obrigatório');
    return { isValid: false, errors };
  }

  // Usar validator.js para validação principal
  if (!validator.isEmail(email)) {
    errors.push('Formato de e-mail inválido');
  }

  // Validar tamanho usando validator
  if (!validator.isLength(email, { min: 3, max: 254 })) {
    if (email.length < 3) {
      errors.push('O e-mail é muito curto (mínimo 3 caracteres)');
    } else {
      errors.push('O e-mail é muito longo (máximo 254 caracteres)');
    }
  }

  // Verificar se não tem espaços
  if (email.includes(' ')) {
    errors.push('E-mail não pode conter espaços');
  }

  // Verificações adicionais para domínio
  if (email.includes('@')) {
    const [localPart, domain] = email.split('@');
    
    // Verificar parte local
    if (localPart.length > 64) {
      errors.push('Parte local do e-mail é muito longa (máximo 64 caracteres)');
    }

    // Verificar domínio
    if (domain.length > 253) {
      errors.push('Domínio do e-mail é muito longo (máximo 253 caracteres)');
    }

    // Usar validator para verificar se é um FQDN válido
    if (!validator.isFQDN(domain)) {
      errors.push('Domínio inválido');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  // MUDANÇA: Array de erros para email granular
  const [emailErros, setEmailErros] = useState<string[]>([]);
  const [senhaErro, setSenhaErro] = useState('');
  const [loading, setLoading] = useState(false);

  // Estados para o modal de boas-vindas
  const [welcomeModalVisible, setWelcomeModalVisible] = useState(false);
  const [userName, setUserName] = useState('');
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false); // ✅ Loading do modal

  // Hook do contexto
  const { login: contextLogin, isAuthenticated, loading: authLoading } = useAuth();

  // ✅ CORRIGIDO: Redirecionamento apenas se não há modal visível E não há login pendente
  useEffect(() => {
    if (!authLoading && isAuthenticated && !welcomeModalVisible && !pendingLoginData) {
      router.replace('/pages/PetAdoptionScreen');
    }
  }, [isAuthenticated, authLoading, welcomeModalVisible]);

  // NOVA VALIDAÇÃO: Limpar erros quando campos mudam
  useEffect(() => {
    if (email) {
      const validacaoEmail = validarEmailCompleto(email);
      setEmailErros(validacaoEmail.errors);
    } else {
      setEmailErros([]);
    }
  }, [email]);

  useEffect(() => {
    if (senha) setSenhaErro('');
  }, [senha]);

  // Função para tratar mensagens de erro
  const getErrorMessage = (error: unknown): string => {
    const apiError = error as ApiError;

    if (apiError?.status === 401) {
      return 'Email ou senha incorretos. Verifique suas credenciais e tente novamente.';
    }

    if (apiError?.message) {
      if (
        apiError.message.toLowerCase().includes('credenciais inválidas') ||
        apiError.message.toLowerCase().includes('senha incorreta') ||
        apiError.message.toLowerCase().includes('email incorreto') ||
        apiError.message.toLowerCase().includes('usuário não encontrado')
      ) {
        return 'Email ou senha incorretos. Verifique suas credenciais e tente novamente.';
      }

      if (apiError.message.includes('Email e senha são obrigatórios')) {
        return 'Por favor, preencha todos os campos de login.';
      }

      if (
        apiError.message.includes('timeout') ||
        apiError.message.includes('network') ||
        apiError.message.includes('ECONNREFUSED')
      ) {
        return 'Problema de conexão. Verifique sua internet e tente novamente.';
      }

      return apiError.message;
    }

    if (apiError?.error) {
      if (
        apiError.error.toLowerCase().includes('credenciais') ||
        apiError.error.toLowerCase().includes('senha') ||
        apiError.error.toLowerCase().includes('email') ||
        apiError.error.toLowerCase().includes('incorret')
      ) {
        return 'Email ou senha incorretos. Verifique suas credenciais e tente novamente.';
      }
      return apiError.error;
    }

    return 'Ocorreu um erro inesperado. Tente novamente.';
  };

  // Estados para guardar dados do login pendente
  const [pendingLoginData, setPendingLoginData] = useState<any>(null);

  // ✅ CORRIGIDO: Login sem executar contextLogin até modal fechar
  const handleLogin = async () => {
    setEmailErros([]);
    setSenhaErro('');

    // Validações
    let temErros = false;

    // NOVA VALIDAÇÃO GRANULAR: Email usando validator
    if (!email) {
      setEmailErros(['O e-mail é obrigatório']);
      temErros = true;
    } else {
      const validacaoEmail = validarEmailCompleto(email);
      if (!validacaoEmail.isValid) {
        setEmailErros(validacaoEmail.errors);
        temErros = true;
      }
    }

    if (!senha) {
      setSenhaErro('A senha é obrigatória');
      temErros = true;
    } else if (senha.length < 8) {
      setSenhaErro('A senha deve ter pelo menos 8 caracteres');
      temErros = true;
    }

    if (temErros) {
      return;
    }

    setLoading(true);
    try {
      // 1. Fazer login via API
      const loginResponse = await login(email, senha);

      // 2. Buscar detalhes completos do usuário
      let userDetails = null;
      try {
        userDetails = await getUsuarioById(loginResponse.usuario.id);
      } catch (userError) {
        userDetails = loginResponse.usuario;
      }

      // 3. Preparar URL da foto
      let photoUrl = null;
      if (userDetails?.foto) {
        photoUrl = userDetails.foto;
        if (!photoUrl.startsWith('http://') && !photoUrl.startsWith('https://')) {
          photoUrl = `https://petzup-api.onrender.com${photoUrl}`;
        }
      }

      // ✅ 4. GUARDAR dados para processar depois do modal
      setPendingLoginData({ userDetails, token: loginResponse.token });

      // ✅ 5. Preparar dados do modal
      const userName = userDetails?.nome || 'usuário';
      setUserName(userName);
      setUserPhoto(photoUrl);

      setWelcomeModalVisible(true);
    } catch (error: unknown) {
      const userFriendlyMessage = getErrorMessage(error);

      // Verificar se o erro tem validação granular de email do backend
      const serverError = (error as any)?.response?.data || error;
      if (serverError && serverError.emailErrors) {
        setEmailErros(serverError.emailErrors);
      } else {
        Alert.alert('Erro no Login', userFriendlyMessage, [
          {
            text: 'OK',
            onPress: () => {
              if (userFriendlyMessage.includes('Email ou senha incorretos')) {
                setEmail('');
                setSenha('');
              }
            },
          },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ CORRIGIDO: Agora processa login quando usuário clica "Continuar"
  const handleCloseWelcomeModal = async () => {
    // ✅ ATIVAR LOADING antes de processar
    setModalLoading(true);

    // ✅ AGORA SIM: Atualizar contexto após usuário confirmar
    if (pendingLoginData) {
      try {
        await contextLogin(pendingLoginData.userDetails, pendingLoginData.token);

        // Limpar dados pendentes
        setPendingLoginData(null);

        // Fechar modal primeiro
        setWelcomeModalVisible(false);

        // Redirecionar

        router.replace('/pages/PetAdoptionScreen');
      } catch (contextError) {
        Alert.alert('Erro', 'Houve um problema ao finalizar o login. Tente novamente.');
        setPendingLoginData(null);
        setWelcomeModalVisible(false);
      } finally {
        // ✅ DESATIVAR LOADING
        setModalLoading(false);
      }
    } else {
      // Se não há dados pendentes, apenas fechar modal
      setWelcomeModalVisible(false);
      setModalLoading(false);
    }
  };

  // Loading de verificação de autenticação
  if (authLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Image
          source={require('../../assets/images/Icone/Petz_Up.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Text style={{ color: '#fff', marginTop: 20 }}>Verificando autenticação...</Text>
      </View>
    );
  }

  return (
    <ImageBackground source={require('../../assets/images/backgrounds/Fundo_01.png')} style={styles.backgroundImage}>
      <SafeAreaView style={styles.container}>
        <View style={styles.mainContent}>
          <Image source={require('../../assets/images/Icone/Petz_Up.png')} style={styles.logoImage} />
          <Text style={styles.loginText}>Login:</Text>

          {/* Campo de E-mail com validação granular */}
          <TextInput
            style={[styles.input, emailErros.length > 0 ? { borderColor: 'red' } : {}]}
            placeholder="E-mail:"
            placeholderTextColor="#666"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {/* NOVA EXIBIÇÃO: Mostrar todos os erros de email */}
          {emailErros.length > 0 && (
            <View style={styles.errorContainer}>
              {emailErros.map((erro, index) => (
                <Text key={index} style={styles.errorTextEmail}>• {erro}</Text>
              ))}
            </View>
          )}

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

          <TouchableOpacity
            onPress={() => router.push('/pages/ForgotPasswordScreen')}
            style={[styles.forgotPasswordContainer, (emailErros.length > 0 || senhaErro) && { marginTop: 0 }]}
          >
            <Text style={styles.forgotPasswordText}>Esqueceu sua senha?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>{loading ? 'Entrando...' : 'Entrar'}</Text>
          </TouchableOpacity>

          <View style={styles.registerContainer}>
            <Text style={styles.noAccountText}>Não possui cadastro?</Text>
            <Link href="/pages/userCadastro">
              <Text style={styles.registerText}>Cadastra-se aqui!!</Text>
            </Link>
          </View>
        </View>

        {/* ✅ Modal de boas-vindas com loading */}
        <WelcomeModal
          visible={welcomeModalVisible}
          onClose={handleCloseWelcomeModal}
          userName={userName}
          photoUrl={userPhoto}
          loading={modalLoading} // ✅ Passar estado de loading
        />
      </SafeAreaView>
    </ImageBackground>
  );
}

// Estilos do LoginScreen
const styles = StyleSheet.create({
  forgotPasswordContainer: {
    alignSelf: 'flex-start',
    marginLeft: 30,
    marginTop: -20,
    marginBottom: 10,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#000',
  },
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
    color: '#000000',
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
  loginButton: {
    backgroundColor: '#E8E8E8',
    width: '60%',
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.7,
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
  // NOVO ESTILO: Container para múltiplos erros de email
  errorContainer: {
    marginTop: 5,
    marginBottom: 10,
    paddingLeft: 20,
    width: '100%',
  },
  touchableOpacity: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
});