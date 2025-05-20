import api from '../api';
import axios from 'axios';
interface ValidationResponse {
  exists?: boolean;
  [key: string]: any;
}

interface UsuarioData {
  nome: string;
  sexo_id: number;
  telefone: string;
  email: string;
  senha: string;
  cpf: string;
  cidade_id?: number; // cidade_id opcional porque pode ser preenchido pelo cep
  estado_id?: number; //
  cep?: string; // cep opcional
  foto: string;
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

  if (!usuarioData.cpf) {
    throw { error: 'CPF é obrigatório.' };
  }

  // Retornar resposta de sucesso se tudo estiver válido
  return { exists: false, valid: true };
}
export default validarUsuario;
