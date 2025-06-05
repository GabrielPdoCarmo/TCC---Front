// MyPetsScreen.tsx - Atualizado com verificação de nome para termos de compromisso

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
import { checkCanAdopt } from '@/services/api/TermoAdocao/checkCanAdopt'; // 🆕 Importações atualizadas
import updateStatus from '@/services/api/Status/updateStatus';
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

// 🆕 Estados dos modais seguindo sequência iOS ATUALIZADA
type ModalState = 'closed' | 'whatsapp-initial' | 'termo-creation' | 'whatsapp-enabled' | 'name-update-needed';

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

  // 🆕 Estados para controlar sequência de modais iOS ATUALIZADOS
  const [modalState, setModalState] = useState<ModalState>('closed');
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [hasExistingTermo, setHasExistingTermo] = useState<boolean>(false);
  const [emailWasSent, setEmailWasSent] = useState<boolean>(false);
  const [termoModalOrigin, setTermoModalOrigin] = useState<'obter' | 'ver' | 'update'>('obter');

  // 🆕 NOVOS ESTADOS para verificação de nome
  const [nameNeedsUpdate, setNameNeedsUpdate] = useState<boolean>(false);
  const [isNameUpdateMode, setIsNameUpdateMode] = useState<boolean>(false);
  const { user, logout, isAuthenticated, loading: authLoading, setLastRoute } = useAuth();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      console.log('💾 Salvando MyPetsScreen como última rota');
      setLastRoute('/pages/MyPetsScreen');
    }
  }, [authLoading, isAuthenticated, setLastRoute]);

  // ✅ Verificar autenticação
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      console.log('🚫 Usuário não autenticado na MyPetsScreen, redirecionando...');
      router.replace('/pages/LoginScreen');
    }
  }, [isAuthenticated, authLoading]);
  // 🔧 FUNÇÃO CORRIGIDA: Botão voltar com debug
  const handleGoBack = () => {
    console.log('🔄 Botão voltar clicado - navegando para PetAdoptionScreen');
    router.push('/pages/PetAdoptionScreen');
  };

  // 🔧 FUNÇÃO CORRIGIDA: Filtro avançado com debug
  const handleAdvancedFilter = () => {
    console.log('🔍 Botão filtro avançado clicado');

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

  // 🆕 FUNÇÃO PRINCIPAL ATUALIZADA: handleCommunicate - COM VERIFICAÇÃO DE NOME
  const handleCommunicate = async (pet: Pet) => {
    try {
      console.log('📱 Iniciando comunicação para o pet:', pet.nome);

      if (!usuarioId || !usuario) {
        Alert.alert('Erro', 'Você precisa estar logado para se comunicar.');
        return;
      }

      if (pet.usuario_id === usuarioId) {
        Alert.alert(
          'Informação',
          'Este é seu próprio pet. Você pode ver as informações dele, mas não precisa de termo de adoção.'
        );
        return;
      }

      // 🎯 NOVA LÓGICA: Verificar se pode adotar com verificação de nome
      setSelectedPet(pet);
      setEmailWasSent(false);
      setTermoModalOrigin('obter');

      console.log('🔍 Verificando se pode adotar pet com verificação de nome...');

      try {
        const verificacao = await checkCanAdopt(pet.id);

        const { podeAdotar, temTermo, nomeDesatualizado } = verificacao.data;

        console.log('📋 Resultado da verificação:', {
          podeAdotar,
          temTermo,
          nomeDesatualizado,
        });

        setHasExistingTermo(temTermo);
        setNameNeedsUpdate(nomeDesatualizado);

        if (nomeDesatualizado) {
          console.log('⚠️ Nome foi alterado, mostrando modal para atualização...');
          setIsNameUpdateMode(true);
          setTermoModalOrigin('update');
          setModalState('termo-creation'); // Ir direto para criação/atualização
        } else if (temTermo && podeAdotar) {
          console.log('✅ Tem termo válido, pode usar WhatsApp');
          setIsNameUpdateMode(false);
          setModalState('whatsapp-enabled');
        } else if (temTermo && !podeAdotar) {
          console.log('🚫 Pet já tem termo de outro usuário');
          Alert.alert('Pet já em processo de adoção', 'Este pet já está em processo de adoção por outro usuário.', [
            { text: 'OK' },
          ]);
          return;
        } else {
          console.log('📝 Não tem termo, mostrar modal inicial');
          setIsNameUpdateMode(false);
          setModalState('whatsapp-initial');
        }
      } catch (error) {
        console.error('❌ Erro ao verificar se pode adotar:', error);
        // Em caso de erro, assumir que não tem termo
        setHasExistingTermo(false);
        setNameNeedsUpdate(false);
        setIsNameUpdateMode(false);
        setModalState('whatsapp-initial');
      }
    } catch (error: any) {
      console.error('Erro ao iniciar comunicação:', error);
      Alert.alert('Erro', 'Erro ao verificar status do pet. Tente novamente.');
    }
  };

  // 🆕 FUNÇÃO: Obter Termo (vai do primeiro modal para o modal de criação)
  const handleObterTermo = () => {
    console.log('📋 Clicou em Obter Termo, abrindo modal de criação');
    setTermoModalOrigin('obter');
    setIsNameUpdateMode(false);
    setModalState('termo-creation');
  };

  // 🆕 FUNÇÃO: Iniciar processo de adoção (para modal habilitado)
  const handleStartAdoption = async () => {
    await handleStartWhatsApp();
  };

  // 🆕 FUNÇÃO: Ver termo (para modal habilitado)
  const handleViewTermo = () => {
    console.log('👁️ Clicou em Ver Termo, abrindo modal de visualização');
    setTermoModalOrigin('ver');
    setIsNameUpdateMode(false);
    setModalState('termo-creation');
  };

  // 🔧 FUNÇÃO CORRIGIDA: Fechar modal do termo com lógica baseada na origem ATUALIZADA
  const handleTermoModalClose = () => {
    console.log('🔙 Fechando modal do termo, verificando origem...');

    if (termoModalOrigin === 'ver') {
      console.log('✅ Veio de "Ver Termo", voltando para WhatsApp habilitado');
      setModalState('whatsapp-enabled');
    } else if (termoModalOrigin === 'update') {
      // 🆕 LÓGICA PARA ATUALIZAÇÃO DE NOME
      if (emailWasSent) {
        console.log('✅ Atualização de nome concluída e email enviado, habilitando WhatsApp');
        setModalState('whatsapp-enabled');
      } else {
        console.log('⚠️ Atualização de nome não concluída, fechando tudo');
        setModalState('closed');
      }
    } else if (termoModalOrigin === 'obter') {
      if (emailWasSent) {
        console.log('✅ Veio de "Obter Termo" e email foi enviado, habilitando WhatsApp');
        setModalState('whatsapp-enabled');
      } else {
        console.log('⚠️ Veio de "Obter Termo" mas email NÃO foi enviado, voltando para WhatsApp inicial');
        setModalState('whatsapp-initial');
      }
    } else {
      console.log('⚠️ Origem não definida, usando lógica do email');
      if (emailWasSent) {
        setModalState('whatsapp-enabled');
      } else {
        setModalState('whatsapp-initial');
      }
    }
  };

  // 🆕 FUNÇÃO: Termo foi criado/atualizado com sucesso
  const handleTermoCreated = () => {
    const action = isNameUpdateMode ? 'atualizado' : 'criado';
    console.log(`✅ Termo ${action} com sucesso, mantendo no modal para enviar email`);
    setHasExistingTermo(true);
    setNameNeedsUpdate(false); // 🆕 Reset flag de nome desatualizado
  };

  // 🔧 FUNÇÃO CORRIGIDA: Email enviado com sucesso
  const handleEmailSent = () => {
    const action = isNameUpdateMode ? 'atualizado' : 'criado';
    console.log(`📧 Email do termo ${action} enviado com sucesso, habilitando WhatsApp`);
    setHasExistingTermo(true);
    setEmailWasSent(true);
    setNameNeedsUpdate(false); // 🆕 Reset flag
    setIsNameUpdateMode(false); // 🆕 Reset modo
    setModalState('whatsapp-enabled');
  };

  // 🆕 FUNÇÃO: Iniciar WhatsApp (atualiza status e abre WhatsApp)
  const handleStartWhatsApp = async () => {
    if (!selectedPet || !usuario) return;

    try {
      console.log('🎯 Iniciando WhatsApp para:', selectedPet.nome);

      const donoPet = selectedPet.usuario_nome || 'responsável';
      const nomePet = selectedPet.nome;
      const nomeInteressado = usuario.nome;
      const telefone = selectedPet.usuario_telefone;

      if (!telefone) {
        setModalState('closed');
        setSelectedPet(null);

        Alert.alert(
          'Contato não disponível',
          `O telefone do responsável por ${nomePet} não está disponível no momento.\n\n${
            selectedPet.usuario_email
              ? `Você pode tentar entrar em contato pelo email: ${selectedPet.usuario_email}`
              : 'Tente entrar em contato através do app posteriormente.'
          }`,
          [{ text: 'OK' }]
        );
        return;
      }

      const mensagem = `Olá ${donoPet}! 👋

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

      console.log('📱 Tentando abrir WhatsApp para:', numeroLimpo);

      const canOpen = await Linking.canOpenURL(whatsappUrl);

      if (canOpen) {
        // 🆕 ATUALIZAR STATUS DO PET PARA "ADOTADO" (status_id: 4)
        try {
          console.log('🔄 Atualizando status do pet para "Adotado"...');
          await updateStatus(selectedPet.id);

          // Atualizar estados locais
          const updatedPet = {
            ...selectedPet,
            status_id: 4,
            status_nome: 'Adotado',
          };

          setAllMyPets((prevPets) => prevPets.map((pet) => (pet.id === selectedPet.id ? updatedPet : pet)));
          setFilteredMyPets((prevPets) => prevPets.map((pet) => (pet.id === selectedPet.id ? updatedPet : pet)));

          if (hasActiveSearch) {
            setSearchResults((prevResults) => prevResults.map((pet) => (pet.id === selectedPet.id ? updatedPet : pet)));
          }

          console.log('✅ Status do pet atualizado com sucesso para "Adotado"');
        } catch (statusError) {
          console.error('❌ Erro ao atualizar status do pet:', statusError);
        }

        // Fechar modal
        setModalState('closed');
        setSelectedPet(null);

        // Abrir WhatsApp
        await Linking.openURL(whatsappUrl);

        // Mostrar confirmação
        setTimeout(() => {
          Alert.alert(
            'Processo de Adoção Iniciado! 🎉',
            `Uma conversa foi iniciada com ${donoPet} e o status do ${nomePet} foi atualizado para "Adotado". Complete a conversa para finalizar o processo de adoção.`,
            [{ text: 'Perfeito!' }]
          );
        }, 1500);
      } else {
        setModalState('closed');
        setSelectedPet(null);

        Alert.alert('WhatsApp não disponível', `Entre em contato diretamente com ${donoPet}:`, [
          {
            text: 'Ver número',
            onPress: () => {
              Alert.alert('Telefone', telefone, [{ text: 'OK' }]);
            },
          },
          { text: 'OK' },
        ]);
      }
    } catch (error) {
      console.error('Erro ao abrir WhatsApp:', error);
      setModalState('closed');
      setSelectedPet(null);

      Alert.alert(
        'Erro na comunicação',
        'Não foi possível abrir o WhatsApp automaticamente. Tente entrar em contato diretamente com o responsável pelo pet.',
        [{ text: 'OK' }]
      );
    }
  };

  // 🆕 FUNÇÃO: Fechar todos os modais
  const handleCloseAllModals = () => {
    console.log('🔒 Fechando todos os modais');
    setModalState('closed');
    setSelectedPet(null);
    setHasExistingTermo(false);
    setEmailWasSent(false);
    setTermoModalOrigin('obter');

    // 🆕 Reset estados de nome
    setNameNeedsUpdate(false);
    setIsNameUpdateMode(false);
  };

  // Remover pet dos meus pets usando deleteMyPet
  const handleRemovePet = async (pet: Pet) => {
    if (!usuarioId) {
      Alert.alert('Erro', 'Você precisa estar logado para remover pets.');
      return;
    }

    try {
      // 🔍 Primeiro, verificar se o pet tem termo de compromisso
      console.log(`🔍 Verificando se pet ${pet.nome} (ID: ${pet.id}) possui termo...`);

      const temTermo = await checkPetHasTermo(pet.id);

      console.log(`📋 Pet ${pet.nome} ${temTermo ? 'POSSUI' : 'NÃO POSSUI'} termo de compromisso`);

      // 🚨 Alerta personalizado baseado na existência do termo
      const alertTitle = 'Confirmar Remoção';
      const alertMessage = temTermo
        ? `Deseja realmente remover ${pet.nome} dos seus pets?\n\n⚠️ ATENÇÃO: Este pet possui um termo de compromisso que também será deletado permanentemente.`
        : `Deseja realmente remover ${pet.nome} dos seus pets?`;

      Alert.alert(alertTitle, alertMessage, [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log(`🗑️ Iniciando remoção do pet ${pet.nome} (ID: ${pet.id})`);

              // 🔄 ETAPA 1: Se tem termo, deletar termo primeiro
              if (temTermo) {
                try {
                  console.log(`📋 Deletando termo de compromisso do pet ${pet.nome}...`);

                  const termoResult = await deleteTermoByPet(pet.id);

                  if (termoResult) {
                    console.log(`✅ Termo deletado: ${JSON.stringify(termoResult.data)}`);
                  } else {
                    console.log('ℹ️ Pet não possuía termo (verificação adicional)');
                  }
                } catch (termoError: any) {
                  console.error('❌ Erro ao deletar termo:', termoError);

                  // Se erro for de permissão, parar processo
                  if (termoError.message.includes('permissão')) {
                    Alert.alert(
                      'Erro de Permissão',
                      'Você não tem permissão para deletar o termo de compromisso deste pet.',
                      [{ text: 'OK' }]
                    );
                    return;
                  }

                  // Para outros erros do termo, perguntar se quer continuar
                  const continuarSemTermo = await new Promise<boolean>((resolve) => {
                    Alert.alert(
                      'Erro ao Deletar Termo',
                      `Houve um erro ao deletar o termo de compromisso: ${termoError.message}\n\nDeseja continuar e remover apenas o pet?`,
                      [
                        { text: 'Cancelar', onPress: () => resolve(false) },
                        { text: 'Continuar', onPress: () => resolve(true) },
                      ]
                    );
                  });

                  if (!continuarSemTermo) {
                    return;
                  }
                }
              }

              // 🔄 ETAPA 2: Deletar o pet
              console.log(`🐾 Deletando pet ${pet.nome} dos meus pets...`);

              await deleteMyPet(pet.id, usuarioId);

              // 🔄 ETAPA 3: Atualizar estados locais
              setAllMyPets((prevPets) => prevPets.filter((p) => p.id !== pet.id));
              setFilteredMyPets((prevPets) => prevPets.filter((p) => p.id !== pet.id));

              if (hasActiveSearch) {
                setSearchResults((prevResults) => prevResults.filter((p) => p.id !== pet.id));
              }

              // ✅ Sucesso com mensagem personalizada
              const successMessage = temTermo
                ? `${pet.nome} e seu termo de compromisso foram removidos com sucesso.`
                : `${pet.nome} foi removido dos seus pets.`;

              Alert.alert('Sucesso', successMessage);

              console.log(`✅ Remoção completa do pet ${pet.nome}`);
            } catch (error: any) {
              console.error('❌ Erro na remoção do pet:', error);

              Alert.alert(
                'Erro',
                `Não foi possível remover o pet ${pet.nome}. Tente novamente.\n\nDetalhes: ${
                  error.message || 'Erro desconhecido'
                }`
              );
            }
          },
        },
      ]);
    } catch (error: any) {
      console.error('❌ Erro ao verificar termo do pet:', error);

      // Em caso de erro na verificação, perguntar se quer continuar mesmo assim
      Alert.alert(
        'Erro na Verificação',
        `Não foi possível verificar se o pet possui termo de compromisso.\n\nDeseja continuar com a remoção?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Continuar',
            onPress: async () => {
              // Fallback: tentar remover apenas o pet
              try {
                await deleteMyPet(pet.id, usuarioId);

                setAllMyPets((prevPets) => prevPets.filter((p) => p.id !== pet.id));
                setFilteredMyPets((prevPets) => prevPets.filter((p) => p.id !== pet.id));

                if (hasActiveSearch) {
                  setSearchResults((prevResults) => prevResults.filter((p) => p.id !== pet.id));
                }

                Alert.alert('Sucesso', `${pet.nome} foi removido dos seus pets.`);
              } catch (removeError) {
                console.error('❌ Erro no fallback de remoção:', removeError);
                Alert.alert('Erro', 'Não foi possível remover o pet. Tente novamente.');
              }
            },
          },
        ]
      );
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

        {/* 🆕 MODAIS SEGUINDO SEQUÊNCIA iOS ATUALIZADOS */}

        {/* Modal de Adoção/WhatsApp (para ambos os estados: inicial e habilitado) */}
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
                // 🆕 Propriedades para controlar o comportamento do modal
                isInitialState: modalState === 'whatsapp-initial',
                hasExistingTermo: hasExistingTermo,
              } as any
            }
          />
        )}

        {/* 🆕 MODAL DO TERMO ATUALIZADO (aparece quando clica em Obter/Ver/Atualizar Termo) */}
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
            // 🆕 NOVAS PROPS para indicar modo de atualização de nome
            isNameUpdateMode={isNameUpdateMode}
            nameNeedsUpdate={nameNeedsUpdate}
          />
        )}
      </ImageBackground>
    </SafeAreaView>
  );
}

// Estilos permanecem os mesmos...
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
