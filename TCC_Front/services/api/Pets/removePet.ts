import api from '../api';

interface RemovePetPayload {
  id: number;          // ID do pet
  usuario_id: number;  // ID do atual responsável (ex-adotante)
}

interface RemovePetResponse {
  success: {
    data_devolucao: Date; motivo: string; doador_original: {
      id: number;
      nome: string;
      recebeu_pet_de_volta: boolean;
    }; ex_adotante: {
      id: number;
      nome: string;
    }; mudancas: {
      responsavel_anterior: number;
      novo_responsavel: number;
      adotante_removido: number | null;
      cidade_anterior: number;
      nova_cidade: number;
      status_anterior: number;
    };
  };
  message: string;
  pet: any; // Aqui você pode usar um tipo mais forte como `PetType` se quiser
  devolucao: {
    data_devolucao: Date;
    motivo: string;
    doador_original: {
      id: number;
      nome: string;
      recebeu_pet_de_volta: boolean;
    };
    ex_adotante: {
      id: number;
      nome: string;
    };
    mudancas: {
      responsavel_anterior: number;
      novo_responsavel: number;
      adotante_removido: number | null;
      cidade_anterior: number;
      nova_cidade: number;
      status_anterior: number;
    };
  };
}

export const removePet = async (payload: RemovePetPayload): Promise<RemovePetResponse> => {
  try {
    const { id, usuario_id} = payload;

    // ✅ Validações
    if (!id || id <= 0) {
      throw new Error('ID do pet é obrigatório e deve ser válido.');
    }
    if (!usuario_id || usuario_id <= 0) {
      throw new Error('ID do usuário atual é obrigatório.');
    }

    

    const response = await api.put(`/pets/${id}/remove`, { usuario_id,}, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    
    return response.data;

  } catch (error: any) {
    

    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.error || 'Erro desconhecido';

      switch (status) {
        case 400:
          if (message.includes('responsável atual')) {
            throw new Error('Você não é o responsável atual deste pet.');
          } else if (message.includes('não está em status de adotado')) {
            throw new Error('Este pet não está com status de adotado.');
          } else if (message.includes('doador original não pode devolver')) {
            throw new Error('O doador original não pode devolver o próprio pet.');
          } else {
            throw new Error(`Erro de validação: ${message}`);
          }
        case 404:
          if (message.includes('Pet não encontrado')) {
            throw new Error('Pet não encontrado.');
          } else if (message.includes('Doador original não encontrado')) {
            throw new Error('O doador original deste pet não foi encontrado.');
          } else {
            throw new Error(`Recurso não encontrado: ${message}`);
          }
        default:
          throw new Error(`Erro HTTP ${status}: ${message}`);
      }
    } else if (error.request) {
      throw new Error('Erro de conexão. Verifique sua internet.');
    } else {
      throw new Error(error.message || 'Erro inesperado na devolução do pet.');
    }
  }
};

export default removePet;
