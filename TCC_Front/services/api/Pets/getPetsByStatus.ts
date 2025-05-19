import api from '../api';

export const getPetsByStatus = async () => {
  try {
    const status_id = 2; // Status fixo, apenas status 2 é permitido
    const response = await api.get('/pets/status/:status_id', {
      params: { status_id },
    });

    return response.data
      .map((pet: any) => {
        return { ...pet }; // Retorna todos os dados do pet
      })
      .sort((a: any, b: any) => {
        // Assumindo que os pets têm uma propriedade 'nome' para ordenação
        return a.nome.localeCompare(b.nome); // Ordenação alfabética pela propriedade 'nome'
      });
  } catch (error) {
    console.error('Erro ao carregar os pets por status:', error);
    return [];
  }
};
export default getPetsByStatus;