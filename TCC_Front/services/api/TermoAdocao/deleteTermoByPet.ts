import api from '../api';

export interface DeleteTermoResponse {
  success: string;
  message: string;
  data: {
    termoId: string | number;
    petId?: string | number;
    petNome?: string;
    deletadoPor: 'doador' | 'adotante';
    dataDelecao?: string;
  };
}

export const deleteTermoByPet = async (petId: number): Promise<DeleteTermoResponse | null> => {
  try {
    const response = await api.delete(`/termos-compromisso/pet/${petId}`);

    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null; // Pet não tem termo - não é erro
    } else if (error.response?.status === 403) {
      throw new Error('Você não tem permissão para deletar este termo');
    } else if (error.response?.status === 401) {
      throw new Error('Você precisa estar logado para deletar o termo');
    }

    throw error;
  }
};

export default deleteTermoByPet;
