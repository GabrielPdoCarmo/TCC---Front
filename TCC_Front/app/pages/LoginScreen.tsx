// pages/LoginScreen.tsx - Versão com validator.js para validação de email

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

// 🆕 FUNÇÃO ATUALIZADA: Validação de email com validator.js
const validarEmailCompleto = (email: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!email) {
    errors.push('O e-mail é obrigatório');
    return { isValid: false, errors };
  }

  // ✅ Usar validator.js para validação principal de email
  if (!validator.isEmail(email)) {
    errors.push('Formato de e-mail inválido');
  }

  // ✅ Validações adicionais usando validator.js
  if (!validator.isLength(email, { min: 3, max: 254 })) {
    if (email.length < 3) {
      errors.push('O e-mail é muito curto (mínimo 3 caracteres)');
    } else {
      errors.push('O e-mail é muito longo (máximo 254 caracteres)');
    }
  }

  // ✅ Verificar se não tem espaços em branco
  if (validator.contains(email, ' ')) {
    errors.push('E-mail não pode conter espaços');
  }

  // ✅ Verificações adicionais para domínio usando validator.js
  if (email.includes('@')) {
    const [localPart, domain] = email.split('@');

    // Verificar comprimento da parte local
    if (!validator.isLength(localPart, { min: 1, max: 64 })) {
      errors.push('Parte local do e-mail é muito longa (máximo 64 caracteres)');
    }

    // ✅ Usar validator.js para validar FQDN (Fully Qualified Domain Name)
  }

  // ✅ Verificação adicional: normalizar email
  if (errors.length === 0) {
    try {
      const normalizedEmail = validator.normalizeEmail(email, {
        gmail_lowercase: true,
        gmail_remove_dots: false,
        gmail_remove_subaddress: false,
        outlookdotcom_lowercase: true,
        yahoo_lowercase: true,
        icloud_lowercase: true,
      });

      if (!normalizedEmail) {
        errors.push('E-mail não pôde ser processado');
      }
    } catch (normalizationError) {
      errors.push('Formato de e-mail inválido');
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
  // Array de erros para email granular
  const [emailErros, setEmailErros] = useState<string[]>([]);
  const [senhaErro, setSenhaErro] = useState('');
  const [loading, setLoading] = useState(false);

  // Estados para o modal de boas-vindas
  const [welcomeModalVisible, setWelcomeModalVisible] = useState(false);
  const [userName, setUserName] = useState('');
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Hook do contexto
  const { login: contextLogin, isAuthenticated, loading: authLoading } = useAuth();

  // 🆕 CORREÇÃO: Sempre redirecionar para tela principal após login
  useEffect(() => {
    if (!authLoading && isAuthenticated && !welcomeModalVisible && !pendingLoginData) {
      router.replace('/pages/PetAdoptionScreen');
    }
  }, [isAuthenticated, authLoading, welcomeModalVisible]);

  // ✅ ALTERADO: Apenas limpar erros quando campos mudam (sem validar em tempo real)
  useEffect(() => {
    if (email && emailErros.length > 0) {
      setEmailErros([]);
    }
  }, [email]);

  useEffect(() => {
    if (senha && senhaErro) {
      setSenhaErro('');
    }
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

  // ✅ FUNÇÃO ATUALIZADA: Login com validação usando validator.js
  const handleLogin = async () => {
    setEmailErros([]);
    setSenhaErro('');

    // Validações
    let temErros = false;

    // ✅ VALIDAÇÃO DE EMAIL: Usando validator.js
    if (!email) {
      setEmailErros(['O e-mail é obrigatório']);
      temErros = true;
    } else {
      // 🆕 Sanitizar email antes da validação
      const emailSanitizado = validator.trim(email.toLowerCase());

      const validacaoEmail = validarEmailCompleto(emailSanitizado);
      if (!validacaoEmail.isValid) {
        setEmailErros(validacaoEmail.errors);
        temErros = true;
      } else {
        // ✅ Atualizar o email com a versão sanitizada se passou na validação
        setEmail(emailSanitizado);
      }
    }

    // ✅ VALIDAÇÃO DE SENHA: Usando validator.js
    if (!senha) {
      setSenhaErro('A senha é obrigatória');
      temErros = true;
    } else {
      // 🆕 Validações adicionais de senha usando validator.js
      if (!validator.isLength(senha, { min: 8 })) {
        setSenhaErro('A senha deve ter pelo menos 8 caracteres');
        temErros = true;
      }
      // ✅ Verificar se a senha não é apenas espaços em branco
      else if (validator.isEmpty(validator.trim(senha))) {
        setSenhaErro('A senha não pode ser apenas espaços em branco');
        temErros = true;
      }
    }

    if (temErros) {
      return;
    }

    setLoading(true);
    try {
      // 1. Fazer login via API com email sanitizado
      const emailParaLogin = validator.trim(email.toLowerCase());
      const loginResponse = await login(emailParaLogin, senha);

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

      // 4. GUARDAR dados para processar depois do modal
      setPendingLoginData({ userDetails, token: loginResponse.token });

      // 5. Preparar dados do modal
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

  // Processa login quando usuário clica "Continuar"
  const handleCloseWelcomeModal = async () => {
    setModalLoading(true);

    if (pendingLoginData) {
      try {
        await contextLogin(pendingLoginData.userDetails, pendingLoginData.token);

        // Limpar dados pendentes
        setPendingLoginData(null);

        // Fechar modal primeiro
        setWelcomeModalVisible(false);

        // 🆕 CORREÇÃO: SEMPRE redirecionar para tela principal
        router.replace('/pages/PetAdoptionScreen');
      } catch (contextError) {
        Alert.alert('Erro', 'Houve um problema ao finalizar o login. Tente novamente.');
        setPendingLoginData(null);
        setWelcomeModalVisible(false);
      } finally {
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

          {/* Campo de E-mail com validação granular usando validator.js */}
          <TextInput
            style={[styles.input, emailErros.length > 0 ? { borderColor: 'red' } : {}]}
            placeholder="E-mail:"
            placeholderTextColor="#666"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="emailAddress"
          />
          {/* Mostrar todos os erros de email */}
          {emailErros.length > 0 && (
            <View style={styles.errorContainer}>
              {emailErros.map((erro, index) => (
                <Text key={index} style={styles.errorTextEmail}>
                  {erro}
                </Text>
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
              textContentType="password"
              autoCorrect={false}
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

        {/* Modal de boas-vindas com loading */}
        <WelcomeModal
          visible={welcomeModalVisible}
          onClose={handleCloseWelcomeModal}
          userName={userName}
          photoUrl={userPhoto}
          loading={modalLoading}
        />
      </SafeAreaView>
    </ImageBackground>
  );
}

// Estilos do LoginScreen (mantidos iguais)
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
    paddingLeft: 10,
    width: '100%',
  },
  errorTextSenha: {
    color: 'red',
    fontSize: 12,
    paddingLeft: 30,
    width: '100%',
  },
  errorContainer: {
    marginTop: 0,
    marginBottom: 5,
    paddingLeft: 20,
    width: '100%',
  },
  touchableOpacity: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
