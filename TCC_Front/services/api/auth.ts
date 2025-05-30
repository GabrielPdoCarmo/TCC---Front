import api from '../api/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Usuario {
  id: number;
  nome: string;
  email: string;
  foto?: string; // Adicionado campo para a URL da foto
}

interface LoginResponse {
  message: string;
  token: string;
  usuario: Usuario;
}

interface ApiErrorResponse {
  message?: string;
  [key: string]: any;
}

// Estrutura de erro personalizada que lançamos
interface CustomError {
  error: string;
}

export const login = async (email: string, senha: string): Promise<LoginResponse> => {
  try {
    const response = await api.post('/auth/login', { email, senha });
    const responseData = response.data as LoginResponse;
    console.log('Resposta do login:', responseData);

    // Verifica se temos os dados necessários
    if (!responseData || !responseData.token || !responseData.usuario) {
      throw new Error('Resposta de login inválida');
    }

    // Armazenar o token no AsyncStorage
    await AsyncStorage.setItem('@App:token', responseData.token);

    // Armazenar os dados do usuário no AsyncStorage
    await AsyncStorage.setItem('@App:user', JSON.stringify(responseData.usuario));

    // Armazenar a URL da foto se existir
    if (responseData.usuario.foto) {
      await AsyncStorage.setItem('@App:userPhoto', responseData.usuario.foto);
    }

    // Armazenar o ID do usuário separadamente
    if (responseData.usuario.id) {
      await AsyncStorage.setItem('@App:userId', responseData.usuario.id.toString());

      // Verificação de confirmação após salvar
      const savedId = await AsyncStorage.getItem('@App:userId');
      console.log('ID do usuário confirmado salvo:', savedId);
    }

    // Retornar o objeto conforme recebido
    return responseData;
  } catch (error: unknown) {
    console.error('Erro de login:', error);

    api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('@App:token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
    // Verifica se é um erro com resposta do servidor
    if (
      error &&
      typeof error === 'object' &&
      'response' in error &&
      error.response &&
      typeof error.response === 'object' &&
      'data' in error.response
    ) {
      const errorResponse = error.response.data as ApiErrorResponse;
      const errorMessage = errorResponse.message || 'Erro ao fazer login';
      throw { error: errorMessage } as CustomError;
    }

    // Se for um Error padrão
    if (error instanceof Error) {
      throw { error: error.message } as CustomError;
    }

    // Erro genérico ou de rede
    throw { error: 'Erro ao fazer login. Verifique se seu E-mail ou senha estão corretos' } as CustomError;
  }
};

export default login;
