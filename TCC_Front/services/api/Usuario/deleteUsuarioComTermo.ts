// services/api/Usuario/deleteUsuarioComTermo.ts

import api from '../api';

export interface UsuarioDeleteResponse {
  success: boolean;
  message: string;
  title: string;
  data?: {
    usuarioId: number;
    usuarioNome: string;
    usuarioEmail: string;
    termoExcluido: boolean;
    termoInfo?: {
      id: number;
      motivoDoacao: string;
      dataAssinatura: string;
    };
    dataExclusao: string;
  };
  error?: string;
  petCount?: number;
}

export interface VerificarExclusaoResponse {
  message: string;
  data: {
    podeExcluir: boolean;
    motivoImpedimento: 'pets_cadastrados' | null;
    petCount: number;
    temTermo: boolean;
    termoInfo?: {
      id: number;
      dataAssinatura: string;
      motivoDoacao: string;
    };
    usuario: {
      id: number;
      nome: string;
      email: string;
    };
  };
}

/**
 * 🔍 Verificar se usuário pode excluir conta
 */
export const verificarPodeExcluirConta = async (usuarioId: number): Promise<VerificarExclusaoResponse> => {
  try {
    const response = await api.get(`/usuarios/${usuarioId}/pode-excluir-conta`);

    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      throw new Error('Usuário não encontrado');
    } else if (error.response?.status === 401) {
      throw new Error('Você precisa estar logado');
    }

    throw error;
  }
};

/**
 * 🗑️ Excluir conta do usuário (com termo de doação automaticamente)
 */
export const deleteUsuarioComTermo = async (usuarioId: number): Promise<UsuarioDeleteResponse> => {
  try {
    const response = await api.delete(`/usuarios/${usuarioId}`);

    return response.data;
  } catch (error: any) {
    if (error.response?.status === 400) {
      // Erro conhecido do backend (pets cadastrados, etc.)
      return error.response.data;
    } else if (error.response?.status === 404) {
      throw new Error('Usuário não encontrado');
    } else if (error.response?.status === 401) {
      throw new Error('Você precisa estar logado para excluir a conta');
    }

    throw error;
  }
};

export default {
  verificarPodeExcluirConta,
  deleteUsuarioComTermo,
};
