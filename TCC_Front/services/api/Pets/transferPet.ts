import api from '../api';

// ========== INTERFACES ==========

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

interface PetTransferPayload {
  id: number;
  usuario_id: number; // ✅ ID do doador (confirmação)
  adotante_id: number; // ✅ ID do adotante
}

export const transferPet = async (transferData: PetTransferPayload): Promise<TransferResponse> => {
  try {
    const { id, usuario_id, adotante_id } = transferData;

    // ✅ VALIDAÇÕES MELHORADAS
    if (!id || id <= 0) {
      throw new Error('ID do pet é obrigatório e deve ser válido.');
    }

    if (!usuario_id || usuario_id <= 0) {
      throw new Error('ID do doador é obrigatório e deve ser válido.');
    }

    if (!adotante_id || adotante_id <= 0) {
      throw new Error('ID do adotante é obrigatório e deve ser válido.');
    }

    if (usuario_id === adotante_id) {
      throw new Error('O doador não pode ser o mesmo que o adotante.');
    }

    // ✅ PAYLOAD COMPLETO
    const jsonPayload = {
      usuario_id: usuario_id, // Confirmação do doador
      adotante_id: adotante_id, // Novo adotante
    };

    const response = await api.put(`/pets/${id}/transfer`, jsonPayload, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    return response.data;
  } catch (error: any) {
    console.error('❌ Erro na transferência:', error);

    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.error || 'Erro desconhecido';

      switch (status) {
        case 400:
          if (message.includes('não é o doador deste pet')) {
            throw new Error('Você não é o doador deste pet e não pode transferi-lo.');
          } else if (message.includes('não está disponível para adoção')) {
            throw new Error('Este pet não está disponível para adoção.');
          } else if (message.includes('doador não pode adotar')) {
            throw new Error('O doador não pode adotar o próprio pet.');
          } else {
            throw new Error(`Dados inválidos: ${message}`);
          }
        case 404:
          if (message.includes('Pet não encontrado')) {
            throw new Error('Pet não encontrado.');
          } else if (message.includes('Adotante não encontrado')) {
            throw new Error('Usuário adotante não encontrado.');
          } else if (message.includes('Doador não encontrado')) {
            throw new Error('Usuário doador não encontrado.');
          } else {
            throw new Error(`Recurso não encontrado: ${message}`);
          }
        default:
          throw new Error(`Erro HTTP ${status}: ${message}`);
      }
    } else if (error.request) {
      throw new Error('Erro de conexão. Verifique sua internet.');
    } else {
      throw new Error(error.message || 'Erro inesperado na transferência.');
    }
  }
};
export default transferPet;
