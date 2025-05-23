// PetAdoptionScreen.tsx (com implementação de favoritos, usuário logado e filtro avançado) - CORRIGIDO
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
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
import getPetByName from '@/services/api/Pets/getPetByName';
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
}

// Obter dimensões da tela
const { width } = Dimensions.get('window');

export default function PetAdoptionScreen() {
  const params = useLocalSearchParams();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [allPets, setAllPets] = useState<Pet[]>([]); // Todos os pets carregados
  const [filteredPets, setFilteredPets] = useState<Pet[]>([]); // Pets exibidos após filtros/busca
  const [loading, setLoading] = useState<boolean>(true);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
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

  // Função para buscar o usuário logado - CORRIGIDA
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

  // Função melhorada para carregar pets com detalhes completos
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
            // Verifica se as informações de raça e usuário já estão incluídas na resposta
            let racaInfo = pet.raca_nome ? null : await getRacaById(pet.raca_id);
            let usuarioInfo = pet.usuario_nome ? null : await getUsuarioByIdComCidadeEstado(pet.usuario_id);
            let statusInfo = pet.status_nome ? null : await getstatusById(pet.status_id);
            // Buscar informações da faixa etária
            let faixaEtariaInfo = pet.faixa_etaria_unidade ? null : await getFaixaEtariaById(pet.faixa_etaria_id);

            // Verificar se o pet é favorito (somente se o usuário estiver logado)
            let isFavorito = false;
            if (usuarioId) {
              isFavorito = await checkFavorito(usuarioId, pet.id);
            }

            return {
              ...pet,
              raca_nome: pet.raca_nome || racaInfo?.nome || 'Desconhecido',
              usuario_nome: pet.usuario_nome || usuarioInfo?.nome || 'Desconhecido',
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
        status_nome: pet.status_nome || 'Disponível para adoção',
        faixa_etaria_unidade: pet.faixa_etaria_unidade || '',
        favorito: false,
      }));
    }
  };

  // Função para aplicar filtros aos pets - CORRIGIDA
  const applyFiltersToData = async (pets: Pet[], filters: FilterParams): Promise<Pet[]> => {
    try {
      let filteredData = pets;

      // Se o filtro é apenas para favoritos - CORREÇÃO PRINCIPAL
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

      // Aplicar outros filtros
      if (filters.especieIds && filters.especieIds.length > 0) {
        filteredData = filteredData.filter((pet: Pet) => 
          filters.especieIds?.includes(pet.especie_id || 0)
        );
      }

      if (filters.racaIds && filters.racaIds.length > 0) {
        filteredData = filteredData.filter((pet: Pet) => 
          filters.racaIds?.includes(pet.raca_id)
        );
      }

      if (filters.faixaEtariaIds && filters.faixaEtariaIds.length > 0) {
        filteredData = filteredData.filter((pet: Pet) => 
          filters.faixaEtariaIds?.includes(pet.faixa_etaria_id)
        );
      }

      // Para filtros de localização, seria necessário mais informações sobre a estrutura dos dados
      // Por enquanto, mantemos apenas os filtros básicos implementados

      return filteredData;
    } catch (error) {
      console.error('Erro ao aplicar filtros:', error);
      return pets;
    }
  };

  // Carregar os pets disponíveis quando o componente montar ou quando houver filtros para aplicar - CORRIGIDO
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

        // Carregar detalhes completos dos pets
        const petsWithDetails = await loadPetsWithDetails(response);
        console.log('Pets com detalhes carregados:', petsWithDetails.length);

        // Armazenar todos os pets
        setAllPets(petsWithDetails);

        // Aplicar filtros se existirem
        if (activeFilters) {
          console.log('Aplicando filtros ativos:', activeFilters);
          const filtered = await applyFiltersToData(petsWithDetails, activeFilters);
          console.log('Pets filtrados:', filtered.length);
          setFilteredPets(filtered);
        } else {
          console.log('Nenhum filtro ativo, mostrando todos os pets');
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
  }, [usuarioId, activeFilters]);

  // Função para realizar a busca (chamada pelo Enter ou clique na lupa)
  const handleSearch = () => {
    if (searchQuery.trim() === '') {
      // Se a busca estiver vazia, voltar aos pets originais (com filtros se houver)
      if (activeFilters) {
        applyFiltersToData(allPets, activeFilters).then(filtered => {
          setFilteredPets(filtered);
        });
      } else {
        setFilteredPets(allPets);
      }
      return;
    }
    
    // Executar a busca
    searchPetsByName(searchQuery.trim());
  };

  // Função para limpar a busca e resetar a lista
  const clearSearch = () => {
    setSearchQuery('');
    // Resetar para todos os pets (com filtros se houver)
    if (activeFilters) {
      applyFiltersToData(allPets, activeFilters).then(filtered => {
        setFilteredPets(filtered);
      });
    } else {
      setFilteredPets(allPets);
    }
  };

  // Função corrigida para buscar pets por nome
  const searchPetsByName = async (name: string) => {
    try {
      setSearchLoading(true);
      
      console.log('Buscando pets por nome:', name);

      // Chama a API para buscar pets pelo nome
      const response = await getPetByName(name);
      
      console.log('Resposta da API getPetByName:', response);
      
      // Normalizar a resposta usando a função auxiliar
      const petsArray = normalizeApiResponse(response);

      // Verificar se encontrou pets
      if (petsArray.length === 0) {
        console.log('Nenhum pet encontrado com o nome:', name);
        setFilteredPets([]);
        setSearchLoading(false);
        return;
      }

      console.log('Pets encontrados:', petsArray.length);

      // Carregar detalhes completos dos pets encontrados
      const petsWithDetails = await loadPetsWithDetails(petsArray);

      // Aplicar filtros ativos nos resultados da busca, se houver
      if (activeFilters) {
        const filtered = await applyFiltersToData(petsWithDetails, activeFilters);
        setFilteredPets(filtered);
      } else {
        setFilteredPets(petsWithDetails);
      }

      setSearchLoading(false);
    } catch (err) {
      console.error('Erro ao buscar pets por nome:', err);
      
      // Verificar se o erro contém informação sobre "Pet não encontrado"
      const errorMessage = err?.toString() || '';
      if (errorMessage.includes('Pet não encontrado') || 
          errorMessage.includes('404') || 
          errorMessage.includes('Not found')) {
        console.log('Pet não encontrado na API:', name);
      } else {
        // Para outros tipos de erro, logar detalhes para debug
        console.error('Erro inesperado na busca:', {
          message: errorMessage,
          error: err
        });
      }
      
      // Em qualquer caso de erro, mostrar lista vazia
      setFilteredPets([]);
      setSearchLoading(false);
    }
  };

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

      // Carregar detalhes completos dos pets
      const petsWithDetails = await loadPetsWithDetails(response);

      // Armazenar todos os pets
      setAllPets(petsWithDetails);

      // Aplicar filtros se existirem
      if (activeFilters) {
        const filtered = await applyFiltersToData(petsWithDetails, activeFilters);
        setFilteredPets(filtered);
      } else {
        setFilteredPets(petsWithDetails);
      }

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
    // Aqui você pode navegar para uma tela de formulário de adoção
    // router.push({
    //   // pathname: '/pages/AdoptionForm',
    //   // params: { petId }
    // });
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
    // Navegar para a tela de filtro avançado com os filtros atuais, se houver
    const currentFiltersStr = activeFilters ? encodeURIComponent(JSON.stringify(activeFilters)) : '';
    router.push({
      pathname: '/pages/FilterScreen',
      params: { filters: currentFiltersStr }
    });
  };

  // Função para favoritar/desfavoritar um pet - CORRIGIDA
  const handleFavorite = async (petId: number) => {
    if (!usuarioId) {
      Alert.alert('Erro', 'Você precisa estar logado para favoritar pets.');
      return;
    }

    try {
      // Encontrar o pet atual para verificar se já é favorito
      const pet = allPets.find((p: Pet) => p.id === petId);
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

      // CORREÇÃO: Se o filtro de favoritos está ativo e o pet foi desfavoritado
      if (activeFilters?.onlyFavorites && wasfavorited) {
        console.log('Pet desfavoritado com filtro de favoritos ativo, atualizando lista...');
        
        // Recarregar a lista de favoritos
        setTimeout(async () => {
          try {
            const filtered = await applyFiltersToData(updatedAllPets, activeFilters);
            setFilteredPets(filtered);
            console.log(`Lista atualizada: ${filtered.length} pets favoritos restantes`);
          } catch (error) {
            console.error('Erro ao atualizar lista de favoritos:', error);
            // Em caso de erro, recarregar a página completamente
            refreshData();
          }
        }, 300); // Pequeno delay para garantir que a API foi atualizada
      } else {
        // Para outros casos, atualizar normalmente
        const updatedFilteredPets = filteredPets.map((p: Pet) => (p.id === petId ? { ...p, favorito: !p.favorito } : p));
        setFilteredPets(updatedFilteredPets);
      }

      console.log(`Pet ID ${petId} ${wasfavorited ? 'removido dos' : 'adicionado aos'} favoritos`);
    } catch (error) {
      console.error('Erro ao atualizar favorito:', error);
      Alert.alert('Erro', 'Não foi possível atualizar os favoritos. Tente novamente.');
    }
  };

  // Função para limpar filtros ativos
  const clearFilters = async () => {
    await AsyncStorage.removeItem('@App:petFilters');
    setActiveFilters(null);
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
    
    return filterCount > 0 ? `${filterCount} filtro${filterCount > 1 ? 's' : ''} aplicado${filterCount > 1 ? 's' : ''}` : 'Filtros';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground source={require('../../assets/images/backgrounds/Fundo_02.png')} style={styles.backgroundImage}>
        <View style={styles.searchBarContainer}>
          <TouchableOpacity onPress={handleSearch} style={styles.searchIconButton}>
            <Image source={require('../../assets/images/Icone/search-icon.png')} style={styles.searchIcon} />
          </TouchableOpacity>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar pet por nome..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            multiline={false}
            numberOfLines={1}
            textAlign="left"
            textAlignVertical="center"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearSearchButton}>
              <Text style={styles.clearSearchText}>✕</Text>
            </TouchableOpacity>
          )}
          {searchLoading ? (
            <ActivityIndicator size="small" color="#4682B4" style={styles.searchLoading} />
          ) : (
            <TouchableOpacity style={styles.settingsButton} onPress={() => router.push('/pages/ConfigScreen')}>
              <Image source={require('../../assets/images/Icone/settings-icon.png')} style={styles.settingsIcon} />
            </TouchableOpacity>
          )}
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
                {searchQuery.trim() !== '' 
                  ? `Nenhum pet encontrado com o nome "${searchQuery.trim()}"` 
                  : activeFilters 
                    ? 'Nenhum pet encontrado com os filtros selecionados' 
                    : 'Nenhum pet disponível para adoção'}
              </Text>
              {activeFilters && (
                <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
                  <Text style={styles.clearFiltersText}>Limpar filtros</Text>
                </TouchableOpacity>
              )}
              {searchQuery.trim() !== '' && (
                <TouchableOpacity style={styles.clearFiltersButton} onPress={clearSearch}>
                  <Text style={styles.clearFiltersText}>Limpar busca</Text>
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
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8E8E8',
    borderRadius: 25,
    paddingHorizontal: 15,
    marginHorizontal: 10,
    marginTop: 10,
    height: 50,
    minHeight: 50,
  },
  searchIconButton: {
    padding: 5,
    marginRight: 5,
  },
  searchIcon: {
    width: 20,
    height: 20,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
    paddingVertical: 0,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  clearSearchButton: {
    padding: 0,
    marginRight: 5,
    backgroundColor: '#ccc',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearSearchText: {
    color: '#666',
    fontSize: 12,
    fontWeight: 'bold',
  },
  searchLoading: {
    marginLeft: 10,
  },
  settingsButton: {
    marginLeft: 5,
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