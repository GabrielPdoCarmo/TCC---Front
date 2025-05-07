import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';

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
}

const PetCard = ({ pet, onAdopt, onEdit, onDelete, onFavorite }: PetCardProps) => {
  // Estado local para controlar a exibição do ícone de favorito
  const [isFavorite, setIsFavorite] = useState(pet.favorito || false);

  // Função para alternar o estado do favorito
  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // Chamar a função passada via props, se existir
    if (onFavorite) {
      onFavorite(pet.id);
    }
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
          <Text style={styles.label}>
            Status: <Text style={styles.value}>{pet.status_nome}</Text>
          </Text>
        </View>

        {/* Botão de favorito com alternância de ícone */}
        <TouchableOpacity style={styles.favoriteButton} onPress={handleToggleFavorite}>
          <Image 
            source={
              isFavorite 
                ? require('../../assets/images/Icone/star-icon-open.png') 
                : require('../../assets/images/Icone/star-icon.png')
            } 
            style={styles.starIcon} 
          />
        </TouchableOpacity>

        {/* Botões de ação */}
        <View style={styles.actionContainer}>
          <TouchableOpacity style={styles.adoptButton} onPress={onAdopt}>
            <Text style={styles.adoptButtonText}>Enviar aos Pets</Text>
          </TouchableOpacity>

          <View style={styles.editDeleteContainer}>
            <TouchableOpacity style={styles.editButton} onPress={onEdit}>
              <Text style={styles.buttonText}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
              <Text style={styles.buttonText}>Deletar</Text>
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
});

export default PetCard;