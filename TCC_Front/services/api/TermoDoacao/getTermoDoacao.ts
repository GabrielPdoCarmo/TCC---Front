// services/api/TermoDoacao/getTermoDoacao.ts

import api from '../api';

interface GetTermoDoacaoResponse {
  message: string;
  data: {
    id: number;
    doador_nome: string;
    doador_email: string;
    doador_telefone?: string;
    doador_documento?: string; // ✅ NOVO: documento (CPF/CNPJ)
    doador_tipo_documento?: 'CPF' | 'CNPJ'; // ✅ NOVO: tipo do documento
    doador_cpf?: string; // ✅ DEPRECATED: manter para compatibilidade
    motivo_doacao: string;
    condicoes_adocao?: string;
    observacoes?: string;
    assinatura_digital: string;
    data_assinatura: string;
    hash_documento: string;
    data_envio_pdf?: string;
    estado?: {
      id: number;
      nome: string;
    };
    cidade?: {
      id: number;
      nome: string;
    };
    doador?: {
      id: number;
      nome: string;
      email: string;
      telefone?: string;
      documento?: string; // ✅ NOVO: documento no objeto doador
      tipo_documento?: 'CPF' | 'CNPJ'; // ✅ NOVO: tipo do documento
    };
  };
  canCreatePets: boolean;
}

// ✅ NOVA INTERFACE: Versão atual com documento
interface GetTermoDoacaoResponseV2 {
  message: string;
  data: {
    id: number;
    doador_nome: string;
    doador_email: string;
    doador_telefone?: string;
    doador_documento: string; // Campo obrigatório na nova versão
    doador_tipo_documento: 'CPF' | 'CNPJ'; // Campo obrigatório na nova versão
    motivo_doacao: string;
    condicoes_adocao?: string;
    observacoes?: string;
    assinatura_digital: string;
    data_assinatura: string;
    hash_documento: string;
    data_envio_pdf?: string;
    estado?: {
      id: number;
      nome: string;
    };
    cidade?: {
      id: number;
      nome: string;
    };
    doador?: {
      id: number;
      nome: string;
      email: string;
      telefone?: string;
      documento: string;
      tipo_documento: 'CPF' | 'CNPJ';
    };
  };
  canCreatePets: boolean;
}

/**
 * ✅ FUNÇÃO UTILITÁRIA: Normalizar resposta para garantir compatibilidade
 */
const normalizeTermoResponse = (data: any): GetTermoDoacaoResponse['data'] => {
  const termo = { ...data };

  // Se tem documento mas não tem CPF (resposta nova), criar CPF para compatibilidade
  if (termo.doador_documento && !termo.doador_cpf && termo.doador_tipo_documento === 'CPF') {
    termo.doador_cpf = termo.doador_documento;
  }

  // Se tem CPF mas não tem documento (resposta antiga), criar documento
  if (termo.doador_cpf && !termo.doador_documento) {
    termo.doador_documento = termo.doador_cpf;
    termo.doador_tipo_documento = 'CPF';
  }

  // Normalizar objeto doador se existir
  if (termo.doador) {
    // Compatibilidade para o objeto doador
    if (termo.doador.documento && termo.doador.tipo_documento === 'CPF' && !termo.doador.cpf) {
      termo.doador.cpf = termo.doador.documento;
    }
    if (termo.doador.cpf && !termo.doador.documento) {
      termo.doador.documento = termo.doador.cpf;
      termo.doador.tipo_documento = 'CPF';
    }
  }

  return termo;
};

/**
 * 📄 Buscar termo de responsabilidade de doação do usuário logado
 * @returns Promise com dados do termo do usuário
 */
export const getTermoDoacao = async (): Promise<GetTermoDoacaoResponse> => {
  try {
    const response = await api.get<GetTermoDoacaoResponse>('/termos-doacao/meu-termo');

    // Normalizar resposta para garantir compatibilidade
    const normalizedData = normalizeTermoResponse(response.data.data);

    return {
      ...response.data,
      data: normalizedData
    };
  } catch (error: any) {
    // Tratamento de erros específicos
    if (error.response?.status === 401) {
      throw new Error('Sessão expirada. Faça login novamente.');
    }

    if (error.response?.status === 404) {
      const message = error.response.data?.message || '';
      if (message.includes('não possui um termo')) {
        throw new Error('Você ainda não possui um termo de responsabilidade de doação.');
      }
      throw new Error('Termo não encontrado.');
    }

    if (error.response?.status === 500) {
      throw new Error('Erro no servidor ao buscar termo. Tente novamente.');
    }

    // Erro de rede
    if (!error.response) {
      throw new Error('Erro de conexão. Verifique sua internet e tente novamente.');
    }

    // Erro genérico
    throw new Error('Erro ao buscar termo de doação. Tente novamente.');
  }
};

/**
 * 📄 Buscar termo de doação por ID específico
 * @param termoId - ID do termo a ser buscado
 * @returns Promise com dados do termo
 */
export const getTermoDoacaoById = async (termoId: number): Promise<GetTermoDoacaoResponse> => {
  try {
    const response = await api.get<GetTermoDoacaoResponse>(`/termos-doacao/${termoId}`);

    // Normalizar resposta para garantir compatibilidade
    const normalizedData = normalizeTermoResponse(response.data.data);

    return {
      ...response.data,
      data: normalizedData
    };
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error('Sessão expirada. Faça login novamente.');
    }

    if (error.response?.status === 404) {
      throw new Error('Termo não encontrado.');
    }

    if (error.response?.status === 403) {
      throw new Error('Você não tem permissão para acessar este termo.');
    }

    if (error.response?.status === 500) {
      throw new Error('Erro no servidor ao buscar termo. Tente novamente.');
    }

    if (!error.response) {
      throw new Error('Erro de conexão. Verifique sua internet e tente novamente.');
    }

    throw new Error('Erro ao buscar termo de doação. Tente novamente.');
  }
};

/**
 * 📚 Buscar histórico de termos do usuário
 * @returns Promise com lista de termos do usuário
 */
export const getHistoricoTermos = async (): Promise<{
  message: string;
  data: GetTermoDoacaoResponse['data'][];
  total: number;
}> => {
  try {
    const response = await api.get<{
      message: string;
      data: GetTermoDoacaoResponse['data'][];
      total: number;
    }>('/termos-doacao/meu-historico');

    // Normalizar cada termo no histórico
    const normalizedData = response.data.data.map(termo => normalizeTermoResponse(termo));

    return {
      ...response.data,
      data: normalizedData
    };
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error('Sessão expirada. Faça login novamente.');
    }

    if (error.response?.status === 500) {
      throw new Error('Erro no servidor ao buscar histórico. Tente novamente.');
    }

    if (!error.response) {
      throw new Error('Erro de conexão. Verifique sua internet e tente novamente.');
    }

    throw new Error('Erro ao buscar histórico de termos. Tente novamente.');
  }
};

/**
 * ✅ NOVA FUNÇÃO: Buscar termo com interface moderna (apenas documento)
 * @returns Promise com dados do termo usando interface V2
 */
export const getTermoDoacaoV2 = async (): Promise<GetTermoDoacaoResponseV2> => {
  try {
    const response = await api.get<GetTermoDoacaoResponseV2>('/termos-doacao/meu-termo');
    return response.data;
  } catch (error: any) {
    // Mesmo tratamento de erro da função original
    if (error.response?.status === 401) {
      throw new Error('Sessão expirada. Faça login novamente.');
    }

    if (error.response?.status === 404) {
      const message = error.response.data?.message || '';
      if (message.includes('não possui um termo')) {
        throw new Error('Você ainda não possui um termo de responsabilidade de doação.');
      }
      throw new Error('Termo não encontrado.');
    }

    if (error.response?.status === 500) {
      throw new Error('Erro no servidor ao buscar termo. Tente novamente.');
    }

    if (!error.response) {
      throw new Error('Erro de conexão. Verifique sua internet e tente novamente.');
    }

    throw new Error('Erro ao buscar termo de doação. Tente novamente.');
  }
};

/**
 * 🔧 FUNÇÃO UTILITÁRIA: Extrair documento formatado do termo
 */
export const getDocumentoFormatado = (termo: GetTermoDoacaoResponse['data']): string => {
  if (termo.doador_documento) {
    return termo.doador_documento;
  }
  
  // Fallback para compatibilidade
  if (termo.doador_cpf) {
    return termo.doador_cpf;
  }
  
  return 'Não informado';
};

/**
 * 🏷️ FUNÇÃO UTILITÁRIA: Obter tipo de documento
 */
export const getTipoDocumento = (termo: GetTermoDoacaoResponse['data']): 'CPF' | 'CNPJ' | 'Desconhecido' => {
  if (termo.doador_tipo_documento) {
    return termo.doador_tipo_documento;
  }
  
  // Tentar detectar pelo formato se só tiver CPF
  if (termo.doador_cpf || termo.doador_documento) {
    const doc = termo.doador_documento || termo.doador_cpf || '';
    const numerico = doc.replace(/\D/g, '');
    
    if (numerico.length === 11) return 'CPF';
    if (numerico.length === 14) return 'CNPJ';
  }
  
  return 'Desconhecido';
};

export default getTermoDoacao;