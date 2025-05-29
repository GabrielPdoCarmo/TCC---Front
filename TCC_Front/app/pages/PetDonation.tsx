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
import TermoDoacaoModalAuto from '@/components/Termo/TermoDoacaoModal';

import AsyncStorage from '@react-native-async-storage/async-storage';
import PetCard from '@/components/modal_Pet/PetCard';
import deletePet from '@/services/api/Pets/deletePet';
import updatePet from '@/services/api/Pets/updatePet';
import getPetsByUsuarioId from '@/services/api/Pets/getPetsByUsuarioId';
import getUsuarioByIdComCidadeEstado from '@/services/api/Usuario/getUsuarioByIdComCidadeEstado';
import getRacaById from '@/services/api/Raca/getRacaById';
import getFaixaEtariaById from '@/services/api/Faixa-etaria/getFaixaEtariaById';
import getstatusById from '@/services/api/Status/getstatusById';
import updateStatus from '@/services/api/Status/updateStatus';
import { checkCanCreatePets } from '@/services/api/TermoDoacao/checkCanCreatePets';

// Define a interface Pet com informações aprimoradas
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
}

// Define a interface Usuario
interface Usuario {
  id: number;
  nome: string;
  email: string;
  telefone?: string;
  cidade: {
    id: number;
    nome: string;
  };
  estado: {
    id: number;
    nome: string;
  };
}

export default function PetDonationScreen() {
  // Estado para controlar a visibilidade do modal de pet
  const [petModalVisible, setPetModalVisible] = useState(false);
  // Estado para controlar a visibilidade do modal de termo
  const [termoModalVisible, setTermoModalVisible] = useState(false);
  // Estado para armazenar a lista de pets
  const [pets, setPets] = useState<Pet[]>([]);
  // Estado para indicar carregamento
  const [loading, setLoading] = useState(true);
  // Estado para carregamento do termo
  const [termoLoading, setTermoLoading] = useState(true);
  // Estado para armazenar o usuário atual
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  // Estado para controlar erros
  const [error, setError] = useState('');
  // Estado para armazenar o pet sendo editado
  const [currentPet, setCurrentPet] = useState<Pet | null>(null);
  // Estado para controlar se o modal está no modo de edição
  const [isEditMode, setIsEditMode] = useState(false);
  // Estado para controlar se usuário pode cadastrar pets
  const [canCreatePets, setCanCreatePets] = useState(false);

  // 🔍 Função para verificar se usuário pode cadastrar pets
  const checkUserPermissions = async () => {
    try {
      setTermoLoading(true);
      console.log('🔍 Verificando permissões do usuário...');

      const result = await checkCanCreatePets();
      const podecastrar = result.data.podecastrar;

      console.log('✅ Verificação de permissões:', {
        podecastrar,
        temTermo: result.data.temTermo,
      });

      setCanCreatePets(podecastrar);

      // Se não pode cadastrar, mostrar modal do termo
      if (!podecastrar) {
        console.log('⚠️ Usuário precisa assinar termo, mostrando modal...');
        setTermoModalVisible(true);
      }
    } catch (error: any) {
      console.error('❌ Erro ao verificar permissões:', error);

      // Em caso de erro, assumir que precisa do termo
      setCanCreatePets(false);
      setTermoModalVisible(true);

      if (error.message.includes('Sessão expirada')) {
        Alert.alert('Sessão Expirada', 'Sua sessão expirou. Por favor, faça login novamente.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } finally {
      setTermoLoading(false);
    }
  };

  // 🔄 Carregar dados do usuário
  const loadUserData = async () => {
    try {
      const userId = await AsyncStorage.getItem('@App:userId');

      if (!userId) {
        setError('Usuário não encontrado. Por favor, faça login novamente.');
        return;
      }

      const userData = await getUsuarioByIdComCidadeEstado(parseInt(userId, 10));
      setCurrentUser(userData);
      console.log('👤 Dados do usuário carregados:', userData);
    } catch (error) {
      console.error('❌ Erro ao carregar dados do usuário:', error);
      setCurrentUser({
        id: 0,
        nome: 'Usuário',
        email: 'email@exemplo.com',
        cidade: { id: 0, nome: 'Cidade' },
        estado: { id: 0, nome: 'Estado' },
      });
    }
  };

  // Função para buscar os pets do usuário logado com dados de faixa etária
  const fetchUserPets = async () => {
    // Só buscar pets se o usuário tem permissão
    if (!canCreatePets) {
      console.log('⚠️ Usuário não tem permissão para ver pets ainda');
      setLoading(false);
      return;
    }

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
      console.log('🔍 Buscando pets para o usuário ID:', userIdNumber);

      // Obter os pets do usuário
      const userPets = await getPetsByUsuarioId(userIdNumber);
      console.log('🐾 Pets do usuário carregados:', userPets);

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
            let usuarioNome = currentUser?.nome || 'Usuário não identificado';

            if (pet.usuario_id !== userIdNumber) {
              const petUsuario = await getUsuarioByIdComCidadeEstado(pet.usuario_id);

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
              // Garantir que sexo e foto estejam incluídos
              foto: pet.foto,
            };
          } catch (error) {
            console.error(`Erro ao enriquecer dados do pet ${pet.nome}:`, error);

            // Em caso de erro, retornar o pet com informações de fallback
            return {
              ...pet,
              raca_nome: `Raça não disponível (ID: ${pet.raca_id})`,
              usuario_nome: `Usuário não disponível (ID: ${pet.usuario_id})`,
              foto: pet.foto || '',
            };
          }
        })
      );

      console.log('✅ Pets enriquecidos:', enrichedPets);
      setPets(enrichedPets);
    } catch (error) {
      console.error('❌ Erro ao buscar pets:', error);
      setError('Ocorreu um erro ao carregar seus pets. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // 🚀 Inicialização da tela
  useEffect(() => {
    const initializeScreen = async () => {
      console.log('🚀 Inicializando tela de doação de pets...');

      // Carregar dados do usuário primeiro
      await loadUserData();

      // Verificar permissões
      await checkUserPermissions();
    };

    initializeScreen();
  }, []);

  // 🔄 Recarregar pets quando permissões mudarem
  useEffect(() => {
    if (canCreatePets) {
      console.log('✅ Usuário tem permissão, carregando pets...');
      fetchUserPets();
    }
  }, [canCreatePets, currentUser]);

  // Usar useFocusEffect para recarregar os dados quando a tela receber foco
  useFocusEffect(
    useCallback(() => {
      console.log('👀 Tela recebeu foco - verificando permissões');

      // Só recarregar se já passou pela verificação inicial
      if (!termoLoading) {
        checkUserPermissions();
      }

      return () => {
        console.log('👋 Tela perdeu foco');
      };
    }, [termoLoading])
  );

  // 🎉 Callback quando termo for concluído
  const handleTermoCompleted = () => {
    console.log('🎉 Termo concluído! Liberando acesso à tela...');
    setTermoModalVisible(false);
    setCanCreatePets(true);

    // Recarregar verificação para ter certeza
    setTimeout(() => {
      checkUserPermissions();
    }, 1000);
  };

  // Função para abrir o modal no modo de adição
  const handleOpenModal = () => {
    if (!canCreatePets) {
      Alert.alert('Termo Necessário', 'Você precisa assinar o termo de responsabilidade antes de cadastrar pets.', [
        { text: 'OK' },
      ]);
      return;
    }

    setCurrentPet(null);
    setIsEditMode(false);
    setPetModalVisible(true);
  };

  // Função para fechar o modal e atualizar a lista de pets
  const handleCloseModal = () => {
    setPetModalVisible(false);
    setCurrentPet(null);
    setIsEditMode(false);
    // Recarrega a lista de pets após fechar o modal
    fetchUserPets();
  };

  // Função para processar os dados do formulário
  const handleSubmitForm = async (formData: any) => {
    try {
      if (isEditMode && currentPet) {
        console.log('📝 Atualizando dados do pet:', formData);
        // Atualizar o pet existente usando updatePet
        await updatePet({ ...formData, id: currentPet.id });
        Alert.alert('Sucesso!', 'Os dados do pet foram atualizados com sucesso.', [
          {
            text: 'OK',
            onPress: handleCloseModal,
          },
        ]);
      } else {
        console.log('🆕 Cadastrando novo pet:', formData);
        // Lógica para salvar um novo pet
        // Por exemplo: await createPet(formData);
        Alert.alert('Sucesso!', 'Os dados do pet foram salvos com sucesso.', [
          {
            text: 'OK',
            onPress: handleCloseModal,
          },
        ]);
      }
    } catch (error) {
      console.error('❌ Erro ao salvar/atualizar pet:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao salvar os dados do pet. Por favor, tente novamente.');
    }
  };

  // Função para enviar pet para adoção
  const handleAdoptPet = (petId: number) => {
    if (!canCreatePets) {
      Alert.alert('Termo Necessário', 'Você precisa assinar o termo de responsabilidade.', [{ text: 'OK' }]);
      return;
    }

    Alert.alert('Enviar para Adoção', 'Deseja realmente disponibilizar este pet para ser adotado?', [
      {
        text: 'Cancelar',
        style: 'cancel',
      },
      {
        text: 'Confirmar',
        onPress: async () => {
          try {
            // Chamando a API updateStatus para mudar o status para "Disponível para adoção" (ID 2)
            await updateStatus(petId);

            // Atualizando o pet na lista local para refletir a mudança de status
            const updatedPets = pets.map((pet) => {
              if (pet.id === petId) {
                return {
                  ...pet,
                  status_id: 2,
                  status_nome: 'Disponível para adoção',
                };
              }
              return pet;
            });

            setPets(updatedPets);

            Alert.alert('Sucesso', 'Pet disponibilizado para adoção com sucesso!');

            // Recarregar a lista de pets para exibir as atualizações
            fetchUserPets();
          } catch (error) {
            console.error('❌ Erro ao disponibilizar pet para adoção:', error);
            Alert.alert('Erro', 'Não foi possível disponibilizar o pet para adoção. Por favor, tente novamente.');
          }
        },
      },
    ]);
  };

  // Função para editar um pet
  const handleEditPet = (petId: number) => {
    if (!canCreatePets) {
      Alert.alert('Termo Necessário', 'Você precisa assinar o termo de responsabilidade.', [{ text: 'OK' }]);
      return;
    }

    // Encontrar o pet pelo ID
    const petToEdit = pets.find((pet) => pet.id === petId);

    if (petToEdit) {
      console.log(`✏️ Editando pet com ID: ${petId}`, petToEdit);

      // Definir o pet atual para edição com todos os dados necessários
      setCurrentPet({
        ...petToEdit,
        foto: petToEdit.foto,
      });

      // Ativar o modo de edição
      setIsEditMode(true);
      // Abrir o modal
      setPetModalVisible(true);
    } else {
      Alert.alert('Erro', 'Pet não encontrado para edição.');
    }
  };

  // Função para deletar um pet
  const handleDeletePet = (petId: number) => {
    if (!canCreatePets) {
      Alert.alert('Termo Necessário', 'Você precisa assinar o termo de responsabilidade.', [{ text: 'OK' }]);
      return;
    }

    Alert.alert('Excluir Pet', 'Tem certeza que deseja excluir este pet?', [
      {
        text: 'Cancelar',
        style: 'cancel',
      },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            // Chamar a função deletePet com o ID do pet
            await deletePet(petId);

            // Mostrar alerta de sucesso
            Alert.alert('Sucesso', 'Pet excluído com sucesso!');

            // Atualizar a lista de pets após a exclusão
            fetchUserPets();
          } catch (error) {
            console.error('❌ Erro ao excluir pet:', error);
            Alert.alert('Erro', 'Não foi possível excluir o pet. Por favor, tente novamente.');
          }
        },
      },
    ]);
  };

  // Função para favoritar um pet
  const handleFavoritePet = (petId: number) => {
    // Implementar lógica para favoritar/desfavoritar
    console.log(`⭐ Favoritar/desfavoritar pet com ID: ${petId}`);
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

  // 🚫 Renderizar tela bloqueada enquanto termo não for assinado
  const renderBlockedScreen = () => (
    <View style={styles.blockedContainer}>
      <View style={styles.blockedContent}>
        <Text style={styles.blockedIcon}>📋</Text>
        <Text style={styles.blockedTitle}>Termo de Responsabilidade</Text>
        <Text style={styles.blockedMessage}>
          Para cadastrar e gerenciar pets para doação, você precisa assinar um termo de responsabilidade.
        </Text>

        {termoLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>Verificando termo...</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.blockedButton} onPress={() => setTermoModalVisible(true)}>
            <Text style={styles.blockedButtonText}>✍️ Assinar Termo</Text>
          </TouchableOpacity>
        )}
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
              <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/pages/ConfigScreen')}>
                <Image source={require('../../assets/images/Icone/settings-icon.png')} style={styles.headerIcon} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Content - Bloqueado ou Normal */}
          {!canCreatePets ? (
            renderBlockedScreen()
          ) : (
            <>
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
            </>
          )}
        </View>

        {/* Bottom navigation */}
        <View style={styles.bottomNavigation}>
          <TouchableOpacity style={styles.navItem}>
            <View style={styles.activeCircle}>
              <Image source={require('../../assets/images/Icone/adoption-icon.png')} style={styles.navIcon} />
            </View>
            <Text style={styles.activeNavText}>Adoção</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => router.push('/pages/PetAdoptionScreen')}>
            <Image source={require('../../assets/images/Icone/donation-icon.png')} style={styles.navIcon} />
            <Text style={styles.navText}>Pets</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => router.push('/pages/ProfileScreen')}>
            <Image source={require('../../assets/images/Icone/profile-icon.png')} style={styles.navIcon} />
            <Text style={styles.navText}>Perfil</Text>
          </TouchableOpacity>
        </View>

        {/* Modal de Doação de Pet */}
        {canCreatePets && (
          <PetDonationModal
            visible={petModalVisible}
            onClose={handleCloseModal}
            onSubmit={handleSubmitForm}
            pet={currentPet}
            isEditMode={isEditMode}
          />
        )}

        {/* Modal de Termo de Doação - Automático */}
        {currentUser && (
          <TermoDoacaoModalAuto
            visible={termoModalVisible}
            usuarioLogado={{
              id: currentUser.id,
              nome: currentUser.nome,
              email: currentUser.email,
              telefone: currentUser.telefone,
            }}
            onTermoCompleted={handleTermoCompleted}
          />
        )}
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4682B4',
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
    color: '#FFFFFF',
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
  // Estilos para tela bloqueada
  blockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  blockedContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    minWidth: '90%',
  },
  blockedIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  blockedTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2E8B57',
    textAlign: 'center',
    marginBottom: 15,
  },
  blockedMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 25,
  },
  blockedButton: {
    backgroundColor: '#2E8B57',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    minWidth: 200,
  },
  blockedButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
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
    borderWidth: 2,
    borderColor: '#000000',
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
  activeNavText: {
    fontSize: 12,
    marginTop: 3,
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
