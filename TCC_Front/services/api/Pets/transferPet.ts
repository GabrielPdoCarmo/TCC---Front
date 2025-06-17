import api from '../api';

// ========== INTERFACES ==========

interface PetTransferPayload {
  id: number;
  novo_usuario_id: number;
}

interface PetOwnerUpdatePayload {
  id: number;
  usuario_id: number;
}

interface TransferResponse {
  message: string;
  pet: any;
  transferencia: {
    usuario_anterior: number;
    novo_usuario: number;
    cidade_anterior: number;
    nova_cidade: number;
    estado_anterior: number;
    novo_estado: number;
  };
}

// ========== TRANSFERIR PET (Versão Completa) ==========

export const transferPet = async (transferData: PetTransferPayload): Promise<TransferResponse> => {
  try {
    const { id, novo_usuario_id } = transferData;

    // ✅ VALIDAÇÕES DO FRONTEND
    if (!id || id <= 0) {
      throw new Error('ID do pet é obrigatório e deve ser válido.');
    }

    if (!novo_usuario_id || novo_usuario_id <= 0) {
      throw new Error('ID do novo usuário é obrigatório e deve ser válido.');
    }

    // ✅ PREPARAR PAYLOAD JSON
    const jsonPayload = {
      novo_usuario_id: novo_usuario_id
    };

    console.log('🔄 Transferindo pet:', {
      pet_id: id,
      novo_usuario_id: novo_usuario_id
    });

    // ✅ ENVIAR REQUISIÇÃO DE TRANSFERÊNCIA
    const response = await api.put(`/pets/${id}/transfer`, jsonPayload, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 segundos
    });

    console.log('✅ Pet transferido com sucesso:', response.data);

    return response.data;
    
  } catch (error: any) {
    console.error('❌ Erro ao transferir pet:', error);

    // ✅ TRATAMENTO DE ERROS ESPECÍFICOS
    if (error.response) {
      // Erro HTTP com resposta do servidor
      const status = error.response.status;
      const message = error.response.data?.error || 'Erro desconhecido do servidor';
      
      switch (status) {
        case 400:
          throw new Error(`Dados inválidos: ${message}`);
        case 404:
          throw new Error(`Pet ou usuário não encontrado: ${message}`);
        case 500:
          throw new Error(`Erro interno do servidor: ${message}`);
        default:
          throw new Error(`Erro HTTP ${status}: ${message}`);
      }
    } else if (error.request) {
      // Erro de rede
      throw new Error('Erro de conexão. Verifique sua internet e tente novamente.');
    } else {
      // Erro de configuração ou outro
      throw new Error(error.message || 'Erro inesperado ao transferir pet.');
    }
  }
};
export default transferPet