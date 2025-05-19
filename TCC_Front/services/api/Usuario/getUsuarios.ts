import api from "../api";

export const getUsuarios = async () => {
  try {
    const response = await api.get('/usuarios'); // Rota correta para listar todos
    return response.data.map((usuario: { id: number; nome: string; cidade_id: number }) => ({
      id: usuario.id,
      nome: usuario.nome,
      cidade_id: usuario.cidade_id,
    }));
  } catch (error) {
    console.error('Erro ao carregar os usuários', error);
    return [];
  }
};
export default getUsuarios;