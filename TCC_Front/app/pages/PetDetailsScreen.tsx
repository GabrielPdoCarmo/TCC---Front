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
  Dimensions,
  ScrollView,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import PetsDetalhesCard from '@/components/modal_Pet/PetsDetalhesCard';
import { getPetById } from '@/services/api/Pets/getPetById';
import { createMyPet } from '@/services/api/MyPets/createMypets'; // ✅ ADICIONADO
import getFaixaEtariaById from '@/services/api/Faixa-etaria/getFaixaEtariaById';
import getUsuarioByIdComCidadeEstado from '@/services/api/Usuario/getUsuarioByIdComCidadeEstado';
import getUsuarioById from '@/services/api/Usuario/getUsuarioById';
import getRacaById from '@/services/api/Raca/getRacaById';
import getstatusById from '@/services/api/Status/getstatusById';
import getSexoPetById from '@/services/api/Sexo/getSexoPetById';
import getDoencasPorPetId from '@/services/api/Doenca/getDoencasPorPetId';
import getDoencaPorId from '@/services/api/Doenca/getDoencaPorId';
import getFavorito from '@/services/api/Favoritos/getFavorito';
import deleteFavorito from '@/services/api/Favoritos/deleteFavorito';
import checkFavorito from '@/services/api/Favoritos/checkFavorito';

interface Usuario {
  id: any;
  nome: any;
  foto?: string;
  cidade?: { id: any; nome: string };
  estado?: { id: any; nome: any };
  cidade_nome?: string;
  estado_nome?: string;
}

interface Doenca {
  id: number;
  nome: string;
  doencaDeficiencia_id?: number;
  doenca_nome?: string;
  descricao?: string;
}

// Definindo a interface para o tipo Pet
interface Pet {
  id: number;
  nome: string;
  raca_id: number;
  raca_nome?: string;
  idade: string;
  usuario_id: number;
  usuario_nome?: string;
  usuario_foto?: string;
  foto?: string;
  faixa_etaria_id: number;
  faixa_etaria_unidade?: string;
  status_id: number;
  status_nome?: string;
  sexo_id?: number;
  favorito?: boolean;
  motivo_doacao?: string;
  motivoDoacao?: string;
  sexo_nome?: string;
  cidade_nome?: string;
  estado_nome?: string;
  rgPet?: string;
  doencas?: { id: number; nome: string }[];
}

// Obter dimensões da tela
const { width, height } = Dimensions.get('window');

export default function PetDetailsScreen() {
  const params = useLocalSearchParams();

  // Verificação mais robusta do parâmetro petId
  let petId = 0;

  if (params.petId !== undefined) {
    if (typeof params.petId === 'string') {
      const parsedId = parseInt(params.petId, 10);
      if (!isNaN(parsedId)) {
        petId = parsedId;
      }
    } else if (Array.isArray(params.petId) && params.petId.length > 0) {
      const parsedId = parseInt(params.petId[0], 10);
      if (!isNaN(parsedId)) {
        petId = parsedId;
      }
    } else if (typeof params.petId === 'number') {
      petId = params.petId;
    }
  }

  console.log('PetDetailsScreen - petId extraído:', petId);

  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [usuarioId, setUsuarioId] = useState<number | null>(null);

  // Carregar o ID do usuário logado do AsyncStorage na montagem do componente
  useEffect(() => {
    fetchUsuarioLogado();
  }, []);

  // Função para buscar o usuário logado
  const fetchUsuarioLogado = async () => {
    try {
      const userId = await AsyncStorage.getItem('@App:userId');

      if (!userId) {
        console.log('ID do usuário não encontrado no AsyncStorage');
        return;
      }

      const userIdNumber = parseInt(userId);
      setUsuarioId(userIdNumber);
      console.log('Usuário logado ID:', userIdNumber);
    } catch (err) {
      console.error('Erro ao buscar dados do usuário:', err);
    }
  };

  useEffect(() => {
    if (!petId) {
      setError('ID do pet não fornecido ou inválido');
      setLoading(false);
      return;
    }

    const fetchPetDetails = async () => {
      try {
        setLoading(true);
        console.log(`Buscando pet com ID: ${petId}`);

        let petData;
        try {
          petData = await getPetById(petId);
          if (!petData) {
            throw new Error('Pet não encontrado');
          }

          console.log('Motivo de doação:', petData.motivoDoacao);
          console.log('RG do Pet:', petData.rgPet);
        } catch (err) {
          console.error(`Erro ao buscar pet com ID ${petId}:`, err);
          setError('Pet não encontrado. Verifique se o ID está correto.');
          setLoading(false);
          return;
        }

        // Preparar as chamadas de API com tratamento de erros individual
        const getRaca = async () => {
          if (!petData.raca_nome && petData.raca_id) {
            try {
              return await getRacaById(petData.raca_id);
            } catch (err) {
              console.error(`Erro ao buscar raça com ID ${petData.raca_id}:`, err);
              return null;
            }
          }
          return null;
        };

        const getUsuario = async () => {
          if (petData.usuario_id) {
            try {
              const usuarioData = await getUsuarioByIdComCidadeEstado(petData.usuario_id);
              console.log('Dados do usuário com cidade/estado obtidos:', usuarioData);
              
              let usuarioFoto = null;
              try {
                const usuarioBasico = await getUsuarioById(petData.usuario_id);
                console.log('Dados básicos do usuário obtidos:', usuarioBasico);
                usuarioFoto = usuarioBasico?.foto || null;
                console.log('Foto do usuário extraída:', usuarioFoto);
              } catch (err) {
                console.error(`Erro ao buscar dados básicos do usuário com ID ${petData.usuario_id}:`, err);
              }
              
              return {
                ...usuarioData,
                foto: usuarioFoto
              } as Usuario;
            } catch (err) {
              console.error(`Erro ao buscar o usuário com ID ${petData.usuario_id}:`, err);
              return null;
            }
          }
          return null;
        };

        const getStatus = async () => {
          if (!petData.status_nome && petData.status_id) {
            try {
              return await getstatusById(petData.status_id);
            } catch (err) {
              console.error(`Erro ao buscar status com ID ${petData.status_id}:`, err);
              return null;
            }
          }
          return null;
        };

        const getSexo = async () => {
          if (petData.sexo_id) {
            try {
              return await getSexoPetById(petData.sexo_id);
            } catch (err) {
              console.error(`Erro ao buscar sexo com ID ${petData.sexo_id}:`, err);
              return null;
            }
          }
          return null;
        };

        const getFaixaEtaria = async () => {
          if (petData.faixa_etaria_id) {
            try {
              return await getFaixaEtariaById(petData.faixa_etaria_id);
            } catch (err) {
              console.error(`Erro ao buscar faixa etária com ID ${petData.faixa_etaria_id}:`, err);
              return null;
            }
          }
          return null;
        };

        const checkIfFavorite = async (): Promise<boolean> => {
          if (!usuarioId) {
            console.log('Usuário não logado - não verificando favoritos');
            return false;
          }
          
          try {
            console.log(`Verificando se pet ID ${petId} é favorito do usuário ID ${usuarioId}`);
            const isFavorite = await checkFavorito(usuarioId, petId);
            console.log(`Pet ${petId} é favorito:`, isFavorite);
            return isFavorite;
          } catch (err) {
            console.error('Erro ao verificar se pet é favorito:', err);
            return false;
          }
        };

        const getDoencas = async (): Promise<Array<{ id: number; nome: string }>> => {
          try {
            console.log(`Buscando doenças para o pet ID ${petId}...`);

            const doencasResponse = await getDoencasPorPetId(petId);

            if (!doencasResponse || !Array.isArray(doencasResponse) || doencasResponse.length === 0) {
              console.log(`Pet ID ${petId} não possui doenças registradas`);
              return [];
            }

            console.log(
              `Encontradas ${doencasResponse.length} doenças para o pet ID ${petId}: ${JSON.stringify(doencasResponse)}`
            );

            const doencasDetalhes = await Promise.all(
              doencasResponse.map(async (doencaItem: number | Doenca) => {
                try {
                  const doencaId =
                    typeof doencaItem === 'number'
                      ? doencaItem
                      : (doencaItem as Doenca).doencaDeficiencia_id || doencaItem;

                  console.log(`Buscando detalhes da doença ID ${doencaId}`);
                  const doencaDetalhes = await getDoencaPorId(
                    typeof doencaId === 'number' ? doencaId : Number(doencaId)
                  );

                  if (!doencaDetalhes) {
                    console.warn(`Doença ID ${doencaId} não encontrada no banco de dados`);
                    return {
                      id: typeof doencaId === 'number' ? doencaId : Number(doencaId),
                      nome:
                        typeof doencaItem === 'object' && doencaItem.doenca_nome
                          ? doencaItem.doenca_nome
                          : 'Doença não identificada',
                    };
                  }

                  console.log(`Doença ID ${doencaId} encontrada: ${doencaDetalhes.nome || doencaDetalhes.descricao}`);
                  return {
                    id: typeof doencaId === 'number' ? doencaId : Number(doencaId),
                    nome: doencaDetalhes.nome || doencaDetalhes.descricao || 'Doença não identificada',
                  };
                } catch (error) {
                  const doencaId =
                    typeof doencaItem === 'number'
                      ? doencaItem
                      : (doencaItem as Doenca).doencaDeficiencia_id || doencaItem;

                  console.error(`Erro ao buscar doença ID ${doencaId}:`, error);
                  return {
                    id: typeof doencaId === 'number' ? doencaId : Number(doencaId),
                    nome:
                      typeof doencaItem === 'object' && doencaItem.doenca_nome
                        ? doencaItem.doenca_nome
                        : 'Doença não identificada',
                  };
                }
              })
            );

            console.log(`Doenças com detalhes para o pet ID ${petId}:`, JSON.stringify(doencasDetalhes));
            return doencasDetalhes;
          } catch (err) {
            console.error(`Erro geral ao buscar doenças para o pet ID ${petId}:`, err);
            return [];
          }
        };

        const [racaInfo, usuarioInfo, statusInfo, sexoInfo, doencas, faixaEtariaInfo, isFavorite] = await Promise.all([
          getRaca(),
          getUsuario(),
          getStatus(),
          getSexo(),
          getDoencas(),
          getFaixaEtaria(),
          checkIfFavorite(),
        ]);

        const motivoDoacao = petData.motivoDoacao || petData.motivo_doacao || 'Não informado';
        console.log('Motivo de doação antes de definir pet:', motivoDoacao);

        let cidade_nome = 'Não informado';
        let estado_nome = 'Não informado';
        let usuario_foto = null;

        if (usuarioInfo) {
          console.log('Informações do usuário para localização:', usuarioInfo);

          usuario_foto = usuarioInfo.foto || null;
          console.log('Foto do usuário extraída para o pet:', usuario_foto);

          if (usuarioInfo.cidade_nome) {
            cidade_nome = usuarioInfo.cidade_nome;
          } else if (usuarioInfo.cidade && usuarioInfo.cidade.nome) {
            cidade_nome = usuarioInfo.cidade.nome;
          }

          if (usuarioInfo.estado_nome) {
            estado_nome = usuarioInfo.estado_nome;
          } else if (usuarioInfo.estado && usuarioInfo.estado.nome) {
            estado_nome = usuarioInfo.estado.nome;
          }
        }

        const faixaEtariaUnidade = faixaEtariaInfo?.unidade || '';
        console.log('Faixa etária unidade:', faixaEtariaUnidade);

        const rgPet = petData.rgPet || petData.rg_Pet || '';
        console.log('RG do Pet a ser definido:', rgPet);

        setPet({
          ...petData,
          raca_nome: petData.raca_nome || racaInfo?.nome || 'Desconhecido',
          usuario_nome: petData.usuario_nome || usuarioInfo?.nome || 'Desconhecido',
          usuario_foto: usuario_foto,
          status_nome: petData.status_nome || statusInfo?.nome || 'Disponível para adoção',
          sexo_nome: petData.sexo_nome || sexoInfo?.descricao || 'Não informado',
          doencas: doencas || [],
          motivo_doacao: motivoDoacao,
          motivoDoacao: motivoDoacao,
          favorito: isFavorite,
          faixa_etaria_unidade: faixaEtariaUnidade,
          cidade_nome: cidade_nome,
          estado_nome: estado_nome,
          rgPet: rgPet,
        });

        console.log('Pet carregado com status de favorito:', isFavorite);
        console.log('Pet carregado com foto do usuário:', usuario_foto);
        setLoading(false);
      } catch (err) {
        console.error('Erro ao buscar detalhes do pet:', err);
        setError('Não foi possível carregar os detalhes do pet. Tente novamente mais tarde.');
        setLoading(false);
      }
    };

    fetchPetDetails();
  }, [petId, usuarioId]);

  // Função atualizada para gerenciar favoritos
  const toggleFavorite = async () => {
    if (!pet) return;

    try {
      console.log(`Alternando favorito para pet ID ${pet.id}${usuarioId ? `, usuário ID ${usuarioId}` : ' (usuário não logado)'}`);
      
      if (usuarioId) {
        if (pet.favorito) {
          console.log('Removendo dos favoritos...');
          await deleteFavorito(usuarioId, pet.id);
          console.log('Pet removido dos favoritos com sucesso');
        } else {
          console.log('Adicionando aos favoritos...');
          await getFavorito(usuarioId, pet.id);
          console.log('Pet adicionado aos favoritos com sucesso');
        }
      }

      setPet(prevPet => ({
        ...prevPet!,
        favorito: !prevPet!.favorito
      }));

      console.log(`Pet ID ${pet.id} ${pet.favorito ? 'removido dos' : 'adicionado aos'} favoritos`);
    } catch (error) {
      console.error('Erro ao atualizar favorito:', error);
      Alert.alert(
        'Erro',
        'Não foi possível atualizar os favoritos. Tente novamente.',
        [{ text: 'OK' }]
      );
    }
  };

  // ✅ FUNÇÃO ATUALIZADA para lidar com a adoção
  const handleAdopt = async () => {
    if (!pet) return;

    if (!usuarioId) {
      Alert.alert('Erro', 'Você precisa estar logado para adicionar pets aos seus favoritos.');
      return;
    }

    // Verificar se o usuário logado é o mesmo dono do pet
    if (pet.usuario_id === usuarioId) {
      Alert.alert('Operação não permitida', 'Você não pode adicionar seu próprio pet aos seus pets.');
      return;
    }

    try {
      console.log(`Adicionando pet ID ${pet.id} aos pets do usuário ${usuarioId}`);
      
      // Chamar a API para criar a associação
      await createMyPet(pet.id, usuarioId);
      
      // Mostrar mensagem de sucesso e voltar para PetAdoptionScreen
      Alert.alert(
        'Sucesso!', 
        'Pet adicionado aos seus pets com sucesso!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Voltar para a tela PetAdoptionScreen
              router.push('/pages/PetAdoptionScreen');
            }
          }
        ]
      );
      
    } catch (error) {
      console.error('Erro ao adicionar pet:', error);
      Alert.alert('Erro', 'Não foi possível adicionar o pet. Tente novamente.');
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#4682B4" barStyle="light-content" />
      <ImageBackground
        source={require('../../assets/images/backgrounds/Fundo_02.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Detalhes do Pet</Text>
          <TouchableOpacity style={styles.settingsButton} onPress={() => router.push('/pages/ConfigScreen')}>
            <Image source={require('../../assets/images/Icone/settings-icon.png')} style={styles.settingsIcon} />
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
                    console.log(`Tentando buscar pet novamente com ID: ${petId}`);

                    let petData;
                    try {
                      petData = await getPetById(petId);
                      if (!petData) {
                        throw new Error('Pet não encontrado');
                      }
                    } catch (err) {
                      console.error(`Erro ao buscar pet com ID ${petId}:`, err);
                      setError('Pet não encontrado. Verifique se o ID está correto.');
                      setLoading(false);
                      return;
                    }

                    try {
                        const [racaInfo, usuarioInfoCompleto, statusInfo, sexoInfo, doencasIds, faixaEtariaInfo, isFavorite] =
                        await Promise.all([
                          getRacaById(petData.raca_id),
                          getUsuarioByIdComCidadeEstado(petData.usuario_id),
                          getstatusById(petData.status_id),
                          getSexoPetById(petData.sexo_id || 0),
                          getDoencasPorPetId(petId),
                          getFaixaEtariaById(petData.faixa_etaria_id || 0),
                          usuarioId ? checkFavorito(usuarioId, petId) : Promise.resolve(false),
                        ]);

                      let usuarioFoto = null;
                      try {
                        const usuarioBasico = await getUsuarioById(petData.usuario_id);
                        usuarioFoto = usuarioBasico?.foto || null;
                      } catch (err) {
                        console.error(`Erro ao buscar foto do usuário:`, err);
                      }

                      let cidade_nome = 'Não informado';
                      let estado_nome = 'Não informado';

                      if (usuarioInfoCompleto) {
                        if ((usuarioInfoCompleto as Usuario).cidade_nome) {
                          cidade_nome = (usuarioInfoCompleto as Usuario).cidade_nome as string;
                        } else if ((usuarioInfoCompleto as Usuario).cidade && (usuarioInfoCompleto as Usuario).cidade!.nome) {
                          cidade_nome = (usuarioInfoCompleto as Usuario).cidade!.nome;
                        }

                        if ((usuarioInfoCompleto as Usuario).estado_nome) {
                          estado_nome = (usuarioInfoCompleto as Usuario).estado_nome as string;
                        } else if ((usuarioInfoCompleto as Usuario).estado && (usuarioInfoCompleto as Usuario).estado!.nome) {
                          estado_nome = (usuarioInfoCompleto as Usuario).estado!.nome;
                        }
                      }

                      const faixaEtariaUnidade = faixaEtariaInfo?.unidade || '';

                      let doencas: Array<{ id: number; nome: string }> = [];
                      if (doencasIds && Array.isArray(doencasIds) && doencasIds.length > 0) {
                        doencas = await Promise.all(
                          doencasIds.map(async (doencaId: number) => {
                            try {
                              const doenca = await getDoencaPorId(doencaId);
                              return {
                                id: doencaId,
                                nome: doenca?.nome || 'Doença não identificada',
                              };
                            } catch (error) {
                              return {
                                id: doencaId,
                                nome: 'Doença não identificada',
                              };
                            }
                          })
                        );
                      }

                      const motivoDoacao = petData.motivoDoacao || petData.motivo_doacao || 'Não informado';
                      const rgPet = petData.rgPet || '';

                      setPet({
                        ...petData,
                        raca_nome: racaInfo?.nome || 'Desconhecido',
                        usuario_nome: usuarioInfoCompleto?.nome || 'Desconhecido',
                        usuario_foto: usuarioFoto,
                        status_nome: statusInfo?.nome || 'Disponível para adoção',
                        sexo_nome: sexoInfo?.descricao || 'Não informado',
                        doencas: doencas,
                        motivo_doacao: motivoDoacao,
                        motivoDoacao: motivoDoacao,
                        favorito: isFavorite,
                        faixa_etaria_unidade: faixaEtariaUnidade,
                        cidade_nome: cidade_nome,
                        estado_nome: estado_nome,
                        rgPet: rgPet,
                      });
                    } catch (err) {
                      console.error('Erro ao buscar detalhes adicionais:', err);
                      setPet({
                        ...petData,
                        raca_nome: 'Desconhecido',
                        usuario_nome: 'Desconhecido',
                        usuario_foto: null,
                        status_nome: 'Disponível para adoção',
                        sexo_nome: 'Não informado',
                        doencas: [],
                        motivo_doacao: petData.motivoDoacao || petData.motivo_doacao || 'Não informado',
                        motivoDoacao: petData.motivoDoacao || petData.motivo_doacao || 'Não informado',
                        favorito: false,
                        faixa_etaria_unidade: '',
                        cidade_nome: 'Não informado',
                        estado_nome: 'Não informado',
                        rgPet: petData.rgPet || '',
                      });
                    }

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
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.scrollViewContent}
          >
            <View style={styles.petCardContainer}>
              <PetsDetalhesCard
                pet={pet}
                onFavoriteToggle={toggleFavorite}
                onAdoptPress={handleAdopt}
                onBackPress={handleBack}
                usuarioLogadoId={usuarioId} // ✅ ADICIONADO: Passar ID do usuário logado
              />
            </View>
          </ScrollView>
        ) : null}
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
    marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    flex: 1,
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
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  petCardContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
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
  motivoContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    marginTop: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  motivoLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4682B4',
    marginBottom: 5,
  },
  motivoText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
});