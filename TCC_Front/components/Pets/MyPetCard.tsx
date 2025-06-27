import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert, Modal, ActivityIndicator } from 'react-native';

// Interface PetCardProps atualizada
interface MyPetCardProps {
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
    usuario_telefone?: string;
    usuario_email?: string;
  };
  onCommunicate?: () => void;
  onRemove?: () => void;
  onFavorite?: (id: number) => void;
  isRemoving?: boolean;
  isFavoriting?: boolean; //ROPRIEDADE para loading do favorito
}

const MyPetsCard = ({ pet, onCommunicate, onRemove, onFavorite, isRemoving = false, isFavoriting = false }: MyPetCardProps) => {
  // Estado local para controlar a exibição do ícone de favorito
  const [isFavorite, setIsFavorite] = useState(pet.favorito || false);

  // Estado para controlar a exibição da foto ampliada
  const [showExpandedPhoto, setShowExpandedPhoto] = useState(false);

  // Atualizar o estado local quando o prop pet.favorito mudar
  useEffect(() => {
    setIsFavorite(pet.favorito || false);
  }, [pet.favorito]);

  // ATUALIZADA para alternar o estado do favorito
  const handleToggleFavorite = () => {
    // PROTEÇÃO: Não permitir favoritar se estiver removendo ou favoritando
    if (isRemoving || isFavoriting) {
      return;
    }

    // Atualizar o estado local imediatamente para feedback visual rápido
    setIsFavorite(!isFavorite);

    // Chamar a função passada via props para atualizar no backend
    if (onFavorite) {
      onFavorite(pet.id);
    }
  };

  //FUNÇÃO ATUALIZADA: Proteção contra múltiplas remoções
  const handleRemovePress = () => {
    if (isRemoving || isFavoriting) {
      return;
    }

    if (onRemove) {
      onRemove();
    }
  };

  //FUNÇÃO ATUALIZADA: Proteção durante remoção e favorito
  const handleCommunicatePress = () => {
    if (isRemoving) {
      Alert.alert('Aguarde', 'Operação em andamento. Aguarde a conclusão.');
      return;
    }

    if (isFavoriting) {
      Alert.alert('Aguarde', 'Processando favorito. Aguarde a conclusão.');
      return;
    }

    if (onCommunicate) {
      onCommunicate();
    }
  };

  // Função para expandir a foto do usuário
  const handleExpandUserPhoto = () => {
    if (pet.usuario_foto && !isRemoving && !isFavoriting) {
      setShowExpandedPhoto(true);
    }
  };

  // 🆕 FUNÇÃO PARA OBTER A COR DO STATUS BASEADA NO status_id
  const getStatusTextColor = () => {
    if (pet.status_id === 4) {
      return styles.statusAdoptedText; // Verde para "Adotado"
    }
    return styles.statusOneText; // Cor padrão para outros status
  };

  return (
    <View style={[styles.container, (isRemoving || isFavoriting) && styles.containerProcessing]}>
      {/*INDICADOR de remoção */}
      {isRemoving && (
        <View style={styles.removingOverlay}>
          <ActivityIndicator size="small" color="#FF6B6B" />
          <Text style={styles.removingText}>Removendo...</Text>
        </View>
      )}

      {/*INDICADOR de favorito loading */}
      {isFavoriting && (
        <View style={styles.favoritingOverlay}>
          <ActivityIndicator size="small" color="#FFD700" />
          <Text style={styles.favoritingText}>Favoritando...</Text>
        </View>
      )}

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

          {/*DE FAVORITO ATUALIZADO com loading */}
          <TouchableOpacity
            style={[
              styles.favoriteButton,
              (isRemoving || isFavoriting) && styles.disabledButton
            ]}
            onPress={handleToggleFavorite}
            disabled={isRemoving || isFavoriting}
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
                  (isRemoving || isFavoriting) && styles.disabledIcon
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
            activeOpacity={pet.usuario_foto && !isRemoving && !isFavoriting ? 0.7 : 1}
            disabled={isRemoving || isFavoriting}
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
            <Text style={styles.usuarioNome} numberOfLines={1}>{pet.usuario_nome}</Text>
          </TouchableOpacity>

          {/* 🆕 STATUS COM COR CONDICIONAL */}
          <Text style={(styles.label, styles.statusAdoption)}>
            Status: <Text style={[styles.value, getStatusTextColor()]}>{pet.status_nome}</Text>
          </Text>
        </View>

        {/* Botões de ação */}
        <View style={styles.actionContainer}>
          <View style={styles.editDeleteContainer}>
            {/* BOTÃO ATUALIZADO com proteção para favorito */}
            <TouchableOpacity
              style={[
                styles.communicateButton,
                (isRemoving || isFavoriting) && styles.disabledButton
              ]}
              onPress={handleCommunicatePress}
              disabled={isRemoving || isFavoriting}
            >
              <Text style={[
                styles.buttonText,
                (isRemoving || isFavoriting) && styles.disabledText
              ]}>
                Comunicar
              </Text>
            </TouchableOpacity>

            {/*BOTÃO ATUALIZADO com proteção para favorito */}
            <TouchableOpacity
              style={[
                styles.removeButton,
                (isRemoving || isFavoriting) && styles.disabledButton
              ]}
              onPress={handleRemovePress}
              disabled={isRemoving || isFavoriting}
            >
              <Text numberOfLines={1} style={[
                styles.buttonText,
                (isRemoving || isFavoriting) && styles.disabledText
              ]}>
                {isRemoving ? 'Removendo...' : 'Remover Pet'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Modal para foto ampliada */}
      <Modal
        visible={showExpandedPhoto && !isRemoving && !isFavoriting}
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
  // Estilo para container durante processamento (remoção ou favorito)
  containerProcessing: {
    opacity: 0.7,
    backgroundColor: '#F8F8F8',
  },
  // Overlay de remoção
  removingOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
  },
  removingText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  //Overlay de favorito
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
  statusAdoption: {
    fontWeight: 'bold',
  },
  statusOneText: {
    color: '#0E9999FF',
    fontWeight: 'bold',
  },
  // 🆕 MANTIDO: Estilo específico para status "Adotado" (verde)
  statusAdoptedText: {
    color: '#28A745', // Verde para status "Adotado"
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
  editDeleteContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  communicateButton: {
    backgroundColor: '#25D366',
    borderRadius: 25,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 10,
    alignItems: 'center',
    flexShrink: 0,
    width: 100,
  },
  removeButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 25,
    paddingVertical: 6,
    paddingHorizontal: 12,
    width: 140,
    alignItems: 'center',
  },
  usuarioNome: {
    flexShrink: 1,
    flexWrap: 'wrap',
    maxWidth: '100%',  // Limita largura
    fontWeight: 'bold'
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  //OS: Estilos para elementos desabilitados
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

export default MyPetsCard;