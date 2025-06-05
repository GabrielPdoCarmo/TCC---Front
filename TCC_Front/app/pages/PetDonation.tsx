// PetDonationScreen.tsx - Atualizado com verificação de dados completos

import { router, useFocusEffect } from 'expo-router';
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import PetDonationModal from '@/components/Pets/PetDonationModal';
import TermoDoacaoModal from '@/components/Termo/TermoDoacaoModal';

import AsyncStorage from '@react-native-async-storage/async-storage';
import PetCard from '@/components/Pets/PetCard';
import deletePet from '@/services/api/Pets/deletePet';
import updatePet from '@/services/api/Pets/updatePet';
import getPetsByUsuarioId from '@/services/api/Pets/getPetsByUsuarioId';
import getUsuarioByIdComCidadeEstado from '@/services/api/Usuario/getUsuarioByIdComCidadeEstado';
import getRacaById from '@/services/api/Raca/getRacaById';
import getFaixaEtariaById from '@/services/api/Faixa-etaria/getFaixaEtariaById';
import getstatusById from '@/services/api/Status/getstatusById';
import updateStatus from '@/services/api/Status/updateStatus';
import { checkCanCreatePets, checkNeedsDataUpdate } from '@/services/api/TermoDoacao/checkCanCreatePets'; // 🆕 Funções atualizadas
import { useAuth } from '@/contexts/AuthContext';
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
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const [isCheckingPermissions, setIsCheckingPermissions] = useState(false);

  // 🆕 Estados para verificação de dados (nome, email, telefone)
  const [dataOutdated, setDataOutdated] = useState(false);
  const [isDataUpdateMode, setIsDataUpdateMode] = useState(false);

  const checkCountRef = useRef(0);
  const lastCheckTimeRef = useRef(0);
  const { setLastRoute, isAuthenticated, loading: authLoading } = useAuth();

  // ✅ NOVO: Salvar esta tela como última rota visitada
  // ✅ CORREÇÃO: No console.log (apenas linha 82)
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      // ✅ ANTES (incorreto):
      // console.log('💾 Salvando PetAdoptionScreen como última rota');

      // ✅ DEPOIS (correto):
      console.log('💾 Salvando PetDonation como última rota');
      setLastRoute('/pages/PetDonation');
    }
  }, [authLoading, isAuthenticated, setLastRoute]);

  // Verificar se está autenticado
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      console.log('🚫 Usuário não autenticado, redirecionando para login...');
      router.replace('/pages/LoginScreen');
      return;
    }
  }, [isAuthenticated, authLoading]);
  // 🔍 Função ATUALIZADA para verificar se usuário pode cadastrar pets (COM VERIFICAÇÃO DE DADOS COMPLETOS)
  const checkUserPermissions = useCallback(
    async (force = false) => {
      // Evitar verificações muito frequentes (debounce de 2 segundos)
      const now = Date.now();
      if (!force && now - lastCheckTimeRef.current < 2000) {
        return;
      }

      // Evitar múltiplas verificações simultâneas
      if (isCheckingPermissions && !force) {
        return;
      }

      // Limite de verificações para evitar loops
      checkCountRef.current += 1;
      if (checkCountRef.current > 10 && !force) {
        return;
      }

      try {
        setIsCheckingPermissions(true);
        setTermoLoading(true);
        lastCheckTimeRef.current = now;

        const result = await checkCanCreatePets();

        if (result && result.data) {
          const podecastrar = result.data.podecastrar || false;
          const temTermo = result.data.temTermo || false;
          const dadosDesatualizados = result.data.dadosDesatualizados || false; // 🆕

          setCanCreatePets(podecastrar);
          setDataOutdated(dadosDesatualizados); // 🆕
          setInitialCheckDone(true);

          // 🆕 Lógica atualizada para lidar com dados desatualizados
          if (dadosDesatualizados) {
            setIsDataUpdateMode(true);
            setTermoModalVisible(true);
          } else if (!podecastrar && !temTermo) {
            setIsDataUpdateMode(false);
            setTermoModalVisible(true);
          } else if (podecastrar) {
            setTermoModalVisible(false);
          }
        }
      } catch (error: any) {
        if (error.message && error.message.includes('Sessão expirada')) {
          Alert.alert('Sessão Expirada', 'Sua sessão expirou. Por favor, faça login novamente.', [
            { text: 'OK', onPress: () => router.back() },
          ]);
          return;
        }

        setCanCreatePets(false);
        setDataOutdated(false);
        setIsDataUpdateMode(false);
        setTermoModalVisible(true);
        setInitialCheckDone(true);
      } finally {
        setTermoLoading(false);
        setIsCheckingPermissions(false);
      }
    },
    [isCheckingPermissions]
  );

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
    } catch (error) {
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

      // Obter os pets do usuário
      const userPets = await getPetsByUsuarioId(userIdNumber);

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

      setPets(enrichedPets);
    } catch (error) {
      setError('Ocorreu um erro ao carregar seus pets. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // 🚀 Inicialização da tela (APENAS UMA VEZ)
  useEffect(() => {
    const initializeScreen = async () => {
      if (initialCheckDone) {
        return;
      }

      checkCountRef.current = 0; // Reset contador

      try {
        await loadUserData();
        await checkUserPermissions(true); // Force primeira verificação
      } catch (error) {
        setCanCreatePets(false);
        setDataOutdated(false);
        setIsDataUpdateMode(false);
        setTermoModalVisible(true);
        setTermoLoading(false);
        setInitialCheckDone(true);
      }
    };

    initializeScreen();
  }, []); // SEM DEPENDÊNCIAS para evitar re-execução

  // 🔄 Recarregar pets quando permissões mudarem (CONTROLADO)
  useEffect(() => {
    if (canCreatePets && initialCheckDone && !dataOutdated) {
      fetchUserPets();
    } else if (initialCheckDone && (!canCreatePets || dataOutdated)) {
      setLoading(false);
    }
  }, [canCreatePets, initialCheckDone, dataOutdated]); // 🆕 Adicionado dataOutdated

  // 👀 Focus effect CONTROLADO (SEM LOOPS)
  useFocusEffect(
    useCallback(() => {
      // Só verificar se:
      // 1. Verificação inicial já foi feita
      // 2. Não está carregando termo
      // 3. Não está verificando permissões
      if (initialCheckDone && !termoLoading && !isCheckingPermissions) {
        // Usar timeout para evitar verificações muito frequentes
        const timeoutId = setTimeout(() => {
          checkUserPermissions(false);
        }, 1000);

        return () => {
          clearTimeout(timeoutId);
        };
      }
    }, [initialCheckDone, termoLoading, isCheckingPermissions, checkUserPermissions])
  );

  // 🎉 Callback ATUALIZADO quando termo for concluído (SEM LOOPS)
  const handleTermoCompleted = useCallback(() => {
    const modoTexto = isDataUpdateMode ? 'atualizado' : 'criado';

    setTermoModalVisible(false);
    setCanCreatePets(true);
    setDataOutdated(false); // 🆕 Reset flag
    setIsDataUpdateMode(false); // 🆕 Reset modo

    // Reset contador para permitir nova verificação
    checkCountRef.current = 0;

    // Verificação final após término do termo (APENAS UMA VEZ)
    setTimeout(() => {
      checkUserPermissions(true);
    }, 2000);
  }, [checkUserPermissions, isDataUpdateMode]);

  // Função para abrir o modal no modo de adição
  const handleOpenModal = () => {
    if (!canCreatePets || dataOutdated) {
      const message = dataOutdated
        ? 'Você precisa reAssinar o termo de responsabilidade com seus dados atualizados (nome, email, telefone ou localização) antes de cadastrar pets.'
        : 'Você precisa assinar o termo de responsabilidade antes de cadastrar pets.';

      Alert.alert('Termo Necessário', message, [{ text: 'OK' }]);
      return;
    }

    setCurrentPet(null);
    setIsEditMode(false);
    setPetModalVisible(true);
  };

  // ========================================
  // MODIFICADO: Função para fechar o modal com limpeza melhorada
  // ========================================
  const handleCloseModal = () => {
    setPetModalVisible(false);
    setCurrentPet(null);
    setIsEditMode(false);

    // IMPORTANTE: Pequeno delay para garantir que o modal seja fechado
    // antes de recarregar os pets, evitando problemas de renderização
    // e permitindo que a limpeza de erros do modal seja concluída
    setTimeout(() => {
      if (canCreatePets && !dataOutdated) {
        fetchUserPets();
      }
    }, 200); // Aumentado de 100ms para 200ms para melhor sincronia
  };

  // Função para processar os dados do formulário
  const handleSubmitForm = async (formData: any) => {
    try {
      if (isEditMode && currentPet) {
        // Atualizar o pet existente usando updatePet
        await updatePet({ ...formData, id: currentPet.id });
        Alert.alert('Sucesso!', 'Os dados do pet foram atualizados com sucesso.', [
          {
            text: 'OK',
            onPress: handleCloseModal,
          },
        ]);
      } else {
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
      Alert.alert('Erro', 'Ocorreu um erro ao salvar os dados do pet. Por favor, tente novamente.');
    }
  };

  // Função para enviar pet para adoção
  const handleAdoptPet = (petId: number) => {
    if (!canCreatePets || dataOutdated) {
      const message = dataOutdated
        ? 'Você precisa reAssinar o termo de responsabilidade com seus dados atualizados.'
        : 'Você precisa assinar o termo de responsabilidade.';

      Alert.alert('Termo Necessário', message, [{ text: 'OK' }]);
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
            Alert.alert('Erro', 'Não foi possível disponibilizar o pet para adoção. Por favor, tente novamente.');
          }
        },
      },
    ]);
  };

  // Função para editar um pet
  const handleEditPet = (petId: number) => {
    if (!canCreatePets || dataOutdated) {
      const message = dataOutdated
        ? 'Você precisa reAssinar o termo de responsabilidade com seus dados atualizados.'
        : 'Você precisa assinar o termo de responsabilidade.';

      Alert.alert('Termo Necessário', message, [{ text: 'OK' }]);
      return;
    }

    // Encontrar o pet pelo ID
    const petToEdit = pets.find((pet) => pet.id === petId);

    if (petToEdit) {
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
    if (!canCreatePets || dataOutdated) {
      const message = dataOutdated
        ? 'Você precisa reAssinar o termo de responsabilidade com seus dados atualizados.'
        : 'Você precisa assinar o termo de responsabilidade.';

      Alert.alert('Termo Necessário', message, [{ text: 'OK' }]);
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
            Alert.alert('Erro', 'Não foi possível excluir o pet. Por favor, tente novamente.');
          }
        },
      },
    ]);
  };

  // Função para favoritar um pet
  const handleFavoritePet = (petId: number) => {};

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
  if (authLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={{ color: '#FFFFFF', marginTop: 20 }}>Verificando autenticação...</Text>
      </View>
    );
  }

  // ✅ Se não estiver autenticado, não renderizar nada (será redirecionado)
  if (!isAuthenticated) {
    return null;
  }
  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground source={require('../../assets/images/backgrounds/Fundo_03.png')} style={styles.backgroundImage}>
        <View style={styles.innerContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ width: 60 }} />
            <Text style={styles.headerTitle}>Doação</Text>
            <View style={styles.headerIcons}>
              <TouchableOpacity style={styles.settingsButton} onPress={() => router.push('/pages/ConfigScreen')}>
                <Image source={require('../../assets/images/Icone/settings-icon.png')} style={styles.settingsIcon} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Content - Sempre mostrar lista de pets */}
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

          {/* Add button - Sempre visível */}
          <TouchableOpacity style={styles.addButton} onPress={handleOpenModal}>
            <Image source={require('../../assets/images/Icone/add-icon.png')} style={styles.addIcon} />
          </TouchableOpacity>
        </View>

        {/* Bottom navigation */}
        <View style={styles.bottomNavigation}>
          <TouchableOpacity style={styles.navItem}>
            <View style={styles.activeCircle}>
              <Image source={require('../../assets/images/Icone/adoption-icon.png')} style={styles.navIcon} />
            </View>
            <Text style={styles.activeNavText}>Doação</Text>
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

        {/* Modal de Doação de Pet - Sempre disponível */}
        <PetDonationModal
          visible={petModalVisible}
          onClose={handleCloseModal}
          onSubmit={handleSubmitForm}
          pet={currentPet}
          isEditMode={isEditMode}
        />

        {/* 🆕 Modal de Termo de Doação - Automático COM MODO DE ATUALIZAÇÃO DE DADOS */}
        {currentUser && (
          <TermoDoacaoModal
            visible={termoModalVisible}
            usuarioLogado={{
              id: currentUser.id,
              nome: currentUser.nome,
              email: currentUser.email,
              telefone: currentUser.telefone,
            }}
            onTermoCompleted={handleTermoCompleted}
            isDataUpdateMode={isDataUpdateMode} // 🆕 Indicar se é atualização de dados
          />
        )}
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    paddingTop: 45,
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
  // ✅ ESTILO CORRIGIDO - igual ao PetAdoptionScreen
  settingsButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 25,
    padding: 8,
  },
  settingsIcon: {
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
