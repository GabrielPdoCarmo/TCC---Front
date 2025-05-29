import api from '../api';

export interface CreateTermoData {
  petId: number;
  assinaturaDigital: string;
  observacoes?: string;
}

export const createTermo = async (data: CreateTermoData) => {
  try {
    const response = await api.post('/termos-compromisso', data);
    return response.data;
  } catch (error) {
    console.error('Erro ao criar termo de compromisso', error);
    throw error;
  }
};

export default createTermo;
