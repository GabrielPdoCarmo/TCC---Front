import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Platform,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  getEspecies,
  getRacasPorEspecie,
  getFaixaEtaria,
  getUsuarioById,
  postPet,
  getSexoPet,
} from '../../services/api';
import RacasSelectionModal from './RacasSelectionModal'; // Importando o novo componente
import AsyncStorage from '@react-native-async-storage/async-storage'; // Importando AsyncStorage
import * as ImagePicker from 'expo-image-picker';

// Interfaces
interface PetDonationModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
}

// Interface para dados de API
interface Raca {
  id: string | number;
  nome: string;
  // Add any other properties that exist in your race object
}

// Interface para o payload enviado à API
interface PetPayload {
  nome: string;
  especie_id: number;
  raca_id: number;
  estado_id: number;
  cidade_id: number;
  idade: number;
  faixa_etaria_id: number;
  usuario_id: number;
  sexo_id: number;
  motivoDoacao: string;
  status_id: number;
  quantidade: number;
  doencas: string[];
  foto: any;
}

// Interface para o formulário que corresponde à estrutura real usada
interface FormData {
  nome: string;
  especie: any; // Objeto espécie completo da API
  raca: string;
  idade: string;
  idadeCategoria: any; // Objeto faixa etária completo da API
  responsavel: string;
  estado: string;
  cidade: string;
  sexo: string;
  possuiDoenca: string;
  doencaDescricao: string;
  motivoDoacao: string;
  quantidade: string;
  foto: any;
}

// Define possible response formats from your API
interface RacasResponse {
  data?: Raca[];
  results?: Raca[];
  [key: string]: any; // For other possible structures
}

// Interface para dados do usuário
interface UserData {
  id: number;
  nome: string;
  cidade: {
    id: number;
    nome: string;
  };
  estado: {
    id: number;
    nome: string;
  };
}

const PetDonationModal: React.FC<PetDonationModalProps> = ({ visible, onClose, onSubmit }) => {
  const router = useRouter();

  // Estados para armazenar dados das APIs
  const [especies, setEspecies] = useState<any[]>([]);
  const [faixasEtarias, setFaixasEtarias] = useState<any[]>([]);
  const [faixasEtariasFiltradas, setFaixasEtariasFiltradas] = useState<any[]>([]);
  const [sexoOpcoes, setSexoOpcoes] = useState<any[]>([]); // Estado para opções de sexo
  const [racas, setRacas] = useState<any[]>([]); // Estado para todas as raças
  const [racasFiltradas, setRacasFiltradas] = useState<any[]>([]); // Estado para raças filtradas
  const [showRacasModal, setShowRacasModal] = useState<boolean>(false); // Estado para controlar a visibilidade do modal de raças

  // Estado para armazenar dados do usuário logado
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Estados para erros de validação
  const [especieErro, setEspecieErro] = useState<string>('');
  const [faixaEtariaErro, setFaixaEtariaErro] = useState<string>('');
  const [sexoErro, setSexoErro] = useState<string>('');
  const [idadeErro, setIdadeErro] = useState<string>(''); // Estado para erro de idade
  const [racaErro, setRacaErro] = useState<string>(''); // Estado para erro de raça
  const [nomeErro, setNomeErro] = useState<string>('');
  const [quantidadeErro, setQuantidadeErro] = useState<string>('');
  const [possuiDoencaErro, setPossuiDoencaErro] = useState<string>('');
  const [doencaDescricaoErro, setDoencaDescricaoErro] = useState<string>('');
  const [motivoDoacaoErro, setMotivoDoacaoErro] = useState<string>('');
  const [fotoErro, setFotoErro] = useState<string>('');
  // Estado inicial do formulário - corrigido
  const [formData, setFormData] = useState<FormData>({
    nome: '',
    especie: '', // Corrigido: valor inicial vazio em vez de vírgula pendente
    raca: '',
    idade: '',
    idadeCategoria: '',
    responsavel: '',
    estado: '',
    cidade: '',
    sexo: '',
    possuiDoenca: '',
    doencaDescricao: '',
    motivoDoacao: '',
    quantidade: '',
    foto: null,
  });

  // Função para buscar dados do usuário logado
  const fetchUserData = async () => {
    try {
      // Usar a mesma chave '@App:userId' que foi usada para armazenar
      const userId = await AsyncStorage.getItem('@App:userId');

      if (!userId) {
        console.error('ID do usuário não encontrado no AsyncStorage');
        Alert.alert('Erro', 'Não foi possível identificar o usuário logado.');
        return;
      }

      const userIdNumber = parseInt(userId, 10);

      // Resto do código permanece igual...
      const userData = await getUsuarioById(userIdNumber);

      if (!userData) {
        console.error('Dados do usuário não encontrados');
        Alert.alert('Erro', 'Não foi possível carregar os dados do usuário.');
        return;
      }

      console.log('Dados do usuário carregados:', userData);

      setUserData(userData);

      setFormData((prevState) => ({
        ...prevState,
        responsavel: userData.nome,
        cidade: userData.cidade.nome,
        estado: userData.estado.nome,
      }));
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
      Alert.alert('Erro', 'Falha ao carregar dados do usuário. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Buscar dados das APIs quando o componente é montado
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Buscar dados do usuário
        await fetchUserData();

        // Buscar espécies
        const especiesData = await getEspecies();
        console.log('especiesData:', especiesData);

        // Importante: Verificar a estrutura dos dados retornados
        if (Array.isArray(especiesData)) {
          setEspecies(especiesData);
        } else if (especiesData && typeof especiesData === 'object') {
          // Se não for um array mas for um objeto, pode ser que esteja em uma propriedade
          // Por exemplo: { data: [...] }
          const dataArray = especiesData.data || especiesData.results || Object.values(especiesData);
          if (Array.isArray(dataArray)) {
            setEspecies(dataArray);
          } else {
            console.error('Formato de resposta de espécies não é um array:', especiesData);
            setEspecies([]);
          }
        } else {
          console.error('Formato de resposta de espécies desconhecido:', especiesData);
          setEspecies([]);
        }

        // Buscar faixas etárias
        const faixasEtariasData = await getFaixaEtaria();
        console.log('faixasEtariasData:', faixasEtariasData);

        // Mesmo tratamento para faixas etárias
        if (Array.isArray(faixasEtariasData)) {
          setFaixasEtarias(faixasEtariasData);
        } else if (faixasEtariasData && typeof faixasEtariasData === 'object') {
          const dataArray = faixasEtariasData.data || faixasEtariasData.results || Object.values(faixasEtariasData);
          if (Array.isArray(dataArray)) {
            setFaixasEtarias(dataArray);
          } else {
            console.error('Formato de resposta de faixas etárias não é um array:', faixasEtariasData);
            setFaixasEtarias([]);
          }
        } else {
          console.error('Formato de resposta de faixas etárias desconhecido:', faixasEtariasData);
          setFaixasEtarias([]);
        }

        // Inicialmente não teremos faixas filtradas até que o usuário selecione uma espécie
        setFaixasEtariasFiltradas([]);

        // Buscar opções de sexo do pet
        const sexoPetData = await getSexoPet();
        console.log('sexoPetData:', sexoPetData);

        // Mesmo tratamento para opções de sexo
        if (Array.isArray(sexoPetData)) {
          setSexoOpcoes(sexoPetData);
        } else if (sexoPetData && typeof sexoPetData === 'object') {
          const dataArray = sexoPetData.data || sexoPetData.results || Object.values(sexoPetData);
          if (Array.isArray(dataArray)) {
            setSexoOpcoes(dataArray);
          } else {
            console.error('Formato de resposta de sexo não é um array:', sexoPetData);
            setSexoOpcoes([]);
          }
        } else {
          console.error('Formato de resposta de sexo desconhecido:', sexoPetData);
          setSexoOpcoes([]);
        }
      } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error);
        Alert.alert('Erro', 'Falha ao carregar dados. Por favor, tente novamente.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Debug useEffect para verificar valores após carregamento
  useEffect(() => {
    console.log('Espécies carregadas:', especies);
    console.log('Faixas etárias carregadas:', faixasEtarias);
    console.log('Opções de sexo carregadas:', sexoOpcoes);
    console.log('Dados do usuário carregados:', userData);
  }, [especies, faixasEtarias, sexoOpcoes, userData]);

  // Função para carregar raças baseadas na espécie selecionada
  const loadRacasByEspecie = async (especieId: number) => {
    try {
      console.log('Carregando raças para espécie ID:', especieId);

      // Resetar estado de raça no formulário
      setFormData((prev) => ({ ...prev, raca: '' }));
      setRacasFiltradas([]);

      // Buscar raças por espécie - add proper typing here
      const racasData = await getRacasPorEspecie(especieId); // Convert to string here if needed
      console.log('racasData:', racasData);

      // Processamento dos dados de raças with proper type handling
      if (Array.isArray(racasData)) {
        setRacasFiltradas(racasData as Raca[]);
      } else if (racasData && typeof racasData === 'object') {
        // Use type assertion to tell TypeScript about the structure
        const typedData = racasData as RacasResponse;
        const dataArray = typedData.data || typedData.results || Object.values(typedData);

        if (Array.isArray(dataArray)) {
          setRacasFiltradas(dataArray as Raca[]);
        } else {
          console.error('Formato de resposta de raças não é um array:', racasData);
          setRacasFiltradas([]);
        }
      } else {
        console.error('Formato de resposta de raças desconhecido:', racasData);
        setRacasFiltradas([]);
      }
    } catch (error) {
      console.error('Erro ao carregar raças para esta espécie:', error);
      Alert.alert('Erro', 'Falha ao carregar raças para esta espécie. Por favor, tente novamente.');
    }
  };

  // Função para validar a idade com base na faixa etária selecionada
  const validarIdade = (idade: string, faixaEtaria: any) => {
    if (!idade || !faixaEtaria) return true;

    const idadeNum = parseInt(idade, 10);
    if (isNaN(idadeNum)) return false;

    const idadeMin = faixaEtaria.idade_min || 0;
    const idadeMax = faixaEtaria.idade_max || Infinity;

    return idadeNum >= idadeMin && idadeNum <= idadeMax;
  };

  // Função para atualizar o estado do formulário
  // Função para atualizar o estado do formulário
  const handleChange = (name: keyof FormData, value: string | any) => {
    // Impedir alterações nos campos do usuário (responsável, cidade, estado)
    if (name === 'responsavel' || name === 'cidade' || name === 'estado') {
      return; // Não permitir alterações nesses campos
    }

    // Limpar mensagens de erro quando o campo for preenchido
    if (value) {
      // Limpar erros específicos para cada campo quando ele é preenchido
      switch (name) {
        case 'nome':
          setNomeErro('');
          break;
        case 'especie':
          setEspecieErro('');
          break;
        case 'raca':
          setRacaErro('');
          break;
        case 'idade':
          setIdadeErro('');
          break;
        case 'idadeCategoria':
          setFaixaEtariaErro('');
          break;
        case 'sexo':
          setSexoErro('');
          break;
        case 'quantidade':
          setQuantidadeErro('');
          break;
        case 'possuiDoenca':
          setPossuiDoencaErro('');
          break;
        case 'doencaDescricao':
          setDoencaDescricaoErro('');
          break;
        case 'motivoDoacao':
          setMotivoDoacaoErro('');
          break;
        case 'foto':
          setFotoErro('');
          break;
        default:
          break;
      }
    }

    // Caso especial para o campo de idade
    if (name === 'idade') {
      // Verifica se o valor digitado é apenas numérico
      if (value && !/^\d*$/.test(value)) {
        return; // Não atualiza o estado se não for numérico
      }

      // Limpa o erro de idade quando o usuário começa a digitar
      setIdadeErro('');

      // Valida a idade de acordo com a faixa etária selecionada
      if (formData.idadeCategoria && value) {
        const idadeValida = validarIdade(value, formData.idadeCategoria);
        if (!idadeValida) {
          const idadeMin = formData.idadeCategoria.idade_min || 0;

          // Tratamento especial para o caso de idade_max ser null (idoso)
          let mensagemErro;
          if (formData.idadeCategoria.idade_max === null) {
            mensagemErro = `A idade deve ser ${idadeMin} ou mais`;
          } else {
            mensagemErro = `A idade deve estar entre ${idadeMin} e ${formData.idadeCategoria.idade_max}`;
          }

          setIdadeErro(mensagemErro);
        } else {
          setIdadeErro('');
        }
      }
    }

    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));

    // Se a espécie foi alterada, filtra as faixas etárias correspondentes e carrega as raças
    if (name === 'especie' && value) {
      console.log('Espécie selecionada:', value);

      // Filtra faixas etárias pela especie_id
      const faixasFiltradas = faixasEtarias.filter((faixa) => {
        console.log(`Comparando: faixa.especie_id (${faixa.especie_id}) === value.id (${value.id})`);
        return faixa.especie_id === value.id;
      });

      console.log('Faixas filtradas:', faixasFiltradas);
      setFaixasEtariasFiltradas(faixasFiltradas);

      // Carrega as raças para esta espécie
      loadRacasByEspecie(Number(value.id));

      // Reseta a seleção de faixa etária e idade
      setFormData((prev) => ({ ...prev, idadeCategoria: '', idade: '', raca: '' }));
      setIdadeErro('');
      setRacaErro('');
    }

    // Se a faixa etária foi alterada, limpa o campo de idade
    if (name === 'idadeCategoria') {
      setFormData((prev) => ({ ...prev, idade: '' }));
      // Limpa qualquer erro existente ao mudar a faixa etária
      setIdadeErro('');
    }
  };

  // Função para verificar se o objeto tem a propriedade descricao
  const getDescricao = (obj: any) => {
    if (!obj) return '';

    // Tenta diferentes propriedades comuns para descrição
    if (obj.descricao) return obj.descricao;
    if (obj.description) return obj.description;
    if (obj.nome) return obj.nome;
    if (obj.name) return obj.name;

    // Se nenhuma propriedade esperada for encontrada, retorna uma representação do objeto
    return JSON.stringify(obj);
  };

  const getSelectedRacaId = () => {
    // Se a raça não foi selecionada, retorna null
    if (!formData.raca) return null;

    // Procura a raça que corresponde ao nome selecionado
    const racaEncontrada = racasFiltradas.find((raca) => getDescricao(raca) === formData.raca);

    return racaEncontrada ? racaEncontrada.id : null;
  };

  // Função para obter o ID do sexo baseado na descrição
  const getSexoIdFromDescription = (sexoDescricao: string) => {
    // Se o sexo não foi selecionado, retorna null
    if (!sexoDescricao) return null;

    // Procura o sexo que corresponde à descrição selecionada
    const sexoEncontrado = sexoOpcoes.find((sexo) => getDescricao(sexo) === sexoDescricao);

    return sexoEncontrado ? sexoEncontrado.id : null;
  };

  // Função para lidar com o envio do formulário
  // Função para lidar com o envio do formulário
const handleSubmit = async () => {
  // Validação dos campos obrigatórios
  let isValid = true;

  // Validações existentes
  if (!formData.especie) {
    setEspecieErro('Por favor, selecione uma espécie');
    isValid = false;
  } else {
    setEspecieErro('');
  }

  if (formData.especie && !formData.idadeCategoria) {
    setFaixaEtariaErro('Por favor, selecione uma faixa etária');
    isValid = false;
  } else {
    setFaixaEtariaErro('');
  }

  // Nova validação: verificar se idade está vazia quando uma faixa etária foi selecionada
  if (formData.idadeCategoria && !formData.idade) {
    setIdadeErro('Por favor, informe a idade');
    isValid = false;
  } else if (formData.idade && formData.idadeCategoria) {
    // Validação da idade se estiver preenchida
    const idadeValida = validarIdade(formData.idade, formData.idadeCategoria);
    if (!idadeValida) {
      const idadeMin = formData.idadeCategoria.idade_min || 0;

      // Tratamento especial para o caso de idade_max ser null (idoso)
      let mensagemErro;
      if (formData.idadeCategoria.idade_max === null) {
        mensagemErro = `A idade deve ser ${idadeMin} ou mais`;
      } else {
        mensagemErro = `A idade deve estar entre ${idadeMin} e ${formData.idadeCategoria.idade_max}`;
      }

      setIdadeErro(mensagemErro);
      isValid = false;
    } else {
      setIdadeErro('');
    }
  }

  if (!formData.sexo) {
    setSexoErro('Por favor, selecione o sexo');
    isValid = false;
  } else {
    setSexoErro('');
  }

  if (!formData.raca) {
    setRacaErro('Por favor, selecione uma raça');
    isValid = false;
  } else {
    setRacaErro('');
  }

  // Novas validações
  if (!formData.nome) {
    setNomeErro('Por favor, informe o nome');
    isValid = false;
  } else {
    setNomeErro('');
  }

  if (!formData.quantidade) {
    setQuantidadeErro('Por favor, informe a quantidade');
    isValid = false;
  } else {
    setQuantidadeErro('');
  }

  if (!formData.possuiDoenca) {
    setPossuiDoencaErro('Por favor, informe se possui doença/deficiência');
    isValid = false;
  } else {
    setPossuiDoencaErro('');
  }

  // Validar descrição da doença apenas se possuiDoenca for "Sim"
  if (formData.possuiDoenca === 'Sim' && !formData.doencaDescricao) {
    setDoencaDescricaoErro('Por favor, descreva a doença/deficiência');
    isValid = false;
  } else {
    setDoencaDescricaoErro('');
  }

  if (!formData.motivoDoacao) {
    setMotivoDoacaoErro('Por favor, informe o motivo da doação');
    isValid = false;
  } else {
    setMotivoDoacaoErro('');
  }

  if (!formData.foto) {
    setFotoErro('Por favor, selecione uma foto');
    isValid = false;
  } else {
    setFotoErro('');
  }

  if (!isValid) {
    Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios corretamente.');
    return;
  }

  try {
    // Resto do código permanece igual...
    // Obter o ID do usuário do AsyncStorage
    const userId = await AsyncStorage.getItem('@App:userId');

    if (!userId) {
      Alert.alert('Erro', 'Não foi possível identificar o usuário logado.');
      return;
    }

    // Preparar os dados para o formato que a API espera
    const petPayload: PetPayload = {
      nome: formData.nome,
      especie_id: formData.especie.id,
      raca_id: getSelectedRacaId(),
      idade: parseInt(formData.idade, 10) || 0, // Converte para número
      faixa_etaria_id: formData.idadeCategoria.id,
      usuario_id: parseInt(userId, 10),
      estado_id: userData?.estado.id || 0,
      cidade_id: userData?.cidade.id || 0,
      sexo_id: getSexoIdFromDescription(formData.sexo),
      motivoDoacao: formData.motivoDoacao,
      status_id: 1,
      quantidade: parseInt(formData.quantidade, 10) || 0, // Converte para número
      doencas: formData.possuiDoenca === 'Sim' && formData.doencaDescricao ? [formData.doencaDescricao] : [],
      foto: formData.foto
        ? {
            uri: formData.foto,
            type: 'image/jpeg',
            name: `pet_${Date.now()}.jpg`,
          }
        : null,
    };

    // Exibir loading
    setIsLoading(true);

    // Enviar para a API
    const response = await postPet(petPayload);

    if (response) {
      Alert.alert('Sucesso', 'Pet cadastrado com sucesso!');

      // Reseta o formulário, mantendo os dados do usuário
      setFormData({
        especie: '',
        nome: '',
        quantidade: '',
        raca: '',
        idadeCategoria: '',
        idade: '',
        responsavel: userData?.nome || '',
        estado: userData?.estado.nome || '',
        cidade: userData?.cidade.nome || '',
        sexo: '',
        possuiDoenca: '',
        doencaDescricao: '',
        motivoDoacao: '',
        foto: null,
      });

      // Limpa os erros
      setEspecieErro('');
      setFaixaEtariaErro('');
      setSexoErro('');
      setIdadeErro('');
      setRacaErro('');
      setNomeErro('');
      setQuantidadeErro('');
      setPossuiDoencaErro('');
      setDoencaDescricaoErro('');
      setMotivoDoacaoErro('');
      setFotoErro('');

      // Fechar o modal
      onClose();
    } else {
      Alert.alert('Erro', 'Não foi possível cadastrar o pet. Tente novamente.');
    }
  } catch (error) {
    console.error('Erro ao submeter formulário:', error);
    Alert.alert('Erro', 'Ocorreu um erro ao processar sua solicitação. Tente novamente.');
  } finally {
    setIsLoading(false);
  }
};

  // Função para tratar o fechamento e navegação
  const handleCloseAndNavigate = () => {
    onClose(); // Fecha o modal
    router.push('/pages/PetDonation'); // Navega para a tela PetDonation
  };

  // Função para abrir o modal de seleção de raça
  const openRacasModal = () => {
    if (!formData.especie) {
      setRacaErro('Por favor, selecione uma espécie primeiro');
      return;
    }

    if (racasFiltradas.length === 0) {
      Alert.alert('Aviso', 'Não há raças disponíveis para esta espécie.');
      return;
    }

    setShowRacasModal(true);
  };

  // Função para selecionar uma raça e fechar o modal
  const selectRaca = (raca: any) => {
    setFormData((prev) => ({
      ...prev,
      raca: getDescricao(raca),
    }));
    setRacaErro('');
    setShowRacasModal(false);
  };

  // Função para obter dica de idade para a faixa etária selecionada
  const getIdadePlaceholder = () => {
    if (!formData.idadeCategoria) return 'Idade específica (opcional)';

    const idadeMin = formData.idadeCategoria.idade_min !== undefined ? formData.idadeCategoria.idade_min : '';

    // Tratamento especial para caso de idosos (idade_max é null)
    if (formData.idadeCategoria.idade_max === null) {
      return `Idade específica (${idadeMin} ou mais)`;
    } else {
      const idadeMax = formData.idadeCategoria.idade_max !== undefined ? formData.idadeCategoria.idade_max : '∞';
      return `Idade específica (Entre ${idadeMin} e ${idadeMax})`;
    }
  };

  // Função para formatar a exibição dos limites de idade
  const getIdadeLimites = () => {
    if (!formData.idadeCategoria) return '';

    const idadeMin = formData.idadeCategoria.idade_min !== undefined ? formData.idadeCategoria.idade_min : '0';

    // Tratamento especial para idosos onde idade_max é null
    if (formData.idadeCategoria.idade_max === null) {
      return `${idadeMin} anos ou mais`;
    } else {
      const idadeMax = formData.idadeCategoria.idade_max !== undefined ? formData.idadeCategoria.idade_max : '∞';
      return `${idadeMin} - ${idadeMax} ${formData.idadeCategoria.unidade || 'anos'}`;
    }
  };

  // Função para selecionar uma imagem da galeria
  const pickImage = async () => {
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
        handleChange('foto', result.assets[0].uri);
        console.log('Imagem selecionada:', result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem. Tente novamente.');
    }
  };

  // Exibir loading enquanto os dados são carregados
  if (isLoading) {
    return (
      <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando dados...</Text>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* Cabeçalho do Modal */}

          {/* Título do Formulário */}
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>Dados Do Pet</Text>
            <TouchableOpacity onPress={handleCloseAndNavigate}>
              <Image source={require('../../assets/images/Icone/close-icon.png')} style={styles.closeIcon} />
            </TouchableOpacity>
          </View>

          {/* Formulário em ScrollView */}
          <ScrollView style={styles.formContainer}>
            {/* Espécie */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Especie <Text style={styles.required}>*</Text>
              </Text>

              {especies.length === 0 ? (
                <Text style={styles.infoText}>Carregando espécies...</Text>
              ) : (
                <View style={[styles.checkboxContainer]}>
                  {especies.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.checkboxWrapper}
                      onPress={() => {
                        handleChange('especie', item);
                        setEspecieErro('');
                        console.log('Espécie selecionada:', item);
                      }}
                    >
                      <View style={styles.checkboxCustom}>
                        {formData.especie && formData.especie.id === item.id && <View style={styles.checkboxInner} />}
                      </View>
                      <Text style={styles.checkboxLabel}>{getDescricao(item)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {especieErro ? <Text style={styles.errorText}>{especieErro}</Text> : null}
            </View>

            {/* Nome */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Nome <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, nomeErro ? styles.errorBorder : {}]}
                placeholder="Nome"
                value={formData.nome}
                onChangeText={(value) => handleChange('nome', value)}
              />
              {nomeErro ? <Text style={styles.errorText}>{nomeErro}</Text> : null}
            </View>

            {/* Quantidade */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Quantidade <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, quantidadeErro ? styles.errorBorder : {}]}
                placeholder="Quantidade"
                keyboardType="numeric"
                value={formData.quantidade}
                onChangeText={(value) => handleChange('quantidade', value)}
              />
              {quantidadeErro ? <Text style={styles.errorText}>{quantidadeErro}</Text> : null}
            </View>

            {/* Raça */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Raça <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity style={[styles.dropdown, racaErro ? styles.errorBorder : {}]} onPress={openRacasModal}>
                <Text style={[styles.dropdownText, !formData.raca && styles.placeholderText]}>
                  {formData.raca || 'Selecione uma raça'}
                </Text>
                <Text style={styles.dropdownIcon}>▼</Text>
              </TouchableOpacity>
              {racaErro ? <Text style={styles.errorText}>{racaErro}</Text> : null}

              {/* Informa ao usuário para selecionar uma espécie primeiro, se aplicável */}
              {!formData.especie && (
                <Text style={styles.infoText}>Selecione uma espécie para ver as raças disponíveis</Text>
              )}
            </View>
            <RacasSelectionModal
              visible={showRacasModal}
              racasFiltradas={racasFiltradas}
              onClose={() => setShowRacasModal(false)}
              onSelectRaca={(raca) => {
                console.log('Raça Selecionada:', raca);
                selectRaca(raca);
              }}
              hasEspecie={!!formData.especie}
            />

            {/* Idade/Faixa Etária */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Idade <Text style={styles.required}>*</Text>
              </Text>
              {!formData.especie ? (
                <Text style={styles.infoText}>Selecione uma espécie para ver as faixas etárias disponíveis</Text>
              ) : faixasEtariasFiltradas.length === 0 ? (
                <Text style={styles.infoText}>Carregando faixas etárias para esta espécie...</Text>
              ) : (
                <View style={[styles.checkboxContainer]}>
                  {faixasEtariasFiltradas.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.checkboxWrapper}
                      onPress={() => {
                        handleChange('idadeCategoria', item);
                        setFaixaEtariaErro('');
                        console.log('Faixa Etária selecionada:', item);
                      }}
                    >
                      <View style={styles.checkboxCustom}>
                        {formData.idadeCategoria && formData.idadeCategoria.id === item.id && (
                          <View style={styles.checkboxInner} />
                        )}
                      </View>
                      <Text style={styles.checkboxLabel}>{getDescricao(item)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {faixaEtariaErro ? <Text style={styles.errorText}>{faixaEtariaErro}</Text> : null}

              {/* Campo de idade específica - somente visível quando uma faixa etária é selecionada */}
              {formData.idadeCategoria ? (
                <View>
                  <TextInput
                    style={[styles.input, { marginTop: 10 }, idadeErro ? styles.inputError : {}]}
                    placeholder={getIdadePlaceholder()}
                    value={formData.idade}
                    keyboardType="numeric"
                    onChangeText={(value) => handleChange('idade', value)}
                  />
                  {idadeErro ? <Text style={styles.errorText}>{idadeErro}</Text> : null}

                  {/* Mensagem informativa sobre os limites da faixa etária */}
                  {formData.idadeCategoria && (
                    <Text style={styles.infoText}>Faixa etária selecionada: {getIdadeLimites()}</Text>
                  )}
                </View>
              ) : null}
            </View>

            {/* Responsável (Não editável) */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Responsável <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, styles.readonlyInput]}
                placeholder="Responsável"
                value={formData.responsavel}
                editable={false} // Torna o campo não editável
              />
              <Text style={styles.infoText}>Campo preenchido automaticamente com seu nome</Text>
            </View>

            {/* Estado (Não editável) */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Estado <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, styles.readonlyInput]}
                placeholder="Estado"
                value={formData.estado}
                editable={false} // Torna o campo não editável
              />
              <Text style={styles.infoText}>Campo preenchido automaticamente com seu estado</Text>
            </View>

            {/* Cidade (Não editável) */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Cidade <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, styles.readonlyInput]}
                placeholder="Cidade"
                value={formData.cidade}
                editable={false} // Torna o campo não editável
              />
              <Text style={styles.infoText}>Campo preenchido automaticamente com sua cidade</Text>
            </View>
            {/* Sexo */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Sexo <Text style={styles.required}>*</Text>
              </Text>
              {sexoOpcoes.length === 0 ? (
                <Text style={styles.infoText}>Carregando opções de sexo...</Text>
              ) : (
                <View style={[styles.radioRow]}>
                  {sexoOpcoes.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.checkboxWrapper}
                      onPress={() => {
                        handleChange('sexo', getDescricao(item));
                        setSexoErro('');
                        console.log('Sexo selecionado:', item);
                      }}
                    >
                      <View style={styles.checkboxCustom}>
                        {formData.sexo === getDescricao(item) && <View style={styles.checkboxInner} />}
                      </View>
                      <Text style={styles.checkboxLabel}>{getDescricao(item)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {sexoErro ? <Text style={styles.errorText}>{sexoErro}</Text> : null}
            </View>

            {/* Doença/Deficiência */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Possui Doença/Deficiência <Text style={styles.required}>*</Text>
              </Text>
              <View style={[styles.radioRow]}>
                <TouchableOpacity style={styles.checkboxWrapper} onPress={() => handleChange('possuiDoenca', 'Sim')}>
                  <View style={styles.checkboxCustom}>
                    {formData.possuiDoenca === 'Sim' && <View style={styles.checkboxInner} />}
                  </View>
                  <Text style={styles.checkboxLabel}>Sim</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.checkboxWrapper} onPress={() => handleChange('possuiDoenca', 'Não')}>
                  <View style={styles.checkboxCustom}>
                    {formData.possuiDoenca === 'Não' && <View style={styles.checkboxInner} />}
                  </View>
                  <Text style={styles.checkboxLabel}>Não</Text>
                </TouchableOpacity>
              </View>
              {possuiDoencaErro ? <Text style={styles.errorText}>{possuiDoencaErro}</Text> : null}
            </View>

            {/* Descrição Doença - Mostrar apenas se possuiDoenca for "Sim" */}
            {formData.possuiDoenca === 'Sim' && (
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Se sim, comente qual seria</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Doença/Deficiência"
                  value={formData.doencaDescricao}
                  onChangeText={(value) => handleChange('doencaDescricao', value)}
                />
                {doencaDescricaoErro ? <Text style={styles.errorText}>{doencaDescricaoErro}</Text> : null}
              </View>
            )}

            {/* Motivo da Doação */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Motivo de estar em Doação <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.textArea, motivoDoacaoErro ? styles.errorBorder : null]}
                placeholder="Motivo de estar em Doação"
                multiline
                numberOfLines={4}
                value={formData.motivoDoacao}
                onChangeText={(value) => handleChange('motivoDoacao', value)}
              />
              {motivoDoacaoErro ? <Text style={styles.errorText}>{motivoDoacaoErro}</Text> : null}
            </View>

            {/* Foto */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Foto <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity style={styles.photoUploadButton} onPress={pickImage}>
                {formData.foto ? (
                  <Image source={{ uri: formData.foto }} style={styles.photoPreview} />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Text style={styles.uploadText}>Selecionar foto</Text>
                  </View>
                )}
              </TouchableOpacity>
              {fotoErro ? <Text style={styles.errorText}>{fotoErro}</Text> : null}
              <Text style={styles.infoText}>Clique para selecionar uma foto da galeria</Text>
            </View>

            {/* Botão Salvar */}
            <TouchableOpacity style={styles.saveButton} onPress={handleSubmit}>
              <Text style={styles.saveButtonText}>Salvar</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#F0F0F0',
  },
  modalContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#4B99FB',
    padding: 15,
    paddingTop: Platform.OS === 'ios' ? 50 : 15,
  },
  backButton: {
    padding: 5,
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: 15,
  },
  headerIcon: {
    width: 24,
    height: 24,
  },
  formHeader: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  closeIcon: {
    width: 24,
    height: 24,
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 15,
  },
  fieldContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#000',
  },
  required: {
    color: 'red',
  },
  checkboxContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 5,
    padding: 5,
  },
  radioRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
    padding: 5,
  },
  checkboxWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 10,
  },
  checkboxCustom: {
    height: 24,
    width: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxInner: {
    height: 12,
    width: 12,
    borderRadius: 6,
    backgroundColor: '#FF0000',
  },
  checkboxLabel: {
    fontSize: 16,
    marginLeft: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: '#F5F5F5',
    fontSize: 16,
  },
  inputError: {
    borderColor: 'red',
    borderWidth: 1,
  },
  dropdown: {
    height: 50,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: '#F5F5F5',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 16,
    color: '#000',
  },
  dropdownIcon: {
    fontSize: 16,
  },
  ageContainer: {
    marginTop: 5,
  },
  radioGridRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  textArea: {
    height: 100,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingTop: 15,
    backgroundColor: '#F5F5F5',
    fontSize: 16,
    textAlignVertical: 'top',
  },
  photoUploadButton: {
    marginTop: 5,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    color: '#999',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#4B99FB',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
  },
  errorBorder: {
    borderWidth: 1,
    borderColor: 'red',
    borderRadius: 5,
    padding: 5,
  },
  infoText: {
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 10,
  },
  debugText: {
    color: '#888',
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: 2,
  },
  racasModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  racasModalContent: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    margin: 20,
  },
  racasModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  racasModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  racaItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  racaItemText: {
    fontSize: 16,
  },
  racasList: {
    maxHeight: 300,
  },
  racasModalCloseButton: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 15,
  },
  racasModalCloseButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  placeholderText: {
    color: '#999',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Add this for the loading text
  loadingText: {
    fontSize: 16,
    marginTop: 10,
    color: '#333',
  },
  photoPreview: {
    width: 120,
    height: 120,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CCCCCC',
  },
  // Add this for readonly inputs
  readonlyInput: {
    backgroundColor: '#f0f0f0',
    color: '#666',
    opacity: 0.8,
  },
});

export default PetDonationModal;
