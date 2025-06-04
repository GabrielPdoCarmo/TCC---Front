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
  // FUNÇÃO ESPECÍFICA PARA LIMPAR TODOS OS ERROS
  // ========================================
  const limparTodosOsErros = () => {
    console.log('🧹 Limpando todos os erros...'); // Debug
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
    console.log('✅ Todos os erros foram limpos'); // Debug
  };

  // ========================================
  // FUNÇÃO PARA RESETAR FORMULÁRIO COMPLETO
  // ========================================
  const resetarFormulario = () => {
    console.log('🔄 Resetando formulário...'); // Debug
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
    
    // Resetar outros estados
    setShowRacasModal(false);
    setRacasFiltradas([]);
    setFaixasEtariasFiltradas([]);
    console.log('✅ Formulário resetado'); // Debug
  };

  // ========================================
  // FUNÇÃO PRINCIPAL PARA FECHAR O MODAL (CORRIGIDA)
  // ========================================
  const handleCloseModal = () => {
    console.log('🔧 INICIANDO fechamento do modal...'); // Debug
    
    // FORÇA a limpeza IMEDIATA dos erros
    limparTodosOsErros();
    
    // FORÇA o reset do formulário
    resetarFormulario();
    
    // Fechar o modal
    onClose();
    
    console.log('✅ Modal fechado com sucesso!'); // Debug
  };

  // ========================================
  // MONITORAR VISIBILIDADE DO MODAL
  // ========================================
  useEffect(() => {
    console.log('👁️ Visibilidade do modal mudou:', visible); // Debug
    
    if (!visible) {
      console.log('❌ Modal ficou invisível, executando limpeza adicional...'); // Debug
      
      // Usar setTimeout para garantir que a limpeza aconteça
      setTimeout(() => {
        limparTodosOsErros();
        console.log('🧹 Limpeza adicional concluída'); // Debug
      }, 100);
    }
  }, [visible]);

  // ========================================
  // RESTANTE DAS FUNÇÕES (sem alterações significativas)
  // ========================================

  // Function to fetch logged user data
  const fetchUserData = async () => {
    try {
      const userId = await AsyncStorage.getItem('@App:userId');

      if (!userId) {
        console.error('ID do usuário não encontrado no AsyncStorage');
        Alert.alert('Error', 'Não foi possível identificar o usuário conectado.');
        return;
      }

      const userIdNumber = parseInt(userId, 10);
      const userData = await getUsuarioByIdComCidadeEstado(userIdNumber);

      if (!userData) {
        console.error('Dados do usuário não encontrados');
        Alert.alert('Error', 'Não foi possível carregar os dados do usuário.');
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
      console.error('Erro ao buscar dados do usuário:', error);
      Alert.alert('Error', 'Falha ao carregar os dados do usuário. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load pet data if in edit mode
  useEffect(() => {
    if (isEditMode && pet) {
      const setPetDataToForm = async () => {
        try {
          setIsLoading(true);
          if (especies.length === 0 || faixasEtarias.length === 0 || sexoOpcoes.length === 0) {
            console.log('Esperando carregamento completo dos dados...');
            return;
          }

          const especieData = especies.find((e) => e.id === pet.especie_id);

          if (!especieData && pet.raca_id) {
            const raca = racas.find((r) => r.id === pet.raca_id);
            if (raca) {
              const especiePorRaca = especies.find((e) => e.id === raca.especie_id);
              if (especiePorRaca) {
                await loadRacasByEspecie(especiePorRaca.id);
              }
            }
          } else if (especieData) {
            await loadRacasByEspecie(especieData.id);
          }

          const faixaEtaria = faixasEtarias.find((f) => f.id === pet.faixa_etaria_id);
          const sexoData = sexoOpcoes.find((s) => s.id === pet.sexo_id);

          let possuiDoenca = 'Não';
          let doencaDescricao = '';

          try {
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
                  console.error('Erro ao buscar detalhes da doença:', doencaDetalhesError);
                  doencaDescricao = doencasResponse[0].doenca_nome || 'Doença não especificada';
                }
              } else {
                doencaDescricao = doencasResponse[0].doenca_nome || 'Doença não especificada';
              }
            }
          } catch (doencasError) {
            console.error('Erro ao buscar doenças do pet:', doencasError);
            Alert.alert('Erro', 'Falha ao carregar doenças do pet.');
          }

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

          if (especieData) {
            const faixasFiltradas = faixasEtarias.filter((faixa) => faixa.especie_id === especieData.id);
            setFaixasEtariasFiltradas(faixasFiltradas);
          }
        } catch (error) {
          console.error('Erro ao carregar dados do pet para edição:', error);
          Alert.alert('Erro', 'Falha ao carregar dados do pet para edição.');
        } finally {
          setIsLoading(false);
        }
      };

      if (especies.length > 0 && faixasEtarias.length > 0 && sexoOpcoes.length > 0) {
        setPetDataToForm();
      }
    }
  }, [isEditMode, pet, especies, faixasEtarias, sexoOpcoes, racas]);

  // Fetch data from APIs when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        await fetchUserData();

        const especiesData = await getEspecies();
        if (Array.isArray(especiesData)) {
          setEspecies(especiesData);
        } else if (especiesData && typeof especiesData === 'object') {
          const dataArray = especiesData.data || especiesData.results || Object.values(especiesData);
          if (Array.isArray(dataArray)) {
            setEspecies(dataArray);
          } else {
            console.error('O formato de resposta da espécie não é uma matriz:', especiesData);
            setEspecies([]);
          }
        } else {
          console.error('Formato de resposta para espécies desconhecidas:', especiesData);
          setEspecies([]);
        }

        const faixasEtariasData = await getFaixaEtaria();
        if (Array.isArray(faixasEtariasData)) {
          setFaixasEtarias(faixasEtariasData);
        } else if (faixasEtariasData && typeof faixasEtariasData === 'object') {
          const dataArray = faixasEtariasData.data || faixasEtariasData.results || Object.values(faixasEtariasData);
          if (Array.isArray(dataArray)) {
            setFaixasEtarias(dataArray);
          } else {
            console.error('O formato de resposta da faixa etária não é uma matriz:', faixasEtariasData);
            setFaixasEtarias([]);
          }
        } else {
          console.error('Formato de resposta de faixa etária desconhecida:', faixasEtariasData);
          setFaixasEtarias([]);
        }

        setFaixasEtariasFiltradas([]);

        const sexoPetData = await getSexoPet();
        if (Array.isArray(sexoPetData)) {
          setSexoOpcoes(sexoPetData);
        } else if (sexoPetData && typeof sexoPetData === 'object') {
          const dataArray = sexoPetData.data || sexoPetData.results || Object.values(sexoPetData);
          if (Array.isArray(dataArray)) {
            setSexoOpcoes(dataArray);
          } else {
            console.error('O formato de resposta sexual não é uma matriz:', sexoPetData);
            setSexoOpcoes([]);
          }
        } else {
          console.error('Formato de resposta de sexo desconhecido:', sexoPetData);
          setSexoOpcoes([]);
        }
      } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error);
        Alert.alert('Error', 'Falha ao carregar os dados. Tente novamente.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

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
          console.error('O formato de resposta de raça não é uma matriz:', racasData);
          setRacasFiltradas([]);
        }
      } else {
        console.error('Formato de resposta de raça desconhecido:', racasData);
        setRacasFiltradas([]);
      }
    } catch (error) {
      console.error('Erro ao carregar raças para esta espécie:', error);
      Alert.alert('Error', 'Falha ao carregar raças para esta espécie. Tente novamente.');
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
        case 'foto':
          setFotoErro('');
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
      console.log('Espécies selecionadas:', value);

      const faixasFiltradas = faixasEtarias.filter((faixa) => {
        console.log(`Comparação: faixa.especie_id (${faixa.especie_id}) === value.id (${value.id})`);
        return faixa.especie_id === value.id;
      });

      console.log('Faixas filtradas:', faixasFiltradas);
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

  // Function to handle form submission
  const handleSubmit = async () => {
    if (isEditMode && (!formData.especie || !formData.idadeCategoria || !formData.sexo)) {
      Alert.alert('Aviso', 'Aguarde o carregamento completo dos dados antes de atualizar');
      return;
    }
    let isValid = true;

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
        Alert.alert('Error', 'Não foi possível identificar o usuário conectado.');
        return;
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
        foto: formData.foto
          ? {
              uri: formData.foto,
              type: 'image/jpeg',
              name: `pet_${Date.now()}.jpg`,
            }
          : null,
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
        Alert.alert('Error', 'Não foi possível registrar o pet. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao enviar o formulário:', error);
      Alert.alert('Error', 'Ocorreu um erro ao processar sua solicitação. Tente novamente.');
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
        await new Promise((resolve) => setTimeout(resolve, 500));
        handleChange('foto', result.assets[0].uri);
        console.log('Imagem selecionada:', result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
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

  if (isLoading) {
    return (
      <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={handleCloseModal}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4B99FB" />
          <Text style={styles.loadingText}>Carregando dados...</Text>
        </View>
      </Modal>
    );
  }

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

            {/* SEÇÃO DE FOTO MODIFICADA COM LOADING */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Foto <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={[styles.photoUploadButton, loadingFoto && styles.photoUploadDisabled]}
                onPress={pickImage}
                disabled={loadingFoto}
              >
                {loadingFoto ? (
                  <View style={styles.photoLoadingContainer}>
                    <ActivityIndicator size="large" color="#4B99FB" />
                    <Text style={styles.photoLoadingText}>Processando imagem...</Text>
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
                {loadingFoto ? 'Processando imagem...' : 'Clique para selecionar uma foto da galeria'}
              </Text>
            </View>

            {/* BOTÃO SALVAR MODIFICADO COM LOADING */}
            <TouchableOpacity
              style={[styles.saveButton, (isLoading || loadingFoto) && styles.saveButtonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading || loadingFoto}
            >
              {isLoading ? (
                <View style={styles.loadingButtonContainer}>
                  <ActivityIndicator size="small" color="#FFFFFF" style={styles.loadingButtonIcon} />
                  <Text style={styles.saveButtonText}>{isEditMode ? 'Atualizando...' : 'Salvando...'}</Text>
                </View>
              ) : loadingFoto ? (
                <View style={styles.loadingButtonContainer}>
                  <ActivityIndicator size="small" color="#FFFFFF" style={styles.loadingButtonIcon} />
                  <Text style={styles.saveButtonText}>Processando foto...</Text>
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
  },
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
  readonlyInput: {
    backgroundColor: '#f0f0f0',
    color: '#666',
    opacity: 0.8,
  },
});

export default PetDonationModal;