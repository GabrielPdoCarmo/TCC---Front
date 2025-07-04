import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert, Modal, ActivityIndicator } from 'react-native';

// Interface PetCardProps atualizada
interface PetCardProps {
  pet: {
    id: number;
    nome: string;
    raca_id: number;
    raca_nome?: string;
    idade: string;
    usuario_id: number;
    usuario_nome?: string;
    usuario_foto?: string | null;
    foto?: string;
    faixa_etaria_id: number;
    faixa_etaria_unidade?: string;
    status_id: number;
    status_nome?: string;
    favorito?: boolean;
  };
  onAdopt?: () => void;
  OnDetalhes?: () => void;
  onFavorite?: (id: number) => void;
  usuarioLogadoId?: number | null; // ID do usuário logado
  isFavoriting?: boolean; 
}

const PetsCard = ({ pet, onAdopt, OnDetalhes, onFavorite, usuarioLogadoId, isFavoriting = false }: PetCardProps) => {
  // Estado local para controlar a exibição do ícone de favorito
  const [isFavorite, setIsFavorite] = useState(pet.favorito || false);

  // Estado para controlar a exibição da foto ampliada
  const [showExpandedPhoto, setShowExpandedPhoto] = useState(false);

  // Atualizar o estado local quando o prop pet.favorito mudar
  useEffect(() => {
    setIsFavorite(pet.favorito || false);
  }, [pet.favorito]);

  // Verifica se o pet está disponível para adoção (status_id === 2)
  const isAvailableForAdoption = pet.status_id === 2;

  // Verificar se o usuário logado é o dono do pet
  const isOwnPet = usuarioLogadoId !== null && pet.usuario_id === usuarioLogadoId;

  // FUNÇÃO ATUALIZADA para alternar o estado do favorito
  const handleToggleFavorite = () => {
    // Proteção: Não permitir favoritar se estiver processando
    if (isFavoriting) {
      return;
    }

    // Atualizar o estado local imediatamente para feedback visual rápido
    setIsFavorite(!isFavorite);

    // Chamar a função passada via props para atualizar no backend
    if (onFavorite) {
      onFavorite(pet.id);
    }
  };

  //  FUNÇÃO ATUALIZADA para lidar com o botão "Adicionar aos meus Pets"
  const handleAdoptPress = () => {
    if (!usuarioLogadoId) {
      Alert.alert('Erro', 'Você precisa estar logado para adicionar pets aos seus favoritos.');
      return;
    }

    if (isOwnPet) {
      Alert.alert('Operação não permitida', 'Você não pode adicionar seu próprio pet aos seus pets.');
      return;
    }

    // Proteção: Não permitir adoção se estiver favoritando
    if (isFavoriting) {
      Alert.alert('Aguarde', 'Processando favorito. Aguarde a conclusão.');
      return;
    }

    // Chamar a função de adoção
    if (onAdopt) {
      onAdopt();
    }
  };

  //FUNÇÃO ATUALIZADA para expandir a foto do usuário
  const handleExpandUserPhoto = () => {
    if (pet.usuario_foto && !isFavoriting) {
      setShowExpandedPhoto(true);
    }
  };

  //FUNÇÃO ATUALIZADA para detalhes
  const handleDetailsPress = () => {
    if (isFavoriting) {
      Alert.alert('Aguarde', 'Processando favorito. Aguarde a conclusão.');
      return;
    }

    if (OnDetalhes) {
      OnDetalhes();
    }
  };

  return (
    <View style={[styles.container, isFavoriting && styles.containerProcessing]}>
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

      {/* INDICADOR de favorito loading */}
      {isFavoriting && (
        <View style={styles.favoritingOverlay}>
          <ActivityIndicator size="small" color="#FFD700" />
          <Text style={styles.favoritingText}>Favoritando...</Text>
        </View>
      )}

      {/* Parte direita - Informações e botões */}
      <View style={styles.infoContainer}>
        {/* Informações do pet */}
        <View style={styles.petInfo}>
          <Text style={styles.label}>
            Nome: <Text style={styles.value}>{pet.nome}</Text>
          </Text>

          {/*BOTÃO DE FAVORITO ATUALIZADO com loading */}
          <TouchableOpacity
            style={[
              styles.favoriteButton,
              isFavoriting && styles.disabledButton
            ]}
            onPress={handleToggleFavorite}
            disabled={isFavoriting}
          >
            {isFavoriting ? (
              <ActivityIndicator size="small" color="#FFD700" />
            ) : (
              <Image
                source={
                  isFavorite
                    ? require('../../assets/images/Icone/star-icon-open.png')
                    : require('../../assets/images/Icone/star-icon.png')
                }
                style={[
                  styles.favoriteIcon,
                  isFavoriting && styles.disabledIcon
                ]}
              />
            )}
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

          {/* Responsável em linhas separadas */}
          <Text style={styles.label}>Responsável:</Text>
          <TouchableOpacity
            style={styles.userInfoContainer}
            onPress={handleExpandUserPhoto}
            activeOpacity={pet.usuario_foto && !isFavoriting ? 0.7 : 1}
            disabled={isFavoriting}
          >
            {pet.usuario_foto ? (
              <Image source={{ uri: pet.usuario_foto }} style={styles.userPhoto} />
            ) : (
              <View style={styles.defaultUserPhoto}>
                <Text style={styles.defaultUserPhotoText}>
                  {pet.usuario_nome ? pet.usuario_nome.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>
            )}
            <Text style={styles.usuarioNome} numberOfLines={1}>
              {pet.usuario_nome}
            </Text>
          </TouchableOpacity>

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
            {/*  BOTÃO ATUALIZADO com validação e proteção para favorito */}
            <TouchableOpacity
              style={[
                styles.editButton,
                (isOwnPet || isFavoriting) && styles.disabledButton, // Aplicar estilo desabilitado se for próprio pet ou favoritando
              ]}
              onPress={handleAdoptPress}
              disabled={isOwnPet || isFavoriting} // Desabilitar se for próprio pet ou favoritando
            >
              <Text
                numberOfLines={1}
                style={[
                  styles.buttonText,
                  (isOwnPet || isFavoriting) && styles.disabledText, // Aplicar estilo de texto desabilitado
                ]}
              >
                {isOwnPet ? 'Adicionar aos meus Pets' : 'Adicionar aos meus Pets'}
              </Text>
            </TouchableOpacity>
            
            {/*BOTÃO DETALHES ATUALIZADO com proteção */}
            <TouchableOpacity 
              style={[
                styles.detalhesButton,
                isFavoriting && styles.disabledButton
              ]} 
              onPress={handleDetailsPress}
              disabled={isFavoriting}
            >
              <Text style={[
                styles.buttonText,
                isFavoriting && styles.disabledText
              ]}>
                Detalhes
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Modal para foto ampliada */}
      <Modal
        visible={showExpandedPhoto && !isFavoriting}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowExpandedPhoto(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowExpandedPhoto(false)}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowExpandedPhoto(false)}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>

            {pet.usuario_foto && (
              <Image source={{ uri: pet.usuario_foto }} style={styles.expandedPhoto} resizeMode="contain" />
            )}

            <Text style={styles.expandedPhotoName}>{pet.usuario_nome}</Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    marginBottom: 25,
    padding: '6%',
    minHeight: 180,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  //NOVO: Estilo para container durante processamento
  containerProcessing: {
    opacity: 0.7,
    backgroundColor: '#F8F8F8',
  },
  //NOVO: Overlay de favorito
  favoritingOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
  },
  favoritingText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
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
    minWidth: 35,
    minHeight: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteIcon: {
    width: 25,
    height: 25,
    tintColor: '#FFD700',
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  userPhoto: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  defaultUserPhoto: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4682B4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  defaultUserPhotoText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
    backgroundColor: '#2E5BFF',
    borderRadius: 25,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 10,
    alignItems: 'center',
    flexShrink: 0,
    width: 200,
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
  usuarioNome: {
    flexShrink: 1,
    flexWrap: 'wrap',
    maxWidth: '100%',
    fontWeight: 'bold',
  },

  // ESTILOS PARA ELEMENTOS DESABILITADOS
  disabledButton: {
    backgroundColor: '#E0E0E0',
    opacity: 0.6,
  },
  disabledText: {
    color: '#A0A0A0',
  },
  disabledIcon: {
    opacity: 0.5,
  },
  // Estilo para destacar status de adoção
  statusAdoption: {
    fontWeight: 'bold',
  },
  statusAdoptionText: {
    color: '#006EFFFF',
  },
  // Estilos para o modal da foto ampliada
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    maxWidth: '90%',
    maxHeight: '80%',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  expandedPhoto: {
    width: 250,
    height: 189,
    borderRadius: 5,
    borderWidth: 3,
    borderColor: '#4682B4',
    marginTop: 30,
  },
  expandedPhotoName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    textAlign: 'center',
  },
});

export default PetsCard;