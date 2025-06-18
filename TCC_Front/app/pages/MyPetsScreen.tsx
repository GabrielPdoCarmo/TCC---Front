// MyPetsScreen.tsx - Otimizado com ordenação por ID

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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import getByUsuarioId from '@/services/api/MyPets/getByUsuarioId';
import deleteMyPet from '@/services/api/MyPets/deleteMyPet';
import MyPetsCard from '@/components/Pets/MyPetCard';
import getUsuarioByIdComCidadeEstado from '@/services/api/Usuario/getUsuarioByIdComCidadeEstado';
import getUsuarioById from '@/services/api/Usuario/getUsuarioById';
import getRacaById from '@/services/api/Raca/getRacaById';
import getstatusById from '@/services/api/Status/getstatusById';
import getFaixaEtariaById from '@/services/api/Faixa-etaria/getFaixaEtariaById';
import getFavorito from '@/services/api/Favoritos/getFavorito';
import deleteFavorito from '@/services/api/Favoritos/deleteFavorito';
import checkFavorito from '@/services/api/Favoritos/checkFavorito';
import deleteTermoByPet from '@/services/api/TermoAdocao/deleteTermoByPet';
import checkPetHasTermo from '@/services/api/TermoAdocao/checkPetHasTermo';
import { checkCanAdopt } from '@/services/api/TermoAdocao/checkCanAdopt';
import updateStatus from '@/services/api/Status/updateStatus';
import transferPet from '@/services/api/Pets/transferPet';
import removePet from '@/services/api/Pets/removePet';
import TermoAdocaoModal from '@/components/Termo/TermoAdocaoModal';
import AdoptionModal from '@/components/Termo/AdoptionModal';
import { useAuth } from '@/contexts/AuthContext';

// Definindo uma interface para o tipo Pet
interface Pet {
  id: number;
  nome: string;
  raca_id: number;
  raca_nome?: string;
  idade: string;
  usuario_id: number;
  doador_id?: number;
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

type ModalState = 'closed' | 'whatsapp-initial' | 'termo-creation' | 'whatsapp-enabled' | 'name-update-needed';

const { width } = Dimensions.get('window');

// 🆕 ATUALIZADA: Função para ordenar pets por ID (mais recente primeiro)
const sortPetsByCreation = (pets: Pet[]): Pet[] => {
  return [...pets].sort((a, b) => b.id - a.id);
};

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

  // Estados para controlar sequência de modais iOS
  const [modalState, setModalState] = useState<ModalState>('closed');
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [hasExistingTermo, setHasExistingTermo] = useState<boolean>(false);
  const [emailWasSent, setEmailWasSent] = useState<boolean>(false);
  const [termoModalOrigin, setTermoModalOrigin] = useState<'obter' | 'ver' | 'update'>('obter');

  // Estados para verificação de nome
  const [nameNeedsUpdate, setNameNeedsUpdate] = useState<boolean>(false);
  const [isNameUpdateMode, setIsNameUpdateMode] = useState<boolean>(false);
  const { user, logout, isAuthenticated, loading: authLoading, setLastRoute } = useAuth();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      setLastRoute('/pages/MyPetsScreen');
    }
  }, [authLoading, isAuthenticated, setLastRoute]);

  // Verificar autenticação
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/pages/LoginScreen');
    }
  }, [isAuthenticated, authLoading]);

  // Função de navegação
  const handleGoBack = () => {
    router.push('/pages/PetAdoptionScreen');
  };

  // Função de filtro avançado
  const handleAdvancedFilter = () => {
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

  // Verificar se há filtros para aplicar quando a tela recebe parâmetros
  useEffect(() => {
    const checkForFilters = async () => {
      if (params.applyFilters === 'true') {
        const storedFilters = await AsyncStorage.getItem('@App:myPetsFilters');
        if (storedFilters) {
          const parsedFilters = JSON.parse(storedFilters);

          if (parsedFilters.searchQuery && parsedFilters.searchResults) {
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
        return;
      }

      const userIdNumber = parseInt(userId);
      setUsuarioId(userIdNumber);

      const userData = await getUsuarioById(userIdNumber);

      if (!userData) {
        return;
      }

      setUsuario(userData);

      await AsyncStorage.setItem('@App:userData', JSON.stringify(userData));
    } catch (err) {}
  };

  // Função para carregar pets com detalhes completos incluindo foto do usuário
  const loadPetsWithDetails = async (pets: Pet[]): Promise<Pet[]> => {
    if (!Array.isArray(pets) || pets.length === 0) {
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

  // 🆕 ATUALIZADA: Aplicar filtros considerando busca ativa COM ordenação por ID
  const applyCurrentFilters = async () => {
    try {
      let baseData: Pet[];

      if (hasActiveSearch && searchQuery.trim() !== '') {
        baseData = searchResults;
      } else {
        baseData = allMyPets;
      }

      if (activeFilters) {
        let filteredData = baseData;

        if (activeFilters.onlyFavorites && usuarioId) {
          filteredData = filteredData.filter((pet) => pet.favorito === true);
        }

        if (activeFilters.especieIds && activeFilters.especieIds.length > 0) {
          filteredData = filteredData.filter((pet) => activeFilters.especieIds?.includes(pet.especie_id || 0));
        }

        if (activeFilters.racaIds && activeFilters.racaIds.length > 0) {
          filteredData = filteredData.filter((pet) => activeFilters.racaIds?.includes(pet.raca_id));
        }

        if (activeFilters.faixaEtariaIds && activeFilters.faixaEtariaIds.length > 0) {
          filteredData = filteredData.filter((pet) => activeFilters.faixaEtariaIds?.includes(pet.faixa_etaria_id));
        }

        if (activeFilters.estadoIds && activeFilters.estadoIds.length > 0) {
          filteredData = filteredData.filter((pet) => {
            const petEstadoId = pet.usuario_estado_id || pet.estado_id;
            return activeFilters.estadoIds?.includes(petEstadoId || 0);
          });
        }

        if (activeFilters.cidadeIds && activeFilters.cidadeIds.length > 0) {
          filteredData = filteredData.filter((pet) => {
            const petCidadeId = pet.usuario_cidade_id || pet.cidade_id;
            return activeFilters.cidadeIds?.includes(petCidadeId || 0);
          });
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
        }

        // 🆕 APLICAR ORDENAÇÃO POR ID APENAS UMA VEZ no final dos filtros
        const sortedFilteredData = sortPetsByCreation(filteredData);
        setFilteredMyPets(sortedFilteredData);
      } else {
        // 🆕 APLICAR ORDENAÇÃO POR ID apenas se baseData não estiver ordenado
        if (baseData === allMyPets) {
          // allMyPets já deve estar ordenado do carregamento inicial
          setFilteredMyPets(baseData);
        } else {
          // searchResults podem não estar ordenados
          const sortedBaseData = sortPetsByCreation(baseData);
          setFilteredMyPets(sortedBaseData);
        }
      }
    } catch (error) {
      if (hasActiveSearch && searchQuery.trim() !== '') {
        // 🆕 Ordenar searchResults por ID apenas se necessário
        const sortedSearchResults = sortPetsByCreation(searchResults);
        setFilteredMyPets(sortedSearchResults);
      } else {
        // allMyPets já deve estar ordenado
        setFilteredMyPets(allMyPets);
      }
    }
  };

  // 🆕 ATUALIZADA: Carregar os meus pets usando getByUsuarioId COM ordenação por ID
  useEffect(() => {
    const fetchMyPets = async () => {
      if (!usuarioId) {
        setLoading(false);
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

        // 🆕 APLICAR ORDENAÇÃO POR ID APENAS UMA VEZ no carregamento inicial
        const sortedValidPets = sortPetsByCreation(validPets);
        setAllMyPets(sortedValidPets);

        if (!activeFilters && !hasActiveSearch) {
          setFilteredMyPets(sortedValidPets);
        }

        setLoading(false);
      } catch (err) {
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

  // 🆕 ATUALIZADA: Recarregar os dados COM ordenação por ID
  const refreshData = async () => {
    if (!usuarioId) {
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

      // 🆕 APLICAR ORDENAÇÃO POR ID APENAS UMA VEZ no refresh
      const sortedValidPets = sortPetsByCreation(validPets);
      setAllMyPets(sortedValidPets);
      setLoading(false);
    } catch (err) {
      setError('Não foi possível carregar seus pets. Tente novamente mais tarde.');
      setLoading(false);
    }
  };

  // Função principal para comunicação
  // 🆕 ATUALIZADA: Função principal para comunicação (permite dono acessar termo e WhatsApp)
  // 🆕 ATUALIZADA: Função principal para comunicação (corrigida para donos)
  const handleCommunicate = async (pet: Pet) => {
    try {
      if (!usuarioId || !usuario) {
        Alert.alert('Erro', 'Você precisa estar logado para se comunicar.');
        return;
      }

      const isOwner = pet.usuario_id === usuarioId;

      setSelectedPet(pet);
      setEmailWasSent(false);
      setTermoModalOrigin('obter');

      // 🎯 LÓGICA DIFERENCIADA PARA DONO VS ADOTANTE
      if (isOwner) {
        // ✅ PARA DONOS: Verificar apenas se tem termo, sem usar checkCanAdopt
        try {
          const temTermo = await checkPetHasTermo(pet.id);
          setHasExistingTermo(temTermo);
          setNameNeedsUpdate(false); // Dono não precisa atualizar nome

          if (temTermo) {
            // Se tem termo, vai direto para o estado "whatsapp-enabled"
            setIsNameUpdateMode(false);
            setModalState('whatsapp-enabled');
          } else {
            // Se não tem termo, pode criar um ou ir direto para WhatsApp
            setIsNameUpdateMode(false);
            setModalState('whatsapp-initial');
          }
        } catch (error) {
          // Em caso de erro na verificação, permitir acesso básico para o dono

          setHasExistingTermo(false);
          setNameNeedsUpdate(false);
          setIsNameUpdateMode(false);
          setModalState('whatsapp-initial');
        }
      } else {
        // ✅ PARA ADOTANTES: Usar a lógica original com checkCanAdopt
        try {
          const verificacao = await checkCanAdopt(pet.id);
          const { podeAdotar, temTermo, nomeDesatualizado } = verificacao.data;

          setHasExistingTermo(temTermo);
          setNameNeedsUpdate(nomeDesatualizado);

          if (nomeDesatualizado) {
            setIsNameUpdateMode(true);
            setTermoModalOrigin('update');
            setModalState('termo-creation');
          } else if (temTermo && podeAdotar) {
            setIsNameUpdateMode(false);
            setModalState('whatsapp-enabled');
          } else if (temTermo && !podeAdotar) {
            Alert.alert('Pet já em processo de adoção', 'Este pet já está em processo de adoção por outro usuário.', [
              { text: 'OK' },
            ]);
            return;
          } else {
            setIsNameUpdateMode(false);
            setModalState('whatsapp-initial');
          }
        } catch (error) {
          // Em caso de erro na verificação, permitir acesso básico

          setHasExistingTermo(false);
          setNameNeedsUpdate(false);
          setIsNameUpdateMode(false);
          setModalState('whatsapp-initial');
        }
      }
    } catch (error: any) {
      Alert.alert('Erro', 'Erro ao verificar status do pet. Tente novamente.');
    }
  };

  // Funções dos modais
  const handleObterTermo = () => {
    setTermoModalOrigin('obter');
    setIsNameUpdateMode(false);
    setModalState('termo-creation');
  };

  const handleStartAdoption = async () => {
    await handleStartWhatsApp();
  };

  const handleViewTermo = () => {
    setTermoModalOrigin('ver');
    setIsNameUpdateMode(false);
    setModalState('termo-creation');
  };

  const handleTermoModalClose = () => {
    if (termoModalOrigin === 'ver') {
      setModalState('whatsapp-enabled');
    } else if (termoModalOrigin === 'update') {
      if (emailWasSent) {
        setModalState('whatsapp-enabled');
      } else {
        setModalState('closed');
      }
    } else if (termoModalOrigin === 'obter') {
      if (emailWasSent) {
        setModalState('whatsapp-enabled');
      } else {
        setModalState('whatsapp-initial');
      }
    } else {
      if (emailWasSent) {
        setModalState('whatsapp-enabled');
      } else {
        setModalState('whatsapp-initial');
      }
    }
  };

  const handleTermoCreated = () => {
    const action = isNameUpdateMode ? 'atualizado' : 'criado';

    setHasExistingTermo(true);
    setNameNeedsUpdate(false);
  };

  const handleEmailSent = () => {
    const action = isNameUpdateMode ? 'atualizado' : 'criado';

    setHasExistingTermo(true);
    setEmailWasSent(true);
    setNameNeedsUpdate(false);
    setIsNameUpdateMode(false);
    setModalState('whatsapp-enabled');
  };

  // 🆕 ATUALIZADA: Iniciar WhatsApp SEM re-ordenação desnecessária
  // 🆕 ATUALIZADA: Iniciar WhatsApp COM transferência automática do pet (mantendo contato do doador original)
  // 🆕 ATUALIZADA: Iniciar WhatsApp COM transferência automática do pet (ordem correta)
  // 🆕 ATUALIZADA: Iniciar WhatsApp COM suporte para dono do pet
  const handleStartWhatsApp = async () => {
    if (!selectedPet || !usuario) return;

    try {
      const isOwner = selectedPet.usuario_id === usuarioId;

      // 🎯 LÓGICA DIFERENCIADA PARA DONO VS ADOTANTE
      if (isOwner) {
        // ✅ DONO DO PET: Lógica para compartilhar informações ou se comunicar com interessados
        setModalState('closed');
        setSelectedPet(null);

        const nomePet = selectedPet.nome;
        const telefoneDoUsuario = usuario.telefone;

        if (!telefoneDoUsuario) {
          Alert.alert(
            'Telefone não cadastrado',
            `Para facilitar o contato de interessados em ${nomePet}, adicione seu telefone no perfil.`,
            [
              {
                text: 'Ir para Perfil',
                onPress: () => router.push('/pages/ProfileScreen'),
              },
              { text: 'Agora Não' },
            ]
          );
          return;
        }

        // Opções para o dono do pet
        Alert.alert(`Opções para ${nomePet}`, 'Como dono deste pet, você pode:', [
          {
            text: 'Compartilhar Contato',
            onPress: () => {
              // Criar mensagem para compartilhar
              const mensagemCompartilhar = `🐾 Olá! Tenho um pet disponível para adoção:

*${nomePet}*
📍 Localização: ${usuario.cidade?.nome || 'Não informado'}
👤 Responsável: ${usuario.nome}
📞 Contato: ${telefoneDoUsuario}

Entre em contato comigo para mais informações sobre a adoção! ❤️`;

              // Usar share nativo ou abrir WhatsApp
              const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(mensagemCompartilhar)}`;

              Linking.canOpenURL(whatsappUrl)
                .then((canOpen) => {
                  if (canOpen) {
                    Linking.openURL(whatsappUrl);
                  } else {
                    Alert.alert('Mensagem para Compartilhar', mensagemCompartilhar, [{ text: 'OK' }]);
                  }
                })
                .catch(() => {
                  Alert.alert('Mensagem para Compartilhar', mensagemCompartilhar, [{ text: 'OK' }]);
                });
            },
          },
          {
            text: 'Ver Termo',
            onPress: () => {
              // Reabrir modal para ver termo
              setSelectedPet(selectedPet);
              setTermoModalOrigin('ver');
              setModalState('termo-creation');
            },
          },
          { text: 'Cancelar', style: 'cancel' },
        ]);
      } else {
        // ✅ ADOTANTE: Lógica original de adoção
        const doadorOriginal = {
          nome: selectedPet.usuario_nome || 'responsável',
          telefone: selectedPet.usuario_telefone,
          email: selectedPet.usuario_email,
        };

        const nomePet = selectedPet.nome;
        const nomeInteressado = usuario.nome;
        const telefone = doadorOriginal.telefone;

        if (!telefone) {
          setModalState('closed');
          setSelectedPet(null);

          Alert.alert(
            'Contato não disponível',
            `O telefone do doador de ${nomePet} não está disponível no momento.\n\n${
              doadorOriginal.email
                ? `Você pode tentar entrar em contato pelo email: ${doadorOriginal.email}`
                : 'Tente entrar em contato através do app posteriormente.'
            }`,
            [{ text: 'OK' }]
          );
          return;
        }

        const mensagem = `Olá ${doadorOriginal.nome}! 👋

Meu nome é ${nomeInteressado} e tenho interesse em adotar o pet *${nomePet}* que vi no app de adoção.

Gostaria de saber mais detalhes sobre:
• Processo de adoção
• Quando podemos nos conhecer
• Cuidados especiais do ${nomePet}

Agradeço desde já! 🐾❤️`;

        let numeroLimpo = telefone.replace(/\D/g, '');

        if (numeroLimpo.length === 11 && numeroLimpo.startsWith('0')) {
          numeroLimpo = numeroLimpo.substring(1);
        }
        if (numeroLimpo.length === 10 || numeroLimpo.length === 11) {
          numeroLimpo = '55' + numeroLimpo;
        }

        const whatsappUrl = `whatsapp://send?phone=${numeroLimpo}&text=${encodeURIComponent(mensagem)}`;

        const canOpen = await Linking.canOpenURL(whatsappUrl);

        if (canOpen) {
          try {
            // 🆕 SEQUÊNCIA CORRETA: Primeiro transferir, depois WhatsApp

            const transferResult = await transferPet({
              id: selectedPet.id,
              usuario_id: selectedPet.usuario_id, // Doador original
              adotante_id: usuarioId!, // Novo proprietário
            });

            // Atualizar pet localmente
            const dadosTransferencia = transferResult.pet || selectedPet;

            const updatedPet = {
              ...selectedPet,
              status_id: dadosTransferencia.status_id || 4,
              status_nome: 'Adotado',
              usuario_id: usuarioId!,
              cidade_id: usuario.cidade?.id || dadosTransferencia.cidade_id,
              estado_id: usuario.estado?.id || dadosTransferencia.estado_id,
              usuario_cidade_id: usuario.cidade?.id,
              usuario_estado_id: usuario.estado?.id,
              doador_original_nome: doadorOriginal.nome,
              doador_original_telefone: doadorOriginal.telefone,
              doador_original_email: doadorOriginal.email,
              usuario_nome: usuario.nome,
              usuario_foto: usuario.foto || null,
              usuario_telefone: doadorOriginal.telefone,
              usuario_email: doadorOriginal.email,
            };

            // Atualizar listas locais
            const updatedAllPets = allMyPets.map((pet) => (pet.id === selectedPet.id ? updatedPet : pet));
            const updatedFilteredPets = filteredMyPets.map((pet) => (pet.id === selectedPet.id ? updatedPet : pet));

            setAllMyPets(updatedAllPets);
            setFilteredMyPets(updatedFilteredPets);

            if (hasActiveSearch) {
              const updatedSearchResults = searchResults.map((pet) => (pet.id === selectedPet.id ? updatedPet : pet));
              setSearchResults(updatedSearchResults);
            }
          } catch (transferError: any) {
            let errorMessage = 'Erro desconhecido na transferência';

            if (transferError.message.includes('não está disponível para adoção')) {
              errorMessage = 'Este pet não está mais disponível para adoção.';
            } else if (transferError.message.includes('não é o doador')) {
              errorMessage = 'Erro de permissão: você não pode transferir este pet.';
            } else if (transferError.message.includes('Pet não encontrado')) {
              errorMessage = 'Pet não encontrado no sistema.';
            } else if (transferError.message.includes('Usuário adotante não encontrado')) {
              errorMessage = 'Erro no seu cadastro de usuário.';
            } else if (transferError.message.includes('conexão')) {
              errorMessage = 'Erro de conexão. Verifique sua internet.';
            } else {
              errorMessage = transferError.message || 'Erro na transferência do pet';
            }

            Alert.alert(
              'Erro na Adoção',
              `Não foi possível processar a adoção: ${errorMessage}\n\nTente novamente ou entre em contato com o suporte.`,
              [{ text: 'OK' }]
            );

            setModalState('closed');
            setSelectedPet(null);
            return;
          }

          setModalState('closed');
          setSelectedPet(null);

          await Linking.openURL(whatsappUrl);

          setTimeout(() => {
            Alert.alert(
              'Processo de Adoção Iniciado! 🎉',
              `Uma conversa foi iniciada com ${doadorOriginal.nome} (doador original) e ${nomePet} agora é oficialmente seu! O pet foi transferido para sua conta.`,
              [{ text: 'Perfeito!' }]
            );
          }, 1500);
        } else {
          setModalState('closed');
          setSelectedPet(null);

          Alert.alert('WhatsApp não disponível', `Entre em contato diretamente com ${doadorOriginal.nome} (doador):`, [
            {
              text: 'Ver número',
              onPress: () => {
                Alert.alert('Telefone do Doador', telefone, [{ text: 'OK' }]);
              },
            },
            { text: 'OK' },
          ]);
        }
      }
    } catch (error) {
      setModalState('closed');
      setSelectedPet(null);

      Alert.alert('Erro na comunicação', 'Não foi possível processar a operação automaticamente. Tente novamente.', [
        { text: 'OK' },
      ]);
    }
  };

  const handleCloseAllModals = () => {
    setModalState('closed');
    setSelectedPet(null);
    setHasExistingTermo(false);
    setEmailWasSent(false);
    setTermoModalOrigin('obter');
    setNameNeedsUpdate(false);
    setIsNameUpdateMode(false);
  };

  // Remover pet dos meus pets usando deleteMyPet
  // 🎯 VERSÃO SIMPLIFICADA: Usar informações já disponíveis do usuário
  // 🆕 CORRIGIDA: Função para remover pet COM remoção adequada do termo
  // Função corrigida para remover pet - SOMENTE remove da interface SE o backend confirmar sucesso
  // 🎯 FUNÇÃO AJUSTADA para trabalhar com sua API deleteMyPet específica
  // 🎯 FUNÇÃO CORRIGIDA: Sempre usar deleteMyPet (que corresponde ao backend corrigido)
  const handleRemovePet = async (pet: Pet) => {
    if (!usuarioId) {
      Alert.alert('Erro', 'Você precisa estar logado para remover pets.');
      return;
    }

    try {
      // Buscar informações do dono anterior/doador original
      let donoAnterior = {
        nome: pet.usuario_nome || 'Dono não identificado',
        telefone: pet.usuario_telefone || 'Não informado',
        cidade: 'Carregando...',
        estado: 'Carregando...',
      };

      try {
        const usuarioDetalhes = await getUsuarioByIdComCidadeEstado(pet.usuario_id);
        if (usuarioDetalhes) {
          donoAnterior.nome = usuarioDetalhes.nome || donoAnterior.nome;
          donoAnterior.cidade = usuarioDetalhes.cidade?.nome || 'Cidade não identificada';
          donoAnterior.estado = usuarioDetalhes.estado?.nome || 'Estado não identificado';

          if (donoAnterior.telefone === 'Não informado') {
            const usuarioCompleto = await getUsuarioById(pet.usuario_id);
            donoAnterior.telefone = usuarioCompleto?.telefone || 'Não informado';
          }
        } else {
          donoAnterior.cidade = 'Cidade não identificada';
          donoAnterior.estado = 'Estado não identificado';
        }
      } catch (fetchError) {
        donoAnterior.cidade = 'Cidade não identificada';
        donoAnterior.estado = 'Estado não identificado';
      }

      // Verificar se tem termo
      const temTermo = await checkPetHasTermo(pet.id);

      // ✅ NOVA LÓGICA: Determinar ação baseada no relacionamento do usuário com o pet
      const isAdotanteAtual = pet.usuario_id === usuarioId && pet.status_id === 4;
      const isDoadorOriginal = pet.doador_id === usuarioId;
      const isResponsavelAtual = pet.usuario_id === usuarioId;

      let alertTitle = '';
      let alertMessage = '';
      let acaoType: 'devolver' | 'remover' = 'remover';

      if (isAdotanteAtual) {
        acaoType = 'devolver';
        alertTitle = 'Confirmar Devolução';
        alertMessage = `Deseja realmente devolver ${pet.nome} ao doador original?\n\nDoador original: ${
          donoAnterior.nome
        }\nLocalização: ${donoAnterior.cidade}, ${donoAnterior.estado}\nContato: ${
          donoAnterior.telefone
        }\n\n🔄 DEVOLUÇÃO: O pet voltará para o doador original e ficará disponível para adoção novamente.${
          temTermo ? '\n\nATENÇÃO: O termo de compromisso será removido junto com a devolução.' : ''
        }`;
      } else {
        acaoType = 'remover';
        alertTitle = 'Confirmar Remoção';
        alertMessage = `Deseja realmente remover ${pet.nome} dos seus pets?\n\n📍 Informações: ${
          donoAnterior.nome
        }\nLocalização: ${donoAnterior.cidade}, ${donoAnterior.estado}\n📞 Contato: ${
          donoAnterior.telefone
        }\n\nREMOÇÃO: O pet será removido da sua lista de interesses.${
          temTermo
            ? '\n\nATENÇÃO: Este pet possui um termo de compromisso que também será deletado permanentemente.'
            : ''
        }`;
      }

      Alert.alert(alertTitle, alertMessage, [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: acaoType === 'devolver' ? 'Devolver' : 'Remover',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);

            try {
              // Variáveis de controle
              let termoRemovidoComSucesso = false;
              let petOperacaoSucesso = false;

              // ETAPA 1: Remover termo (se existir)
              if (temTermo) {
                try {
                  const termoResult = await deleteTermoByPet(pet.id);

                  termoRemovidoComSucesso = true;
                } catch (termoError: any) {
                  if (termoError.message?.includes('permissão') || termoError.message?.includes('autorizado')) {
                    Alert.alert(
                      'Erro de Permissão',
                      'Você não tem permissão para deletar o termo de compromisso deste pet. Somente o criador do termo pode removê-lo.',
                      [{ text: 'OK' }]
                    );
                    setLoading(false);
                    return;
                  }

                  const continuarSemTermo = await new Promise<boolean>((resolve) => {
                    Alert.alert(
                      'Erro ao Deletar Termo',
                      `Houve um erro ao deletar o termo de compromisso: ${termoError.message}\n\nDeseja continuar e ${
                        acaoType === 'devolver' ? 'devolver' : 'remover'
                      } apenas o pet?`,
                      [
                        { text: 'Cancelar', onPress: () => resolve(false) },
                        { text: 'Continuar', onPress: () => resolve(true) },
                      ]
                    );
                  });

                  if (!continuarSemTermo) {
                    setLoading(false);
                    return;
                  }
                }
              } else {
                termoRemovidoComSucesso = true; // Não havia termo
              }

              // ✅ ETAPA 2: SEMPRE usar deleteMyPet (backend corrigido decide a ação)

              try {
                const deleteResult = await deleteMyPet(pet.id, usuarioId);

                // ✅ VERIFICAÇÃO ROBUSTA para deleteMyPet
                if (deleteResult !== null && deleteResult !== undefined) {
                  // Verificar se há indicação de erro na resposta
                  if (deleteResult.success === false) {
                    throw new Error(deleteResult.message || 'API retornou success = false');
                  }

                  if (deleteResult.error) {
                    throw new Error(deleteResult.error);
                  }

                  // Verificar se tem informação sobre a ação realizada
                  const acaoRealizada = deleteResult.acao || 'acao_desconhecida';

                  petOperacaoSucesso = true;
                } else {
                  throw new Error('API deleteMyPet retornou null/undefined');
                }
              } catch (deleteError: any) {
                throw deleteError; // Propagar para tratamento específico
              }

              // ✅ SÓ ATUALIZAR INTERFACE SE OPERAÇÃO FOI BEM-SUCEDIDA
              if (petOperacaoSucesso) {
                setAllMyPets((prevPets) => {
                  const novosMyPets = prevPets.filter((p) => p.id !== pet.id);

                  return novosMyPets;
                });

                setFilteredMyPets((prevPets) => {
                  const novosFilteredPets = prevPets.filter((p) => p.id !== pet.id);

                  return novosFilteredPets;
                });

                if (hasActiveSearch) {
                  setSearchResults((prevResults) => {
                    const novosSearchResults = prevResults.filter((p) => p.id !== pet.id);

                    return novosSearchResults;
                  });
                }

                // ✅ FEEDBACK DE SUCESSO BASEADO NO QUE FOI SOLICITADO
                if (acaoType === 'devolver') {
                  const mensagemSucesso = `🔄 ${pet.nome} foi devolvido com sucesso!

📋 Detalhes da operação:
👤 Doador original: ${donoAnterior.nome}
🏠 Pet retornou ao doador original
📍 Localização: ${donoAnterior.cidade}, ${donoAnterior.estado}
📞 Contato: ${donoAnterior.telefone}
📅 Data: ${new Date().toLocaleDateString()}

${termoRemovidoComSucesso ? 'Termo de compromisso foi removido.' : ''}
✅ O pet agora está disponível para adoção novamente!`;

                  Alert.alert('Operação Concluída', mensagemSucesso, [
                    {
                      text: 'Ver Contato do Doador',
                      onPress: () => {
                        Alert.alert(
                          'Contato do Doador Original',
                          `Nome: ${donoAnterior.nome}\nTelefone: ${donoAnterior.telefone}\nLocalização: ${donoAnterior.cidade}, ${donoAnterior.estado}`,
                          [{ text: 'OK' }]
                        );
                      },
                    },
                    { text: 'OK', style: 'default' },
                  ]);
                } else {
                  const mensagemSucesso = `🗑️ ${pet.nome} foi removido com sucesso!

📋 Informações do responsável:
📍 ${donoAnterior.nome}
🏙️ ${donoAnterior.cidade}, ${donoAnterior.estado}
📞 ${donoAnterior.telefone}

${termoRemovidoComSucesso ? '🗑️ Termo de compromisso também foi deletado.' : ''}`;

                  Alert.alert('Pet Removido', mensagemSucesso, [
                    {
                      text: 'Ver Contato',
                      onPress: () => {
                        Alert.alert(
                          'Contato do Responsável',
                          `Nome: ${donoAnterior.nome}\nTelefone: ${donoAnterior.telefone}\nLocalização: ${donoAnterior.cidade}, ${donoAnterior.estado}`,
                          [{ text: 'OK' }]
                        );
                      },
                    },
                    { text: 'OK', style: 'default' },
                  ]);
                }
              } else {
                throw new Error('Operação não foi confirmada como bem-sucedida');
              }
            } catch (error: any) {
              // 🚨 NÃO ATUALIZAR INTERFACE - MANTER PET NA LISTA
              let errorMessage = 'Erro desconhecido na operação';

              // Tratar erros específicos
              if (error.response?.status === 404) {
                errorMessage = 'Pet ou associação não encontrada no servidor.';
              } else if (error.response?.status === 403) {
                errorMessage = 'Você não tem permissão para esta operação.';
              } else if (error.response?.status === 400) {
                errorMessage = error.response?.data?.message || 'Dados inválidos para a operação.';
              } else if (error.message?.includes('não é o responsável atual')) {
                errorMessage = 'Você não é o responsável atual deste pet.';
              } else if (error.message?.includes('conexão') || error.code === 'NETWORK_ERROR') {
                errorMessage = 'Erro de conexão. Verifique sua internet.';
              } else {
                errorMessage = error.message || 'Erro na operação do pet';
              }

              const operacaoNome = acaoType === 'devolver' ? 'Devolução' : 'Remoção';

              Alert.alert(
                `Erro na ${operacaoNome}`,
                `Não foi possível ${acaoType === 'devolver' ? 'devolver' : 'remover'} ${
                  pet.nome
                } no servidor.\n\n${errorMessage}\n\nO pet permanece na sua lista.\n\nTente novamente ou entre em contato com o suporte.`,
                [{ text: 'OK' }]
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert(
        'Erro na Verificação',
        `Não foi possível verificar informações do pet.\n\n📍 Responsável: ${
          pet.usuario_nome || 'Não identificado'
        }\n\nTente novamente mais tarde.`,
        [{ text: 'OK' }]
      );
    }
  };
  // 🆕 ATUALIZADA: Função para favoritar/desfavoritar um pet SEM re-ordenação desnecessária
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

      // 🆕 ATUALIZADA: Atualização simples sem re-ordenação por ID (allMyPets já está ordenado)
      const updatedAllPets = allMyPets.map((p: Pet) => (p.id === petId ? { ...p, favorito: !p.favorito } : p));
      setAllMyPets(updatedAllPets); // Mantém ordem existente

      if (hasActiveSearch) {
        // 🆕 ATUALIZADA: Atualização simples para searchResults também
        const updatedSearchResults = searchResults.map((p: Pet) =>
          p.id === petId ? { ...p, favorito: !p.favorito } : p
        );
        setSearchResults(updatedSearchResults); // Mantém ordem existente
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar os favoritos. Tente novamente.');
    }
  };

  // Função para limpar filtros ativos
  const clearFilters = async () => {
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

  if (authLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={{ color: '#FFFFFF', marginTop: 20 }}>Verificando autenticação...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

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
                  : 'Você ainda não possui pets ainda nessa tela. Visite a seção de pets disponíveis para adicionar alguns aos seus pets!'}
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

        {/* Modais */}
        {selectedPet && (modalState === 'whatsapp-initial' || modalState === 'whatsapp-enabled') && (
          <AdoptionModal
            visible={true}
            onClose={handleCloseAllModals}
            onStartAdoption={modalState === 'whatsapp-enabled' ? handleStartAdoption : handleObterTermo}
            onViewTermo={handleViewTermo}
            pet={
              {
                nome: selectedPet.nome,
                usuario_nome: selectedPet.usuario_nome,
                foto: selectedPet.foto,
                isInitialState: modalState === 'whatsapp-initial',
                hasExistingTermo: hasExistingTermo,
                // ✅ NOVO: Indicar se é o dono do pet
                isOwner: selectedPet.usuario_id === usuarioId,
              } as any
            }
          />
        )}

        {selectedPet && usuario && modalState === 'termo-creation' && (
          <TermoAdocaoModal
            visible={true}
            onClose={handleTermoModalClose}
            pet={selectedPet}
            usuarioLogado={{
              id: usuario.id,
              nome: usuario.nome,
              email: usuario.email || '',
              telefone: usuario.telefone,
            }}
            hasExistingTermo={hasExistingTermo}
            onSuccess={handleTermoCreated}
            onEmailSent={handleEmailSent}
            isNameUpdateMode={isNameUpdateMode}
            nameNeedsUpdate={nameNeedsUpdate}
            // ✅ NOVO: Indicar se é o dono do pet
            isOwner={selectedPet.usuario_id === usuarioId}
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
  petCardWrapper: {
    paddingHorizontal: 15,
    width: '100%',
    marginBottom: 5,
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
    paddingTop: 35,
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
