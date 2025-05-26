// PetAdoptionScreen.tsx (sem barra de busca) - CORRIGIDO COM FOTO DO USUÁRIO
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
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

import PetsCard from '@/components/modal_Pet/PetsCard';
import getPetsByStatus from '@/services/api/Pets/getPetsByStatus';
import getUsuarioByIdComCidadeEstado from '@/services/api/Usuario/getUsuarioByIdComCidadeEstado';
import getUsuarioById from '@/services/api/Usuario/getUsuarioById';
import getRacaById from '@/services/api/Raca/getRacaById';
import getstatusById from '@/services/api/Status/getstatusById';
import getFaixaEtariaById from '@/services/api/Faixa-etaria/getFaixaEtariaById';
import getFavorito from '@/services/api/Favoritos/getFavorito';
import deleteFavorito from '@/services/api/Favoritos/deleteFavorito';
import checkFavorito from '@/services/api/Favoritos/checkFavorito';

// Importar serviços para busca de pets filtrados
import getFavoritosPorUsuario from '@/services/api/Favoritos/getFavoritosPorUsuario';

// Definindo uma interface para o tipo Pet
interface Pet {
  id: number;
  nome: string;
  raca_id: number;
  raca_nome?: string;
  idade: string;
  usuario_id: number;
  usuario_nome?: string;
  usuario_foto?: string | null; // ✅ CORRIGIDO: Aceita null para foto do usuário
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

// Interface para o usuário
interface Usuario {
  id: number;
  nome: string;
  email?: string;
  foto?: string; // ✅ NOVO: Foto do usuário
  cidade?: {
    id: number;
    nome: string;
  };
  estado?: {
    id: number;
    nome: string;
  };
  // outras propriedades do usuário
}

// Interface para os filtros
interface FilterParams {
  especieIds?: number[];
  faixaEtariaIds?: number[];
  faixasEtariaIdades?: { [key: number]: number }; // Mapeamento de ID da faixa etária para idade específica (como número)
  racaIds?: number[];
  estadoIds?: number[];
  cidadeIds?: number[];
  onlyFavorites?: boolean;
  favoritePetIds?: number[]; // IDs dos pets favoritos do usuário
  // Parâmetros para busca por nome vindos dos filtros
  searchQuery?: string;
  searchResults?: Pet[];
}

// Obter dimensões da tela
const { width } = Dimensions.get('window');

export default function PetAdoptionScreen() {
  const params = useLocalSearchParams();
  const [allPets, setAllPets] = useState<Pet[]>([]); // Todos os pets carregados
  const [filteredPets, setFilteredPets] = useState<Pet[]>([]); // Pets exibidos após filtros/busca
  const [searchResults, setSearchResults] = useState<Pet[]>([]); // Resultados da busca por nome (vinda dos filtros)
  const [hasActiveSearch, setHasActiveSearch] = useState<boolean>(false); // Flag para indicar se há busca ativa
  const [searchQuery, setSearchQuery] = useState<string>(''); // Query de busca (vinda dos filtros)
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [usuarioId, setUsuarioId] = useState<number | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [activeFilters, setActiveFilters] = useState<FilterParams | null>(null);

  // Função auxiliar para normalizar respostas da API
  const normalizeApiResponse = (response: any): Pet[] => {
    // Se a resposta é null, undefined ou false
    if (!response) {
      return [];
    }

    // Se já é um array
    if (Array.isArray(response)) {
      return response;
    }

    // Se é um objeto com propriedades de pet
    if (typeof response === 'object' && response.id) {
      return [response as Pet];
    }

    // Se é um objeto com uma propriedade que contém o array/pet
    if (typeof response === 'object') {
      // Verificar se tem propriedades comuns que podem conter os dados
      const possibleArrays = ['data', 'pets', 'results', 'items'];
      for (const prop of possibleArrays) {
        if (response[prop]) {
          return normalizeApiResponse(response[prop]);
        }
      }
    }

    console.warn('Formato de resposta não reconhecido:', response);
    return [];
  };

  // Verificar se há filtros para aplicar quando a tela recebe parâmetros
  useEffect(() => {
    const checkForFilters = async () => {
      if (params.applyFilters === 'true') {
        const storedFilters = await AsyncStorage.getItem('@App:petFilters');
        if (storedFilters) {
          const parsedFilters = JSON.parse(storedFilters);
          
          // Verificar se há busca por nome nos filtros
          if (parsedFilters.searchQuery && parsedFilters.searchResults) {
            console.log('Aplicando busca por nome dos filtros:', parsedFilters.searchQuery);
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

  // Carregar o ID do usuário logado do AsyncStorage na montagem do componente
  useEffect(() => {
    fetchUsuarioLogado();
  }, []);

  // Função para buscar o usuário logado
  const fetchUsuarioLogado = async () => {
    try {
      // Usar a mesma chave '@App:userId' que foi usada para armazenar
      const userId = await AsyncStorage.getItem('@App:userId');

      if (!userId) {
        console.error('ID do usuário não encontrado no AsyncStorage');
        // Mantenha isso apenas para debug, não altere o estado de erro para permitir que o usuário veja os pets
        // mesmo sem estar logado
        return;
      }

      const userIdNumber = parseInt(userId);
      setUsuarioId(userIdNumber);

      // Buscar dados do usuário da API
      const userData = await getUsuarioById(userIdNumber);

      if (!userData) {
        console.error('Dados do usuário não encontrados');
        return;
      }

      console.log('Dados do usuário carregados:', userData);
      setUsuario(userData);
      
      // CORREÇÃO: Armazenar também os dados completos para uso no FilterScreen
      await AsyncStorage.setItem('@App:userData', JSON.stringify(userData));
      
    } catch (err) {
      console.error('Erro ao buscar dados do usuário:', err);
    }
  };

  // ✅ FUNÇÃO MELHORADA para carregar pets com detalhes completos incluindo foto do usuário
  const loadPetsWithDetails = async (pets: Pet[]): Promise<Pet[]> => {
    // Verificar se pets é um array válido
    if (!Array.isArray(pets) || pets.length === 0) {
      console.log('Array de pets vazio ou inválido');
      return [];
    }

    try {
      return Promise.all(
        pets.map(async (pet: Pet) => {
          try {
            // Buscar informações básicas se não estiverem incluídas
            let racaInfo = pet.raca_nome ? null : await getRacaById(pet.raca_id);
            let statusInfo = pet.status_nome ? null : await getstatusById(pet.status_id);
            let faixaEtariaInfo = pet.faixa_etaria_unidade ? null : await getFaixaEtariaById(pet.faixa_etaria_id);

            // ✅ CORREÇÃO: Buscar dados do usuário para localização E foto separadamente
            let usuarioInfo = null;
            let usuarioFotoInfo = null;

            // Se não temos nome do usuário, buscar dados completos com localização
            if (!pet.usuario_nome) {
              usuarioInfo = await getUsuarioByIdComCidadeEstado(pet.usuario_id);
            }

            // ✅ SEMPRE buscar a foto usando getUsuarioById
            if (!pet.usuario_foto) {
              usuarioFotoInfo = await getUsuarioById(pet.usuario_id);
            }

            // Verificar se o pet é favorito (somente se o usuário estiver logado)
            let isFavorito = false;
            if (usuarioId) {
              isFavorito = await checkFavorito(usuarioId, pet.id);
            }

            return {
              ...pet,
              raca_nome: pet.raca_nome || racaInfo?.nome || 'Desconhecido',
              usuario_nome: pet.usuario_nome || usuarioInfo?.nome || 'Desconhecido',
              usuario_foto: pet.usuario_foto || usuarioFotoInfo?.foto || null, // ✅ FOTO via getUsuarioById
              usuario_cidade_id: pet.usuario_cidade_id || usuarioInfo?.cidade?.id,
              usuario_estado_id: pet.usuario_estado_id || usuarioInfo?.estado?.id,
              status_nome: pet.status_nome || statusInfo?.nome || 'Disponível para adoção',
              faixa_etaria_unidade: pet.faixa_etaria_unidade || faixaEtariaInfo?.unidade || '',
              favorito: isFavorito,
            };
          } catch (petError) {
            console.error(`Erro ao carregar detalhes do pet ${pet.id}:`, petError);
            // Retorna o pet com informações básicas em caso de erro
            return {
              ...pet,
              raca_nome: pet.raca_nome || 'Desconhecido',
              usuario_nome: pet.usuario_nome || 'Desconhecido',
              usuario_foto: pet.usuario_foto || null, // ✅ NOVO: Foto padrão em caso de erro
              status_nome: pet.status_nome || 'Disponível para adoção',
              faixa_etaria_unidade: pet.faixa_etaria_unidade || '',
              favorito: false,
            };
          }
        })
      );
    } catch (error) {
      console.error('Erro geral ao carregar detalhes dos pets:', error);
      return pets.map(pet => ({
        ...pet,
        raca_nome: pet.raca_nome || 'Desconhecido',
        usuario_nome: pet.usuario_nome || 'Desconhecido',
        usuario_foto: pet.usuario_foto || null, // ✅ NOVO: Foto padrão em caso de erro geral
        status_nome: pet.status_nome || 'Disponível para adoção',
        faixa_etaria_unidade: pet.faixa_etaria_unidade || '',
        favorito: false,
      }));
    }
  };

  // Função para aplicar filtros aos pets
  const applyFiltersToData = async (pets: Pet[], filters: FilterParams): Promise<Pet[]> => {
    try {
      let filteredData = pets;

      console.log('Aplicando filtros a', pets.length, 'pets');
      console.log('Filtros ativos:', filters);

      // Se o filtro é apenas para favoritos
      if (filters.onlyFavorites && usuarioId) {
        console.log('Aplicando filtro de favoritos para usuário:', usuarioId);
        
        // Buscar favoritos do usuário
        const favoritesResponse = await getFavoritosPorUsuario(usuarioId);
        console.log('Favoritos encontrados:', favoritesResponse);
        
        // Extrair os pets dos favoritos
        const favoritePets = favoritesResponse.map((favorito: any) => favorito.pet).filter(Boolean);
        console.log('Pets extraídos dos favoritos:', favoritePets);
        
        if (favoritePets.length === 0) {
          console.log('Nenhum pet favorito encontrado');
          return [];
        }
        
        // Carregar detalhes completos dos pets favoritos
        const favoritePetsWithDetails = await loadPetsWithDetails(favoritePets);
        console.log('Pets favoritos com detalhes:', favoritePetsWithDetails);
        
        return favoritePetsWithDetails;
      }

      // Aplicar filtros de espécie
      if (filters.especieIds && filters.especieIds.length > 0) {
        console.log('Aplicando filtro de espécies:', filters.especieIds);
        filteredData = filteredData.filter((pet: Pet) => 
          filters.especieIds?.includes(pet.especie_id || 0)
        );
        console.log('Pets após filtro de espécie:', filteredData.length);
      }

      // Aplicar filtros de raça
      if (filters.racaIds && filters.racaIds.length > 0) {
        console.log('Aplicando filtro de raças:', filters.racaIds);
        filteredData = filteredData.filter((pet: Pet) => 
          filters.racaIds?.includes(pet.raca_id)
        );
        console.log('Pets após filtro de raça:', filteredData.length);
      }

      // Aplicar filtros de faixa etária
      if (filters.faixaEtariaIds && filters.faixaEtariaIds.length > 0) {
        console.log('Aplicando filtro de faixa etária:', filters.faixaEtariaIds);
        filteredData = filteredData.filter((pet: Pet) => 
          filters.faixaEtariaIds?.includes(pet.faixa_etaria_id)
        );
        console.log('Pets após filtro de faixa etária:', filteredData.length);

        // Aplicar filtros de idade específica se existirem
        if (filters.faixasEtariaIdades && Object.keys(filters.faixasEtariaIdades).length > 0) {
          console.log('Aplicando filtros de idade específica:', filters.faixasEtariaIdades);
          filteredData = filteredData.filter((pet: Pet) => {
            const idadeEspecifica = filters.faixasEtariaIdades?.[pet.faixa_etaria_id];
            if (idadeEspecifica !== undefined) {
              // Converter idade do pet para número para comparação
              const idadePet = parseInt(pet.idade);
              return !isNaN(idadePet) && idadePet === idadeEspecifica;
            }
            return true; // Se não há idade específica para esta faixa, manter o pet
          });
          console.log('Pets após filtro de idade específica:', filteredData.length);
        }
      }

      // Aplicar filtros de localização (estado e cidade)
      // Filtrar por estados
      if (filters.estadoIds && filters.estadoIds.length > 0) {
        console.log('Aplicando filtro de estados:', filters.estadoIds);
        filteredData = filteredData.filter((pet: Pet) => 
          pet.usuario_estado_id && filters.estadoIds?.includes(pet.usuario_estado_id)
        );
        console.log('Pets após filtro de estado:', filteredData.length);
      }

      // Filtrar por cidades
      if (filters.cidadeIds && filters.cidadeIds.length > 0) {
        console.log('Aplicando filtro de cidades:', filters.cidadeIds);
        filteredData = filteredData.filter((pet: Pet) => 
          pet.usuario_cidade_id && filters.cidadeIds?.includes(pet.usuario_cidade_id)
        );
        console.log('Pets após filtro de cidade:', filteredData.length);
      }

      console.log('Total de pets após todos os filtros:', filteredData.length);
      return filteredData;
    } catch (error) {
      console.error('Erro ao aplicar filtros:', error);
      return pets;
    }
  };

  // Aplicar filtros considerando busca ativa
  const applyCurrentFilters = async () => {
    console.log('Aplicando filtros atuais...');
    console.log('Busca ativa:', hasActiveSearch);
    console.log('Query de busca:', searchQuery);
    console.log('Filtros ativos:', activeFilters);

    try {
      let baseData: Pet[];
      
      // Determinar dados base: se há busca, usar resultados da busca; senão, usar todos os pets
      if (hasActiveSearch && searchQuery.trim() !== '') {
        baseData = searchResults;
        console.log('Usando resultados da busca como base:', baseData.length, 'pets');
      } else {
        baseData = allPets;
        console.log('Usando todos os pets como base:', baseData.length, 'pets');
      }

      // Aplicar filtros se existirem (excluindo busca por nome que já foi aplicada)
      if (activeFilters) {
        // Criar uma cópia dos filtros sem a busca por nome para evitar conflito
        const filtersWithoutSearch = { ...activeFilters };
        delete filtersWithoutSearch.searchQuery;
        delete filtersWithoutSearch.searchResults;
        
        const filtered = await applyFiltersToData(baseData, filtersWithoutSearch);
        console.log('Pets após aplicar filtros:', filtered.length);
        setFilteredPets(filtered);
      } else {
        console.log('Nenhum filtro ativo, usando dados base');
        setFilteredPets(baseData);
      }
    } catch (error) {
      console.error('Erro ao aplicar filtros atuais:', error);
      // Em caso de erro, usar dados mais seguros disponíveis
      if (hasActiveSearch && searchQuery.trim() !== '') {
        setFilteredPets(searchResults);
      } else {
        setFilteredPets(allPets);
      }
    }
  };

  // Carregar os pets disponíveis quando o componente montar
  useEffect(() => {
    const fetchPets = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('Carregando pets com status_id = 2...');
        
        // Buscar todos os pets disponíveis (status_id = 2)
        const response = await getPetsByStatus();
        console.log('Pets encontrados:', response?.length || 0);

        if (!response || response.length === 0) {
          console.log('Nenhum pet encontrado com status_id = 2');
          setAllPets([]);
          setFilteredPets([]);
          setLoading(false);
          return;
        }

        // Carregar detalhes completos dos pets (incluindo foto do usuário)
        const petsWithDetails = await loadPetsWithDetails(response);
        console.log('Pets com detalhes carregados:', petsWithDetails.length);

        // Armazenar todos os pets
        setAllPets(petsWithDetails);

        // Aplicar filtros atuais (considerando busca e filtros)
        // Mas não fazer isso durante o carregamento inicial se não há filtros
        if (!activeFilters && !hasActiveSearch) {
          setFilteredPets(petsWithDetails);
        }

        setLoading(false);
      } catch (err) {
        console.error('Erro ao buscar pets:', err);
        setError('Não foi possível carregar os pets. Tente novamente mais tarde.');
        setLoading(false);
      }
    };

    fetchPets();
  }, [usuarioId]);

  // Aplicar filtros sempre que eles mudarem ou quando há mudança na busca
  useEffect(() => {
    if (!loading) {
      // Aplicar filtros sempre que houver mudança nos filtros, busca ou dados
      applyCurrentFilters();
    }
  }, [activeFilters, hasActiveSearch, searchResults, allPets, loading]);

  // Função para recarregar os dados
  const refreshData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar todos os pets disponíveis (status_id = 2)
      const response = await getPetsByStatus();

      if (!response || response.length === 0) {
        setAllPets([]);
        setFilteredPets([]);
        setLoading(false);
        return;
      }

      // Carregar detalhes completos dos pets (incluindo foto do usuário)
      const petsWithDetails = await loadPetsWithDetails(response);

      // Armazenar todos os pets
      setAllPets(petsWithDetails);

      // Reaplicar filtros e busca
      // O useEffect cuidará da aplicação automática
      setLoading(false);
    } catch (err) {
      console.error('Erro ao recarregar pets:', err);
      setError('Não foi possível carregar os pets. Tente novamente mais tarde.');
      setLoading(false);
    }
  };

  // Função para lidar com a adoção de um pet
  const handleAdopt = (petId: number) => {
    // Implementar lógica de adoção
    console.log(`Iniciar processo de adoção para o pet ID: ${petId}`);
  };

  // Função para ver detalhes do pet
  const handleViewDetails = (petId: number) => {
    router.push({
      pathname: '/pages/PetDetailsScreen',
      params: { petId },
    });
    console.log(`Ver detalhes do pet ID: ${petId}`);
  };

  // Função para abrir a tela de filtro avançado
  const handleAdvancedFilter = () => {
    // Incluir busca atual nos filtros se existir
    let currentFiltersToPass = activeFilters ? { ...activeFilters } : {};
    
    // Se há busca ativa, incluir nos filtros
    if (hasActiveSearch && searchQuery.trim() !== '') {
      currentFiltersToPass.searchQuery = searchQuery.trim();
      currentFiltersToPass.searchResults = searchResults;
    }

    const currentFiltersStr = Object.keys(currentFiltersToPass).length > 0 
      ? encodeURIComponent(JSON.stringify(currentFiltersToPass)) 
      : '';
      
    router.push({
      pathname: '/pages/FilterScreen',
      params: { filters: currentFiltersStr }
    });
  };

  // Função para favoritar/desfavoritar um pet
  const handleFavorite = async (petId: number) => {
    if (!usuarioId) {
      Alert.alert('Erro', 'Você precisa estar logado para favoritar pets.');
      return;
    }

    try {
      // Encontrar o pet atual para verificar se já é favorito
      const pet = filteredPets.find((p: Pet) => p.id === petId);
      if (!pet) return;

      const wasfavorited = pet.favorito;

      if (pet.favorito) {
        // Se já é favorito, remove dos favoritos
        await deleteFavorito(usuarioId, petId);
      } else {
        // Se não é favorito, adiciona aos favoritos
        await getFavorito(usuarioId, petId);
      }

      // Atualiza o estado local dos pets para refletir o status de favorito
      const updatedAllPets = allPets.map((p: Pet) => (p.id === petId ? { ...p, favorito: !p.favorito } : p));
      setAllPets(updatedAllPets);

      // Atualizar também os resultados da busca se houver busca ativa
      if (hasActiveSearch) {
        const updatedSearchResults = searchResults.map((p: Pet) => (p.id === petId ? { ...p, favorito: !p.favorito } : p));
        setSearchResults(updatedSearchResults);
      }

      // A aplicação de filtros será feita automaticamente pelo useEffect quando
      // allPets ou searchResults mudarem

      console.log(`Pet ID ${petId} ${wasfavorited ? 'removido dos' : 'adicionado aos'} favoritos`);
    } catch (error) {
      console.error('Erro ao atualizar favorito:', error);
      Alert.alert('Erro', 'Não foi possível atualizar os favoritos. Tente novamente.');
    }
  };

  // Função para limpar filtros ativos
  const clearFilters = async () => {
    console.log('Limpando filtros...');
    await AsyncStorage.removeItem('@App:petFilters');
    setActiveFilters(null);
    
    // Limpar também busca se ela veio dos filtros
    if (activeFilters?.searchQuery) {
      setSearchQuery('');
      setSearchResults([]);
      setHasActiveSearch(false);
    }
    
    // A função applyCurrentFilters será chamada automaticamente pelo useEffect
    // quando activeFilters mudar para null
  };

  // Renderizar cada item da lista de pets
  const renderPetItem = ({ item }: { item: Pet }) => (
    <View style={styles.petCardWrapper}>
      <PetsCard
        pet={item}
        onAdopt={() => handleAdopt(item.id)}
        OnDetalhes={() => handleViewDetails(item.id)}
        onFavorite={() => handleFavorite(item.id)}
      />
    </View>
  );

  // Função para verificar se há filtros ativos e mostrar informações na interface
  const getFilterInfo = () => {
    if (!activeFilters) return '';
    
    // Contar filtros aplicados
    let filterCount = 0;
    
    // Contar espécies
    if (activeFilters.especieIds && activeFilters.especieIds.length > 0) {
      filterCount += activeFilters.especieIds.length;
    }
    
    // Contar faixas etárias (e considerar idades específicas como filtros adicionais)
    if (activeFilters.faixaEtariaIds && activeFilters.faixaEtariaIds.length > 0) {
      filterCount += activeFilters.faixaEtariaIds.length;
      
      // Contar idades específicas como filtros adicionais
      if (activeFilters.faixasEtariaIdades) {
        filterCount += Object.keys(activeFilters.faixasEtariaIdades).length;
      }
    }
    
    // Contar raças
    if (activeFilters.racaIds && activeFilters.racaIds.length > 0) {
      filterCount += activeFilters.racaIds.length;
    }
    
    // Contar estados
    if (activeFilters.estadoIds && activeFilters.estadoIds.length > 0) {
      filterCount += activeFilters.estadoIds.length;
    }
    
    // Contar cidades
    if (activeFilters.cidadeIds && activeFilters.cidadeIds.length > 0) {
      filterCount += activeFilters.cidadeIds.length;
    }
    
    // Contar favoritos
    if (activeFilters.onlyFavorites) {
      filterCount += 1;
    }
    
    // Contar busca por nome
    if (activeFilters.searchQuery) {
      filterCount += 1;
    }
    
    return filterCount > 0 ? `${filterCount} filtro${filterCount > 1 ? 's' : ''} aplicado${filterCount > 1 ? 's' : ''}` : 'Filtros';
  };

  // Função para obter texto de status da busca/filtros
  const getStatusText = () => {
    const queryText = searchQuery.trim();
    
    // Se há busca ativa (vinda dos filtros)
    if (queryText !== '' && hasActiveSearch) {
      // Verificar se há outros filtros além da busca
      const hasOtherFilters = activeFilters && Object.keys(activeFilters).some(key => 
        key !== 'searchQuery' && key !== 'searchResults' && activeFilters[key as keyof FilterParams]
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
            onPress={() => router.push({
              pathname: '/pages/ProfileScreen',
              params: { showMyPets: 'true' }
            })}
          >
            <Text style={styles.myPetsButtonText}>Meus Pets</Text>
            <Image source={require('../../assets/images/Icone/arrow-right.png')} style={styles.arrowIcon} />
          </TouchableOpacity>
        </View>

        {/* Indicador de status da busca/filtros */}
        {(hasActiveSearch || activeFilters) && (
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>{getStatusText()}</Text>
            <Text style={styles.resultCount}>{filteredPets.length} pet{filteredPets.length !== 1 ? 's' : ''} encontrado{filteredPets.length !== 1 ? 's' : ''}</Text>
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
                  ? `Nenhum pet encontrado com o nome "${searchQuery.trim()}"${activeFilters ? ' e filtros aplicados' : ''}` 
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
            <Text style={styles.navText}>Adoção</Text>
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
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4682B4',
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
  // NOVO: Header sem barra de busca
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
    marginTop: 10,
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