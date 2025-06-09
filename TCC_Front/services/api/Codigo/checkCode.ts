import api from '../api';

export const checkCode = async (email: string, codigo: string) => {
  try {
    const response = await api.post(`/usuarios/recuperar-senha/checkCode`, {
      email,
      codigo,
    });

    return response.data;
  } catch (error: any) {
    if (error?.response?.data) {
      throw error.response.data;
    }

    throw new Error('Código inválido ou expirado');
  }
};

export default checkCode;
