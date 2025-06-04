// services/api/TermoCompromisso/updateTermoCompromisso.ts - Atualizar termo existente

import api from '../api';

interface UpdateTermoCompromissoRequest {
  petId: number;
  assinaturaDigital: string;
  observacoes?: string;
}

interface UpdateTermoCompromissoResponse {
  message: string;
  data: {
    id: number;
    pet_id: number;
    adotante_id: number;
    adotante_nome: string;
    adotante_email: string;
    assinatura_digital: string;
    data_assinatura: string;
    observacoes?: string;
    hash_documento: string;
    // ... outros campos do termo
  };
  updated: boolean;
}

/**
 * 🔄 Atualizar termo de compromisso existente (quando nome do usuário mudou)
 * @param petId - ID do pet
 * @param termoData - Novos dados para atualização
 * @returns Promise com dados do termo atualizado
 */
export const updateTermoCompromisso = async (
  petId: number,
  termoData: UpdateTermoCompromissoRequest
): Promise<UpdateTermoCompromissoResponse> => {
  try {
    console.log('🔄 Atualizando termo de compromisso para pet:', petId);

    // Usar a mesma rota POST com flag isNameUpdate = true
    const requestData = {
      ...termoData,
      isNameUpdate: true, // Flag para indicar que é atualização
    };

    const response = await api.post<UpdateTermoCompromissoResponse>(
      '/termos-compromisso',
      requestData
    );

    console.log('✅ Termo de compromisso atualizado com sucesso:', {
      termoId: response.data.data.id,
      adotanteNome: response.data.data.adotante_nome,
      dataAssinatura: response.data.data.data_assinatura,
      updated: response.data.updated
    });

    return response.data;
  } catch (error: any) {
    console.error('❌ Erro ao atualizar termo de compromisso:', error);

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

    if (error.response?.status === 404) {
      const message = error.response.data?.message || '';
      if (message.includes('Pet não encontrado')) {
        throw new Error('Pet não encontrado.');
      }
      throw new Error('Termo não encontrado para este pet.');
    }

    if (error.response?.status === 403) {
      throw new Error('Você não tem permissão para atualizar este termo.');
    }

    if (error.response?.status === 409) {
      throw new Error('Conflito ao atualizar termo. Tente novamente.');
    }

    if (error.response?.status === 500) {
      throw new Error('Erro no servidor. Tente novamente em alguns momentos.');
    }

    // Erro de rede
    if (!error.response) {
      throw new Error('Erro de conexão. Verifique sua internet e tente novamente.');
    }

    // Erro genérico
    throw new Error('Erro ao atualizar termo. Tente novamente.');
  }
};

/**
 * 📄 Buscar termo de compromisso por pet (versão simplificada)
 * @param petId - ID do pet
 * @returns Promise com dados do termo ou null se não encontrado
 */
export const getTermoByPet = async (petId: number): Promise<{
  data: any;
} | null> => {
  try {
    console.log('📄 Buscando termo por pet:', petId);

    const response = await api.get(`/termos-compromisso/pet/${petId}`);

    if (response.data && response.data.data) {
      console.log('✅ Termo encontrado:', {
        termoId: response.data.data.id,
        petId: response.data.data.pet_id,
        adotante: response.data.data.adotante_nome
      });

      return {
        data: response.data.data
      };
    }

    return null;
  } catch (error: any) {
    console.error('❌ Erro ao buscar termo por pet:', error);

    if (error.response?.status === 404) {
      console.log('ℹ️ Termo não encontrado para este pet');
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
    console.log('🔍 Verificando termo do usuário para pet:', { petId, usuarioId });

    // Buscar termo geral do pet
    const termoResponse = await getTermoByPet(petId);

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
    console.error('❌ Erro ao verificar termo do usuário:', error);
    
    return {
      hasTermo: false,
      canAdopt: false,
      needsNameUpdate: false,
    };
  }
};

export default updateTermoCompromisso;