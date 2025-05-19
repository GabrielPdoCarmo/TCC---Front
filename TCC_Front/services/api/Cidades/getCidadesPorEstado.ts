import api from '../api';
type Cidade = {
  id: number;
  nome: string;
};
export const getCidadesPorEstado = async (estadoNome: string): Promise<Cidade[]> => {
  try {
    const estadosResponse = await api.get('/estados');
    const estado = estadosResponse.data.find((e: { nome: string; id: string }) => e.nome === estadoNome);

    if (!estado) {
      console.error('Estado não encontrado:', estadoNome);
      return [];
    }

    const estadoId = estado.id;

    // 👇 Ajuste aqui: chamada por rota dinâmica, não mais query param
    const response = await api.get(`/cidades/${estadoId}`);
    const cidades = response.data.map((cidade: { id: number; nome: string }) => ({ id: cidade.id, nome: cidade.nome }));

    // 🔤 Ordenar por ordem alfabética
    return cidades.sort((a: Cidade, b: Cidade) => a.nome.localeCompare(b.nome));
  } catch (error) {
    console.error('Erro ao carregar as cidades', error);
    return [];
  }
};
export default getCidadesPorEstado;
