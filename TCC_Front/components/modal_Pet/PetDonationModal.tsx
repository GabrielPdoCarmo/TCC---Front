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
  getDoencasPorPetId,
  getDoencaPorId,
  updatePet, // Add updatePet import
} from '../../services/api';
import RacasSelectionModal from './RacasSelectionModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

// Updated PetDonationModalProps to include pet and isEditMode
interface PetDonationModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
  pet?: any; // Pet object for editing mode
  isEditMode?: boolean; // Flag to determine if in edit mode
}

// Interface for API data
interface Raca {
  id: string | number;
  nome: string;
  // Add any other properties that exist in your race object
}

// Interface for payload sent to API
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
  quantidade: number;
  doencas: string[];
  foto: any;
}

// Interface for the form that matches the actual structure used
interface FormData {
  nome: string;
  especie: any; // Complete species object from API
  raca: string;
  idade: string;
  idadeCategoria: any; // Complete age range object from API
  responsavel: string;
  estado: string;
  cidade: string;
  rgPet: string | null;
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

// Interface for user data
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
  pet = null, // Default to null if not provided
  isEditMode = false // Default to false if not provided
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

  // States for validation errors
  const [especieErro, setEspecieErro] = useState<string>('');
  const [faixaEtariaErro, setFaixaEtariaErro] = useState<string>('');
  const [sexoErro, setSexoErro] = useState<string>('');
  const [idadeErro, setIdadeErro] = useState<string>('');
  const [racaErro, setRacaErro] = useState<string>('');
  const [nomeErro, setNomeErro] = useState<string>('');
  const [quantidadeErro, setQuantidadeErro] = useState<string>('');
  const [possuiDoencaErro, setPossuiDoencaErro] = useState<string>('');
  const [doencaDescricaoErro, setDoencaDescricaoErro] = useState<string>('');
  const [motivoDoacaoErro, setMotivoDoacaoErro] = useState<string>('');
  const [fotoErro, setFotoErro] = useState<string>('');

  // Initial form state - corrected
  const [formData, setFormData] = useState<FormData>({
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
    quantidade: '',
    foto: null,
  });

  // Function to fetch logged user data
  const fetchUserData = async () => {
    try {
      // Use the same '@App:userId' key that was used to store
      const userId = await AsyncStorage.getItem('@App:userId');

      if (!userId) {
        console.error('User ID not found in AsyncStorage');
        Alert.alert('Error', 'Could not identify logged user.');
        return;
      }

      const userIdNumber = parseInt(userId, 10);

      // Rest of the code remains the same...
      const userData = await getUsuarioById(userIdNumber);

      if (!userData) {
        console.error('User data not found');
        Alert.alert('Error', 'Could not load user data.');
        return;
      }

      console.log('User data loaded:', userData);

      setUserData(userData);

      setFormData((prevState) => ({
        ...prevState,
        responsavel: userData.nome,
        cidade: userData.cidade.nome,
        estado: userData.estado.nome,
      }));
    } catch (error) {
      console.error('Error fetching user data:', error);
      Alert.alert('Error', 'Failed to load user data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load pet data if in edit mode
  // Modifique o useEffect para carregamento dos dados do pet no modo de edição
  // Modifique o useEffect para carregamento dos dados do pet no modo de edição
  // Modifique o useEffect para carregamento dos dados do pet no modo de edição
  useEffect(() => {
    if (isEditMode && pet) {
      const setPetDataToForm = async () => {
        try {
          setIsLoading(true);

          // Encontrar a espécie do pet diretamente pelo ID da espécie
          const especieData = especies.find(e => e.id === pet.especie_id);

          // Se não temos a espécie diretamente, tentamos encontrar pela raça
          if (!especieData && pet.raca_id) {
            const raca = racas.find(r => r.id === pet.raca_id);
            if (raca) {
              const especiePorRaca = especies.find(e => e.id === raca.especie_id);
              if (especiePorRaca) {
                // Encontramos a espécie pela raça
                await loadRacasByEspecie(especiePorRaca.id);
              }
            }
          } else if (especieData) {
            // Se encontramos a espécie diretamente, carregamos as raças
            await loadRacasByEspecie(especieData.id);
          }

          // Encontrar a faixa etária correta
          const faixaEtaria = faixasEtarias.find(f => f.id === pet.faixa_etaria_id);

          // Encontrar o sexo do pet
          const sexoData = sexoOpcoes.find(s => s.id === pet.sexo_id);

          console.log('Espécie encontrada:', especieData);
          console.log('Faixa etária encontrada:', faixaEtaria);
          console.log('Sexo encontrado:', sexoData);

          // Buscar doenças do pet da API
          let possuiDoenca = 'Não';
          let doencaDescricao = '';

          try {
            // Buscar as doenças do pet usando a API getDoencasPorPetId
            const doencasResponse = await getDoencasPorPetId(pet.id);
            console.log('Possui Doença:', doencasResponse);

            // Modificação no trecho onde verifica as doenças:
            if (doencasResponse && Array.isArray(doencasResponse) && doencasResponse.length > 0) {
              possuiDoenca = 'Sim';

              // Use a chave correta para o ID da doença
              const doencaId = doencasResponse[0].doencaDeficiencia_id;

              if (doencaId) {
                try {
                  console.log('Tentando buscar doença com ID:', doencaId);
                  const doencaDetalhes = await getDoencaPorId(doencaId);
                  console.log('Detalhes da doença:', doencaDetalhes);

                  // Se a API retornou detalhes válidos da doença
                  if (doencaDetalhes && (doencaDetalhes.nome || doencaDetalhes.descricao)) {
                    doencaDescricao = doencaDetalhes.nome || doencaDetalhes.descricao;
                  } else {
                    // Verifique se já temos o nome da doença na resposta original
                    doencaDescricao = doencasResponse[0].doenca_nome || 'Doença não especificada';
                  }
                } catch (doencaDetalhesError) {
                  console.error('Erro ao buscar detalhes da doença:', doencaDetalhesError);
                  // Em caso de erro, usar o nome da doença da lista inicial se disponível
                  doencaDescricao = doencasResponse[0].doenca_nome || 'Doença não especificada';
                }
              } else {
                console.log('Doença sem ID válido, usando dados disponíveis');
                // Se não houver ID válido, veja se temos o nome diretamente na resposta
                doencaDescricao = doencasResponse[0].doenca_nome || 'Doença não especificada';
              }
            }
          } catch (doencasError) {
            console.error('Erro ao buscar doenças do pet:', doencasError);
            Alert.alert('Erro', 'Falha ao carregar doenças do pet.');
          }

          console.log('Status doença final:', { possuiDoenca, doencaDescricao });

          // Atualizar o formulário com os dados do pet
          setFormData({
            nome: pet.nome || '',
            especie: especieData || '',
            raca: pet.raca_nome || '',
            idade: pet.idade ? pet.idade.toString() : '',
            idadeCategoria: faixaEtaria || '',
            responsavel: userData?.nome || '',
            estado: userData?.estado?.nome || '',
            cidade: userData?.cidade?.nome || '',
            rgPet: pet.rg_Pet || '',
            sexo: sexoData ? (sexoData.nome || sexoData.descricao) : '',
            possuiDoenca: possuiDoenca,
            doencaDescricao: doencaDescricao,
            motivoDoacao: pet.motivoDoacao || '',
            quantidade: pet.quantidade ? pet.quantidade.toString() : '1',
            foto: pet.foto || null,
          });

          // Se tivermos a espécie, filtramos as faixas etárias
          if (especieData) {
            const faixasFiltradas = faixasEtarias.filter(faixa =>
              faixa.especie_id === especieData.id
            );
            setFaixasEtariasFiltradas(faixasFiltradas);
          }

        } catch (error) {
          console.error('Erro ao carregar dados do pet para edição:', error);
          Alert.alert('Erro', 'Falha ao carregar dados do pet para edição.');
        } finally {
          setIsLoading(false);
        }
      };

      // Só tentamos preencher o formulário quando temos todos os dados necessários carregados
      if (especies.length > 0 && faixasEtarias.length > 0 && sexoOpcoes.length > 0) {
        setPetDataToForm();
      }
    }
  }, [isEditMode, pet, especies, faixasEtarias, sexoOpcoes, racas]);



  // Adicione esta função para depurar os valores do formulário quando eles mudam
  useEffect(() => {
    if (isEditMode) {
      console.log('Valores atuais do formulário:', formData);
    }
  }, [formData]);

  // Fetch data from APIs when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch user data
        await fetchUserData();

        // Fetch species
        const especiesData = await getEspecies();
        console.log('especiesData:', especiesData);

        // Important: Check the structure of returned data
        if (Array.isArray(especiesData)) {
          setEspecies(especiesData);
        } else if (especiesData && typeof especiesData === 'object') {
          // If not an array but an object, may be in a property
          // For example: { data: [...] }
          const dataArray = especiesData.data || especiesData.results || Object.values(especiesData);
          if (Array.isArray(dataArray)) {
            setEspecies(dataArray);
          } else {
            console.error('Species response format is not an array:', especiesData);
            setEspecies([]);
          }
        } else {
          console.error('Unknown species response format:', especiesData);
          setEspecies([]);
        }

        // Get age ranges
        const faixasEtariasData = await getFaixaEtaria();
        console.log('faixasEtariasData:', faixasEtariasData);

        // Same treatment for age ranges
        if (Array.isArray(faixasEtariasData)) {
          setFaixasEtarias(faixasEtariasData);
        } else if (faixasEtariasData && typeof faixasEtariasData === 'object') {
          const dataArray = faixasEtariasData.data || faixasEtariasData.results || Object.values(faixasEtariasData);
          if (Array.isArray(dataArray)) {
            setFaixasEtarias(dataArray);
          } else {
            console.error('Age range response format is not an array:', faixasEtariasData);
            setFaixasEtarias([]);
          }
        } else {
          console.error('Unknown age range response format:', faixasEtariasData);
          setFaixasEtarias([]);
        }

        // Initially we won't have filtered ranges until user selects a species
        setFaixasEtariasFiltradas([]);

        // Get pet sex options
        const sexoPetData = await getSexoPet();
        console.log('sexoPetData:', sexoPetData);

        // Same treatment for sex options
        if (Array.isArray(sexoPetData)) {
          setSexoOpcoes(sexoPetData);
        } else if (sexoPetData && typeof sexoPetData === 'object') {
          const dataArray = sexoPetData.data || sexoPetData.results || Object.values(sexoPetData);
          if (Array.isArray(dataArray)) {
            setSexoOpcoes(dataArray);
          } else {
            console.error('Sex response format is not an array:', sexoPetData);
            setSexoOpcoes([]);
          }
        } else {
          console.error('Unknown sex response format:', sexoPetData);
          setSexoOpcoes([]);
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
        Alert.alert('Error', 'Failed to load data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Debug useEffect to check values after loading
  useEffect(() => {
    console.log('Species loaded:', especies);
    console.log('Age ranges loaded:', faixasEtarias);
    console.log('Sex options loaded:', sexoOpcoes);
    console.log('User data loaded:', userData);
  }, [especies, faixasEtarias, sexoOpcoes, userData]);

  // Function to load races based on selected species
  const loadRacasByEspecie = async (especieId: number) => {
    try {
      console.log('Loading races for species ID:', especieId);

      // Reset race state in form
      setFormData((prev) => ({ ...prev, raca: '' }));
      setRacasFiltradas([]);

      // Get races by species
      const racasData = await getRacasPorEspecie(especieId);
      console.log('racasData:', racasData);

      // Process race data with proper type handling
      if (Array.isArray(racasData)) {
        setRacasFiltradas(racasData as Raca[]);
      } else if (racasData && typeof racasData === 'object') {
        // Use type assertion to tell TypeScript about the structure
        const typedData = racasData as RacasResponse;
        const dataArray = typedData.data || typedData.results || Object.values(typedData);

        if (Array.isArray(dataArray)) {
          setRacasFiltradas(dataArray as Raca[]);
        } else {
          console.error('Race response format is not an array:', racasData);
          setRacasFiltradas([]);
        }
      } else {
        console.error('Unknown race response format:', racasData);
        setRacasFiltradas([]);
      }
    } catch (error) {
      console.error('Error loading races for this species:', error);
      Alert.alert('Error', 'Failed to load races for this species. Please try again.');
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
    // Prevent changes to user fields (responsible, city, state)
    if (name === 'responsavel' || name === 'cidade' || name === 'estado') {
      return; // Don't allow changes to these fields
    }

    // Clear error messages when field is filled
    if (value) {
      // Clear specific errors for each field when it's filled
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

    // Special case for age field
    if (name === 'idade') {
      // Check if value is only numeric
      if (value && !/^\d*$/.test(value)) {
        return; // Don't update state if not numeric
      }

      // Clear age error when user starts typing
      setIdadeErro('');

      // Validate age according to selected age range
      if (formData.idadeCategoria && value) {
        const idadeValida = validarIdade(value, formData.idadeCategoria);
        if (!idadeValida) {
          const idadeMin = formData.idadeCategoria.idade_min || 0;

          // Special treatment for case where idade_max is null (elderly)
          let mensagemErro;
          if (formData.idadeCategoria.idade_max === null) {
            mensagemErro = `Age must be ${idadeMin} or more`;
          } else {
            mensagemErro = `Age must be between ${idadeMin} and ${formData.idadeCategoria.idade_max}`;
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

    // If species was changed, filter corresponding age ranges and load races
    if (name === 'especie' && value) {
      console.log('Selected species:', value);

      // Filter age ranges by especie_id
      const faixasFiltradas = faixasEtarias.filter((faixa) => {
        console.log(`Comparing: faixa.especie_id (${faixa.especie_id}) === value.id (${value.id})`);
        return faixa.especie_id === value.id;
      });

      console.log('Filtered ranges:', faixasFiltradas);
      setFaixasEtariasFiltradas(faixasFiltradas);

      // Load races for this species
      loadRacasByEspecie(Number(value.id));

      // Reset age range and age selection
      setFormData((prev) => ({ ...prev, idadeCategoria: '', idade: '', raca: '' }));
      setIdadeErro('');
      setRacaErro('');
    }

    // If age range was changed, clear age field
    if (name === 'idadeCategoria') {
      setFormData((prev) => ({ ...prev, idade: '' }));
      // Clear any existing error when changing age range
      setIdadeErro('');
    }
  };

  // Function to check if object has description property
  const getDescricao = (obj: any) => {
    if (!obj) return '';

    // Try different common properties for description
    if (obj.descricao) return obj.descricao;
    if (obj.description) return obj.description;
    if (obj.nome) return obj.nome;
    if (obj.name) return obj.name;

    // If no expected property is found, return object representation
    return JSON.stringify(obj);
  };

  const getSelectedRacaId = () => {
    // If race not selected, return null
    if (!formData.raca) return null;

    // Find race that matches selected name
    const racaEncontrada = racasFiltradas.find((raca) => getDescricao(raca) === formData.raca);

    return racaEncontrada ? racaEncontrada.id : null;
  };

  // Function to get sex ID based on description
  const getSexoIdFromDescription = (sexoDescricao: string) => {
    // If sex not selected, return null
    if (!sexoDescricao) return null;

    // Find sex that matches selected description
    const sexoEncontrado = sexoOpcoes.find((sexo) => getDescricao(sexo) === sexoDescricao);

    return sexoEncontrado ? sexoEncontrado.id : null;
  };

  // Function to handle form submission
  const handleSubmit = async () => {
    // Validate required fields
    let isValid = true;

    // Existing validations
    if (!formData.especie) {
      setEspecieErro('Please select a species');
      isValid = false;
    } else {
      setEspecieErro('');
    }

    if (formData.especie && !formData.idadeCategoria) {
      setFaixaEtariaErro('Please select an age range');
      isValid = false;
    } else {
      setFaixaEtariaErro('');
    }

    // New validation: check if age is empty when an age range is selected
    if (formData.idadeCategoria && !formData.idade) {
      setIdadeErro('Please enter the age');
      isValid = false;
    } else if (formData.idade && formData.idadeCategoria) {
      // Age validation if filled
      const idadeValida = validarIdade(formData.idade, formData.idadeCategoria);
      if (!idadeValida) {
        const idadeMin = formData.idadeCategoria.idade_min || 0;

        // Special treatment for case where idade_max is null (elderly)
        let mensagemErro;
        if (formData.idadeCategoria.idade_max === null) {
          mensagemErro = `Age must be ${idadeMin} or more`;
        } else {
          mensagemErro = `Age must be between ${idadeMin} and ${formData.idadeCategoria.idade_max}`;
        }

        setIdadeErro(mensagemErro);
        isValid = false;
      } else {
        setIdadeErro('');
      }
    }

    if (!formData.sexo) {
      setSexoErro('Please select sex');
      isValid = false;
    } else {
      setSexoErro('');
    }

    if (!formData.raca) {
      setRacaErro('Please select a breed');
      isValid = false;
    } else {
      setRacaErro('');
    }

    // New validations
    if (!formData.nome) {
      setNomeErro('Please enter a name');
      isValid = false;
    } else {
      setNomeErro('');
    }

    if (!formData.quantidade) {
      setQuantidadeErro('Please enter quantity');
      isValid = false;
    } else {
      setQuantidadeErro('');
    }

    if (!formData.possuiDoenca) {
      setPossuiDoencaErro('Please indicate if there are diseases/disabilities');
      isValid = false;
    } else {
      setPossuiDoencaErro('');
    }

    // Validate disease description only if possuiDoenca is "Sim"
    if (formData.possuiDoenca === 'Sim' && !formData.doencaDescricao) {
      setDoencaDescricaoErro('Please describe the disease/disability');
      isValid = false;
    } else {
      setDoencaDescricaoErro('');
    }

    if (!formData.motivoDoacao) {
      setMotivoDoacaoErro('Please enter donation reason');
      isValid = false;
    } else {
      setMotivoDoacaoErro('');
    }

    // Only validate photo if adding a new pet (not in edit mode) or if changing the photo
    if (!isEditMode && !formData.foto) {
      setFotoErro('Please select a photo');
      isValid = false;
    } else {
      setFotoErro('');
    }

    if (!isValid) {
      Alert.alert('Error', 'Please fill all required fields correctly.');
      return;
    }

    try {
      // Get user ID from AsyncStorage
      const userId = await AsyncStorage.getItem('@App:userId');

      if (!userId) {
        Alert.alert('Error', 'Could not identify logged user.');
        return;
      }

      // Prepare data in format expected by API
      const petPayload: PetPayload = {
        nome: formData.nome,
        especie_id: formData.especie.id,
        raca_id: getSelectedRacaId(),
        idade: parseInt(formData.idade, 10) || 0, // Convert to number
        faixa_etaria_id: formData.idadeCategoria.id,
        usuario_id: parseInt(userId, 10),
        estado_id: userData?.estado.id || 0,
        cidade_id: userData?.cidade.id || 0,
        rg_Pet: formData.rgPet || null,
        sexo_id: getSexoIdFromDescription(formData.sexo),
        motivoDoacao: formData.motivoDoacao,
        status_id: 1,
        quantidade: parseInt(formData.quantidade, 10) || 0, // Convert to number
        doencas: formData.possuiDoenca === 'Sim' && formData.doencaDescricao ? [formData.doencaDescricao] : [],
        foto: formData.foto
          ? {
            uri: formData.foto,
            type: 'image/jpeg',
            name: `pet_${Date.now()}.jpg`,
          }
          : null,
      };

      // Show loading
      setIsLoading(true);

      // Send to API - handle update or create based on isEditMode
      let response;
      if (isEditMode && pet) {
        response = await updatePet({
          id: pet.id,
          ...petPayload
        });
        if (response) {
          Alert.alert('Success', 'Pet updated successfully!');
        }
      } else {
        response = await postPet(petPayload);
        if (response) {
          Alert.alert('Success', 'Pet registered successfully!');
        }
      }

      if (response) {
        // Pass form data to parent through onSubmit
        onSubmit(formData);

        // Reset form, keeping user data
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
          rgPet: '',
          sexo: '',
          possuiDoenca: '',
          doencaDescricao: '',
          motivoDoacao: '',
          foto: null,
        });

        // Clear errors
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

        // Close modal
        onClose();
      } else {
        Alert.alert('Error', 'Could not register pet. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      Alert.alert('Error', 'An error occurred while processing your request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle closing and navigation
  const handleCloseAndNavigate = () => {
    onClose(); // Close modal
    router.push('/pages/PetDonation'); // Navigate to PetDonation screen
  };

  // Function to open breed selection modal
  const openRacasModal = () => {
    if (!formData.especie) {
      setRacaErro('Please select a species first');
      return;
    }

    if (racasFiltradas.length === 0) {
      Alert.alert('Warning', 'No breeds available for this species.');
      return;
    }

    setShowRacasModal(true);
  };

  // Function to select a breed and close modal
  const selectRaca = (raca: any) => {
    setFormData((prev) => ({
      ...prev,
      raca: getDescricao(raca),
    }));
    setRacaErro('');
    setShowRacasModal(false);
  };

  // Function to get age hint for selected age range
  const getIdadePlaceholder = () => {
    if (!formData.idadeCategoria) return 'Specific age (optional)';

    const idadeMin = formData.idadeCategoria.idade_min !== undefined ? formData.idadeCategoria.idade_min : '';

    // Special treatment for elderly case (idade_max is null)
    if (formData.idadeCategoria.idade_max === null) {
      return `Specific age (${idadeMin} or more)`;
    } else {
      const idadeMax = formData.idadeCategoria.idade_max !== undefined ? formData.idadeCategoria.idade_max : '∞';
      return `Specific age (Between ${idadeMin} and ${idadeMax})`;
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
  const formatRG = (text: string): string => {
    // Remove todos os caracteres não numéricos
    const digits = text.replace(/\D/g, '');

    // Limita a 9 dígitos (padrão RG)
    const limitedDigits = digits.slice(0, 9);

    // Aplica a formatação 00.000.000-0
    let formatted = '';

    if (limitedDigits.length > 0) {
      // Primeiros 2 dígitos
      formatted = limitedDigits.slice(0, 2);

      // Adiciona um ponto após os primeiros 2 dígitos
      if (limitedDigits.length > 2) {
        formatted += '.' + limitedDigits.slice(2, 5);

        // Adiciona outro ponto após o 5º dígito
        if (limitedDigits.length > 5) {
          formatted += '.' + limitedDigits.slice(5, 8);

          // Adiciona hífen e o último dígito
          if (limitedDigits.length > 8) {
            formatted += '-' + limitedDigits.slice(8, 9);
          }
        }
      }
    }

    return formatted;
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
            {/* Rg do Pet  */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>RG do Pet</Text>
              <TextInput
                style={styles.input}
                placeholder="RG do Pet (00.000.000-0)"
                keyboardType="numeric"
                value={formData.rgPet || ''}
                onChangeText={(value) => {
                  // Formata o valor antes de atualizar o estado
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
