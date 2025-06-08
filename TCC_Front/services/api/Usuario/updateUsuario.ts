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

// Função para validar CPF (existente)
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

// FUNÇÃO: Validação de telefone
export const validateTelefone = (telefoneValue: string): { isValid: boolean; formattedTelefone?: string; errorMessage?: string } => {
  // Remove caracteres não numéricos
  const telefoneNumerico = telefoneValue.replace(/\D/g, '');
  
  if (!telefoneNumerico) {
    return { isValid: false, errorMessage: 'Telefone é obrigatório' };
  }
  
  // Verifica se tem pelo menos 10 dígitos (telefone fixo) ou 11 (celular)
  if (telefoneNumerico.length < 10 || telefoneNumerico.length > 11) {
    return { isValid: false, errorMessage: 'Telefone deve ter 10 ou 11 dígitos' };
  }
  
  if (telefoneNumerico.length === 11) {
    // Celular: deve começar com 9 no terceiro dígito
    const ddd = telefoneNumerico.substring(0, 2);
    const primeiroDigito = telefoneNumerico.substring(2, 3);
    
    // Valida DDD (11 a 99)
    if (parseInt(ddd) < 11 || parseInt(ddd) > 99) {
      return { isValid: false, errorMessage: 'DDD inválido' };
    }
    
    // Celular deve começar com 9
    if (primeiroDigito !== '9') {
      return { isValid: false, errorMessage: 'Número de celular deve começar com 9' };
    }
    
    // Formata: (11) 99999-9999
    const formatted = `(${ddd}) ${telefoneNumerico.substring(2, 7)}-${telefoneNumerico.substring(7)}`;
    
    return { isValid: true, formattedTelefone: formatted };
  } else if (telefoneNumerico.length === 10) {
    // Telefone fixo
    const ddd = telefoneNumerico.substring(0, 2);
    
    // Valida DDD (11 a 99)
    if (parseInt(ddd) < 11 || parseInt(ddd) > 99) {
      return { isValid: false, errorMessage: 'DDD inválido' };
    }
    
    // Formata: (11) 3333-4444
    const formatted = `(${ddd}) ${telefoneNumerico.substring(2, 6)}-${telefoneNumerico.substring(6)}`;
    
    return { isValid: true, formattedTelefone: formatted };
  }
  
  return { isValid: false, errorMessage: 'Número de telefone inválido' };
};

// NOVA FUNÇÃO: Validação granular de senha
export const validateSenha = (senha: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!senha) {
    errors.push('A senha é obrigatória');
    return { isValid: false, errors };
  }

  // Verificar se a senha tem pelo menos 8 caracteres
  if (senha.length < 8) {
    errors.push('A senha deve ter pelo menos 8 caracteres');
  }

  // Verificar se tem pelo menos uma letra minúscula
  if (!/[a-z]/.test(senha)) {
    errors.push('A senha deve possuir letras minúsculas');
  }

  // Verificar se tem pelo menos uma letra maiúscula
  if (!/[A-Z]/.test(senha)) {
    errors.push('A senha deve possuir letras maiúsculas');
  }

  // Verificar se tem pelo menos um caractere especial
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(senha)) {
    errors.push('A senha deve possuir caracteres especiais');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
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

    // Validar telefone se fornecido
    if (usuarioInfo.telefone) {
      const telefoneValidation = validateTelefone(usuarioInfo.telefone);
      
      if (!telefoneValidation.isValid) {
        throw new Error(telefoneValidation.errorMessage || 'Telefone inválido');
      }
      
      // Usar o telefone formatado
      const formattedTelefone = telefoneValidation.formattedTelefone;
      formData.append('telefone', formattedTelefone || usuarioInfo.telefone);
    }

    // NOVA VALIDAÇÃO GRANULAR: Validar senha se fornecida
    if (usuarioInfo.senha) {
      const senhaValidation = validateSenha(usuarioInfo.senha);
      
      if (!senhaValidation.isValid) {
        // Retornar erro com array de erros específicos
        throw {
          error: 'Senha inválida',
          message: senhaValidation.errors.join(', '),
          passwordErrors: senhaValidation.errors
        };
      }
    }

    // Adicionar campos ao FormData apenas se existirem
    if (usuarioInfo.nome) formData.append('nome', usuarioInfo.nome);
    if (usuarioInfo.email) formData.append('email', usuarioInfo.email);
    
    // Telefone já foi tratado acima, não precisa adicionar novamente aqui
    
    if (usuarioInfo.cidade_id !== undefined) formData.append('cidade_id', String(usuarioInfo.cidade_id));
    if (usuarioInfo.estado_id !== undefined) formData.append('estado_id', String(usuarioInfo.estado_id));
    
    // CRUCIAL: Enviar o CEP mesmo que seja uma string vazia
    if (usuarioInfo.cep !== undefined) formData.append('cep', usuarioInfo.cep);
    
    if (usuarioInfo.sexo_id) formData.append('sexo_id', String(usuarioInfo.sexo_id));
    if (usuarioInfo.senha) formData.append('senha', usuarioInfo.senha);

    // Log para depuração
    console.log('Enviando CEP para API:', usuarioInfo.cep);
    console.log('Telefone validado e formatado:', usuarioInfo.telefone);
    
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
  } catch (error: any) {
    console.error('Erro ao atualizar o usuário', error);
    
    // Se o erro já tem a estrutura de validação granular, propagar
    if (error.passwordErrors) {
      throw error;
    }
    
    // Para outros erros, manter comportamento original
    throw error;
  }
};

export default updateUsuario;