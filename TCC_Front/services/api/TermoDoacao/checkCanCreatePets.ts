// services/api/TermoDoacao/checkCanCreatePets.ts - Atualizado com verificação de nome

import api from '../api';

interface CheckCanCreatePetsResponse {
  message: string;
  data: {
    podecastrar: boolean;
    temTermo: boolean;
    nomeDesatualizado: boolean; // 🆕 Flag para indicar nome diferente
  };
}

/**
 * ✅ Verificar se usuário pode cadastrar pets (com verificação de nome atualizado)
 * @returns Promise com status de permissão para cadastrar pets
 */
export const checkCanCreatePets = async (): Promise<CheckCanCreatePetsResponse> => {
  try {
    console.log('🔍 Verificando se usuário pode cadastrar pets (com verificação de nome)...');

    const response = await api.get<CheckCanCreatePetsResponse>(
      '/termos-doacao/pode-cadastrar-pets'
    );

    const { podecastrar, temTermo, nomeDesatualizado } = response.data.data;

    console.log('📋 Resultado da verificação:', {
      podecastrar,
      temTermo,
      nomeDesatualizado,
      timestamp: new Date().toISOString()
    });

    // 🆕 Log específico para diferentes cenários
    if (nomeDesatualizado) {
      console.log('⚠️ Nome do usuário foi alterado - termo precisa ser reAssinado');
    } else if (temTermo && podecastrar) {
      console.log('✅ Usuário tem termo válido e pode cadastrar pets');
    } else if (temTermo && !podecastrar) {
      console.log('🚫 Usuário tem termo mas não pode cadastrar pets');
    } else {
      console.log('📝 Usuário não possui termo de responsabilidade');
    }

    return response.data;
  } catch (error: any) {
    console.error('❌ Erro ao verificar se pode cadastrar pets:', error);

    // Tratamento de erros específicos
    if (error.response?.status === 401) {
      throw new Error('Sessão expirada. Faça login novamente.');
    }

    if (error.response?.status === 403) {
      throw new Error('Você não tem permissão para acessar esta funcionalidade.');
    }

    if (error.response?.status === 500) {
      console.log('⚠️ Erro no servidor, assumindo que não pode cadastrar por segurança');
      // Em caso de erro no servidor, retornar resposta segura
      return {
        message: 'Erro na verificação',
        data: {
          podecastrar: false,
          temTermo: false,
          nomeDesatualizado: false,
        },
      };
    }

    // Erro de rede ou outros
    if (!error.response) {
      throw new Error('Erro de conexão. Verifique sua internet e tente novamente.');
    }

    // Para qualquer outro erro, assumir que não pode cadastrar por segurança
    console.log('⚠️ Erro desconhecido, assumindo que não pode cadastrar por segurança');
    return {
      message: 'Erro na verificação',
      data: {
        podecastrar: false,
        temTermo: false,
        nomeDesatualizado: false,
      },
    };
  }
};

/**
 * 🆕 FUNÇÃO AUXILIAR: Verificar apenas se precisa reAssinar por nome diferente
 * @returns Promise com status específico sobre atualização de nome
 */
export const checkNeedsNameUpdate = async (): Promise<{
  needsUpdate: boolean;
  hasTerms: boolean;
  currentUserName?: string;
  termName?: string;
}> => {
  try {
    console.log('🔍 Verificando especificamente se precisa atualizar nome no termo...');

    const response = await checkCanCreatePets();
    const { podecastrar, temTermo, nomeDesatualizado } = response.data;

    const needsUpdate = nomeDesatualizado;
    
    console.log('📋 Verificação de nome:', {
      needsUpdate,
      hasTerms: temTermo,
      canCreate: podecastrar,
      nameOutdated: nomeDesatualizado
    });

    return {
      needsUpdate,
      hasTerms: temTermo,
    };

  } catch (error) {
    console.error('❌ Erro ao verificar necessidade de atualização de nome:', error);
    return {
      needsUpdate: false,
      hasTerms: false,
    };
  }
};

/**
 * 🆕 CRIAR/ATUALIZAR TERMO COM INDICAÇÃO DE ATUALIZAÇÃO DE NOME
 * @param termoData - Dados do termo
 * @param isNameUpdate - Se é atualização por mudança de nome
 * @returns Promise com dados do termo criado/atualizado
 */
export const createOrUpdateTermoDoacao = async (
  termoData: {
    motivoDoacao: string;
    assinaturaDigital: string;
    condicoesAdocao?: string;
    observacoes?: string;
    confirmaResponsavelLegal: boolean;
    autorizaVisitas: boolean;
    aceitaAcompanhamento: boolean;
    confirmaSaude: boolean;
    autorizaVerificacao: boolean;
    compromesteContato: boolean;
  },
  isNameUpdate: boolean = false
): Promise<{
  message: string;
  data: any;
  updated: boolean;
}> => {
  try {
    const actionType = isNameUpdate ? 'Atualizando' : 'Criando';
    console.log(`📝 ${actionType} termo de doação:`, { 
      isNameUpdate,
      assinatura: termoData.assinaturaDigital,
      motivo: termoData.motivoDoacao.substring(0, 50) + '...'
    });

    // 🆕 Adicionar flag de atualização de nome aos dados
    const requestData = {
      ...termoData,
      isNameUpdate, // Flag para o backend saber se é atualização
    };

    const response = await api.post('/termos-doacao', requestData);

    const isUpdated = response.data.updated || false;
    
    console.log(`✅ Termo ${isUpdated ? 'atualizado' : 'criado'} com sucesso:`, {
      termoId: response.data.data?.id,
      doadorNome: response.data.data?.doador_nome,
      dataAssinatura: response.data.data?.data_assinatura,
      isUpdate: isUpdated
    });

    return {
      message: response.data.message,
      data: response.data.data,
      updated: isUpdated,
    };
  } catch (error: any) {
    console.error(`❌ Erro ao ${isNameUpdate ? 'atualizar' : 'criar'} termo:`, error);

    // Tratamento de erros específicos
    if (error.response?.status === 401) {
      throw new Error('Sessão expirada. Faça login novamente.');
    }

    if (error.response?.status === 400) {
      const message = error.response.data?.message || 'Dados inválidos';
      if (message.includes('compromissos devem ser aceitos')) {
        throw new Error('Todos os compromissos devem ser aceitos para continuar.');
      }
      if (message.includes('obrigatórios não fornecidos')) {
        throw new Error('Por favor, preencha todos os campos obrigatórios.');
      }
      throw new Error(message);
    }

    if (error.response?.status === 409) {
      const message = error.response.data?.message || '';
      if (message.includes('já possui um termo')) {
        throw new Error('Você já possui um termo de responsabilidade ativo.');
      }
      throw new Error('Conflito: ' + message);
    }

    if (error.response?.status === 404) {
      throw new Error('Usuário não encontrado. Faça login novamente.');
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

export default checkCanCreatePets;