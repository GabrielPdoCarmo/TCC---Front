import api from '../api';
import { cpf, cnpj } from 'cpf-cnpj-validator';
import validator from 'validator';

interface UsuarioPayload {
  nome: string;
  sexo_id: number;
  telefone: string;
  email: string;
  senha: string;
  documento: string; // ✅ ALTERADO: documento em vez de cpf
  cidade_id: number;
  estado_id?: number;
  cep?: string;
  foto?: File | null;
}

// ✅ NOVA FUNÇÃO: Validação de documento (CPF ou CNPJ)
export const validateDocumento = (documentoValue: string): { 
  isValid: boolean; 
  formattedDocumento?: string; 
  tipoDocumento?: 'CPF' | 'CNPJ';
  errorMessage?: string 
} => {
  // Remove caracteres não numéricos
  const documentoNumerico = documentoValue.replace(/\D/g, '');

  if (!documentoNumerico) {
    return { isValid: false, errorMessage: 'Documento é obrigatório' };
  }

  // Verificar se é CPF (11 dígitos)
  if (documentoNumerico.length === 11) {
    if (cpf.isValid(documentoNumerico)) {
      return { 
        isValid: true, 
        formattedDocumento: cpf.format(documentoNumerico),
        tipoDocumento: 'CPF'
      };
    } else {
      return { isValid: false, errorMessage: 'CPF inválido' };
    }
  }
  // Verificar se é CNPJ (14 dígitos)
  else if (documentoNumerico.length === 14) {
    if (cnpj.isValid(documentoNumerico)) {
      return { 
        isValid: true, 
        formattedDocumento: cnpj.format(documentoNumerico),
        tipoDocumento: 'CNPJ'
      };
    } else {
      return { isValid: false, errorMessage: 'CNPJ inválido' };
    }
  }
  // Comprimento inválido
  else {
    return { 
      isValid: false, 
      errorMessage: 'Documento deve ter 11 dígitos (CPF) ou 14 dígitos (CNPJ)' 
    };
  }
};

// Função para validar telefone (mantida igual)
export const validateTelefone = (
  telefoneValue: string
): { isValid: boolean; formattedTelefone?: string; errorMessage?: string } => {
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

// FUNÇÃO ATUALIZADA: Validação granular de email usando validator
export const validateEmail = (email: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!email) {
    errors.push('O e-mail é obrigatório');
    return { isValid: false, errors };
  }

  // Usar validator.js para validação principal
  if (!validator.isEmail(email)) {
    errors.push('Formato de e-mail inválido');
  }

  // Validar tamanho usando validator
  if (!validator.isLength(email, { min: 3, max: 254 })) {
    if (email.length < 3) {
      errors.push('O e-mail é muito curto (mínimo 3 caracteres)');
    } else {
      errors.push('O e-mail é muito longo (máximo 254 caracteres)');
    }
  }

  // Verificar se não tem espaços
  if (email.includes(' ')) {
    errors.push('E-mail não pode conter espaços');
  }

  // Verificações específicas de domínio
  if (email.includes('@')) {
    const [localPart, domain] = email.split('@');
    
    // Verificar parte local
    if (localPart.length > 64) {
      errors.push('Parte local do e-mail é muito longa (máximo 64 caracteres)');
    }

    // Verificar domínio usando validator
    if (domain.length > 253) {
      errors.push('Domínio do e-mail é muito longo (máximo 253 caracteres)');
    }

    // Verificar se é um FQDN válido
    if (!validator.isFQDN(domain)) {
      errors.push('Domínio inválido');
    }

    // Verificar se não tem partes vazias no domínio
    const domainParts = domain.split('.');
    if (domainParts.some(part => part.length === 0)) {
      errors.push('Domínio não pode ter partes vazias');
    }

    // Verificar TLD
    const tld = domainParts[domainParts.length - 1];
    if (tld && tld.length < 2) {
      errors.push('Extensão do domínio deve ter pelo menos 2 caracteres');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validação granular de senha (mantida igual)
export const validateSenha = (senha: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!senha) {
    errors.push('A senha é obrigatória');
    return { isValid: false, errors };
  }

  if (senha.length < 8) {
    errors.push('A senha deve ter pelo menos 8 caracteres');
  }

  if (!/[a-z]/.test(senha)) {
    errors.push('A senha deve possuir letras minúsculas');
  }

  if (!/[A-Z]/.test(senha)) {
    errors.push('A senha deve possuir letras maiúsculas');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(senha)) {
    errors.push('A senha deve possuir caracteres especiais');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Função createUsuario ATUALIZADA com validação de documento
export const createUsuario = async (usuarioData: UsuarioPayload) => {
  try {
    // VALIDAÇÃO ATUALIZADA: Usar validator para email
    const emailValidation = validateEmail(usuarioData.email);

    if (!emailValidation.isValid) {
      // Retornar erro com array de erros específicos
      throw {
        error: 'E-mail inválido',
        message: emailValidation.errors.join(', '),
        emailErrors: emailValidation.errors
      };
    }

    // Validação de senha (mantida igual)
    const senhaValidation = validateSenha(usuarioData.senha);

    if (!senhaValidation.isValid) {
      // Retornar erro com array de erros específicos
      throw {
        error: 'Senha inválida',
        message: senhaValidation.errors.join(', '),
        passwordErrors: senhaValidation.errors
      };
    }

    // ✅ VALIDAR DOCUMENTO (CPF ou CNPJ)
    const documentoValidation = validateDocumento(usuarioData.documento);
    if (!documentoValidation.isValid) {
      throw {
        error: 'Documento inválido',
        message: documentoValidation.errorMessage,
        documentoErrors: [documentoValidation.errorMessage]
      };
    }

    // Validar telefone
    const telefoneValidation = validateTelefone(usuarioData.telefone);
    if (!telefoneValidation.isValid) {
      throw new Error(telefoneValidation.errorMessage);
    }

    const formattedDocumento = documentoValidation.formattedDocumento;
    const formattedTelefone = telefoneValidation.formattedTelefone;

    const formData = new FormData();

    formData.append('nome', usuarioData.nome);
    formData.append('sexo_id', String(usuarioData.sexo_id));
    formData.append('telefone', formattedTelefone || usuarioData.telefone);
    formData.append('email', usuarioData.email); // Email já validado com validator
    formData.append('senha', usuarioData.senha);
    formData.append('documento', formattedDocumento || usuarioData.documento); // ✅ ALTERADO
    formData.append('cidade_id', String(usuarioData.cidade_id));
    formData.append('estado_id', String(usuarioData.estado_id));

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
  } catch (error: any) {
    // Se o erro já tem a estrutura de validação granular, propagar
    if (error.passwordErrors || error.emailErrors || error.documentoErrors) {
      throw error;
    }
    
    // Para outros erros, manter comportamento original
    throw error || { error: 'Erro ao criar usuário' };
  }
};

// ✅ MANTER COMPATIBILIDADE: Função validateCpf para uso existente
export const validateCpf = (cpfValue: string): { isValid: boolean; formattedCpf?: string; errorMessage?: string } => {
  const documentoValidation = validateDocumento(cpfValue);
  
  if (documentoValidation.isValid && documentoValidation.tipoDocumento === 'CPF') {
    return {
      isValid: true,
      formattedCpf: documentoValidation.formattedDocumento
    };
  }
  
  return {
    isValid: false,
    errorMessage: documentoValidation.errorMessage || 'CPF inválido'
  };
};

export default createUsuario;