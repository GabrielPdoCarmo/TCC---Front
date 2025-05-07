import { router, useFocusEffect } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  SafeAreaView,
  Alert,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import PetDonationModal from '@/components/modal_Pet/PetDonationModal';
import { getPetsByUsuarioId, getUsuarioById, getRacaById, getFaixaEtariaById,getstatusById } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PetCard from '@/components/modal_Pet/PetCard';

// Define a interface Pet com informações aprimoradas
interface Pet {
  id: number;
  nome: string;
  raca_id: number;
  raca_nome?: string;
  idade: string;
  usuario_id: number;
  usuario_nome?: string;
  imagem?: string;
  faixa_etaria_id: number;
  faixa_etaria_unidade?: string;
  status_id: number;
  status_nome?: string;
}

// Define a interface Usuario
interface Usuario {
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

// Define a interface Raca
interface Raca {
  id: number;
  nome: string;
}

// Define a interface FaixaEtaria
interface FaixaEtaria {
  id: number;
  nome: string;
  unidade: string;
}

export default function PetDonationScreen() {
  // Estado para controlar a visibilidade do modal
  const [modalVisible, setModalVisible] = useState(false);
  // Estado para armazenar a lista de pets
  const [pets, setPets] = useState<Pet[]>([]);
  // Estado para indicar carregamento
  const [loading, setLoading] = useState(true);
  // Estado para armazenar o usuário atual
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  // Estado para controlar erros
  const [error, setError] = useState('');

  // Função para buscar os pets do usuário logado com dados de faixa etária
  const fetchUserPets = async () => {
    try {
      setLoading(true);
      setError('');

      // Obter o ID do usuário do AsyncStorage
      const userId = await AsyncStorage.getItem('@App:userId');

      if (!userId) {
        setError('Usuário não encontrado. Por favor, faça login novamente.');
        setLoading(false);
        return;
      }

      // Converter o ID para número
      const userIdNumber = parseInt(userId, 10);
      console.log('Buscando pets para o usuário ID:', userIdNumber);

      // Obter informações do usuário
      const userData = await getUsuarioById(userIdNumber);
      setCurrentUser(userData);
      console.log('Dados do usuário carregados:', userData);

      // Obter os pets do usuário
      const userPets = await getPetsByUsuarioId(userIdNumber);
      console.log('Pets do usuário carregados:', userPets);

      // Enriquecer os dados dos pets com nomes de raças, responsáveis e faixa etária
      const enrichedPets = await Promise.all(
        userPets.map(async (pet: Pet) => {
          try {
            // Obter informações da raça
            const racaData = await getRacaById(pet.raca_id);

            // Obter informações da faixa etária
            const faixaEtariaData = await getFaixaEtariaById(pet.faixa_etaria_id);

            // Obter informações do status
            const statusData = await getstatusById(pet.status_id);
            // Obter informações do usuário responsável (se diferente do usuário atual)
            let usuarioNome = userData?.nome || 'Usuário não identificado';

            if (pet.usuario_id !== userIdNumber) {
              const petUsuario = await getUsuarioById(pet.usuario_id);

              if (petUsuario) {
                usuarioNome = petUsuario.nome;
              }
            }

            // Criar objeto pet enriquecido com os nomes e informações da faixa etária
            return {
              ...pet,
              raca_nome: racaData?.nome || `Raça não encontrada (ID: ${pet.raca_id})`,
              usuario_nome: usuarioNome,
              faixa_etaria_unidade: faixaEtariaData?.unidade,
              status_nome: statusData.nome,
            };
          } catch (error) {
            console.error(`Erro ao enriquecer dados do pet ${pet.nome}:`, error);

            // Em caso de erro, retornar o pet com informações de fallback
            return {
              ...pet,
              raca_nome: `Raça não disponível (ID: ${pet.raca_id})`,
              usuario_nome: `Usuário não disponível (ID: ${pet.usuario_id})`,
            };
          }
        })
      );

      console.log('Pets enriquecidos:', enrichedPets);
      setPets(enrichedPets);
    } catch (error) {
      console.error('Erro ao buscar pets:', error);
      setError('Ocorreu um erro ao carregar seus pets. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Carregar a lista de pets quando o componente montar
  useEffect(() => {
    fetchUserPets();
  }, []);

  // Usar useFocusEffect para recarregar os dados quando a tela receber foco
  useFocusEffect(
    useCallback(() => {
      console.log('Tela recebeu foco - atualizando dados');
      fetchUserPets();
      return () => {
        // Cleanup function (opcional)
        console.log('Tela perdeu foco');
      };
    }, [])
  );

  // Função para abrir o modal
  const handleOpenModal = () => {
    setModalVisible(true);
  };

  // Função para fechar o modal e atualizar a lista de pets
  const handleCloseModal = () => {
    setModalVisible(false);
    // Recarrega a lista de pets após fechar o modal
    fetchUserPets();
  };

  // Função para processar os dados do formulário
  const handleSubmitForm = async (formData: any) => {
    console.log('Dados do pet para doação:', formData);

    // Aqui você pode adicionar a lógica para salvar os dados,
    // como enviar para uma API, salvar no banco de dados local, etc.

    Alert.alert('Sucesso!', 'Os dados do pet foram salvos com sucesso.', [
      {
        text: 'OK',
        onPress: () => {
          handleCloseModal();
          // Não é necessário chamar fetchUserPets aqui, pois handleCloseModal já faz isso
        },
      },
    ]);
  };

  // Função para enviar pet para adoção
  const handleAdoptPet = (petId: number) => {
    Alert.alert('Enviar para Adoção', 'Deseja realmente disponibilizar este pet para ser adotado?', [
      {
        text: 'Cancelar',
        style: 'cancel',
      },
      {
        text: 'Confirmar',
        onPress: () => {
          // Implementar lógica para disponibilizar o pet para adoção
          Alert.alert('Sucesso', 'Pet disponibilizado para ser adotado com sucesso!');
          // Atualizar a lista após a operação
          fetchUserPets();
        },
      },
    ]);
  };

  // Função para editar um pet
  const handleEditPet = (petId: number) => {
    // Implementar lógica para editar o pet
    console.log(`Editar pet com ID: ${petId}`);
    // Poderia abrir o modal preenchido com os dados do pet

    // Após editar, atualizar a lista
    // fetchUserPets(); // Descomente quando implementar a lógica de edição
  };

  // Função para deletar um pet
  const handleDeletePet = (petId: number) => {
    Alert.alert('Excluir Pet', 'Tem certeza que deseja excluir este pet?', [
      {
        text: 'Cancelar',
        style: 'cancel',
      },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          // Implementar lógica para excluir o pet
          console.log(`Excluir pet com ID: ${petId}`);
          // Após excluir, atualizar a lista
          fetchUserPets();
        },
      },
    ]);
  };

  // Função para favoritar um pet
  const handleFavoritePet = (petId: number) => {
    // Implementar lógica para favoritar/desfavoritar
    console.log(`Favoritar/desfavoritar pet com ID: ${petId}`);
    // Após favoritar, atualizar a lista
    // fetchUserPets(); // Descomente quando implementar a lógica de favoritar
  };

  // Renderizar um item da lista de pets usando o componente PetCard
  const renderPetItem = ({ item }: { item: Pet }) => (
    <PetCard
      pet={item}
      onAdopt={() => handleAdoptPet(item.id)}
      onEdit={() => handleEditPet(item.id)}
      onDelete={() => handleDeletePet(item.id)}
      onFavorite={() => handleFavoritePet(item.id)}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground source={require('../../assets/images/backgrounds/Fundo_03.png')} style={styles.backgroundImage}>
        <View style={styles.innerContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ width: 60 }} />
            <Text style={styles.headerTitle}>Adoção</Text>
            <View style={styles.headerIcons}>
              <TouchableOpacity style={styles.iconButton}>
                <Image source={require('../../assets/images/Icone/notification-icon.png')} style={styles.headerIcon} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton}>
                <Image source={require('../../assets/images/Icone/settings-icon.png')} style={styles.headerIcon} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Lista de Pets */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4682B4" />
              <Text style={styles.loadingText}>Carregando seus pets...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchUserPets}>
                <Text style={styles.retryButtonText}>Tentar Novamente</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={pets}
              renderItem={renderPetItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.petList}
              showsVerticalScrollIndicator={false}
              onRefresh={fetchUserPets}
              refreshing={loading}
            />
          )}

          {/* Add button - Abre o modal quando pressionado */}
          <TouchableOpacity style={styles.addButton} onPress={handleOpenModal}>
            <Image source={require('../../assets/images/Icone/add-icon.png')} style={styles.addIcon} />
          </TouchableOpacity>
        </View>

        {/* Bottom navigation */}
        <View style={styles.bottomNavigation}>
          <TouchableOpacity style={[styles.navItem, styles.activeNavItem]}>
            <Image source={require('../../assets/images/Icone/adoption-icon.png')} style={styles.navIcon} />
            <Text style={[styles.navText, styles.activeNavText]}>Adoção</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => router.push('/pages/PetAdoptionScreen')}>
            <Image source={require('../../assets/images/Icone/donation-icon.png')} style={styles.navIcon} />
            <Text style={styles.navText}>Pets</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem}>
            <Image source={require('../../assets/images/Icone/profile-icon.png')} style={styles.navIcon} />
            <Text style={styles.navText}>Perfil</Text>
          </TouchableOpacity>
        </View>

        {/* Modal de Doação de Pet */}
        <PetDonationModal visible={modalVisible} onClose={handleCloseModal} onSubmit={handleSubmitForm} />
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4682B4',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    flex: 1,
  },
  headerIcons: {
    flexDirection: 'row',
  },
  iconButton: {
    marginLeft: 15,
  },
  headerIcon: {
    width: 24,
    height: 24,
  },
  refreshButton: {
    backgroundColor: '#4682B4',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 10,
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#4682B4',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  addIcon: {
    width: 24,
    height: 24,
    tintColor: '#FFFFFF',
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
    flex: 1,
  },
  navIcon: {
    width: 30,
    height: 30,
  },
  navText: {
    fontSize: 12,
    marginTop: 3,
    color: '#000',
  },
  activeNavItem: {},
  activeNavText: {
    color: '#4682B4',
    fontWeight: 'bold',
  },
  // Estilos para a lista de pets
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#FFFFFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4682B4',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
    justifyContent: 'center',
  },
  addPetButton: {
    backgroundColor: '#4682B4',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 10,
  },
  addPetButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  petList: {
    paddingTop: 10,
    paddingBottom: 80, // Espaço para o botão flutuante
  },
});
