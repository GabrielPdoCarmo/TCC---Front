import api from "../api";
export const getSexoPet = async () => {
  try {
    console.log('Fazendo requisição para /sexoPet');
    const response = await api.get('/sexoPet');
    console.log('Resposta recebida:', response.data);

    return response.data.map((sexo: { id: number; descricao: string }) => ({
      id: sexo.id,
      descricao: sexo.descricao,
    }));
  } catch (error: any) {
    console.error('Erro completo:', error);
    return [];
  }
};  
export default getSexoPet;