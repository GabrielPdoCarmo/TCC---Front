import api from '../api';
export const getMeusDoacoes = async () => {
  try {
    const response = await api.get('/termos-compromisso/meus-doacoes');
    return response.data;
  } catch (error) {
    console.error('Erro ao carregar pets doados', error);
    throw error;
  }
};
export default getMeusDoacoes;
