import api from '../api';

export const getByUsuarioEmail = async (email: string) => {
  try {
    // Usar o novo formato de rota "/email/:email" e codificar o email para lidar com caracteres especiais
    const encodedEmail = encodeURIComponent(email);
    const response = await api.get(`/usuarios/email/${encodedEmail}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export default getByUsuarioEmail;
