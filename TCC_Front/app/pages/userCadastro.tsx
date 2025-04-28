import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { getEstados, getCidadesPorEstado, getSexoUsuario, createUsuario, validarUsuario } from '../../services/api';
import EstadoSelect from '../../components/estados/EstadoSelect';
import CidadeSelect from '../../components/cidades/CidadeSelect';
import { debounce } from 'lodash';
import { useNavigation } from '@react-navigation/native';

// You'd need to import an icon library like react-native-vector-icons
// For example purposes, let's assume we have an Eye and EyeOff icons
import Feather from 'react-native-vector-icons/Feather';
import { Redirect, router } from 'expo-router';

// Define the cidade type to ensure consistency throughout the component
type CidadeType = {
  nome: string;
  id: number;
};

// Helper functions defined at the top to avoid "used before declaration" error

// Formatting functions for inputs
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

export default function CadastroUsuario() {
  const [sexo, setSexo] = useState<{ id: number; descricao: string }>({ id: 0, descricao: '' });
  const [sexos, setSexos] = useState<{ id: number; descricao: string }[]>([]);
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [estado, setEstado] = useState<{ id: number; nome: string } | null>(null);
  const [estados, setEstados] = useState<{ id: number; nome: string }[]>([]);
  const [estadoSearch, setEstadoSearch] = useState<{ id: number; nome: string }>({ id: 0, nome: '' });
  const [cidade, setCidade] = useState<{ id: number; nome: string }>({ id: 0, nome: '' });
  const [cidadeSearch, setCidadeSearch] = useState<{ id: number; nome: string }>({ id: 0, nome: '' });
  const [cidades, setCidades] = useState<{ id: number; nome: string }[]>([]);
  const [cidadesFiltradas, setCidadesFiltradas] = useState<CidadeType[]>([]);
  const [showEstados, setShowEstados] = useState<boolean>(false);
  const [showCidades, setShowCidades] = useState<boolean>(false);
  const [loadingCidades, setLoadingCidades] = useState<boolean>(false);
  const [cidadesCarregadas, setCidadesCarregadas] = useState<boolean>(false);
  const [senha, setSenha] = useState<string>('');
  const [confirmarSenha, setConfirmarSenha] = useState<string>('');
  const [nomeErro, setNomeErro] = useState('');
  const [cpfErro, setCpfErro] = useState('');
  const [telefoneErro, setTelefoneErro] = useState('');
  const [estadoErro, setEstadoErro] = useState('');
  const [cidadeErro, setCidadeErro] = useState('');
  const [sexoErro, setSexoErro] = useState('');
  const [senhaErro, setSenhaErro] = useState('');
  const [confirmarSenhaErro, setConfirmarSenhaErro] = useState('');
  const [email, setEmail] = useState('');
  const [emailErro, setEmailErro] = useState('');
  const [cep, setCep] = useState('');
  const [cepErro, setCepErro] = useState('');
  const [showSenha, setShowSenha] = useState<boolean>(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState<boolean>(false);
  const [loadingCep, setLoadingCep] = useState<boolean>(false);

  // Cache para armazenar cidades por estado - updated with correct type
  const cidadesCache = useRef<{ [key: string]: CidadeType[] }>({});
  const navigation = useNavigation<any>();
  // Função para carregar cidades com cache
  const carregarCidades = async (selectedEstado: string | null) => {
    if (!selectedEstado) return [] as CidadeType[];

    // Verifica se já existe no cache
    if (cidadesCache.current[selectedEstado]) {
      setCidadesCarregadas(true);
      return cidadesCache.current[selectedEstado];
    }

    setLoadingCidades(true);
    try {
      const cidadesData = await getCidadesPorEstado(selectedEstado);

      // Convert data to ensure it has the correct format
      const cidadesWithId: CidadeType[] = (cidadesData || []).map((cidade: any) => {
        // If cidade already has an id property, use it
        // Otherwise generate a temporary id (this should be fixed in the API)
        if (cidade.id !== undefined) {
          return cidade as CidadeType;
        } else {
          return {
            nome: cidade.nome,
            id: Math.floor(Math.random() * 100000), // Temporary ID for type safety
          };
        }
      });

      // Salva no cache
      cidadesCache.current[selectedEstado] = cidadesWithId;
      setCidadesCarregadas(true);
      return cidadesWithId;
    } catch (error) {
      console.error('Erro ao carregar as cidades:', error);
      return [] as CidadeType[];
    } finally {
      setLoadingCidades(false);
    }
  };

  const handleEstadoChange = async (selectedEstado: { id: number; nome: string }) => {
    setEstado(selectedEstado);
    setShowEstados(false);
    setCidade({ id: 0, nome: '' });
    setCidadesCarregadas(false);
    setLoadingCidades(true);

    try {
      const cidadesData = await carregarCidades(selectedEstado.nome);
      setCidades(cidadesData);
      setCidadesFiltradas(cidadesData);
      return cidadesData; // <-- retorna as cidades carregadas
    } catch (error) {
      console.error('Erro ao carregar cidades:', error);
      setCidades([]);
      setCidadesFiltradas([]);
      return []; // <-- retorna vazio em erro
    } finally {
      setLoadingCidades(false);
    }
  };

  const handleCidadeSelect = (selectedCidade: CidadeType) => {
    console.log('selectedCidade', selectedCidade);
    if (selectedCidade.id && selectedCidade.nome) {
      setCidade(selectedCidade);
    }
    setShowCidades(false);
  };

  const toggleEstados = async () => {
    if (!showEstados && estados.length === 0) {
      try {
        const estadosData = await getEstados();
        setEstados(estadosData || []);
      } catch (error) {
        console.error('Erro ao carregar os estados:', error);
        setEstados([]);
      }
    }
    setShowEstados(!showEstados);
    if (showEstados) setEstadoSearch({ id: 0, nome: '' });
  };

  const toggleCidades = async () => {
    if (!estado) return;

    // Se ainda não temos cidades, carregamos elas
    if (cidades.length === 0) {
      if (!loadingCidades) {
        const cidadesData = await carregarCidades(estado.nome);
        setCidades(cidadesData);
        setCidadesFiltradas(cidadesData);
      }
    }

    setShowCidades(!showCidades);
    if (!showCidades) setCidadeSearch({ id: 0, nome: '' });
  };

  // Filtragem de cidades com debounce para melhor performance
  const debouncedCidadeSearch = useCallback(
    debounce((text: string) => {
      const normalize = (str: string) =>
        str
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase();

      if (!text.trim()) {
        setCidadesFiltradas(cidades);
        return;
      }

      const filtered = cidades.filter((item) => item && item.nome && normalize(item.nome).includes(normalize(text)));

      setCidadesFiltradas(filtered);
    }, 300),
    [cidades]
  );

  const validarEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const validarCpf = (cpf: string) => {
    const regex = /^\d{11}$/;
    return regex.test(stripNonNumeric(cpf));
  };

  const validarTelefone = (telefone: string) => {
    const somenteNumeros = stripNonNumeric(telefone);
    return somenteNumeros.length >= 10;
  };

  const validarCep = (cep: string) => {
    const regex = /^\d{8}$/;
    return regex.test(stripNonNumeric(cep));
  };

  const handleSalvar = async () => {
    // Limpar mensagens anteriores
    setNomeErro('');
    setCpfErro('');
    setTelefoneErro('');
    setEstadoErro('');
    setCidadeErro('');
    setSexoErro('');
    setSenhaErro('');
    setConfirmarSenhaErro('');
    setEmailErro('');
    setCepErro('');

    let hasError = false;

    // Validações locais
    if (!nome) {
      setNomeErro('O nome é obrigatório.');
      hasError = true;
    }
    if (!cpf) {
      setCpfErro('O CPF é obrigatório.');
      hasError = true;
    } else if (!validarCpf(cpf)) {
      setCpfErro('CPF inválido. Informe um CPF com 11 números.');
      hasError = true;
    }
    if (!telefone) {
      setTelefoneErro('O telefone é obrigatório.');
      hasError = true;
    } else if (!validarTelefone(telefone)) {
      setTelefoneErro('Telefone inválido. Informe DDD + número.');
      hasError = true;
    }
    if (!estado) {
      setEstadoErro('O estado é obrigatório.');
      hasError = true;
    }
    if (!cidade) {
      setCidadeErro('A cidade é obrigatória.');
      hasError = true;
    }
    if (!sexo) {
      setSexoErro('O sexo é obrigatório.');
      hasError = true;
    }
    if (!email) {
      setEmailErro('O e-mail é obrigatório.');
      hasError = true;
    } else if (!validarEmail(email)) {
      setEmailErro('E-mail inválido.');
      hasError = true;
    }
    if (cep && !validarCep(cep)) {
      setCepErro('CEP inválido. Informe no formato 00000-000.');
      hasError = true;
    }
    if (!senha) {
      setSenhaErro('A senha é obrigatória.');
      hasError = true;
    } else if (senha.length < 8) {
      setSenhaErro('A senha deve ter pelo menos 8 caracteres.');
      hasError = true;
    }
    if (!confirmarSenha) {
      setConfirmarSenhaErro('Confirme a sua senha.');
      hasError = true;
    } else if (senha !== confirmarSenha) {
      setConfirmarSenhaErro('As senhas não coincidem.');
      hasError = true;
    }

    if (hasError) {
      return;
    }

    // Modify the validarUsuario function call and response handling
    try {
      // Primeira etapa: validar se usuário já existe
      const validationResponse = await validarUsuario({
        nome,
        sexo_id: sexo.id,
        telefone: stripNonNumeric(telefone),
        email,
        senha,
        cpf: stripNonNumeric(cpf),
        cidade_id: cidade.id,
        cep: stripNonNumeric(cep),
      });

      // Check if the response indicates user exists
      if (validationResponse && 'exists' in validationResponse && validationResponse.exists) {
        Alert.alert('Usuário Existente', 'Usuário já existe com este CPF ou e-mail.');
        return;
      }

      // Segunda etapa: criar o novo usuário com os IDs corretos
      const usuario = {
        nome,
        cpf: stripNonNumeric(cpf),
        telefone: stripNonNumeric(telefone),
        cidade_id: cidade.id,
        sexo_id: sexo.id,
        email,
        senha,
        cep: stripNonNumeric(cep),
      };

      const response = await createUsuario(usuario);

      Alert.alert('Sucesso', 'Usuário cadastrado com sucesso!', [
        {
          text: 'OK',
          onPress: () => {
            // Quando o usuário apertar OK no alerta, volta para a tela de login
            router.push('/pages/login')
          },
        },
      ]);
      console.log('Usuário cadastrado com sucesso:', response);
    } catch (error: any) {
      console.error('Erro no cadastro:', error);

      if (error?.response?.data) {
        const serverError = error.response.data;

        // Trata especificamente erro de senha
        if (serverError.error?.toLowerCase().includes('senha')) {
          setSenhaErro(serverError.message || 'Senha inválida.');
        }
        // Aqui você pode adicionar mais campos (se quiser)
        else {
          // Se não for senha, pode exibir um alerta genérico
          Alert.alert('Erro', serverError.message || 'Erro inesperado.');
        }
      } else {
        Alert.alert('Erro', 'Erro inesperado. Tente novamente.');
      }
    }
  };

  // Handles for formatted inputs
  const handleCpfChange = (text: string) => {
    const formattedCpf = formatCPF(text);
    setCpf(formattedCpf);
    if (text) setCpfErro('');
  };

  const handleTelefoneChange = (text: string) => {
    const formattedTelefone = formatTelefone(text);
    setTelefone(formattedTelefone);
    if (text) setTelefoneErro('');
  };

  // Handler for CEP with address lookups
  const handleCepChange = (text: string) => {
    const formattedCep = formatCEP(text);
    setCep(formattedCep);

    if (text) setCepErro('');

    const numericCep = stripNonNumeric(text);

    if (numericCep.length === 8) {
      handleBuscarCep(numericCep);
    }
  };

  type Estados = {
    AC: string;
    AL: string;
    AP: string;
    AM: string;
    BA: string;
    CE: string;
    DF: string;
    ES: string;
    GO: string;
    MA: string;
    MT: string;
    MS: string;
    MG: string;
    PA: string;
    PB: string;
    PR: string;
    PE: string;
    PI: string;
    RJ: string;
    RN: string;
    RS: string;
    RO: string;
    RR: string;
    SC: string;
    SP: string;
    SE: string;
    TO: string;
  };

  // Definir o tipo das siglas para garantir que as chaves sejam apenas as siglas dos estados
  const estadosSiglaParaNome: { [key in keyof Estados]: string } = {
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

  // Função para buscar o nome completo do estado usando o CEP
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

      // Aqui é a novidade:
      const estadoNome = estadosSiglaParaNome[data.uf as keyof typeof estadosSiglaParaNome];

      return {
        cep: data.cep,
        logradouro: data.logradouro,
        bairro: data.bairro,
        cidade: data.localidade,
        estado: estadoNome, // agora vem o nome completo do estado!
      };
    } catch (error) {
      console.error('Erro ao buscar endereço:', error);
      throw error;
    }
  }
  async function handleBuscarCep(numericCep?: string) {
    try {
      setLoadingCep(true);

      const endereco = await lookupCepAddress(numericCep ?? cep);

      if (!endereco || !endereco.estado || !endereco.cidade) {
        setCepErro('CEP não encontrado ou inválido.');
        return;
      }

      let cidadesDoEstado: CidadeType[] = [];

      if (endereco.estado) {
        const estadoEncontrado = estados.find((e) => e.nome === endereco.estado);
        if (estadoEncontrado) {
          cidadesDoEstado = await handleEstadoChange(estadoEncontrado); // Agora você recebe as cidades carregadas
          setEstadoSearch(estadoEncontrado);
        }
      }

      if (endereco.cidade && cidadesDoEstado.length > 0) {
        const cidadeEncontrada = cidadesDoEstado.find(
          (c) => normalizeString(c.nome) === normalizeString(endereco.cidade)
        );
        if (cidadeEncontrada) {
          handleCidadeSelect(cidadeEncontrada);
        } else {
          console.warn('Cidade não encontrada na lista:', endereco.cidade);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      setCepErro('CEP inválido ou não encontrado.');
    } finally {
      setLoadingCep(false);
    }
  }

  function normalizeString(str: string): string {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .toLowerCase() // Converte para minúsculo
      .trim(); // Remove espaços extras
  }
  // Atualiza a busca de cidades
  const handleCidadeSearchChange = (text: { id: number; nome: string }) => {
    setCidadeSearch(text);
    debouncedCidadeSearch(text.nome);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sexosData = await getSexoUsuario();
        console.log('sexosData:', sexosData);

        setSexos(sexosData || []);

        const estadosData = await getEstados();
        //console.log('estadosData:', estadosData);
        setEstados(estadosData || []);
      } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error);
      }
    };
    fetchData();
  }, []);

  const filterEstados = (item: string) => {
    if (!item) return false;
    const normalize = (text: string) =>
      text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

    return normalize(item).includes(normalize(estadoSearch.nome));
  };

  // Toggle password visibility
  const toggleSenhaVisibility = () => {
    setShowSenha(!showSenha);
  };

  const toggleConfirmarSenhaVisibility = () => {
    setShowConfirmarSenha(!showConfirmarSenha);
  };

  return (
    <ImageBackground source={require('../../assets/images/backgrounds/Fundo_01.png')} style={styles.backgroundImage}>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.mainContent}>
            <View style={styles.titleContainer}>
              <Text style={styles.pageTitle}>Dados Pessoais</Text>
            </View>
          </View>

          <View style={styles.formContainer}>
            {/* Nome */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Nome <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, nomeErro ? { borderColor: 'red', borderWidth: 1 } : {}]}
                placeholder="Nome"
                value={nome}
                onChangeText={(text) => {
                  setNome(text);
                  if (text) setNomeErro('');
                }}
              />
              {nomeErro ? <Text style={styles.errorText}>{nomeErro}</Text> : null}
            </View>

            {/* Sexo */}
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
                      setSexo(item);
                      setSexoErro('');
                      console.log('Sexo', item);
                    }}
                  >
                    <View style={styles.checkboxCustom}>{sexo === item && <View style={styles.checkboxInner} />}</View>
                    <Text style={styles.checkboxLabel}>{item.descricao}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {sexoErro ? <Text style={styles.errorText}>{sexoErro}</Text> : null}
            </View>
            {/* E-mail */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                E-mail <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, emailErro ? { borderColor: 'red', borderWidth: 1 } : {}]}
                placeholder="E-mail"
                keyboardType="email-address"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (text) setEmailErro('');
                }}
              />
              {emailErro ? <Text style={styles.errorText}>{emailErro}</Text> : null}
            </View>

            {/* Telefone */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Telefone <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, telefoneErro ? { borderColor: 'red', borderWidth: 1 } : {}]}
                placeholder="(00) 00000-0000"
                keyboardType="phone-pad"
                value={telefone}
                onChangeText={handleTelefoneChange}
                maxLength={15} // (00) 00000-0000 has 15 characters with formatting
              />
              {telefoneErro ? <Text style={styles.errorText}>{telefoneErro}</Text> : null}
            </View>

            {/* CPF/CNPJ */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                CPF <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, cpfErro ? { borderColor: 'red', borderWidth: 1 } : {}]}
                placeholder="000.000.000-00"
                keyboardType="numeric"
                value={cpf}
                onChangeText={handleCpfChange}
                maxLength={14} // 000.000.000-00 has 14 characters with formatting
              />
              {cpfErro ? <Text style={styles.errorText}>{cpfErro}</Text> : null}
            </View>

            {/* CEP */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>CEP</Text>
              <View style={[styles.inputWithIcon, cepErro ? { borderColor: 'red', borderWidth: 1 } : {}]}>
                <TextInput
                  placeholder="00000-000"
                  keyboardType="numeric"
                  value={cep}
                  onChangeText={handleCepChange}
                  maxLength={9} // 00000-000 has 9 characters with formatting
                />
                {loadingCep && <ActivityIndicator size="small" color="#0000ff" style={styles.inputIcon} />}
              </View>
              {cepErro ? <Text style={styles.errorText}>{cepErro}</Text> : null}
            </View>

            {/* Estado */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Estado <Text style={styles.required}>*</Text>
              </Text>

              <EstadoSelect
                estado={estado}
                estados={estados}
                onSelectEstado={async (estadoSelecionado) => {
                  handleEstadoChange(estadoSelecionado);
                  setEstadoErro('');
                }}
                showEstados={showEstados}
                setShowEstados={setShowEstados}
                estadoSearch={estadoSearch}
                setEstadoSearch={setEstadoSearch}
              />

              {estadoErro ? <Text style={styles.errorText}>{estadoErro}</Text> : null}
            </View>

            {/* Cidade */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Cidade <Text style={styles.required}>*</Text>
              </Text>
              <View style={cidadeErro ? {} : {}}>
                <CidadeSelect
                  cidade={cidade}
                  cidades={cidades}
                  cidadesCarregadas={cidadesCarregadas}
                  loadingCidades={loadingCidades}
                  showCidades={showCidades}
                  setShowCidades={setShowCidades}
                  onSelectCidade={(cidadeSelecionada) => {
                    handleCidadeSelect(cidadeSelecionada);
                    setCidadeErro('');
                  }}
                  toggleCidades={toggleCidades}
                  disabled={!estado}
                />
              </View>
              {cidadeErro ? <Text style={styles.errorText}>{cidadeErro}</Text> : null}
            </View>

            {/* Senha with visibility toggle */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Senha <Text style={styles.required}>*</Text>
              </Text>
              <View style={[styles.inputWithIcon, senhaErro ? { borderColor: 'red', borderWidth: 1 } : {}]}>
                <TextInput
                  style={{ flex: 1 }}
                  placeholder="Senha"
                  secureTextEntry={!showSenha}
                  value={senha}
                  onChangeText={(text) => {
                    setSenha(text);
                    if (text) setSenhaErro('');
                  }}
                />
                <TouchableOpacity onPress={toggleSenhaVisibility} style={styles.inputIcon}>
                  {showSenha ? (
                    <Feather name="eye-off" size={20} color="#333" />
                  ) : (
                    <Feather name="eye" size={20} color="#333" />
                  )}
                </TouchableOpacity>
              </View>
              {senhaErro ? <Text style={styles.errorText}>{senhaErro}</Text> : null}
            </View>

            {/* Confirmar Senha with visibility toggle */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Confirmar Senha <Text style={styles.required}>*</Text>
              </Text>
              <View style={[styles.inputWithIcon, confirmarSenhaErro ? { borderColor: 'red', borderWidth: 1 } : {}]}>
                <TextInput
                  style={{ flex: 1 }}
                  placeholder="Confirmar Senha"
                  secureTextEntry={!showConfirmarSenha}
                  value={confirmarSenha}
                  onChangeText={(text) => {
                    setConfirmarSenha(text);
                    if (text) setConfirmarSenhaErro('');
                  }}
                />
                <TouchableOpacity onPress={toggleConfirmarSenhaVisibility} style={styles.inputIcon}>
                  {showConfirmarSenha ? (
                    <Feather name="eye-off" size={20} color="#333" />
                  ) : (
                    <Feather name="eye" size={20} color="#333" />
                  )}
                </TouchableOpacity>
              </View>
              {confirmarSenhaErro ? <Text style={styles.errorText}>{confirmarSenhaErro}</Text> : null}
            </View>

            {/* Botão de salvar */}
            <TouchableOpacity style={styles.saveButton} onPress={handleSalvar}>
              <Text style={styles.saveButtonText}>Cadastrar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#4CAF50', // Cor do botão
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  inputIcon: {
    padding: 8,
  },

  inputWithButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    width: '100%',
  },
  mainContent: {
    marginBottom: 20,
  },
  titleContainer: {
    marginBottom: 10,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  formContainer: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#333',
  },
  required: {
    color: 'red',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    paddingLeft: 10,
    borderRadius: 5,
    marginTop: 5,
    backgroundColor: '#fff',
  },
  checkboxContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  checkboxWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 10,
  },
  checkboxCustom: {
    width: 20,
    height: 20,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxInner: {
    width: 10,
    height: 10,
    backgroundColor: '#333',
    borderRadius: 2,
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#333',
  },
  dropdown: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    flexDirection: 'row',
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  dropdownText: {
    fontSize: 14,
    color: '#333',
  },
  dropdownIcon: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginTop: 5,
    maxHeight: 200,
  },
  dropdownItem: {
    padding: 10,
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#333',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 2,
    marginLeft: 10,
  },
  searchInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 5,
    paddingLeft: 10,
  },
  dropdownDisabled: {
    backgroundColor: '#eee',
    borderColor: '#aaa',
  },
});
