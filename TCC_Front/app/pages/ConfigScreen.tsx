// ConfigScreen.tsx
import { router } from 'expo-router';
import React, { useState } from 'react'; // Adicionado o useState
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ImageBackground,
  Image,
  Alert,
  Linking, // Adicionado para abrir links externos
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import AdocaoResponsavelModal from '@/components/modal_Pet/AdocaoResponsavelModal';
import deleteUsuario from '@/services/api/Usuario/deleteUsuario';
import getUsuarioById from '@/services/api/Usuario/getUsuarioById';
export default function ConfigScreen() {
  // Estado para controlar a visibilidade do modal
  const [modalVisible, setModalVisible] = useState(false);

  // Function to handle logout
  const handleLogout = async () => {
    try {
      // Clear the user data from AsyncStorage
      await AsyncStorage.removeItem('@App:userId');
      await AsyncStorage.removeItem('@App:userToken');

      // Navigate to login screen
      router.replace('/');
    } catch (error) {
      console.error('Error during logout:', error);
      Alert.alert('Erro', 'Não foi possível fazer logout. Tente novamente.');
    }
  };

  // Function to handle delete account
  const handleDeleteAccount = () => {
    Alert.alert(
      'Excluir Conta',
      'Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              // Obter o ID do usuário logado
              const userId = await AsyncStorage.getItem('@App:userId');
              console.log('ID do usuário:', userId);
              if (!userId) {
                throw new Error('ID do usuário não encontrado');
              }

              // Converter para número
              const userIdNumber = parseInt(userId);
              console.log('ID do usuário convertido:', userIdNumber);
              // Verificar se o usuário existe antes de excluir
              const usuario = await getUsuarioById(userIdNumber);
              console.log('Usuário encontrado:', usuario);
              if (!usuario || !usuario.id) {
                throw new Error('Usuário não encontrado');
              }

              console.log('Excluindo usuário:', usuario.nome);

              // Chamar a API para excluir o usuário
              const result = await deleteUsuario(userIdNumber);

              if (!result) {
                throw new Error('Falha ao excluir a conta');
              }

              // Verificar se a exclusão foi bem-sucedida
              if (result.success === false) {
                Alert.alert('Erro', result.message || 'Não foi possível excluir a conta.');
                return;
              }

              // Clear user data from AsyncStorage
              await AsyncStorage.removeItem('@App:userId');
              await AsyncStorage.removeItem('@App:userToken');

              Alert.alert('Sucesso', 'Sua conta foi excluída com sucesso.');

              // Navigate to login screen
              router.replace('/');
            } catch (error) {
              console.error('Error deleting account:', error);
              Alert.alert('Erro', 'Não foi possível excluir a conta. Tente novamente.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Função para abrir site sobre combate ao abandono de animais
  const handleLearnMore = async () => {
    // URL de um site sobre combate ao abandono de animais
    const url = 'https://www.worldanimalprotection.org.br/abandono-de-animais';

    try {
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Erro', 'Não foi possível abrir o site. Por favor, visite: ' + url);
      }
    } catch (error) {
      console.error('Erro ao abrir o link:', error);
      Alert.alert('Erro', 'Não foi possível abrir o site. Por favor, visite: ' + url);
    }
  };

  // Função para abrir o modal de adoção responsável
  const handleAdocaoResponsavel = () => {
    setModalVisible(true);
  };

  return (
    <ImageBackground
      source={require('../../assets/images/backgrounds/Fundo_05.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <StatusBar style="dark" />

      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.title}>Configurações</Text>

        <View style={styles.contentContainer}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Denuncia casos de Abandono</Text>
            <Text style={[styles.phoneNumber, styles.centerText]}>Disque: 181 ou 190</Text>
          </View>

          {/* Todos os botões agora estão no mesmo nível de hierarquia */}
          <TouchableOpacity style={styles.button} onPress={handleLearnMore}>
            <Text style={styles.buttonText}>Saiba Mais</Text>
            <Text style={styles.arrowIcon}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={handleAdocaoResponsavel}>
            <Text style={styles.buttonText}>Como realizar uma adoção responsável</Text>
            <Text style={styles.arrowIcon}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={handleDeleteAccount}>
            <Text style={styles.deleteAccountText}>Excluir Conta</Text>
            <Text style={styles.arrowIcon}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Deslogar</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Navigation */}
        <View style={styles.bottomNavigation}>
          <TouchableOpacity style={styles.navItem} onPress={() => router.push('/pages/PetDonation')}>
            <Image source={require('../../assets/images/Icone/adoption-icon.png')} style={styles.navIcon} />
            <Text style={styles.navText}>Adoção</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => router.push('/pages/PetAdoptionScreen')}>
            <Image source={require('../../assets/images/Icone/donation-icon.png')} style={styles.navIcon} />
            <Text style={styles.navText}>Doação</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => router.push('/pages/ProfileScreen')}>
            <Image source={require('../../assets/images/Icone/profile-icon.png')} style={styles.navIcon} />
            <Text style={styles.navText}>Perfil</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Modal de Adoção Responsável */}
      <AdocaoResponsavelModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  safeArea: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    marginBottom: 20, // Reduzido o espaçamento da seção
    alignItems: 'center', // Centraliza os itens na seção
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
    textAlign: 'center', // Centraliza o texto do título
  },
  phoneNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF0000',
    marginBottom: 20,
  },
  centerText: {
    textAlign: 'center', // Centraliza o texto do número de telefone
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#000',
  },
  buttonText: {
    fontSize: 18,
    color: '#000',
    fontWeight: 'bold',
  },
  deleteAccountText: {
    fontSize: 18,
    color: '#FF0000',
    fontWeight: 'bold',
  },
  arrowIcon: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#000',
  },
  logoutButtonText: {
    fontSize: 18,
    color: '#FF0000',
    fontWeight: 'bold',
  },
  bottomNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
  },
  navIcon: {
    width: 30,
    height: 30,
  },
  navText: {
    fontSize: 12,
    marginTop: 3,
    color: '#000',
  },
});
