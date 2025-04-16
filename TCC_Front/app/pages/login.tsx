import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  ImageBackground,
  SafeAreaView,
} from 'react-native';

// Import your background image

export default function App() {
  return (
    <ImageBackground
      source={require('../../assets/images/backgrounds/Fundo_01.png')} // Replace with your actual background image
      style={styles.backgroundImage}
    >
      <SafeAreaView style={styles.container}>
        {/* Top pet icons */}

        {/* Main content box */}
        <View style={styles.mainContent}>
          <Image
            source={require('../../assets/images/Icone/Pets_Up.png')}
            style={styles.logoImage} // Adicione este estilo
          />

          {/* Login form */}
          <Text style={styles.loginText}>Login:</Text>

          <TextInput style={styles.input} placeholder="E-mail:" placeholderTextColor="#666" />

          <TextInput style={styles.input} placeholder="Senha:" placeholderTextColor="#666" secureTextEntry />

          <Text style={styles.forgotPassword}>Esqueceu seu senha?</Text>

          <TouchableOpacity style={styles.loginButton}>
            <Text style={styles.loginButtonText}>Entrar</Text>
          </TouchableOpacity>

          <View style={styles.registerContainer}>
            <Text style={styles.noAccountText}>Não possui cadastro?</Text>
            <Text style={styles.registerText}>cadastra-se aqui!!</Text>
          </View>
        </View>

        {/* Bottom pet icons */}
        <View style={styles.bottomIcons}></View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    backgroundColor: '#4285F4', // Fallback blue color
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  topIcons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  bottomIcons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  topPetIcon: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
  },
  bottomPetIcon: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
  },
  mainContent: {
    width: '100%',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderRadius: 35,
    padding: 20,
    marginTop: 25,
  },
  petImage: {
    width: 200,
    height: 150,
    resizeMode: 'contain',
  },
  appTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#000',
    marginVertical: 10,
  },
  loginText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#000',
    alignSelf: 'center',
    marginLeft: 20,
    marginTop: 10,
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#E8E8E8',
    width: '90%',
    height: 50,
    borderRadius: 25,
    paddingHorizontal: 20,
    fontSize: 16,
    marginBottom: 15,
  },
  forgotPassword: {
    fontSize: 14,
    color: '#000',
    alignSelf: 'flex-start',
    marginLeft: 30,
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: '#E8E8E8',
    width: '60%',
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  registerContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  noAccountText: {
    fontSize: 16,
    color: '#000',
  },
  registerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  logoImage: {
    width: 650, // Ajuste este valor para diminuir a largura
    height: 235, // Ajuste este valor para diminuir a altura
    resizeMode: 'contain', // Mantém a proporção da imagem
  },
});
