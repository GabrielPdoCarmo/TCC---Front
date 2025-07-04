// @/services/api/Usuario/checkDuplicateFieldsProfile.ts

import api from '../api';

// ✅ INTERFACE ATUALIZADA: documento em vez de cpf
// Função para verificar campos duplicados durante edição de perfil
export const checkDuplicateFieldsProfile = async (userData: {
  userId: number; // ID do usuário atual para excluir da verificação
  email?: string;
  documento?: string; // ✅ ALTERADO: documento em vez de cpf
  telefone?: string;
}) => {
  try {
    const response = await api.post('/usuarios/validar-edicao', {
      userId: userData.userId,
      email: userData.email,
      documento: userData.documento?.replace(/\D/g, ''), // ✅ ALTERADO: Remove formatação do documento
      telefone: userData.telefone?.replace(/\D/g, ''), // Remove formatação do telefone
    });

    return response.data;
  } catch (error: any) {
    // Se der erro 400, significa que há duplicação
    if (error.response?.status === 400) {
      return error.response.data;
    }

    // Outros erros, relança a exceção
    throw error;
  }
};

// Função para validar um campo específico durante edição (opcional - para validação em tempo real)
export const validateSingleFieldProfile = async (userId: number, field: string, value: string) => {
  try {
    const data: any = { userId };

    // Remove formatação se necessário
    if (field === 'documento' || field === 'telefone') { // ✅ ALTERADO: documento em vez de cpf
      data[field] = value.replace(/\D/g, '');
    } else {
      data[field] = value;
    }

    const response = await checkDuplicateFieldsProfile(data);

    // Retorna true se o campo está duplicado
    if (response.exists && response.duplicateFields?.includes(field)) {
      return true;
    }

    return false;
  } catch (error) {
    return false;
  }
};

// ✅ FUNÇÃO PARA COMPATIBILIDADE: Verificar CPF especificamente
export const validateCpfProfile = async (userId: number, cpf: string) => {
  return await validateSingleFieldProfile(userId, 'documento', cpf);
};

// ✅ FUNÇÃO PARA COMPATIBILIDADE: Manter interface antiga
export const checkDuplicateFieldsProfileLegacy = async (userData: {
  userId: number;
  email?: string;
  cpf?: string;
  telefone?: string;
}) => {
  // Converter para nova interface
  const newUserData = {
    userId: userData.userId,
    email: userData.email,
    documento: userData.cpf, // cpf vira documento
    telefone: userData.telefone
  };
  
  return await checkDuplicateFieldsProfile(newUserData);
};

export default checkDuplicateFieldsProfile;