import api from '../api';

type Cidade = {
  id: number;
  nome: string;
};
export const getCidadesPorEstadoID = async (estadoID: number): Promise<Cidade[]> => {
  try {
    const estadosResponse = await api.get('/estados');

    // Converter ID para número para garantir consistência
    const estadoIdNumerico = Number(estadoID);

    const estado = estadosResponse.data.find((e: { nome: string; id: number }) => Number(e.id) === estadoIdNumerico);

    if (!estado) {
      return [];
    }

    // Use o ID do estado encontrado
    const response = await api.get(`/cidades/${estado.id}`);

    const cidades = response.data.map((cidade: { id: number; nome: string }) => ({
      id: cidade.id,
      nome: cidade.nome,
    }));

    // Ordenar por ordem alfabética
    return cidades.sort((a: Cidade, b: Cidade) => a.nome.localeCompare(b.nome));
  } catch (error) {
    return [];
  }
};
export default getCidadesPorEstadoID;
