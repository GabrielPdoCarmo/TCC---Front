import api from "../api";

export const getFavoritos = async () => {
  const response = await api.get('/favoritos');
  return response.data;
};
export default getFavoritos;