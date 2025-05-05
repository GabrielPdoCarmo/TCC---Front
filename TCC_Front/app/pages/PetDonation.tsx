import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ImageBackground, SafeAreaView, Alert, FlatList, ActivityIndicator } from 'react-native';
import PetDonationModal from '@/components/modal_Pet/PetDonationModal';
import { getPetsByUsuarioId, getUsuarioById } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the Pet type
interface Pet {
  id: number;
  nome: string;
  raca_id: number;
  idade: string;
  usuario_id: number;
  imagem?: string;
  // Add any other fields your pet object has
}

// Define the User type
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
  // Add any other fields your user object has
}

function PetDonationScreen() {
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

  // Carregar a lista de pets do usuário quando o componente montar
  useEffect(() => {
    fetchUserPets();
  }, []);

  // Função para buscar os pets do usuário logado
  const fetchUserPets = async () => {
    try {
      setLoading(true);
      
      // Obter o ID do usuário do AsyncStorage
      const userId = await AsyncStorage.getItem('usuario_id');
      
      if (!userId) {
        setError('Usuário não encontrado. Por favor, faça login novamente.');
        setLoading(false);
        return;
      }
      
      // Obter informações do usuário
      const userData = await getUsuarioById(Number(userId));
      setCurrentUser(userData);
      
      // Obter os pets do usuário
      const userPets = await getPetsByUsuarioId(Number(userId));
      setPets(userPets);
    } catch (error) {
      console.error('Erro ao buscar pets:', error);
      setError('Ocorreu um erro ao carregar seus pets. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Função para abrir o modal
  const handleOpenModal = () => {
    setModalVisible(true);
  };

  // Função para fechar o modal
  const handleCloseModal = () => {
    setModalVisible(false);
  };

  // Função para processar os dados do formulário
  const handleSubmitForm = async (formData: any) => {
    console.log('Dados do pet para doação:', formData);
    
    // Aqui você pode adicionar a lógica para salvar os dados,
    // como enviar para uma API, salvar no banco de dados local, etc.
    
    Alert.alert(
      "Sucesso!",
      "Os dados do pet foram salvos com sucesso.",
      [{ 
        text: "OK",
        onPress: () => {
          handleCloseModal();
          // Recarregar a lista de pets após adicionar um novo
          fetchUserPets();
        }
      }]
    );
  };

  // Renderizar um item da lista de pets
  const renderPetItem = ({ item }: { item: Pet }) => (
    <View style={styles.petCard}>
      <View style={styles.petImageContainer}>
        {item.imagem ? (
          <Image source={{ uri: item.imagem }} style={styles.petImage} />
        ) : (
          <View style={[styles.petImage, styles.defaultPetImage]}>
            <Text style={styles.defaultPetImageText}>{item.nome ? item.nome.charAt(0).toUpperCase() : 'P'}</Text>
          </View>
        )}
        <TouchableOpacity style={styles.favoriteButton}>
          <Image source={require('../../assets/images/Icone/star-icon.png')} style={styles.starIcon} />
        </TouchableOpacity>
      </View>
      <View style={styles.petInfo}>
        <Text style={styles.petName}>Nome: {item.nome}</Text>
        <Text style={styles.petRace}>Raça ID: {item.raca_id}</Text>
        <Text style={styles.petAge}>Idade: {item.idade}</Text>
        <Text style={styles.petOwner}>Responsável ID: {item.usuario_id}</Text>
      </View>
      <View style={styles.petActions}>
        <TouchableOpacity style={styles.adoptButton}>
          <Text style={styles.adoptButtonText}>Enviar a Adoção</Text>
        </TouchableOpacity>
        <View style={styles.editDeleteButtons}>
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.buttonText}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton}>
            <Text style={styles.buttonText}>Deletar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
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
          ) : pets.length === 0 ? (
            <View style={styles.emptyContainer}>
              
              <Text style={styles.emptyText}>Você ainda não cadastrou pets para doação</Text>
              <TouchableOpacity style={styles.addPetButton} onPress={handleOpenModal}>
                <Text style={styles.addPetButtonText}>Adicionar Pet</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={pets}
              renderItem={renderPetItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.petList}
              showsVerticalScrollIndicator={false}
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
        <PetDonationModal 
          visible={modalVisible} 
          onClose={handleCloseModal} 
          onSubmit={handleSubmitForm} 
        />
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
  addButton: {
    position: 'absolute',
    top: 80,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    width: 80,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  addIcon: {
    width: 20,
    height: 20,
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
    color: '#4682B4',
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
  emptyImage: {
    width: 150,
    height: 150,
    marginBottom: 20,
    opacity: 0.7,
  },
  emptyText: {
    fontSize: 18,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
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
  petCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    marginBottom: 15,
    padding: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  petImageContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  petImage: {
    width: '100%',
    height: 180,
    borderRadius: 10,
  },
  defaultPetImage: {
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultPetImageText: {
    fontSize: 60,
    fontWeight: 'bold',
    color: '#4682B4',
  },
  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 20,
    padding: 8,
  },
  starIcon: {
    width: 20,
    height: 20,
  },
  petInfo: {
    marginBottom: 10,
  },
  petName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  petRace: {
    fontSize: 14,
    marginBottom: 3,
  },
  petAge: {
    fontSize: 14,
    marginBottom: 3,
  },
  petOwner: {
    fontSize: 14,
  },
  petActions: {
    marginTop: 10,
  },
  adoptButton: {
    backgroundColor: '#4682B4',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  adoptButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  editDeleteButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  editButton: {
    backgroundColor: '#FFD700',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 15,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 15,
    flex: 1,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default PetDonationScreen;