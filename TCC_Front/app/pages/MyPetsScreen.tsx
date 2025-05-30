// MyPetsScreen.tsx - Tela para listar pets associados ao usuário - COM MODAL DO TERMO E MODAL DE ADOÇÃO + WHATSAPP
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
  Linking,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import getByUsuarioId from '@/services/api/MyPets/getByUsuarioId';
import deleteMyPet from '@/services/api/MyPets/deleteMyPet';
import MyPetsCard from '@/components/modal_Pet/MyPetCard';
import getUsuarioByIdComCidadeEstado from '@/services/api/Usuario/getUsuarioByIdComCidadeEstado';
import getUsuarioById from '@/services/api/Usuario/getUsuarioById';
import getRacaById from '@/services/api/Raca/getRacaById';
import getstatusById from '@/services/api/Status/getstatusById';
import getFaixaEtariaById from '@/services/api/Faixa-etaria/getFaixaEtariaById';
import getFavorito from '@/services/api/Favoritos/getFavorito';
import deleteFavorito from '@/services/api/Favoritos/deleteFavorito';
import checkFavorito from '@/services/api/Favoritos/checkFavorito';
import getTermoByPet from '@/services/api/Termo/getTermoByPet';
import updateStatus from '@/services/api/Status/updateStatus';
// 🆕 IMPORTS PARA O MODAL DO TERMO
import TermoModal from '@/components/Termo/TermoModal';

// Definindo uma interface para o tipo Pet
interface Pet {
  id: number;
  nome: string;
  raca_id: number;
  raca_nome?: string;
  idade: string;
  usuario_id: number;
  usuario_nome?: string;
  usuario_foto?: string | null;
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
  usuario_telefone?: string;
  usuario_email?: string;
  rgPet?: string;
  rg_Pet?: string;
  motivoDoacao?: string;
  estado_id?: number;
  cidade_id?: number;
  pet_especie_nome?: string;
  pet_sexo_nome?: string;
}

// Interface para o usuário
interface Usuario {
  id: number;
  nome: string;
  email?: string;
  foto?: string;
  telefone?: string;
  cidade?: {
    id: number;
    nome: string;
  };
  estado?: {
    id: number;
    nome: string;
  };
}

// Interface para os filtros (completa para MyPets)
interface FilterParams {
  especieIds?: number[];
  faixaEtariaIds?: number[];
  faixasEtariaIdades?: { [key: number]: number };
  racaIds?: number[];
  estadoIds?: number[];
  cidadeIds?: number[];
  onlyFavorites?: boolean;
  searchQuery?: string;
  searchResults?: Pet[];
  statusIds?: number[];
}

// Obter dimensões da tela
const { width } = Dimensions.get('window');

export default function MyPetsScreen() {
  const params = useLocalSearchParams();
  const [allMyPets, setAllMyPets] = useState<Pet[]>([]);
  const [filteredMyPets, setFilteredMyPets] = useState<Pet[]>([]);
  const [searchResults, setSearchResults] = useState<Pet[]>([]);
  const [hasActiveSearch, setHasActiveSearch] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [usuarioId, setUsuarioId] = useState<number | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [activeFilters, setActiveFilters] = useState<FilterParams | null>(null);

  // 🆕 ESTADOS PARA O MODAL DO TERMO
  const [termoModalVisible, setTermoModalVisible] = useState(false);
  const [selectedPetForTermo, setSelectedPetForTermo] = useState<Pet | null>(null);

  // 🆕 ESTADOS PARA O MODAL DE ADOÇÃO
  const [adoptionModalVisible, setAdoptionModalVisible] = useState(false);
  const [selectedPetForAdoption, setSelectedPetForAdoption] = useState<Pet | null>(null);

  // 🔧 FUNÇÃO CORRIGIDA: Botão voltar com debug
  const handleGoBack = () => {
    console.log('🔄 Botão voltar clicado - navegando para tela anterior');
    try {
      router.back();
    } catch (error) {
      console.error('Erro ao voltar:', error);
      // Fallback: navegar para uma tela específica
      router.push('/pages/PetAdoptionScreen'); // ou router.replace('/(tabs)/home')
    }
  };

  // 🔧 FUNÇÃO CORRIGIDA: Filtro avançado com debug
  const handleAdvancedFilter = () => {
    console.log('🔍 Botão filtro avançado clicado');

    // Evitar execução se estiver navegando
    if (loading) return;

    let currentFiltersToPass = activeFilters ? { ...activeFilters } : {};

    if (hasActiveSearch && searchQuery.trim() !== '') {
      currentFiltersToPass.searchQuery = searchQuery.trim();
      currentFiltersToPass.searchResults = searchResults;
    }

    const currentFiltersStr =
      Object.keys(currentFiltersToPass).length > 0 ? encodeURIComponent(JSON.stringify(currentFiltersToPass)) : '';

    router.push({
      pathname: '/pages/MypetsFilter',
      params: {
        filters: currentFiltersStr,
        origin: 'mypets',
      },
    });
  };

  // Função auxiliar para normalizar pets da API
  const normalizePetFromAPI = (pet: any): Pet | null => {
    if (!pet || typeof pet !== 'object' || !pet.id) {
      return null;
    }

    return {
      ...pet,
      rgPet: pet.rgPet || pet.rg_Pet || '',
      usuario_estado_id: pet.usuario_estado_id || pet.estado_id,
      usuario_cidade_id: pet.usuario_cidade_id || pet.cidade_id,
      nome: pet.nome || 'Pet sem nome',
      idade: pet.idade?.toString() || '0',
      usuario_id: pet.usuario_id || 0,
      raca_id: pet.raca_id || 0,
      status_id: pet.status_id || 3,
      faixa_etaria_id: pet.faixa_etaria_id || 0,
      especie_id: pet.especie_id || 0,
      sexo_id: pet.sexo_id || 0,
    };
  };

  // Função auxiliar para normalizar respostas da API
  const normalizeApiResponse = (response: any): Pet[] => {
    if (!response) {
      return [];
    }

    if (Array.isArray(response)) {
      return response;
    }

    if (typeof response === 'object' && response.id) {
      return [response as Pet];
    }

    if (typeof response === 'object') {
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
        const storedFilters = await AsyncStorage.getItem('@App:myPetsFilters');
        if (storedFilters) {
          const parsedFilters = JSON.parse(storedFilters);

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
      const userId = await AsyncStorage.getItem('@App:userId');

      if (!userId) {
        console.error('ID do usuário não encontrado no AsyncStorage');
        return;
      }

      const userIdNumber = parseInt(userId);
      setUsuarioId(userIdNumber);

      const userData = await getUsuarioById(userIdNumber);

      if (!userData) {
        console.error('Dados do usuário não encontrados');
        return;
      }

      console.log('Dados do usuário carregados:', userData);
      setUsuario(userData);

      await AsyncStorage.setItem('@App:userData', JSON.stringify(userData));
    } catch (err) {
      console.error('Erro ao buscar dados do usuário:', err);
    }
  };

  // Função para carregar pets com detalhes completos incluindo foto do usuário
  const loadPetsWithDetails = async (pets: Pet[]): Promise<Pet[]> => {
    if (!Array.isArray(pets) || pets.length === 0) {
      console.log('Array de pets vazio ou inválido');
      return [];
    }

    try {
      return Promise.all(
        pets.map(async (pet: Pet) => {
          try {
            let racaInfo = pet.raca_nome ? null : await getRacaById(pet.raca_id);
            let statusInfo = pet.status_nome ? null : await getstatusById(pet.status_id);
            let faixaEtariaInfo = pet.faixa_etaria_unidade ? null : await getFaixaEtariaById(pet.faixa_etaria_id);

            let usuarioInfo = null;
            let usuarioFotoInfo = null;

            if (!pet.usuario_nome) {
              usuarioInfo = await getUsuarioByIdComCidadeEstado(pet.usuario_id);
            }

            if (!pet.usuario_foto) {
              usuarioFotoInfo = await getUsuarioById(pet.usuario_id);
            }

            let isFavorito = false;
            if (usuarioId) {
              isFavorito = await checkFavorito(usuarioId, pet.id);
            }

            return {
              ...pet,
              raca_nome: pet.raca_nome || racaInfo?.nome || 'Desconhecido',
              usuario_nome: pet.usuario_nome || usuarioInfo?.nome || 'Desconhecido',
              usuario_foto: pet.usuario_foto || usuarioFotoInfo?.foto || null,
              usuario_telefone: pet.usuario_telefone || usuarioFotoInfo?.telefone,
              usuario_email: pet.usuario_email || usuarioFotoInfo?.email,
              usuario_cidade_id: pet.usuario_cidade_id || usuarioInfo?.cidade?.id,
              usuario_estado_id: pet.usuario_estado_id || usuarioInfo?.estado?.id,
              status_nome: pet.status_nome || statusInfo?.nome || 'Em adoção',
              faixa_etaria_unidade: pet.faixa_etaria_unidade || faixaEtariaInfo?.unidade || '',
              favorito: isFavorito,
            };
          } catch (petError) {
            console.error(`Erro ao carregar detalhes do pet ${pet.id}:`, petError);
            return {
              ...pet,
              raca_nome: pet.raca_nome || 'Desconhecido',
              usuario_nome: pet.usuario_nome || 'Desconhecido',
              usuario_foto: pet.usuario_foto || null,
              status_nome: pet.status_nome || 'Em adoção',
              faixa_etaria_unidade: pet.faixa_etaria_unidade || '',
              favorito: false,
            };
          }
        })
      );
    } catch (error) {
      console.error('Erro geral ao carregar detalhes dos pets:', error);
      return pets.map((pet) => ({
        ...pet,
        raca_nome: pet.raca_nome || 'Desconhecido',
        usuario_nome: pet.usuario_nome || 'Desconhecido',
        usuario_foto: pet.usuario_foto || null,
        status_nome: pet.status_nome || 'Em adoção',
        faixa_etaria_unidade: pet.faixa_etaria_unidade || '',
        favorito: false,
      }));
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

      if (hasActiveSearch && searchQuery.trim() !== '') {
        baseData = searchResults;
        console.log('Usando resultados da busca como base:', baseData.length, 'pets');
      } else {
        baseData = allMyPets;
        console.log('Usando todos os meus pets como base:', baseData.length, 'pets');
      }

      if (activeFilters) {
        let filteredData = baseData;

        if (activeFilters.onlyFavorites && usuarioId) {
          filteredData = filteredData.filter((pet) => pet.favorito === true);
          console.log('Após filtro de favoritos:', filteredData.length, 'pets');
        }

        if (activeFilters.especieIds && activeFilters.especieIds.length > 0) {
          filteredData = filteredData.filter((pet) => activeFilters.especieIds?.includes(pet.especie_id || 0));
          console.log('Após filtro de espécies:', filteredData.length, 'pets');
        }

        if (activeFilters.racaIds && activeFilters.racaIds.length > 0) {
          filteredData = filteredData.filter((pet) => activeFilters.racaIds?.includes(pet.raca_id));
          console.log('Após filtro de raças:', filteredData.length, 'pets');
        }

        if (activeFilters.faixaEtariaIds && activeFilters.faixaEtariaIds.length > 0) {
          filteredData = filteredData.filter((pet) => activeFilters.faixaEtariaIds?.includes(pet.faixa_etaria_id));
          console.log('Após filtro de faixa etária:', filteredData.length, 'pets');
        }

        if (activeFilters.estadoIds && activeFilters.estadoIds.length > 0) {
          filteredData = filteredData.filter((pet) => {
            const petEstadoId = pet.usuario_estado_id || pet.estado_id;
            return activeFilters.estadoIds?.includes(petEstadoId || 0);
          });
          console.log('Após filtro de estados:', filteredData.length, 'pets');
        }

        if (activeFilters.cidadeIds && activeFilters.cidadeIds.length > 0) {
          filteredData = filteredData.filter((pet) => {
            const petCidadeId = pet.usuario_cidade_id || pet.cidade_id;
            return activeFilters.cidadeIds?.includes(petCidadeId || 0);
          });
          console.log('Após filtro de cidades:', filteredData.length, 'pets');
        }

        if (activeFilters.faixasEtariaIdades && Object.keys(activeFilters.faixasEtariaIdades).length > 0) {
          filteredData = filteredData.filter((pet) => {
            const faixaEtariaId = pet.faixa_etaria_id;
            const idadeEspecifica = activeFilters.faixasEtariaIdades?.[faixaEtariaId];

            if (idadeEspecifica !== undefined) {
              const petIdade = parseInt(pet.idade) || 0;
              return petIdade === idadeEspecifica;
            }

            return true;
          });
          console.log('Após filtro de idades específicas:', filteredData.length, 'pets');
        }

        console.log('Pets após aplicar TODOS os filtros:', filteredData.length);
        setFilteredMyPets(filteredData);
      } else {
        console.log('Nenhum filtro ativo, usando dados base');
        setFilteredMyPets(baseData);
      }
    } catch (error) {
      console.error('Erro ao aplicar filtros atuais:', error);
      if (hasActiveSearch && searchQuery.trim() !== '') {
        setFilteredMyPets(searchResults);
      } else {
        setFilteredMyPets(allMyPets);
      }
    }
  };

  // Carregar os meus pets usando getByUsuarioId
  useEffect(() => {
    const fetchMyPets = async () => {
      if (!usuarioId) {
        console.log('Usuário não logado, não é possível buscar pets');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log(`Carregando meus pets do usuário ID: ${usuarioId}...`);

        const response = await getByUsuarioId(usuarioId);
        console.log('Resposta da API getByUsuarioId:', response);

        let pets: Pet[] = [];

        if (response && response.data && Array.isArray(response.data)) {
          pets = response.data.map(normalizePetFromAPI).filter(Boolean);
        } else if (response && response.data && typeof response.data === 'object') {
          const normalizedPet = normalizePetFromAPI(response.data);
          if (normalizedPet) {
            pets = [normalizedPet];
          }
        }

        console.log('Meus pets extraídos:', pets.length);

        if (!pets || pets.length === 0) {
          console.log('Nenhum pet associado ao usuário encontrado');
          setAllMyPets([]);
          setFilteredMyPets([]);
          setLoading(false);
          return;
        }

        const petsWithDetails = await loadPetsWithDetails(pets);
        console.log('Meus pets com detalhes carregados:', petsWithDetails.length);

        const validPets = petsWithDetails.filter((pet) => pet && pet.id);
        console.log('Pets válidos para o estado:', validPets.length);

        setAllMyPets(validPets);

        if (!activeFilters && !hasActiveSearch) {
          setFilteredMyPets(validPets);
        }

        setLoading(false);
      } catch (err) {
        console.error('Erro ao buscar meus pets:', err);
        setError('Não foi possível carregar seus pets. Tente novamente mais tarde.');
        setLoading(false);
      }
    };

    fetchMyPets();
  }, [usuarioId]);

  // Aplicar filtros sempre que eles mudarem
  useEffect(() => {
    if (!loading) {
      applyCurrentFilters();
    }
  }, [activeFilters, hasActiveSearch, searchResults, allMyPets, loading]);

  // Recarregar os dados
  const refreshData = async () => {
    if (!usuarioId) {
      console.log('Usuário não logado, não é possível recarregar pets');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await getByUsuarioId(usuarioId);

      let pets: Pet[] = [];

      if (response && response.data && Array.isArray(response.data)) {
        pets = response.data.map(normalizePetFromAPI).filter(Boolean);
      } else if (response && response.data && typeof response.data === 'object') {
        const normalizedPet = normalizePetFromAPI(response.data);
        if (normalizedPet) {
          pets = [normalizedPet];
        }
      }

      if (!pets || pets.length === 0) {
        setAllMyPets([]);
        setFilteredMyPets([]);
        setLoading(false);
        return;
      }

      const petsWithDetails = await loadPetsWithDetails(pets);
      const validPets = petsWithDetails.filter((pet) => pet && pet.id);

      setAllMyPets(validPets);
      setLoading(false);
    } catch (err) {
      console.error('Erro ao recarregar meus pets:', err);
      setError('Não foi possível carregar seus pets. Tente novamente mais tarde.');
      setLoading(false);
    }
  };

  // 🔧 FUNÇÃO MODIFICADA: handleCommunicate agora usa o modal de adoção
  // 🔧 FUNÇÃO MODIFICADA: handleCommunicate com verificação de status_id = 4
  const handleCommunicate = async (pet: Pet) => {
    try {
      console.log('📋 Verificando comunicação para o pet:', pet.nome);

      // Verificar se o usuário está logado
      if (!usuarioId || !usuario) {
        Alert.alert('Erro', 'Você precisa estar logado para se comunicar.');
        return;
      }

      // Verificar se não é o próprio pet do usuário
      if (pet.usuario_id === usuarioId) {
        Alert.alert(
          'Informação',
          'Este é seu próprio pet. Você pode ver as informações dele, mas não precisa de termo de adoção.'
        );
        return;
      }

      // 🆕 VERIFICAÇÃO PRIORITÁRIA: Se o status_id já for 4 (Adotado), ir direto para WhatsApp
      if (pet.status_id === 4) {
        console.log('✅ Pet já tem status "Adotado" (status_id: 4), indo direto para WhatsApp');
        await openWhatsAppDirectly(pet);
        return;
      }

      // Verificar silenciosamente se já existe um termo para este pet
      const termoResponse = await getTermoByPet(pet.id);

      if (termoResponse && termoResponse.data) {
        // Já existe termo - mostrar modal de adoção
        console.log('✅ Termo já existe para este pet, mostrando modal de adoção');
        setSelectedPetForAdoption(pet);
        setAdoptionModalVisible(true);
        return;
      }

      // Se termoResponse é null, significa que não existe termo (404 tratado silenciosamente)
      console.log('ℹ️ Nenhum termo encontrado, abrindo modal para criar');
      setSelectedPetForTermo(pet);
      setTermoModalVisible(true);
    } catch (error: any) {
      // Apenas tratar erros reais (401, 500, etc. - não 404)
      if (error.message?.includes('Sessão expirada')) {
        Alert.alert('Erro', 'Sessão expirada. Faça login novamente.');
        return;
      }

      // Para outros erros, permitir criar termo
      setSelectedPetForTermo(pet);
      setTermoModalVisible(true);
    }
  };

  // 🆕 FUNÇÃO PARA ABRIR WHATSAPP DIRETAMENTE (SEM MODAL E SEM UPDATE STATUS)
  const openWhatsAppDirectly = async (pet: Pet) => {
    if (!usuario) return;

    try {
      console.log('📱 Abrindo WhatsApp diretamente para:', pet.nome);

      // Preparar dados para WhatsApp
      const donoPet = pet.usuario_nome || 'responsável';
      const nomePet = pet.nome;
      const nomeInteressado = usuario.nome;
      const telefone = pet.usuario_telefone;

      // Verificar se tem telefone
      if (!telefone) {
        Alert.alert(
          'Contato não disponível',
          `O telefone do responsável por ${nomePet} não está disponível no momento.\n\n${
            pet.usuario_email
              ? `Você pode tentar entrar em contato pelo email: ${pet.usuario_email}`
              : 'Tente entrar em contato através do app posteriormente.'
          }`,
          [{ text: 'OK' }]
        );
        return;
      }

      // Criar mensagem pré-pronta personalizada
      const mensagem = `Olá ${donoPet}! 👋

Meu nome é ${nomeInteressado} e tenho interesse em adotar o pet *${nomePet}* que vi no app de adoção.

Gostaria de saber mais detalhes sobre:
• Processo de adoção
• Quando podemos nos conhecer
• Cuidados especiais do ${nomePet}

Agradeço desde já! 🐾❤️`;

      // Limpar número (remover caracteres especiais e garantir formato brasileiro)
      let numeroLimpo = telefone.replace(/\D/g, '');

      // Adicionar código do país se não tiver
      if (numeroLimpo.length === 11 && numeroLimpo.startsWith('0')) {
        numeroLimpo = numeroLimpo.substring(1); // Remove o 0 inicial
      }
      if (numeroLimpo.length === 10 || numeroLimpo.length === 11) {
        numeroLimpo = '55' + numeroLimpo; // Adiciona código do Brasil
      }

      // Criar URL do WhatsApp
      const whatsappUrl = `whatsapp://send?phone=${numeroLimpo}&text=${encodeURIComponent(mensagem)}`;

      console.log('📱 Tentando abrir WhatsApp para:', numeroLimpo);

      // Verificar se pode abrir WhatsApp
      const canOpen = await Linking.canOpenURL(whatsappUrl);

      if (canOpen) {
        // Abrir WhatsApp diretamente (SEM atualizar status pois já é 4)
        await Linking.openURL(whatsappUrl);

        // Mostrar confirmação após um delay
        setTimeout(() => {
          Alert.alert(
            'Conversa Iniciada! 💬',
            `Uma conversa foi iniciada com ${donoPet} sobre a adoção do ${nomePet}.`,
            [{ text: 'Perfeito!' }]
          );
        }, 1500);
      } else {
        // WhatsApp não disponível - mostrar opções alternativas
        Alert.alert('WhatsApp não disponível', `Entre em contato diretamente com ${donoPet}:`, [
          {
            text: 'Ver número',
            onPress: () => {
              Alert.alert('Telefone', telefone, [{ text: 'OK' }]);
            },
          },
          {
            text: 'Ver mensagem',
            onPress: () => {
              Alert.alert('Mensagem sugerida', mensagem, [{ text: 'OK' }]);
            },
          },
          { text: 'OK' },
        ]);
      }
    } catch (error) {
      console.error('Erro ao abrir WhatsApp:', error);

      Alert.alert(
        'Erro na comunicação',
        'Não foi possível abrir o WhatsApp automaticamente. Tente entrar em contato diretamente com o responsável pelo pet.',
        [{ text: 'OK' }]
      );
    }
  };

  // 🆕 FUNÇÃO PARA FECHAR O MODAL DO TERMO E ABRIR O DE ADOÇÃO
  const handleCloseTermoModal = () => {
    console.log('📋 Fechando modal do termo');
    setTermoModalVisible(false);

    // Se havia um pet selecionado, mostrar modal de adoção
    if (selectedPetForTermo) {
      console.log('🐾 Abrindo modal de adoção para o pet:', selectedPetForTermo.nome);
      setSelectedPetForAdoption(selectedPetForTermo);
      setSelectedPetForTermo(null);
      setAdoptionModalVisible(true);
    }
  };

  // 🆕 FUNÇÃO PARA FECHAR O MODAL DE ADOÇÃO
  const handleCloseAdoptionModal = () => {
    console.log('🐾 Fechando modal de adoção');
    setAdoptionModalVisible(false);
    setSelectedPetForAdoption(null);
  };

  // 🆕 FUNÇÃO PARA INICIAR PROCESSO DE ADOÇÃO VIA WHATSAPP
  // 🆕 FUNÇÃO PARA INICIAR PROCESSO DE ADOÇÃO VIA WHATSAPP COM ATUALIZAÇÃO DE STATUS
  // 🆕 FUNÇÃO PARA INICIAR PROCESSO DE ADOÇÃO VIA WHATSAPP COM ATUALIZAÇÃO DE STATUS
  // Esta função é chamada através do modal e DEVE atualizar o status para 4
  const handleStartAdoption = async () => {
    if (!selectedPetForAdoption || !usuario) return;

    try {
      console.log('🎯 Iniciando processo de adoção via WhatsApp para:', selectedPetForAdoption.nome);

      // Preparar dados para WhatsApp
      const donoPet = selectedPetForAdoption.usuario_nome || 'responsável';
      const nomePet = selectedPetForAdoption.nome;
      const nomeInteressado = usuario.nome;
      const telefone = selectedPetForAdoption.usuario_telefone;

      // Verificar se tem telefone
      if (!telefone) {
        // Fechar modal primeiro
        handleCloseAdoptionModal();

        Alert.alert(
          'Contato não disponível',
          `O telefone do responsável por ${nomePet} não está disponível no momento.\n\n${
            selectedPetForAdoption.usuario_email
              ? `Você pode tentar entrar em contato pelo email: ${selectedPetForAdoption.usuario_email}`
              : 'Tente entrar em contato através do app posteriormente.'
          }`,
          [{ text: 'OK' }]
        );
        return;
      }

      // Criar mensagem pré-pronta personalizada
      const mensagem = `Olá ${donoPet}! 👋

Meu nome é ${nomeInteressado} e tenho interesse em adotar o pet *${nomePet}* que vi no app de adoção.

Gostaria de saber mais detalhes sobre:
• Processo de adoção
• Quando podemos nos conhecer
• Cuidados especiais do ${nomePet}

Agradeço desde já! 🐾❤️`;

      // Limpar número (remover caracteres especiais e garantir formato brasileiro)
      let numeroLimpo = telefone.replace(/\D/g, '');

      // Adicionar código do país se não tiver
      if (numeroLimpo.length === 11 && numeroLimpo.startsWith('0')) {
        numeroLimpo = numeroLimpo.substring(1); // Remove o 0 inicial
      }
      if (numeroLimpo.length === 10 || numeroLimpo.length === 11) {
        numeroLimpo = '55' + numeroLimpo; // Adiciona código do Brasil
      }

      // Criar URL do WhatsApp
      const whatsappUrl = `whatsapp://send?phone=${numeroLimpo}&text=${encodeURIComponent(mensagem)}`;

      console.log('📱 Tentando abrir WhatsApp para:', numeroLimpo);

      // Verificar se pode abrir WhatsApp
      const canOpen = await Linking.canOpenURL(whatsappUrl);

      if (canOpen) {
        // 🆕 ATUALIZAR STATUS DO PET PARA "ADOTADO" (status_id: 4)
        // Esta atualização só acontece quando chamado através do modal
        try {
          console.log('🔄 Atualizando status do pet para "Adotado"...');
          await updateStatus(selectedPetForAdoption.id);

          // 🆕 ATUALIZAR OS ESTADOS LOCAIS PARA REFLETIR A MUDANÇA
          const updatedPet = {
            ...selectedPetForAdoption,
            status_id: 4,
            status_nome: 'Adotado',
          };

          // Atualizar allMyPets
          setAllMyPets((prevPets) => prevPets.map((pet) => (pet.id === selectedPetForAdoption.id ? updatedPet : pet)));

          // Atualizar filteredMyPets
          setFilteredMyPets((prevPets) =>
            prevPets.map((pet) => (pet.id === selectedPetForAdoption.id ? updatedPet : pet))
          );

          // Atualizar searchResults se houver busca ativa
          if (hasActiveSearch) {
            setSearchResults((prevResults) =>
              prevResults.map((pet) => (pet.id === selectedPetForAdoption.id ? updatedPet : pet))
            );
          }

          console.log('✅ Status do pet atualizado com sucesso para "Adotado"');
        } catch (statusError) {
          console.error('❌ Erro ao atualizar status do pet:', statusError);
          // Mesmo se falhar a atualização do status, ainda continua com o WhatsApp
          // mas mostra um aviso
          Alert.alert(
            'Aviso',
            'O WhatsApp será aberto, mas houve um problema ao atualizar o status do pet. Tente novamente mais tarde.',
            [{ text: 'OK' }]
          );
        }

        // Fechar modal primeiro
        handleCloseAdoptionModal();

        // Abrir WhatsApp
        await Linking.openURL(whatsappUrl);

        // Mostrar confirmação após um delay
        setTimeout(() => {
          Alert.alert(
            'Processo de Adoção Iniciado! 🎉',
            `Uma conversa foi iniciada com ${donoPet} e o status do ${nomePet} foi atualizado para "Adotado". Complete a conversa para finalizar o processo de adoção.`,
            [{ text: 'Perfeito!' }]
          );
        }, 1500);
      } else {
        // WhatsApp não disponível - mostrar opções alternativas
        handleCloseAdoptionModal();

        Alert.alert('WhatsApp não disponível', `Entre em contato diretamente com ${donoPet}:`, [
          {
            text: 'Ver número',
            onPress: () => {
              Alert.alert('Telefone', telefone, [{ text: 'OK' }]);
            },
          },
          {
            text: 'Ver mensagem',
            onPress: () => {
              Alert.alert('Mensagem sugerida', mensagem, [{ text: 'OK' }]);
            },
          },
          { text: 'OK' },
        ]);
      }
    } catch (error) {
      console.error('Erro ao abrir WhatsApp:', error);
      handleCloseAdoptionModal();

      Alert.alert(
        'Erro na comunicação',
        'Não foi possível abrir o WhatsApp automaticamente. Tente entrar em contato diretamente com o responsável pelo pet.',
        [{ text: 'OK' }]
      );
    }
  };
  // Remover pet dos meus pets usando deleteMyPet
  const handleRemovePet = async (pet: Pet) => {
    if (!usuarioId) {
      Alert.alert('Erro', 'Você precisa estar logado para remover pets.');
      return;
    }

    try {
      Alert.alert('Confirmar Remoção', `Deseja realmente remover ${pet.nome} dos seus pets?`, [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log(`Removendo pet ${pet.nome} (ID: ${pet.id}) dos pets do usuário ${usuarioId}`);

              await deleteMyPet(pet.id, usuarioId);

              setAllMyPets((prevPets) => prevPets.filter((p) => p.id !== pet.id));
              setFilteredMyPets((prevPets) => prevPets.filter((p) => p.id !== pet.id));

              if (hasActiveSearch) {
                setSearchResults((prevResults) => prevResults.filter((p) => p.id !== pet.id));
              }

              Alert.alert('Sucesso', `${pet.nome} foi removido dos seus pets.`);
            } catch (error) {
              console.error('Erro ao remover pet:', error);
              Alert.alert('Erro', 'Não foi possível remover o pet. Tente novamente.');
            }
          },
        },
      ]);
    } catch (error) {
      console.error('Erro ao tentar remover pet:', error);
      Alert.alert('Erro', 'Não foi possível remover o pet. Tente novamente.');
    }
  };

  // Função para favoritar/desfavoritar um pet
  const handleFavorite = async (petId: number) => {
    if (!usuarioId) {
      Alert.alert('Erro', 'Você precisa estar logado para favoritar pets.');
      return;
    }

    try {
      const pet = filteredMyPets.find((p: Pet) => p.id === petId);
      if (!pet) return;

      const wasFavorited = pet.favorito;

      if (pet.favorito) {
        await deleteFavorito(usuarioId, petId);
      } else {
        await getFavorito(usuarioId, petId);
      }

      const updatedAllPets = allMyPets.map((p: Pet) => (p.id === petId ? { ...p, favorito: !p.favorito } : p));
      setAllMyPets(updatedAllPets);

      if (hasActiveSearch) {
        const updatedSearchResults = searchResults.map((p: Pet) =>
          p.id === petId ? { ...p, favorito: !p.favorito } : p
        );
        setSearchResults(updatedSearchResults);
      }

      console.log(`Pet ID ${petId} ${wasFavorited ? 'removido dos' : 'adicionado aos'} favoritos`);
    } catch (error) {
      console.error('Erro ao atualizar favorito:', error);
      Alert.alert('Erro', 'Não foi possível atualizar os favoritos. Tente novamente.');
    }
  };

  // Função para limpar filtros ativos
  const clearFilters = async () => {
    console.log('Limpando filtros...');
    await AsyncStorage.removeItem('@App:myPetsFilters');
    setActiveFilters(null);

    if (activeFilters?.searchQuery) {
      setSearchQuery('');
      setSearchResults([]);
      setHasActiveSearch(false);
    }
  };

  // Renderizar cada item da lista de pets
  const renderMyPetItem = ({ item }: { item: Pet }) => {
    if (!item || !item.id) {
      console.warn('Item de pet inválido encontrado:', item);
      return null;
    }

    return (
      <View style={styles.petCardWrapper}>
        <MyPetsCard
          pet={item}
          onCommunicate={() => handleCommunicate(item)}
          onRemove={() => handleRemovePet(item)}
          onFavorite={() => handleFavorite(item.id)}
        />
      </View>
    );
  };

  // Função para verificar se há filtros ativos
  const getFilterInfo = () => {
    if (!activeFilters) return '';

    let filterCount = 0;

    if (activeFilters.especieIds && activeFilters.especieIds.length > 0) {
      filterCount += activeFilters.especieIds.length;
    }

    if (activeFilters.racaIds && activeFilters.racaIds.length > 0) {
      filterCount += activeFilters.racaIds.length;
    }

    if (activeFilters.faixaEtariaIds && activeFilters.faixaEtariaIds.length > 0) {
      filterCount += activeFilters.faixaEtariaIds.length;
    }

    if (activeFilters.estadoIds && activeFilters.estadoIds.length > 0) {
      filterCount += activeFilters.estadoIds.length;
    }

    if (activeFilters.cidadeIds && activeFilters.cidadeIds.length > 0) {
      filterCount += activeFilters.cidadeIds.length;
    }

    if (activeFilters.onlyFavorites) {
      filterCount += 1;
    }

    if (activeFilters.searchQuery) {
      filterCount += 1;
    }

    return filterCount > 0
      ? `${filterCount} filtro${filterCount > 1 ? 's' : ''} aplicado${filterCount > 1 ? 's' : ''}`
      : 'Filtros';
  };

  // Função para obter texto de status
  const getStatusText = () => {
    const queryText = searchQuery.trim();

    if (queryText !== '' && hasActiveSearch) {
      const hasOtherFilters =
        activeFilters &&
        Object.keys(activeFilters).some(
          (key) => key !== 'searchQuery' && key !== 'searchResults' && activeFilters[key as keyof FilterParams]
        );

      if (hasOtherFilters) {
        return `Buscando "${queryText}" nos meus pets`;
      } else {
        return `Resultados para "${queryText}" nos meus pets`;
      }
    }

    if (activeFilters) {
      if (activeFilters.onlyFavorites) {
        return 'Meus pets favoritos';
      } else {
        return 'Meus pets filtrados';
      }
    }

    return 'Todos os meus pets';
  };

  // 🆕 COMPONENTE DO MODAL DE ADOÇÃO BONITO
  const AdoptionModal = () => {
    if (!selectedPetForAdoption) return null;

    return (
      <Modal
        visible={adoptionModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseAdoptionModal}
      >
        <View style={modalStyles.overlay}>
          <View style={modalStyles.container}>
            {/* Header */}
            <View style={modalStyles.header}>
              <Text style={modalStyles.title}>🐾 Processo de Adoção</Text>
              <TouchableOpacity onPress={handleCloseAdoptionModal} style={modalStyles.closeButton}>
                <Text style={modalStyles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Conteúdo */}
            <View style={modalStyles.content}>
              {/* Foto do Pet */}
              <View style={modalStyles.petImageContainer}>
                {selectedPetForAdoption.foto ? (
                  <Image source={{ uri: selectedPetForAdoption.foto }} style={modalStyles.petImage} />
                ) : (
                  <View style={modalStyles.placeholderImage}>
                    <Text style={modalStyles.placeholderText}>🐕</Text>
                  </View>
                )}
              </View>

              {/* Informações */}
              <Text style={modalStyles.question}>
                Deseja iniciar o processo de adoção do pet{' '}
                <Text style={modalStyles.petName}>{selectedPetForAdoption.nome}</Text>?
              </Text>

              <Text style={modalStyles.ownerInfo}>
                Dono: <Text style={modalStyles.ownerName}>{selectedPetForAdoption.usuario_nome}</Text>
              </Text>

              <Text style={modalStyles.description}>
                O termo de responsabilidade já foi assinado. Agora você pode conversar diretamente com o responsável
                pelo pet.
              </Text>

              {/* Botões */}
              <View style={modalStyles.buttonContainer}>
                <TouchableOpacity style={modalStyles.adoptButton} onPress={handleStartAdoption}>
                  <Text style={modalStyles.adoptButtonText}>📱 Conversar no WhatsApp</Text>
                </TouchableOpacity>

                <TouchableOpacity style={modalStyles.cancelButton} onPress={handleCloseAdoptionModal}>
                  <Text style={modalStyles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground source={require('../../assets/images/backgrounds/Fundo_02.png')} style={styles.backgroundImage}>
        {/* HEADER */}
        <View style={styles.headerContainer}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack} activeOpacity={0.7}>
            <Image source={require('../../assets/images/Icone/arrow-left.png')} style={styles.backIcon} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Meus Pets</Text>

          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => router.push('/pages/ConfigScreen')}
            activeOpacity={0.7}
          >
            <Image source={require('../../assets/images/Icone/settings-icon.png')} style={styles.settingsIcon} />
          </TouchableOpacity>
        </View>

        {/* CONTAINER DE FILTROS */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, activeFilters && styles.activeFilterButton]}
            onPress={handleAdvancedFilter}
            activeOpacity={0.7}
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
        </View>

        {/* Indicador de status da busca/filtros */}
        {(hasActiveSearch || activeFilters) && (
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>{getStatusText()}</Text>
            <Text style={styles.resultCount}>
              {filteredMyPets.length} pet{filteredMyPets.length !== 1 ? 's' : ''} encontrado
              {filteredMyPets.length !== 1 ? 's' : ''}
            </Text>
          </View>
        )}

        {/* Lista de meus pets */}
        <View style={styles.petListContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4682B4" />
              <Text style={styles.loadingText}>Carregando seus pets...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={refreshData}>
                <Text style={styles.retryButtonText}>Tentar novamente</Text>
              </TouchableOpacity>
            </View>
          ) : filteredMyPets.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {hasActiveSearch && searchQuery.trim() !== ''
                  ? `Nenhum pet encontrado com o nome "${searchQuery.trim()}"${
                      activeFilters ? ' e filtros aplicados' : ''
                    }`
                  : activeFilters
                  ? 'Nenhum pet encontrado com os filtros selecionados'
                  : 'Você ainda não possui pets em seus favoritos. Visite a seção de pets disponíveis para adicionar alguns aos seus pets!'}
              </Text>
              {activeFilters && (
                <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
                  <Text style={styles.clearFiltersText}>Limpar filtros</Text>
                </TouchableOpacity>
              )}
              {!activeFilters && !hasActiveSearch && (
                <TouchableOpacity style={styles.goToPetsButton} onPress={() => router.push('/pages/PetAdoptionScreen')}>
                  <Text style={styles.goToPetsButtonText}>Ver Pets Disponíveis</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <FlatList
              data={filteredMyPets}
              renderItem={renderMyPetItem}
              keyExtractor={(item: Pet, index: number) => item?.id?.toString() || `pet-${index}`}
              contentContainerStyle={styles.petList}
              showsVerticalScrollIndicator={false}
              refreshing={loading}
              onRefresh={refreshData}
            />
          )}
        </View>

        {/* 🆕 MODAL DO TERMO DE COMPROMISSO */}
        {selectedPetForTermo && usuario && (
          <TermoModal
            visible={termoModalVisible}
            onClose={handleCloseTermoModal}
            pet={selectedPetForTermo}
            usuarioLogado={{
              id: usuario.id,
              nome: usuario.nome,
              email: usuario.email || '',
              telefone: usuario.telefone,
            }}
          />
        )}

        {/* 🆕 MODAL DE ADOÇÃO BONITO */}
        <AdoptionModal />
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
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
    marginTop: 10,
    minHeight: 60,
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 25,
    padding: 12,
    zIndex: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    width: 24,
    height: 24,
    tintColor: '#4682B4',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    flex: 1,
    textAlign: 'center',
  },
  settingsButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 25,
    padding: 12,
    zIndex: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsIcon: {
    width: 24,
    height: 24,
    tintColor: '#4682B4',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginVertical: 15,
    paddingHorizontal: 15,
    zIndex: 1,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  activeFilterButton: {
    backgroundColor: '#E8F1F8',
    borderWidth: 1,
    borderColor: '#4682B4',
  },
  filterButtonText: {
    marginRight: 8,
    fontWeight: 'bold',
    color: '#333',
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
  arrowIcon: {
    width: 12,
    height: 12,
    tintColor: '#666',
  },
  statusContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    marginHorizontal: 15,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#FFFFFF',
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
  goToPetsButton: {
    backgroundColor: '#25D366',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 10,
  },
  goToPetsButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

// 🆕 ESTILOS PARA O MODAL DE ADOÇÃO
const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  header: {
    backgroundColor: '#4682B4',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    padding: 25,
    alignItems: 'center',
  },
  petImageContainer: {
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  petImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#4682B4',
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#4682B4',
  },
  placeholderText: {
    fontSize: 40,
  },
  question: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 24,
  },
  petName: {
    fontWeight: 'bold',
    color: '#4682B4',
  },
  ownerInfo: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
  },
  ownerName: {
    fontWeight: 'bold',
    color: '#4682B4',
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 25,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  adoptButton: {
    backgroundColor: '#25D366', // Cor do WhatsApp
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  adoptButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
});
