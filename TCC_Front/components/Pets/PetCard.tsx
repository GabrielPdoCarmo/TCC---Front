import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert } from 'react-native';

// Interface PetCardProps atualizada
interface PetCardProps {
  pet: {
    id: number;
    nome: string;
    raca_id: number;
    raca_nome?: string; // Nome da raça
    idade: string;
    usuario_id: number;
    usuario_nome?: string; // Nome do usuário responsável
    foto?: string;
    faixa_etaria_id: number;
    faixa_etaria_unidade?: string; // Unidade da faixa etária
    status_id: number;
    status_nome?: string; // Nome do status
    favorito?: boolean; // Adicionado estado inicial de favorito
  };
  onAdopt?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onFavorite?: (id: number) => void;
  disableEdit?: boolean; // Esta propriedade agora será ignorada para permitir a edição sempre
}

const PetCard = ({ pet, onAdopt, onEdit, onDelete, onFavorite, disableEdit }: PetCardProps) => {
  // Estado local para controlar a exibição do ícone de favorito
  const [isFavorite, setIsFavorite] = useState(pet.favorito || false);

  // Verifica se o pet está disponível para adoção (status_id === 2)
  const isAvailableForAdoption = pet.status_id === 2;
  
  // Verifica se o pet tem status_id === 1
  const isStatusOne = pet.status_id === 1;
  
  // Verifica se o pet tem status_id === 3
  const isStatusThree = pet.status_id === 3;
  
  // Verifica se o pet tem status_id === 4
  const isStatusFour = pet.status_id === 4;
  
  // Verifica se o botão "Enviar aos Pets" deve estar bloqueado (status_id 2, 3 ou 4)
  const isAdoptButtonDisabled = pet.status_id === 2 || pet.status_id === 3 || pet.status_id === 4;
  
  // Verifica se os botões de editar e deletar devem estar ativos (apenas para status_id 1 e 2)
  const canEditOrDelete = pet.status_id === 1 || pet.status_id === 2;

  // Função para alternar o estado do favorito
  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // Chamar a função passada via props, se existir
    if (onFavorite) {
      onFavorite(pet.id);
    }
  };

  // Função para exibir alerta quando tentar disponibilizar para adoção com status bloqueado
  const handleAdoptDisabled = () => {
    let message = '';
    if (pet.status_id === 2) {
      message = 'Este pet já está disponível para adoção.';
    } else if (pet.status_id === 3 || pet.status_id === 4) {
      message = 'Não é possível enviar este pet no status atual.';
    }
    
    Alert.alert(
      'Operação não permitida',
      message
    );
  };

  // Função para exibir alerta quando tentar editar com status inválido
  const handleEditDisabled = () => {
    Alert.alert(
      'Operação não permitida',
      'Não é possível editar este pet no status atual.'
    );
  };

  // Função para exibir alerta quando tentar deletar com status inválido
  const handleDeleteDisabled = () => {
    Alert.alert(
      'Operação não permitida',
      'Não é possível deletar este pet no status atual.'
    );
  };

  return (
    <View style={styles.container}>
      {/* Parte esquerda - Imagem do pet */}
      <View style={styles.imageContainer}>
        {pet.foto ? (
          <Image source={{ uri: pet.foto }} style={styles.petImage} />
        ) : (
          <View style={[styles.petImage, styles.defaultPetImage]}>
            <Text style={styles.defaultPetImageText}>{pet.nome ? pet.nome.charAt(0).toUpperCase() : 'P'}</Text>
          </View>
        )}
      </View>

      {/* Parte direita - Informações e botões */}
      <View style={styles.infoContainer}>
        {/* Informações do pet */}
        <View style={styles.petInfo}>
          <Text style={styles.label}>
            Nome: <Text style={styles.value}>{pet.nome}</Text>
          </Text>
          <Text style={styles.label}>
            Raça: <Text style={styles.value}>{pet.raca_nome}</Text>
          </Text>
          <Text style={styles.label}>
            Idade: <Text style={styles.value}>
              {pet.idade} {pet.faixa_etaria_unidade}
            </Text>
          </Text>
          <Text style={styles.label}>
            Responsável: <Text style={styles.value}>{pet.usuario_nome}</Text>
          </Text>
          <Text style={[
            styles.label, 
            isAvailableForAdoption ? styles.statusAdoption : null,
            isStatusOne ? styles.statusAdoption : null,
            isStatusThree ? styles.statusAdoption : null,
            isStatusFour ? styles.statusAdoption : null
          ]}>
            Status: <Text style={[
              styles.value, 
              isAvailableForAdoption ? styles.statusAdoptionText : null,
              isStatusOne ? styles.statusOneText : null,
              isStatusThree ? styles.statusThreeText : null,
              isStatusFour ? styles.statusFourText : null
            ]}>{pet.status_nome}</Text>
          </Text>
        </View>
        {/* Botões de ação */}
        <View style={styles.actionContainer}>
          <TouchableOpacity 
            style={[
              styles.adoptButton,
              isAdoptButtonDisabled ? styles.disabledButton : null
            ]} 
            onPress={isAdoptButtonDisabled ? handleAdoptDisabled : onAdopt}
            disabled={isAdoptButtonDisabled}
          >
            <Text style={[
              styles.adoptButtonText,
              isAdoptButtonDisabled ? styles.disabledText : null
            ]}>Enviar aos Pets</Text>
          </TouchableOpacity>

          <View style={styles.editDeleteContainer}>
            <TouchableOpacity 
              style={[
                styles.editButton,
                !canEditOrDelete ? styles.disabledButton : null
              ]}
              onPress={canEditOrDelete ? onEdit : handleEditDisabled}
              disabled={!canEditOrDelete}
            >
              <Text style={[
                styles.buttonText,
                !canEditOrDelete ? styles.disabledText : null
              ]}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.deleteButton,
                !canEditOrDelete ? styles.disabledButton : null
              ]} 
              onPress={canEditOrDelete ? onDelete : handleDeleteDisabled}
              disabled={!canEditOrDelete}
            >
              <Text style={[
                styles.buttonText,
                !canEditOrDelete ? styles.disabledText : null
              ]}>Deletar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    marginBottom: 15,
    padding: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  imageContainer: {
    width: '50%',
    marginRight: 15,
  },
  infoContainer: {
    flex: 1,
    position: 'relative',
  },
  petImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 10,
  },
  defaultPetImage: {
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultPetImageText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#4682B4',
  },
  petInfo: {
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 3,
  },
  value: {
    fontWeight: 'bold',
  },
  usuarioNome: {
    flexShrink: 1,
    flexWrap: 'wrap',
    maxWidth: '100%',  // Limita largura
    fontWeight: 'bold'
  },
  favoriteButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    padding: 5,
  },
  starIcon: {
    width: 30,
    height: 30,
    tintColor: '#FFD700',
  },
  actionContainer: {
    marginTop: 'auto',
  },
  adoptButton: {
    backgroundColor: '#4682B4',
    borderRadius: 25,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  adoptButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  editDeleteContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#FFD700',
    borderRadius: 25,
    paddingVertical: 6,
    paddingHorizontal: 12,
    width: 80,
    marginRight: 10,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 25,
    paddingVertical: 6,
    paddingHorizontal: 12,
    width: 80,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Estilos adicionados para dispositivos desabilitados
  disabledButton: {
    backgroundColor: '#E0E0E0',
  },
  disabledText: {
    color: '#A0A0A0',
  },
  // Estilo para destacar status de adoção
  statusAdoption: {
    fontWeight: 'bold',
  },
  statusAdoptionText: {
    color: '#0075FCFF',
  },
  // Estilo para status_id === 1
  statusOneText: {
    color: '#DE952F',
  },
  // Estilo para status_id === 3
  statusThreeText: {
    color: '#0E9999FF',
  },
  // Estilo para status_id === 4
  statusFourText: {
    color: '#28A745',
  }
});

export default PetCard;