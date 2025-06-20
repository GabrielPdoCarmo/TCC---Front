import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  TextInput,
  ImageBackground,
  Alert,
  Animated,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Adicione estes imports
import getRacaById from '@/services/api/Raca/getRacaById';
import getstatusById from '@/services/api/Status/getstatusById';
import getFaixaEtariaById from '@/services/api/Faixa-etaria/getFaixaEtariaById';
import getUsuarioByIdComCidadeEstado from '@/services/api/Usuario/getUsuarioByIdComCidadeEstado';
import getUsuarioById from '@/services/api/Usuario/getUsuarioById';
import checkFavorito from '@/services/api/Favoritos/checkFavorito';
import getEspecies from '@/services/api/Especies/getEspecies';
import getFaixaEtaria from '@/services/api/Faixa-etaria/getFaixaEtaria';
import getRacasPorEspecie from '@/services/api/Raca/getRacasPorEspecie';
import getEstados from '@/services/api/Estados/getEstados';
import getCidadesPorEstadoID from '@/services/api/Cidades/getCidadesPorEstadoID';
import getFaixaEtariaByEspecieId from '@/services/api/Faixa-etaria/getByEspecieId';
import getFavoritosPorUsuario from '@/services/api/Favoritos/getFavoritosPorUsuario';
import getPetByName from '@/services/api/Pets/getPetByName'; // Esta API já filtra por status_id = 2

// Interfaces para os tipos
interface Especie {
  id: number;
  nome: string;
  selected?: boolean;
}

interface FaixaEtaria {
  id: number;
  nome: string;
  idade_min: number;
  idade_max: number;
  unidade: string;
  especie_id: number;
  selected?: boolean;
  idadeEspecifica?: string;
  idadeErro?: string;
}

interface Raca {
  id: number;
  nome: string;
  especie_id: number;
  selected?: boolean;
}

interface Estado {
  id: number;
  nome: string;
  selected?: boolean;
}

interface Cidade {
  id: number;
  nome: string;
  estado_id?: number;
  selected?: boolean;
}

// Interface para Pet (para busca por nome)
interface Pet {
  id: number;
  nome: string;
  raca_id: number;
  raca_nome?: string;
  idade: string;
  usuario_id: number;
  usuario_nome?: string;
  usuario_foto?: string | null;
  usuario_telefone?: string;
  usuario_email?: string;
  usuario_cidade_id?: number;
  usuario_estado_id?: number;
  foto?: string;
  faixa_etaria_id: number;
  faixa_etaria_unidade?: string;
  status_id: number;
  status_nome?: string; 
  sexo_id?: number;
  especie_id?: number;
  favorito?: boolean; 
}

interface FilterParams {
  especieIds?: number[];
  faixaEtariaIds?: number[];
  faixasEtariaIdades?: { [key: number]: number };
  racaIds?: number[];
  estadoIds?: number[];
  cidadeIds?: number[];
  onlyFavorites?: boolean;
  favoritePetIds?: number[];
  // Parâmetros para busca por nome
  searchQuery?: string;
  searchResults?: Pet[];
  // NOVO: Adicionar status_id
  statusIds?: number[];
}

export default function FilterScreen() {
  // Estados para armazenar dados dos filtros
  const [especies, setEspecies] = useState<Especie[]>([]);
  const [faixasEtarias, setFaixasEtarias] = useState<FaixaEtaria[]>([]);
  const [todasFaixasEtarias, setTodasFaixasEtarias] = useState<FaixaEtaria[]>([]);
  const [racas, setRacas] = useState<Raca[]>([]);
  const [estados, setEstados] = useState<Estado[]>([]);
  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [onlyFavorites, setOnlyFavorites] = useState<boolean>(false);
  const [favoritePetIds, setFavoritePetIds] = useState<number[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState<boolean>(false);

  // Estados para busca por nome - SIMPLIFICADOS
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Pet[]>([]);
  const [hasActiveSearch, setHasActiveSearch] = useState<boolean>(false);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);

  // Estados para controlar expansão de seções
  const [especiesExpanded, setEspeciesExpanded] = useState<boolean>(false);
  const [idadeExpanded, setIdadeExpanded] = useState<boolean>(false);
  const [racasExpanded, setRacasExpanded] = useState<boolean>(false);
  const [regiaoExpanded, setRegiaoExpanded] = useState<boolean>(false);
  const [estadosExpanded, setEstadosExpanded] = useState<boolean>(false);
  const [cidadesExpanded, setCidadesExpanded] = useState<boolean>(false);
  const [searchExpanded, setSearchExpanded] = useState<boolean>(false);

  // Estados para barras de pesquisa
  const [searchEstado, setSearchEstado] = useState<string>('');
  const [searchCidade, setSearchCidade] = useState<string>('');
  const [searchRaca, setSearchRaca] = useState<string>('');

  // Estados para indicar carregamento
  const [loadingRacas, setLoadingRacas] = useState<boolean>(false);
  const [loadingCidades, setLoadingCidades] = useState<boolean>(false);
  const [loadingFaixasEtarias, setLoadingFaixasEtarias] = useState<boolean>(false);

  // Animação para o botão X
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Carregar filtros existentes, se houver
  const params = useLocalSearchParams();
  const currentFilters = params.filters ? JSON.parse(decodeURIComponent(params.filters as string)) : {};

  const loadPetsWithDetailsForAdoption = async (pets: Pet[]): Promise<Pet[]> => {
    if (!Array.isArray(pets) || pets.length === 0) {
      return [];
    }

    try {
      // Obter usuarioId para favoritos
      let usuarioId = null;
      try {
        const userIdFromStorage = await AsyncStorage.getItem('@App:userId');
        if (userIdFromStorage) {
          usuarioId = parseInt(userIdFromStorage);
        }
      } catch (error) {}

      return await Promise.all(
        pets.map(async (pet: Pet, index: number) => {
          try {
            // Carregar informações da raça
            let racaInfo = null;
            if (pet.raca_id) {
              try {
                racaInfo = await getRacaById(pet.raca_id);
              } catch (error) {}
            }

            // Carregar informações do status
            let statusInfo = null;
            if (pet.status_id) {
              try {
                statusInfo = await getstatusById(pet.status_id);
              } catch (error) {}
            }

            // Carregar informações da faixa etária
            let faixaEtariaInfo = null;
            if (pet.faixa_etaria_id) {
              try {
                faixaEtariaInfo = await getFaixaEtariaById(pet.faixa_etaria_id);
              } catch (error) {}
            }

            // Carregar informações do usuário responsável
            let usuarioInfo = null;
            let usuarioFotoInfo = null;

            if (pet.usuario_id) {
              try {
                usuarioInfo = await getUsuarioByIdComCidadeEstado(pet.usuario_id);
              } catch (error) {}
            }

            if (pet.usuario_id) {
              try {
                usuarioFotoInfo = await getUsuarioById(pet.usuario_id);
              } catch (error) {}
            }

            // Verificar se é favorito
            let isFavorito = false;
            if (usuarioId) {
              try {
                isFavorito = await checkFavorito(usuarioId, pet.id);
              } catch (error) {}
            }

            // Montar objeto final com dados completos
            const petCompleto = {
              ...pet,
              raca_nome: racaInfo?.nome || 'Raça não informada',
              usuario_nome: usuarioInfo?.nome || usuarioFotoInfo?.nome || 'Responsável não informado',
              usuario_foto: usuarioFotoInfo?.foto || null,
              usuario_telefone: usuarioFotoInfo?.telefone || usuarioInfo?.telefone,
              usuario_email: usuarioFotoInfo?.email || usuarioInfo?.email,
              usuario_cidade_id: usuarioInfo?.cidade?.id,
              usuario_estado_id: usuarioInfo?.estado?.id,
              status_nome: statusInfo?.nome || 'Disponível para adoção',
              faixa_etaria_unidade: faixaEtariaInfo?.unidade || '',
              favorito: isFavorito,
            };

            return petCompleto;
          } catch (petError) {
            // Retornar pet com dados básicos em caso de erro
            return {
              ...pet,
              raca_nome: 'Erro ao carregar raça',
              usuario_nome: 'Erro ao carregar responsável',
              usuario_foto: null,
              status_nome: 'Disponível para adoção',
              faixa_etaria_unidade: '',
              favorito: false,
            };
          }
        })
      );
    } catch (error) {
      // Retornar pets originais com dados básicos
      return pets.map((pet) => ({
        ...pet,
        raca_nome: 'Erro ao carregar dados',
        usuario_nome: 'Erro ao carregar dados',
        usuario_foto: null,
        status_nome: 'Disponível para adoção',
        faixa_etaria_unidade: '',
        favorito: false,
      }));
    }
  };
  // Normalizar resposta da API para busca por nome
  const normalizeApiResponse = (response: any): Pet[] => {
    if (!response) {
      return [];
    }

    // Se a resposta já é um array de pets
    if (Array.isArray(response)) {
      const validPets = response.filter((item) => item && typeof item === 'object' && item.id);

      return validPets;
    }

    // Se é um objeto com ID (pet único)
    if (typeof response === 'object' && response.id) {
      return [response as Pet];
    }

    // Se é um objeto que pode conter o array em alguma propriedade
    if (typeof response === 'object') {
      const possibleArrays = ['data', 'pets', 'results', 'items'];

      for (const prop of possibleArrays) {
        if (response[prop]) {
          if (Array.isArray(response[prop])) {
            const validPets = response[prop].filter((item: any) => item && typeof item === 'object' && item.id);

            return validPets;
          } else if (response[prop] && typeof response[prop] === 'object' && response[prop].id) {
            return [response[prop] as Pet];
          }
        }
      }
    }

    return [];
  };
  // Buscar pets por nome - SIMPLIFICADO (já filtra por status_id = 2)
  const searchPetsByName = async (name: string) => {
    if (name.trim() === '') {
      clearSearch();
      return;
    }

    try {
      setSearchLoading(true);

      // Chamar a API
      const response = await getPetByName(name);

      // Normalizar resposta
      const petsArray = normalizeApiResponse(response);

      // Filtrar apenas pets com status_id = 2
      const petsParaAdocao = petsArray.filter((pet) => pet.status_id === 2);

      if (petsParaAdocao.length > 0) {
        //  Carregar detalhes completos
        const petsWithDetails = await loadPetsWithDetailsForAdoption(petsParaAdocao);

        setSearchResults(petsWithDetails);
      } else {
        setSearchResults([]);
      }

      setHasActiveSearch(true);
      setSearchLoading(false);
    } catch (err) {
      const errorMessage = err?.toString() || '';
      if (
        errorMessage.includes('Pet não encontrado') ||
        errorMessage.includes('404') ||
        errorMessage.includes('Not found')
      ) {
      } else {
        Alert.alert('Erro na Busca', `Ocorreu um erro ao buscar o pet "${name}". Tente novamente.`, [{ text: 'OK' }]);
      }

      setSearchResults([]);
      setHasActiveSearch(true);
      setSearchLoading(false);
    }
  };

  // Limpar busca por nome
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setHasActiveSearch(false);
  };

  // Limpar mensagem automaticamente quando campo estiver vazio
  useEffect(() => {
    if (searchQuery.trim() === '' && hasActiveSearch) {
      setSearchResults([]);
      setHasActiveSearch(false);
    }
  }, [searchQuery, hasActiveSearch]);

  // Animação do botão X
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: searchQuery.length > 0 ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [searchQuery]);

  // Realizar busca (Enter ou botão)
  const handleSearch = () => {
    if (searchQuery.trim() === '') {
      clearSearch();
      return;
    }

    searchPetsByName(searchQuery.trim());
  };

  // Função para buscar favoritos do usuário
  const loadUserFavorites = async () => {
    try {
      setLoadingFavorites(true);

      let userId = null;

      const userIdFromStorage = await AsyncStorage.getItem('@App:userId');
      if (userIdFromStorage) {
        userId = parseInt(userIdFromStorage);
      } else {
        const userData = await AsyncStorage.getItem('@App:userData');
        if (userData) {
          const user = JSON.parse(userData);
          userId = user.id;
        }
      }

      if (!userId) {
        setLoadingFavorites(false);
        return;
      }

      const favoritos = await getFavoritosPorUsuario(userId);

      const petIds = favoritos
        .map((favorito: any) => {
          return favorito.pet_id || favorito.petId || favorito.pet?.id;
        })
        .filter(Boolean);

      setFavoritePetIds(petIds);
      setLoadingFavorites(false);
    } catch (error) {
      setLoadingFavorites(false);

      Alert.alert('Erro', 'Não foi possível carregar seus favoritos. Tente novamente.', [{ text: 'OK' }]);
    }
  };

  // Função para verificar se há espécies selecionadas
  const hasSelectedEspecies = () => {
    return especies.some((especie: Especie) => especie.selected);
  };

  // Função para verificar se há estados selecionados
  const hasSelectedEstados = () => {
    return estados.some((estado: Estado) => estado.selected);
  };

  // Função para normalizar texto
  const normalizeText = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  };

  // Funções para filtrar pela pesquisa
  const getFilteredEstados = () => {
    if (!searchEstado.trim()) return estados;
    const searchNormalized = normalizeText(searchEstado);
    return estados.filter((estado: Estado) => normalizeText(estado.nome).includes(searchNormalized));
  };

  const getFilteredCidades = () => {
    if (!searchCidade.trim()) return cidades;
    const searchNormalized = normalizeText(searchCidade);
    return cidades.filter((cidade: Cidade) => normalizeText(cidade.nome).includes(searchNormalized));
  };

  const getFilteredRacas = () => {
    if (!searchRaca.trim()) return racas;
    const searchNormalized = normalizeText(searchRaca);
    return racas.filter((raca: Raca) => normalizeText(raca.nome).includes(searchNormalized));
  };

  // Carregar dados iniciais
  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        const especiesData = await getEspecies();
        const faixasEtariasData = await getFaixaEtaria();
        const estadosData = await getEstados();

        setTodasFaixasEtarias(faixasEtariasData);

        if (currentFilters.especieIds) {
          especiesData.forEach((especie: Especie) => {
            especie.selected = currentFilters.especieIds.includes(especie.id);
          });
        }

        if (currentFilters.faixaEtariaIds) {
          faixasEtariasData.forEach((faixa: FaixaEtaria) => {
            faixa.selected = currentFilters.faixaEtariaIds.includes(faixa.id);
            if (currentFilters.faixasEtariaIdades && currentFilters.faixasEtariaIdades[faixa.id]) {
              faixa.idadeEspecifica = currentFilters.faixasEtariaIdades[faixa.id].toString();
            }
          });
        }

        if (currentFilters.estadoIds) {
          estadosData.forEach((estado: Estado) => {
            estado.selected = currentFilters.estadoIds.includes(estado.id);
          });
        }

        // Carregar busca por nome se existir
        if (currentFilters.searchQuery) {
          setSearchQuery(currentFilters.searchQuery);
          if (currentFilters.searchResults) {
            setSearchResults(currentFilters.searchResults);
            setHasActiveSearch(true);
          }
        }

        setEspecies(especiesData);
        setFaixasEtarias(faixasEtariasData);
        setEstados(estadosData);
        setOnlyFavorites(currentFilters.onlyFavorites || false);

        await loadUserFavorites();

        if (currentFilters.especieIds && currentFilters.especieIds.length > 0) {
          await loadRacasForEspecies(currentFilters.especieIds, currentFilters.racaIds);
          await loadFaixasEtariasForEspecies(currentFilters.especieIds, currentFilters.faixaEtariaIds);
        }

        if (currentFilters.estadoIds && currentFilters.estadoIds.length > 0) {
          await loadCidadesForEstados(estadosData, currentFilters.estadoIds, currentFilters.cidadeIds);
        }
      } catch (error) {}
    };

    fetchFilterData();
  }, []);

  // Carregar faixas etárias com base nas espécies selecionadas
  const loadFaixasEtariasForEspecies = async (especieIds: number[], selectedFaixaEtariaIds?: number[]) => {
    try {
      setLoadingFaixasEtarias(true);
      let allFaixasEtarias: FaixaEtaria[] = [];

      for (const especieId of especieIds) {
        const faixasEtariasData = await getFaixaEtariaByEspecieId(especieId);
        const faixasComEspecieId = faixasEtariasData.map((faixa: FaixaEtaria) => ({
          ...faixa,
          especie_id: faixa.especie_id || especieId,
        }));
        allFaixasEtarias = [...allFaixasEtarias, ...faixasComEspecieId];
      }

      if (especieIds.length === 0) {
        allFaixasEtarias = [...todasFaixasEtarias];
      }

      const uniqueFaixasEtarias = Array.from(
        new Map(allFaixasEtarias.map((faixa: FaixaEtaria) => [faixa.id, faixa])).values()
      );

      const currentFaixasEtarias = faixasEtarias || [];
      uniqueFaixasEtarias.forEach((faixa: FaixaEtaria) => {
        const currentFaixa = currentFaixasEtarias.find((f: FaixaEtaria) => f.id === faixa.id);
        if (currentFaixa) {
          faixa.selected = currentFaixa.selected;
          faixa.idadeEspecifica = currentFaixa.idadeEspecifica;
          faixa.idadeErro = currentFaixa.idadeErro;
        } else if (selectedFaixaEtariaIds) {
          faixa.selected = selectedFaixaEtariaIds.includes(faixa.id);
        }
      });

      setFaixasEtarias(uniqueFaixasEtarias);
      setLoadingFaixasEtarias(false);
    } catch (error) {
      setLoadingFaixasEtarias(false);
    }
  };

  // Carregar raças com base nas espécies selecionadas
  const loadRacasForEspecies = async (especieIds: number[], selectedRacaIds?: number[]) => {
    try {
      setLoadingRacas(true);
      let allRacas: Raca[] = [];

      for (const especieId of especieIds) {
        const racasData = await getRacasPorEspecie(especieId);
        allRacas = [...allRacas, ...racasData];
      }

      const uniqueRacas = Array.from(new Map(allRacas.map((raca: Raca) => [raca.id, raca])).values());

      if (selectedRacaIds) {
        uniqueRacas.forEach((raca: Raca) => {
          raca.selected = selectedRacaIds.includes(raca.id);
        });
      }

      setRacas(uniqueRacas);
      setLoadingRacas(false);
    } catch (error) {
      setLoadingRacas(false);
    }
  };

  // Carregar cidades com base nos estados selecionados
  const loadCidadesForEstados = async (estadosArray: Estado[], estadoIds: number[], selectedCidadeIds?: number[]) => {
    try {
      setLoadingCidades(true);
      let allCidades: Cidade[] = [];

      for (const estadoId of estadoIds) {
        const estado = estadosArray.find((e: Estado) => e.id === estadoId);
        if (estado) {
          const cidadesData = await getCidadesPorEstadoID(estado.id);
          const cidadesComEstadoId = cidadesData.map((cidade: Cidade) => ({
            ...cidade,
            estado_id: estadoId,
          }));
          allCidades = [...allCidades, ...cidadesComEstadoId];
        }
      }

      const uniqueCidades = Array.from(new Map(allCidades.map((cidade: Cidade) => [cidade.id, cidade])).values());

      if (selectedCidadeIds) {
        uniqueCidades.forEach((cidade: Cidade) => {
          cidade.selected = selectedCidadeIds.includes(cidade.id);
        });
      }

      setCidades(uniqueCidades);
      setLoadingCidades(false);
    } catch (error) {
      setLoadingCidades(false);
    }
  };

  // Alternar seleção de um item
  const toggleSelection = (id: number, stateArray: any[], setStateFunction: Function, type?: string) => {
    const updatedArray = stateArray.map((item: any) => {
      if (item.id === id) {
        return { ...item, selected: !item.selected };
      }
      return item;
    });

    setStateFunction(updatedArray);

    if (type === 'especie') {
      const selectedEspecieIds = updatedArray.filter((item: any) => item.selected).map((item: any) => item.id);

      if (selectedEspecieIds.length > 0) {
        loadRacasForEspecies(selectedEspecieIds);
      } else {
        setRacas([]);
        setRacasExpanded(false);
        setIdadeExpanded(false);
        setSearchRaca('');
      }

      loadFaixasEtariasForEspecies(selectedEspecieIds);
    }

    if (type === 'estado') {
      const selectedEstadoIds = updatedArray.filter((item: any) => item.selected).map((item: any) => item.id);
      if (selectedEstadoIds.length > 0) {
        loadCidadesForEstados(updatedArray, selectedEstadoIds);
      } else {
        setCidades([]);
        setCidadesExpanded(false);
        setSearchCidade('');
      }
    }
  };

  // Alternar favoritos
  const toggleFavorites = async () => {
    const newFavoritesState = !onlyFavorites;
    setOnlyFavorites(newFavoritesState);

    if (newFavoritesState && favoritePetIds.length === 0 && !loadingFavorites) {
      await loadUserFavorites();
    }
  };

  // Atualizar idade específica com validação
  const updateIdadeEspecifica = (id: number, idade: string) => {
    if (idade && !/^\d*$/.test(idade)) {
      return;
    }

    const updatedFaixas = faixasEtarias.map((faixa: FaixaEtaria) => {
      if (faixa.id === id) {
        let idadeErro = '';

        if (idade) {
          const idadeNum = parseInt(idade, 10);
          const idadeMin = faixa.idade_min || 0;
          const idadeMax = faixa.idade_max;

          if ((idadeMax !== null && idadeNum > idadeMax) || idadeNum < idadeMin) {
            if (faixa.idade_max === null) {
              idadeErro = `A idade deve ser ${idadeMin} ou mais`;
            } else {
              idadeErro = `A idade deve estar entre ${idadeMin} e ${idadeMax}`;
            }
          }
        }

        return {
          ...faixa,
          idadeEspecifica: idade,
          idadeErro: idadeErro,
        };
      }
      return faixa;
    });

    setFaixasEtarias(updatedFaixas);
  };

  // Lidar com clique nas seções
  const handleSectionPress = (expandedState: boolean, setExpandedState: Function) => {
    setExpandedState(!expandedState);
  };

  // Aplicar filtros e voltar para a tela anterior - MODIFICADO PARA STATUS_ID = 2
  const applyFilters = async () => {
    const faixasComErro = faixasEtarias.filter((faixa: FaixaEtaria) => faixa.selected && faixa.idadeErro);

    if (faixasComErro.length > 0) {
      Alert.alert(
        'Idades Inválidas',
        'Por favor, corrija as idades que estão fora da faixa permitida antes de aplicar os filtros.',
        [{ text: 'OK' }]
      );
      return;
    }

    const filters: FilterParams = {};

    // NOVO: Sempre incluir status_id = 2 para pets de adoção
    filters.statusIds = [2];

    const selectedEspecieIds = especies.filter((item: Especie) => item.selected).map((item: Especie) => item.id);
    if (selectedEspecieIds.length > 0) {
      filters.especieIds = selectedEspecieIds;
    }

    const selectedFaixasEtarias = faixasEtarias.filter((item: FaixaEtaria) => item.selected);
    if (selectedFaixasEtarias.length > 0) {
      filters.faixaEtariaIds = selectedFaixasEtarias.map((item: FaixaEtaria) => item.id);

      const idadesEspecificas: { [key: number]: number } = {};
      selectedFaixasEtarias.forEach((faixa: FaixaEtaria) => {
        if (faixa.idadeEspecifica && !isNaN(Number(faixa.idadeEspecifica))) {
          idadesEspecificas[faixa.id] = Number(faixa.idadeEspecifica);
        }
      });

      if (Object.keys(idadesEspecificas).length > 0) {
        filters.faixasEtariaIdades = idadesEspecificas;
      }
    }

    const selectedRacaIds = racas.filter((item: Raca) => item.selected).map((item: Raca) => item.id);
    if (selectedRacaIds.length > 0) {
      filters.racaIds = selectedRacaIds;
    }

    const selectedEstadoIds = estados.filter((item: Estado) => item.selected).map((item: Estado) => item.id);
    if (selectedEstadoIds.length > 0) {
      filters.estadoIds = selectedEstadoIds;
    }

    const selectedCidadeIds = cidades.filter((item: Cidade) => item.selected).map((item: Cidade) => item.id);
    if (selectedCidadeIds.length > 0) {
      filters.cidadeIds = selectedCidadeIds;
    }

    if (onlyFavorites) {
      filters.onlyFavorites = true;
      filters.favoritePetIds = favoritePetIds;
    }

    // Incluir busca por nome se existir (garantindo status_id = 2)
    if (hasActiveSearch && searchQuery.trim() !== '') {
      filters.searchQuery = searchQuery.trim();
      // Filtrar apenas pets com status_id = 2 (redundante mas garante)
      const filteredResults = searchResults.filter((pet) => pet.status_id === 2);
      filters.searchResults = filteredResults;
    }

    // VALIDAÇÃO: Verificar se pelo menos um filtro foi aplicado
    const hasAnyFilter =
      selectedEspecieIds.length > 0 ||
      selectedFaixasEtarias.length > 0 ||
      selectedRacaIds.length > 0 ||
      selectedEstadoIds.length > 0 ||
      selectedCidadeIds.length > 0 ||
      onlyFavorites ||
      (hasActiveSearch && searchQuery.trim() !== '');

    if (!hasAnyFilter) {
      Alert.alert('Nenhum Filtro Aplicado', 'Aplique pelo menos um dos filtros avançados para avançar', [
        { text: 'OK' },
      ]);
      return;
    }

    await AsyncStorage.setItem('@App:petFilters', JSON.stringify(filters));

    router.push({
      pathname: '/pages/PetAdoptionScreen',
      params: { applyFilters: 'true' },
    });
  };

  // Renderizar divisor de categoria
  const renderCategoryDivider = (title: string, icon?: string) => {
    return (
      <View style={styles.categoryDivider}>
        <View style={styles.categoryDividerLine} />
        <View style={styles.categoryDividerContent}>
          {icon && <Text style={styles.categoryDividerIcon}>{icon}</Text>}
          <Text style={styles.categoryDividerText}>{title}</Text>
        </View>
        <View style={styles.categoryDividerLine} />
      </View>
    );
  };

  // SEÇÃO DE BUSCA POR NOME - ATUALIZADA COM BOTÃO X MELHORADO
  const renderSearchSection = () => {
    return (
      <>
        {/* Campo de busca melhorado */}
        <View style={styles.searchNameContainer}>
          <View style={styles.searchNameInputContainer}>
            <TextInput
              style={styles.searchNameInput}
              placeholder="Digite o nome do pet..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />

            {/* Botão X integrado com animação */}
            {searchQuery.length > 0 && (
              <Animated.View style={{ opacity: fadeAnim }}>
                <TouchableOpacity
                  onPress={clearSearch}
                  style={styles.clearSearchIconButtonNew}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.clearSearchIconTextNew}>×</Text>
                </TouchableOpacity>
              </Animated.View>
            )}

            <TouchableOpacity onPress={handleSearch} style={styles.searchNameButton}>
              {searchLoading ? (
                <ActivityIndicator size="small" color="#4682B4" />
              ) : (
                <Image source={require('../../assets/images/Icone/search-icon.png')} style={styles.searchNameIcon} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Mensagem simples com resultado */}
        {hasActiveSearch && (
          <View style={styles.searchMessageContainer}>
            <Text style={styles.searchMessageText}>
              {searchResults.length > 0
                ? `${searchResults.length} pet${searchResults.length !== 1 ? 's' : ''} encontrado${
                    searchResults.length !== 1 ? 's' : ''
                  } com o nome "${searchQuery}"`
                : `Nenhum pet encontrado com o nome "${searchQuery}"`}
            </Text>
          </View>
        )}
      </>
    );
  };

  const renderFaixasEtariasItems = () => {
    if (loadingFaixasEtarias) {
      return renderLoading();
    }

    if (faixasEtarias.length === 0) {
      return (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>Nenhuma faixa etária disponível para as espécies selecionadas</Text>
        </View>
      );
    }

    const especiesSelecionadas = especies.filter((e) => e.selected);
    const showSpeciesDividers = especiesSelecionadas.length > 1;

    if (showSpeciesDividers) {
      return (
        <ScrollView style={styles.scrollableList} showsVerticalScrollIndicator={true} nestedScrollEnabled={true}>
          {especiesSelecionadas.map((especie: Especie, especieIndex: number) => {
            const faixasDaEspecie = faixasEtarias.filter((faixa: FaixaEtaria) => faixa.especie_id === especie.id);

            if (faixasDaEspecie.length === 0) return null;

            return (
              <View key={especie.id}>
                {renderCategoryDivider(especie.nome, '🐾')}

                {faixasDaEspecie.map((faixa: FaixaEtaria, faixaIndex: number) => (
                  <View key={faixa.id} style={styles.faixaEtariaContainer}>
                    <TouchableOpacity
                      style={[
                        styles.filterItem,
                        faixa.selected && styles.selectedItem,
                        faixaIndex === 0 && styles.firstFilterItemWithDivider,
                        faixaIndex === faixasDaEspecie.length - 1 &&
                          especieIndex === especiesSelecionadas.length - 1 &&
                          !faixa.selected &&
                          styles.lastFilterItem,
                      ]}
                      onPress={() => toggleSelection(faixa.id, faixasEtarias, setFaixasEtarias)}
                    >
                      <Text style={[styles.filterItemText, faixa.selected && styles.selectedItemText]}>
                        {faixa.nome} ({faixa.idade_min}
                        {faixa.idade_max ? `-${faixa.idade_max}` : ' ou mais'} {faixa.unidade})
                      </Text>
                      {faixa.selected && (
                        <View style={styles.checkmark}>
                          <Text style={styles.checkmarkText}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>

                    {faixa.selected && (
                      <View
                        style={[
                          styles.idadeInputContainer,
                          faixaIndex === faixasDaEspecie.length - 1 &&
                            especieIndex === especiesSelecionadas.length - 1 &&
                            styles.lastIdadeInputContainer,
                        ]}
                      >
                        <Text style={styles.idadeLabel}>Idade específica ({faixa.unidade}):</Text>
                        <TextInput
                          style={[styles.idadeInput, faixa.idadeErro ? styles.idadeInputError : {}]}
                          placeholder={`Digite a idade (${faixa.idade_min}${
                            faixa.idade_max ? `-${faixa.idade_max}` : ' ou mais'
                          })`}
                          value={faixa.idadeEspecifica || ''}
                          onChangeText={(text) => updateIdadeEspecifica(faixa.id, text)}
                          keyboardType="numeric"
                        />
                        {faixa.idadeErro ? <Text style={styles.idadeErrorText}>{faixa.idadeErro}</Text> : null}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            );
          })}
        </ScrollView>
      );
    }

    return faixasEtarias.map((faixa: FaixaEtaria, index: number) => {
      let nomeEspecie = 'Espécie';

      if (faixa.especie_id) {
        const especie = especies.find((e: Especie) => e.id === faixa.especie_id);
        nomeEspecie = especie ? especie.nome : `Espécie (ID: ${faixa.especie_id})`;
      } else {
        const especiesSelecionadas = especies.filter((e: Especie) => e.selected);
        if (especiesSelecionadas.length === 1) {
          nomeEspecie = especiesSelecionadas[0].nome;
        } else if (especiesSelecionadas.length > 1) {
          nomeEspecie = especiesSelecionadas.map((e: Especie) => e.nome).join('/');
        }
      }

      return (
        <View key={faixa.id} style={styles.faixaEtariaContainer}>
          <TouchableOpacity
            style={[
              styles.filterItem,
              faixa.selected && styles.selectedItem,
              index === 0 && styles.firstFilterItemNoSearch,
              index === faixasEtarias.length - 1 && !faixa.selected && styles.lastFilterItem,
            ]}
            onPress={() => toggleSelection(faixa.id, faixasEtarias, setFaixasEtarias)}
          >
            <Text style={[styles.filterItemText, faixa.selected && styles.selectedItemText]}>
              {nomeEspecie} - {faixa.nome} ({faixa.idade_min}
              {faixa.idade_max ? `-${faixa.idade_max}` : ' ou mais'} {faixa.unidade})
            </Text>
            {faixa.selected && (
              <View style={styles.checkmark}>
                <Text style={styles.checkmarkText}>✓</Text>
              </View>
            )}
          </TouchableOpacity>

          {faixa.selected && (
            <View
              style={[styles.idadeInputContainer, index === faixasEtarias.length - 1 && styles.lastIdadeInputContainer]}
            >
              <Text style={styles.idadeLabel}>Idade específica ({faixa.unidade}):</Text>
              <TextInput
                style={[styles.idadeInput, faixa.idadeErro ? styles.idadeInputError : {}]}
                placeholder={`Digite a idade (${faixa.idade_min}${
                  faixa.idade_max ? `-${faixa.idade_max}` : ' ou mais'
                })`}
                value={faixa.idadeEspecifica || ''}
                onChangeText={(text) => updateIdadeEspecifica(faixa.id, text)}
                keyboardType="numeric"
              />
              {faixa.idadeErro ? <Text style={styles.idadeErrorText}>{faixa.idadeErro}</Text> : null}
            </View>
          )}
        </View>
      );
    });
  };

  // Renderizar raças com divisões por espécie
  const renderRacasItems = () => {
    if (loadingRacas) {
      return renderLoading();
    }

    if (racas.length === 0) {
      return (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>Nenhuma raça disponível para as espécies selecionadas</Text>
        </View>
      );
    }

    const filteredRacas = getFilteredRacas();

    if (filteredRacas.length === 0) {
      return (
        <>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="🔍 Pesquisar raça..."
              value={searchRaca}
              onChangeText={setSearchRaca}
            />
          </View>
          <View style={[styles.emptyStateContainer, styles.emptyStateAttached]}>
            <Text style={styles.emptyStateText}>
              {searchRaca.trim() ? `Nenhuma raça encontrada para "${searchRaca}"` : 'Nenhuma raça disponível'}
            </Text>
          </View>
        </>
      );
    }

    const especiesSelecionadas = especies.filter((e) => e.selected);
    const showSpeciesDividers = especiesSelecionadas.length > 1;

    return (
      <>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="🔍 Pesquisar raça..."
            value={searchRaca}
            onChangeText={setSearchRaca}
          />
        </View>

        {showSpeciesDividers ? (
          <ScrollView style={styles.scrollableList} showsVerticalScrollIndicator={true} nestedScrollEnabled={true}>
            {especiesSelecionadas.map((especie: Especie, especieIndex: number) => {
              const racasDaEspecie = filteredRacas.filter((raca: Raca) => raca.especie_id === especie.id);

              if (racasDaEspecie.length === 0) return null;

              return (
                <View key={especie.id}>
                  {renderCategoryDivider(especie.nome, '🐾')}

                  {racasDaEspecie.map((raca: Raca, racaIndex: number) => (
                    <TouchableOpacity
                      key={raca.id}
                      style={[
                        styles.filterItem,
                        raca.selected && styles.selectedItem,
                        racaIndex === 0 && styles.firstFilterItemWithDivider,
                        racaIndex === racasDaEspecie.length - 1 &&
                          especieIndex === especiesSelecionadas.length - 1 &&
                          styles.lastFilterItem,
                      ]}
                      onPress={() => toggleSelection(raca.id, racas, setRacas, 'raca')}
                    >
                      <Text style={[styles.filterItemText, raca.selected && styles.selectedItemText]}>{raca.nome}</Text>
                      {raca.selected && (
                        <View style={styles.checkmark}>
                          <Text style={styles.checkmarkText}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              );
            })}
          </ScrollView>
        ) : (
          <ScrollView style={styles.scrollableList} showsVerticalScrollIndicator={true} nestedScrollEnabled={true}>
            {filteredRacas.map((raca: Raca, index: number) => (
              <TouchableOpacity
                key={raca.id}
                style={[
                  styles.filterItem,
                  raca.selected && styles.selectedItem,
                  index === 0 && styles.firstFilterItem,
                  index === filteredRacas.length - 1 && styles.lastFilterItem,
                ]}
                onPress={() => toggleSelection(raca.id, racas, setRacas, 'raca')}
              >
                <Text style={[styles.filterItemText, raca.selected && styles.selectedItemText]}>{raca.nome}</Text>
                {raca.selected && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </>
    );
  };

  // Renderizar cidades com divisões por estado
  const renderCidadesItems = () => {
    if (loadingCidades) {
      return renderLoading();
    }

    if (cidades.length === 0) {
      return (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>Nenhuma cidade disponível para os estados selecionados</Text>
        </View>
      );
    }

    const filteredCidades = getFilteredCidades();

    if (filteredCidades.length === 0) {
      return (
        <>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="🔍 Pesquisar cidade..."
              value={searchCidade}
              onChangeText={setSearchCidade}
            />
          </View>
          <View style={[styles.emptyStateContainer, styles.emptyStateAttached]}>
            <Text style={styles.emptyStateText}>
              {searchCidade.trim() ? `Nenhuma cidade encontrada para "${searchCidade}"` : 'Nenhuma cidade disponível'}
            </Text>
          </View>
        </>
      );
    }

    const estadosSelecionados = estados.filter((e) => e.selected);
    const showEstadosDividers = estadosSelecionados.length > 1;

    return (
      <>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="🔍 Pesquisar cidade..."
            value={searchCidade}
            onChangeText={setSearchCidade}
          />
        </View>

        {showEstadosDividers ? (
          <ScrollView style={styles.scrollableList} showsVerticalScrollIndicator={true} nestedScrollEnabled={true}>
            {estadosSelecionados.map((estado: Estado, estadoIndex: number) => {
              const cidadesDoEstado = filteredCidades.filter((cidade: Cidade) => cidade.estado_id === estado.id);

              if (cidadesDoEstado.length === 0) return null;

              return (
                <View key={estado.id}>
                  {renderCategoryDivider(estado.nome, '🏛️')}

                  {cidadesDoEstado.map((cidade: Cidade, cidadeIndex: number) => (
                    <TouchableOpacity
                      key={cidade.id}
                      style={[
                        styles.filterItem,
                        cidade.selected && styles.selectedItem,
                        cidadeIndex === 0 && styles.firstFilterItemWithDivider,
                        cidadeIndex === cidadesDoEstado.length - 1 &&
                          estadoIndex === estadosSelecionados.length - 1 &&
                          styles.lastFilterItem,
                      ]}
                      onPress={() => toggleSelection(cidade.id, cidades, setCidades, 'cidade')}
                    >
                      <Text style={[styles.filterItemText, cidade.selected && styles.selectedItemText]}>
                        {cidade.nome}
                      </Text>
                      {cidade.selected && (
                        <View style={styles.checkmark}>
                          <Text style={styles.checkmarkText}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              );
            })}
          </ScrollView>
        ) : (
          <ScrollView style={styles.scrollableList} showsVerticalScrollIndicator={true} nestedScrollEnabled={true}>
            {filteredCidades.map((cidade: Cidade, index: number) => (
              <TouchableOpacity
                key={cidade.id}
                style={[
                  styles.filterItem,
                  cidade.selected && styles.selectedItem,
                  index === 0 && styles.firstFilterItem,
                  index === filteredCidades.length - 1 && styles.lastFilterItem,
                ]}
                onPress={() => toggleSelection(cidade.id, cidades, setCidades, 'cidade')}
              >
                <Text style={[styles.filterItemText, cidade.selected && styles.selectedItemText]}>{cidade.nome}</Text>
                {cidade.selected && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </>
    );
  };

  // Renderizar itens com barra de pesquisa (para estados apenas)
  const renderItemsWithSearch = (
    items: any[],
    stateSetter: Function,
    type: string,
    searchValue: string,
    setSearchValue: (text: string) => void
  ) => {
    let filteredItems;
    if (type === 'estado') {
      filteredItems = getFilteredEstados();
    } else {
      filteredItems = items;
    }

    return (
      <>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder={`🔍 Pesquisar ${type === 'estado' ? 'estado' : 'item'}...`}
            value={searchValue}
            onChangeText={setSearchValue}
          />
        </View>

        {filteredItems.length === 0 ? (
          <View style={[styles.emptyStateContainer, styles.emptyStateAttached]}>
            <Text style={styles.emptyStateText}>
              {searchValue.trim()
                ? `Nenhum${type === 'estado' ? ' estado' : ' item'} encontrado para "${searchValue}"`
                : `Nenhum${type === 'estado' ? ' estado' : ' item'} disponível`}
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.scrollableList} showsVerticalScrollIndicator={true} nestedScrollEnabled={true}>
            {filteredItems.map((item: any, index: number) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.filterItem,
                  item.selected && styles.selectedItem,
                  index === 0 && styles.firstFilterItem,
                  index === filteredItems.length - 1 && styles.lastFilterItem,
                ]}
                onPress={() => toggleSelection(item.id, items, stateSetter, type)}
              >
                <Text style={[styles.filterItemText, item.selected && styles.selectedItemText]}>{item.nome}</Text>
                {item.selected && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </>
    );
  };

  // Renderizar itens sem pesquisa
  const renderItems = (items: any[], stateSetter: Function, type?: string) => {
    if (items.length === 0) {
      return (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>
            {type === 'raca' ? 'Nenhuma raça disponível para as espécies selecionadas' : 'Nenhum item disponível'}
          </Text>
        </View>
      );
    }

    return items.map((item: any, index: number) => (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.filterItem,
          item.selected && styles.selectedItem,
          index === 0 && styles.firstFilterItemNoSearch,
          index === items.length - 1 && styles.lastFilterItem,
        ]}
        onPress={() => toggleSelection(item.id, items, stateSetter, type)}
      >
        <Text style={[styles.filterItemText, item.selected && styles.selectedItemText]}>{item.nome}</Text>
        {item.selected && (
          <View style={styles.checkmark}>
            <Text style={styles.checkmarkText}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    ));
  };

  // Renderizar indicador de carregamento
  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="small" color="#4682B4" />
      <Text style={styles.loadingText}>Carregando...</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground source={require('../../assets/images/backgrounds/Fundo_02.png')} style={styles.backgroundImage}>
        <ScrollView style={styles.scrollView}>
          {/* Botão Voltar */}
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Image source={require('../../assets/images/Icone/close-icon.png')} style={styles.backIcon} />
            <Text style={styles.backButtonText}>Voltar a Página</Text>
          </TouchableOpacity>

          {/* Seção: Busca por Nome */}
          <TouchableOpacity style={styles.filterSection} onPress={() => setSearchExpanded(!searchExpanded)}>
            <Text style={styles.filterSectionText}>Busca por Nome</Text>
            <Image
              source={require('../../assets/images/Icone/arrow-down.png')}
              style={[styles.arrowIcon, searchExpanded && styles.arrowIconUp]}
            />
          </TouchableOpacity>

          {searchExpanded && <View style={styles.expandedSection}>{renderSearchSection()}</View>}

          {/* Seção Espécies */}
          <TouchableOpacity style={styles.filterSection} onPress={() => setEspeciesExpanded(!especiesExpanded)}>
            <Text style={styles.filterSectionText}>Espécies</Text>
            <Image
              source={require('../../assets/images/Icone/arrow-down.png')}
              style={[styles.arrowIcon, especiesExpanded && styles.arrowIconUp]}
            />
          </TouchableOpacity>

          {especiesExpanded && (
            <View style={styles.expandedSection}>{renderItems(especies, setEspecies, 'especie')}</View>
          )}

          {/* Seção Idade */}
          {hasSelectedEspecies() ? (
            <TouchableOpacity
              style={styles.filterSection}
              onPress={() => handleSectionPress(idadeExpanded, setIdadeExpanded)}
            >
              <Text style={styles.filterSectionText}>Idade</Text>
              <Image
                source={require('../../assets/images/Icone/arrow-down.png')}
                style={[styles.arrowIcon, idadeExpanded && styles.arrowIconUp]}
              />
            </TouchableOpacity>
          ) : (
            <>
              <View style={[styles.filterSection, styles.filterSectionBlocked]}>
                <Text style={[styles.filterSectionText, styles.filterSectionTextBlocked]}>Idade</Text>
                <Image
                  source={require('../../assets/images/Icone/arrow-down.png')}
                  style={[styles.arrowIcon, styles.arrowIconBlocked]}
                />
              </View>
              <View style={styles.infoMessageAttached}>
                <Text style={styles.infoMessageText}>💡 Selecione uma espécie primeiro</Text>
              </View>
            </>
          )}

          {idadeExpanded && hasSelectedEspecies() && (
            <View style={styles.expandedSection}>{renderFaixasEtariasItems()}</View>
          )}

          {/* Seção Raças/Tipo */}
          {hasSelectedEspecies() ? (
            <TouchableOpacity
              style={styles.filterSection}
              onPress={() => handleSectionPress(racasExpanded, setRacasExpanded)}
            >
              <Text style={styles.filterSectionText}>Raças/Tipo</Text>
              <Image
                source={require('../../assets/images/Icone/arrow-down.png')}
                style={[styles.arrowIcon, racasExpanded && styles.arrowIconUp]}
              />
            </TouchableOpacity>
          ) : (
            <>
              <View style={[styles.filterSection, styles.filterSectionBlocked]}>
                <Text style={[styles.filterSectionText, styles.filterSectionTextBlocked]}>Raças/Tipo</Text>
                <Image
                  source={require('../../assets/images/Icone/arrow-down.png')}
                  style={[styles.arrowIcon, styles.arrowIconBlocked]}
                />
              </View>
              <View style={styles.infoMessageAttached}>
                <Text style={styles.infoMessageText}>💡 Selecione uma espécie primeiro</Text>
              </View>
            </>
          )}

          {racasExpanded && hasSelectedEspecies() && <View style={styles.expandedSection}>{renderRacasItems()}</View>}

          {/* Seção Região */}
          <TouchableOpacity style={styles.filterSection} onPress={() => setRegiaoExpanded(!regiaoExpanded)}>
            <Text style={styles.filterSectionText}>Região</Text>
            <Image
              source={require('../../assets/images/Icone/arrow-down.png')}
              style={[styles.arrowIcon, regiaoExpanded && styles.arrowIconUp]}
            />
          </TouchableOpacity>

          {regiaoExpanded && (
            <View style={styles.expandedSection}>
              {/* Subseção Estados */}
              <TouchableOpacity style={styles.subFilterSection} onPress={() => setEstadosExpanded(!estadosExpanded)}>
                <Text style={styles.subFilterSectionText}>Estados</Text>
                <Image
                  source={require('../../assets/images/Icone/arrow-down.png')}
                  style={[styles.arrowIconSmall, estadosExpanded && styles.arrowIconUp]}
                />
              </TouchableOpacity>

              {estadosExpanded && (
                <View style={styles.subExpandedSection}>
                  {renderItemsWithSearch(estados, setEstados, 'estado', searchEstado, setSearchEstado)}
                </View>
              )}

              {/* Subseção Cidade */}
              {hasSelectedEstados() ? (
                <TouchableOpacity
                  style={[styles.subFilterSection, { marginTop: 10 }]}
                  onPress={() => setCidadesExpanded(!cidadesExpanded)}
                >
                  <Text style={styles.subFilterSectionText}>Cidade</Text>
                  <Image
                    source={require('../../assets/images/Icone/arrow-down.png')}
                    style={[styles.arrowIconSmall, cidadesExpanded && styles.arrowIconUp]}
                  />
                </TouchableOpacity>
              ) : (
                <>
                  <View style={[styles.subFilterSection, styles.subFilterSectionBlocked, { marginTop: 10 }]}>
                    <Text style={[styles.subFilterSectionText, styles.subFilterSectionTextBlocked]}>Cidade</Text>
                    <Image
                      source={require('../../assets/images/Icone/arrow-down.png')}
                      style={[styles.arrowIconSmall, styles.arrowIconBlocked]}
                    />
                  </View>
                  <View style={styles.infoMessageAttached}>
                    <Text style={styles.infoMessageText}>💡 Selecione um estado primeiro</Text>
                  </View>
                </>
              )}

              {cidadesExpanded && hasSelectedEstados() && (
                <View style={styles.subExpandedSection}>{renderCidadesItems()}</View>
              )}
            </View>
          )}

          {/* Seção Favoritos */}
          <TouchableOpacity style={styles.filterSection} onPress={toggleFavorites}>
            <View style={styles.favoritesSectionContent}>
              <Text style={styles.filterSectionText}>Favoritos</Text>
              {loadingFavorites && <ActivityIndicator size="small" color="#4682B4" style={styles.favoritesLoader} />}
              {onlyFavorites && favoritePetIds.length > 0 && (
                <Text style={styles.favoritesCount}>({favoritePetIds.length} pets)</Text>
              )}
            </View>
            <Image
              source={
                onlyFavorites
                  ? require('../../assets/images/Icone/star-icon-open.png')
                  : require('../../assets/images/Icone/star-icon.png')
              }
              style={styles.starIcon}
            />
          </TouchableOpacity>

          {onlyFavorites && favoritePetIds.length === 0 && !loadingFavorites && (
            <View style={styles.infoMessageAttached}>
              <Text style={styles.infoMessageText}>ℹ️ Você ainda não possui pets favoritos</Text>
            </View>
          )}

          {/* Botão Aplicar Filtro */}
          <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
            <Text style={styles.applyButtonText}>Aplicar Filtro</Text>
          </TouchableOpacity>
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  scrollView: {
    flex: 1,
    padding: 20,
    paddingTop: 40,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 30,
    padding: 10,
    marginBottom: 20,
    alignSelf: 'flex-start',
    backgroundColor: '#FFF',
  },
  backIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  filterSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 5,
    padding: 15,
    marginBottom: 10,
    backgroundColor: '#FFF',
  },
  filterSectionBlocked: {
    backgroundColor: '#F5F5F5',
    borderColor: '#CCC',
    opacity: 0.7,
  },
  filterSectionText: {
    fontSize: 18,
    fontWeight: '500',
  },
  filterSectionTextBlocked: {
    color: '#999',
  },
  arrowIcon: {
    width: 24,
    height: 24,
  },
  arrowIconUp: {
    transform: [{ rotate: '180deg' }],
  },
  arrowIconBlocked: {
    opacity: 0.5,
  },
  starIcon: {
    width: 24,
    height: 24,
  },
  expandedSection: {
    marginBottom: 15,
    marginTop: -5,
    paddingHorizontal: 10,
  },
  subFilterSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 5,
    padding: 12,
    marginBottom: 5,
    backgroundColor: '#F9F9F9',
  },
  subFilterSectionBlocked: {
    backgroundColor: '#F0F0F0',
    borderColor: '#CCC',
    opacity: 0.7,
  },
  subFilterSectionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4682B4',
  },
  subFilterSectionTextBlocked: {
    color: '#999',
  },
  subExpandedSection: {
    marginBottom: 10,
    marginTop: -5,
  },
  arrowIconSmall: {
    width: 20,
    height: 20,
  },
  searchContainer: {
    marginBottom: 0,
  },
  searchInput: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 5,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    borderBottomWidth: 0,
  },
  filterItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
    backgroundColor: '#FFF',
    borderLeftWidth: 1,
    borderLeftColor: '#DDD',
    borderRightWidth: 1,
    borderRightColor: '#DDD',
  },
  firstFilterItem: {
    borderTopWidth: 1,
    borderTopColor: '#DDD',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  firstFilterItemNoSearch: {
    borderTopWidth: 1,
    borderTopColor: '#DDD',
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  firstFilterItemWithDivider: {
    borderTopWidth: 0,
  },
  lastFilterItem: {
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#DDD',
  },
  filterItemText: {
    fontSize: 16,
    flex: 1,
  },
  selectedItem: {
    backgroundColor: '#F0F8FF',
  },
  selectedItemText: {
    fontWeight: '500',
    color: '#4682B4',
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4682B4',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  checkmarkText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  emptyStateContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 5,
  },
  emptyStateAttached: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
    borderWidth: 1,
    borderTopWidth: 1,
    borderColor: '#DDD',
  },
  emptyStateText: {
    color: '#666',
    textAlign: 'center',
  },
  applyButton: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 30,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  applyButtonText: {
    fontSize: 18,
    fontWeight: '500',
  },
  faixaEtariaContainer: {
    marginBottom: 0,
  },
  idadeInputContainer: {
    backgroundColor: '#F8F8F8',
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginTop: -1,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
    borderLeftWidth: 1,
    borderLeftColor: '#DDD',
    borderRightWidth: 1,
    borderRightColor: '#DDD',
  },
  lastIdadeInputContainer: {
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
    borderBottomColor: '#DDD',
  },
  idadeLabel: {
    fontSize: 14,
    marginBottom: 5,
    color: '#666',
  },
  idadeInput: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 4,
    padding: 8,
    fontSize: 14,
  },
  idadeInputError: {
    borderColor: 'red',
    borderWidth: 1,
  },
  idadeErrorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
  },
  categoryDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    marginHorizontal: 5,
  },
  categoryDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  categoryDividerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  categoryDividerIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryDividerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4682B4',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scrollableList: {
    maxHeight: 250,
    backgroundColor: '#FFF',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#DDD',
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
  },
  infoMessageAttached: {
    backgroundColor: '#F8F9FA',
    borderLeftWidth: 4,
    borderLeftColor: '#4682B4',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#CCC',
    padding: 12,
    marginTop: -10,
    marginBottom: 10,
    marginHorizontal: 0,
  },
  infoMessageText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  favoritesSectionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  favoritesLoader: {
    marginLeft: 10,
  },
  favoritesCount: {
    fontSize: 14,
    color: '#4682B4',
    fontWeight: '500',
    marginLeft: 8,
  },

  // ESTILOS ATUALIZADOS PARA BUSCA POR NOME COM BOTÃO X MELHORADO
  searchNameContainer: {
    backgroundColor: '#FFF',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  searchNameInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 25,
    paddingHorizontal: 15,
    marginBottom: 10,
    height: 50,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    // Sombra sutil
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchNameInput: {
    flex: 1,
    height: 45,
    fontSize: 16,
    color: '#333',
    paddingVertical: 0,
    paddingRight: 10, // Espaço para o botão X
  },
  searchNameButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(70, 130, 180, 0.1)', // Fundo sutil
  },
  searchNameIcon: {
    width: 20,
    height: 20,
  },

  // NOVOS ESTILOS: Botão X melhorado
  clearSearchIconButtonNew: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FF6B6B', // Cor vermelha suave
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    // Sombra para destaque
    shadowColor: '#FF6B6B',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  clearSearchIconTextNew: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 7, // Ajuste fino para centralizar verticalmente
    // Forçar centralização perfeita
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  // Mensagem de resultado
  searchMessageContainer: {
    backgroundColor: '#E8F1F8',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#4682B4',
    marginTop: -5, // Aproximar do campo de busca
  },
  searchMessageText: {
    fontSize: 14,
    color: '#4682B4',
    textAlign: 'center',
    fontWeight: '500',
  },
});
