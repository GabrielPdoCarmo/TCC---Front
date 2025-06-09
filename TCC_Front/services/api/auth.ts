import api from '../api/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Usuario {
  id: number;
  nome: string;
  email: string;
  foto?: string;
}

interface LoginResponse {
  message: string;
  token: string;
  usuario: Usuario;
}

interface CustomError {
  error: string;
}

export const login = async (email: string, senha: string): Promise<LoginResponse> => {
  try {
    const response = await api.post('/auth/login', { email, senha });
    const responseData = response.data as LoginResponse;

    if (!responseData || !responseData.token || !responseData.usuario) {
      throw new Error('Resposta de login inválida');
    }

    // ✅ Usar as mesmas chaves do AuthContext
    await Promise.all([
      AsyncStorage.setItem('@App:token', responseData.token),
      AsyncStorage.setItem('@App:userId', responseData.usuario.id.toString()),
      AsyncStorage.setItem('@App:userData', JSON.stringify(responseData.usuario)),
    ]);

    return responseData;
  } catch (error: unknown) {
    if (
      error &&
      typeof error === 'object' &&
      'response' in error &&
      error.response &&
      typeof error.response === 'object' &&
      'data' in error.response
    ) {
      const errorResponse = error.response.data as any;
      const errorMessage = errorResponse.message || 'Erro ao fazer login';
      throw { error: errorMessage } as CustomError;
    }

    if (error instanceof Error) {
      throw { error: error.message } as CustomError;
    }

    throw { error: 'Erro ao fazer login. Verifique se seu E-mail ou senha estão corretos' } as CustomError;
  }
};

export default login;
