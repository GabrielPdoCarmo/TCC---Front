import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  ImageBackground,
  SafeAreaView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { router } from 'expo-router';
import updateUsuario from '@/services/api/Usuario/updateUsuario';
import checkCode from '../../services/api/Codigo/checkCode';
import sendRecoveryCode from '../../services/api/Codigo/sendRecoveryCode';

export default function ForgotPasswordScreen() {
  // Estados para controlar as etapas da recuperação de senha
  const [etapa, setEtapa] = useState(1); // 1: Email, 2: Código, 3: Nova senha
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [temporizador, setTemporizador] = useState(240); // 4 minutos em segundos
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const [usuarioId, setUsuarioId] = useState<number | null>(null);

  // Estados para erros
  const [erroEmail, setErroEmail] = useState('');
  const [erroCodigo, setErroCodigo] = useState('');
  const [erroSenha, setErroSenha] = useState('');
  const [erroConfirmarSenha, setErroConfirmarSenha] = useState('');
  const [carregando, setCarregando] = useState(false);

  // Timer para o código de verificação
  useEffect(() => {
    let intervalo: NodeJS.Timeout | undefined;
    if (etapa === 2 && temporizador > 0) {
      intervalo = setInterval(() => {
        setTemporizador((tempoAnterior) => tempoAnterior - 1);
      }, 1000);
    }

    return () => {
      if (intervalo) clearInterval(intervalo);
    };
  }, [etapa, temporizador]);

  // Formatação do timer
  const formatarTempo = (tempoEmSegundos: number): string => {
    const minutos = Math.floor(tempoEmSegundos / 60);
    const segundos = tempoEmSegundos % 60;
    return `${minutos}:${segundos < 10 ? '0' : ''}${segundos}`;
  };

  // Limpar erros conforme campos são alterados
  useEffect(() => {
    if (email) setErroEmail('');
  }, [email]);

  useEffect(() => {
    if (codigo) setErroCodigo('');
  }, [codigo]);

  useEffect(() => {
    if (novaSenha) setErroSenha('');
  }, [novaSenha]);

  useEffect(() => {
    if (confirmarSenha) setErroConfirmarSenha('');
  }, [confirmarSenha]);

  // Função para solicitar o código de recuperação
  const solicitarCodigo = async () => {
    setErroEmail('');

    // Validar e-mail
    if (!email) {
      setErroEmail('O e-mail é obrigatório');
      return;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setErroEmail('E-mail inválido');
      return;
    }

    setCarregando(true);
    try {
      // Chamar a API para enviar o código de recuperação
      const resultado = await sendRecoveryCode(email);

      if (resultado && resultado.success) {
        // Armazenar o ID do usuário para uso posterior
        if (resultado.usuarioId) {
          setUsuarioId(resultado.usuarioId);
        }

        // Avançar para a próxima etapa
        setEtapa(2);
        setTemporizador(240); // 4 minutos

        Alert.alert('Código enviado', 'Um código de verificação foi enviado para o seu e-mail');
      } else {
        throw new Error('Falha ao enviar o código de recuperação');
      }
    } catch (error: any) {
      console.error('Erro ao solicitar código de recuperação:', error);

      // Verificar se é erro de e-mail não encontrado
      if (error.error && error.error.includes('não encontrado')) {
        setErroEmail('E-mail não cadastrado no sistema');
      } else {
        Alert.alert('Erro', 'Não foi possível enviar o código. Verifique seu e-mail e tente novamente.');
      }
    } finally {
      setCarregando(false);
    }
  };

  // Função para verificar o código
  const verificarCodigo = async () => {
    setErroCodigo('');

    // Validar código
    if (!codigo) {
      setErroCodigo('O código é obrigatório');
      return;
    } else if (codigo.length < 6) {
      setErroCodigo('Código inválido');
      return;
    }

    setCarregando(true);
    try {
      // Chamar a API para verificar o código
      const resultado = await checkCode(email, codigo);

      if (resultado && resultado.success) {
        // Garantir que temos o ID do usuário
        if (resultado.usuarioId && !usuarioId) {
          setUsuarioId(resultado.usuarioId);
        }

        // Avançar para a próxima etapa
        setEtapa(3);
      } else {
        throw new Error('Código inválido ou expirado');
      }
    } catch (error) {
      console.error('Erro ao verificar código:', error);
      setErroCodigo('Código inválido ou expirado');
    } finally {
      setCarregando(false);
    }
  };

  // Função para definir a nova senha
  const definirNovaSenha = async () => {
    setErroSenha('');
    setErroConfirmarSenha('');

    // Validar senhas
    let temErros = false;

    if (!novaSenha) {
      setErroSenha('A senha é obrigatória');
      temErros = true;
    } else if (novaSenha.length < 8) {
      setErroSenha('A senha deve ter pelo menos 8 caracteres');
      temErros = true;
    }

    if (!confirmarSenha) {
      setErroConfirmarSenha('A confirmação de senha é obrigatória');
      temErros = true;
    } else if (novaSenha !== confirmarSenha) {
      setErroConfirmarSenha('As senhas não coincidem');
      temErros = true;
    }

    if (temErros) return;

    setCarregando(true);
    try {
      // Verifica se temos o ID do usuário
      if (!usuarioId) {
        throw new Error('ID do usuário não encontrado');
      }

      // Atualiza a senha do usuário usando a função updateUsuario
      await updateUsuario({
        id: usuarioId,
        senha: novaSenha,
      });

      Alert.alert('Sucesso', 'Sua senha foi alterada com sucesso!', [{ text: 'OK', onPress: () => router.push('/') }]);
    } catch (error) {
      console.error('Erro ao atualizar senha:', error);
      Alert.alert('Erro', 'Não foi possível alterar sua senha. Tente novamente mais tarde.');
    } finally {
      setCarregando(false);
    }
  };

  // Renderiza o conteúdo apropriado para cada etapa
  const renderizarConteudoEtapa = () => {
    switch (etapa) {
      case 1:
        return (
          <>
            <Text style={styles.textoInstrucao}>
              Por gentileza, digite o seu e-mail para prosseguirmos para a próxima etapa
            </Text>

            <View style={styles.containerInput}>
              <Text style={styles.textoLabel}>
                E-mail <Text style={styles.estrelaObrigatoria}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, erroEmail ? { borderColor: 'red' } : {}]}
                placeholder="E-mail"
                placeholderTextColor="#666"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {erroEmail ? <Text style={styles.textoErro}>{erroEmail}</Text> : null}
            </View>
          </>
        );

      case 2:
        return (
          <>
            <Text style={styles.textoInstrucao}>Um código foi mandado no seu email, coloque no campo abaixo</Text>

            <View style={styles.containerInput}>
              <Text style={styles.textoLabel}>
                Código <Text style={styles.estrelaObrigatoria}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, erroCodigo ? { borderColor: 'red' } : {}]}
                placeholder="Código"
                placeholderTextColor="#666"
                value={codigo}
                onChangeText={setCodigo}
                keyboardType="number-pad"
                maxLength={6}
              />
              {erroCodigo ? <Text style={styles.textoErro}>{erroCodigo}</Text> : null}

              <Text style={styles.textoTemporizador}>
                {temporizador > 0 ? formatarTempo(temporizador) : 'Código expirado'}
              </Text>
            </View>

            {temporizador === 0 && (
              <TouchableOpacity style={styles.botaoReenviar} onPress={() => solicitarCodigo()}>
                <Text style={styles.textoBotaoReenviar}>Reenviar código</Text>
              </TouchableOpacity>
            )}
          </>
        );

      case 3:
        return (
          <>
            <Text style={styles.textoInstrucao}>Por gentileza, coloque sua nova senha nos campos abaixo</Text>

            <View style={styles.containerInput}>
              <Text style={styles.textoLabel}>
                Senha <Text style={styles.estrelaObrigatoria}>*</Text>
              </Text>
              <View style={[styles.containerSenha, erroSenha ? { borderColor: 'red', borderWidth: 1 } : {}]}>
                <TextInput
                  style={styles.inputSenha}
                  placeholder="Senha"
                  placeholderTextColor="#666"
                  secureTextEntry={!mostrarSenha}
                  value={novaSenha}
                  onChangeText={setNovaSenha}
                />
                <TouchableOpacity style={styles.iconeOlho} onPress={() => setMostrarSenha(!mostrarSenha)}>
                  <Icon name={mostrarSenha ? 'eye-off' : 'eye'} size={24} color="#555" />
                </TouchableOpacity>
              </View>
              {erroSenha ? <Text style={styles.textoErro}>{erroSenha}</Text> : null}
            </View>

            <View style={styles.containerInput}>
              <Text style={styles.textoLabel}>
                Confirmar Senha <Text style={styles.estrelaObrigatoria}>*</Text>
              </Text>
              <View style={[styles.containerSenha, erroConfirmarSenha ? { borderColor: 'red', borderWidth: 1 } : {}]}>
                <TextInput
                  style={styles.inputSenha}
                  placeholder="Confirmar Senha"
                  placeholderTextColor="#666"
                  secureTextEntry={!mostrarConfirmarSenha}
                  value={confirmarSenha}
                  onChangeText={setConfirmarSenha}
                />
                <TouchableOpacity
                  style={styles.iconeOlho}
                  onPress={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
                >
                  <Icon name={mostrarConfirmarSenha ? 'eye-off' : 'eye'} size={24} color="#555" />
                </TouchableOpacity>
              </View>
              {erroConfirmarSenha ? <Text style={styles.textoErro}>{erroConfirmarSenha}</Text> : null}
            </View>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <ImageBackground source={require('../../assets/images/backgrounds/Fundo_01.png')} style={styles.imagemFundo}>
      <SafeAreaView style={styles.container}>
        <View style={styles.conteudoPrincipal}>
          <Image source={require('../../assets/images/Icone/Pets_Up.png')} style={styles.imagemLogo} />

          <Text style={styles.textoTitulo}>Esqueceu sua senha?</Text>

          {renderizarConteudoEtapa()}
          
          {/* Container para os botões lado a lado */}
          <View style={styles.containerBotoes}>
            <TouchableOpacity
              style={styles.botaoVoltar}
              onPress={() => {
                if (etapa > 1) {
                  setEtapa(etapa - 1);
                } else {
                  router.push('/');
                }
              }}
            >
              <Icon name="arrow-back" size={20} color="#4285F4" />
              <Text style={styles.textoBotaoVoltar}>Voltar</Text>
            </TouchableOpacity>
            
            {etapa === 1 && (
              <TouchableOpacity style={styles.botaoAcao} onPress={solicitarCodigo} disabled={carregando}>
                <Text style={styles.textoBotaoAcao}>{carregando ? 'Enviando...' : 'Avançar'}</Text>
              </TouchableOpacity>
            )}
            
            {etapa === 2 && (
              <TouchableOpacity
                style={styles.botaoAcao}
                onPress={verificarCodigo}
                disabled={carregando || temporizador === 0.0}
              >
                <Text style={styles.textoBotaoAcao}>{carregando ? 'Verificando...' : 'Avançar'}</Text>
              </TouchableOpacity>
            )}
            
            {etapa === 3 && (
              <TouchableOpacity style={styles.botaoAcao} onPress={definirNovaSenha} disabled={carregando}>
                <Text style={styles.textoBotaoAcao}>{carregando ? 'Alterando...' : 'Avançar'}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  imagemFundo: {
    flex: 1,
    width: '100%',
    backgroundColor: '#4285F4',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  conteudoPrincipal: {
    width: '100%',
    alignItems: 'center',
    borderRadius: 35,
    padding: 20,
  },
  imagemLogo: {
    width: 650,
    height: 235,
    resizeMode: 'contain',
  },
  textoTitulo: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
  },
  containerIconePet: {
    backgroundColor: '#add8e6',
    borderRadius: 20,
    padding: 15,
    alignItems: 'center',
    marginBottom: 30,
    width: '80%',
  },
  imagemColagemPet: {
    width: 200,
    height: 120,
    resizeMode: 'contain',
  },
  textoMarca: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 5,
  },
  textoInstrucao: {
    fontSize: 16,
    color: '#000',
    textAlign: 'center',
    marginBottom: 20,
    width: '90%',
  },
  containerInput: {
    width: '100%',
    marginBottom: 15,
  },
  textoLabel: {
    fontSize: 16,
    color: '#000',
    marginLeft: 10,
    marginBottom: 5,
  },
  estrelaObrigatoria: {
    color: 'red',
  },
  input: {
    backgroundColor: '#E8E8E8',
    width: '90%',
    height: 50,
    borderRadius: 25,
    paddingHorizontal: 20,
    fontSize: 16,
    alignSelf: 'center',
    borderColor: '#ccc',
    borderWidth: 1,
  },
  containerSenha: {
    flexDirection: 'row',
    backgroundColor: '#E8E8E8',
    width: '90%',
    height: 50,
    borderRadius: 25,
    paddingHorizontal: 20,
    alignSelf: 'center',
    borderColor: '#ccc',
    borderWidth: 1,
  },
  inputSenha: {
    flex: 1,
    fontSize: 16,
  },
  iconeOlho: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoErro: {
    color: 'red',
    fontSize: 12,
    marginTop: 5,
    paddingLeft: 25,
    width: '100%',
  },
  textoTemporizador: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginTop: 10,
  },
  containerBotoes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    marginTop: 15,
    marginBottom: 20,
  },
  botaoAcao: {
    backgroundColor: '#E8E8E8',
    width: '48%',
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoBotaoAcao: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  botaoReenviar: {
    padding: 10,
    marginTop: 10,
  },
  textoBotaoReenviar: {
    fontSize: 16,
    color: '#000',
    textDecorationLine: 'underline',
  },
  botaoVoltar: {
    backgroundColor: '#ffffff',
    width: '48%',
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4285F4',
    flexDirection: 'row',
  },
  textoBotaoVoltar: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4285F4',
    marginLeft: 8,
  },
});