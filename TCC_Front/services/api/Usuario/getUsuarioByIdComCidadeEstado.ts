import api from '../api';
import { getEstados } from '../Estados/getEstados';

export const getUsuarioByIdComCidadeEstado = async (id: number) => {
  try {
    // 1. Buscar o usuário
    console.log(`Buscando usuário com ID: ${id}`);
    const response = await api.get(`/usuarios/${id}`);
    const usuario = response.data;

    const { id: userId, nome, cidade_id, estado_id } = usuario;

    if (!cidade_id || !estado_id) {
      return {
        id: userId,
        nome,
        email: usuario.email ?? '', // <- campo adicionado aqui
        telefone: usuario.telefone ?? undefined, // <- adicione também o telefone
        cidade: { id: cidade_id || null, nome: cidade_id ? 'Cidade não identificada' : 'Não informada' },
        estado: { id: estado_id || null, nome: estado_id ? 'Estado não identificado' : 'Não informado' },
      };
    }

    // 2. Buscar informações da cidade utilizando a rota getCidades_Estado
    const cidadeResponse = await api.get(`/cidades/${cidade_id}/${estado_id}`);
    let nomeCidade = '';

    if (cidadeResponse.data && Array.isArray(cidadeResponse.data)) {
      const cidadeInfo = cidadeResponse.data.find((c: { id: number; nome: string }) => c.id === cidade_id);
      if (cidadeInfo) {
        nomeCidade = cidadeInfo.nome;
      }
    }

    // 3. Buscar lista de estados
    const estados = await getEstados();
    const estadoEncontrado = estados.find((e: { id: number; nome: string }) => e.id === estado_id);

    // 4. Retornar resultado final
    return {
      id: userId,
      nome,
      email: usuario.email ?? '', // <- ADICIONADO: campo email que estava faltando
      telefone: usuario.telefone ?? undefined, // <- ADICIONADO: campo telefone que estava faltando
      cidade: {
        id: cidade_id,
        nome: nomeCidade || 'Cidade não encontrada',
      },
      estado: {
        id: estado_id,
        nome: estadoEncontrado?.nome || 'Estado não encontrado',
      },
    };
  } catch (error) {
    console.error(`Erro ao buscar o usuário com ID ${id}:`, error);
    return null;
  }
};

export default getUsuarioByIdComCidadeEstado;