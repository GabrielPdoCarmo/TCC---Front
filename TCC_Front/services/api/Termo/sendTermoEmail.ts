// services/api/Termo/sendTermoEmail.ts

import api from '../api';

interface SendEmailResponse {
  message: string;
  data: {
    termoId: string;
    destinatario: string;
    petNome: string;
    dataEnvio: string;
  };
}

/**
 * 📧 Enviar termo de compromisso por email
 * @param termoId - ID do termo a ser enviado
 * @returns Promise com dados do envio
 */
export const sendTermoEmail = async (termoId: number): Promise<SendEmailResponse> => {
  try {
    console.log('📧 Enviando termo por email:', { termoId });

    const response = await api.post<SendEmailResponse>(
      `/termos-compromisso/${termoId}/enviar-email`
    );

    console.log('✅ Email enviado com sucesso:', response.data);

    return response.data;
  } catch (error: any) {
    console.error('❌ Erro ao enviar termo por email:', error);

    // Tratamento de erros específicos
    if (error.response?.status === 404) {
      throw new Error('Termo não encontrado');
    }

    if (error.response?.status === 400) {
      const message = error.response.data?.message || 'Dados inválidos';
      if (message.includes('Email do adotante não encontrado')) {
        throw new Error('Email do adotante não está disponível');
      }
      throw new Error(message);
    }

    if (error.response?.status === 500) {
      const message = error.response.data?.message || 'Erro interno do servidor';
      if (message.includes('Falha ao enviar email')) {
        throw new Error('Falha no envio do email. Verifique o endereço e tente novamente.');
      }
      throw new Error('Erro no servidor ao processar envio');
    }

    if (error.response?.status === 401) {
      throw new Error('Sessão expirada. Faça login novamente.');
    }

    // Erro genérico
    throw new Error('Erro ao enviar email. Tente novamente.');
  }
};

export default sendTermoEmail;