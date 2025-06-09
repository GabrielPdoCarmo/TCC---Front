// services/api/TermoDoacao/getTermoDoacao.ts

import api from '../api';

interface GetTermoDoacaoResponse {
  message: string;
  data: {
    id: number;
    doador_nome: string;
    doador_email: string;
    doador_telefone?: string;
    doador_cpf?: string;
    motivo_doacao: string;
    condicoes_adocao?: string;
    observacoes?: string;
    assinatura_digital: string;
    data_assinatura: string;
    hash_documento: string;
    data_envio_pdf?: string;
    estado?: {
      id: number;
      nome: string;
    };
    cidade?: {
      id: number;
      nome: string;
    };
    doador?: {
      id: number;
      nome: string;
      email: string;
      telefone?: string;
    };
  };
  canCreatePets: boolean;
}

/**
 * 📄 Buscar termo de responsabilidade de doação do usuário logado
 * @returns Promise com dados do termo do usuário
 */
export const getTermoDoacao = async (): Promise<GetTermoDoacaoResponse> => {
  try {
    const response = await api.get<GetTermoDoacaoResponse>('/termos-doacao/meu-termo');

    return response.data;
  } catch (error: any) {
    // Tratamento de erros específicos
    if (error.response?.status === 401) {
      throw new Error('Sessão expirada. Faça login novamente.');
    }

    if (error.response?.status === 404) {
      const message = error.response.data?.message || '';
      if (message.includes('não possui um termo')) {
        throw new Error('Você ainda não possui um termo de responsabilidade de doação.');
      }
      throw new Error('Termo não encontrado.');
    }

    if (error.response?.status === 500) {
      throw new Error('Erro no servidor ao buscar termo. Tente novamente.');
    }

    // Erro de rede
    if (!error.response) {
      throw new Error('Erro de conexão. Verifique sua internet e tente novamente.');
    }

    // Erro genérico
    throw new Error('Erro ao buscar termo de doação. Tente novamente.');
  }
};

/**
 * 📄 Buscar termo de doação por ID específico
 * @param termoId - ID do termo a ser buscado
 * @returns Promise com dados do termo
 */
export const getTermoDoacaoById = async (termoId: number): Promise<GetTermoDoacaoResponse> => {
  try {
    const response = await api.get<GetTermoDoacaoResponse>(`/termos-doacao/${termoId}`);

    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error('Sessão expirada. Faça login novamente.');
    }

    if (error.response?.status === 404) {
      throw new Error('Termo não encontrado.');
    }

    if (error.response?.status === 403) {
      throw new Error('Você não tem permissão para acessar este termo.');
    }

    if (error.response?.status === 500) {
      throw new Error('Erro no servidor ao buscar termo. Tente novamente.');
    }

    if (!error.response) {
      throw new Error('Erro de conexão. Verifique sua internet e tente novamente.');
    }

    throw new Error('Erro ao buscar termo de doação. Tente novamente.');
  }
};

/**
 * 📚 Buscar histórico de termos do usuário
 * @returns Promise com lista de termos do usuário
 */
export const getHistoricoTermos = async (): Promise<{
  message: string;
  data: GetTermoDoacaoResponse['data'][];
  total: number;
}> => {
  try {
    const response = await api.get<{
      message: string;
      data: GetTermoDoacaoResponse['data'][];
      total: number;
    }>('/termos-doacao/meu-historico');

    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error('Sessão expirada. Faça login novamente.');
    }

    if (error.response?.status === 500) {
      throw new Error('Erro no servidor ao buscar histórico. Tente novamente.');
    }

    if (!error.response) {
      throw new Error('Erro de conexão. Verifique sua internet e tente novamente.');
    }

    throw new Error('Erro ao buscar histórico de termos. Tente novamente.');
  }
};

export default getTermoDoacao;
