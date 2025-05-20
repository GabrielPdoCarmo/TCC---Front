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
import login from '../../services/api/auth'; // Importando a função de login
import getUsuarioById from '../../services/api/Usuario/getUsuarioById'; // Importando a função de buscar usuário

// Interface para tipagem de erros da API
interface ApiError {
  error?: string;
  message?: string;
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
  
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
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
                onError={(e) => console.error("Erro ao carregar imagem:", e.nativeEvent.error)}
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

export default function App() {
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

  // Limpar erros conforme o campo é alterado
  useEffect(() => {
    if (email) setEmailErro('');
  }, [email]);

  useEffect(() => {
    if (senha) setSenhaErro('');
  }, [senha]);

  // Função para tratar mensagens de erro da API
  const getErrorMessage = (error: unknown): string => {
    // [manter código existente]
    const apiError = error as ApiError;
    
    if (apiError?.message?.includes('Email e senha são obrigatórios')) {
      return 'Por favor, preencha todos os campos de login.';
    }

    if (apiError?.error?.includes('Erro ao fazer login')) {
      return 'Não foi possível fazer login. Verifique sua conexão.';
    }

    if (JSON.stringify(error).includes('NOBRIDGE') || JSON.stringify(error).includes('ERROR')) {
      return 'Não foi possível completar sua solicitação. Tente novamente mais tarde.';
    }

    return apiError?.error || apiError?.message || 'Ocorreu um erro inesperado. Tente novamente.';
  };

  const handleLogin = async () => {
    setEmailErro('');
    setSenhaErro('');

    // Validações
    let temErros = false;

    // [manter código de validação existente]
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
      // Executa o login e aguarda a resposta
      const data = await login(email, senha);

      // Importante: Dar um pequeno tempo para garantir que o AsyncStorage
      // tenha concluído as operações assíncronas
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Agora verificamos se os dados foram salvos
      const userId = await AsyncStorage.getItem('@App:userId');
      const userJson = await AsyncStorage.getItem('@App:user');
      
      console.log('Dados salvos no AsyncStorage:', { userId, userJson });

      if (!userId || !userJson) {
        throw { error: 'Falha ao finalizar login' };
      }
      
      // NOVA ETAPA: Buscar detalhes completos do usuário para obter a foto
      const userDetails = await getUsuarioById(parseInt(userId));
      console.log('Detalhes completos do usuário:', userDetails);
      
      // Verificar se temos uma URL de foto nos detalhes do usuário
      let photoUrlToUse = null;
      
      if (userDetails && userDetails.foto) {
        // Verificar se a URL já tem http/https. Se não tiver, adicionar
        photoUrlToUse = userDetails.foto;
        if (!photoUrlToUse.startsWith('http://') && !photoUrlToUse.startsWith('https://')) {
          // Assumindo que a API retorna caminhos relativos a uma URL base
          const apiBaseUrl = 'https://petsup-api.onrender.com'; // Substitua pela URL base da sua API
          photoUrlToUse = `${apiBaseUrl}${photoUrlToUse}`;
        }
        console.log('URL da foto ajustada:', photoUrlToUse);
      }
      
      // Preparar dados para o modal de boas-vindas
      setUserName(userDetails?.nome || data.usuario?.nome || 'usuário');
      setUserPhoto(photoUrlToUse);
      
      // Mostrar o modal de boas-vindas
      setWelcomeModalVisible(true);
      
    } catch (error: unknown) {
      // Ao invés de exibir o erro técnico, exibimos uma mensagem amigável
      if (__DEV__) {
        console.error('Erro original:', error);
      }

      const userFriendlyMessage = getErrorMessage(error);
      Alert.alert('Erro ao fazer login', userFriendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  // Função para fechar o modal e navegar para a próxima tela
  const handleCloseWelcomeModal = () => {
    setWelcomeModalVisible(false);
    router.push('/pages/PetAdoptionScreen');
  };

  return (
    <ImageBackground source={require('../../assets/images/backgrounds/Fundo_01.png')} style={styles.backgroundImage}>
      {/* [manter JSX existente] */}
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

const styles = StyleSheet.create({
  // [manter estilos existentes]
  // Estilos de modal e foto
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '80%',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 22,
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
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 10,
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
  
  // [Manter todos os outros estilos existentes]
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