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
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import EstadoSelect from '../../components/estados/EstadoSelect';
import CidadeSelect from '../../components/cidades/CidadeSelect';
import { debounce } from 'lodash';
import { useNavigation } from '@react-navigation/native';
import getEstados from '../../services/api/Estados/getEstados';
import getCidadesPorEstado from '@/services/api/Cidades/getCidadesPorEstado';
import getSexoUsuario from '@/services/api/Sexo/getSexoUsuario';
import createUsuario from '@/services/api/Usuario/createUsuario';
import checkDuplicateFields from '@/services/api/Usuario/checkDuplicateFields';
import Feather from 'react-native-vector-icons/Feather';
import { Redirect, router } from 'expo-router';
import { cpf as cpfValidator } from 'cpf-cnpj-validator';
import validator from 'validator';

// Define the cidade type to ensure consistency throughout the component
type CidadeType = {
  nome: string;
  id: number;
};

// NOVA INTERFACE: Para armazenar dados do CEP
interface CEPData {
  estadoId: number | null;
  cidadeId: number | null;
  estadoNome: string;
  cidadeNome: string;
}

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

// FUNÇÃO ATUALIZADA: Validação granular de email usando validator
const validarEmail = (email: string): { isValid: boolean; errors: string[] } => {
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

  // Verificações específicas de domínio
  if (email.includes('@')) {
    const [localPart, domain] = email.split('@');

    // Verificar parte local
    if (localPart.length > 64) {
      errors.push('Parte local do e-mail é muito longa (máximo 64 caracteres)');
    }

    // Verificar domínio usando validator
    if (domain.length > 253) {
      errors.push('Domínio do e-mail é muito longo (máximo 253 caracteres)');
    }

    // Verificar se não tem partes vazias no domínio
    const domainParts = domain.split('.');
    if (domainParts.some((part) => part.length === 0)) {
      errors.push('Domínio não pode ter partes vazias');
    }

    // Verificar TLD
    const tld = domainParts[domainParts.length - 1];
    if (tld && tld.length < 2) {
      errors.push('Extensão do domínio deve ter pelo menos 2 caracteres');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// FUNÇÃO EXISTENTE: Validação granular de senha
const validarSenha = (senha: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!senha) {
    errors.push('A senha é obrigatória');
    return { isValid: false, errors };
  }

  // Verificar se a senha tem pelo menos 8 caracteres
  if (senha.length < 8) {
    errors.push('A senha deve ter pelo menos 8 caracteres');
  }

  // Verificar se tem pelo menos uma letra minúscula
  if (!/[a-z]/.test(senha)) {
    errors.push('A senha deve possuir letras minúsculas');
  }

  // Verificar se tem pelo menos uma letra maiúscula
  if (!/[A-Z]/.test(senha)) {
    errors.push('A senha deve possuir letras maiúsculas');
  }

  // Verificar se tem pelo menos um caractere especial
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(senha)) {
    errors.push('A senha deve possuir caracteres especiais');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Function to normalize strings for case-insensitive comparisons
const normalizeString = (str: string): string => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .toLowerCase() // Convert to lowercase
    .trim(); // Remove extra spaces
};

export default function CadastroUsuario() {
  const [foto, setFoto] = useState<string | null>(null);
  const [fotoErro, setFotoErro] = useState('');
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
  const [cidades, setCidades] = useState<CidadeType[]>([]);
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

  // ✅ ESTADO PARA CONTROLAR BUSCA AUTOMÁTICA
  const [buscandoAutomaticamente, setBuscandoAutomaticamente] = useState<boolean>(false);

  // NOVOS ESTADOS: Para erros granulares de senha
  const [senhaErros, setSenhaErros] = useState<string[]>([]);
  const [confirmarSenhaErro, setConfirmarSenhaErro] = useState('');

  const [email, setEmail] = useState('');
  // NOVO ESTADO: Para erros granulares de email
  const [emailErros, setEmailErros] = useState<string[]>([]);
  const [cep, setCep] = useState('');
  const [cepErro, setCepErro] = useState('');
  const [showSenha, setShowSenha] = useState<boolean>(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState<boolean>(false);
  const [loadingCep, setLoadingCep] = useState<boolean>(false);

  // NOVO ESTADO: Para controlar o loading do cadastro
  const [loadingCadastro, setLoadingCadastro] = useState<boolean>(false);

  // NOVO ESTADO: Para rastrear dados preenchidos pelo CEP
  const [dadosDoCep, setDadosDoCep] = useState<CEPData>({
    estadoId: null,
    cidadeId: null,
    estadoNome: '',
    cidadeNome: '',
  });

  // Cache para armazenar cidades por estado - updated with correct type
  const cidadesCache = useRef<{ [key: string]: CidadeType[] }>({});
  const navigation = useNavigation<any>();

  // ✅ FUNÇÃO CORRIGIDA: Verificar se deve limpar o CEP com lógica inteligente
  const verificarELimparCep = (novoEstadoId: number | null, novaCidadeId: number | null) => {
    // ✅ NOVA CONDIÇÃO: Se está buscando automaticamente, NÃO limpar
    if (buscandoAutomaticamente) {
      return;
    }

    // Se não há CEP preenchido, não fazer nada
    if (!cep.trim()) {
      return;
    }

    // Só limpar se CEP foi preenchido automaticamente E foi alterado manualmente depois
    if (dadosDoCep.estadoId && dadosDoCep.cidadeId) {
      const estadoDiferente = novoEstadoId && novoEstadoId !== dadosDoCep.estadoId;
      const cidadeDiferente = novaCidadeId && novaCidadeId !== dadosDoCep.cidadeId;

      if (estadoDiferente || cidadeDiferente) {
        setCep('');
        setCepErro('');
        setDadosDoCep({
          estadoId: null,
          cidadeId: null,
          estadoNome: '',
          cidadeNome: '',
        });
      }
    }
  };

  // 🆕 FUNÇÃO ATUALIZADA: Voltar ao login com verificação de loading
  const handleVoltarLogin = () => {
    if (loadingCadastro) {
      Alert.alert('Aguarde', 'O cadastro está sendo processado. Aguarde a conclusão.');
      return;
    }
    router.push('/pages/LoginScreen');
  };

  // 🆕 FUNÇÃO ATUALIZADA: Selecionar imagem com verificação de loading
  const pickImage = async () => {
    if (loadingCadastro) {
      return; // Não permite seleção durante loading
    }

    try {
      // Solicitar permissão para acessar a galeria
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Precisamos de permissão para acessar suas fotos.');
        return;
      }

      // Versão simplificada que funciona nas diferentes versões do expo-image-picker
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      // Se não cancelou a seleção
      if (!result.canceled) {
        // Atualizar o estado com a URI da imagem selecionada
        setFoto(result.assets[0].uri);
        setFotoErro('');
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível selecionar a imagem. Tente novamente.');
    }
  };

  // Função para carregar cidades com cache - CORRIGIDA
  const carregarCidades = async (selectedEstado: string | null): Promise<CidadeType[]> => {
    if (!selectedEstado) return [];

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
      return [];
    } finally {
      setLoadingCidades(false);
    }
  };

  // FUNÇÃO ATUALIZADA: Manipular seleção de estado com validação de CEP - CORRIGIDA
  const handleEstadoChange = async (selectedEstado: { id: number; nome: string }): Promise<CidadeType[]> => {
    if (loadingCadastro) return []; // 🆕 Bloquear durante loading

    // Verificar se deve limpar o CEP antes de alterar
    verificarELimparCep(selectedEstado.id, cidade.id || null);

    setEstado(selectedEstado);
    setShowEstados(false);
    setCidade({ id: 0, nome: '' });
    setCidadesCarregadas(false);
    setLoadingCidades(true);

    try {
      const cidadesData = await carregarCidades(selectedEstado.nome);
      setCidades(cidadesData);
      setCidadesFiltradas(cidadesData);
      return cidadesData;
    } catch (error) {
      const emptyArray: CidadeType[] = [];
      setCidades(emptyArray);
      setCidadesFiltradas(emptyArray);
      return emptyArray;
    } finally {
      setLoadingCidades(false);
    }
  };

  // FUNÇÃO ATUALIZADA: Manipular seleção de cidade com validação de CEP
  const handleCidadeSelect = (selectedCidade: CidadeType) => {
    if (loadingCadastro) return; // 🆕 Bloquear durante loading

    // Verificar se deve limpar o CEP antes de alterar
    verificarELimparCep(estado?.id || null, selectedCidade.id);

    if (selectedCidade.id && selectedCidade.nome) {
      setCidade(selectedCidade);
    }
    setShowCidades(false);
  };

  const toggleCidades = async () => {
    if (loadingCadastro) return; // 🆕 Bloquear durante loading
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

  // No início do arquivo, adicione esta importação

  // Substitua a função validarCpf existente por esta:
  const validarCpf = (cpfValue: string) => {
    // Remove caracteres não numéricos
    const numericValue = stripNonNumeric(cpfValue);

    // Verifica se está vazio
    if (!numericValue) {
      return false;
    }

    // Usa a biblioteca para validação completa (note o uso de cpfValidator em vez de cpf)
    return cpfValidator.isValid(numericValue);
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
    // Evitar múltiplos cliques durante o loading
    if (loadingCadastro) {
      return;
    }

    // Ativar loading
    setLoadingCadastro(true);

    try {
      // Limpar mensagens anteriores
      setFotoErro('');
      setNomeErro('');
      setCpfErro('');
      setTelefoneErro('');
      setEstadoErro('');
      setCidadeErro('');
      setSexoErro('');
      setSenhaErros([]);
      setConfirmarSenhaErro('');
      setEmailErros([]);
      setCepErro('');

      let hasError = false;

      // Validações locais
      if (!foto) {
        setFotoErro('A foto é obrigatória.');
        hasError = true;
      }

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
        setTelefoneErro('Telefone inválido. Informe um número válido.');
        hasError = true;
      }

      // ✅ VALIDAÇÃO DE EMAIL APENAS NO CLIQUE
      if (!email) {
        setEmailErros(['O e-mail é obrigatório']);
        hasError = true;
      } else {
        const validacaoEmail = validarEmail(email);
        if (!validacaoEmail.isValid) {
          setEmailErros(validacaoEmail.errors);
          hasError = true;
        }
      }

      if (!sexo.id) {
        setSexoErro('O sexo é obrigatório.');
        hasError = true;
      }

      if (!estado || !estado.id) {
        setEstadoErro('O estado é obrigatório.');
        hasError = true;
      }

      if (!cidade || !cidade.id) {
        setCidadeErro('A cidade é obrigatória.');
        hasError = true;
      }

      // ✅ VALIDAÇÃO DE SENHA APENAS NO CLIQUE
      if (!senha) {
        setSenhaErros(['A senha é obrigatória']);
        hasError = true;
      } else {
        const validacaoSenha = validarSenha(senha);
        if (!validacaoSenha.isValid) {
          setSenhaErros(validacaoSenha.errors);
          hasError = true;
        }
      }

      if (!confirmarSenha) {
        setConfirmarSenhaErro('A confirmação de senha é obrigatória.');
        hasError = true;
      } else if (senha !== confirmarSenha) {
        setConfirmarSenhaErro('As senhas não conferem.');
        hasError = true;
      }

      if (cep && !validarCep(cep)) {
        setCepErro('CEP inválido. Informe um CEP válido.');
        hasError = true;
      }

      // Se há erros de validação local, interrompe
      if (hasError) {
        return;
      }

      try {
        const validationResponse = await checkDuplicateFields({
          email: email,
          cpf: stripNonNumeric(cpf),
          telefone: stripNonNumeric(telefone),
        });

        // Verificar se há campos duplicados
        if (validationResponse && validationResponse.exists) {
          let validationHasError = false;

          if (validationResponse.duplicateFields?.includes('cpf')) {
            setCpfErro('Este CPF já está cadastrado no sistema.');
            validationHasError = true;
          }

          if (validationResponse.duplicateFields?.includes('email')) {
            setEmailErros(['Este e-mail já está cadastrado no sistema.']);
            validationHasError = true;
          }

          if (validationResponse.duplicateFields?.includes('telefone')) {
            setTelefoneErro('Este telefone já está cadastrado no sistema.');
            validationHasError = true;
          }

          if (validationHasError) {
            return;
          }
        }
      } catch (duplicateError) {
        // Continuar mesmo se a verificação de duplicados falhar
      }

      // ✅ PREPARAR DADOS PARA CADASTRO

      // Preparar a foto para upload
      let fotoFile = null;

      if (foto) {
        const uriParts = foto.split('/');
        const fileName = uriParts[uriParts.length - 1];

        fotoFile = {
          uri: foto,
          name: fileName,
          type: 'image/jpeg',
        } as unknown as File;
      }

      // Dados completos do usuário
      const usuarioData = {
        nome,
        sexo_id: sexo.id,
        telefone: stripNonNumeric(telefone),
        email,
        senha,
        cpf: stripNonNumeric(cpf),
        cidade_id: cidade.id,
        estado_id: estado?.id,
        cep: stripNonNumeric(cep),
        foto: fotoFile,
      };

      // ✅ CHAMAR API DE CRIAÇÃO

      const response = await createUsuario(usuarioData);

      Alert.alert('Sucesso', 'Usuário cadastrado com sucesso!', [
        {
          text: 'OK',
          onPress: () => {
            router.push('/pages/LoginScreen');
          },
        },
      ]);
    } catch (error: any) {
      // Verificar se o erro está na resposta da API ou diretamente no error
      const serverError = error?.response?.data || error;

      if (serverError) {
        // 1. Tratar erro de dados duplicados
        if (
          serverError.error === 'Dados duplicados' ||
          serverError.exists === true ||
          serverError.error?.toLowerCase().includes('duplicado') ||
          serverError.message?.toLowerCase().includes('já cadastrado')
        ) {
          if (serverError.duplicateField || serverError.duplicateFields) {
            const fields = serverError.duplicateFields || [serverError.duplicateField];

            if (fields.includes('cpf')) {
              setCpfErro('Este CPF já está cadastrado no sistema.');
            }
            if (fields.includes('email')) {
              setEmailErros(['Este e-mail já está cadastrado no sistema.']);
            }
            if (fields.includes('telefone')) {
              setTelefoneErro('Este telefone já está cadastrado no sistema.');
            }
          } else {
            const message = serverError.message?.toLowerCase() || '';

            if (message.includes('email') || message.includes('e-mail')) {
              setEmailErros(['Este e-mail já está cadastrado no sistema.']);
            } else if (message.includes('cpf')) {
              setCpfErro('Este CPF já está cadastrado no sistema.');
            } else if (message.includes('telefone')) {
              setTelefoneErro('Este telefone já está cadastrado no sistema.');
            } else {
              Alert.alert(
                'Dados Duplicados',
                serverError.message || 'Email, CPF ou telefone já cadastrado no sistema.'
              );
            }
          }
        }
        // 2. Tratar erro de senha com validação granular
        else if (serverError.error?.toLowerCase().includes('senha') && serverError.passwordErrors) {
          setSenhaErros(serverError.passwordErrors);
        }
        // 3. Tratar erro de email com validação granular
        else if (serverError.error?.toLowerCase().includes('e-mail') && serverError.emailErrors) {
          setEmailErros(serverError.emailErrors);
        }
        // 4. Outros erros
        else {
          Alert.alert('Erro', serverError.message || 'Erro inesperado.');
        }
      } else {
        Alert.alert('Erro', 'Erro inesperado. Tente novamente.');
      }
    } finally {
      // Desativar loading sempre, independente de sucesso ou erro
      setLoadingCadastro(false);
    }
  };

  // 🆕 FUNÇÕES ATUALIZADAS: Handlers com verificação de loading
  const handleCpfChange = (text: string) => {
    if (loadingCadastro) return; // Bloquear durante loading

    const formattedCpf = formatCPF(text);
    setCpf(formattedCpf);

    // Verifica a validade do CPF enquanto o usuário digita
    if (text) {
      if (stripNonNumeric(text).length === 11) {
        if (!validarCpf(text)) {
          setCpfErro('CPF inválido. Verifique os números digitados.');
        } else {
          setCpfErro('');
        }
      } else {
        setCpfErro(''); // Limpa o erro enquanto o usuário está digitando
      }
    }
  };

  const handleTelefoneChange = (text: string) => {
    if (loadingCadastro) return; // Bloquear durante loading

    const formattedTelefone = formatTelefone(text);
    setTelefone(formattedTelefone);
    if (text) setTelefoneErro('');
  };

  // FUNÇÃO ATUALIZADA: Handler para email com validação usando validator
  const handleEmailChange = (text: string) => {
    if (loadingCadastro) return; // Bloquear durante loading

    setEmail(text);

    // ✅ APENAS limpar erros quando usuário digita, SEM validar
    if (text && emailErros.length > 0) {
      setEmailErros([]);
    }
  };

  // FUNÇÃO: Handler para senha com validação granular
  const handleSenhaChange = (text: string) => {
    if (loadingCadastro) return; // Bloquear durante loading

    setSenha(text);

    // ✅ APENAS limpar erros quando usuário digita, SEM validar
    if (text && senhaErros.length > 0) {
      setSenhaErros([]);
    }
  };

  // Handler for CEP with address lookups
  const handleCepChange = (text: string) => {
    if (loadingCadastro) return; // Bloquear durante loading

    const formattedCep = formatCEP(text);
    setCep(formattedCep);

    // Limpar erro quando usuário digita
    if (text && cepErro) setCepErro('');

    const numericCep = stripNonNumeric(text);

    // Só buscar quando CEP estiver completo (8 dígitos)
    if (numericCep.length === 8) {
      handleBuscarCep(numericCep);
    } else if (numericCep.length > 8) {
      // CEP muito longo
      setCepErro('CEP deve ter exatamente 8 dígitos.');
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
        throw new Error('CEP inválido - deve ter 8 dígitos');
      }

      const url = `https://viacep.com.br/ws/${cleanedCep}/json/`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const data = await response.json();

      if (data.erro) {
        throw new Error('CEP não encontrado na base dos Correios');
      }

      // Verificar se os dados essenciais estão presentes
      if (!data.uf || !data.localidade) {
        throw new Error('Dados incompletos retornados pela API');
      }

      // Converter UF para nome completo do estado
      const estadoNome = estadosSiglaParaNome[data.uf as keyof typeof estadosSiglaParaNome];

      if (!estadoNome) {
        throw new Error(`Estado não encontrado para UF: ${data.uf}`);
      }

      const resultado = {
        cep: data.cep,
        logradouro: data.logradouro || '',
        bairro: data.bairro || '',
        cidade: data.localidade,
        estado: estadoNome,
        uf: data.uf,
      };

      return resultado;
    } catch (error) {
      throw error;
    }
  }

  // ✅ FUNÇÃO CORRIGIDA: Buscar endereço pelo CEP e armazenar dados
  async function handleBuscarCep(numericCep?: string) {
    if (loadingCadastro) return; // Bloquear durante loading

    try {
      setLoadingCep(true);
      setBuscandoAutomaticamente(true); // ✅ MARCAR COMO BUSCA AUTOMÁTICA
      setCepErro(''); // Limpar erro anterior

      const endereco = await lookupCepAddress(numericCep ?? cep);

      if (!endereco || !endereco.estado || !endereco.cidade) {
        setCepErro('CEP não encontrado ou inválido.');
        return;
      }

      // Garantir que os estados estejam carregados
      let estadosDisponiveis = estados;
      if (estadosDisponiveis.length === 0) {
        try {
          const estadosData = await getEstados();
          estadosDisponiveis = estadosData || [];
          setEstados(estadosDisponiveis);
        } catch (error) {
          setCepErro('Erro ao carregar dados de estados.');
          return;
        }
      }

      let cidadesDoEstado: CidadeType[] = [];

      if (endereco.estado) {
        const estadoEncontrado = estadosDisponiveis.find((e) => e.nome === endereco.estado);

        if (estadoEncontrado) {
          // ✅ BUSCA AUTOMÁTICA: handleEstadoChange não vai limpar o CEP
          cidadesDoEstado = await handleEstadoChange(estadoEncontrado);
          setEstadoSearch(estadoEncontrado);
        } else {
          setCepErro('Estado não encontrado para este CEP.');
          return;
        }
      }

      if (endereco.cidade && cidadesDoEstado.length > 0) {
        const cidadeEncontrada = cidadesDoEstado.find(
          (c) => normalizeString(c.nome) === normalizeString(endereco.cidade)
        );

        if (cidadeEncontrada) {
          // ✅ BUSCA AUTOMÁTICA: handleCidadeSelect não vai limpar o CEP
          handleCidadeSelect(cidadeEncontrada);

          // ✅ SALVAR dados do CEP APÓS selecionar estado/cidade
          const estadoEncontrado = estadosDisponiveis.find((e) => e.nome === endereco.estado);
          if (estadoEncontrado) {
            const novosDadosCep = {
              estadoId: estadoEncontrado.id,
              cidadeId: cidadeEncontrada.id,
              estadoNome: estadoEncontrado.nome,
              cidadeNome: cidadeEncontrada.nome,
            };

            setDadosDoCep(novosDadosCep);
          }
        } else {
          setCepErro('Cidade não encontrada para este CEP.');
        }
      } else {
        if (!endereco.cidade) {
          setCepErro('Cidade não informada no CEP.');
        } else {
          setCepErro('Nenhuma cidade carregada para este estado.');
        }
      }
    } catch (error) {
      setCepErro('CEP inválido ou não encontrado.');
    } finally {
      setLoadingCep(false);
      setBuscandoAutomaticamente(false); // ✅ FINALIZAR BUSCA AUTOMÁTICA
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sexosData = await getSexoUsuario();
        setSexos(sexosData || []);

        const estadosData = await getEstados();
        setEstados(estadosData || []);
      } catch (error) {}
    };
    fetchData();
  }, []);

  // 🆕 FUNÇÕES ATUALIZADAS: Toggle password visibility com verificação de loading
  const toggleSenhaVisibility = () => {
    if (loadingCadastro) return; // Bloquear durante loading
    setShowSenha(!showSenha);
  };

  const toggleConfirmarSenhaVisibility = () => {
    if (loadingCadastro) return; // Bloquear durante loading
    setShowConfirmarSenha(!showConfirmarSenha);
  };

  return (
    <ImageBackground source={require('../../assets/images/backgrounds/Fundo_01.png')} style={styles.backgroundImage}>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.mainContent}>
            {/* 🆕 BOTÃO VOLTAR ATUALIZADO: Com verificação de loading */}
            <View style={styles.backButtonContainer}>
              <TouchableOpacity
                style={[styles.backButton, loadingCadastro && styles.disabledButton]}
                onPress={handleVoltarLogin}
                disabled={loadingCadastro}
              >
                <Feather name="arrow-left" size={24} color={loadingCadastro ? '#999' : '#333'} />
                <Text style={[styles.backButtonText, loadingCadastro && styles.disabledText]}>Voltar ao Login</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.titleContainer}>
              <Text style={styles.pageTitle}>Dados Pessoais</Text>
              {/* 🆕 INDICADOR DE LOADING */}
              {loadingCadastro && (
                <View style={styles.loadingIndicator}>
                  <ActivityIndicator size="small" color="#4CAF50" />
                  <Text style={styles.loadingText}>Processando cadastro...</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.formContainer}>
            {/* 🆕 FOTO ATUALIZADA: Com verificação de loading */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Foto <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={[
                  styles.photoContainer,
                  fotoErro ? { borderColor: 'red', borderWidth: 1 } : {},
                  loadingCadastro && styles.disabledContainer,
                ]}
                onPress={pickImage}
                disabled={loadingCadastro}
              >
                {foto ? (
                  <Image source={{ uri: foto }} style={styles.photoPreview} />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Feather name="camera" size={40} color={loadingCadastro ? '#999' : '#666'} />
                    <Text style={[styles.photoPlaceholderText, loadingCadastro && styles.disabledText]}>
                      {loadingCadastro ? 'Aguarde...' : 'Toque para selecionar'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              {fotoErro ? <Text style={styles.errorText}>{fotoErro}</Text> : null}
            </View>

            {/* 🆕 NOME ATUALIZADO: Com editable={!loadingCadastro} */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Nome <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  nomeErro ? { borderColor: 'red', borderWidth: 1 } : {},
                  loadingCadastro && styles.disabledInput,
                ]}
                placeholder="Nome"
                value={nome}
                multiline={false}
                scrollEnabled={false}
                disableFullscreenUI={true}
                numberOfLines={1}
                editable={!loadingCadastro} // 🆕 PRINCIPAL MUDANÇA
                onChangeText={(text) => {
                  if (loadingCadastro) return;
                  setNome(text);
                  if (text) setNomeErro('');
                }}
              />
              {nomeErro ? <Text style={styles.errorText}>{nomeErro}</Text> : null}
            </View>

            {/* 🆕 SEXO ATUALIZADO: Com disabled={loadingCadastro} */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Sexo <Text style={styles.required}>*</Text>
              </Text>
              <View style={[styles.checkboxContainer, sexoErro ? {} : {}]}>
                {(sexos || []).map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.checkboxWrapper, loadingCadastro && styles.disabledContainer]}
                    onPress={() => {
                      if (loadingCadastro) return;
                      setSexo(item);
                      setSexoErro('');
                    }}
                    disabled={loadingCadastro} // 🆕 PRINCIPAL MUDANÇA
                  >
                    <View style={[styles.checkboxCustom, loadingCadastro && styles.disabledCheckbox]}>
                      {sexo === item && <View style={styles.checkboxInner} />}
                    </View>
                    <Text style={[styles.checkboxLabel, loadingCadastro && styles.disabledText]}>{item.descricao}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {sexoErro ? <Text style={styles.errorText}>{sexoErro}</Text> : null}
            </View>

            {/* 🆕 EMAIL ATUALIZADO: Com editable={!loadingCadastro} */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                E-mail <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  emailErros.length > 0 ? { borderColor: 'red', borderWidth: 1 } : {},
                  loadingCadastro && styles.disabledInput,
                ]}
                placeholder="E-mail"
                keyboardType="email-address"
                value={email}
                multiline={false}
                scrollEnabled={false}
                disableFullscreenUI={true}
                numberOfLines={1}
                editable={!loadingCadastro} // 🆕 PRINCIPAL MUDANÇA
                onChangeText={handleEmailChange}
              />
              {emailErros.length > 0 &&
                emailErros.map((erro, index) => (
                  <Text key={index} style={styles.errorText}>
                    {erro}
                  </Text>
                ))}
            </View>

            {/* 🆕 TELEFONE ATUALIZADO: Com editable={!loadingCadastro} */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Telefone <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  telefoneErro ? { borderColor: 'red', borderWidth: 1 } : {},
                  loadingCadastro && styles.disabledInput,
                ]}
                placeholder="(00) 00000-0000"
                keyboardType="phone-pad"
                value={telefone}
                multiline={false}
                scrollEnabled={false}
                disableFullscreenUI={true}
                numberOfLines={1}
                editable={!loadingCadastro} // 🆕 PRINCIPAL MUDANÇA
                onChangeText={handleTelefoneChange}
                maxLength={15}
              />
              {telefoneErro ? <Text style={styles.errorText}>{telefoneErro}</Text> : null}
            </View>

            {/* 🆕 CPF ATUALIZADO: Com editable={!loadingCadastro} */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                CPF <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  cpfErro ? { borderColor: 'red', borderWidth: 1 } : {},
                  loadingCadastro && styles.disabledInput,
                ]}
                placeholder="000.000.000-00"
                keyboardType="numeric"
                value={cpf}
                multiline={false}
                scrollEnabled={false}
                disableFullscreenUI={true}
                numberOfLines={1}
                editable={!loadingCadastro} // 🆕 PRINCIPAL MUDANÇA
                onChangeText={handleCpfChange}
                maxLength={14}
              />
              {cpfErro ? <Text style={styles.errorText}>{cpfErro}</Text> : null}
            </View>

            {/* 🆕 CEP ATUALIZADO: Com editable={!loadingCadastro} */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>CEP</Text>
              <View
                style={[
                  styles.inputWithIcon,
                  cepErro ? { borderColor: 'red', borderWidth: 1 } : {},
                  loadingCadastro && styles.disabledContainer,
                ]}
              >
                <TextInput
                  style={{ flex: 1 }}
                  placeholder="00000-000"
                  keyboardType="numeric"
                  value={cep}
                  multiline={false}
                  scrollEnabled={false}
                  disableFullscreenUI={true}
                  numberOfLines={1}
                  editable={!loadingCadastro} // 🆕 PRINCIPAL MUDANÇA
                  onChangeText={handleCepChange}
                  maxLength={9}
                />
                {(loadingCep || loadingCadastro) && (
                  <ActivityIndicator size="small" color="#0000ff" style={styles.inputIcon} />
                )}
                {/* Indicador de sucesso quando CEP foi preenchido */}
                {!loadingCep && !loadingCadastro && cep && !cepErro && dadosDoCep.estadoId && (
                  <Feather name="check-circle" size={20} color="#4CAF50" style={styles.inputIcon} />
                )}
              </View>
              {cepErro ? <Text style={styles.errorText}>{cepErro}</Text> : null}
            </View>

            {/* 🆕 ESTADO ATUALIZADO: Com disabled={loadingCadastro} */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Estado <Text style={styles.required}>*</Text>
              </Text>

              <EstadoSelect
                estado={estado}
                estados={estados}
                onSelectEstado={async (estadoSelecionado) => {
                  if (loadingCadastro) return;
                  await handleEstadoChange(estadoSelecionado);
                  setEstadoErro('');
                }}
                showEstados={showEstados}
                setShowEstados={setShowEstados}
                estadoSearch={estadoSearch}
                setEstadoSearch={setEstadoSearch}
                disabled={loadingCadastro} // 🆕 NOVA PROP
              />

              {estadoErro ? <Text style={styles.errorText}>{estadoErro}</Text> : null}
            </View>

            {/* 🆕 CIDADE ATUALIZADA: Com disabled={loadingCadastro} */}
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
                    if (loadingCadastro) return;
                    handleCidadeSelect(cidadeSelecionada);
                    setCidadeErro('');
                  }}
                  toggleCidades={toggleCidades}
                  disabled={!estado || loadingCadastro} // 🆕 MUDANÇA
                />
              </View>
              {cidadeErro ? <Text style={styles.errorText}>{cidadeErro}</Text> : null}
            </View>

            {/* 🆕 SENHA ATUALIZADA: Com editable={!loadingCadastro} */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Senha <Text style={styles.required}>*</Text>
              </Text>
              <View
                style={[
                  styles.inputWithIcon,
                  senhaErros.length > 0 ? { borderColor: 'red', borderWidth: 1 } : {},
                  loadingCadastro && styles.disabledContainer,
                ]}
              >
                <TextInput
                  style={{ flex: 1 }}
                  placeholder="Senha"
                  secureTextEntry={!showSenha}
                  value={senha}
                  multiline={false}
                  scrollEnabled={false}
                  disableFullscreenUI={true}
                  numberOfLines={1}
                  editable={!loadingCadastro} // 🆕 PRINCIPAL MUDANÇA
                  onChangeText={handleSenhaChange}
                />
                <TouchableOpacity
                  onPress={toggleSenhaVisibility}
                  style={styles.inputIcon}
                  disabled={loadingCadastro} // 🆕 MUDANÇA
                >
                  {showSenha ? (
                    <Feather name="eye-off" size={20} color={loadingCadastro ? '#999' : '#333'} />
                  ) : (
                    <Feather name="eye" size={20} color={loadingCadastro ? '#999' : '#333'} />
                  )}
                </TouchableOpacity>
              </View>
              {senhaErros.length > 0 &&
                senhaErros.map((erro, index) => (
                  <Text key={index} style={styles.errorText}>
                    {erro}
                  </Text>
                ))}
            </View>

            {/* 🆕 CONFIRMAR SENHA ATUALIZADA: Com editable={!loadingCadastro} */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Confirmar Senha <Text style={styles.required}>*</Text>
              </Text>
              <View
                style={[
                  styles.inputWithIcon,
                  confirmarSenhaErro ? { borderColor: 'red', borderWidth: 1 } : {},
                  loadingCadastro && styles.disabledContainer,
                ]}
              >
                <TextInput
                  style={{ flex: 1 }}
                  placeholder="Confirmar Senha"
                  secureTextEntry={!showConfirmarSenha}
                  value={confirmarSenha}
                  multiline={false}
                  scrollEnabled={false}
                  disableFullscreenUI={true}
                  numberOfLines={1}
                  editable={!loadingCadastro} // 🆕 PRINCIPAL MUDANÇA
                  onChangeText={(text) => {
                    if (loadingCadastro) return;
                    setConfirmarSenha(text);
                    if (text) setConfirmarSenhaErro('');
                  }}
                />
                <TouchableOpacity
                  onPress={toggleConfirmarSenhaVisibility}
                  style={styles.inputIcon}
                  disabled={loadingCadastro} // 🆕 MUDANÇA
                >
                  {showConfirmarSenha ? (
                    <Feather name="eye-off" size={20} color={loadingCadastro ? '#999' : '#333'} />
                  ) : (
                    <Feather name="eye" size={20} color={loadingCadastro ? '#999' : '#333'} />
                  )}
                </TouchableOpacity>
              </View>
              {confirmarSenhaErro ? <Text style={styles.errorText}>{confirmarSenhaErro}</Text> : null}
            </View>

            {/* Botão de salvar com loading (mantido igual) */}
            <TouchableOpacity
              style={[styles.saveButton, loadingCadastro && styles.saveButtonDisabled]}
              onPress={handleSalvar}
              disabled={loadingCadastro}
            >
              {loadingCadastro ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={[styles.saveButtonText, { marginLeft: 10 }]}>Cadastrando...</Text>
                </View>
              ) : (
                <Text style={styles.saveButtonText}>Cadastrar</Text>
              )}
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
  backButtonContainer: {
    marginTop: 10,
    marginBottom: 20,
    alignItems: 'flex-start',
    width: '100%',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  backButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#A5D6A7',
    opacity: 0.7,
  },
  loadingContainer: {
    flexDirection: 'row',
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
    textAlign: 'center',
    marginTop: 20,
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
    height: 45,
    borderColor: '#ccc',
    borderWidth: 1,
    paddingLeft: 10,
    borderRadius: 5,
    marginTop: 5,
    backgroundColor: '#fff',
  },
  photoContainer: {
    width: 150,
    height: 150,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 75,
    marginTop: 5,
    marginBottom: 5,
    backgroundColor: '#fff',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  photoPlaceholderText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
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
    color: '#FF0000',
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
  // 🆕 NOVOS ESTILOS: Para elementos desabilitados durante loading
  disabledButton: {
    opacity: 0.6,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  disabledContainer: {
    opacity: 0.6,
    backgroundColor: '#f5f5f5',
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    color: '#999',
  },
  disabledText: {
    color: '#999',
  },
  disabledCheckbox: {
    backgroundColor: '#f5f5f5',
    borderColor: '#ccc',
  },
  loadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    padding: 10,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  addressInfo: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 5,
    marginLeft: 10,
    fontStyle: 'italic',
  },
});
('');
