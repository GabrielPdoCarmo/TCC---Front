// components/Welcome/WelcomeModal.tsx - Versão simplificada sem delay
import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Modal, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

// Interface para as props do WelcomeModal
interface WelcomeModalProps {
  visible: boolean;
  onClose: () => void;
  userName: string;
  photoUrl: string | null;
  loading?: boolean; // ✅ Nova prop para loading
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({
  visible,
  onClose,
  userName,
  photoUrl,
  loading = false, // ✅ Valor padrão false
}) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Bem-vindo!</Text>

          {photoUrl ? (
            <View style={styles.photoContainer}>
              <Image source={{ uri: photoUrl }} style={styles.userPhoto} resizeMode="cover" />
            </View>
          ) : (
            <View style={styles.photoPlaceholder}>
              <Icon name="person" size={40} color="#555" />
            </View>
          )}

          <Text style={styles.modalText}>Olá, {userName || 'usuário'}!</Text>

          <TouchableOpacity
            style={[styles.modalButton, loading && styles.buttonDisabled]}
            onPress={onClose}
            disabled={loading} // ✅ Desabilitar durante loading
          >
            {loading ? (
              // ✅ Mostrar loading
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="white" size="small" />
                <Text style={[styles.modalButtonText, { marginLeft: 8 }]}>Carregando...</Text>
              </View>
            ) : (
              // ✅ Texto normal
              <Text style={styles.modalButtonText}>Continuar</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    width: '85%',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    zIndex: 1001,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  modalText: {
    fontSize: 18,
    marginVertical: 15,
    textAlign: 'center',
    color: '#333',
  },
  modalButton: {
    backgroundColor: '#4285F4',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginTop: 15,
    elevation: 3,
    minWidth: 120,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7, // ✅ Estilo para botão desabilitado
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  }, // ✅ Container para loading
  photoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#4285F4',
    marginBottom: 10,
  },
  userPhoto: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
    borderWidth: 3,
    borderColor: '#ccc',
  },
});

export default WelcomeModal;
