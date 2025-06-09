// services/api/TermoDoacao/createTermoDoacao.ts

import api from '../api';

interface CreateTermoDoacaoRequest {
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
}

interface CreateTermoDoacaoResponse {
  message: string;
  data: {
    id: number;
    doador_nome: string;
    doador_email: string;
    doador_telefone?: string;
    doador_cpf?: string;
    motivo_doacao: string;
    condicoes_adocao?: string;
    observacoes?: string;
    assinatura_digital: string;
    data_assinatura: string;
    hash_documento: string;
    estado?: {
      nome: string;
    };
    cidade?: {
      nome: string;
    };
  };
}

/**
 * 📝 Criar novo termo de responsabilidade de doação
 * @param data - Dados do termo a ser criado
 * @returns Promise com dados do termo criado
 */
export const createTermoDoacao = async (data: CreateTermoDoacaoRequest): Promise<CreateTermoDoacaoResponse> => {
  try {
    const response = await api.post<CreateTermoDoacaoResponse>('/termos-doacao', data);

    return response.data;
  } catch (error: any) {
    // Tratamento de erros específicos
    if (error.response?.status === 401) {
      throw new Error('Sessão expirada. Faça login novamente.');
    }

    if (error.response?.status === 409) {
      const message = error.response.data?.message || '';
      if (message.includes('já possui um termo')) {
        throw new Error('Você já possui um termo de responsabilidade de doação.');
      }
      throw new Error(message);
    }

    if (error.response?.status === 400) {
      const message = error.response.data?.message || 'Dados inválidos';

      if (message.includes('Dados obrigatórios não fornecidos')) {
        throw new Error('Preencha todos os campos obrigatórios (motivo da doação e assinatura digital).');
      }

      if (message.includes('Todos os compromissos devem ser aceitos')) {
        throw new Error('Todos os compromissos devem ser aceitos para criar o termo de doação.');
      }

      throw new Error(message);
    }

    if (error.response?.status === 404) {
      const message = error.response.data?.message || '';
      if (message.includes('Usuário não encontrado')) {
        throw new Error('Usuário não encontrado. Faça login novamente.');
      }
      throw new Error(message);
    }

    if (error.response?.status === 500) {
      const message = error.response.data?.message || 'Erro interno do servidor';
      throw new Error('Erro no servidor ao criar termo. Tente novamente.');
    }

    // Erro de rede ou outros
    if (!error.response) {
      throw new Error('Erro de conexão. Verifique sua internet e tente novamente.');
    }

    // Erro genérico
    throw new Error('Erro ao criar termo de doação. Tente novamente.');
  }
};

export default createTermoDoacao;
