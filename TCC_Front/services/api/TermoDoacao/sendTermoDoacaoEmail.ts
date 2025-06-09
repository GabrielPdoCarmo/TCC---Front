// services/api/TermoDoacao/sendTermoDoacaoEmail.ts

import api from '../api';

interface SendTermoDoacaoEmailResponse {
  message: string;
  data: {
    termoId: number;
    destinatario: string;
    dataEnvio: string;
    emailEnviado: string;
  };
}

/**
 * 📧 Enviar termo de responsabilidade de doação por email
 * @param termoId - ID do termo a ser enviado
 * @returns Promise com dados do envio
 */
export const sendTermoDoacaoEmail = async (termoId: number): Promise<SendTermoDoacaoEmailResponse> => {
  try {
    const response = await api.post<SendTermoDoacaoEmailResponse>(`/termos-doacao/${termoId}/enviar-pdf`);

    return response.data;
  } catch (error: any) {
    // Tratamento de erros específicos
    if (error.response?.status === 401) {
      throw new Error('Sessão expirada. Faça login novamente.');
    }

    if (error.response?.status === 404) {
      const message = error.response.data?.message || '';
      if (message.includes('Termo não encontrado')) {
        throw new Error('Termo não encontrado ou não pertence a você.');
      }
      throw new Error('Termo não encontrado.');
    }

    if (error.response?.status === 403) {
      throw new Error('Você não tem permissão para enviar este termo.');
    }

    if (error.response?.status === 400) {
      const message = error.response.data?.message || 'Dados inválidos';
      throw new Error(message);
    }

    if (error.response?.status === 500) {
      const message = error.response.data?.message || 'Erro interno do servidor';

      if (message.includes('Falha ao enviar email')) {
        throw new Error('Falha no envio do email. Verifique o endereço e tente novamente.');
      }

      if (message.includes('Erro no servidor de email')) {
        throw new Error('Servidor de email temporariamente indisponível. Tente novamente em alguns minutos.');
      }

      throw new Error('Erro no servidor ao enviar email. Tente novamente.');
    }

    // Erro de rede
    if (!error.response) {
      throw new Error('Erro de conexão. Verifique sua internet e tente novamente.');
    }

    // Erro genérico
    throw new Error('Erro ao enviar email. Tente novamente.');
  }
};

/**
 * 📧 Gerar e enviar PDF do termo por email
 * @param termoId - ID do termo para gerar PDF
 * @returns Promise com dados do envio
 */
export const generateAndSendTermoPDF = async (termoId: number): Promise<SendTermoDoacaoEmailResponse> => {
  try {
    const response = await api.post<SendTermoDoacaoEmailResponse>(`/termos-doacao/${termoId}/gerar-pdf`);

    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error('Sessão expirada. Faça login novamente.');
    }

    if (error.response?.status === 404) {
      throw new Error('Termo não encontrado ou não pertence a você.');
    }

    if (error.response?.status === 403) {
      throw new Error('Você não tem permissão para gerar PDF deste termo.');
    }

    if (error.response?.status === 500) {
      const message = error.response.data?.message || '';

      if (message.includes('Erro ao gerar PDF')) {
        throw new Error('Erro ao gerar PDF. Tente novamente.');
      }

      if (message.includes('Falha ao enviar email')) {
        throw new Error('PDF gerado, mas falha no envio do email. Tente reenviar.');
      }

      throw new Error('Erro no servidor ao processar PDF. Tente novamente.');
    }

    if (!error.response) {
      throw new Error('Erro de conexão. Verifique sua internet e tente novamente.');
    }

    throw new Error('Erro ao gerar e enviar PDF. Tente novamente.');
  }
};

export default sendTermoDoacaoEmail;
