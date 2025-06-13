// 🔧 SERVIÇO CORRIGIDO: getMyPetsByName com tipos TypeScript corretos
import api from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 🆕 INTERFACE: Definir tipo de retorno
interface Pet {
  id: number;
  nome: string;
  raca_id: number;
  idade: string;
  usuario_id: number;
  foto?: string;
  faixa_etaria_id: number;
  status_id: number;
  sexo_id?: number;
  especie_id?: number;
  // ... outros campos conforme necessário
}

export const getMyPetsByName = async (nome: string): Promise<Pet[]> => {
  try {
    // Obter usuario_id do AsyncStorage
    let usuarioId: number | null = null;

    try {
      const userIdFromStorage = await AsyncStorage.getItem('@App:userId');
      if (userIdFromStorage) {
        usuarioId = parseInt(userIdFromStorage, 10);
      } else {
        const userData = await AsyncStorage.getItem('@App:userData');
        if (userData) {
          const user = JSON.parse(userData);
          usuarioId = user.id;
        }
      }
    } catch (storageError) {
      throw new Error('Usuário não encontrado. Faça login novamente.');
    }

    if (!usuarioId) {
      throw new Error('Usuário não encontrado. Faça login novamente.');
    }

    // Requisição GET simples com query params
    const response = await api.get(`/pets/meus-pets/nome/${nome}?usuario_id=${usuarioId}`);

    // 🔧 CORREÇÃO: Garantir que sempre retorne um array de Pet[]
    if (Array.isArray(response.data)) {
      return response.data as Pet[];
    } else if (response.data && typeof response.data === 'object' && response.data.id) {
      // Se retornou um único pet, transformar em array
      return [response.data as Pet];
    } else {
      // Se não há dados válidos, retornar array vazio
      return [];
    }
  } catch (error: any) {
    // Tratamento de erro melhorado
    if (error.response?.status === 404) {
      // Se for 404, retornar array vazio (sem pets encontrados)
      return [];
    } else if (error.response) {
      // Outros erros da API
      throw new Error(error.response.data?.error || 'Erro ao buscar pets');
    } else if (error.request) {
      // Erro de rede
      throw new Error('Erro de conexão. Verifique sua internet.');
    } else {
      // Outros erros
      throw error;
    }
  }
};

export default getMyPetsByName;
