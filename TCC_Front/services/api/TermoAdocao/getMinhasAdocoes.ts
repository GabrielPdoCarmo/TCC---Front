import api from '../api';

export const getMinhasAdocoes = async () => {
  try {
    const response = await api.get('/termos-compromisso/minhas-adocoes');
    return response.data;
  } catch (error) {
    console.error('Erro ao carregar pets adotados', error);
    throw error;
  }
};
export default getMinhasAdocoes;
