import api from "../api";

export const sendRecoveryCode = async (email: string) => {
  try {
    console.log(`Enviando código de recuperação para o email: ${email}`);
    const response = await api.post(`/usuarios/recuperar-senha/sendRecoveryCode`, {
      email
    });
    
    return response.data;
  } catch (error: any) {
    console.error(`Erro ao enviar código de recuperação para ${email}:`, error);
    
    if (error?.response?.data) {
      throw error.response.data;
    }
    
    throw new Error("Falha ao enviar o código de recuperação");
  }
};

export default sendRecoveryCode;