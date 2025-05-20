import api from '../api';
import { cpf } from 'cpf-cnpj-validator';

interface UsuarioUpdatePayload {
  id: number;
  nome?: string;
  email?: string;
  cpf?: string;
  sexo_id?: number;
  telefone?: string;
  cidade_id?: number;
  estado_id?: number;
  cep?: string;
  foto?: any; // Arquivo de imagem
  senha?: string; // Adicionando senha como opcional
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

export const updateUsuario = async (usuarioData: UsuarioUpdatePayload) => {
  try {
    const { id, ...usuarioInfo } = usuarioData;
    const formData = new FormData();

    // Validar CPF se fornecido
    if (usuarioInfo.cpf) {
      const cpfValidation = validateCpf(usuarioInfo.cpf);
      
      if (!cpfValidation.isValid) {
        throw new Error(cpfValidation.errorMessage || 'CPF inválido');
      }
      
      // Usar o CPF formatado
      const formattedCpf = cpfValidation.formattedCpf;
      formData.append('cpf', formattedCpf || usuarioInfo.cpf);
    }

    // Adicionar campos ao FormData apenas se existirem
    if (usuarioInfo.nome) formData.append('nome', usuarioInfo.nome);
    if (usuarioInfo.email) formData.append('email', usuarioInfo.email);
    if (usuarioInfo.telefone) formData.append('telefone', usuarioInfo.telefone);
    
    if (usuarioInfo.cidade_id !== undefined) formData.append('cidade_id', String(usuarioInfo.cidade_id));
    if (usuarioInfo.estado_id !== undefined) formData.append('estado_id', String(usuarioInfo.estado_id));
    
    // CRUCIAL: Enviar o CEP mesmo que seja uma string vazia
    if (usuarioInfo.cep !== undefined) formData.append('cep', usuarioInfo.cep);
    
    if (usuarioInfo.sexo_id) formData.append('sexo_id', String(usuarioInfo.sexo_id));
    if (usuarioInfo.senha) formData.append('senha', usuarioInfo.senha);

    // Log para depuração
    console.log('Enviando CEP para API:', usuarioInfo.cep);
    
    // Adicionar foto se existir
    if (usuarioInfo.foto) {
      formData.append('foto', usuarioInfo.foto);
    }

    const response = await api.put(`/usuarios/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Erro ao atualizar o usuário', error);
    throw error;
  }
};

export default updateUsuario;