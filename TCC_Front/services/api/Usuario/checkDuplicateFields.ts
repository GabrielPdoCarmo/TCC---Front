import api from '../api';

export const checkDuplicateFields = async (userData: { 
  email?: string; 
  cpf?: string; 
  telefone?: string;
}) => {
  try {
    // ✅ CORREÇÃO: Usando a rota correta do backend
    const response = await api.post('/usuarios/validar', {
      email: userData.email,
      cpf: userData.cpf?.replace(/\D/g, ''), // Remove formatação do CPF
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
    if (field === 'cpf' || field === 'telefone') {
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

export default checkDuplicateFields;