// OPÇÃO 1: Validação manual (mais simples, sem biblioteca externa)

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

// NOVA FUNÇÃO: Validação de telefone
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

// Função createUsuario ATUALIZADA
export const createUsuario = async (usuarioData: UsuarioPayload) => {
  try {
    // Validar CPF antes de enviar
    const cpfValidation = validateCpf(usuarioData.cpf);

    if (!cpfValidation.isValid) {
      throw new Error(cpfValidation.errorMessage);
    }

    // NOVA VALIDAÇÃO: Validar telefone antes de enviar
    const telefoneValidation = validateTelefone(usuarioData.telefone);

    if (!telefoneValidation.isValid) {
      throw new Error(telefoneValidation.errorMessage);
    }

    // Usando o CPF e telefone formatados
    const formattedCpf = cpfValidation.formattedCpf;
    const formattedTelefone = telefoneValidation.formattedTelefone;

    const formData = new FormData();

    formData.append('nome', usuarioData.nome);
    formData.append('sexo_id', String(usuarioData.sexo_id));
    formData.append('telefone', formattedTelefone || usuarioData.telefone); // Usa o telefone formatado
    formData.append('email', usuarioData.email);
    formData.append('senha', usuarioData.senha);
    formData.append('cpf', formattedCpf || usuarioData.cpf);
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
  } catch (error) {
    throw error || { error: 'Erro ao criar usuário' };
  }
};

export default createUsuario;
