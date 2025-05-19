import  api  from '../api';

export const getCidades_Estado = async (id: number, estado_id: number) => {
  try {
    // Faz a requisição para obter as cidades de um estado com base no id e estado_id
    const response = await api.get(`/cidades/${id}/${estado_id}`);

    // Verifica se a resposta tem os dados esperados
    if (!response.data || !Array.isArray(response.data)) {
      console.error('Resposta da API de cidades em formato inválido');
      return [];
    }

    // Retorna a lista de cidades ordenada pelo nome
    return response.data
      .map((cidade: { id: number; nome: string }) => {
        return { nome: cidade.nome, id: cidade.id };
      })
      .sort((a: { id: number; nome: string }, b: { id: number; nome: string }) => {
        return a.nome.localeCompare(b.nome); // Ordenação alfabética pela propriedade 'nome'
      });
  } catch (error) {
    // Caso ocorra algum erro durante a requisição, trata o erro e retorna um array vazio
    console.error('Erro ao carregar as cidades', error);
    return [];
  }
};
export default getCidades_Estado;