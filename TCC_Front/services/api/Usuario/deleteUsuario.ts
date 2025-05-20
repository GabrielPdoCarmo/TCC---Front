import api from "../api";
import axios, { AxiosError } from "axios";

interface ApiErrorResponse {
  error?: string;
  message?: string;
}

export const deleteUsuario = async (id: number) => {
  try {
    console.log(`Excluindo usuário com ID: ${id}`);
    const response = await api.delete(`/usuarios/${id}`);
    
    // Se a resposta não tiver dados, mas for bem-sucedida (204 No Content)
    if (!response.data && response.status === 204) {
      return {
        success: true,
        message: 'Usuário excluído com sucesso'
      };
    }
    
    // Retornar os dados da resposta ou um objeto de sucesso padrão
    return response.data || { 
      success: true,
      message: 'Usuário excluído com sucesso'
    };
  } catch (error) {
    // Type assertion para o erro do axios
    const axiosError = error as AxiosError<ApiErrorResponse>;
    
    console.error(`Erro ao excluir o usuário com ID ${id}:`, 
      axiosError.response?.data || axiosError.message);
    
    // Extrair informações de erro da resposta da API
    if (axiosError.response) {
      // O servidor respondeu com um status de erro
      return {
        success: false,
        error: axiosError.response.data?.error || 'Erro ao excluir usuário',
        message: axiosError.response.data?.message || 'Não foi possível excluir o usuário',
        status: axiosError.response.status
      };
    } else if (axiosError.request) {
      // A requisição foi feita mas não houve resposta
      return {
        success: false,
        error: 'Sem resposta do servidor',
        message: 'O servidor não respondeu à solicitação de exclusão'
      };
    } else {
      // Erro ao configurar a requisição
      return {
        success: false,
        error: 'Erro na requisição',
        message: axiosError.message || 'Ocorreu um erro ao tentar excluir o usuário'
      };
    }
  }
};

export default deleteUsuario;