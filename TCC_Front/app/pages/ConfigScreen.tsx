// ConfigScreen.tsx - Versão corrigida com AuthContext
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ImageBackground,
  Image,
  Alert,
  Linking,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AdocaoResponsavelModal from '@/components/Pets/AdocaoResponsavelModal';
import { verificarPodeExcluirConta, deleteUsuarioComTermo } from '@/services/api/Usuario/deleteUsuarioComTermo';
import getUsuarioById from '@/services/api/Usuario/getUsuarioById';

// ✅ Importar o hook do AuthContext
import { useAuth } from '@/contexts/AuthContext';

export default function ConfigScreen() {
  // Estado para controlar a visibilidade do modal
  const [modalVisible, setModalVisible] = useState(false);

  // ✅ Usar o AuthContext
  const { user, logout, isAuthenticated, loading: authLoading, setLastRoute } = useAuth();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      setLastRoute('/pages/ConfigScreen');
    }
  }, [authLoading, isAuthenticated, setLastRoute]);

  // ✅ Verificar autenticação
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/pages/LoginScreen');
    }
  }, [isAuthenticated, authLoading]);

  // ✅ Função de logout usando o contexto
  const handleLogout = async () => {
    Alert.alert(
      'Deslogar',
      'Tem certeza que deseja deslogar da sua conta?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Deslogar',
          onPress: async () => {
            try {
              // ✅ Usar a função logout do contexto
              await logout();

              // Navegar para a tela de login
              router.replace('/pages/LoginScreen');
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível fazer logout. Tente novamente.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // ✅ Função para excluir conta usando o contexto
  const handleDeleteAccount = async () => {
    if (!user?.id) {
      Alert.alert('Erro', 'Não foi possível identificar o usuário.');
      return;
    }

    try {
      // 🔍 ETAPA 1: Verificar se pode excluir conta
      const verificacao = await verificarPodeExcluirConta(user.id);

      const { podeExcluir, petCount, temTermo, termoInfo, motivoImpedimento } = verificacao.data;

      // ❌ Se não pode excluir devido a pets cadastrados
      if (!podeExcluir && motivoImpedimento === 'pets_cadastrados') {
        Alert.alert(
          'Não é possível excluir a conta',
          `Você possui ${petCount} pet${petCount > 1 ? 's' : ''} cadastrado${petCount > 1 ? 's' : ''}. Remova ${
            petCount > 1 ? 'todos os pets' : 'o pet'
          } antes de excluir sua conta.`,
          [{ text: 'OK' }]
        );
        return;
      }

      // ✅ Pode excluir - montar mensagem do alerta
      let alertMessage = 'Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.';

      if (temTermo && termoInfo) {
        alertMessage += `\n\n⚠️ ATENÇÃO: Seu termo de responsabilidade de doação também será excluído permanentemente.`;
      }

      // 🚨 Alerta de confirmação
      Alert.alert(
        'Excluir Conta',
        alertMessage,
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
                // 🗑️ ETAPA 2: Excluir conta (inclui termo automaticamente)
                const resultado = await deleteUsuarioComTermo(user.id);

                // ✅ Verificar se foi bem-sucedido
                if (resultado.success) {
                  // Preparar mensagem de sucesso
                  let successMessage = 'Sua conta foi excluída com sucesso.';

                  if (resultado.data?.termoExcluido) {
                    successMessage += '\n\nSeu termo de responsabilidade de doação também foi removido.';
                  }

                  // ✅ Limpar dados usando a função logout do contexto
                  await logout();

                  Alert.alert('Sucesso', successMessage, [
                    {
                      text: 'OK',
                      onPress: () => {
                        // Navegar para a tela de login
                        router.replace('/pages/LoginScreen');
                      },
                    },
                  ]);
                } else {
                  // ❌ Erro retornado pelo backend
                  Alert.alert(
                    resultado.title || 'Erro ao Excluir Conta',
                    resultado.message || 'Não foi possível excluir a conta.',
                    [{ text: 'OK' }]
                  );
                }
              } catch (error: any) {
                Alert.alert(
                  'Erro ao Excluir Conta',
                  `Não foi possível excluir a conta. Tente novamente.\n\nDetalhes: ${
                    error.message || 'Erro desconhecido'
                  }`,
                  [{ text: 'OK' }]
                );
              }
            },
          },
        ],
        { cancelable: true }
      );
    } catch (error: any) {
      Alert.alert(
        'Erro na Verificação',
        `Não foi possível verificar os dados da conta.\n\nDetalhes: ${error.message || 'Erro desconhecido'}`,
        [{ text: 'OK' }]
      );
    }
  };

  // Função para abrir site sobre combate ao abandono de animais
  const handleLearnMore = async () => {
    const url = 'https://www.worldanimalprotection.org.br';

    try {
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Erro', 'Não foi possível abrir o site. Por favor, visite: ' + url);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível abrir o site. Por favor, visite: ' + url);
    }
  };

  // Função para abrir o modal de adoção responsável
  const handleAdocaoResponsavel = () => {
    setModalVisible(true);
  };

  // ✅ Loading de verificação de autenticação
  if (authLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={{ color: '#FFFFFF', marginTop: 20 }}>Verificando autenticação...</Text>
      </View>
    );
  }

  // ✅ Se não estiver autenticado, não renderizar nada (será redirecionado)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <ImageBackground
      source={require('../../assets/images/backgrounds/Fundo_05.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <StatusBar style="dark" />

      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.title}>Configurações</Text>

        {/* ✅ Adicionar informações do usuário */}

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.contentContainer}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Denuncia casos de Abandono</Text>
              <Text style={[styles.phoneNumber, styles.centerText]}>Disque: 181 ou 190</Text>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleLearnMore}>
              <Text style={styles.buttonText}>Saiba Mais sobre o{'\n'}Abandono de Animais</Text>
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
        </ScrollView>

        {/* Bottom Navigation */}
        <View style={styles.bottomNavigation}>
          <TouchableOpacity style={styles.navItem} onPress={() => router.push('/pages/PetDonation')}>
            <Image source={require('../../assets/images/Icone/adoption-icon.png')} style={styles.navIcon} />
            <Text style={styles.navText}>Doação</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => router.push('/pages/PetAdoptionScreen')}>
            <Image source={require('../../assets/images/Icone/donation-icon.png')} style={styles.navIcon} />
            <Text style={styles.navText}>Pets</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem}>
            {/* ✅ Indicar que esta é a tela ativa */}
            <View style={styles.activeCircle}>
              <Image source={require('../../assets/images/Icone/profile-icon.png')} style={styles.navIcon} />
            </View>
            <Text style={styles.activeNavText}>Perfil</Text>
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
    color: '#FFFFFFFF',
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  // ✅ Novo estilo para informações do usuário
  userInfoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    marginHorizontal: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    marginBottom: 10,
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4682B4',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    marginBottom: 20,
    alignItems: 'center',
    paddingTop: 10,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
    textAlign: 'center',
    marginTop: -20,
  },
  phoneNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF0000',
    marginBottom: 20,
    marginTop: 50,
  },
  centerText: {
    textAlign: 'center',
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
  // ✅ Novos estilos para navegação ativa
  activeNavText: {
    fontSize: 12,
    marginTop: 3,
    color: '#4682B4',
    fontWeight: 'bold',
  },
  activeCircle: {
    backgroundColor: '#E8F1F8',
    borderRadius: 20,
    padding: 5,
  },
});
