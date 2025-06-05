// services/api/TermoAdocao/sendTermoEmail.ts - Atualizado para ambos destinatários

import api from '../api';

// 🆕 Interface atualizada para resposta com ambos destinatários
interface SendTermoEmailResponse {
  message: string;
  data: {
    termoId: string;
    destinatarios: {
      doador: string;
      adotante: string;
    };
    petNome: string;
    dataEnvio: string;
  };
}

// 🆕 Interface alternativa para compatibilidade (caso backend ainda não esteja atualizado)
interface SendTermoEmailResponseLegacy {
  message: string;
  data: {
    termoId: string;
    destinatario: string;
    petNome: string;
    dataEnvio: string;
  };
}

/**
 * 🆕 Enviar termo de compromisso por email para AMBOS destinatários
 * @param termoId - ID do termo de compromisso
 * @returns Promise com dados de confirmação do envio
 */
export const sendTermoEmail = async (termoId: number): Promise<SendTermoEmailResponse> => {
  try {
    console.log('📧 Enviando termo por email para ambos destinatários:', termoId);

    const response = await api.post<SendTermoEmailResponse>(`/termos-compromisso/${termoId}/enviar-email`);

    console.log('✅ Resposta do envio de email:', response.data);

    // 🆕 Verificar se a resposta tem o formato novo (ambos destinatários)
    if (response.data.data.destinatarios) {
      // Formato novo - com ambos destinatários
      console.log('📧 Email enviado para ambos:', {
        doador: response.data.data.destinatarios.doador,
        adotante: response.data.data.destinatarios.adotante
      });
      
      return response.data;
    } else {
      // 🔄 Formato legado - converter para o novo formato
      const legacyResponse = response.data as any as SendTermoEmailResponseLegacy;
      
      console.log('⚠️ Resposta no formato legado, convertendo...');
      
      // Converter para o formato esperado
      const convertedResponse: SendTermoEmailResponse = {
        message: legacyResponse.message,
        data: {
          termoId: legacyResponse.data.termoId,
          destinatarios: {
            doador: legacyResponse.data.destinatario, // Assumir que era para o doador
            adotante: legacyResponse.data.destinatario, // Mesmo email para ambos (temporário)
          },
          petNome: legacyResponse.data.petNome,
          dataEnvio: legacyResponse.data.dataEnvio,
        },
      };
      
      return convertedResponse;
    }
  } catch (error: any) {
    console.error('❌ Erro ao enviar termo por email:', error);

    // Tratamento de erros específicos
    if (error.response?.status === 401) {
      throw new Error('Sessão expirada. Faça login novamente.');
    }

    if (error.response?.status === 404) {
      throw new Error('Termo não encontrado no sistema.');
    }

    if (error.response?.status === 400) {
      const message = error.response.data?.message || '';
      
      if (message.includes('Emails não disponíveis')) {
        throw new Error('Um ou ambos os emails não estão disponíveis no sistema.');
      }
      
      if (message.includes('Email do adotante não encontrado')) {
        throw new Error('Email do adotante não está disponível.');
      }
      
      throw new Error('Dados inválidos para envio do email.');
    }

    if (error.response?.status === 500) {
      const message = error.response.data?.message || '';
      
      if (message.includes('Falha no envio')) {
        throw new Error('Falha no envio dos emails. Verifique os endereços e tente novamente.');
      }
      
      throw new Error('Erro interno do servidor ao enviar emails.');
    }

    // Erro de rede
    if (!error.response) {
      throw new Error('Erro de conexão. Verifique sua internet e tente novamente.');
    }

    // Erro genérico
    throw new Error('Erro ao enviar emails com o termo. Tente novamente.');
  }
};

/**
 * 🆕 Verificar status do último envio de email para um termo
 * @param termoId - ID do termo de compromisso
 * @returns Promise com informações do último envio
 */
export const checkEmailStatus = async (termoId: number): Promise<{
  lastSent?: string;
  recipients?: string[];
  status: 'sent' | 'pending' | 'failed' | 'not_sent';
}> => {
  try {
    console.log('🔍 Verificando status do email para termo:', termoId);

    const response = await api.get(`/termos-compromisso/${termoId}/email-status`);

    return response.data.data;
  } catch (error: any) {
    console.error('❌ Erro ao verificar status do email:', error);
    
    // Em caso de erro, assumir que não foi enviado
    return {
      status: 'not_sent'
    };
  }
};

/**
 * 🆕 Reenviar email para destinatários específicos
 * @param termoId - ID do termo de compromisso
 * @param recipients - Array com destinatários ('doador', 'adotante', ou ambos)
 * @returns Promise com dados de confirmação do reenvio
 */
export const resendTermoEmail = async (
  termoId: number, 
  recipients: ('doador' | 'adotante')[] = ['doador', 'adotante']
): Promise<SendTermoEmailResponse> => {
  try {
    console.log('📧 Reenviando termo por email:', { termoId, recipients });

    const response = await api.post<SendTermoEmailResponse>(`/termos-compromisso/${termoId}/reenviar-email`, {
      recipients
    });

    console.log('✅ Reenvio concluído:', response.data);

    return response.data;
  } catch (error: any) {
    console.error('❌ Erro ao reenviar termo por email:', error);

    if (error.response?.status === 401) {
      throw new Error('Sessão expirada. Faça login novamente.');
    }

    if (error.response?.status === 404) {
      throw new Error('Termo não encontrado no sistema.');
    }

    throw new Error('Erro ao reenviar emails com o termo.');
  }
};

// Exportar também tipos para uso em outros componentes
export type { SendTermoEmailResponse, SendTermoEmailResponseLegacy };

export default sendTermoEmail;