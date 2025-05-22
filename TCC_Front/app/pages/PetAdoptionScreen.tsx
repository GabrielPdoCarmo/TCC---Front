// PetAdoptionScreen.tsx (com implementação de favoritos e usuário logado)
import { router } from 'expo-router';
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

import getFavorito from '@/services/api/Favoritos/getFavorito';
import deleteFavorito from '@/services/api/Favoritos/deleteFavorito';
import checkFavorito from '@/services/api/Favoritos/checkFavorito';

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
}

// Interface para o usuário
interface Usuario {
  id: number;
  nome: string;
  email?: string;
  // outras propriedades do usuário
}

// Obter dimensões da tela
const { width } = Dimensions.get('window');

export default function PetAdoptionScreen() {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [pets, setPets] = useState<Pet[]>([]);
  const [filteredPets, setFilteredPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [usuarioId, setUsuarioId] = useState<number | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);

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
    } catch (err) {
      console.error('Erro ao buscar dados do usuário:', err);
    }
  };

  // Carregar os pets disponíveis quando o componente montar ou quando o ID do usuário mudar
  useEffect(() => {
    const fetchPets = async () => {
      try {
        setLoading(true);
        // Usando a função getPetsByStatus atualizada que já busca pets com status_id = 2
        const response = await getPetsByStatus();

        // Para cada pet, buscar as informações adicionais de forma paralela
        const petsWithDetails = await Promise.all(
          response.map(async (pet: Pet) => {
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
          })
        );

        setPets(petsWithDetails);
        setFilteredPets(petsWithDetails);
        setLoading(false);
      } catch (err) {
        console.error('Erro ao buscar pets:', err);
        setError('Não foi possível carregar os pets. Tente novamente mais tarde.');
        setLoading(false);
      }
    };

    fetchPets();
  }, [usuarioId]);

  // Filtrar pets quando a busca mudar
  useEffect(() => {
    if (searchQuery) {
      const filtered = pets.filter((pet) => pet.nome.toLowerCase().includes(searchQuery.toLowerCase()));
      setFilteredPets(filtered);
    } else {
      setFilteredPets(pets);
    }
  }, [searchQuery, pets]);

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

  // Função para favoritar/desfavoritar um pet
  // Função para favoritar/desfavoritar um pet
  const handleFavorite = async (petId: number) => {
    try {
      // Encontrar o pet atual para verificar se já é favorito
      const pet = pets.find((p) => p.id === petId);
      if (!pet) return;

      if (pet.favorito) {
        // Se já é favorito, remove dos favoritos
        if (usuarioId) {
          await deleteFavorito(usuarioId, petId);
        }
      } else {
        // Se não é favorito, adiciona aos favoritos
        if (usuarioId) {
          await getFavorito(usuarioId, petId);
        }
      }

      // Atualiza o estado local dos pets para refletir o status de favorito
      const updatedPets = pets.map((p) => (p.id === petId ? { ...p, favorito: !p.favorito } : p));
      setPets(updatedPets);

      // Atualiza os pets filtrados também
      const updatedFilteredPets = filteredPets.map((p) => (p.id === petId ? { ...p, favorito: !p.favorito } : p));
      setFilteredPets(updatedFilteredPets);

      console.log(`Pet ID ${petId} ${pet.favorito ? 'removido dos' : 'adicionado aos'} favoritos`);
    } catch (error) {
      console.error('Erro ao atualizar favorito:', error);
      Alert.alert('Erro', 'Não foi possível atualizar os favoritos. Tente novamente.');
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
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground source={require('../../assets/images/backgrounds/Fundo_02.png')} style={styles.backgroundImage}>
        <View style={styles.searchBarContainer}>
          <Image source={require('../../assets/images/Icone/search-icon.png')} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Qual nome de pet você gostaria de buscar?"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity style={styles.settingsButton} onPress={() => router.push('/pages/ConfigScreen')}>
            <Image source={require('../../assets/images/Icone/settings-icon.png')} style={styles.settingsIcon} />
          </TouchableOpacity>
        </View>

        {/* Botões de filtro */}
        <View style={styles.filterContainer}>
          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterButtonText}>Filtro Avançado</Text>
            <Image source={require('../../assets/images/Icone/arrow-right.png')} style={styles.arrowIcon} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.myPetsButton}>
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
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => {
                  setLoading(true);
                  setError(null);
                  // Função para recarregar os dados
                  const fetchPets = async () => {
                    try {
                      // Usando a função getPetsByStatus atualizada que já busca pets com status_id = 2
                      const response = await getPetsByStatus();

                      // Para cada pet, buscar as informações adicionais de forma paralela
                      const petsWithDetails = await Promise.all(
                        response.map(async (pet: Pet) => {
                          // Verifica se as informações de raça e usuário já estão incluídas na resposta
                          let racaInfo = pet.raca_nome ? null : await getRacaById(pet.raca_id);
                          let usuarioInfo = pet.usuario_nome
                            ? null
                            : await getUsuarioByIdComCidadeEstado(pet.usuario_id);
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
                        })
                      );

                      setPets(petsWithDetails);
                      setFilteredPets(petsWithDetails);
                      setLoading(false);
                    } catch (err) {
                      console.error('Erro ao buscar pets:', err);
                      setError('Não foi possível carregar os pets. Tente novamente mais tarde.');
                      setLoading(false);
                    }
                  };

                  fetchPets();
                }}
              >
                <Text style={styles.retryButtonText}>Tentar novamente</Text>
              </TouchableOpacity>
            </View>
          ) : filteredPets.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Nenhum pet encontrado com esse nome</Text>
            </View>
          ) : (
            <FlatList
              data={filteredPets}
              renderItem={renderPetItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.petList}
              showsVerticalScrollIndicator={false}
              refreshing={loading} // Mostra o indicador de refresh quando loading for true
              onRefresh={() => {
                setLoading(true);
                // Função para recarregar os dados
                const fetchPets = async () => {
                  try {
                    // Usando a função getPetsByStatus atualizada que já busca pets com status_id = 2
                    const response = await getPetsByStatus();

                    // Para cada pet, buscar as informações adicionais de forma paralela
                    const petsWithDetails = await Promise.all(
                      response.map(async (pet: Pet) => {
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
                      })
                    );

                    setPets(petsWithDetails);
                    setFilteredPets(petsWithDetails);
                    setLoading(false);
                  } catch (err) {
                    console.error('Erro ao buscar pets:', err);
                    setError('Não foi possível carregar os pets. Tente novamente mais tarde.');
                    setLoading(false);
                  }
                };

                fetchPets();
              }}
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
  },
  searchIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
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
  filterButtonText: {
    marginRight: 5,
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
    color: '#666',
    textAlign: 'center',
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