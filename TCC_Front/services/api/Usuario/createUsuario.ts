import api from '../api';
import { cpf } from 'cpf-cnpj-validator';

interface UsuarioPayload {
  nome: string;
  sexo_id: number;
  telefone: string;
  email: string;
  senha: string;
  cpf: string;
  cidade_id: number;
  estado_id?: number; 
  cep?: string;
  foto?: File | null;
}

// Função para validar CPF
export const validateCpf = (cpfValue: string): { isValid: boolean; formattedCpf?: string; errorMessage?: string } => {
  // Remove caracteres não numéricos
  const cpfNumerico = cpfValue.replace(/\D/g, '');
  
  if (!cpfNumerico) {
    return { isValid: false, errorMessage: 'CPF é obrigatório' };
  }
  
  if (!cpf.isValid(cpfNumerico)) {
    return { isValid: false, errorMessage: 'CPF inválido' };
  }
  
  // CPF válido, retornar formatado
  return { isValid: true, formattedCpf: cpf.format(cpfNumerico) };
};

export const createUsuario = async (usuarioData: UsuarioPayload) => {
  try {
    // Validar CPF antes de enviar
    const cpfValidation = validateCpf(usuarioData.cpf);
    
    if (!cpfValidation.isValid) {
      throw new Error(cpfValidation.errorMessage);
    }
    
    // Usando o CPF formatado
    const formattedCpf = cpfValidation.formattedCpf;
    
    const formData = new FormData();
    
    formData.append('nome', usuarioData.nome);
    formData.append('sexo_id', String(usuarioData.sexo_id));
    formData.append('telefone', usuarioData.telefone);
    formData.append('email', usuarioData.email);
    formData.append('senha', usuarioData.senha);
    formData.append('cpf', formattedCpf || usuarioData.cpf); // Usa o CPF formatado ou original
    formData.append('cidade_id', String(usuarioData.cidade_id));
    formData.append('estado_id', String(usuarioData.estado_id)); // Envia string vazia se estado_id for nulo
    
    if (usuarioData.cep) {
      formData.append('cep', usuarioData.cep);
    }
    
    if (usuarioData.foto) {
      formData.append('foto', usuarioData.foto);
    }
    
    const response = await api.post('/usuarios', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Erro ao cadastrar o usuário', error);
    throw error || { error: 'Erro ao criar usuário' };
  }
};

export default createUsuario;