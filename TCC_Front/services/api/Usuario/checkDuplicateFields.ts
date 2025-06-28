import api from '../api';

// ✅ INTERFACE ATUALIZADA: documento em vez de cpf
export const checkDuplicateFields = async (userData: { 
  email?: string; 
  documento?: string; // ✅ ALTERADO: documento em vez de cpf
  telefone?: string;
}) => {
  try {
    // ✅ CORREÇÃO: Usando a rota correta do backend
    const response = await api.post('/usuarios/validar', {
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

    // Para outros erros, relança a exceção
    throw error;
  }
};

export const validateSingleField = async (field: string, value: string) => {
  try {
    const data: any = {};

    // Remove formatação se necessário
    if (field === 'documento' || field === 'telefone') { // ✅ ALTERADO: documento em vez de cpf
      data[field] = value.replace(/\D/g, '');
    } else {
      data[field] = value;
    }

    const response = await checkDuplicateFields(data);

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
export const checkDuplicateCpf = async (cpf: string) => {
  return await validateSingleField('documento', cpf);
};

// ✅ FUNÇÃO PARA COMPATIBILIDADE: Manter interface antiga
export const checkDuplicateFieldsLegacy = async (userData: { 
  email?: string; 
  cpf?: string; 
  telefone?: string;
}) => {
  // Converter para nova interface
  const newUserData = {
    email: userData.email,
    documento: userData.cpf, // cpf vira documento
    telefone: userData.telefone
  };
  
  return await checkDuplicateFields(newUserData);
};

export default checkDuplicateFields;