// services/api/TermoDoacao/checkCanCreatePets.ts - CORRIGIDO PARA PRIMEIRA VEZ

import api from '../api';

interface CheckCanCreatePetsResponse {
  message: string;
  data: {
    podecastrar: boolean;
    temTermo: boolean;
  };
}

/**
 * ✅ Verificar se usuário pode cadastrar pets - AMIGÁVEL PARA PRIMEIRA VEZ
 * @returns Promise com status de permissão
 */
export const checkCanCreatePets = async (): Promise<CheckCanCreatePetsResponse> => {
  try {
    const response = await api.get<CheckCanCreatePetsResponse>('/termos-doacao/pode-cadastrar-pets');

    return response.data;
  } catch (error: any) {
    if (error.response) {
      const status = error.response.status;

      // Tratar apenas sessão expirada como erro crítico
      if (status === 401) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      // 404, 403, e outros erros = primeira vez ou sem termo (NORMAL)
      if (status === 404 || status === 403) {
        return {
          message: 'Usuário de primeira vez ou sem termo',
          data: {
            podecastrar: false,
            temTermo: false,
          },
        };
      }

      // Outros erros HTTP também são tratados como primeira vez

      return {
        message: 'Assumindo primeira vez devido a erro HTTP',
        data: {
          podecastrar: false,
          temTermo: false,
        },
      };
    }

    // Erro de rede
    if (error.request) {
      throw new Error('Erro de conexão. Verifique sua internet e tente novamente.');
    }

    // Outros erros - assumir primeira vez
    console.log('ℹ️ Erro desconhecido tratado como primeira vez:', error.message);
    return {
      message: 'Erro desconhecido - assumindo primeira vez',
      data: {
        podecastrar: false,
        temTermo: false,
      },
    };
  }
};

/**
 * 🆕 Função específica para verificar se é primeira vez do usuário
 * @returns Promise indicando se é primeira vez
 */
export const isFirstTimeUser = async (): Promise<boolean> => {
  try {
    console.log('🔍 Verificando se é primeira vez do usuário...');

    // Tentar buscar termo existente diretamente
    const response = await api.get('/termos-doacao/meu-termo');

    // Se chegou até aqui, usuário tem termo
    console.log('ℹ️ Usuário já possui termo, não é primeira vez');
    return false;
  } catch (error: any) {
    if (error.response?.status === 404) {
      // 404 = primeira vez (sem termo)
      console.log('✅ Confirmado: primeira vez do usuário (404)');
      return true;
    }

    if (error.response?.status === 401) {
      // Sessão expirada
      throw new Error('Sessão expirada. Faça login novamente.');
    }

    // Outros erros = assumir primeira vez por segurança
    console.log('ℹ️ Assumindo primeira vez devido a erro:', error.message);
    return true;
  }
};

/**
 * 📊 Obter estatísticas gerais dos termos de doação
 */
export const getTermoStats = async () => {
  try {
    console.log('📊 Buscando estatísticas dos termos...');
    const response = await api.get('/termos-doacao/stats');
    console.log('✅ Estatísticas obtidas:', response.data.data);
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
 */
export const validateTermoIntegrity = async (termoId: number) => {
  try {
    console.log('✅ Validando integridade do termo:', termoId);
    const response = await api.get(`/termos-doacao/${termoId}/validate`);
    console.log('✅ Validação concluída:', response.data.data);
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
