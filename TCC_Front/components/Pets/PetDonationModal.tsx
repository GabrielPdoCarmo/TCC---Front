import React, { useState, useEffect, useRef } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';

import RacasSelectionModal from './RacasSelectionModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import updatePet from '../../services/api/Pets/updatePet';
import postPet from '../../services/api/Pets/postPet';
import getEspecies from '../../services/api/Especies/getEspecies';
import getRacasPorEspecie from '../../services/api/Raca/getRacasPorEspecie';
import getFaixaEtaria from '../../services/api/Faixa-etaria/getFaixaEtaria';
import getSexoPet from '../../services/api/Sexo/getSexoPet';
import getDoencasPorPetId from '../../services/api/Doenca/getDoencasPorPetId';
import getDoencaPorId from '../../services/api/Doenca/getDoencaPorId';
import getUsuarioByIdComCidadeEstado from '../../services/api/Usuario/getUsuarioByIdComCidadeEstado';

interface PetDonationModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
  pet?: any;
  isEditMode?: boolean;
}

interface Raca {
  id: string | number;
  nome: string;
}

interface PetPayload {
  nome: string;
  especie_id: number;
  raca_id: number;
  estado_id: number;
  cidade_id: number;
  rg_Pet: string | null;
  idade: number;
  faixa_etaria_id: number;
  usuario_id: number;
  sexo_id: number;
  motivoDoacao: string;
  status_id: number;
  doencas: string[];
  foto: any;
}

interface FormData {
  nome: string;
  especie: any;
  raca: string;
  idade: string;
  idadeCategoria: any;
  responsavel: string;
  estado: string;
  cidade: string;
  rgPet: string | null;
  sexo: string;
  possuiDoenca: string;
  doencaDescricao: string;
  motivoDoacao: string;
  foto: any;
}

interface RacasResponse {
  data?: Raca[];
  results?: Raca[];
  [key: string]: any;
}

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

const PetDonationModal: React.FC<PetDonationModalProps> = ({
  visible,
  onClose,
  onSubmit,
  pet = null,
  isEditMode = false,
}) => {
  const router = useRouter();

  // States to store API data
  const [especies, setEspecies] = useState<any[]>([]);
  const [faixasEtarias, setFaixasEtarias] = useState<any[]>([]);
  const [faixasEtariasFiltradas, setFaixasEtariasFiltradas] = useState<any[]>([]);
  const [sexoOpcoes, setSexoOpcoes] = useState<any[]>([]);
  const [racas, setRacas] = useState<any[]>([]);
  const [racasFiltradas, setRacasFiltradas] = useState<any[]>([]);
  const [showRacasModal, setShowRacasModal] = useState<boolean>(false);

  // State to store logged user data
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingFoto, setLoadingFoto] = useState<boolean>(false);

  // ========================================
  // NOVOS ESTADOS PARA LOADING ROBUSTO
  // ========================================
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState<boolean>(false);
  const [isEditDataLoaded, setIsEditDataLoaded] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('Carregando dados...');

  // States for validation errors
  const [especieErro, setEspecieErro] = useState<string>('');
  const [faixaEtariaErro, setFaixaEtariaErro] = useState<string>('');
  const [sexoErro, setSexoErro] = useState<string>('');
  const [idadeErro, setIdadeErro] = useState<string>('');
  const [racaErro, setRacaErro] = useState<string>('');
  const [nomeErro, setNomeErro] = useState<string>('');
  const [possuiDoencaErro, setPossuiDoencaErro] = useState<string>('');
  const [doencaDescricaoErro, setDoencaDescricaoErro] = useState<string>('');
  const [motivoDoacaoErro, setMotivoDoacaoErro] = useState<string>('');
  const [fotoErro, setFotoErro] = useState<string>('');
  const [fotoProcessando, setFotoProcessando] = useState<boolean>(false);
  const [tempoRestanteFoto, setTempoRestanteFoto] = useState<number>(0);

  // Initial form state
  const [formData, setFormData] = useState<FormData>(() => {
    if (isEditMode && pet) {
      return {
        nome: pet.nome || '',
        especie: '',
        raca: pet.raca_nome || '',
        idade: pet.idade ? pet.idade.toString() : '',
        idadeCategoria: '',
        responsavel: '',
        estado: '',
        cidade: '',
        rgPet: pet.rg_Pet || '',
        sexo: '',
        possuiDoenca: '',
        doencaDescricao: '',
        motivoDoacao: pet.motivoDoacao || '',
        foto: pet.foto || null,
      };
    }

    return {
      nome: '',
      especie: '',
      raca: '',
      idade: '',
      idadeCategoria: '',
      responsavel: '',
      estado: '',
      cidade: '',
      rgPet: '',
      sexo: '',
      possuiDoenca: '',
      doencaDescricao: '',
      motivoDoacao: '',
      foto: null,
    };
  });

  // ========================================
  // COMPUTED STATE PARA VERIFICAR SE PODE MOSTRAR O FORMULÁRIO
  // ========================================
  const canShowForm = () => {
    if (!isInitialLoadComplete) return false;
    if (isEditMode && !isEditDataLoaded) return false;
    return true;
  };

  // ========================================
  // FUNÇÃO ESPECÍFICA PARA LIMPAR TODOS OS ERROS
  // ========================================
  const limparTodosOsErros = () => {
    setEspecieErro('');
    setFaixaEtariaErro('');
    setSexoErro('');
    setIdadeErro('');
    setRacaErro('');
    setNomeErro('');
    setPossuiDoencaErro('');
    setDoencaDescricaoErro('');
    setMotivoDoacaoErro('');
    setFotoErro('');
  };

  // ========================================
  // FUNÇÃO PARA RESETAR FORMULÁRIO COMPLETO - CORRIGIDA
  // ========================================
  const resetarFormulario = () => {
    setFormData({
      especie: '',
      nome: '',
      raca: '',
      idadeCategoria: '',
      idade: '',
      responsavel: userData?.nome || '',
      estado: userData?.estado?.nome || '',
      cidade: userData?.cidade?.nome || '',
      rgPet: '',
      sexo: '',
      possuiDoenca: '',
      doencaDescricao: '',
      motivoDoacao: '',
      foto: null,
    });

    // ✅ RESETAR ESTADOS DE FOTO
    setLoadingFoto(false);
    setFotoProcessando(false);
    setTempoRestanteFoto(0);

    // Resetar outros estados
    setShowRacasModal(false);
    setRacasFiltradas([]);
    setFaixasEtariasFiltradas([]);
  };

  // ========================================
  // FUNÇÃO PRINCIPAL PARA FECHAR O MODAL (CORRIGIDA)
  // ========================================
  const handleCloseModal = () => {
    // FORÇA a limpeza IMEDIATA dos erros
    limparTodosOsErros();

    // FORÇA o reset do formulário
    resetarFormulario();

    // Reset loading states
    setIsInitialLoadComplete(false);
    setIsEditDataLoaded(false);
    setLoadingMessage('Carregando dados...');

    // Fechar o modal
    onClose();
  };

  // ========================================
  // MONITORAR VISIBILIDADE DO MODAL
  // ========================================
  useEffect(() => {
    if (!visible) {
      // Usar setTimeout para garantir que a limpeza aconteça
      setTimeout(() => {
        limparTodosOsErros();
        setIsInitialLoadComplete(false);
        setIsEditDataLoaded(false);
      }, 100);
    }
  }, [visible]);

  // ========================================
  // RESTANTE DAS FUNÇÕES (com loading aprimorado)
  // ========================================

  // Function to fetch logged user data
  const fetchUserData = async () => {
    try {
      setLoadingMessage('Carregando dados do usuário...');
      const userId = await AsyncStorage.getItem('@App:userId');

      if (!userId) {
        Alert.alert('Erro', 'Não foi possível identificar o usuário conectado.');
        return;
      }

      const userIdNumber = parseInt(userId, 10);
      const userData = await getUsuarioByIdComCidadeEstado(userIdNumber);

      if (!userData) {
        Alert.alert('Erro', 'Não foi possível carregar os dados do usuário.');
        return;
      }

      setUserData(userData);

      setFormData((prevState) => ({
        ...prevState,
        responsavel: userData.nome,
        cidade: userData.cidade.nome,
        estado: userData.estado.nome,
      }));
    } catch (error) {
      Alert.alert('Erro', 'Falha ao carregar os dados do usuário. Tente novamente.');
    }
  };

  // ========================================
  // LOAD PET DATA IF IN EDIT MODE - VERSÃO APRIMORADA
  // ========================================
  useEffect(() => {
    if (isEditMode && pet && isInitialLoadComplete) {
      const setPetDataToForm = async () => {
        try {
          setIsEditDataLoaded(false);
          setLoadingMessage('Carregando dados do pet para edição...');

          // Verificar se todos os dados básicos estão disponíveis
          if (especies.length === 0 || faixasEtarias.length === 0 || sexoOpcoes.length === 0) {
            return;
          }

          // Encontrar a espécie do pet
          const especieData = especies.find((e) => e.id === pet.especie_id);

          // Carregar raças se temos espécie ou raca_id
          if (!especieData && pet.raca_id) {
            setLoadingMessage('Carregando raças...');
            const raca = racas.find((r) => r.id === pet.raca_id);
            if (raca) {
              const especiePorRaca = especies.find((e) => e.id === raca.especie_id);
              if (especiePorRaca) {
                await loadRacasByEspecie(especiePorRaca.id);
              }
            }
          } else if (especieData) {
            setLoadingMessage('Carregando raças...');
            await loadRacasByEspecie(especieData.id);
          }

          // Encontrar faixa etária e sexo
          const faixaEtaria = faixasEtarias.find((f) => f.id === pet.faixa_etaria_id);
          const sexoData = sexoOpcoes.find((s) => s.id === pet.sexo_id);

          // Carregar doenças
          let possuiDoenca = 'Não';
          let doencaDescricao = '';

          try {
            setLoadingMessage('Carregando histórico de doenças...');
            const doencasResponse = await getDoencasPorPetId(pet.id);

            if (doencasResponse && Array.isArray(doencasResponse) && doencasResponse.length > 0) {
              possuiDoenca = 'Sim';
              const doencaId = doencasResponse[0].doencaDeficiencia_id;

              if (doencaId) {
                try {
                  const doencaDetalhes = await getDoencaPorId(doencaId);
                  if (doencaDetalhes && (doencaDetalhes.nome || doencaDetalhes.descricao)) {
                    doencaDescricao = doencaDetalhes.nome || doencaDetalhes.descricao;
                  } else {
                    doencaDescricao = doencasResponse[0].doenca_nome || 'Doença não especificada';
                  }
                } catch (doencaDetalhesError) {
                  doencaDescricao = doencasResponse[0].doenca_nome || 'Doença não especificada';
                }
              } else {
                doencaDescricao = doencasResponse[0].doenca_nome || 'Doença não especificada';
              }
            }
          } catch (doencasError) {}

          setLoadingMessage('Finalizando carregamento...');

          // Atualizar formulário com todos os dados
          setFormData({
            nome: pet.nome || '',
            especie: especieData || '',
            raca: pet.raca_nome || '',
            idade: pet.idade ? pet.idade.toString() : '',
            idadeCategoria: faixaEtaria || '',
            responsavel: userData?.nome || '',
            estado: userData?.estado?.nome || '',
            cidade: userData?.cidade?.nome || '',
            rgPet: pet.rg_Pet ? formatRG(pet.rg_Pet) : '',
            sexo: sexoData ? sexoData.nome || sexoData.descricao : '',
            possuiDoenca: possuiDoenca,
            doencaDescricao: doencaDescricao,
            motivoDoacao: pet.motivoDoacao || '',
            foto: pet.foto || null,
          });

          // Filtrar faixas etárias se temos espécie
          if (especieData) {
            const faixasFiltradas = faixasEtarias.filter((faixa) => faixa.especie_id === especieData.id);
            setFaixasEtariasFiltradas(faixasFiltradas);
          }

          setIsEditDataLoaded(true);
        } catch (error) {
          Alert.alert('Erro', 'Falha ao carregar dados do pet para edição.');
          setIsEditDataLoaded(true); // Permitir que continue mesmo com erro
        }
      };

      setPetDataToForm();
    } else if (!isEditMode) {
      // Se não é modo de edição, marca como carregado imediatamente
      setIsEditDataLoaded(true);
    }
  }, [isEditMode, pet, isInitialLoadComplete, especies, faixasEtarias, sexoOpcoes, racas, userData]);

  // ========================================
  // FETCH DATA FROM APIS WHEN COMPONENT MOUNTS - VERSÃO APRIMORADA
  // ========================================
  useEffect(() => {
    if (!visible) return; // Só carregar se modal estiver visível

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setIsInitialLoadComplete(false);
        setIsEditDataLoaded(false);

        // Carregar dados do usuário primeiro
        await fetchUserData();

        // Carregar espécies
        setLoadingMessage('Carregando espécies...');
        const especiesData = await getEspecies();
        if (Array.isArray(especiesData)) {
          setEspecies(especiesData);
        } else if (especiesData && typeof especiesData === 'object') {
          const dataArray = especiesData.data || especiesData.results || Object.values(especiesData);
          if (Array.isArray(dataArray)) {
            setEspecies(dataArray);
          } else {
            setEspecies([]);
          }
        } else {
          setEspecies([]);
        }

        // Carregar faixas etárias
        setLoadingMessage('Carregando faixas etárias...');
        const faixasEtariasData = await getFaixaEtaria();
        if (Array.isArray(faixasEtariasData)) {
          setFaixasEtarias(faixasEtariasData);
        } else if (faixasEtariasData && typeof faixasEtariasData === 'object') {
          const dataArray = faixasEtariasData.data || faixasEtariasData.results || Object.values(faixasEtariasData);
          if (Array.isArray(dataArray)) {
            setFaixasEtarias(dataArray);
          } else {
            setFaixasEtarias([]);
          }
        } else {
          setFaixasEtarias([]);
        }

        setFaixasEtariasFiltradas([]);

        // Carregar opções de sexo
        setLoadingMessage('Carregando opções de sexo...');
        const sexoPetData = await getSexoPet();
        if (Array.isArray(sexoPetData)) {
          setSexoOpcoes(sexoPetData);
        } else if (sexoPetData && typeof sexoPetData === 'object') {
          const dataArray = sexoPetData.data || sexoPetData.results || Object.values(sexoPetData);
          if (Array.isArray(dataArray)) {
            setSexoOpcoes(dataArray);
          } else {
            setSexoOpcoes([]);
          }
        } else {
          setSexoOpcoes([]);
        }

        setIsInitialLoadComplete(true);

        // Se não é modo de edição, pode mostrar o formulário agora
        if (!isEditMode) {
          setIsEditDataLoaded(true);
        }
      } catch (error) {
        Alert.alert('Erro', 'Falha ao carregar os dados. Tente novamente.');
        setIsInitialLoadComplete(true); // Permitir que continue mesmo com erro
        setIsEditDataLoaded(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [visible, isEditMode]);

  // Function to load races based on selected species
  const loadRacasByEspecie = async (especieId: number) => {
    try {
      setFormData((prev) => ({ ...prev, raca: '' }));
      setRacasFiltradas([]);

      const racasData = await getRacasPorEspecie(especieId);

      if (Array.isArray(racasData)) {
        setRacasFiltradas(racasData as Raca[]);
      } else if (racasData && typeof racasData === 'object') {
        const typedData = racasData as RacasResponse;
        const dataArray = typedData.data || typedData.results || Object.values(typedData);

        if (Array.isArray(dataArray)) {
          setRacasFiltradas(dataArray as Raca[]);
        } else {
          setRacasFiltradas([]);
        }
      } else {
        setRacasFiltradas([]);
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao carregar raças para esta espécie. Tente novamente.');
    }
  };

  // Function to validate age based on selected age range
  const validarIdade = (idade: string, faixaEtaria: any) => {
    if (!idade || !faixaEtaria) return true;

    const idadeNum = parseInt(idade, 10);
    if (isNaN(idadeNum)) return false;

    const idadeMin = faixaEtaria.idade_min || 0;
    const idadeMax = faixaEtaria.idade_max || Infinity;

    return idadeNum >= idadeMin && idadeNum <= idadeMax;
  };

  // Function to update form state
  const handleChange = (name: keyof FormData, value: string | any) => {
    if (name === 'responsavel' || name === 'cidade' || name === 'estado') {
      return;
    }

    if (name === 'idade') {
      if (value && !/^\d*$/.test(value)) {
        return;
      }

      setFormData((prevState) => ({
        ...prevState,
        [name]: value,
      }));

      if (value && formData.idadeCategoria) {
        const idadeNum = parseInt(value, 10);
        const idadeMin = formData.idadeCategoria.idade_min || 0;
        const idadeMax = formData.idadeCategoria.idade_max || Infinity;

        if ((idadeMax !== null && idadeNum > idadeMax) || idadeNum < idadeMin) {
          let mensagemErro;
          if (formData.idadeCategoria.idade_max === null) {
            mensagemErro = `A idade deve ser ${idadeMin} ou mais`;
          } else {
            mensagemErro = `A idade deve estar entre ${idadeMin} e ${idadeMax}`;
          }
          setIdadeErro(mensagemErro);
        } else {
          setIdadeErro('');
        }
      } else {
        setIdadeErro('');
      }

      return;
    }

    if (name === 'nome') {
      if (value.length > 50) {
        value = value.slice(0, 50);
      }
    }

    if (name === 'motivoDoacao') {
      if (value.length > 300) {
        value = value.slice(0, 300);
      }
    }

    if (name === 'doencaDescricao') {
      if (value.length > 300) {
        value = value.slice(0, 300);
      }
    }

    if (name === 'foto') {
      setFormData((prevState) => {
        const newState = { ...prevState, [name]: value };

        return newState;
      });

      // Limpar erro de foto se valor válido
      if (value) {
        setFotoErro('');
      }

      return;
    }

    if (value) {
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
        case 'idadeCategoria':
          setFaixaEtariaErro('');
          break;
        case 'sexo':
          setSexoErro('');
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
        default:
          break;
      }
    }

    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));

    if (name === 'especie' && value) {
      const faixasFiltradas = faixasEtarias.filter((faixa) => {
        return faixa.especie_id === value.id;
      });

      setFaixasEtariasFiltradas(faixasFiltradas);

      loadRacasByEspecie(Number(value.id));

      setFormData((prev) => ({ ...prev, idadeCategoria: '', idade: '', raca: '' }));
      setIdadeErro('');
      setRacaErro('');
    }

    if (name === 'idadeCategoria') {
      setFormData((prev) => ({ ...prev, idade: '' }));
      setIdadeErro('');
    }
  };

  const validateIdade = () => {
    if (formData.idadeCategoria && formData.idade) {
      const idadeNum = parseInt(formData.idade, 10);
      const idadeMin = formData.idadeCategoria.idade_min || 0;
      const idadeMax = formData.idadeCategoria.idade_max || Infinity;

      if ((idadeMax !== null && idadeNum > idadeMax) || idadeNum < idadeMin) {
        let mensagemErro;
        if (formData.idadeCategoria.idade_max === null) {
          mensagemErro = `A idade deve ser ${idadeMin} ou mais`;
        } else {
          mensagemErro = `A idade deve estar entre ${idadeMin} e ${idadeMax}`;
        }
        setIdadeErro(mensagemErro);
      } else {
        setIdadeErro('');
      }
    }
  };

  const getDescricao = (obj: any) => {
    if (!obj) return '';

    if (obj.descricao) return obj.descricao;
    if (obj.description) return obj.description;
    if (obj.nome) return obj.nome;
    if (obj.name) return obj.name;

    return JSON.stringify(obj);
  };

  const getSelectedRacaId = () => {
    if (!formData.raca) return null;

    const racaEncontrada = racasFiltradas.find((raca) => getDescricao(raca) === formData.raca);

    return racaEncontrada ? racaEncontrada.id : null;
  };

  const getSexoIdFromDescription = (sexoDescricao: string) => {
    if (!sexoDescricao) return null;

    const sexoEncontrado = sexoOpcoes.find((sexo) => getDescricao(sexo) === sexoDescricao);

    return sexoEncontrado ? sexoEncontrado.id : null;
  };

  // ========================================
  // HANDLE SUBMIT COM VERIFICAÇÃO DE LOADING
  // ========================================
  const handleSubmit = async () => {
    if (fotoProcessando) {
      Alert.alert(
        'Aguarde um momento',
        `A foto ainda está sendo processada. Aguarde ${tempoRestanteFoto} segundos e tente novamente.`,
        [{ text: 'OK' }]
      );
      return;
    }
    if (formData.foto && typeof formData.foto === 'string' && formData.foto.startsWith('file://')) {
      // Aguardar um pouco mais para garantir que a foto está estável
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    // ✅ VERIFICAÇÃO APRIMORADA DE LOADING
    if (!canShowForm()) {
      Alert.alert('Aguarde', 'Os dados ainda estão sendo carregados. Aguarde um momento e tente novamente.');
      return;
    }

    if (isEditMode && (!formData.especie || !formData.idadeCategoria || !formData.sexo)) {
      Alert.alert('Aviso', 'Aguarde o carregamento completo dos dados antes de atualizar');
      return;
    }

    // ✅ VERIFICAÇÃO ESPECÍFICA PARA NOVA FOTO
    if (formData.foto && typeof formData.foto === 'string' && formData.foto.startsWith('file://')) {
      // Aguardar um pouco mais para garantir que a foto está estável
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    let isValid = true;

    // === VALIDAÇÕES (manter todas as validações existentes) ===
    if (!formData.especie) {
      setEspecieErro('Selecione uma espécie');
      isValid = false;
    } else {
      setEspecieErro('');
    }

    if (formData.especie && !formData.idadeCategoria) {
      setFaixaEtariaErro('Selecione uma faixa etária');
      isValid = false;
    } else {
      setFaixaEtariaErro('');
    }

    if (formData.idadeCategoria && !formData.idade) {
      setIdadeErro('Por favor insira a idade');
      isValid = false;
    } else if (formData.idade && formData.idadeCategoria) {
      const idadeValida = validarIdade(formData.idade, formData.idadeCategoria);
      if (!idadeValida) {
        const idadeMin = formData.idadeCategoria.idade_min || 0;

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
      setSexoErro('Por favor selecione o sexo');
      isValid = false;
    } else {
      setSexoErro('');
    }

    if (!formData.raca) {
      setRacaErro('Selecione uma raça');
      isValid = false;
    } else {
      setRacaErro('');
    }

    if (!formData.nome) {
      setNomeErro('Por favor insira um nome');
      isValid = false;
    } else {
      setNomeErro('');
    }

    if (!formData.possuiDoenca) {
      setPossuiDoencaErro('Por favor, indique se há doenças/deficiências');
      isValid = false;
    } else {
      setPossuiDoencaErro('');
    }

    if (formData.possuiDoenca === 'Sim' && !formData.doencaDescricao) {
      setDoencaDescricaoErro('Por favor descreva a doença/deficiência');
      isValid = false;
    } else {
      setDoencaDescricaoErro('');
    }

    if (!formData.motivoDoacao) {
      setMotivoDoacaoErro('Por favor insira o motivo da doação');
      isValid = false;
    } else {
      setMotivoDoacaoErro('');
    }

    if (!isEditMode && !formData.foto) {
      setFotoErro('Selecione uma foto');
      isValid = false;
    } else {
      setFotoErro('');
    }

    if (!isValid) {
      Alert.alert('Campos Obrigatórios', 'Por favor, preencha todos os campos obrigatórios corretamente.');
      return;
    }

    try {
      const userId = await AsyncStorage.getItem('@App:userId');

      if (!userId) {
        Alert.alert('Erro', 'Não foi possível identificar o usuário conectado.');
        return;
      }

      // ✅ PROCESSAMENTO CORRETO DA FOTO - IGUAL AO PERFIL DE USUÁRIO
      let fotoProcessada = null;

      if (formData.foto) {
        if (typeof formData.foto === 'string' && formData.foto.startsWith('file://')) {
          // ✅ NOVA FOTO selecionada do dispositivo (URI local)
          const filename = formData.foto.split('/').pop() || `pet_${Date.now()}.jpg`;
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image/jpeg';

          fotoProcessada = {
            uri: formData.foto,
            type: type,
            name: `${formData.nome.replace(/\s+/g, '_')}_${Date.now()}.${match ? match[1] : 'jpg'}`,
          };
        } else if (typeof formData.foto === 'string' && formData.foto.startsWith('http')) {
          // ✅ FOTO EXISTENTE (URL completa) - manter como string
          fotoProcessada = formData.foto;
        } else {
          // ✅ Caso não seja nem file:// nem http://, tratar como nova foto

          fotoProcessada = {
            uri: formData.foto,
            type: 'image/jpeg',
            name: `${formData.nome.replace(/\s+/g, '_')}_${Date.now()}.jpg`,
          };
        }
      } else {
      }

      const petPayload: PetPayload = {
        nome: formData.nome,
        especie_id: formData.especie.id,
        raca_id: getSelectedRacaId(),
        idade: parseInt(formData.idade, 10) || 0,
        faixa_etaria_id: formData.idadeCategoria.id,
        usuario_id: parseInt(userId, 10),
        estado_id: userData?.estado.id || 0,
        cidade_id: userData?.cidade.id || 0,
        rg_Pet: formData.rgPet || null,
        sexo_id: getSexoIdFromDescription(formData.sexo),
        motivoDoacao: formData.motivoDoacao,
        status_id: 1,
        doencas: formData.possuiDoenca === 'Sim' && formData.doencaDescricao ? [formData.doencaDescricao] : [],
        foto: fotoProcessada, // ✅ Agora processada corretamente
      };

      setIsLoading(true);

      let response;
      if (isEditMode && pet) {
        response = await updatePet({
          id: pet.id,
          ...petPayload,
        });
        if (response) {
          Alert.alert('Success', 'Pet atualizado com sucesso!');
        }
      } else {
        response = await postPet(petPayload);
        if (response) {
          Alert.alert('Success', 'Pet cadastrado com sucesso!');
        }
      }

      if (response) {
        onSubmit(formData);

        // ========================================
        // USAR AS NOVAS FUNÇÕES PARA LIMPEZA
        // ========================================
        resetarFormulario();
        limparTodosOsErros();

        onClose();
      } else {
        Alert.alert('Erro', 'Não foi possível registrar o pet. Tente novamente.');
      }
    } catch (error) {
      let errorMessage = 'Ocorreu um erro ao processar sua solicitação. Tente novamente.';

      // ✅ TRATAMENTO DE ERRO MAIS ESPECÍFICO
      if (error instanceof Error) {
        errorMessage = error.message;
      } else {
      }

      Alert.alert('Erro', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseAndNavigate = () => {
    limparTodosOsErros();
    resetarFormulario();
    onClose();
    router.push('/pages/PetDonation');
  };

  const openRacasModal = () => {
    if (!formData.especie) {
      setRacaErro('Selecione uma espécie primeiro');
      return;
    }

    if (racasFiltradas.length === 0) {
      Alert.alert('Warning', 'Nenhuma raça disponível para esta espécie.');
      return;
    }

    setShowRacasModal(true);
  };

  const selectRaca = (raca: any) => {
    setFormData((prev) => ({
      ...prev,
      raca: getDescricao(raca),
    }));
    setRacaErro('');
    setShowRacasModal(false);
  };

  const getIdadePlaceholder = () => {
    if (!formData.idadeCategoria) return 'Idade específica (opcional)';

    const idadeMin = formData.idadeCategoria.idade_min !== undefined ? formData.idadeCategoria.idade_min : '';

    if (formData.idadeCategoria.idade_max === null) {
      return `Idade específica (${idadeMin} ou mais)`;
    } else {
      const idadeMax = formData.idadeCategoria.idade_max !== undefined ? formData.idadeCategoria.idade_max : '∞';
      return `Idade específica (Entre ${idadeMin} e ${idadeMax})`;
    }
  };

  const getIdadeLimites = () => {
    if (!formData.idadeCategoria) return '';

    const idadeMin = formData.idadeCategoria.idade_min !== undefined ? formData.idadeCategoria.idade_min : '0';

    if (formData.idadeCategoria.idade_max === null) {
      return `${idadeMin} anos ou mais`;
    } else {
      const idadeMax = formData.idadeCategoria.idade_max !== undefined ? formData.idadeCategoria.idade_max : '∞';
      return `${idadeMin} - ${idadeMax} ${formData.idadeCategoria.unidade || 'anos'}`;
    }
  };

  const pickImage = async () => {
    try {
      setLoadingFoto(true);

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Precisamos de permissão para acessar suas fotos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        const imageUri = result.assets[0].uri;
        if (imageUri && imageUri.startsWith('file://')) {
          // ✅ INICIAR PERÍODO DE PROCESSAMENTO COM FEEDBACK VISUAL
          setFotoProcessando(true);
          setTempoRestanteFoto(5); // 5 segundos de espera

          // ✅ ATUALIZAR ESTADO DA FOTO IMEDIATAMENTE
          setFormData((prevData) => {
            const newData = { ...prevData, foto: imageUri };

            return newData;
          });

          // ✅ LIMPAR ERRO DE FOTO
          setFotoErro('');

          // ✅ COUNTDOWN COM FEEDBACK VISUAL
          const countdown = setInterval(() => {
            setTempoRestanteFoto((prev) => {
              if (prev <= 1) {
                clearInterval(countdown);
                setFotoProcessando(false);

                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        } else {
          Alert.alert('Erro', 'URI da imagem inválida. Tente novamente.');
        }
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível selecionar a imagem. Tente novamente.');
    } finally {
      setLoadingFoto(false);
    }
  };

  const formatRG = (text: string): string => {
    const digits = text.replace(/\D/g, '');
    const limitedDigits = digits.slice(0, 9);
    let formatted = '';

    if (limitedDigits.length > 0) {
      formatted = limitedDigits.slice(0, 2);

      if (limitedDigits.length > 2) {
        formatted += '.' + limitedDigits.slice(2, 5);

        if (limitedDigits.length > 5) {
          formatted += '.' + limitedDigits.slice(5, 8);

          if (limitedDigits.length > 8) {
            formatted += '-' + limitedDigits.slice(8, 9);
          }
        }
      }
    }

    return formatted;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={handleCloseModal}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>Dados Do Pet</Text>
            {/* ========================================
                BOTÃO CORRIGIDO PARA USAR handleCloseModal
                ======================================== */}
            <TouchableOpacity onPress={handleCloseModal}>
              <Image source={require('../../assets/images/Icone/close-icon.png')} style={styles.closeIcon} />
            </TouchableOpacity>
          </View>

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
                maxLength={50}
              />
              {nomeErro ? <Text style={styles.errorText}>{nomeErro}</Text> : null}
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

              {!formData.especie && (
                <Text style={styles.infoText}>Selecione uma espécie para ver as raças disponíveis</Text>
              )}
            </View>
            <RacasSelectionModal
              visible={showRacasModal}
              racasFiltradas={racasFiltradas}
              onClose={() => setShowRacasModal(false)}
              onSelectRaca={(raca) => {
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

              {formData.idadeCategoria ? (
                <View>
                  <TextInput
                    style={[styles.input, { marginTop: 10 }, idadeErro ? styles.inputError : {}]}
                    placeholder={getIdadePlaceholder()}
                    value={formData.idade}
                    keyboardType="numeric"
                    onChangeText={(value) => handleChange('idade', value)}
                    onBlur={validateIdade}
                    maxLength={50}
                  />
                  {idadeErro ? <Text style={styles.errorText}>{idadeErro}</Text> : null}

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
                editable={false}
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
                editable={false}
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
                editable={false}
              />
              <Text style={styles.infoText}>Campo preenchido automaticamente com sua cidade</Text>
            </View>

            {/* Rg do Pet  */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>RG do Pet</Text>
              <TextInput
                style={styles.input}
                placeholder="RG do Pet (00.000.000-0)"
                keyboardType="numeric"
                value={formData.rgPet || ''}
                onChangeText={(value) => {
                  const formattedValue = formatRG(value);
                  handleChange('rgPet', formattedValue);
                }}
              />
              <Text style={styles.infoText}>Informe o RG do pet se disponível</Text>
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
                  maxLength={300}
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
                maxLength={300}
                value={formData.motivoDoacao}
                onChangeText={(value) => handleChange('motivoDoacao', value)}
              />
              {motivoDoacaoErro ? <Text style={styles.errorText}>{motivoDoacaoErro}</Text> : null}
            </View>

            {/* SEÇÃO DE FOTO MODIFICADA COM LOADING - CORRIGIDA */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Foto <Text style={styles.required}>*</Text>
              </Text>

              <TouchableOpacity
                style={[styles.photoUploadButton, (loadingFoto || fotoProcessando) && styles.photoUploadDisabled]}
                onPress={pickImage}
                disabled={loadingFoto || fotoProcessando}
              >
                {loadingFoto ? (
                  <View style={styles.photoLoadingContainer}>
                    <ActivityIndicator size="large" color="#4B99FB" />
                    <Text style={styles.photoLoadingText}>Selecionando imagem...</Text>
                  </View>
                ) : fotoProcessando ? (
                  <View style={styles.photoLoadingContainer}>
                    <ActivityIndicator size="large" color="#4B99FB" />
                    <Text style={styles.photoLoadingText}>
                      Processando imagem...{'\n'}
                      Aguarde {tempoRestanteFoto} segundos
                    </Text>
                  </View>
                ) : formData.foto ? (
                  <Image source={{ uri: formData.foto }} style={styles.photoPreview} />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Text style={styles.uploadText}>Selecionar foto</Text>
                  </View>
                )}
              </TouchableOpacity>

              {fotoErro ? <Text style={styles.errorText}>{fotoErro}</Text> : null}

              <Text style={styles.infoText}>
                {loadingFoto
                  ? 'Selecionando imagem da galeria...'
                  : fotoProcessando
                  ? `Aguarde ${tempoRestanteFoto} segundos para a foto ser processada`
                  : 'Clique para selecionar uma foto da galeria'}
              </Text>
            </View>

            {/* BOTÃO SALVAR MODIFICADO COM LOADING - CORRIGIDO */}
            <TouchableOpacity
              style={[styles.saveButton, (isLoading || loadingFoto || fotoProcessando) && styles.saveButtonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading || loadingFoto || fotoProcessando}
            >
              {isLoading ? (
                <View style={styles.loadingButtonContainer}>
                  <ActivityIndicator size="small" color="#FFFFFF" style={styles.loadingButtonIcon} />
                  <Text style={styles.saveButtonText}>{isEditMode ? 'Atualizando...' : 'Salvando...'}</Text>
                </View>
              ) : fotoProcessando ? (
                <View style={styles.loadingButtonContainer}>
                  <ActivityIndicator size="small" color="#FFFFFF" style={styles.loadingButtonIcon} />
                  <Text style={styles.saveButtonText}>Aguarde a foto carregar ({tempoRestanteFoto}s)</Text>
                </View>
              ) : loadingFoto ? (
                <View style={styles.loadingButtonContainer}>
                  <ActivityIndicator size="small" color="#FFFFFF" style={styles.loadingButtonIcon} />
                  <Text style={styles.saveButtonText}>Selecionando foto...</Text>
                </View>
              ) : (
                <Text style={styles.saveButtonText}>Salvar</Text>
              )}
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
  photoUploadDisabled: {
    opacity: 0.7,
  },
  photoLoadingContainer: {
    width: 120,
    height: 120,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoLoadingText: {
    color: '#4B99FB',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
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
  saveButtonDisabled: {
    backgroundColor: '#B0B0B0',
    opacity: 0.7,
  },
  loadingButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingButtonIcon: {
    marginRight: 8,
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
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 15,
    color: '#333',
    textAlign: 'center',
  },
  // ========================================
  // NOVOS ESTILOS PARA LOADING APRIMORADO
  // ========================================
  loadingProgressContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  loadingProgressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  loadingProgressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E0E0E0',
    marginRight: 10,
  },
  loadingProgressDotComplete: {
    backgroundColor: '#4B99FB',
  },
  loadingProgressText: {
    fontSize: 14,
    color: '#666',
  },
  cancelLoadingButton: {
    marginTop: 40,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CCCCCC',
  },
  cancelLoadingButtonText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  photoPreview: {
    width: 120,
    height: 120,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CCCCCC',
  },
  readonlyInput: {
    backgroundColor: '#f0f0f0',
    color: '#666',
    opacity: 0.8,
  },
});

export default PetDonationModal;
