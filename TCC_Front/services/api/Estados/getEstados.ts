import  api  from '../api';
export const getEstados = async () => {
  try {
    const response = await api.get('/estados');
    return response.data
      .map((estado: { id: number; nome: string }) => {
        return { nome: estado.nome, id: estado.id };
      })
      .sort((a: { id: number; nome: string }, b: { id: number; nome: string }) => {
        return a.nome.localeCompare(b.nome); // Ordenação alfabética pela propriedade 'nome'
      });
  } catch (error) {
    console.error('Erro ao carregar os estados', error);
    return [];
  }
};
export default getEstados;