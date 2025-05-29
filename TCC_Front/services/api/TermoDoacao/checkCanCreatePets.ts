// services/api/TermoDoacao/checkCanCreatePets.ts

import api from '../api';

interface CheckCanCreatePetsResponse {
  message: string;
  data: {
    podecastrar: boolean;
    temTermo: boolean;
  };
}

interface TermoStatsResponse {
  message: string;
  data: {
    total: number;
    hoje: number;
    esteMes: number;
  };
}

/**
 * ✅ Verificar se usuário pode cadastrar pets (possui termo ativo)
 * @returns Promise com status de permissão
 */
export const checkCanCreatePets = async (): Promise<CheckCanCreatePetsResponse> => {
  try {
    console.log('✅ Verificando se usuário pode cadastrar pets...');

    const response = await api.get<CheckCanCreatePetsResponse>('/termos-doacao/pode-cadastrar-pets');

    console.log('✅ Verificação concluída:', {
      podecastrar: response.data.data.podecastrar,
      temTermo: response.data.data.temTermo,
    });

    return response.data;
  } catch (error: any) {
    // Tratamento de erros específicos
    if (error.response?.status === 401) {
      throw new Error('Sessão expirada. Faça login novamente.');
    }

    if (error.response?.status === 403) {
      throw new Error('Você não tem permissão para cadastrar pets. Assine o termo de responsabilidade.');
    }

    if (error.response?.status === 500) {
      throw new Error('Erro no servidor ao verificar permissões. Tente novamente.');
    }

    // Erro de rede
    if (!error.response) {
      throw new Error('Erro de conexão. Verifique sua internet e tente novamente.');
    }

    // Erro genérico - assumir que não pode cadastrar por segurança

    return {
      message: 'Erro na verificação',
      data: {
        podecastrar: false,
        temTermo: false,
      },
    };
  }
};

/**
 * 📊 Obter estatísticas gerais dos termos de doação
 * @returns Promise com estatísticas
 */
export const getTermoStats = async (): Promise<TermoStatsResponse> => {
  try {
    console.log('📊 Buscando estatísticas dos termos...');

    const response = await api.get<TermoStatsResponse>('/termos-doacao/stats');

    console.log('✅ Estatísticas obtidas:', {
      total: response.data.data.total,
      hoje: response.data.data.hoje,
      esteMes: response.data.data.esteMes,
    });

    return response.data;
  } catch (error: any) {
    if (error.response?.status === 500) {
      throw new Error('Erro no servidor ao buscar estatísticas. Tente novamente.');
    }

    if (!error.response) {
      throw new Error('Erro de conexão. Verifique sua internet e tente novamente.');
    }

    throw new Error('Erro ao buscar estatísticas. Tente novamente.');
  }
};

/**
 * ✅ Validar integridade de um termo específico
 * @param termoId - ID do termo a ser validado
 * @returns Promise com resultado da validação
 */
export const validateTermoIntegrity = async (
  termoId: number
): Promise<{
  message: string;
  data: {
    integridadeOk: boolean;
    compromissosOk: boolean;
    dataAssinatura: string;
    hashDocumento: string;
  };
}> => {
  try {
    console.log('✅ Validando integridade do termo:', termoId);

    const response = await api.get(`/termos-doacao/${termoId}/validate`);

    console.log('✅ Validação concluída:', {
      integridadeOk: response.data.data.integridadeOk,
      compromissosOk: response.data.data.compromissosOk,
    });

    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error('Sessão expirada. Faça login novamente.');
    }

    if (error.response?.status === 404) {
      throw new Error('Termo não encontrado.');
    }

    if (error.response?.status === 500) {
      throw new Error('Erro no servidor ao validar termo. Tente novamente.');
    }

    if (!error.response) {
      throw new Error('Erro de conexão. Verifique sua internet e tente novamente.');
    }

    throw new Error('Erro ao validar termo. Tente novamente.');
  }
};

/**
 * 🔄 Hook para verificar permissão antes de ações importantes
 * @param onSuccess - Callback executado se usuário pode cadastrar pets
 * @param onError - Callback executado se usuário não pode cadastrar pets
 */
export const checkPermissionBeforeAction = async (
  onSuccess: () => void,
  onError: (message: string) => void
): Promise<void> => {
  try {
    const result = await checkCanCreatePets();

    if (result.data.podecastrar) {
      console.log('✅ Usuário tem permissão, executando ação...');
      onSuccess();
    } else {
      onError('Você precisa assinar o termo de responsabilidade antes de cadastrar pets.');
    }
  } catch (error: any) {
    onError(error.message || 'Erro ao verificar permissões. Tente novamente.');
  }
};

export default checkCanCreatePets;
