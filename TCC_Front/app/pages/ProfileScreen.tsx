// ProfileScreen.tsx
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  Alert
} from 'react-native';
import { getUsuarioById, getEstados, getCidadesPorEstado, getSexoUsuario, validarUsuario } from '@/services/api';
import EstadoSelect from '@/components/estados/EstadoSelect';
import CidadeSelect from '@/components/cidades/CidadeSelect';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Interface para o tipo de usuário
interface Usuario {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  cpf_cnpj: string;
  cep: string;
  estado: {
    nome: string;
  };
  cidade: {
    nome: string;
  };
  foto?: string;
  sexo_id: number;
}

export default function ProfileScreen() {
  // Estado para armazenar os dados do usuário
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para seleção de estado e cidade
  const [estados, setEstados] = useState<any[]>([]);
  const [cidades, setCidades] = useState<any[]>([]);
  const [estadoSelecionado, setEstadoSelecionado] = useState<number | null>(null);
  const [sexos, setSexos] = useState<any[]>([]);
  
  // Campos editáveis
  const [nome, setNome] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [telefone, setTelefone] = useState<string>('');
  const [cpfCnpj, setCpfCnpj] = useState<string>('');
  const [cep, setCep] = useState<string>('');
  const [estado, setEstado] = useState<string>('');
  const [cidade, setCidade] = useState<string>('');
  const [senha, setSenha] = useState<string>('');
  const [confirmarSenha, setConfirmarSenha] = useState<string>('');
  const [sexoId, setSexoId] = useState<number>(1); // 1: Homem, 2: Mulher, 3: Prefiro não dizer

  // Buscar dados do usuário quando o componente montar
  useEffect(() => {
    fetchUserData();
    fetchEstados();
    fetchSexos();
  }, []);
  
  // Carregar cidades quando o estado é selecionado
  useEffect(() => {
    if (estadoSelecionado) {
      fetchCidades(estadoSelecionado);
    }
  }, [estadoSelecionado]);

  // Função para buscar estados
  const fetchEstados = async () => {
    try {
      const data = await getEstados();
      setEstados(data);
    } catch (err) {
      console.error('Erro ao buscar estados:', err);
    }
  };

  // Função para buscar cidades por estado
  const fetchCidades = async (estadoId: number) => {
    try {
      const data = await getCidadesPorEstado(estadoId);
      setCidades(data);
    } catch (err) {
      console.error('Erro ao buscar cidades:', err);
    }
  };

  // Função para buscar sexos
  const fetchSexos = async () => {
    try {
      const data = await getSexoUsuario();
      setSexos(data);
    } catch (err) {
      console.error('Erro ao buscar sexos:', err);
    }
  };

  // Função para buscar dados do usuário usando AsyncStorage
  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Use the same '@App:userId' key that was used to store
      const userId = await AsyncStorage.getItem('@App:userId');
      
      if (!userId) {
        console.error('ID do usuário não encontrado no AsyncStorage');
        setError('Não foi possível identificar o usuário conectado.');
        setLoading(false);
        return;
      }
      
      const userIdNumber = parseInt(userId, 10);
      
      // Buscar dados do usuário da API
      const userData = await getUsuarioById(userIdNumber);
      
      if (!userData) {
        console.error('Dados do usuário não encontrados');
        setError('Não foi possível carregar os dados do usuário.');
        setLoading(false);
        return;
      }
      
      console.log('Dados do usuário carregados:', userData);
      
      setUsuario(userData);
      
      // Preencher os estados para edição
      setNome(userData.nome || '');
      setEmail(userData.email || '');
      setTelefone(userData.telefone || '');
      setCpfCnpj(userData.cpf_cnpj || '');
      setCep(userData.cep || '');
      
      // Definir estado e cidade
      if (userData.estado) {
        setEstado(userData.estado.nome || '');
        setEstadoSelecionado(userData.estado.id || null);
      }
      
      if (userData.cidade) {
        setCidade(userData.cidade.nome || '');
      }
      
      setSexoId(userData.sexo_id || 1);
      
    } catch (err) {
      console.error('Erro ao buscar dados do usuário:', err);
      setError('Não foi possível carregar os dados do perfil. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  // Função para salvar as alterações no perfil
  const handleSaveProfile = async () => {
    // Validar senha
    if (senha && senha !== confirmarSenha) {
      Alert.alert('Erro', 'As senhas não conferem');
      return;
    }

    // Validar campos obrigatórios
    if (!nome || !email || !telefone) {
      Alert.alert('Erro', 'Nome, e-mail e telefone são campos obrigatórios');
      return;
    }

    try {
      setLoading(true);
      
      // Criar objeto com os dados do usuário para atualização
      const userData = {
        id: usuario?.id,
        nome,
        email,
        telefone,
        cpf_cnpj: cpfCnpj,
        cep,
        estado_id: estadoSelecionado,
        cidade_id: cidades.find(c => c.nome === cidade)?.id,
        sexo_id: sexoId,
        senha: senha || undefined // Só envia senha se tiver sido preenchida
      };
      
      // Validar usuário na API
      const resultado = await validarUsuario(userData);
      
      if (resultado && resultado.success) {
        Alert.alert('Sucesso', 'Dados salvos com sucesso!');
      } else {
        Alert.alert('Erro', resultado?.message || 'Não foi possível salvar os dados.');
      }
      
    } catch (err) {
      console.error('Erro ao salvar dados do perfil:', err);
      Alert.alert('Erro', 'Não foi possível salvar os dados. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground 
        source={require('../../assets/images/backgrounds/Fundo_02.png')} 
        style={styles.backgroundImage}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4682B4" />
              <Text style={styles.loadingText}>Carregando dados...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={fetchUserData}
              >
                <Text style={styles.retryButtonText}>Tentar novamente</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.profileContainer}>
              <Text style={styles.pageTitle}>Meus dados</Text>
              
              {/* Área para foto do perfil */}
              <View style={styles.photoContainer}>
                {usuario?.foto ? (
                  <Image 
                    source={{ uri: usuario.foto }} 
                    style={styles.profilePhoto} 
                  />
                ) : (
                  <View style={styles.profilePhotoPlaceholder} />
                )}
              </View>
              
              {/* Campos do formulário */}
              <View style={styles.formContainer}>
                <Text style={styles.inputLabel}>Nome</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Nome"
                    value={nome}
                    onChangeText={setNome}
                  />
                  <Image source={require('../../assets/images/Icone/edit-icon.png')} style={styles.editIcon} />
                </View>
                
                <Text style={styles.inputLabel}>Sexo</Text>
                <View style={styles.sexoContainer}>
                  <TouchableOpacity 
                    style={[styles.sexoOption, sexoId === 1 && styles.sexoOptionSelected]}
                    onPress={() => setSexoId(1)}
                  >
                    <View style={[styles.radioButton, sexoId === 1 && styles.radioButtonSelected]} />
                    <Text style={styles.sexoText}>Homem</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.sexoOption, sexoId === 2 && styles.sexoOptionSelected]}
                    onPress={() => setSexoId(2)}
                  >
                    <View style={[styles.radioButton, sexoId === 2 && styles.radioButtonSelected]} />
                    <Text style={styles.sexoText}>Mulher</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.sexoOption, sexoId === 3 && styles.sexoOptionSelected]}
                    onPress={() => setSexoId(3)}
                  >
                    <View style={[styles.radioButton, sexoId === 3 && styles.radioButtonSelected]} />
                    <Text style={styles.sexoText}>Não quero falar</Text>
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.inputLabel}>E-mail</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="E-mail"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <Image source={require('../../assets/images/Icone/edit-icon.png')} style={styles.editIcon} />
                </View>
                
                <Text style={styles.inputLabel}>Telefone</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="(00) 0000-0000"
                    value={telefone}
                    onChangeText={setTelefone}
                    keyboardType="phone-pad"
                  />
                  <Image source={require('../../assets/images/Icone/edit-icon.png')} style={styles.editIcon} />
                </View>
                
                <Text style={styles.inputLabel}>CPF/CNPJ</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="000.000.000-00"
                    value={cpfCnpj}
                    onChangeText={setCpfCnpj}
                    keyboardType="numeric"
                  />
                  <Image source={require('../../assets/images/Icone/edit-icon.png')} style={styles.editIcon} />
                </View>
                
                <Text style={styles.inputLabel}>CEP</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="00.000-000"
                    value={cep}
                    onChangeText={setCep}
                    keyboardType="numeric"
                  />
                  <Image source={require('../../assets/images/Icone/edit-icon.png')} style={styles.editIcon} />
                </View>
                
                <Text style={styles.inputLabel}>Estado</Text>
                <EstadoSelect
                  estados={estados}
                  selectedEstado={estadoSelecionado}
                  onEstadoChange={(estadoId) => {
                    setEstadoSelecionado(estadoId);
                    // Encontrar o nome do estado para exibição
                    const estadoObj = estados.find(e => e.id === estadoId);
                    if (estadoObj) {
                      setEstado(estadoObj.nome);
                    }
                    // Limpar cidade quando mudar o estado
                    setCidade('');
                  }}
                  containerStyle={styles.dropdownContainer}
                  textStyle={styles.dropdownText}
                />
                
                <Text style={styles.inputLabel}>Cidade</Text>
                <CidadeSelect
                  cidades={cidades}
                  selectedCidade={cidades.find(c => c.nome === cidade)?.id}
                  onCidadeChange={(cidadeId) => {
                    // Encontrar o nome da cidade para exibição
                    const cidadeObj = cidades.find(c => c.id === cidadeId);
                    if (cidadeObj) {
                      setCidade(cidadeObj.nome);
                    }
                  }}
                  containerStyle={styles.dropdownContainer}
                  textStyle={styles.dropdownText}
                  disabled={!estadoSelecionado}
                />
                
                <Text style={styles.inputLabel}>Senha</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Senha"
                    value={senha}
                    onChangeText={setSenha}
                    secureTextEntry
                  />
                  <Image source={require('../../assets/images/Icone/edit-icon.png')} style={styles.editIcon} />
                </View>
                
                <Text style={styles.inputLabel}>Confirmar Senha</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Confirmar Senha"
                    value={confirmarSenha}
                    onChangeText={setConfirmarSenha}
                    secureTextEntry
                  />
                  <Image source={require('../../assets/images/Icone/edit-icon.png')} style={styles.editIcon} />
                </View>
                
                <TouchableOpacity 
                  style={styles.saveButton}
                  onPress={handleSaveProfile}
                >
                  <Text style={styles.saveButtonText}>Salvar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
        
        {/* Barra de navegação inferior */}
        <View style={styles.bottomNavigation}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => router.push('/pages/PetDonation')}
          >
            <Image source={require('../../assets/images/Icone/adoption-icon.png')} style={styles.navIcon} />
            <Text style={styles.navText}>Adoção</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => router.push('/pages/PetAdoptionScreen')}
          >
            <Image source={require('../../assets/images/Icone/donation-icon.png')} style={styles.navIcon} />
            <Text style={styles.navText}>Pets</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
          >
            <View style={styles.activeCircle}>
              <Image source={require('../../assets/images/Icone/profile-icon.png')} style={styles.navIcon} />
            </View>
            <Text style={styles.activeNavText}>Perfil</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4682B4',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#FFFFFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF0000',
    textAlign: 'center',
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: '#4682B4',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  profileContainer: {
    flex: 1,
    padding: 20,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 20,
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  profilePhotoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E8E8E8',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  formContainer: {
    backgroundColor: 'transparent',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#000',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8E8E8',
    borderRadius: 25,
    marginBottom: 15,
    paddingHorizontal: 15,
    height: 50,
  },
  input: {
    flex: 1,
    height: 40,
  },
  editIcon: {
    width: 20,
    height: 20,
  },
  sexoContainer: {
    marginBottom: 15,
  },
  sexoOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sexoOptionSelected: {
    opacity: 1,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#4682B4',
    marginRight: 10,
  },
  radioButtonSelected: {
    backgroundColor: '#4682B4',
  },
  sexoText: {
    fontSize: 16,
  },
  dropdownContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E8E8E8',
    borderRadius: 25,
    marginBottom: 15,
    paddingHorizontal: 15,
    height: 50,
  },
  dropdownText: {
    flex: 1,
  },
  dropdownIcon: {
    width: 12,
    height: 12,
  },
  saveButton: {
    backgroundColor: '#E8E8E8',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  bottomNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    paddingVertical: 10,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
  },
  navIcon: {
    width: 30,
    height: 30,
  },
  navText: {
    fontSize: 12,
    marginTop: 3,
    color: '#000',
  },
  activeNavText: {
    fontSize: 12,
    marginTop: 3,
    color: '#4682B4',
    fontWeight: 'bold',
  },
  activeCircle: {
    backgroundColor: '#E8F1F8',
    borderRadius: 20,
    padding: 5,
  },
});