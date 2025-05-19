// ProfileScreen.tsx
import { router } from 'expo-router';
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Alert,
} from 'react-native';
import {
  getUsuarioById,
  updateUsuario,
  getEstados,
  getCidadesPorEstadoID,
  getSexoUsuario,
  validarUsuario,
} from '@/services/api';
import EstadoSelect from '@/components/estados/EstadoSelect';
import CidadeSelect from '@/components/cidades/CidadeSelect';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Feather from 'react-native-vector-icons/Feather';
import * as ImagePicker from 'expo-image-picker';
// Interface para o tipo de usuário conforme retornado pela API
interface Usuario {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  cep: string;
  estado_id: number;
  cidade_id: number;
  estado?: {
    id: number;
    nome: string;
  };
  cidade?: {
    id: number;
    nome: string;
  };
  foto?: string;
  sexo_id: number;
}

// Interface para o tipo que é esperado pela API
interface UsuarioData {
  id?: number;
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  cep: string;
  estado_id: number | null;
  cidade_id: number | null;
  sexo_id: number;
  senha?: string | undefined;
  foto: string | null; // Adicione a propriedade foto
}

// Interfaces para os componentes
interface Estado {
  id: number;
  nome: string;
}

interface Cidade {
  id: number;
  nome: string;
}

interface Sexo {
  id: number;
  descricao: string;
}

// Helper functions for formatting and validation
const formatCPF = (cpf: string): string => {
  // Remove non-numeric characters
  const numericValue = cpf.replace(/\D/g, '');

  // Apply CPF mask: 000.000.000-00
  if (numericValue.length <= 3) {
    return numericValue;
  } else if (numericValue.length <= 6) {
    return `${numericValue.slice(0, 3)}.${numericValue.slice(3)}`;
  } else if (numericValue.length <= 9) {
    return `${numericValue.slice(0, 3)}.${numericValue.slice(3, 6)}.${numericValue.slice(6)}`;
  } else {
    return `${numericValue.slice(0, 3)}.${numericValue.slice(3, 6)}.${numericValue.slice(6, 9)}-${numericValue.slice(
      9,
      11
    )}`;
  }
};

const formatTelefone = (telefone: string): string => {
  // Remove non-numeric characters
  const numericValue = telefone.replace(/\D/g, '');

  // Apply phone mask: (00) 00000-0000 or (00) 0000-0000
  if (numericValue.length <= 2) {
    return numericValue;
  } else if (numericValue.length <= 6) {
    return `(${numericValue.slice(0, 2)}) ${numericValue.slice(2)}`;
  } else if (numericValue.length <= 10) {
    // For 8-digit numbers (landline)
    return `(${numericValue.slice(0, 2)}) ${numericValue.slice(2, 6)}-${numericValue.slice(6)}`;
  } else {
    // For 9-digit numbers (mobile)
    return `(${numericValue.slice(0, 2)}) ${numericValue.slice(2, 7)}-${numericValue.slice(7)}`;
  }
};

const formatCEP = (cep: string): string => {
  // Remove non-numeric characters
  const numericValue = cep.replace(/\D/g, '');

  // Apply CEP mask: 00000-000
  if (numericValue.length <= 5) {
    return numericValue;
  } else {
    return `${numericValue.slice(0, 5)}-${numericValue.slice(5, 8)}`;
  }
};

// Helper function to remove all non-numeric characters
const stripNonNumeric = (text: string): string => {
  return text.replace(/\D/g, '');
};

// Function to validate email format
const validarEmail = (email: string) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// Function to validate CPF format
const validarCpf = (cpf: string) => {
  const regex = /^\d{11}$/;
  return regex.test(stripNonNumeric(cpf));
};

// Function to validate telephone format
const validarTelefone = (telefone: string) => {
  const somenteNumeros = stripNonNumeric(telefone);
  return somenteNumeros.length >= 10;
};

// Function to validate CEP format
const validarCep = (cep: string) => {
  const regex = /^\d{8}$/;
  return regex.test(stripNonNumeric(cep));
};

// Function to normalize strings for case-insensitive comparisons
const normalizeString = (str: string): string => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .toLowerCase() // Convert to lowercase
    .trim(); // Remove extra spaces
};

// Function to fetch address data by CEP using the ViaCEP API
const fetchAddressByCep = async (cep: string): Promise<any> => {
  try {
    const formattedCep = stripNonNumeric(cep);
    if (formattedCep.length !== 8) {
      return null;
    }

    const response = await fetch(`https://viacep.com.br/ws/${formattedCep}/json/`);
    const data = await response.json();

    if (data.erro) {
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erro ao buscar endereço pelo CEP:', error);
    return null;
  }
};

// Mapping of state abbreviations to full names
const estadosSiglaParaNome: { [key: string]: string } = {
  AC: 'Acre',
  AL: 'Alagoas',
  AP: 'Amapá',
  AM: 'Amazonas',
  BA: 'Bahia',
  CE: 'Ceará',
  DF: 'Distrito Federal',
  ES: 'Espírito Santo',
  GO: 'Goiás',
  MA: 'Maranhão',
  MT: 'Mato Grosso',
  MS: 'Mato Grosso do Sul',
  MG: 'Minas Gerais',
  PA: 'Pará',
  PB: 'Paraíba',
  PR: 'Paraná',
  PE: 'Pernambuco',
  PI: 'Piauí',
  RJ: 'Rio de Janeiro',
  RN: 'Rio Grande do Norte',
  RS: 'Rio Grande do Sul',
  RO: 'Rondônia',
  RR: 'Roraima',
  SC: 'Santa Catarina',
  SP: 'São Paulo',
  SE: 'Sergipe',
  TO: 'Tocantins',
};

export default function ProfileScreen() {
  // Estado para armazenar os dados do usuário
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para seleção de estado e cidade
  const [estados, setEstados] = useState<Estado[]>([]);
  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [estadoSelecionado, setEstadoSelecionado] = useState<number | null>(null);
  const [cidadeSelecionada, setCidadeSelecionada] = useState<number | null>(null);
  const [sexos, setSexos] = useState<Sexo[]>([]);
  const [loadingCep, setLoadingCep] = useState<boolean>(false);
  const [loadingCidades, setLoadingCidades] = useState<boolean>(false);

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
  const [sexoId, setSexoId] = useState<number>(1);
  const [foto, setFoto] = useState<string | null>(null);
  const [fotoErro, setFotoErro] = useState<string>('');
  // Campos de erro
  const [nomeErro, setNomeErro] = useState<string>('');
  const [emailErro, setEmailErro] = useState<string>('');
  const [telefoneErro, setTelefoneErro] = useState<string>('');
  const [cpfErro, setCpfErro] = useState<string>('');
  const [cepErro, setCepErro] = useState<string>('');
  const [estadoErro, setEstadoErro] = useState<string>('');
  const [cidadeErro, setCidadeErro] = useState<string>('');
  const [senhaErro, setSenhaErro] = useState<string>('');
  const [confirmarSenhaErro, setConfirmarSenhaErro] = useState<string>('');
  const [sexoErro, setSexoErro] = useState<string>('');
  // Estado para toggle de senha
  const [showSenha, setShowSenha] = useState<boolean>(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState<boolean>(false);

  // Cache para armazenar cidades por estado
  const cidadesCache = useRef<{ [key: string]: Cidade[] }>({});

  // Reference to store user data until states are loaded
  const pendingUserData = useRef<Usuario | null>(null);

  // Buscar dados iniciais quando o componente montar
  useEffect(() => {
    initializeData();
  }, []);

  // Função para inicializar todos os dados necessários
  const initializeData = async () => {
    try {
      setLoading(true);

      // Buscar dados em paralelo
      const [estadosData, sexosData] = await Promise.all([getEstados(), getSexoUsuario()]);

      setEstados(estadosData);
      setSexos(sexosData);

      // Agora que os estados foram carregados, buscar dados do usuário
      await fetchUserData(estadosData);
    } catch (err) {
      console.error('Erro ao inicializar dados:', err);
      setError('Erro ao carregar dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Carregar cidades quando o estado é selecionado
  useEffect(() => {
    if (estadoSelecionado) {
      fetchCidades(estadoSelecionado);
    }
  }, [estadoSelecionado]);

  // Função para buscar cidades por estado com cache
  // Add this adapter function inside the ProfileScreen component
  // This will convert the estadoId (number) to the proper format needed by the API

  // Função fetchCidades corrigida para usar o nome do estado em vez do ID
  const fetchCidades = async (estadoId: number) => {
    const estadoKey = estadoId.toString();

    // Log para depuração
    console.log('Tentando buscar cidades para estadoId:', estadoId);
    console.log(
      'Estados disponíveis:',
      estados.map((e) => `${e.id} - ${e.nome}`)
    );

    // Verificar se já existe no cache
    if (cidadesCache.current[estadoKey]) {
      console.log('Encontrado no cache, usando cidades em cache');
      setCidades(cidadesCache.current[estadoKey]);
      return;
    }

    setLoadingCidades(true);
    try {
      // Chamar a API diretamente com o ID, sem tentar encontrar o estado
      console.log('Chamando API diretamente com ID:', estadoId);
      const data = await getCidadesPorEstadoID(estadoId);

      console.log(`Recebidas ${data.length} cidades para o estado ID ${estadoId}`);
      setCidades(data);
      // Salvar no cache
      cidadesCache.current[estadoKey] = data;
    } catch (err) {
      console.error('Erro ao buscar cidades:', err);
      setCidades([]);
    } finally {
      setLoadingCidades(false);
    }
  };

  // Função para buscar dados do usuário usando AsyncStorage
  const fetchUserData = async (estadosData?: Estado[]) => {
    try {
      // Use the same '@App:userId' key that was used to store
      const userId = await AsyncStorage.getItem('@App:userId');

      if (!userId) {
        console.error('ID do usuário não encontrado no AsyncStorage');
        setError('Não foi possível identificar o usuário conectado.');
        return;
      }

      const userIdNumber = parseInt(userId);

      // Buscar dados do usuário da API
      const userData = await getUsuarioById(userIdNumber);

      if (!userData) {
        console.error('Dados do usuário não encontrados');
        setError('Não foi possível carregar os dados do usuário.');
        return;
      }

      console.log('Dados do usuário carregados:', userData);

      // Atualizar o estado do usuário com os dados recebidos
      setUsuario(userData);

      // Preencher os estados para edição
      setNome(userData.nome || '');
      setEmail(userData.email || '');
      setTelefone(formatTelefone(userData.telefone || ''));
      setCpfCnpj(formatCPF(userData.cpf || ''));
      setCep(formatCEP(userData.cep || ''));
      setSexoId(userData.sexo_id || 1);

      // Usar os estados passados como parâmetro ou os já carregados
      const estadosDisponiveis = estadosData || estados;

      // Definir estado e cidade
      if (userData.estado_id && estadosDisponiveis.length > 0) {
        const estadoEncontrado = estadosDisponiveis.find((e) => e.id === userData.estado_id);

        if (estadoEncontrado) {
          setEstadoSelecionado(userData.estado_id);
          setEstado(estadoEncontrado.nome);

          // Carregar cidades do estado selecionado
          await fetchCidades(userData.estado_id);
        } else {
          console.error('Estado não encontrado:', userData.estado_id);
          // Ainda assim define o ID para tentar carregar as cidades
          setEstadoSelecionado(userData.estado_id);
        }
      }
      // Se o usuário tiver uma foto, inicialize o estado com ela
      if (userData.foto) {
        setFoto(userData.foto);
      }
      if (userData.cidade_id) {
        setCidadeSelecionada(userData.cidade_id);
      }

      // Se tiver objetos aninhados de estado e cidade, usar esses nomes
      if (userData.estado && userData.estado.nome) {
        setEstado(userData.estado.nome);
      }

      if (userData.cidade && userData.cidade.nome) {
        setCidade(userData.cidade.nome);
      }
    } catch (err) {
      console.error('Erro ao buscar dados do usuário:', err);
      setError('Não foi possível carregar os dados do perfil. Tente novamente mais tarde.');
    }
  };

  // Handlers para inputs formatados
  const handleNomeChange = (text: string) => {
    setNome(text);
    if (text.trim().length > 0) setNomeErro('');
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (validarEmail(text)) setEmailErro('');
  };

  const handleTelefoneChange = (text: string) => {
    const formattedTelefone = formatTelefone(text);
    setTelefone(formattedTelefone);
    if (validarTelefone(formattedTelefone)) setTelefoneErro('');
  };

  const handleCpfChange = (text: string) => {
    const formattedCpf = formatCPF(text);
    setCpfCnpj(formattedCpf);
    if (validarCpf(stripNonNumeric(formattedCpf))) setCpfErro('');
  };

  const handleCepChange = (text: string) => {
    const formattedCep = formatCEP(text);
    setCep(formattedCep);
    if (validarCep(stripNonNumeric(formattedCep))) setCepErro('');

    const numericCep = stripNonNumeric(text);
    if (numericCep.length === 8) {
      handleBuscarCep(numericCep);
    }
  };

  // Função para buscar endereço pelo CEP
  async function lookupCepAddress(cep: string) {
    try {
      const cleanedCep = cep.replace(/\D/g, '');
      if (cleanedCep.length !== 8) {
        throw new Error('CEP inválido');
      }

      const response = await fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`);
      if (!response.ok) {
        throw new Error('Erro ao buscar o CEP');
      }

      const data = await response.json();

      if (data.erro) {
        throw new Error('CEP não encontrado');
      }

      const estadoNome = estadosSiglaParaNome[data.uf];

      return {
        cep: data.cep,
        logradouro: data.logradouro,
        bairro: data.bairro,
        cidade: data.localidade,
        estado: estadoNome,
      };
    } catch (error) {
      console.error('Erro ao buscar endereço:', error);
      throw error;
    }
  }

  // Função para buscar endereço pelo CEP
  // Função para buscar endereço pelo CEP
  async function handleBuscarCep(numericCep?: string) {
    try {
      setLoadingCep(true);

      const endereco = await lookupCepAddress(numericCep ?? cep);

      if (!endereco || !endereco.estado || !endereco.cidade) {
        setCepErro('CEP não encontrado ou inválido.');
        return;
      }

      // Encontrar o estado correspondente
      if (endereco.estado) {
        const estadoEncontrado = estados.find((e) => normalizeString(e.nome) === normalizeString(endereco.estado));

        if (estadoEncontrado) {
          setEstadoSelecionado(estadoEncontrado.id);
          setEstado(estadoEncontrado.nome);

          // Armazenar a cidade que queremos selecionar após as cidades serem carregadas
          const cidadeAlvo = endereco.cidade;

          // Carregar cidades do estado selecionado
          try {
            const cidadesDoEstado = await getCidadesPorEstadoID(estadoEncontrado.id);

            // Atualizar o estado com as cidades recebidas
            setCidades(cidadesDoEstado);

            // Agora que as cidades foram carregadas, procurar pela cidade correspondente
            if (cidadeAlvo && cidadesDoEstado.length > 0) {
              const cidadeEncontrada = cidadesDoEstado.find(
                (c) => normalizeString(c.nome) === normalizeString(cidadeAlvo)
              );

              if (cidadeEncontrada) {
                setCidadeSelecionada(cidadeEncontrada.id);
                setCidade(cidadeEncontrada.nome);
                console.log('Cidade selecionada:', cidadeEncontrada.nome);
              } else {
                console.log('Cidade não encontrada:', cidadeAlvo);
                console.log(
                  'Cidades disponíveis:',
                  cidadesDoEstado.map((c) => c.nome)
                );
              }
            }
          } catch (cidadeError) {
            console.error('Erro ao carregar cidades:', cidadeError);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      setCepErro('CEP inválido ou não encontrado.');
    } finally {
      setLoadingCep(false);
    }
  }

  // Toggle password visibility
  const toggleSenhaVisibility = () => {
    setShowSenha(!showSenha);
  };

  const toggleConfirmarSenhaVisibility = () => {
    setShowConfirmarSenha(!showConfirmarSenha);
  };

  // Função para salvar as alterações no perfil
  const handleSaveProfile = async () => {
    // Limpar mensagens de erro anteriores
    setNomeErro('');
    setEmailErro('');
    setTelefoneErro('');
    setCpfErro('');
    setCepErro('');
    setEstadoErro('');
    setCidadeErro('');
    setSenhaErro('');
    setConfirmarSenhaErro('');

    let hasError = false;

    // Validar campos obrigatórios
    if (!nome) {
      setNomeErro('O nome é obrigatório.');
      hasError = true;
    }

    if (!email) {
      setEmailErro('O e-mail é obrigatório.');
      hasError = true;
    } else if (!validarEmail(email)) {
      setEmailErro('E-mail inválido.');
      hasError = true;
    }
    // In your handleSaveProfile function, add this validation
    if (!sexoId) {
      setSexoErro('O sexo é obrigatório.');
      hasError = true;
    }
    if (!telefone) {
      setTelefoneErro('O telefone é obrigatório.');
      hasError = true;
    } else if (!validarTelefone(telefone)) {
      setTelefoneErro('Telefone inválido. Informe DDD + número.');
      hasError = true;
    }

    if (!cpfCnpj) {
      setCpfErro('O CPF é obrigatório.');
      hasError = true;
    } else if (!validarCpf(cpfCnpj)) {
      setCpfErro('CPF inválido. Informe um CPF com 11 números.');
      hasError = true;
    }

    if (cep && !validarCep(stripNonNumeric(cep))) {
      setCepErro('CEP inválido. Informe no formato 00000-000.');
      hasError = true;
    }

    // Validar senha apenas se foi preenchida
    if (senha || confirmarSenha) {
      if (senha !== confirmarSenha) {
        setConfirmarSenhaErro('As senhas não conferem.');
        hasError = true;
      } else if (senha && senha.length < 8) {
        setSenhaErro('A senha deve ter pelo menos 8 caracteres.');
        hasError = true;
      }
    }

    if (hasError) {
      Alert.alert('Erro', 'Verifique os campos destacados e tente novamente.');
      return;
    }

    try {
      setLoading(true);

      // Criar objeto com os dados do usuário para atualização
      const userData: UsuarioData = {
        id: usuario?.id,
        nome,
        email,
        telefone: stripNonNumeric(telefone),
        cpf: stripNonNumeric(cpfCnpj),
        cep: stripNonNumeric(cep),
        estado_id: estadoSelecionado,
        cidade_id: cidadeSelecionada,
        sexo_id: sexoId,
        senha: senha || undefined,
        foto: foto ?? null,
      };

      // Validar usuário na API

      const resultado = await updateUsuario(userData);

      if (resultado && resultado.success) {
        Alert.alert('Sucesso', 'Dados salvos com sucesso!');
        // Recarregar dados
        await fetchUserData();
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

  // Helper para encontrar o nome do estado a partir do ID
  const getEstadoNome = (id: number | null) => {
    if (!id) return '';
    const estado = estados.find((e) => e.id === id);
    return estado ? estado.nome : '';
  };

  // Helper para encontrar o nome da cidade a partir do ID
  const getCidadeNome = (id: number | null) => {
    if (!id) return '';
    const cidade = cidades.find((c) => c.id === id);
    return cidade ? cidade.nome : '';
  };

  // Funções de manipulação adaptadas para compatibilidade com os componentes
  const handleEstadoSelect = async (selectedEstado: { id: number; nome: string }) => {
    setEstadoSelecionado(selectedEstado.id);
    setEstado(selectedEstado.nome);
    setCidadeSelecionada(null);
    setCidade('');
    setEstadoErro('');
  };

  const handleCidadeSelect = (selectedCidade: { id: number; nome: string }) => {
    setCidadeSelecionada(selectedCidade.id);
    setCidade(selectedCidade.nome);
    setCidadeErro('');
  };
  const pickImage = async () => {
    try {
      // Solicitar permissão para acessar a galeria
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Precisamos de permissão para acessar suas fotos.');
        return;
      }

      // Abrir a galeria de imagens
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      // Se não cancelou a seleção
      if (!result.canceled) {
        // Atualizar o estado com a URI da imagem selecionada
        setFoto(result.assets[0].uri);
        console.log('Imagem selecionada:', result.assets[0].uri);
        setFotoErro(''); // Limpar qualquer erro anterior
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem. Tente novamente.');
    }
  };
  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground source={require('../../assets/images/backgrounds/Fundo_04.png')} style={styles.backgroundImage}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4682B4" />
              <Text style={styles.loadingText}>Carregando dados...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={initializeData}>
                <Text style={styles.retryButtonText}>Tentar novamente</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.profileContainer}>
              <Text style={styles.pageTitle}>Meus dados</Text>

              <View style={styles.photoContainer}>
                <TouchableOpacity style={styles.photoUploadButton} onPress={pickImage}>
                  {foto || usuario?.foto ? (
                    <Image source={{ uri: foto || usuario?.foto }} style={styles.profilePhoto} />
                  ) : (
                    <View style={styles.photoPlaceholder}>
                      <Text style={styles.uploadText}>Selecionar foto</Text>
                    </View>
                  )}
                </TouchableOpacity>
                {fotoErro ? <Text style={styles.errorText}>{fotoErro}</Text> : null}
                <Text style={styles.infoText}>Clique para selecionar uma foto</Text>
              </View>

              {/* Campos do formulário */}
              <View style={styles.formContainer}>
                <Text style={styles.inputLabel}>Nome</Text>
                <View style={[styles.inputContainer, nomeErro ? styles.inputError : null]}>
                  <TextInput style={styles.input} placeholder="Nome" value={nome} onChangeText={handleNomeChange} />
                </View>
                {nomeErro ? <Text style={styles.errorText}>{nomeErro}</Text> : null}

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    Sexo <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={[styles.checkboxContainer, sexoErro ? {} : {}]}>
                    {(sexos || []).map((item, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.checkboxWrapper}
                        onPress={() => {
                          setSexoId(item.id);
                          setSexoErro('');
                          console.log('Sexo', item);
                        }}
                      >
                        <View style={styles.checkboxCustom}>
                          {sexoId === item.id && <View style={styles.checkboxInner} />}
                        </View>
                        <Text style={styles.checkboxLabel}>{item.descricao}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {sexoErro ? <Text style={styles.errorText}>{sexoErro}</Text> : null}
                </View>

                <Text style={styles.inputLabel}>E-mail</Text>
                <View style={[styles.inputContainer, emailErro ? styles.inputError : null]}>
                  <TextInput
                    style={styles.input}
                    placeholder="E-mail"
                    value={email}
                    onChangeText={handleEmailChange}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                {emailErro ? <Text style={styles.errorText}>{emailErro}</Text> : null}

                <Text style={styles.inputLabel}>Telefone</Text>
                <View style={[styles.inputContainer, telefoneErro ? styles.inputError : null]}>
                  <TextInput
                    style={styles.input}
                    placeholder="(00) 00000-0000"
                    value={telefone}
                    onChangeText={handleTelefoneChange}
                    keyboardType="phone-pad"
                  />
                </View>
                {telefoneErro ? <Text style={styles.errorText}>{telefoneErro}</Text> : null}

                <Text style={styles.inputLabel}>CPF</Text>
                <View style={[styles.inputContainer, cpfErro ? styles.inputError : null]}>
                  <TextInput
                    style={styles.input}
                    placeholder="000.000.000-00"
                    value={cpfCnpj}
                    onChangeText={handleCpfChange}
                    keyboardType="numeric"
                  />
                </View>
                {cpfErro ? <Text style={styles.errorText}>{cpfErro}</Text> : null}

                <Text style={styles.inputLabel}>CEP</Text>
                <View style={[styles.inputContainer, cepErro ? styles.inputError : null]}>
                  <TextInput
                    style={styles.input}
                    placeholder="00000-000"
                    value={cep}
                    onChangeText={handleCepChange}
                    keyboardType="numeric"
                  />
                  {loadingCep && <ActivityIndicator size="small" color="#4682B4" style={styles.loadingIcon} />}
                </View>
                {cepErro ? <Text style={styles.errorText}>{cepErro}</Text> : null}

                <Text style={styles.inputLabel}>Estado</Text>
                <EstadoSelect
                  estado={estados.find((estado) => estado.id === estadoSelecionado) || null}
                  estados={estados}
                  onSelectEstado={handleEstadoSelect}
                  showEstados={false} // esta prop está definida mas não é usada
                  setShowEstados={() => {}} // esta prop está definida mas não é usada
                  estadoSearch={{ id: -1, nome: '' }} // ou seu estado real de busca
                  setEstadoSearch={() => {}} // ou sua função real de setter
                />
                {estadoErro ? <Text style={styles.errorText}>{estadoErro}</Text> : null}

                <Text style={styles.inputLabel}>Cidade</Text>
                <CidadeSelect
                  cidade={cidades.find((cidade) => cidade.id === cidadeSelecionada) || null}
                  cidades={cidades}
                  cidadesCarregadas={true} // ou seu estado real de carregamento
                  loadingCidades={false} // ou seu estado real de carregamento
                  showCidades={false} // esta prop está definida mas não é usada no componente
                  setShowCidades={() => {}} // esta prop está definida mas não é usada no componente
                  onSelectCidade={handleCidadeSelect}
                  toggleCidades={() => {}} // esta prop está definida mas não é usada no componente
                  disabled={!estadoSelecionado}
                />

                <Text style={styles.inputLabel}>Senha</Text>
                <View style={[styles.inputContainer, senhaErro ? styles.inputError : null]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Senha"
                    value={senha}
                    onChangeText={setSenha}
                    secureTextEntry={!showSenha}
                  />
                  <TouchableOpacity onPress={toggleSenhaVisibility}>
                    <Feather name={showSenha ? 'eye-off' : 'eye'} size={20} color="#888" />
                  </TouchableOpacity>
                </View>
                {senhaErro ? <Text style={styles.errorText}>{senhaErro}</Text> : null}

                <Text style={styles.inputLabel}>Confirmar Senha</Text>
                <View style={[styles.inputContainer, confirmarSenhaErro ? styles.inputError : null]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Confirmar Senha"
                    value={confirmarSenha}
                    onChangeText={setConfirmarSenha}
                    secureTextEntry={!showConfirmarSenha}
                  />
                  <TouchableOpacity onPress={toggleConfirmarSenhaVisibility}>
                    <Feather name={showConfirmarSenha ? 'eye-off' : 'eye'} size={20} color="#888" />
                  </TouchableOpacity>
                </View>
                {confirmarSenhaErro ? <Text style={styles.errorText}>{confirmarSenhaErro}</Text> : null}

                <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
                  <Text style={styles.saveButtonText}>Salvar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Barra de navegação inferior */}
        <View style={styles.bottomNavigation}>
          <TouchableOpacity style={styles.navItem} onPress={() => router.push('/pages/PetDonation')}>
            <Image source={require('../../assets/images/Icone/adoption-icon.png')} style={styles.navIcon} />
            <Text style={styles.navText}>Adoção</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => router.push('/pages/PetAdoptionScreen')}>
            <Image source={require('../../assets/images/Icone/donation-icon.png')} style={styles.navIcon} />
            <Text style={styles.navText}>Pets</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem}>
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
  inputError: {
    borderColor: 'red',
    borderWidth: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '600',
    color: '#000000FF',
  },
  required: {
    color: 'red',
  },
  checkboxContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  checkboxWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    marginBottom: 10,
  },
  checkboxCustom: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#000000FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkboxInner: {
    height: 12,
    width: 12,
    borderRadius: 6,
    backgroundColor: '#000000FF',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginTop: 5,
  },
  loadingIcon: {
    marginLeft: 10,
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
  photoUploadButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    color: '#888',
    textAlign: 'center',
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
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
