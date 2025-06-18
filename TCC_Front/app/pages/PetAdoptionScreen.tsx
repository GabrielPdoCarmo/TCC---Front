// PetAdoptionScreen.tsx - Otimizado com ordenação por ID e SponsorModal
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ImageBackground,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createMyPet } from '@/services/api/MyPets/createMypets';
import PetsCard from '@/components/Pets/PetsCard';
import SponsorModal from '@/components/Sponsor/SponsorModal'; // ✅ IMPORTAR o SponsorModal
import getPetsByStatus from '@/services/api/Pets/getPetsByStatus';
import getUsuarioByIdComCidadeEstado from '@/services/api/Usuario/getUsuarioByIdComCidadeEstado';
import getUsuarioById from '@/services/api/Usuario/getUsuarioById';
import getRacaById from '@/services/api/Raca/getRacaById';
import getstatusById from '@/services/api/Status/getstatusById';
import getFaixaEtariaById from '@/services/api/Faixa-etaria/getFaixaEtariaById';
import getFavorito from '@/services/api/Favoritos/getFavorito';
import deleteFavorito from '@/services/api/Favoritos/deleteFavorito';
import checkFavorito from '@/services/api/Favoritos/checkFavorito';
import getFavoritosPorUsuario from '@/services/api/Favoritos/getFavoritosPorUsuario';
import { useAuth } from '@/contexts/AuthContext';

// Definindo uma interface para o tipo Pet
interface Pet {
  id: number;
  nome: string;
  raca_id: number;
  raca_nome?: string;
  idade: string;
  usuario_id: number;
  usuario_nome?: string;
  usuario_foto?: string | null;
  usuario_cidade_id?: number;
  usuario_estado_id?: number;
  foto?: string;
  faixa_etaria_id: number;
  faixa_etaria_unidade?: string;
  status_id: number;
  status_nome?: string;
  sexo_id?: number;
  favorito?: boolean;
  especie_id?: number;
}

// Interface para os filtros
interface FilterParams {
  especieIds?: number[];
  faixaEtariaIds?: number[];
  faixasEtariaIdades?: { [key: number]: number };
  racaIds?: number[];
  estadoIds?: number[];
  cidadeIds?: number[];
  onlyFavorites?: boolean;
  favoritePetIds?: number[];
  searchQuery?: string;
  searchResults?: Pet[];
}

// Obter dimensões da tela
const { width } = Dimensions.get('window');

// 🆕 ATUALIZADA: Função para ordenar pets por ID (mais recente primeiro)
const sortPetsByCreation = (pets: Pet[]): Pet[] => {
  return [...pets].sort((a, b) => b.id - a.id);
};

export default function PetAdoptionScreen() {
  const params = useLocalSearchParams();
  const [allPets, setAllPets] = useState<Pet[]>([]);
  const [filteredPets, setFilteredPets] = useState<Pet[]>([]);
  const [searchResults, setSearchResults] = useState<Pet[]>([]);
  const [hasActiveSearch, setHasActiveSearch] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<FilterParams | null>(null);

  // ✅ NOVO: Estados para controlar o modal do sponsor
  const [showSponsorModal, setShowSponsorModal] = useState<boolean>(false);
  const [pendingAdoption, setPendingAdoption] = useState<{ petId: number; usuarioId: number } | null>(null);

  const { user, token, isAuthenticated, loading: authLoading, setLastRoute } = useAuth();
  const usuarioId = user?.id || null;

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      setLastRoute('/pages/PetAdoptionScreen');
    }
  }, [authLoading, isAuthenticated, setLastRoute]);

  // Verificar se está autenticado
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/pages/LoginScreen');
      return;
    }
  }, [isAuthenticated, authLoading]);

  // Função auxiliar para normalizar respostas da API
  const normalizeApiResponse = (response: any): Pet[] => {
    if (!response) {
      return [];
    }

    if (Array.isArray(response)) {
      return response;
    }

    if (typeof response === 'object' && response.id) {
      return [response as Pet];
    }

    if (typeof response === 'object') {
      const possibleArrays = ['data', 'pets', 'results', 'items'];
      for (const prop of possibleArrays) {
        if (response[prop]) {
          return normalizeApiResponse(response[prop]);
        }
      }
    }

    return [];
  };

  // Função para carregar pets com detalhes completos incluindo foto do usuário
  const loadPetsWithDetails = async (pets: Pet[]): Promise<Pet[]> => {
    if (!Array.isArray(pets) || pets.length === 0) {
      return [];
    }

    try {
      return Promise.all(
        pets.map(async (pet: Pet) => {
          try {
            let racaInfo = pet.raca_nome ? null : await getRacaById(pet.raca_id);
            let statusInfo = pet.status_nome ? null : await getstatusById(pet.status_id);
            let faixaEtariaInfo = pet.faixa_etaria_unidade ? null : await getFaixaEtariaById(pet.faixa_etaria_id);

            let usuarioInfo = null;
            let usuarioFotoInfo = null;

            if (!pet.usuario_nome) {
              usuarioInfo = await getUsuarioByIdComCidadeEstado(pet.usuario_id);
            }

            if (!pet.usuario_foto) {
              usuarioFotoInfo = await getUsuarioById(pet.usuario_id);
            }

            let isFavorito = false;
            if (usuarioId) {
              isFavorito = await checkFavorito(usuarioId, pet.id);
            }

            return {
              ...pet,
              raca_nome: pet.raca_nome || racaInfo?.nome || 'Desconhecido',
              usuario_nome: pet.usuario_nome || usuarioInfo?.nome || 'Desconhecido',
              usuario_foto: pet.usuario_foto || usuarioFotoInfo?.foto || null,
              usuario_cidade_id: pet.usuario_cidade_id || usuarioInfo?.cidade?.id,
              usuario_estado_id: pet.usuario_estado_id || usuarioInfo?.estado?.id,
              status_nome: pet.status_nome || statusInfo?.nome || 'Disponível para adoção',
              faixa_etaria_unidade: pet.faixa_etaria_unidade || faixaEtariaInfo?.unidade || '',
              favorito: isFavorito,
            };
          } catch (petError) {
            return {
              ...pet,
              raca_nome: pet.raca_nome || 'Desconhecido',
              usuario_nome: pet.usuario_nome || 'Desconhecido',
              usuario_foto: pet.usuario_foto || null,
              status_nome: pet.status_nome || 'Disponível para adoção',
              faixa_etaria_unidade: pet.faixa_etaria_unidade || '',
              favorito: false,
            };
          }
        })
      );
    } catch (error) {
      return pets.map((pet) => ({
        ...pet,
        raca_nome: pet.raca_nome || 'Desconhecido',
        usuario_nome: pet.usuario_nome || 'Desconhecido',
        usuario_foto: pet.usuario_foto || null,
        status_nome: pet.status_nome || 'Disponível para adoção',
        faixa_etaria_unidade: pet.faixa_etaria_unidade || '',
        favorito: false,
      }));
    }
  };

  // 🆕 ATUALIZADA: Função para aplicar filtros aos pets COM ordenação por ID
  const applyFiltersToData = async (pets: Pet[], filters: FilterParams): Promise<Pet[]> => {
    try {
      let filteredData = pets;

      if (filters.onlyFavorites && usuarioId) {
        const favoritesResponse = await getFavoritosPorUsuario(usuarioId);
        const favoritePets = favoritesResponse.map((favorito: any) => favorito.pet).filter(Boolean);

        if (favoritePets.length === 0) {
          return [];
        }

        const favoritePetsWithDetails = await loadPetsWithDetails(favoritePets);
        // 🆕 APLICAR ORDENAÇÃO POR ID para favoritos
        return sortPetsByCreation(favoritePetsWithDetails);
      }

      if (filters.especieIds && filters.especieIds.length > 0) {
        filteredData = filteredData.filter((pet: Pet) => filters.especieIds?.includes(pet.especie_id || 0));
      }

      if (filters.racaIds && filters.racaIds.length > 0) {
        filteredData = filteredData.filter((pet: Pet) => filters.racaIds?.includes(pet.raca_id));
      }

      if (filters.faixaEtariaIds && filters.faixaEtariaIds.length > 0) {
        filteredData = filteredData.filter((pet: Pet) => filters.faixaEtariaIds?.includes(pet.faixa_etaria_id));

        if (filters.faixasEtariaIdades && Object.keys(filters.faixasEtariaIdades).length > 0) {
          filteredData = filteredData.filter((pet: Pet) => {
            const idadeEspecifica = filters.faixasEtariaIdades?.[pet.faixa_etaria_id];
            if (idadeEspecifica !== undefined) {
              const idadePet = parseInt(pet.idade);
              return !isNaN(idadePet) && idadePet === idadeEspecifica;
            }
            return true;
          });
        }
      }

      if (filters.estadoIds && filters.estadoIds.length > 0) {
        filteredData = filteredData.filter(
          (pet: Pet) => pet.usuario_estado_id && filters.estadoIds?.includes(pet.usuario_estado_id)
        );
      }

      if (filters.cidadeIds && filters.cidadeIds.length > 0) {
        filteredData = filteredData.filter(
          (pet: Pet) => pet.usuario_cidade_id && filters.cidadeIds?.includes(pet.usuario_cidade_id)
        );
      }

      // 🆕 APLICAR ORDENAÇÃO POR ID uma vez no final dos filtros
      return sortPetsByCreation(filteredData);
    } catch (error) {
      // 🆕 Em caso de erro, ainda aplicar ordenação por ID
      return sortPetsByCreation(pets);
    }
  };

  // 🆕 ATUALIZADA: Aplicar filtros considerando busca ativa COM ordenação por ID
  const applyCurrentFilters = async () => {
    try {
      let baseData: Pet[];

      if (hasActiveSearch && searchQuery.trim() !== '') {
        baseData = searchResults;
      } else {
        baseData = allPets;
      }

      if (activeFilters) {
        const filtersWithoutSearch = { ...activeFilters };
        delete filtersWithoutSearch.searchQuery;
        delete filtersWithoutSearch.searchResults;

        const filtered = await applyFiltersToData(baseData, filtersWithoutSearch);
        setFilteredPets(filtered);
      } else {
        // 🆕 APLICAR ORDENAÇÃO POR ID apenas se baseData não estiver ordenado
        if (baseData === allPets) {
          // allPets já deve estar ordenado do refreshData
          setFilteredPets(baseData);
        } else {
          // searchResults podem não estar ordenados
          const sortedBaseData = sortPetsByCreation(baseData);
          setFilteredPets(sortedBaseData);
        }
      }
    } catch (error) {
      if (hasActiveSearch && searchQuery.trim() !== '') {
        // 🆕 Ordenar searchResults por ID se necessário
        const sortedSearchResults = sortPetsByCreation(searchResults);
        setFilteredPets(sortedSearchResults);
      } else {
        // allPets já deve estar ordenado
        setFilteredPets(allPets);
      }
    }
  };

  // 🆕 ATUALIZADA: Função para recarregar os dados COM ordenação por ID
  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getPetsByStatus();

      if (!response || response.length === 0) {
        setAllPets([]);
        setFilteredPets([]);
        setLoading(false);
        return;
      }

      const petsWithDetails = await loadPetsWithDetails(response);

      // 🆕 APLICAR ORDENAÇÃO POR ID APENAS UMA VEZ no carregamento inicial
      const sortedPetsWithDetails = sortPetsByCreation(petsWithDetails);
      setAllPets(sortedPetsWithDetails);

      setLoading(false);
    } catch (err) {
      setError('Não foi possível carregar os pets. Tente novamente mais tarde.');
      setLoading(false);
    }
  }, [usuarioId]);

  // Verificar se há filtros para aplicar quando a tela recebe parâmetros
  useEffect(() => {
    const checkForFilters = async () => {
      if (params.applyFilters === 'true') {
        const storedFilters = await AsyncStorage.getItem('@App:petFilters');
        if (storedFilters) {
          const parsedFilters = JSON.parse(storedFilters);

          if (parsedFilters.searchQuery && parsedFilters.searchResults) {
            setSearchQuery(parsedFilters.searchQuery);
            setSearchResults(parsedFilters.searchResults);
            setHasActiveSearch(true);
          }

          setActiveFilters(parsedFilters);
        }
      }
    };

    checkForFilters();
  }, [params.applyFilters]);

  // useFocusEffect para atualizar sempre que a tela ganhar foco
  useFocusEffect(
    useCallback(() => {
      if (usuarioId && !authLoading && isAuthenticated) {
        refreshData();
      }
    }, [usuarioId, authLoading, isAuthenticated, refreshData])
  );

  // useEffect melhorado que também detecta mudanças nos parâmetros
  useEffect(() => {
    if (usuarioId && !authLoading && isAuthenticated) {
      refreshData();
    }
  }, [usuarioId, authLoading, isAuthenticated, params.refresh, refreshData]);

  // Aplicar filtros sempre que eles mudarem ou quando há mudança na busca
  useEffect(() => {
    if (!loading) {
      applyCurrentFilters();
    }
  }, [activeFilters, hasActiveSearch, searchResults, allPets, loading]);

  // ✅ FUNÇÃO ATUALIZADA para lidar com a adoção de um pet - agora mostra o modal primeiro
  const handleAdopt = async (petId: number) => {
    if (!usuarioId) {
      Alert.alert('Erro', 'Você precisa estar logado para adicionar pets aos seus favoritos.');
      return;
    }

    const pet = filteredPets.find((p: Pet) => p.id === petId);
    if (!pet) {
      Alert.alert('Erro', 'Pet não encontrado.');
      return;
    }

    // ✅ VERIFICAR: Se é o dono atual do pet (não pode adotar próprio pet)
    if (pet.usuario_id === usuarioId) {
      Alert.alert('Operação não permitida', 'Você não pode adicionar seu próprio pet aos seus pets.');
      return;
    }

    // ✅ NOVA LÓGICA: Sempre tentar a adoção com tratamento de erro melhorado
    // (permitindo readoção de ex-adotantes)

    try {
      // ✅ TENTAR: Criar MyPet diretamente (pode ser ex-adotante)
      await createMyPet(petId, usuarioId);

      // ✅ SUCESSO: Pet adicionado
      Alert.alert('Sucesso!', 'Pet adicionado aos seus pets com sucesso!', [
        {
          text: 'OK',
          onPress: () => {
            refreshData();
          },
        },
      ]);
    } catch (error: any) {
      // 🔍 VERIFICAR: Se é erro de "já está nos meus pets" (readoção bem-sucedida)
      if (
        error.message &&
        (error.message.includes('já está nos seus pets') ||
          error.message.includes('already exists') ||
          error.message.includes('duplicate') ||
          error.message.includes('já adotado'))
      ) {
        Alert.alert('Pet já adicionado', 'Este pet já está na sua lista. Atualizando...', [
          {
            text: 'OK',
            onPress: () => refreshData(),
          },
        ]);
        return;
      }

      // 🔍 VERIFICAR: Se pet foi criado mas API retornou erro estranho
      if (
        error.message &&
        (error.message.includes('Pet adicionado') ||
          error.message.includes('sucesso') ||
          error.response?.status === 201 ||
          error.response?.status === 200)
      ) {
        Alert.alert('Sucesso!', 'Pet adicionado aos seus pets!', [
          {
            text: 'OK',
            onPress: () => refreshData(),
          },
        ]);
        return;
      }

      // 🔍 VERIFICAR: Se é erro de ex-adotante tentando readotar
      if (
        error.message &&
        (error.message.includes('usuário já teve este pet') ||
          error.message.includes('readoção') ||
          error.message.includes('ex-adotante') ||
          error.message.includes('histórico'))
      ) {
        Alert.alert(
          'Readoção Detectada',
          `Você já teve ${pet.nome} antes. Deseja readotá-lo?\n\nIsso criará um novo registro de adoção.`,
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Sim, readotar',
              onPress: async () => {
                // ✅ TENTAR: Forçar readoção
                try {
                  // Primeiro mostrar modal do sponsor
                  setPendingAdoption({ petId, usuarioId });
                  setShowSponsorModal(true);
                } catch (forceError) {
                  Alert.alert('Erro', 'Não foi possível processar a readoção. Tente novamente.');
                }
              },
            },
          ]
        );
        return;
      }

      // 🔍 VERIFICAR: Se é erro de conexão ou servidor
      if (
        error.message &&
        (error.message.includes('conexão') ||
          error.message.includes('network') ||
          error.message.includes('timeout') ||
          error.response?.status >= 500)
      ) {
        Alert.alert('Erro de Conexão', 'Problema de conexão. Verifique sua internet e tente novamente.', [
          { text: 'OK' },
        ]);
        return;
      }

      // ❌ ERRO GENÉRICO: Mostrar modal do sponsor mesmo assim (pode ser falso erro)

      Alert.alert(
        'Erro na Adoção',
        `Houve um problema: ${error.message || 'Erro desconhecido'}\n\nDeseja tentar mesmo assim?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Tentar mesmo assim',
            onPress: () => {
              setPendingAdoption({ petId, usuarioId });
              setShowSponsorModal(true);
            },
          },
        ]
      );
    }
  };

  // ✅ NOVA: Função para processar a adoção após o modal fechar
  const processPendingAdoption = async () => {
    if (!pendingAdoption) return;

    try {
      await createMyPet(pendingAdoption.petId, pendingAdoption.usuarioId);

      // Limpar os dados pendentes
      setPendingAdoption(null);

      Alert.alert('Sucesso!', 'Pet adicionado aos seus pets com sucesso!', [
        {
          text: 'OK',
          onPress: () => {
            refreshData();
          },
        },
      ]);
    } catch (error: any) {
      // Limpar os dados pendentes
      setPendingAdoption(null);

      // 🔍 VERIFICAR: Se erro é porque pet já foi adicionado
      if (
        error.message &&
        (error.message.includes('já está nos seus pets') ||
          error.message.includes('already exists') ||
          error.message.includes('duplicate') ||
          error.message.includes('já adotado'))
      ) {
        Alert.alert('Pet já adicionado', 'Este pet já está na sua lista de pets. Atualizando...', [
          {
            text: 'OK',
            onPress: () => refreshData(),
          },
        ]);
        return;
      }

      // 🔍 VERIFICAR: Se pet foi criado mas API retornou erro
      if (
        error.message &&
        (error.message.includes('Pet adicionado') ||
          error.message.includes('sucesso') ||
          error.response?.status === 201 ||
          error.response?.status === 200)
      ) {
        Alert.alert('Sucesso!', 'Pet adicionado aos seus pets!', [
          {
            text: 'OK',
            onPress: () => refreshData(),
          },
        ]);
        return;
      }

      // 🔍 VERIFICAR: Se é readoção de ex-adotante (após modal do sponsor)
      if (
        error.message &&
        (error.message.includes('usuário já teve este pet') ||
          error.message.includes('readoção') ||
          error.message.includes('ex-adotante') ||
          error.message.includes('histórico'))
      ) {
        Alert.alert(
          'Readoção Bloqueada',
          'O sistema detectou que você já teve este pet antes. Entre em contato com o suporte se desejar readotá-lo.',
          [
            {
              text: 'Entendi',
              onPress: () => refreshData(), // Atualizar para remover da lista se necessário
            },
          ]
        );
        return;
      }

      // ❌ OUTROS ERROS: Tentar forçar mesmo assim já que modal foi exibido

      Alert.alert(
        'Erro na Adoção',
        `Erro: ${error.message || 'Erro desconhecido'}\n\nO pet pode ter sido adicionado mesmo assim. Verificando...`,
        [
          {
            text: 'Verificar Lista',
            onPress: () => {
              // Dar um tempo para API processar e depois atualizar
              setTimeout(() => {
                refreshData();
              }, 1000);
            },
          },
          { text: 'OK' },
        ]
      );
    }
  };
  // ✅ NOVA: Função para lidar com o fechamento do modal do sponsor
  const handleSponsorModalClose = () => {
    setShowSponsorModal(false);
    // Processar a adoção após fechar o modal
    if (pendingAdoption) {
      setTimeout(() => {
        processPendingAdoption();
      }, 500); // Pequeno delay para suavizar a transição
    }
  };

  // Função para ver detalhes do pet
  const handleViewDetails = (petId: number) => {
    router.push({
      pathname: '/pages/PetDetailsScreen',
      params: { petId },
    });
  };

  // Função para abrir a tela de filtro avançado
  const handleAdvancedFilter = () => {
    let currentFiltersToPass = activeFilters ? { ...activeFilters } : {};

    if (hasActiveSearch && searchQuery.trim() !== '') {
      currentFiltersToPass.searchQuery = searchQuery.trim();
      currentFiltersToPass.searchResults = searchResults;
    }

    const currentFiltersStr =
      Object.keys(currentFiltersToPass).length > 0 ? encodeURIComponent(JSON.stringify(currentFiltersToPass)) : '';

    router.push({
      pathname: '/pages/FilterScreen',
      params: { filters: currentFiltersStr },
    });
  };

  // 🆕 ATUALIZADA: Função para favoritar/desfavoritar um pet SEM re-ordenação desnecessária
  const handleFavorite = async (petId: number) => {
    if (!usuarioId) {
      Alert.alert('Erro', 'Você precisa estar logado para favoritar pets.');
      return;
    }

    try {
      const pet = filteredPets.find((p: Pet) => p.id === petId);
      if (!pet) return;

      const wasfavorited = pet.favorito;

      if (pet.favorito) {
        await deleteFavorito(usuarioId, petId);
      } else {
        await getFavorito(usuarioId, petId);
      }

      // 🆕 ATUALIZADA: Atualização simples sem re-ordenação (allPets já está ordenado por ID)
      const updatedAllPets = allPets.map((p: Pet) => (p.id === petId ? { ...p, favorito: !p.favorito } : p));
      setAllPets(updatedAllPets); // Mantém ordem existente

      if (hasActiveSearch) {
        // 🆕 ATUALIZADA: Atualização simples para searchResults também
        const updatedSearchResults = searchResults.map((p: Pet) =>
          p.id === petId ? { ...p, favorito: !p.favorito } : p
        );
        setSearchResults(updatedSearchResults); // Mantém ordem existente
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar os favoritos. Tente novamente.');
    }
  };

  // Função para limpar filtros ativos
  const clearFilters = async () => {
    await AsyncStorage.removeItem('@App:petFilters');
    setActiveFilters(null);

    if (activeFilters?.searchQuery) {
      setSearchQuery('');
      setSearchResults([]);
      setHasActiveSearch(false);
    }
  };

  // Renderizar cada item da lista de pets
  const renderPetItem = ({ item }: { item: Pet }) => (
    <View style={styles.petCardWrapper}>
      <PetsCard
        pet={item}
        onAdopt={() => handleAdopt(item.id)}
        OnDetalhes={() => handleViewDetails(item.id)}
        onFavorite={() => handleFavorite(item.id)}
        usuarioLogadoId={usuarioId}
      />
    </View>
  );

  // Função para verificar se há filtros ativos e mostrar informações na interface
  const getFilterInfo = () => {
    if (!activeFilters) return '';

    let filterCount = 0;

    if (activeFilters.especieIds && activeFilters.especieIds.length > 0) {
      filterCount += activeFilters.especieIds.length;
    }

    if (activeFilters.faixaEtariaIds && activeFilters.faixaEtariaIds.length > 0) {
      filterCount += activeFilters.faixaEtariaIds.length;

      if (activeFilters.faixasEtariaIdades) {
        filterCount += Object.keys(activeFilters.faixasEtariaIdades).length;
      }
    }

    if (activeFilters.racaIds && activeFilters.racaIds.length > 0) {
      filterCount += activeFilters.racaIds.length;
    }

    if (activeFilters.estadoIds && activeFilters.estadoIds.length > 0) {
      filterCount += activeFilters.estadoIds.length;
    }

    if (activeFilters.cidadeIds && activeFilters.cidadeIds.length > 0) {
      filterCount += activeFilters.cidadeIds.length;
    }

    if (activeFilters.onlyFavorites) {
      filterCount += 1;
    }

    if (activeFilters.searchQuery) {
      filterCount += 1;
    }

    return filterCount > 0
      ? `${filterCount} filtro${filterCount > 1 ? 's' : ''} aplicado${filterCount > 1 ? 's' : ''}`
      : 'Filtros';
  };

  // Função para obter texto de status da busca/filtros
  const getStatusText = () => {
    const queryText = searchQuery.trim();

    if (queryText !== '' && hasActiveSearch) {
      const hasOtherFilters =
        activeFilters &&
        Object.keys(activeFilters).some(
          (key) => key !== 'searchQuery' && key !== 'searchResults' && activeFilters[key as keyof FilterParams]
        );

      if (hasOtherFilters) {
        return `Buscando "${queryText}" com filtros aplicados`;
      } else {
        return `Resultados para "${queryText}"`;
      }
    }

    if (activeFilters) {
      if (activeFilters.onlyFavorites) {
        return 'Seus pets favoritos';
      } else {
        return 'Pets filtrados';
      }
    }

    return 'Todos os pets disponíveis';
  };

  if (authLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#4682B4' }]}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={{ color: '#FFFFFF', marginTop: 20 }}>Verificando autenticação...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground source={require('../../assets/images/backgrounds/Fundo_02.png')} style={styles.backgroundImage}>
        {/* Header com título */}
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Pets Disponíveis</Text>
          <TouchableOpacity style={styles.settingsButton} onPress={() => router.push('/pages/ConfigScreen')}>
            <Image source={require('../../assets/images/Icone/settings-icon.png')} style={styles.settingsIcon} />
          </TouchableOpacity>
        </View>

        {/* Botões de filtro */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, activeFilters && styles.activeFilterButton]}
            onPress={handleAdvancedFilter}
          >
            <Text style={[styles.filterButtonText, activeFilters && styles.activeFilterText]}>
              {activeFilters ? getFilterInfo() : 'Filtro Avançado'}
            </Text>
            {activeFilters ? (
              <TouchableOpacity onPress={clearFilters} style={styles.clearFilterButton}>
                <Text style={styles.clearFilterText}>✕</Text>
              </TouchableOpacity>
            ) : (
              <Image source={require('../../assets/images/Icone/arrow-right.png')} style={styles.arrowIcon} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.myPetsButton}
            onPress={() =>
              router.push({
                pathname: '/pages/MyPetsScreen',
                params: { showMyPets: 'true' },
              })
            }
          >
            <Text style={styles.myPetsButtonText}>Meus Pets</Text>
            <Image source={require('../../assets/images/Icone/arrow-right.png')} style={styles.arrowIcon} />
          </TouchableOpacity>
        </View>

        {/* Indicador de status da busca/filtros */}
        {(hasActiveSearch || activeFilters) && (
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>{getStatusText()}</Text>
            <Text style={styles.resultCount}>
              {filteredPets.length} pet{filteredPets.length !== 1 ? 's' : ''} encontrado
              {filteredPets.length !== 1 ? 's' : ''}
            </Text>
          </View>
        )}

        {/* Lista de pets */}
        <View style={styles.petListContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4682B4" />
              <Text style={styles.loadingText}>Carregando pets...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={refreshData}>
                <Text style={styles.retryButtonText}>Tentar novamente</Text>
              </TouchableOpacity>
            </View>
          ) : filteredPets.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {hasActiveSearch && searchQuery.trim() !== ''
                  ? `Nenhum pet encontrado com o nome "${searchQuery.trim()}"${
                      activeFilters ? ' e filtros aplicados' : ''
                    }`
                  : activeFilters
                  ? 'Nenhum pet encontrado com os filtros selecionados'
                  : 'Nenhum pet disponível para adoção'}
              </Text>
              {activeFilters && (
                <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
                  <Text style={styles.clearFiltersText}>Limpar filtros</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <FlatList
              data={filteredPets}
              renderItem={renderPetItem}
              keyExtractor={(item: Pet) => item.id.toString()}
              contentContainerStyle={styles.petList}
              showsVerticalScrollIndicator={false}
              refreshing={loading}
              onRefresh={refreshData}
            />
          )}
        </View>

        {/* Barra de navegação inferior */}
        <View style={styles.bottomNavigation}>
          <TouchableOpacity style={styles.navItem} onPress={() => router.push('/pages/PetDonation')}>
            <Image source={require('../../assets/images/Icone/adoption-icon.png')} style={styles.navIcon} />
            <Text style={styles.navText}>Doação</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem}>
            <View style={styles.activeCircle}>
              <Image source={require('../../assets/images/Icone/donation-icon.png')} style={styles.navIcon} />
            </View>
            <Text style={styles.activeNavText}>Pets</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => router.push('/pages/ProfileScreen')}>
            <Image source={require('../../assets/images/Icone/profile-icon.png')} style={styles.navIcon} />
            <Text style={styles.navText}>Perfil</Text>
          </TouchableOpacity>
        </View>

        {/* ✅ NOVO: Modal do Sponsor */}
        <SponsorModal visible={showSponsorModal} onClose={handleSponsorModalClose} />
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  userInfoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    marginHorizontal: 15,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    marginBottom: 10,
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4682B4',
    textAlign: 'center',
  },
  petCardWrapper: {
    paddingHorizontal: 15,
    width: '100%',
    marginBottom: 5,
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
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
    marginTop: 10,
    paddingTop: 35,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  settingsButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 25,
    padding: 8,
  },
  settingsIcon: {
    width: 24,
    height: 24,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
    paddingHorizontal: 10,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  activeFilterButton: {
    backgroundColor: '#E8F1F8',
    borderWidth: 1,
    borderColor: '#4682B4',
  },
  filterButtonText: {
    marginRight: 5,
    fontWeight: 'bold',
  },
  activeFilterText: {
    color: '#4682B4',
  },
  clearFilterButton: {
    backgroundColor: '#4682B4',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
  },
  clearFilterText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  myPetsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  myPetsButtonText: {
    marginRight: 5,
    fontWeight: 'bold',
  },
  arrowIcon: {
    width: 12,
    height: 12,
  },
  statusContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    marginHorizontal: 10,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    marginBottom: 5,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4682B4',
    textAlign: 'center',
  },
  resultCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 2,
  },
  petListContainer: {
    flex: 1,
    paddingVertical: 10,
  },
  petList: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#FFFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#FFFF',
    textAlign: 'center',
    marginBottom: 15,
  },
  clearFiltersButton: {
    backgroundColor: '#4682B4',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginTop: 5,
  },
  clearFiltersText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
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
});
