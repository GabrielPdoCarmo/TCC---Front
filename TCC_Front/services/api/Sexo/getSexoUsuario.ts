import api from '../api';
export const getSexoUsuario = async () => {
  try {
    const response = await api.get('/sexoUsuario');

    return response.data.map((sexo: { id: number; descricao: string }) => ({
      id: sexo.id,
      descricao: sexo.descricao,
    }));
  } catch (error: any) {
    console.error('Erro completo:', error);
    return [];
  }
};
export default getSexoUsuario;
