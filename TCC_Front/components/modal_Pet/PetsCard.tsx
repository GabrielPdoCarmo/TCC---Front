import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert, Modal } from 'react-native';

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
    usuario_foto?: string | null; // ✅ CORRIGIDO: Aceita null para foto do usuário responsável
    foto?: string;
    faixa_etaria_id: number;
    faixa_etaria_unidade?: string; // Unidade da faixa etária
    status_id: number;
    status_nome?: string; // Nome do status
    favorito?: boolean; // Estado inicial de favorito
  };
  onAdopt?: () => void;
  OnDetalhes?: () => void;
  onFavorite?: (id: number) => void;
}

const PetsCard = ({ pet, onAdopt, OnDetalhes, onFavorite }: PetCardProps) => {
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

  // Função para alternar o estado do favorito
  const handleToggleFavorite = () => {
    // Atualizar o estado local imediatamente para feedback visual rápido
    setIsFavorite(!isFavorite);

    // Chamar a função passada via props para atualizar no backend
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

  // Função para expandir a foto do usuário
  const handleExpandUserPhoto = () => {
    if (pet.usuario_foto) {
      setShowExpandedPhoto(true);
    }
  };

  console.log('PetsCard - Estado de favorito atual:', isFavorite, 'Pet favorito:', pet.favorito);

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

          {/* Botão de favorito único */}
          <TouchableOpacity style={styles.favoriteButton} onPress={handleToggleFavorite}>
            <Image
              source={
                isFavorite
                  ? require('../../assets/images/Icone/star-icon-open.png')
                  : require('../../assets/images/Icone/star-icon.png')
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

          {/* ✅ MODIFICADO: Responsável em linhas separadas */}
          <Text style={styles.label}>Responsável:</Text>
          <TouchableOpacity
            style={styles.userInfoContainer}
            onPress={handleExpandUserPhoto}
            activeOpacity={pet.usuario_foto ? 0.7 : 1}
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
            <Text style={styles.value}>{pet.usuario_nome}</Text>
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
            <TouchableOpacity style={[styles.editButton]} onPress={onAdopt}>
              <Text numberOfLines={1} style={[styles.buttonText]}>
                Adicionar aos meus Pets
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.detalhesButton} onPress={OnDetalhes}>
              <Text style={styles.buttonText}>Detalhes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Modal para foto ampliada */}
      <Modal
        visible={showExpandedPhoto}
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
    marginBottom: 25, // aumentado
    padding: '6%', // aumentado
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
  favoriteIcon: {
    width: 25,
    height: 25,
    tintColor: '#FFD700',
  },

  // ✅ ESTILOS ATUALIZADOS para foto do usuário
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
    backgroundColor: '#2E5BFF', // ✅ MANTIDO: Cor azul mais vibrante igual à imagem
    borderRadius: 25,
    paddingVertical: 6,
    paddingHorizontal: 12, // ✅ AUMENTADO: Mais padding horizontal para acomodar o texto
    marginRight: 10,
    alignItems: 'center',
    flexShrink: 0,
    width: 200, // ✅ ADICIONADO: Largura fixa para manter o botão consistente
    // ✅ ADICIONADO: Impede quebra de linha
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

  // ✅ ESTILOS para o modal da foto ampliada
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
    height: 250,
    borderRadius: 125,
    borderWidth: 3,
    borderColor: '#4682B4',
    marginTop: 20,
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
