// services/api/TermoCompromisso/checkCanAdopt.ts - Arquivo completo para verificações de adoção

import api from '../api';

interface CheckCanAdoptResponse {
  message: string;
  data: {
    podeAdotar: boolean;
    temTermo: boolean;
    nomeDesatualizado: boolean; // 🆕 Flag para indicar nome diferente
    motivo?: string; // Motivo específico (ex: 'proprio_pet')
  };
}

interface CreateOrUpdateTermoResponse {
  message: string;
  data: any;
  updated: boolean;
}

interface TermoData {
  data: any;
  nomeDesatualizado?: boolean;
}

/**
 * ✅ Verificar se usuário pode adotar pet específico (com verificação de nome atualizado)
 * @param petId - ID do pet que o usuário quer adotar
 * @returns Promise com status de permissão para adotar
 */
export const checkCanAdopt = async (petId: number): Promise<CheckCanAdoptResponse> => {
  try {
    const response = await api.get<CheckCanAdoptResponse>(`/termos-compromisso/pode-adotar/${petId}`);

    return response.data;
  } catch (error: any) {
    // Tratamento de erros específicos
    if (error.response?.status === 401) {
      throw new Error('Sessão expirada. Faça login novamente.');
    }

    if (error.response?.status === 404) {
      throw new Error('Pet não encontrado.');
    }

    if (error.response?.status === 403) {
      throw new Error('Você não tem permissão para adotar este pet.');
    }

    if (error.response?.status === 500) {
      // Em caso de erro no servidor, retornar resposta segura
      return {
        message: 'Erro na verificação',
        data: {
          podeAdotar: false,
          temTermo: false,
          nomeDesatualizado: false,
        },
      };
    }

    // Erro de rede ou outros
    if (!error.response) {
      throw new Error('Erro de conexão. Verifique sua internet e tente novamente.');
    }

    // Para qualquer outro erro, assumir que não pode adotar por segurança

    return {
      message: 'Erro na verificação',
      data: {
        podeAdotar: false,
        temTermo: false,
        nomeDesatualizado: false,
      },
    };
  }
};

/**
 * 🆕 FUNÇÃO AUXILIAR: Verificar apenas se precisa atualizar termo por nome diferente
 * @param petId - ID do pet
 * @returns Promise com status específico sobre atualização de nome
 */
export const checkNeedsNameUpdateForPet = async (
  petId: number
): Promise<{
  needsUpdate: boolean;
  hasTerms: boolean;
  canAdopt: boolean;
}> => {
  try {
    const response = await checkCanAdopt(petId);
    const { podeAdotar, temTermo, nomeDesatualizado } = response.data;

    const needsUpdate = nomeDesatualizado;

    return {
      needsUpdate,
      hasTerms: temTermo,
      canAdopt: podeAdotar,
    };
  } catch (error) {
    return {
      needsUpdate: false,
      hasTerms: false,
      canAdopt: false,
    };
  }
};

/**
 * 🆕 CRIAR/ATUALIZAR TERMO DE COMPROMISSO COM INDICAÇÃO DE ATUALIZAÇÃO DE NOME
 * @param termoData - Dados do termo
 * @param isNameUpdate - Se é atualização por mudança de nome
 * @returns Promise com dados do termo criado/atualizado
 */
export const createOrUpdateTermoCompromisso = async (
  termoData: {
    petId: number;
    assinaturaDigital: string;
    observacoes?: string;
  },
  isNameUpdate: boolean = false
): Promise<CreateOrUpdateTermoResponse> => {
  try {
    const actionType = isNameUpdate ? 'Atualizando' : 'Criando';

    // 🆕 Adicionar flag de atualização de nome aos dados
    const requestData = {
      ...termoData,
      isNameUpdate, // Flag para o backend saber se é atualização
    };

    const response = await api.post<CreateOrUpdateTermoResponse>('/termos-compromisso', requestData);

    const isUpdated = response.data.updated || false;

    return {
      message: response.data.message,
      data: response.data.data,
      updated: isUpdated,
    };
  } catch (error: any) {
    // Tratamento de erros específicos
    if (error.response?.status === 401) {
      throw new Error('Sessão expirada. Faça login novamente.');
    }

    if (error.response?.status === 400) {
      const message = error.response.data?.message || 'Dados inválidos';

      if (message.includes('não pode adotar seu próprio pet')) {
        throw new Error('Você não pode adotar seu próprio pet.');
      }
      if (message.includes('obrigatórios não fornecidos')) {
        throw new Error('Por favor, preencha todos os campos obrigatórios.');
      }
      throw new Error(message);
    }

    if (error.response?.status === 409) {
      const message = error.response.data?.message || '';
      if (message.includes('Já existe um termo')) {
        throw new Error('Este pet já possui um termo de compromisso.');
      }
      throw new Error('Conflito: ' + message);
    }

    if (error.response?.status === 404) {
      const message = error.response.data?.message || '';
      if (message.includes('Pet não encontrado')) {
        throw new Error('Pet não encontrado.');
      }
      throw new Error('Usuário não encontrado. Faça login novamente.');
    }

    if (error.response?.status === 403) {
      throw new Error('Você não tem permissão para adotar este pet.');
    }

    if (error.response?.status === 500) {
      const message = error.response.data?.message || 'Erro interno do servidor';
      throw new Error('Erro no servidor. Tente novamente em alguns momentos.');
    }

    // Erro de rede
    if (!error.response) {
      throw new Error('Erro de conexão. Verifique sua internet e tente novamente.');
    }

    // Erro genérico
    throw new Error('Erro ao processar termo. Tente novamente.');
  }
};

/**
 * 📄 Buscar termo de compromisso por pet (COM VERIFICAÇÃO DE NOME)
 * @param petId - ID do pet
 * @returns Promise com dados do termo
 */
export const getTermoByPetWithNameCheck = async (petId: number): Promise<TermoData | null> => {
  try {
    const response = await api.get(`/termos-compromisso/pet/${petId}`);

    if (response.data && response.data.data) {
      const termo = response.data.data;

      return {
        data: termo,
        nomeDesatualizado: termo.nomeDesatualizado || false,
      };
    }

    return null;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }

    if (error.response?.status === 401) {
      throw new Error('Sessão expirada. Faça login novamente.');
    }

    throw new Error('Erro ao buscar termo do pet.');
  }
};

/**
 * 🔍 Verificar se usuário específico tem termo para um pet
 * @param petId - ID do pet
 * @param usuarioId - ID do usuário (opcional, usa usuário logado se não informado)
 * @returns Promise com dados do termo ou null se não encontrado
 */
export const checkUserTermoForPet = async (
  petId: number,
  usuarioId?: number
): Promise<{
  hasTermo: boolean;
  termo?: any;
  canAdopt: boolean;
  needsNameUpdate: boolean;
}> => {
  try {
    // Buscar termo geral do pet
    const termoResponse = await getTermoByPetWithNameCheck(petId);

    if (!termoResponse || !termoResponse.data) {
      return {
        hasTermo: false,
        canAdopt: true,
        needsNameUpdate: false,
      };
    }

    const termo = termoResponse.data;

    // Se não especificou usuário, usar verificação geral de permissão
    if (!usuarioId) {
      const permissionCheck = await api.get(`/termos-compromisso/pode-adotar/${petId}`);
      const { podeAdotar, temTermo, nomeDesatualizado } = permissionCheck.data.data;

      return {
        hasTermo: temTermo,
        termo: termo,
        canAdopt: podeAdotar,
        needsNameUpdate: nomeDesatualizado,
      };
    }

    // Verificar se o termo pertence ao usuário específico
    const isUserTermo = termo.adotante_id === usuarioId;

    return {
      hasTermo: isUserTermo,
      termo: isUserTermo ? termo : null,
      canAdopt: isUserTermo,
      needsNameUpdate: false, // Seria necessário uma verificação adicional aqui
    };
  } catch (error: any) {
    return {
      hasTermo: false,
      canAdopt: false,
      needsNameUpdate: false,
    };
  }
};

// Função legacy para compatibilidade com o código existente
export const getTermoByPet = async (petId: number) => {
  const result = await getTermoByPetWithNameCheck(petId);
  return result;
};

export default checkCanAdopt;
