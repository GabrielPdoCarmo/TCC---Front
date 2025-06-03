// AdoptionModal.tsx
import React from 'react';
import { Modal, View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';

interface AdoptionModalProps {
  visible: boolean;
  onClose: () => void;
  onStartAdoption: () => void;
  onViewTermo: () => void; // Novo callback para ver termo
  pet: {
    nome: string;
    usuario_nome?: string;
    foto?: string;
  } | null;
}

const AdoptionModal: React.FC<AdoptionModalProps> = ({ visible, onClose, onStartAdoption, onViewTermo, pet }) => {
  if (!pet) return null;

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Image source={require('@/assets/images/Icone/estampa-de-cachorro.png')} style={styles.iconImage} />
            <Text style={styles.title}>Processo de Adoção</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Conteúdo */}
          <View style={styles.content}>
            {/* Foto do Pet */}
            <View style={styles.petImageContainer}>
              {pet.foto ? (
                <Image source={{ uri: pet.foto }} style={styles.petImage} />
              ) : (
                <View style={styles.placeholderImage}></View>
              )}
            </View>

            {/* Informações */}
            <Text style={styles.question}>
              Deseja iniciar o processo de adoção do pet <Text style={styles.petName}>{pet.nome}</Text>?
            </Text>

            <Text style={styles.ownerInfo}>
              Dono: <Text style={styles.ownerName}>{pet.usuario_nome || 'Desconhecido'}</Text>
            </Text>

            <Text style={styles.description}>
              O termo de responsabilidade já foi assinado. Agora você pode conversar diretamente com o responsável pelo
              WhatsApp.
            </Text>

            {/* Botões */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.adoptButton} onPress={onStartAdoption}>
                <Text style={styles.adoptButtonText}>Conversar no WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.viewTermButton} onPress={onViewTermo}>
                <Text style={styles.viewTermButtonText}>Ver Termo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default AdoptionModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  header: {
    backgroundColor: '#4682B4',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    padding: 25,
    alignItems: 'center',
  },
  petImageContainer: {
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  petImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#4682B4',
  },
  iconImage: {
    width: 35,
    height: 35,
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#4682B4',
  },
  placeholderText: {
    fontSize: 40,
  },
  question: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 24,
  },
  petName: {
    fontWeight: 'bold',
    color: '#4682B4',
  },
  ownerInfo: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
  },
  ownerName: {
    fontWeight: 'bold',
    color: '#4682B4',
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 25,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  adoptButton: {
    backgroundColor: '#25D366',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
  },
  adoptButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  viewTermButton: {
    backgroundColor: '#4682B4',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  viewTermButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
});
