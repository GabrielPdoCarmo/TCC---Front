// PetDetailsScreen.tsx (refatorado)
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
  ActivityIndicator,
  ImageBackground,
  Dimensions
} from 'react-native';
import { router } from 'expo-router';
import { getUsuarioById, getRacaById, getstatusById, getDoencasPorPetId, getDoencaPorId, getPetById, getSexoPetById } from '@/services/api';

// Definindo a interface para o tipo Pet
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
  motivo_doacao?: string;
  sexo_nome?: string;
  doencas?: { id: number; nome: string }[];
}

interface PetDetailsScreenProps {
  route: {
    params: {
      petId: number;
    };
  };
}

// Obter dimensões da tela
const { width } = Dimensions.get('window');

export default function PetDetailsScreen({ route }: PetDetailsScreenProps) {
  const { petId } = route.params;
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPetDetails = async () => {
      try {
        setLoading(true);
        // Buscar dados do pet usando a API
        const petData = await getPetById(petId);
        
        if (!petData) {
          setError('Pet não encontrado');
          setLoading(false);
          return;
        }
        
        // Buscar informações adicionais em paralelo para melhor desempenho
        const [racaInfo, usuarioInfo, statusInfo, sexoInfo, doencasIds] = await Promise.all([
          !petData.raca_nome ? getRacaById(petData.raca_id) : Promise.resolve(null),
          !petData.usuario_nome ? getUsuarioById(petData.usuario_id) : Promise.resolve(null),
          !petData.status_nome ? getstatusById(petData.status_id) : Promise.resolve(null),
          petData.sexo_id ? getSexoPetById(petData.sexo_id) : Promise.resolve(null),
          getDoencasPorPetId(petId)
        ]);
        
        // Buscar detalhes das doenças se houver alguma
        let doencas = [];
        if (doencasIds && doencasIds.length > 0) {
          doencas = await Promise.all(
            doencasIds.map(async (doencaId: number) => {
              try {
                const doenca = await getDoencaPorId(doencaId);
                return { id: doencaId, nome: doenca?.nome || 'Desconhecida' };
              } catch (error) {
                console.error(`Erro ao buscar doença ID ${doencaId}:`, error);
                return { id: doencaId, nome: 'Desconhecida' };
              }
            })
          );
        }

        // Combinar todos os dados
        setPet({
          ...petData,
          raca_nome: petData.raca_nome || (racaInfo?.nome || 'Desconhecido'),
          usuario_nome: petData.usuario_nome || (usuarioInfo?.nome || 'Desconhecido'),
          status_nome: petData.status_nome || (statusInfo?.nome || 'Disponível para adoção'),
          sexo_nome: petData.sexo_nome || (sexoInfo?.descricao || 'Não informado'),
          doencas: doencas,
          favorito: false // Inicializa favorito como false, você pode carregar do estado real se tiver esta informação
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Erro ao buscar detalhes do pet:', err);
        setError('Não foi possível carregar os detalhes do pet. Tente novamente mais tarde.');
        setLoading(false);
      }
    };

    fetchPetDetails();
  }, [petId]);

  const toggleFavorite = () => {
    if (pet) {
      setPet({ ...pet, favorito: !pet.favorito });
      // Aqui você pode implementar a lógica para salvar o estado de favorito no backend
      console.log(`Pet ID ${pet.id} marcado como ${!pet.favorito ? 'favorito' : 'não favorito'}`);
    }
  };

  const handleAdopt = () => {
    if (pet) {
      console.log(`Iniciar processo de adoção para o pet ID: ${pet.id}`);
      // Navegação para tela de formulário de adoçã
    }
  };

  const handleBack = () => {
    router.back();
  };

  // Função para verificar se o pet tem doenças ou deficiências
  const hasDisease = () => {
    return pet?.doencas && pet.doencas.length > 0 ? 'Sim' : 'Não';
  };

  // Função para obter os nomes das doenças, se existirem
  const getDiseaseNames = () => {
    if (pet?.doencas && pet.doencas.length > 0) {
      return pet.doencas.map(d => d.nome).join(', ');
    }
    return 'Nenhuma';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground source={require('../../assets/images/backgrounds/Fundo_02.png')} style={styles.backgroundImage}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Image source={require('../../assets/images/Icone/arrow-left.png')} style={styles.backIcon} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalhes do Pet</Text>
          <TouchableOpacity style={styles.settingsButton}>
            <Image source={require('../../assets/images/settings.png')} style={styles.settingsIcon} />
          </TouchableOpacity>
        </View>

                  {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4682B4" />
            <Text style={styles.loadingText}>Carregando detalhes do pet...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setLoading(true);
                setError(null);
                // Recarregar os dados do pet
                const fetchPetDetails = async () => {
                  try {
                    const petData = await getPetById(petId);
                    
                    if (!petData) {
                      setError('Pet não encontrado');
                      setLoading(false);
                      return;
                    }
                    
                    // Buscar informações adicionais em paralelo
                    const [racaInfo, usuarioInfo, statusInfo, sexoInfo, doencasIds] = await Promise.all([
                      !petData.raca_nome ? getRacaById(petData.raca_id) : Promise.resolve(null),
                      !petData.usuario_nome ? getUsuarioById(petData.usuario_id) : Promise.resolve(null),
                      !petData.status_nome ? getstatusById(petData.status_id) : Promise.resolve(null),
                      petData.sexo_id ? getSexoPetById(petData.sexo_id) : Promise.resolve(null),
                      getDoencasPorPetId(petId)
                    ]);
                    
                    // Buscar detalhes das doenças se houver alguma
                    let doencas = [];
                    if (doencasIds && doencasIds.length > 0) {
                      doencas = await Promise.all(
                        doencasIds.map(async (doencaId: number) => {
                          try {
                            const doenca = await getDoencaPorId(doencaId);
                            return { id: doencaId, nome: doenca?.nome || 'Desconhecida' };
                          } catch (error) {
                            return { id: doencaId, nome: 'Desconhecida' };
                          }
                        })
                      );
                    }

                    // Combinar todos os dados
                    setPet({
                      ...petData,
                      raca_nome: petData.raca_nome || (racaInfo?.nome || 'Desconhecido'),
                      usuario_nome: petData.usuario_nome || (usuarioInfo?.nome || 'Desconhecido'),
                      status_nome: petData.status_nome || (statusInfo?.nome || 'Disponível para adoção'),
                      sexo_nome: petData.sexo_nome || (sexoInfo?.descricao || 'Não informado'),
                      doencas: doencas,
                      favorito: false
                    });
                    
                    setLoading(false);
                  } catch (err) {
                    console.error('Erro ao buscar detalhes do pet:', err);
                    setError('Não foi possível carregar os detalhes do pet. Tente novamente mais tarde.');
                    setLoading(false);
                  }
                };
                fetchPetDetails();
              }}
            >
              <Text style={styles.retryButtonText}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        ) : pet ? (
          <View style={styles.petCardContainer}>
            <View style={styles.petCard}>
              <View style={styles.imageContainer}>
                {pet.foto ? (
                  <Image source={{ uri: pet.foto }} style={styles.petImage} resizeMode="cover" />
                ) : (
                  <View style={styles.placeholderImage} />
                )}
              </View>

              <View style={styles.petInfo}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Nome:</Text>
                  <Text style={styles.infoValue}>{pet.nome}</Text>
                  <TouchableOpacity style={styles.favoriteButton} onPress={toggleFavorite}>
                    <Image
                      source={
                        pet.favorito
                          ? require('../../assets/images/Icone/star-filled.png')
                          : require('../../assets/images/Icone/star-outline.png')
                      }
                      style={styles.favoriteIcon}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Raça:</Text>
                  <Text style={styles.infoValue}>{pet.raca_nome}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Idade:</Text>
                  <Text style={styles.infoValue}>{pet.idade} {pet.faixa_etaria_unidade}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Responsável:</Text>
                  <Text style={styles.infoValue}>{pet.usuario_nome}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Sexo:</Text>
                  <Text style={styles.infoValue}>{pet.sexo_nome || 'Não informado'}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Possui Doença/Deficiência:</Text>
                  <Text style={styles.infoValue}>{hasDisease()}</Text>
                </View>

                {hasDisease() === 'Sim' && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Doenças/Deficiências:</Text>
                    <Text style={styles.infoValue}>{getDiseaseNames()}</Text>
                  </View>
                )}

                <View style={styles.motiveSection}>
                  <Text style={styles.infoLabel}>Motivo de estar em Doação:</Text>
                  <Text style={styles.description}>{pet.motivo_doacao || 'Não informado'}</Text>
                </View>
              </View>

              <View style={styles.buttonsContainer}>
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                  <Text style={styles.buttonText}>Voltar</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.adoptButton} onPress={handleAdopt}>
                  <Text style={styles.buttonText}>Adotar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : null}

        {/* Barra de navegação inferior */}
        <View style={styles.bottomNavigation}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => router.push('/pages/PetAdoptionScreen')}
          >
            <Image source={require('../../assets/images/Icone/adoption-icon.png')} style={styles.navIcon} />
            <Text style={styles.navText}>Adoção</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => router.push('/pages/PetDonation')}
          >
            <View style={styles.activeCircle}>
              <Image source={require('../../assets/images/Icone/donation-icon.png')} style={styles.navIcon} />
            </View>
            <Text style={styles.activeNavText}>Pets</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            // onPress={() => router.push('/pages/Profile')}
          >
            <Image source={require('../../assets/images/Icone/profile-icon.png')} style={styles.navIcon} />
            <Text style={styles.navText}>Perfil</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

// Aqui deveria haver um import para a função getPetById da sua API
// Vamos assumir que ela está incluída em @/services/api
// import { getPetById } from '@/services/api';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4682B4',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  settingsIcon: {
    width: 24,
    height: 24,
  },
  backButton: {
    padding: 5,
  },
  settingsButton: {
    padding: 5,
  },
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
  petCardContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  petCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  imageContainer: {
    height: 300,
    backgroundColor: '#F0F0F0',
  },
  petImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E1E1E1',
  },
  petInfo: {
    padding: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginRight: 5,
  },
  infoValue: {
    fontSize: 16,
    color: '#000',
    flex: 1,
  },
  favoriteButton: {
    padding: 5,
  },
  favoriteIcon: {
    width: 24,
    height: 24,
    tintColor: '#FFD700',
  },
  motiveSection: {
    marginTop: 10,
  },
  description: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginTop: 5,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
  },
  adoptButton: {
    backgroundColor: '#4682B4',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginLeft: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
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
});