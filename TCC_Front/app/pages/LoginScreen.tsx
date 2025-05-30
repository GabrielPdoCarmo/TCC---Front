// pages/LoginScreen.tsx - com AuthProvider próprio
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import login from '../../services/api/auth';
import getUsuarioById from '../../services/api/Usuario/getUsuarioById';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';

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

// Componente para o modal de boas-vindas com foto
const WelcomeModal: React.FC<WelcomeModalProps> = ({ visible, onClose, userName, photoUrl }) => {
  // Debug: Log quando o modal for renderizado
  console.log('🎭 WelcomeModal renderizado:', { visible, userName, photoUrl });

  return (
    <Modal 
      animationType="fade" 
      transparent={true} 
      visible={visible} 
      onRequestClose={onClose}
      statusBarTranslucent={true} // Adiciona suporte para status bar
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
                onLoad={() => {
                  console.log('✅ Imagem carregada com sucesso:', photoUrl);
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

// Componente de conteúdo do Login que usa o AuthContext
function LoginScreenContent() {
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

  // Hook do contexto de autenticação
  const { login: setAuthLogin, isAuthenticated, loading: authLoading } = useAuth();

  // Debug: Log dos estados do modal
  useEffect(() => {
    console.log('🎭 Estado do modal mudou:', { 
      welcomeModalVisible, 
      userName, 
      userPhoto 
    });
  }, [welcomeModalVisible, userName, userPhoto]);

  // Se já estiver autenticado, redirecionar
  useEffect(() => {
    console.log('🔍 LoginScreen: authLoading:', authLoading, 'isAuthenticated:', isAuthenticated);
    
    if (!authLoading && isAuthenticated) {
      console.log('✅ Usuário já autenticado, redirecionando...');
      router.replace('/pages/PetAdoptionScreen');
    }
  }, [isAuthenticated, authLoading]);

  // Limpar erros conforme o campo é alterado
  useEffect(() => {
    if (email) setEmailErro('');
  }, [email]);

  useEffect(() => {
    if (senha) setSenhaErro('');
  }, [senha]);

  // Função para tratar mensagens de erro da API
  const getErrorMessage = (error: unknown): string => {
    console.log('🔍 Analisando erro:', error);

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

    const errorString = JSON.stringify(error);
    if (errorString.includes('NOBRIDGE') || errorString.includes('Network Error') || errorString.includes('timeout')) {
      return 'Problema de conexão. Verifique sua internet e tente novamente.';
    }

    console.log('⚠️ Erro não tratado especificamente:', error);
    return 'Ocorreu um erro inesperado. Tente novamente.';
  };

  // Estado para armazenar dados de login temporariamente
  const [tempLoginData, setTempLoginData] = useState<any>(null);

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
      return;
    }

    // Iniciar o processo de login
    setLoading(true);
    try {
      console.log('🚀 Iniciando login para:', email);

      // Executa o login e aguarda a resposta
      const data = await login(email, senha);
      console.log('✅ Login bem-sucedido:', data);

      // Buscar detalhes completos do usuário para obter a foto
      let userDetails = null;
      try {
        userDetails = await getUsuarioById(data.usuario.id);
        console.log('👤 Detalhes completos do usuário:', userDetails);
      } catch (userError) {
        console.log('⚠️ Erro ao buscar detalhes do usuário:', userError);
        // Continue mesmo se não conseguir buscar detalhes
        userDetails = data.usuario;
      }

      // Verificar se temos uma URL de foto nos detalhes do usuário
      let photoUrlToUse = null;

      if (userDetails && userDetails.foto) {
        photoUrlToUse = userDetails.foto;
        if (!photoUrlToUse.startsWith('http://') && !photoUrlToUse.startsWith('https://')) {
          const apiBaseUrl = 'https://petsup-api.onrender.com';
          photoUrlToUse = `${apiBaseUrl}${photoUrlToUse}`;
        }
        console.log('📸 URL da foto ajustada:', photoUrlToUse);
      }

      const userDataForContext = userDetails || data.usuario;
      
      // Preparar dados para o modal de boas-vindas
      const displayName = userDataForContext?.nome || 'usuário';
      console.log('🎭 Preparando modal com:', { displayName, photoUrlToUse });
      
      setUserName(displayName);
      setUserPhoto(photoUrlToUse);
      
      // Salvar dados temporariamente para usar depois no modal
      setTempLoginData({
        userDataForContext,
        token: data.token
      });
      
      // Mostrar o modal SEM atualizar o contexto ainda
      console.log('🎭 Mostrando modal de boas-vindas...');
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

  // Função para fechar o modal e navegar
  const handleCloseWelcomeModal = async () => {
    console.log('🎭 Fechando modal de boas-vindas');
    setWelcomeModalVisible(false);
    
    // Agora sim, atualizar o contexto de autenticação
    if (tempLoginData) {
      try {
        console.log('✅ Atualizando contexto de autenticação...');
        await setAuthLogin(tempLoginData.userDataForContext, tempLoginData.token);
        console.log('✅ Contexto atualizado, navegando...');
        
        // Limpar dados temporários
        setTempLoginData(null);
        
        // Navegar para a próxima página
        router.replace('/pages/PetAdoptionScreen');
      } catch (authError) {
        console.error('❌ Erro ao atualizar contexto:', authError);
        Alert.alert('Erro', 'Houve um problema ao finalizar o login. Tente novamente.');
      }
    }
  };

  // Função de teste para o modal (remover em produção)
  const testModal = () => {
    console.log('🧪 Testando modal...');
    setUserName('Usuário Teste');
    setUserPhoto(null);
    setWelcomeModalVisible(true);
  };

  // Se ainda está verificando autenticação, mostrar loading
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
            <Text style={styles.loginButtonText}>{loading ? 'Entrando...' : 'Entrar'}</Text>
          </TouchableOpacity>

          <View style={styles.registerContainer}>
            <Text style={styles.noAccountText}>Não possui cadastro?</Text>
            <Link href="/pages/userCadastro">
              <Text style={styles.registerText}>Cadastra-se aqui!!</Text>
            </Link>
          </View>
        </View>

        {/* Modal de boas-vindas com foto */}
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

// Componente principal que envolve com AuthProvider
export default function LoginScreen() {
  console.log('🎯 LoginScreen montado');
  
  return (
    <AuthProvider>
      <LoginScreenContent />
    </AuthProvider>
  );
}

// Estilos
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // Aumentei a opacidade
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000, // Adicionei z-index alto
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30, // Aumentei o padding
    width: '85%', // Aumentei a largura
    alignItems: 'center',
    elevation: 10, // Aumentei a elevação
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 }, // Aumentei a sombra
    shadowOpacity: 0.35,
    shadowRadius: 6,
    zIndex: 1001, // Z-index ainda maior para o conteúdo
  },
  modalTitle: {
    fontSize: 24, // Aumentei o tamanho
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
    paddingVertical: 12, // Aumentei o padding
    paddingHorizontal: 40, // Aumentei o padding horizontal
    borderRadius: 25,
    marginTop: 15,
    elevation: 3, // Adicionei elevação ao botão
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
    marginBottom: 10, // Adicionei margem
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