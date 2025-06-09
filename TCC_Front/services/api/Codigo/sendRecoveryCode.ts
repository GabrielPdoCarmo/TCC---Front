import api from '../api';

export const sendRecoveryCode = async (email: string) => {
  try {
    const response = await api.post(`/usuarios/recuperar-senha/sendRecoveryCode`, {
      email,
    });

    return response.data;
  } catch (error: any) {
    if (error?.response?.data) {
      throw error.response.data;
    }

    throw new Error('Falha ao enviar o código de recuperação');
  }
};

export default sendRecoveryCode;
