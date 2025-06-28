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
  isDataUpdate?: boolean; // ✅ NOVO: flag para indicar atualização de dados
}

interface CreateTermoDoacaoResponse {
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
    estado?: {
      nome: string;
    };
    cidade?: {
      nome: string;
    };
  };
  updated?: boolean; // ✅ NOVO: indica se foi atualização em vez de criação
}

// ✅ NOVA INTERFACE: Versão moderna com documento obrigatório
interface CreateTermoDoacaoResponseV2 {
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
    estado?: {
      nome: string;
    };
    cidade?: {
      nome: string;
    };
  };
  updated?: boolean;
}

/**
 * ✅ FUNÇÃO UTILITÁRIA: Normalizar resposta para garantir compatibilidade
 */
const normalizeCreateResponse = (data: any): CreateTermoDoacaoResponse['data'] => {
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

  return termo;
};

/**
 * 📝 Criar novo termo de responsabilidade de doação
 * @param data - Dados do termo a ser criado
 * @returns Promise com dados do termo criado
 */
export const createTermoDoacao = async (data: CreateTermoDoacaoRequest): Promise<CreateTermoDoacaoResponse> => {
  try {
    const response = await api.post<CreateTermoDoacaoResponse>('/termos-doacao', data);

    // Normalizar resposta para garantir compatibilidade
    const normalizedData = normalizeCreateResponse(response.data.data);

    return {
      ...response.data,
      data: normalizedData
    };
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

/**
 * ✅ NOVA FUNÇÃO: Criar termo com interface moderna (apenas documento)
 * @param data - Dados do termo a ser criado
 * @returns Promise com dados do termo criado usando interface V2
 */
export const createTermoDoacaoV2 = async (data: CreateTermoDoacaoRequest): Promise<CreateTermoDoacaoResponseV2> => {
  try {
    const response = await api.post<CreateTermoDoacaoResponseV2>('/termos-doacao', data);
    return response.data;
  } catch (error: any) {
    // Mesmo tratamento de erro da função original
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
      throw new Error('Erro no servidor ao criar termo. Tente novamente.');
    }

    if (!error.response) {
      throw new Error('Erro de conexão. Verifique sua internet e tente novamente.');
    }

    throw new Error('Erro ao criar termo de doação. Tente novamente.');
  }
};

/**
 * 🔄 NOVA FUNÇÃO: Atualizar termo com dados atualizados do usuário
 * @param data - Dados do termo com flag de atualização
 * @returns Promise com dados do termo atualizado
 */
export const updateTermoDoacao = async (data: CreateTermoDoacaoRequest & { isDataUpdate: true }): Promise<CreateTermoDoacaoResponse> => {
  try {
    // Garantir que a flag isDataUpdate está definida
    const requestData = { ...data, isDataUpdate: true };
    
    const response = await api.post<CreateTermoDoacaoResponse>('/termos-doacao', requestData);

    // Normalizar resposta para garantir compatibilidade
    const normalizedData = normalizeCreateResponse(response.data.data);

    return {
      ...response.data,
      data: normalizedData
    };
  } catch (error: any) {
    // Tratamento de erros específicos para atualização
    if (error.response?.status === 401) {
      throw new Error('Sessão expirada. Faça login novamente.');
    }

    if (error.response?.status === 400) {
      const message = error.response.data?.message || 'Dados inválidos';

      if (message.includes('Todos os compromissos devem ser aceitos')) {
        throw new Error('Todos os compromissos devem ser aceitos para atualizar o termo.');
      }

      throw new Error(message);
    }

    if (error.response?.status === 404) {
      throw new Error('Termo não encontrado para atualização.');
    }

    if (error.response?.status === 500) {
      throw new Error('Erro no servidor ao atualizar termo. Tente novamente.');
    }

    if (!error.response) {
      throw new Error('Erro de conexão. Verifique sua internet e tente novamente.');
    }

    throw new Error('Erro ao atualizar termo de doação. Tente novamente.');
  }
};

/**
 * 🔧 FUNÇÃO UTILITÁRIA: Extrair documento formatado da resposta
 */
export const getDocumentoFromResponse = (response: CreateTermoDoacaoResponse): string => {
  if (response.data.doador_documento) {
    return response.data.doador_documento;
  }
  
  // Fallback para compatibilidade
  if (response.data.doador_cpf) {
    return response.data.doador_cpf;
  }
  
  return 'Não informado';
};

/**
 * 🏷️ FUNÇÃO UTILITÁRIA: Obter tipo de documento da resposta
 */
export const getTipoDocumentoFromResponse = (response: CreateTermoDoacaoResponse): 'CPF' | 'CNPJ' | 'Desconhecido' => {
  if (response.data.doador_tipo_documento) {
    return response.data.doador_tipo_documento;
  }
  
  // Tentar detectar pelo formato se só tiver CPF
  const doc = response.data.doador_documento || response.data.doador_cpf || '';
  const numerico = doc.replace(/\D/g, '');
  
  if (numerico.length === 11) return 'CPF';
  if (numerico.length === 14) return 'CNPJ';
  
  return 'Desconhecido';
};

/**
 * ✅ FUNÇÃO PARA COMPATIBILIDADE: Interface antiga que espera apenas CPF
 */
export const createTermoDoacaoLegacy = async (data: CreateTermoDoacaoRequest): Promise<{
  message: string;
  data: {
    id: number;
    doador_nome: string;
    doador_email: string;
    doador_telefone?: string;
    doador_cpf: string; // Sempre presente na versão legacy
    motivo_doacao: string;
    condicoes_adocao?: string;
    observacoes?: string;
    assinatura_digital: string;
    data_assinatura: string;
    hash_documento: string;
    estado?: { nome: string };
    cidade?: { nome: string };
  };
  updated?: boolean;
}> => {
  const response = await createTermoDoacao(data);
  
  // Garantir que doador_cpf está presente para código legacy
  const legacyData = {
    ...response.data,
    doador_cpf: response.data.doador_cpf || response.data.doador_documento || 'Não informado'
  };
  
  return {
    ...response,
    data: legacyData
  };
};

export default createTermoDoacao;