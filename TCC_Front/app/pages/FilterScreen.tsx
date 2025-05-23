// FilterScreen.tsx - CORRIGIDO
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  TextInput,
  ImageBackground,
  Alert
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Importar os serviços necessários para carregar as opções de filtro
import getEspecies from '@/services/api/Especies/getEspecies';
import getFaixaEtaria from '@/services/api/Faixa-etaria/getFaixaEtaria';
import getRacasPorEspecie from '@/services/api/Raca/getRacasPorEspecie';
import getEstados from '@/services/api/Estados/getEstados';
import getEstadoID from '@/services/api/Estados/getEstadoID';
import getCidadesPorEstadoID from '@/services/api/Cidades/getCidadesPorEstadoID';
import getFaixaEtariaByEspecieId from '@/services/api/Faixa-etaria/getByEspecieId';
import getFavoritosPorUsuario from '@/services/api/Favoritos/getFavoritosPorUsuario';
import getCidadesPorEstado from '@/services/api/Cidades/getCidadesPorEstado';
// Interfaces para os tipos
interface Especie {
  id: number;
  nome: string;
  selected?: boolean;
}

interface FaixaEtaria {
  id: number;
  nome: string;
  idade_min: number;
  idade_max: number;
  unidade: string;
  especie_id: number;
  selected?: boolean;
  idadeEspecifica?: string; // Adicionado campo para armazenar a idade específica
}

interface Raca {
  id: number;
  nome: string;
  especie_id: number;
  selected?: boolean;
}

interface Estado {
  id: number;
  nome: string;
  selected?: boolean;
}

interface Cidade {
  id: number;
  nome: string;
  estado_id?: number;
  selected?: boolean;
}

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

export default function FilterScreen() {
  // Estados para armazenar dados dos filtros
  const [especies, setEspecies] = useState<Especie[]>([]);
  const [faixasEtarias, setFaixasEtarias] = useState<FaixaEtaria[]>([]);
  const [todasFaixasEtarias, setTodasFaixasEtarias] = useState<FaixaEtaria[]>([]); // Para armazenar todas as faixas etárias
  const [racas, setRacas] = useState<Raca[]>([]);
  const [estados, setEstados] = useState<Estado[]>([]);
  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [onlyFavorites, setOnlyFavorites] = useState<boolean>(false);
  const [favoritePetIds, setFavoritePetIds] = useState<number[]>([]); // IDs dos pets favoritos
  const [loadingFavorites, setLoadingFavorites] = useState<boolean>(false);

  // Estados para controlar expansão de seções
  const [especiesExpanded, setEspeciesExpanded] = useState<boolean>(false);
  const [idadeExpanded, setIdadeExpanded] = useState<boolean>(false);
  const [racasExpanded, setRacasExpanded] = useState<boolean>(false);
  const [regiaoExpanded, setRegiaoExpanded] = useState<boolean>(false);
  const [estadosExpanded, setEstadosExpanded] = useState<boolean>(false);
  const [cidadesExpanded, setCidadesExpanded] = useState<boolean>(false);

  // Estados para barras de pesquisa
  const [searchEstado, setSearchEstado] = useState<string>('');
  const [searchCidade, setSearchCidade] = useState<string>('');
  const [searchRaca, setSearchRaca] = useState<string>('');

  // Estados para indicar carregamento
  const [loadingRacas, setLoadingRacas] = useState<boolean>(false);
  const [loadingCidades, setLoadingCidades] = useState<boolean>(false);
  const [loadingFaixasEtarias, setLoadingFaixasEtarias] = useState<boolean>(false);

  // Carregar filtros existentes, se houver
  const params = useLocalSearchParams();
  const currentFilters = params.filters ? JSON.parse(decodeURIComponent(params.filters as string)) : {};

  // Função para buscar favoritos do usuário - CORRIGIDA
  const loadUserFavorites = async () => {
    try {
      setLoadingFavorites(true);
      
      // Tentar buscar o ID do usuário da mesma forma que o PetAdoptionScreen
      let userId = null;
      
      // Primeiro, tentar buscar pelo '@App:userId' (usado no PetAdoptionScreen)
      const userIdFromStorage = await AsyncStorage.getItem('@App:userId');
      if (userIdFromStorage) {
        userId = parseInt(userIdFromStorage);
        console.log('ID do usuário encontrado em @App:userId:', userId);
      } else {
        // Se não encontrar, tentar buscar pelos dados completos do usuário
        const userData = await AsyncStorage.getItem('@App:userData');
        if (userData) {
          const user = JSON.parse(userData);
          userId = user.id;
          console.log('ID do usuário encontrado em @App:userData:', userId);
        }
      }

      if (!userId) {
        console.log('ID do usuário não encontrado em nenhum local');
        setLoadingFavorites(false);
        return;
      }

      console.log('Buscando favoritos para o usuário:', userId);

      // Buscar favoritos do usuário
      const favoritos = await getFavoritosPorUsuario(userId);
      console.log('Favoritos retornados da API:', favoritos);
      
      // Extrair apenas os IDs dos pets favoritos
      const petIds = favoritos.map((favorito: any) => {
        // Tentar diferentes formas de acessar o pet_id
        return favorito.pet_id || favorito.petId || favorito.pet?.id;
      }).filter(Boolean); // Remove valores undefined/null
      
      console.log('IDs dos pets favoritos extraídos:', petIds);
      
      setFavoritePetIds(petIds);
      setLoadingFavorites(false);
      
      console.log(`Carregados ${petIds.length} pets favoritos para o usuário ${userId}`);
      
    } catch (error) {
      console.error('Erro ao carregar favoritos do usuário:', error);
      setLoadingFavorites(false);
      
      // Mostrar alerta para o usuário em caso de erro
      Alert.alert(
        'Erro',
        'Não foi possível carregar seus favoritos. Tente novamente.',
        [{ text: 'OK' }]
      );
    }
  };

  // Função para verificar se há espécies selecionadas
  const hasSelectedEspecies = () => {
    return especies.some((especie: Especie) => especie.selected);
  };

  // Função para verificar se há estados selecionados
  const hasSelectedEstados = () => {
    return estados.some((estado: Estado) => estado.selected);
  };

  // Função para normalizar texto (remover acentos e converter para minúsculo)
  const normalizeText = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // Remove acentos
  };

  // Função para filtrar estados pela pesquisa
  const getFilteredEstados = () => {
    if (!searchEstado.trim()) return estados;
    const searchNormalized = normalizeText(searchEstado);
    return estados.filter((estado: Estado) => 
      normalizeText(estado.nome).includes(searchNormalized)
    );
  };

  // Função para filtrar cidades pela pesquisa
  const getFilteredCidades = () => {
    if (!searchCidade.trim()) return cidades;
    const searchNormalized = normalizeText(searchCidade);
    return cidades.filter((cidade: Cidade) => 
      normalizeText(cidade.nome).includes(searchNormalized)
    );
  };

  // Função para filtrar raças pela pesquisa
  const getFilteredRacas = () => {
    if (!searchRaca.trim()) return racas;
    const searchNormalized = normalizeText(searchRaca);
    return racas.filter((raca: Raca) => 
      normalizeText(raca.nome).includes(searchNormalized)
    );
  };

  // Carregar dados iniciais
  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        // Carregar dados para os filtros
        const especiesData = await getEspecies();
        const faixasEtariasData = await getFaixaEtaria();
        const estadosData = await getEstados();

        // Salvar todas as faixas etárias para uso posterior
        setTodasFaixasEtarias(faixasEtariasData);

        // Marcar itens previamente selecionados
        if (currentFilters.especieIds) {
          especiesData.forEach((especie: Especie) => {
            especie.selected = currentFilters.especieIds.includes(especie.id);
          });
        }

        if (currentFilters.faixaEtariaIds) {
          faixasEtariasData.forEach((faixa: FaixaEtaria) => {
            faixa.selected = currentFilters.faixaEtariaIds.includes(faixa.id);
            // Carregar a idade específica se existir
            if (currentFilters.faixasEtariaIdades && currentFilters.faixasEtariaIdades[faixa.id]) {
              faixa.idadeEspecifica = currentFilters.faixasEtariaIdades[faixa.id].toString();
            }
          });
        }

        if (currentFilters.estadoIds) {
          estadosData.forEach((estado: Estado) => {
            estado.selected = currentFilters.estadoIds.includes(estado.id);
          });
        }

        // Atualizar os estados
        setEspecies(especiesData);
        setFaixasEtarias(faixasEtariasData);
        setEstados(estadosData);
        setOnlyFavorites(currentFilters.onlyFavorites || false);

        // Carregar favoritos do usuário
        await loadUserFavorites();

        // Carregar raças se houver espécies selecionadas
        if (currentFilters.especieIds && currentFilters.especieIds.length > 0) {
          await loadRacasForEspecies(currentFilters.especieIds, currentFilters.racaIds);
          // Também carregamos as faixas etárias para as espécies selecionadas
          await loadFaixasEtariasForEspecies(currentFilters.especieIds, currentFilters.faixaEtariaIds);
        }

        // Carregar cidades se houver estados selecionados
        if (currentFilters.estadoIds && currentFilters.estadoIds.length > 0) {
          await loadCidadesForEstados(estadosData, currentFilters.estadoIds, currentFilters.cidadeIds);
        }
      } catch (error) {
        console.error('Erro ao carregar dados para filtros:', error);
      }
    };

    fetchFilterData();
  }, []);

  // Função para carregar faixas etárias com base nas espécies selecionadas
  const loadFaixasEtariasForEspecies = async (especieIds: number[], selectedFaixaEtariaIds?: number[]) => {
    try {
      setLoadingFaixasEtarias(true);
      let allFaixasEtarias: FaixaEtaria[] = [];

      // Para cada espécie selecionada, buscar suas faixas etárias
      for (const especieId of especieIds) {
        const faixasEtariasData = await getFaixaEtariaByEspecieId(especieId);
        // Garantir que o especie_id está definido
        const faixasComEspecieId = faixasEtariasData.map((faixa: FaixaEtaria) => ({
          ...faixa,
          especie_id: faixa.especie_id || especieId
        }));
        allFaixasEtarias = [...allFaixasEtarias, ...faixasComEspecieId];
      }

      // Se não houver espécies selecionadas, mostrar todas as faixas etárias
      if (especieIds.length === 0) {
        allFaixasEtarias = [...todasFaixasEtarias];
      }

      // Remover duplicatas
      const uniqueFaixasEtarias = Array.from(
        new Map(allFaixasEtarias.map((faixa: FaixaEtaria) => [faixa.id, faixa])).values()
      );

      // Preservar seleções e idades específicas das faixas etárias atuais
      const currentFaixasEtarias = faixasEtarias || [];
      uniqueFaixasEtarias.forEach((faixa: FaixaEtaria) => {
        const currentFaixa = currentFaixasEtarias.find((f: FaixaEtaria) => f.id === faixa.id);
        if (currentFaixa) {
          faixa.selected = currentFaixa.selected;
          faixa.idadeEspecifica = currentFaixa.idadeEspecifica;
        } else if (selectedFaixaEtariaIds) {
          faixa.selected = selectedFaixaEtariaIds.includes(faixa.id);
        }
      });

      setFaixasEtarias(uniqueFaixasEtarias);
      setLoadingFaixasEtarias(false);
    } catch (error) {
      console.error('Erro ao carregar faixas etárias por espécies:', error);
      setLoadingFaixasEtarias(false);
    }
  };

  // Função para carregar raças com base nas espécies selecionadas
  const loadRacasForEspecies = async (especieIds: number[], selectedRacaIds?: number[]) => {
    try {
      setLoadingRacas(true);
      let allRacas: Raca[] = [];

      // Para cada espécie selecionada, buscar suas raças
      for (const especieId of especieIds) {
        const racasData = await getRacasPorEspecie(especieId);
        allRacas = [...allRacas, ...racasData];
      }

      // Remover duplicatas (caso alguma raça pertença a mais de uma espécie)
      const uniqueRacas = Array.from(new Map(allRacas.map((raca: Raca) => [raca.id, raca])).values());

      // Marcar raças previamente selecionadas
      if (selectedRacaIds) {
        uniqueRacas.forEach((raca: Raca) => {
          raca.selected = selectedRacaIds.includes(raca.id);
        });
      }

      setRacas(uniqueRacas);
      setLoadingRacas(false);
    } catch (error) {
      console.error('Erro ao carregar raças por espécies:', error);
      setLoadingRacas(false);
    }
  };

  // Função para carregar cidades com base nos estados selecionados
  const loadCidadesForEstados = async (estadosArray: Estado[], estadoIds: number[], selectedCidadeIds?: number[]) => {
    try {
      setLoadingCidades(true);
      let allCidades: Cidade[] = [];

      // Para cada estado selecionado, buscar suas cidades
      for (const estadoId of estadoIds) {
        const estado = estadosArray.find((e: Estado) => e.id === estadoId);
        if (estado) {
          const cidadesData = await getCidadesPorEstadoID(estado.id);
          // Adicionar o estado_id às cidades para facilitar o agrupamento
          const cidadesComEstadoId = cidadesData.map((cidade: Cidade) => ({
            ...cidade,
            estado_id: estadoId
          }));
          allCidades = [...allCidades, ...cidadesComEstadoId];
        }
      }

      // Remover duplicatas
      const uniqueCidades = Array.from(new Map(allCidades.map((cidade: Cidade) => [cidade.id, cidade])).values());

      // Marcar cidades previamente selecionadas
      if (selectedCidadeIds) {
        uniqueCidades.forEach((cidade: Cidade) => {
          cidade.selected = selectedCidadeIds.includes(cidade.id);
        });
      }

      setCidades(uniqueCidades);
      setLoadingCidades(false);
    } catch (error) {
      console.error('Erro ao carregar cidades por estados:', error);
      setLoadingCidades(false);
    }
  };

  // Função para alternar seleção de um item
  const toggleSelection = (id: number, stateArray: any[], setStateFunction: Function, type?: string) => {
    const updatedArray = stateArray.map((item: any) => {
      if (item.id === id) {
        return { ...item, selected: !item.selected };
      }
      return item;
    });

    setStateFunction(updatedArray);

    // Se for uma espécie, carregar raças e faixas etárias relacionadas quando selecionada
    if (type === 'especie') {
      const selectedEspecieIds = updatedArray.filter((item: any) => item.selected).map((item: any) => item.id);
      
      // Carregar raças para as espécies selecionadas
      if (selectedEspecieIds.length > 0) {
        loadRacasForEspecies(selectedEspecieIds);
      } else {
        // Se não houver espécies selecionadas, limpar raças e fechar seções
        setRacas([]);
        setRacasExpanded(false);
        setIdadeExpanded(false);
        setSearchRaca('');
      }
      
      // Carregar faixas etárias para as espécies selecionadas
      loadFaixasEtariasForEspecies(selectedEspecieIds);
    }

    // Se for um estado, carregar cidades relacionadas quando selecionado
    if (type === 'estado') {
      const selectedEstadoIds = updatedArray.filter((item: any) => item.selected).map((item: any) => item.id);
      if (selectedEstadoIds.length > 0) {
        loadCidadesForEstados(updatedArray, selectedEstadoIds);
      } else {
        // Se não houver estados selecionados, limpar cidades, fechar seção e limpar pesquisa
        setCidades([]);
        setCidadesExpanded(false);
        setSearchCidade('');
      }
    }
  };

  // Função para alternar favoritos - CORRIGIDA
  const toggleFavorites = async () => {
    const newFavoritesState = !onlyFavorites;
    setOnlyFavorites(newFavoritesState);
    
    // Se está ativando favoritos e ainda não carregou os favoritos, carregar agora
    if (newFavoritesState && favoritePetIds.length === 0 && !loadingFavorites) {
      await loadUserFavorites();
    }
  };

  // Função para atualizar a idade específica de uma faixa etária
  const updateIdadeEspecifica = (id: number, idade: string) => {
    const updatedFaixas = faixasEtarias.map((faixa: FaixaEtaria) => {
      if (faixa.id === id) {
        return { ...faixa, idadeEspecifica: idade };
      }
      return faixa;
    });

    setFaixasEtarias(updatedFaixas);
  };

  // Função para lidar com clique nas seções (apenas quando habilitadas)
  const handleSectionPress = (expandedState: boolean, setExpandedState: Function) => {
    setExpandedState(!expandedState);
  };

  // Função para aplicar os filtros e voltar para a tela anterior
  const applyFilters = async () => {
    // Construir objeto de filtros
    const filters: FilterParams = {};

    // Coletar IDs selecionados de cada categoria
    const selectedEspecieIds = especies.filter((item: Especie) => item.selected).map((item: Especie) => item.id);
    if (selectedEspecieIds.length > 0) {
      filters.especieIds = selectedEspecieIds;
    }

    const selectedFaixasEtarias = faixasEtarias.filter((item: FaixaEtaria) => item.selected);
    if (selectedFaixasEtarias.length > 0) {
      filters.faixaEtariaIds = selectedFaixasEtarias.map((item: FaixaEtaria) => item.id);

      // Coletar idades específicas para faixas etárias selecionadas
      const idadesEspecificas: { [key: number]: number } = {};
      selectedFaixasEtarias.forEach((faixa: FaixaEtaria) => {
        if (faixa.idadeEspecifica && !isNaN(Number(faixa.idadeEspecifica))) {
          idadesEspecificas[faixa.id] = Number(faixa.idadeEspecifica);
        }
      });

      if (Object.keys(idadesEspecificas).length > 0) {
        filters.faixasEtariaIdades = idadesEspecificas;
      }
    }

    const selectedRacaIds = racas.filter((item: Raca) => item.selected).map((item: Raca) => item.id);
    if (selectedRacaIds.length > 0) {
      filters.racaIds = selectedRacaIds;
    }

    const selectedEstadoIds = estados.filter((item: Estado) => item.selected).map((item: Estado) => item.id);
    if (selectedEstadoIds.length > 0) {
      filters.estadoIds = selectedEstadoIds;
    }

    const selectedCidadeIds = cidades.filter((item: Cidade) => item.selected).map((item: Cidade) => item.id);
    if (selectedCidadeIds.length > 0) {
      filters.cidadeIds = selectedCidadeIds;
    }

    // Incluir configuração de favoritos
    if (onlyFavorites) {
      filters.onlyFavorites = true;
      filters.favoritePetIds = favoritePetIds; // Incluir IDs dos pets favoritos
    }

    // Armazenar os filtros para serem usados na tela PetAdoptionScreen
    await AsyncStorage.setItem('@App:petFilters', JSON.stringify(filters));

    console.log('Filtros aplicados:', filters);

    // Voltar para a tela anterior com os filtros
    router.push({
      pathname: '/pages/PetAdoptionScreen',
      params: { applyFilters: 'true' },
    });
  };

  // Função para renderizar divisor de categoria
  const renderCategoryDivider = (title: string, icon?: string) => {
    return (
      <View style={styles.categoryDivider}>
        <View style={styles.categoryDividerLine} />
        <View style={styles.categoryDividerContent}>
          {icon && <Text style={styles.categoryDividerIcon}>{icon}</Text>}
          <Text style={styles.categoryDividerText}>{title}</Text>
        </View>
        <View style={styles.categoryDividerLine} />
      </View>
    );
  };

  // Função para renderizar itens de faixas etárias com input para idade específica
  const renderFaixasEtariasItems = () => {
    if (loadingFaixasEtarias) {
      return renderLoading();
    }
    
    if (faixasEtarias.length === 0) {
      return (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>
            Nenhuma faixa etária disponível para as espécies selecionadas
          </Text>
        </View>
      );
    }

    const especiesSelecionadas = especies.filter(e => e.selected);
    const showSpeciesDividers = especiesSelecionadas.length > 1;

    if (showSpeciesDividers) {
      // Renderizar com divisores por espécie e scroll
      return (
        <ScrollView 
          style={styles.scrollableList} 
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
        >
          {especiesSelecionadas.map((especie: Especie, especieIndex: number) => {
            const faixasDaEspecie = faixasEtarias.filter((faixa: FaixaEtaria) => faixa.especie_id === especie.id);
            
            if (faixasDaEspecie.length === 0) return null;

            return (
              <View key={especie.id}>
                {/* Divisor da espécie */}
                {renderCategoryDivider(especie.nome, '🐾')}
                
                {/* Faixas etárias da espécie */}
                {faixasDaEspecie.map((faixa: FaixaEtaria, faixaIndex: number) => (
                  <View key={faixa.id} style={styles.faixaEtariaContainer}>
                    <TouchableOpacity
                      style={[
                        styles.filterItem, 
                        faixa.selected && styles.selectedItem,
                        faixaIndex === 0 && styles.firstFilterItemWithDivider,
                        faixaIndex === faixasDaEspecie.length - 1 && 
                        especieIndex === especiesSelecionadas.length - 1 && 
                        !faixa.selected && styles.lastFilterItem
                      ]}
                      onPress={() => toggleSelection(faixa.id, faixasEtarias, setFaixasEtarias)}
                    >
                      <Text style={[styles.filterItemText, faixa.selected && styles.selectedItemText]}>
                        {faixa.nome} ({faixa.idade_min}{faixa.idade_max ? `-${faixa.idade_max}` : ' ou mais'} {faixa.unidade})
                      </Text>
                      {faixa.selected && (
                        <View style={styles.checkmark}>
                          <Text style={styles.checkmarkText}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>

                    {faixa.selected && (
                      <View style={[
                        styles.idadeInputContainer,
                        faixaIndex === faixasDaEspecie.length - 1 && 
                        especieIndex === especiesSelecionadas.length - 1 && 
                        styles.lastIdadeInputContainer
                      ]}>
                        <Text style={styles.idadeLabel}>Idade específica ({faixa.unidade}):</Text>
                        <TextInput
                          style={styles.idadeInput}
                          placeholder={`Digite a idade (${faixa.idade_min}${faixa.idade_max ? `-${faixa.idade_max}` : ' ou mais'})`}
                          value={faixa.idadeEspecifica || ''}
                          onChangeText={(text) => updateIdadeEspecifica(faixa.id, text)}
                          keyboardType="numeric"
                        />
                      </View>
                    )}
                  </View>
                ))}
              </View>
            );
          })}
        </ScrollView>
      );
    }

    // Renderizar sem divisores (uma espécie) - sem scroll se for pequeno
    return faixasEtarias.map((faixa: FaixaEtaria, index: number) => {
      let nomeEspecie = 'Espécie';
      
      if (faixa.especie_id) {
        const especie = especies.find((e: Especie) => e.id === faixa.especie_id);
        nomeEspecie = especie ? especie.nome : `Espécie (ID: ${faixa.especie_id})`;
      } else {
        const especiesSelecionadas = especies.filter((e: Especie) => e.selected);
        if (especiesSelecionadas.length === 1) {
          nomeEspecie = especiesSelecionadas[0].nome;
        } else if (especiesSelecionadas.length > 1) {
          nomeEspecie = especiesSelecionadas.map((e: Especie) => e.nome).join('/');
        }
      }
      
      return (
        <View key={faixa.id} style={styles.faixaEtariaContainer}>
          <TouchableOpacity
            style={[
              styles.filterItem, 
              faixa.selected && styles.selectedItem,
              index === 0 && styles.firstFilterItemNoSearch,
              index === faixasEtarias.length - 1 && !faixa.selected && styles.lastFilterItem
            ]}
            onPress={() => toggleSelection(faixa.id, faixasEtarias, setFaixasEtarias)}
          >
            <Text style={[styles.filterItemText, faixa.selected && styles.selectedItemText]}>
              {nomeEspecie} - {faixa.nome} ({faixa.idade_min}{faixa.idade_max ? `-${faixa.idade_max}` : ' ou mais'} {faixa.unidade})
            </Text>
            {faixa.selected && (
              <View style={styles.checkmark}>
                <Text style={styles.checkmarkText}>✓</Text>
              </View>
            )}
          </TouchableOpacity>

          {faixa.selected && (
            <View style={[
              styles.idadeInputContainer,
              index === faixasEtarias.length - 1 && styles.lastIdadeInputContainer
            ]}>
              <Text style={styles.idadeLabel}>Idade específica ({faixa.unidade}):</Text>
              <TextInput
                style={styles.idadeInput}
                placeholder={`Digite a idade (${faixa.idade_min}${faixa.idade_max ? `-${faixa.idade_max}` : ' ou mais'})`}
                value={faixa.idadeEspecifica || ''}
                onChangeText={(text) => updateIdadeEspecifica(faixa.id, text)}
                keyboardType="numeric"
              />
            </View>
          )}
        </View>
      );
    });
  };

  // Função para renderizar itens com barra de pesquisa
  const renderItemsWithSearch = (items: any[], stateSetter: Function, type: string, searchValue: string, setSearchValue: (text: string) => void) => {
    // Usar as funções de filtro específicas que normalizam texto
    let filteredItems;
    if (type === 'estado') {
      filteredItems = getFilteredEstados();
    } else if (type === 'cidade') {
      filteredItems = getFilteredCidades();
    } else if (type === 'raca') {
      filteredItems = getFilteredRacas();
    } else {
      filteredItems = items;
    }

    // Se for raça e há múltiplas espécies selecionadas, agrupar por espécie
    if (type === 'raca') {
      const especiesSelecionadas = especies.filter((e: Especie) => e.selected);
      const showSpeciesDividers = especiesSelecionadas.length > 1;

      return (
        <>
          {/* Barra de pesquisa */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="🔍 Pesquisar raça..."
              value={searchValue}
              onChangeText={setSearchValue}
            />
          </View>

          {/* Lista de itens filtrados com divisores de espécie */}
          {filteredItems.length === 0 ? (
            <View style={[styles.emptyStateContainer, styles.emptyStateAttached]}>
              <Text style={styles.emptyStateText}>
                {searchValue.trim() 
                  ? `Nenhuma raça encontrada para "${searchValue}"`
                  : `Nenhuma raça disponível`
                }
              </Text>
            </View>
          ) : (
            <ScrollView 
              style={styles.scrollableList} 
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
              {showSpeciesDividers ? (
                // Renderizar com divisores por espécie
                especiesSelecionadas.map((especie: Especie, especieIndex: number) => {
                  const racasDaEspecie = filteredItems.filter((raca: Raca) => raca.especie_id === especie.id);
                  
                  if (racasDaEspecie.length === 0) return null;

                  return (
                    <View key={especie.id}>
                      {/* Divisor da espécie */}
                      {renderCategoryDivider(especie.nome, '🐾')}
                      
                      {/* Raças da espécie */}
                      {racasDaEspecie.map((item: Raca, racaIndex: number) => (
                        <TouchableOpacity
                          key={item.id}
                          style={[
                            styles.filterItem, 
                            item.selected && styles.selectedItem,
                            racaIndex === 0 && styles.firstFilterItemWithDivider,
                            racaIndex === racasDaEspecie.length - 1 && 
                            especieIndex === especiesSelecionadas.length - 1 && 
                            styles.lastFilterItem
                          ]}
                          onPress={() => toggleSelection(item.id, items, stateSetter, type)}
                        >
                          <Text style={[styles.filterItemText, item.selected && styles.selectedItemText]}>
                            {item.nome}
                          </Text>
                          {item.selected && (
                            <View style={styles.checkmark}>
                              <Text style={styles.checkmarkText}>✓</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  );
                })
              ) : (
                // Renderizar sem divisores (uma espécie ou busca que pode misturar espécies)
                filteredItems.map((item: any, index: number) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.filterItem, 
                      item.selected && styles.selectedItem,
                      index === 0 && styles.firstFilterItem,
                      index === filteredItems.length - 1 && styles.lastFilterItem
                    ]}
                    onPress={() => toggleSelection(item.id, items, stateSetter, type)}
                  >
                    <Text style={[styles.filterItemText, item.selected && styles.selectedItemText]}>
                      {item.nome}
                    </Text>
                    {item.selected && (
                      <View style={styles.checkmark}>
                        <Text style={styles.checkmarkText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          )}
        </>
      );
    }

    // Para cidades - verificar se há múltiplos estados selecionados
    if (type === 'cidade') {
      const estadosSelecionados = estados.filter((e: Estado) => e.selected);
      const showEstadosDividers = estadosSelecionados.length > 1;

      return (
        <>
          {/* Barra de pesquisa */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="🔍 Pesquisar cidade..."
              value={searchValue}
              onChangeText={setSearchValue}
            />
          </View>

          {/* Lista de itens filtrados com divisores de estado */}
          {filteredItems.length === 0 ? (
            <View style={[styles.emptyStateContainer, styles.emptyStateAttached]}>
              <Text style={styles.emptyStateText}>
                {searchValue.trim() 
                  ? `Nenhuma cidade encontrada para "${searchValue}"`
                  : `Nenhuma cidade disponível`
                }
              </Text>
            </View>
          ) : (
            <ScrollView 
              style={styles.scrollableList} 
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
              {showEstadosDividers ? (
                // Renderizar com divisores por estado
                estadosSelecionados.map((estado: Estado, estadoIndex: number) => {
                  const cidadesDoEstado = filteredItems.filter((cidade: Cidade) => cidade.estado_id === estado.id);
                  
                  if (cidadesDoEstado.length === 0) return null;

                  return (
                    <View key={estado.id}>
                      {/* Divisor do estado */}
                      {renderCategoryDivider(estado.nome, '📍')}
                      
                      {/* Cidades do estado */}
                      {cidadesDoEstado.map((item: Cidade, cidadeIndex: number) => (
                        <TouchableOpacity
                          key={item.id}
                          style={[
                            styles.filterItem, 
                            item.selected && styles.selectedItem,
                            cidadeIndex === 0 && styles.firstFilterItemWithDivider,
                            cidadeIndex === cidadesDoEstado.length - 1 && 
                            estadoIndex === estadosSelecionados.length - 1 && 
                            styles.lastFilterItem
                          ]}
                          onPress={() => toggleSelection(item.id, items, stateSetter, type)}
                        >
                          <Text style={[styles.filterItemText, item.selected && styles.selectedItemText]}>
                            {item.nome}
                          </Text>
                          {item.selected && (
                            <View style={styles.checkmark}>
                              <Text style={styles.checkmarkText}>✓</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  );
                })
              ) : (
                // Renderizar sem divisores (um estado ou busca que pode misturar estados)
                filteredItems.map((item: any, index: number) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.filterItem, 
                      item.selected && styles.selectedItem,
                      index === 0 && styles.firstFilterItem,
                      index === filteredItems.length - 1 && styles.lastFilterItem
                    ]}
                    onPress={() => toggleSelection(item.id, items, stateSetter, type)}
                  >
                    <Text style={[styles.filterItemText, item.selected && styles.selectedItemText]}>
                      {item.nome}
                    </Text>
                    {item.selected && (
                      <View style={styles.checkmark}>
                        <Text style={styles.checkmarkText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          )}
        </>
      );
    }

    // Para outros tipos (estado) - comportamento original com scroll
    return (
      <>
        {/* Barra de pesquisa */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder={`🔍 Pesquisar ${type === 'estado' ? 'estado' : 'item'}...`}
            value={searchValue}
            onChangeText={setSearchValue}
          />
        </View>

        {/* Lista de itens filtrados */}
        {filteredItems.length === 0 ? (
          <View style={[styles.emptyStateContainer, styles.emptyStateAttached]}>
            <Text style={styles.emptyStateText}>
              {searchValue.trim() 
                ? `Nenhum ${type === 'estado' ? 'estado' : 'item'} encontrado para "${searchValue}"`
                : `Nenhum ${type === 'estado' ? 'estado' : 'item'} disponível`
              }
            </Text>
          </View>
        ) : (
          <ScrollView 
            style={styles.scrollableList} 
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
          >
            {filteredItems.map((item: any, index: number) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.filterItem, 
                  item.selected && styles.selectedItem,
                  index === 0 && styles.firstFilterItem,
                  index === filteredItems.length - 1 && styles.lastFilterItem
                ]}
                onPress={() => toggleSelection(item.id, items, stateSetter, type)}
              >
                <Text style={[styles.filterItemText, item.selected && styles.selectedItemText]}>
                  {item.nome}
                </Text>
                {item.selected && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </>
    );
  };

  // Função para renderizar itens de cada categoria (sem pesquisa)
  const renderItems = (items: any[], stateSetter: Function, type?: string) => {
    if (items.length === 0) {
      return (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>
            {type === 'raca'
              ? 'Nenhuma raça disponível para as espécies selecionadas'
              : 'Nenhum item disponível'}
          </Text>
        </View>
      );
    }

    return items.map((item: any, index: number) => (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.filterItem, 
          item.selected && styles.selectedItem,
          index === 0 && styles.firstFilterItemNoSearch,
          index === items.length - 1 && styles.lastFilterItem
        ]}
        onPress={() => toggleSelection(item.id, items, stateSetter, type)}
      >
        <Text style={[styles.filterItemText, item.selected && styles.selectedItemText]}>{item.nome}</Text>
        {item.selected && (
          <View style={styles.checkmark}>
            <Text style={styles.checkmarkText}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    ));
  };

  // Função para renderizar indicador de carregamento
  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="small" color="#4682B4" />
      <Text style={styles.loadingText}>Carregando...</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground source={require('../../assets/images/backgrounds/Fundo_02.png')} style={styles.backgroundImage}>
        <ScrollView style={styles.scrollView}>
          {/* Botão Voltar */}
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Image source={require('../../assets/images/Icone/close-icon.png')} style={styles.backIcon} />
            <Text style={styles.backButtonText}>Voltar a Página</Text>
          </TouchableOpacity>

          {/* Seção Espécies */}
          <TouchableOpacity style={styles.filterSection} onPress={() => setEspeciesExpanded(!especiesExpanded)}>
            <Text style={styles.filterSectionText}>Espécies</Text>
            <Image
              source={require('../../assets/images/Icone/arrow-down.png')}
              style={[styles.arrowIcon, especiesExpanded && styles.arrowIconUp]}
            />
          </TouchableOpacity>

          {especiesExpanded && (
            <View style={styles.expandedSection}>{renderItems(especies, setEspecies, 'especie')}</View>
          )}

          {/* Seção Idade */}
          {hasSelectedEspecies() ? (
            <TouchableOpacity 
              style={styles.filterSection} 
              onPress={() => handleSectionPress(idadeExpanded, setIdadeExpanded)}
            >
              <Text style={styles.filterSectionText}>Idade</Text>
              <Image
                source={require('../../assets/images/Icone/arrow-down.png')}
                style={[styles.arrowIcon, idadeExpanded && styles.arrowIconUp]}
              />
            </TouchableOpacity>
          ) : (
            <>
              <View style={[styles.filterSection, styles.filterSectionBlocked]}>
                <Text style={[styles.filterSectionText, styles.filterSectionTextBlocked]}>
                  Idade
                </Text>
                <Image
                  source={require('../../assets/images/Icone/arrow-down.png')}
                  style={[styles.arrowIcon, styles.arrowIconBlocked]}
                />
              </View>
              <View style={styles.infoMessageAttached}>
                <Text style={styles.infoMessageText}>
                  💡 Selecione uma espécie primeiro
                </Text>
              </View>
            </>
          )}

          {idadeExpanded && hasSelectedEspecies() && (
            <View style={styles.expandedSection}>{renderFaixasEtariasItems()}</View>
          )}

          {/* Seção Raças/Tipo */}
          {hasSelectedEspecies() ? (
            <TouchableOpacity 
              style={styles.filterSection} 
              onPress={() => handleSectionPress(racasExpanded, setRacasExpanded)}
            >
              <Text style={styles.filterSectionText}>Raças/Tipo</Text>
              <Image
                source={require('../../assets/images/Icone/arrow-down.png')}
                style={[styles.arrowIcon, racasExpanded && styles.arrowIconUp]}
              />
            </TouchableOpacity>
          ) : (
            <>
              <View style={[styles.filterSection, styles.filterSectionBlocked]}>
                <Text style={[styles.filterSectionText, styles.filterSectionTextBlocked]}>
                  Raças/Tipo
                </Text>
                <Image
                  source={require('../../assets/images/Icone/arrow-down.png')}
                  style={[styles.arrowIcon, styles.arrowIconBlocked]}
                />
              </View>
              <View style={styles.infoMessageAttached}>
                <Text style={styles.infoMessageText}>
                  💡 Selecione uma espécie primeiro
                </Text>
              </View>
            </>
          )}

          {racasExpanded && hasSelectedEspecies() && (
            <View style={styles.expandedSection}>
              {loadingRacas ? renderLoading() : renderItemsWithSearch(racas, setRacas, 'raca', searchRaca, setSearchRaca)}
            </View>
          )}

          {/* Seção Região */}
          <TouchableOpacity style={styles.filterSection} onPress={() => setRegiaoExpanded(!regiaoExpanded)}>
            <Text style={styles.filterSectionText}>Região</Text>
            <Image
              source={require('../../assets/images/Icone/arrow-down.png')}
              style={[styles.arrowIcon, regiaoExpanded && styles.arrowIconUp]}
            />
          </TouchableOpacity>

          {regiaoExpanded && (
            <View style={styles.expandedSection}>
              {/* Subseção Estados */}
              <TouchableOpacity 
                style={styles.subFilterSection} 
                onPress={() => setEstadosExpanded(!estadosExpanded)}
              >
                <Text style={styles.subFilterSectionText}>Estados</Text>
                <Image
                  source={require('../../assets/images/Icone/arrow-down.png')}
                  style={[styles.arrowIconSmall, estadosExpanded && styles.arrowIconUp]}
                />
              </TouchableOpacity>

              {estadosExpanded && (
                <View style={styles.subExpandedSection}>
                  {renderItemsWithSearch(estados, setEstados, 'estado', searchEstado, setSearchEstado)}
                </View>
              )}

              {/* Subseção Cidade */}
              {hasSelectedEstados() ? (
                <TouchableOpacity 
                  style={[styles.subFilterSection, { marginTop: 10 }]} 
                  onPress={() => setCidadesExpanded(!cidadesExpanded)}
                >
                  <Text style={styles.subFilterSectionText}>Cidade</Text>
                  <Image
                    source={require('../../assets/images/Icone/arrow-down.png')}
                    style={[styles.arrowIconSmall, cidadesExpanded && styles.arrowIconUp]}
                  />
                </TouchableOpacity>
              ) : (
                <>
                  <View style={[styles.subFilterSection, styles.subFilterSectionBlocked, { marginTop: 10 }]}>
                    <Text style={[styles.subFilterSectionText, styles.subFilterSectionTextBlocked]}>
                      Cidade
                    </Text>
                    <Image
                      source={require('../../assets/images/Icone/arrow-down.png')}
                      style={[styles.arrowIconSmall, styles.arrowIconBlocked]}
                    />
                  </View>
                  <View style={styles.infoMessageAttached}>
                    <Text style={styles.infoMessageText}>
                      💡 Selecione um estado primeiro
                    </Text>
                  </View>
                </>
              )}

              {cidadesExpanded && hasSelectedEstados() && (
                <View style={styles.subExpandedSection}>
                  {loadingCidades ? renderLoading() : renderItemsWithSearch(cidades, setCidades, 'cidade', searchCidade, setSearchCidade)}
                </View>
              )}
            </View>
          )}

          {/* Seção Favoritos */}
          <TouchableOpacity style={styles.filterSection} onPress={toggleFavorites}>
            <View style={styles.favoritesSectionContent}>
              <Text style={styles.filterSectionText}>Favoritos</Text>
              {loadingFavorites && (
                <ActivityIndicator size="small" color="#4682B4" style={styles.favoritesLoader} />
              )}
              {onlyFavorites && favoritePetIds.length > 0 && (
                <Text style={styles.favoritesCount}>({favoritePetIds.length} pets)</Text>
              )}
            </View>
            <Image
              source={
                onlyFavorites
                  ? require('../../assets/images/Icone/star-icon-open.png')
                  : require('../../assets/images/Icone/star-icon.png')
              }
              style={styles.starIcon}
            />
          </TouchableOpacity>

          {/* Mostrar aviso se favoritos estiver ativo mas não há favoritos */}
          {onlyFavorites && favoritePetIds.length === 0 && !loadingFavorites && (
            <View style={styles.infoMessageAttached}>
              <Text style={styles.infoMessageText}>
                ℹ️ Você ainda não possui pets favoritos
              </Text>
            </View>
          )}

          {/* Botão Aplicar Filtro */}
          <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
            <Text style={styles.applyButtonText}>Aplicar Filtro</Text>
          </TouchableOpacity>
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 30,
    padding: 10,
    marginBottom: 20,
    alignSelf: 'flex-start',
    backgroundColor: '#FFF',
  },
  backIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  filterSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 5,
    padding: 15,
    marginBottom: 10,
    backgroundColor: '#FFF',
  },
  filterSectionBlocked: {
    backgroundColor: '#F5F5F5',
    borderColor: '#CCC',
    opacity: 0.7,
  },
  filterSectionText: {
    fontSize: 18,
    fontWeight: '500',
  },
  filterSectionTextBlocked: {
    color: '#999',
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
    color: '#4682B4',
  },
  arrowIcon: {
    width: 24,
    height: 24,
  },
  arrowIconUp: {
    transform: [{ rotate: '180deg' }],
  },
  arrowIconBlocked: {
    opacity: 0.5,
  },
  starIcon: {
    width: 24,
    height: 24,
  },
  expandedSection: {
    marginBottom: 15,
    marginTop: -5,
    paddingHorizontal: 10,
  },
  subFilterSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 5,
    padding: 12,
    marginBottom: 5,
    backgroundColor: '#F9F9F9',
  },
  subFilterSectionBlocked: {
    backgroundColor: '#F0F0F0',
    borderColor: '#CCC',
    opacity: 0.7,
  },
  subFilterSectionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4682B4',
  },
  subFilterSectionTextBlocked: {
    color: '#999',
  },
  subExpandedSection: {
    marginBottom: 10,
    marginTop: -5,
  },
  arrowIconSmall: {
    width: 20,
    height: 20,
  },
  searchContainer: {
    marginBottom: 0,
  },
  searchInput: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 5,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    borderBottomWidth: 0,
  },
  filterItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
    backgroundColor: '#FFF',
    borderLeftWidth: 1,
    borderLeftColor: '#DDD',
    borderRightWidth: 1,
    borderRightColor: '#DDD',
  },
  firstFilterItem: {
    borderTopWidth: 1,
    borderTopColor: '#DDD',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  firstFilterItemNoSearch: {
    borderTopWidth: 1,
    borderTopColor: '#DDD',
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  firstFilterItemWithDivider: {
    borderTopWidth: 0,
  },
  lastFilterItem: {
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#DDD',
  },
  filterItemText: {
    fontSize: 16,
    flex: 1,
  },
  selectedItem: {
    backgroundColor: '#F0F8FF',
  },
  selectedItemText: {
    fontWeight: '500',
    color: '#4682B4',
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4682B4',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  checkmarkText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  emptyStateContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 5,
  },
  emptyStateAttached: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
    borderWidth: 1,
    borderTopWidth: 1,
    borderColor: '#DDD',
  },
  emptyStateText: {
    color: '#666',
    textAlign: 'center',
  },
  applyButton: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 30,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  applyButtonText: {
    fontSize: 18,
    fontWeight: '500',
  },
  faixaEtariaContainer: {
    marginBottom: 0,
  },
  idadeInputContainer: {
    backgroundColor: '#F8F8F8',
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginTop: -1,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
    borderLeftWidth: 1,
    borderLeftColor: '#DDD',
    borderRightWidth: 1,
    borderRightColor: '#DDD',
  },
  lastIdadeInputContainer: {
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
    borderBottomColor: '#DDD',
  },
  idadeLabel: {
    fontSize: 14,
    marginBottom: 5,
    color: '#666',
  },
  idadeInput: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 4,
    padding: 8,
    fontSize: 14,
  },
  // Novos estilos para divisores de categoria
  categoryDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    marginHorizontal: 5,
  },
  categoryDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  categoryDividerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  categoryDividerIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryDividerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4682B4',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Estilo para listas com scroll
  scrollableList: {
    maxHeight: 250, // Altura máxima de ~5-6 itens
    backgroundColor: '#FFF',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#DDD',
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
  },
  // Estilos para mensagens informativas - VERSÃO COLADA
  infoMessageAttached: {
    backgroundColor: '#F8F9FA',
    borderLeftWidth: 4,
    borderLeftColor: '#4682B4',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#CCC',
    padding: 12,
    marginTop: -10, // Cola com o campo acima
    marginBottom: 10,
    marginHorizontal: 0, // Remove margem horizontal para ficar alinhado
  },
  infoMessageText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  // Novos estilos para seção de favoritos
  favoritesSectionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  favoritesLoader: {
    marginLeft: 10,
  },
  favoritesCount: {
    fontSize: 14,
    color: '#4682B4',
    fontWeight: '500',
    marginLeft: 8,
  },
});