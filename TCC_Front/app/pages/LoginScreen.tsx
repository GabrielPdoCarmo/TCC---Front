// pages/LoginScreen.tsx - Versão corrigida e simplificada
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
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Link, router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext'; // ✅ Só importar o hook
import login from '../../services/api/auth';
import getUsuarioById from '../../services/api/Usuario/getUsuarioById';

// Interface para tipagem de erros da API
interface ApiError {
  error?: string;
  message?: string;
  status?: number;
}

// Interface para as props do WelcomeModal
interface WelcomeModalProps {
  visible: boolean;
  onClose: () => void;
  userName: string;
  photoUrl: string | null;
}

// Componente para o modal de boas-vindas
const WelcomeModal: React.FC<WelcomeModalProps> = ({ visible, onClose, userName, photoUrl }) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Bem-vindo!</Text>

          {photoUrl ? (
            <View style={styles.photoContainer}>
              <Image
                source={{ uri: photoUrl }}
                style={styles.userPhoto}
                resizeMode="cover"
                onError={(e) => {
                  console.error('❌ Erro ao carregar imagem:', e.nativeEvent.error);
                }}
              />
            </View>
          ) : (
            <View style={styles.photoPlaceholder}>
              <Icon name="person" size={40} color="#555" />
            </View>
          )}

          <Text style={styles.modalText}>Olá, {userName || 'usuário'}!</Text>
          <TouchableOpacity style={styles.modalButton} onPress={onClose}>
            <Text style={styles.modalButtonText}>Continuar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ✅ Componente principal - SEM AuthProvider duplicado
export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [emailErro, setEmailErro] = useState('');
  const [senhaErro, setSenhaErro] = useState('');
  const [loading, setLoading] = useState(false);

  // Estados para o modal de boas-vindas
  const [welcomeModalVisible, setWelcomeModalVisible] = useState(false);
  const [userName, setUserName] = useState('');
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  
  // ✅ NOVO: Estado para controlar se deve mostrar modal
  const [showingWelcomeModal, setShowingWelcomeModal] = useState(false);

  // ✅ Hook do contexto (que já existe no _layout.tsx)
  const { login: contextLogin, isAuthenticated, loading: authLoading } = useAuth();

  // ✅ MODIFICADO: Se já estiver autenticado, redirecionar (mas só se não estiver mostrando modal)
  useEffect(() => {
    if (!authLoading && isAuthenticated && !showingWelcomeModal) {
      console.log('✅ Usuário já autenticado, redirecionando...');
      router.replace('/pages/PetAdoptionScreen');
    }
  }, [isAuthenticated, authLoading, showingWelcomeModal]);

  // Limpar erros quando campos mudam
  useEffect(() => {
    if (email) setEmailErro('');
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

  // ✅ Função de login simplificada
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

    if (temErros) return;

    setLoading(true);
    try {
      console.log('🚀 Iniciando login para:', email);

      // 1. Fazer login via API
      const loginResponse = await login(email, senha);
      console.log('✅ Login API bem-sucedido:', loginResponse);

      // 2. Buscar detalhes completos do usuário
      let userDetails = null;
      try {
        userDetails = await getUsuarioById(loginResponse.usuario.id);
        console.log('👤 Detalhes do usuário:', userDetails);
      } catch (userError) {
        console.log('⚠️ Usando dados básicos do usuário');
        userDetails = loginResponse.usuario;
      }

      // 3. Preparar URL da foto
      let photoUrl = null;
      if (userDetails?.foto) {
        photoUrl = userDetails.foto;
        if (!photoUrl.startsWith('http://') && !photoUrl.startsWith('https://')) {
          photoUrl = `https://petsup-api.onrender.com${photoUrl}`;
        }
      }

      // ✅ 4. NOVO: Preparar modal ANTES de atualizar contexto
      setUserName(userDetails?.nome || 'usuário');
      setUserPhoto(photoUrl);
      setShowingWelcomeModal(true); // ← Impedir redirecionamento automático
      
      // ✅ 5. Atualizar contexto
      await contextLogin(userDetails, loginResponse.token);
      console.log('✅ Contexto atualizado com sucesso');

      // ✅ 6. Mostrar modal (agora não haverá conflito)
      setWelcomeModalVisible(true);

    } catch (error: unknown) {
      console.error('❌ Erro no login:', error);
      const userFriendlyMessage = getErrorMessage(error);
      
      Alert.alert('Erro no Login', userFriendlyMessage, [
        {
          text: 'OK',
          onPress: () => {
            if (userFriendlyMessage.includes('Email ou senha incorretos')) {
              setSenha('');
            }
          },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Função simplificada para fechar modal
  const handleCloseWelcomeModal = () => {
    setWelcomeModalVisible(false);
    setShowingWelcomeModal(false); // ✅ Permitir redirecionamento agora
    
    // Navegar diretamente (contexto já foi atualizado)
    router.replace('/pages/PetAdoptionScreen');
  };

  // Loading de verificação de autenticação
  if (authLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Image
          source={require('../../assets/images/Icone/Pets_Up.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Text style={{ color: '#fff', marginTop: 20 }}>Verificando autenticação...</Text>
      </View>
    );
  }

  return (
    <ImageBackground 
      source={require('../../assets/images/backgrounds/Fundo_01.png')} 
      style={styles.backgroundImage}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.mainContent}>
          <Image 
            source={require('../../assets/images/Icone/Pets_Up.png')} 
            style={styles.logoImage} 
          />
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
            <TouchableOpacity 
              style={styles.touchableOpacity} 
              onPress={() => setMostrarSenha(!mostrarSenha)}
            >
              <Icon name={mostrarSenha ? 'eye-off' : 'eye'} size={24} color="#555" />
            </TouchableOpacity>
          </View>
          <Text style={styles.errorTextSenha}>{senhaErro}</Text>

          <TouchableOpacity
            onPress={() => router.push('/pages/ForgotPasswordScreen')}
            style={[styles.forgotPasswordContainer, (emailErro || senhaErro) && { marginTop: 0 }]}
          >
            <Text style={styles.forgotPasswordText}>Esqueceu sua senha?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Text>
          </TouchableOpacity>

          <View style={styles.registerContainer}>
            <Text style={styles.noAccountText}>Não possui cadastro?</Text>
            <Link href="/pages/userCadastro">
              <Text style={styles.registerText}>Cadastra-se aqui!!</Text>
            </Link>
          </View>
        </View>

        {/* Modal de boas-vindas */}
        <WelcomeModal
          visible={welcomeModalVisible}
          onClose={handleCloseWelcomeModal}
          userName={userName}
          photoUrl={userPhoto}
        />
      </SafeAreaView>
    </ImageBackground>
  );
}

// Estilos (mantidos iguais)
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    width: '85%',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    zIndex: 1001,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  modalText: {
    fontSize: 18,
    marginVertical: 15,
    textAlign: 'center',
    color: '#333',
  },
  modalButton: {
    backgroundColor: '#4285F4',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginTop: 15,
    elevation: 3,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  photoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#4285F4',
    marginBottom: 10,
  },
  userPhoto: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
    borderWidth: 3,
    borderColor: '#ccc',
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
  touchableOpacity: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
});