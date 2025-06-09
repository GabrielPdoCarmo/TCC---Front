// services/api/TermoDoacao/deleteTermoDoacao.ts

import api from '../api';

interface DeleteTermoDoacaoResponse {
  message: string;
  data: {
    termoId: number;
    dataDelecao: string;
    doadorNome: string;
  };
}

/**
 * 🗑️ Deletar termo de responsabilidade de doação
 * @param id - ID do termo a ser deletado
 * @returns Promise com dados da deleção
 */
export const deleteTermoDoacao = async (id: number): Promise<DeleteTermoDoacaoResponse> => {
  try {
    const response = await api.delete<DeleteTermoDoacaoResponse>(`/termos-doacao/${id}`);

    return response.data;
  } catch (error: any) {
    // Tratamento de erros específicos
    if (error.response?.status === 401) {
      throw new Error('Sessão expirada. Faça login novamente.');
    }

    if (error.response?.status === 404) {
      const message = error.response.data?.message || '';
      if (message.includes('não encontrado') || message.includes('não pertence a você')) {
        throw new Error('Termo de doação não encontrado ou você não tem permissão para deletá-lo.');
      }
      throw new Error('Termo de doação não encontrado.');
    }

    if (error.response?.status === 400) {
      const message = error.response.data?.message || 'Dados inválidos';

      if (message.includes('dependências ativas') || message.includes('pets cadastrados')) {
        throw new Error('Não é possível deletar o termo pois existem pets cadastrados vinculados a ele.');
      }

      if (message.includes('foreign key constraint')) {
        throw new Error('Não é possível deletar o termo pois possui dependências ativas no sistema.');
      }

      throw new Error(message);
    }

    if (error.response?.status === 409) {
      const message = error.response.data?.message || '';
      if (message.includes('pets cadastrados')) {
        throw new Error('Não é possível deletar o termo pois existem pets cadastrados vinculados a ele.');
      }
      throw new Error('Conflito: ' + message);
    }

    if (error.response?.status === 403) {
      throw new Error('Você não tem permissão para deletar este termo de doação.');
    }

    if (error.response?.status === 500) {
      const message = error.response.data?.message || 'Erro interno do servidor';
      throw new Error('Erro no servidor ao deletar termo. Tente novamente.');
    }

    // Erro de rede ou outros
    if (!error.response) {
      throw new Error('Erro de conexão. Verifique sua internet e tente novamente.');
    }

    // Erro genérico
    throw new Error('Erro ao deletar termo de doação. Tente novamente.');
  }
};

export default deleteTermoDoacao;
