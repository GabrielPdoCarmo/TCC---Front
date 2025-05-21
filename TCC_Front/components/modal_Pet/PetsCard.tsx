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
  OnDetalhes?: () => void;
  onFavorite?: (id: number) => void;
}

const PetsCard = ({ pet, onAdopt, OnDetalhes, onFavorite }: PetCardProps) => {
  // Estado local para controlar a exibição do ícone de favorito
  const [isFavorite, setIsFavorite] = useState(pet.favorito || false);

  // Verifica se o pet está disponível para adoção (status_id === 2)
  const isAvailableForAdoption = pet.status_id === 2;

  // Função para alternar o estado do favorito
  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // Chamar a função passada via props, se existir
    if (onFavorite) {
      onFavorite(pet.id);
    }
  };

  // Função para exibir alerta quando tentar editar um pet disponível para adoção
  const handleEditDisabled = () => {
    Alert.alert('Operação não permitida', 'Este pet está disponível para adoção e não pode ser editado.');
  };

  // Função para exibir alerta quando tentar disponibilizar para adoção novamente
  const handleAdoptDisabled = () => {
    Alert.alert('Operação não permitida', 'Este pet já está disponível para adoção.');
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
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => {
              // Verificar se onFavorite existe antes de chamá-lo
              if (onFavorite) {
                onFavorite(pet.id);
              }
            }}
          >
            <Image
              source={
                pet.favorito
                  ? require('../../assets/images/Icone/star-icon.png')
                  : require('../../assets/images/Icone/star-icon-open.png')
              }
              style={styles.favoriteIcon}
            />
          </TouchableOpacity>
          <Text style={styles.label}>
            Raça: <Text style={styles.value}>{pet.raca_nome}</Text>
          </Text>
          <Text style={styles.label}>
            Idade:{' '}
            <Text style={styles.value}>
              {pet.idade} {pet.faixa_etaria_unidade}
            </Text>
          </Text>
          <Text style={styles.label}>
            Responsável: <Text style={styles.value}>{pet.usuario_nome}</Text>
          </Text>
          <Text style={[styles.label, isAvailableForAdoption ? styles.statusAdoption : null]}>
            Status:{' '}
            <Text style={[styles.value, isAvailableForAdoption ? styles.statusAdoptionText : null]}>
              {pet.status_nome}
            </Text>
          </Text>
        </View>
        {/* Botões de ação */}
        <View style={styles.actionContainer}>
          <View style={styles.editDeleteContainer}>
            <TouchableOpacity style={[styles.editButton]} onPress={onAdopt}>
              <Text style={[styles.buttonText]}>Adotar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.detalhesButton} onPress={OnDetalhes}>
              <Text style={styles.buttonText}>Detalhes</Text>
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
    marginBottom: 25, // aumentado
    padding: 20, // aumentado
    minHeight: 180, // adicionado
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
    backgroundColor: '#0044FFFF',
    borderRadius: 25,
    paddingVertical: 6,
    paddingHorizontal: 12,
    width: 100,
    marginRight: 10,
    alignItems: 'center',
  },
  detalhesButton: {
    backgroundColor: '#468CB4FF',
    borderRadius: 25,
    paddingVertical: 6,
    paddingHorizontal: 12,
    width: 100,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 13,
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
    color: '#4CAF50',
  },
  favoriteIcon: {
    width: 25,
    height: 25,
  },
});

export default PetsCard;
