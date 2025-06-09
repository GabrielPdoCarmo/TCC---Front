// services/api/Termo/getTermoByPet.ts - Versão Melhorada

import api from '../api';

interface TermoData {
  id: number;
  pet_nome: string;
  pet_raca_nome: string;
  pet_especie_nome: string;
  pet_sexo_nome: string;
  pet_idade: number;
  doador_nome: string;
  doador_email: string;
  doador_telefone?: string;
  adotante_nome: string;
  adotante_email: string;
  adotante_telefone?: string;
  assinatura_digital: string;
  data_assinatura: string;
  observacoes?: string;
  hash_documento: string;
}

interface GetTermoResponse {
  message: string;
  data: TermoData;
}

/**
 * 🔍 Buscar termo de compromisso por ID do pet
 * @param petId - ID do pet
 * @returns Promise com dados do termo ou null se não existir
 */
export const getTermoByPet = async (petId: number): Promise<GetTermoResponse | null> => {
  try {
    const response = await api.get<GetTermoResponse>(`/termos-compromisso/pet/${petId}`);

    return response.data;
  } catch (error: any) {
    // 🔧 Tratar erro 404 como caso normal (termo não existe)
    if (error.response?.status === 404) {
      return null;
    }

    // 🔧 Para outros erros, logar apenas se não for 404
    if (error.response?.status === 401) {
      throw new Error('Sessão expirada. Faça login novamente.');
    }

    // Outros erros inesperados

    throw error;
  }
};

export default getTermoByPet;
