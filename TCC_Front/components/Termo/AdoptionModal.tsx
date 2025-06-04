// AdoptionModal.tsx - Atualizado para sequência iOS
import React from 'react';
import { Modal, View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';

interface AdoptionModalProps {
  visible: boolean;
  onClose: () => void;
  onStartAdoption: () => void;
  onViewTermo: () => void;
  pet: {
    nome: string;
    usuario_nome?: string;
    foto?: string;
    // 🆕 Props para controlar o comportamento do modal
    isInitialState?: boolean;
    hasExistingTermo?: boolean;
  } | null;
}

const AdoptionModal: React.FC<AdoptionModalProps> = ({ visible, onClose, onStartAdoption, onViewTermo, pet }) => {
  if (!pet) return null;

  // Determinar se é o estado inicial ou habilitado
  const isInitialState = pet.isInitialState ?? false;

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Image source={require('../../assets/images/Icone/estampa-de-cachorro.png')} style={styles.iconPet} />
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
                <View style={styles.placeholderImage}>
                  <Text style={styles.placeholderText}>🐕</Text>
                </View>
              )}
            </View>

            {/* Informações - Dinâmicas baseadas no estado */}
            {isInitialState ? (
              <>
                <Text style={styles.question}>
                  Para conversar com o dono do <Text style={styles.petName}>{pet.nome}</Text>, você precisa primeiro
                  obter o termo de adoção.
                </Text>

                <Text style={styles.ownerInfo}>
                  Dono: <Text style={styles.ownerName}>{pet.usuario_nome || 'Desconhecido'}</Text>
                </Text>

                <Text style={styles.description}>
                  O termo de responsabilidade é obrigatório para garantir uma adoção segura e responsável.
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.question}>
                  Você já possui o termo de adoção para <Text style={styles.petName}>{pet.nome}</Text>! Agora pode
                  conversar com o dono.
                </Text>

                <Text style={styles.ownerInfo}>
                  Dono: <Text style={styles.ownerName}>{pet.usuario_nome || 'Desconhecido'}</Text>
                </Text>

                <Text style={styles.description}>
                  O termo foi assinado e enviado por email. Agora você pode iniciar a conversa no WhatsApp.
                </Text>
              </>
            )}

            {/* Botões - Dinâmicos baseados no estado */}
            <View style={styles.buttonContainer}>
              {isInitialState ? (
                <>
                  {/* Estado inicial: WhatsApp desabilitado + Obter Termo */}
                  <TouchableOpacity style={styles.disabledButton} disabled>
                    <Text style={styles.disabledButtonText}>Comunicar via WhatsApp</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.primaryButton} onPress={onStartAdoption}>
                    <Text style={styles.primaryButtonText}>Obter Termo</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {/* Estado habilitado: WhatsApp habilitado + Ver Termo */}
                  <TouchableOpacity style={styles.adoptButton} onPress={onStartAdoption}>
                    <Text style={styles.adoptButtonText}>Conversar no WhatsApp</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.viewTermButton} onPress={onViewTermo}>
                    <Text style={styles.viewTermButtonText}>Ver Termo</Text>
                  </TouchableOpacity>
                </>
              )}
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
    flex: 1,
    textAlign: 'center',
  },
  iconPet: {
    width: 30,
    height: 30
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
    fontSize: 16,
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
    fontSize: 14,
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
  // Botão WhatsApp habilitado (verde)
  adoptButton: {
    backgroundColor: '#25D366',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  adoptButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Botão Ver Termo (azul)
  viewTermButton: {
    backgroundColor: '#4682B4',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  viewTermButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Botão primário - Obter Termo (azul)
  primaryButton: {
    backgroundColor: '#4682B4',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Botão desabilitado (cinza)
  disabledButton: {
    backgroundColor: '#E9ECEF',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CED4DA',
  },
  disabledButtonText: {
    color: '#6C757D',
    fontSize: 16,
  },
  // Botão cancelar
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
