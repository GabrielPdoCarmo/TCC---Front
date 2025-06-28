import api from '../api';
import axios from 'axios';
import { cpf, cnpj } from 'cpf-cnpj-validator';

interface ValidationResponse {
  exists?: boolean;
  [key: string]: any;
}

// ✅ INTERFACE ATUALIZADA: documento em vez de cpf
interface UsuarioData {
  nome: string;
  sexo_id: number;
  telefone: string;
  email: string;
  senha: string;
  documento: string; // ✅ ALTERADO: documento em vez de cpf
  cidade_id?: number; // cidade_id opcional porque pode ser preenchido pelo cep
  estado_id?: number;
  cep?: string; // cep opcional
  foto: string;
}

// ✅ NOVA FUNÇÃO: Validação de documento (CPF ou CNPJ)
function validarDocumento(documentoValue: string): { 
  isValid: boolean; 
  tipoDocumento?: 'CPF' | 'CNPJ';
  errorMessage?: string 
} {
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
}

export async function validarUsuario(usuarioData: UsuarioData): Promise<ValidationResponse> {
  const { senha, cep } = usuarioData;

  // Verificar se a senha foi fornecida
  if (!senha) {
    throw { error: 'Senha é obrigatória.' };
  }

  // Verificar se a senha tem pelo menos 12 caracteres
  if (senha.length < 12) {
    throw { error: 'Senha muito curta', message: 'A senha deve ter pelo menos 12 caracteres.' };
  }

  // Se o usuário NÃO informou cidade_id mas informou o cep, precisamos validar o cep
  if (!usuarioData.cidade_id && cep) {
    try {
      const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
      const endereco = response.data;

      if (endereco?.erro) {
        throw { error: 'CEP inválido ou não encontrado.' };
      }

      if (!endereco.uf || !endereco.localidade) {
        throw { error: 'Dados de endereço incompletos no CEP informado.' };
      }
    } catch (error) {
      throw { error: 'Erro ao validar o CEP.' };
    }
  }

  // Se nem cidade_id nem cep forem informados, aí dá erro
  if (!usuarioData.cidade_id && !cep) {
    throw { error: 'É necessário informar o Cidade ou o CEP.' };
  }

  // Validação dos outros campos obrigatórios
  if (!usuarioData.nome) {
    throw { error: 'Nome é obrigatório.' };
  }

  if (!usuarioData.sexo_id) {
    throw { error: 'Sexo é obrigatório.' };
  }

  if (!usuarioData.telefone) {
    throw { error: 'Telefone é obrigatório.' };
  }

  if (!usuarioData.email) {
    throw { error: 'Email é obrigatório.' };
  }

  // ✅ VALIDAÇÃO ATUALIZADA: Documento (CPF ou CNPJ)
  if (!usuarioData.documento) {
    throw { error: 'Documento (CPF ou CNPJ) é obrigatório.' };
  }

  const documentoValidation = validarDocumento(usuarioData.documento);
  if (!documentoValidation.isValid) {
    throw { 
      error: 'Documento inválido', 
      message: documentoValidation.errorMessage,
      tipoDocumento: documentoValidation.tipoDocumento
    };
  }

  // Retornar resposta de sucesso se tudo estiver válido
  return { 
    exists: false, 
    valid: true,
    tipoDocumento: documentoValidation.tipoDocumento
  };
}

// ✅ FUNÇÃO PARA COMPATIBILIDADE: Validar usuário com CPF (interface antiga)
export async function validarUsuarioLegacy(usuarioData: {
  nome: string;
  sexo_id: number;
  telefone: string;
  email: string;
  senha: string;
  cpf: string; // Interface antiga
  cidade_id?: number;
  estado_id?: number;
  cep?: string;
  foto: string;
}): Promise<ValidationResponse> {
  // Converter para nova interface
  const newUsuarioData: UsuarioData = {
    ...usuarioData,
    documento: usuarioData.cpf // cpf vira documento
  };
  
  return await validarUsuario(newUsuarioData);
}

export default validarUsuario;