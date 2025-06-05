// TermoDoacaoModalAuto.tsx - Modal automático ATUALIZADO com verificação de dados completos

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  ActivityIndicator,
  Switch,
  BackHandler,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { createOrUpdateTermoDoacao } from '@/services/api/TermoDoacao/checkCanCreatePets'; // 🆕 Função atualizada
import { getTermoDoacao } from '@/services/api/TermoDoacao/getTermoDoacao';
import { sendTermoDoacaoEmail } from '@/services/api/TermoDoacao/sendTermoDoacaoEmail';

interface TermoDoacaoData {
  id: number;
  doador_nome: string;
  doador_email: string;
  doador_telefone?: string;
  doador_cpf?: string;
  motivo_doacao: string;
  condicoes_adocao?: string;
  observacoes?: string;
  assinatura_digital: string;
  data_assinatura: string;
  hash_documento: string;
  estado?: {
    nome: string;
  };
  cidade?: {
    nome: string;
  };
}

interface TermoDoacaoModalAutoProps {
  visible: boolean;
  usuarioLogado: {
    id: number;
    nome: string;
    email: string;
    telefone?: string;
  };
  // Callback para quando termo for concluído e usuário puder usar a tela
  onTermoCompleted: () => void;
  // 🆕 Prop para indicar se é modo de atualização de dados (nome, email, telefone)
  isDataUpdateMode?: boolean;
}

interface FormData {
  motivoDoacao: string;
  assinaturaDigital: string;
  condicoesAdocao: string;
  observacoes: string;
  confirmaResponsavelLegal: boolean;
  autorizaVisitas: boolean;
  aceitaAcompanhamento: boolean;
  confirmaSaude: boolean;
  autorizaVerificacao: boolean;
  compromesteContato: boolean;
}

const TermoDoacaoModal: React.FC<TermoDoacaoModalAutoProps> = ({
  visible,
  usuarioLogado,
  onTermoCompleted,
  isDataUpdateMode = false, // 🆕 Default false para compatibilidade
}) => {
  const [step, setStep] = useState<'loading' | 'form' | 'termo' | 'email-sent'>('loading');
  const [termoData, setTermoData] = useState<TermoDoacaoData | null>(null);
  const [loading, setLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  // Estado do formulário
  const [formData, setFormData] = useState<FormData>({
    motivoDoacao: '',
    assinaturaDigital: usuarioLogado.nome || '',
    condicoesAdocao: '',
    observacoes: '',
    confirmaResponsavelLegal: false,
    autorizaVisitas: false,
    aceitaAcompanhamento: false,
    confirmaSaude: false,
    autorizaVerificacao: false,
    compromesteContato: false,
  });

  // 🚫 Bloquear botão de voltar do Android quando modal estiver aberto
  useEffect(() => {
    const backAction = () => {
      if (visible && !emailSent) {
        const message = isDataUpdateMode
          ? 'Você precisa reAssinar o termo com seus dados atualizados para continuar cadastrando pets.'
          : 'Você precisa assinar o termo de responsabilidade para cadastrar pets.';

        Alert.alert('Termo Obrigatório', message, [
          { text: 'Continuar Assinando', style: 'cancel' },
          { text: 'Voltar à Tela Anterior', onPress: handleGoBack },
        ]);
        return true; // Bloqueia o back
      }
      return false; // Permite o back
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [visible, emailSent, isDataUpdateMode]);

  // 🆕 Função para obter o token de autenticação
  const getAuthToken = async () => {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const possibleTokenKeys = ['@App:authToken', '@App:token', '@App:accessToken', '@App:userToken', '@App:jwt'];

      for (const key of possibleTokenKeys) {
        const token = await AsyncStorage.getItem(key);
        if (token) {
          console.log(`✅ Token encontrado na chave: ${key}`);
          return token;
        }
      }

      const userData = await AsyncStorage.getItem('@App:userData');
      if (userData) {
        const user = JSON.parse(userData);
        if (user.token || user.accessToken || user.authToken) {
          return user.token || user.accessToken || user.authToken;
        }
      }

      return null;
    } catch (error) {
      console.error('❌ Erro ao buscar token:', error);
      return null;
    }
  };

  // 🔧 Inicializar modal quando abrir
  useEffect(() => {
    if (visible) {
      initializeModal();
    }
  }, [visible, isDataUpdateMode]); // 🆕 Adicionado isDataUpdateMode como dependência

  // 🆕 Função ATUALIZADA para inicializar o modal
  const initializeModal = async () => {
    const modoTexto = isDataUpdateMode ? 'atualização de dados' : 'criação inicial';
    console.log(`🚀 Inicializando modal de termo (${modoTexto})...`);

    setStep('loading');
    setEmailSent(false);

    // Carregar token
    const token = await getAuthToken();
    setAuthToken(token);

    // 🆕 Lógica diferente baseada no modo
    if (isDataUpdateMode) {
      // Modo de atualização - pular verificação e ir direto para formulário
      console.log('🔄 Modo atualização de dados - indo direto para formulário');
      await loadExistingTermoData(); // Carregar dados do termo existente
      setStep('form');
    } else {
      // Modo normal - verificar se usuário já possui termo
      await checkExistingTermo();
    }
  };

  // 🆕 Função para carregar dados do termo existente (para pré-preencher formulário)
  const loadExistingTermoData = async () => {
    try {
      console.log('📋 Carregando dados do termo existente para pré-preenchimento...');

      const response = await getTermoDoacao();

      if (response && response.data) {
        const termo = response.data;

        // Pré-preencher formulário com dados existentes
        setFormData((prev) => ({
          ...prev,
          motivoDoacao: termo.motivo_doacao || '',
          assinaturaDigital: usuarioLogado.nome || termo.assinatura_digital || '', // 🆕 Usar dados atuais do usuário
          condicoesAdocao: termo.condicoes_adocao || '',
          observacoes: termo.observacoes || '',
          // Manter compromissos aceitos
          confirmaResponsavelLegal: true,
          autorizaVisitas: true,
          aceitaAcompanhamento: true,
          confirmaSaude: true,
          autorizaVerificacao: true,
          compromesteContato: true,
        }));

        setTermoData(termo);
        console.log('✅ Dados do termo carregados para atualização');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar dados do termo existente:', error);
      // Em caso de erro, manter formulário vazio
    }
  };

  // 🔧 Função para verificar termo existente (modo normal)
  const checkExistingTermo = async () => {
    try {
      console.log('🔍 Verificando se usuário já possui termo de doação...');

      const response = await getTermoDoacao();

      if (response && response.data) {
        console.log('✅ Usuário já possui termo, enviando PDF automaticamente...');
        setTermoData(response.data);
        setStep('termo');

        // Enviar PDF automaticamente se ainda não foi enviado
        if (!response.data.data_envio_pdf) {
          await handleAutoSendEmail(response.data);
        } else {
          // Se já foi enviado, liberar o usuário
          handleEmailSentSuccess();
        }
      } else {
        console.log('ℹ️ Usuário não possui termo, mostrando formulário');
        setStep('form');
      }
    } catch (error: any) {
      if (error.message.includes('não possui um termo')) {
        console.log('ℹ️ Confirmado: usuário não possui termo');
        setStep('form');
      } else if (error.message.includes('Sessão expirada')) {
        Alert.alert('Sessão Expirada', 'Sua sessão expirou. Você será redirecionado para a tela anterior.', [
          { text: 'OK', onPress: handleGoBack },
        ]);
      } else {
        setStep('form');
      }
    }
  };

  // 🔧 Função ATUALIZADA para criar/atualizar termo
  const handleCreateTermo = async () => {
    // Validações básicas
    if (!formData.motivoDoacao.trim()) {
      Alert.alert('Erro', 'Por favor, informe o motivo da doação.');
      return;
    }

    if (!formData.assinaturaDigital.trim()) {
      Alert.alert('Erro', 'Por favor, digite seu nome para assinatura digital.');
      return;
    }

    // Verificar se todos os compromissos foram aceitos
    const compromissosObrigatorios = [
      'confirmaResponsavelLegal',
      'autorizaVisitas',
      'aceitaAcompanhamento',
      'confirmaSaude',
      'autorizaVerificacao',
      'compromesteContato',
    ];

    const compromissosNaoAceitos = compromissosObrigatorios.filter(
      (compromisso) => !formData[compromisso as keyof FormData]
    );

    if (compromissosNaoAceitos.length > 0) {
      Alert.alert(
        'Compromissos Obrigatórios',
        'Todos os compromissos devem ser aceitos para poder cadastrar pets para doação.'
      );
      return;
    }

    try {
      setLoading(true);

      const acaoTexto = isDataUpdateMode ? 'Atualizando' : 'Criando';
      console.log(`📝 ${acaoTexto} termo de doação...`);

      // 🆕 Usar função atualizada que suporta criação e atualização
      const response = await createOrUpdateTermoDoacao(
        {
          motivoDoacao: formData.motivoDoacao.trim(),
          assinaturaDigital: formData.assinaturaDigital.trim(),
          condicoesAdocao: formData.condicoesAdocao.trim() || undefined,
          observacoes: formData.observacoes.trim() || undefined,
          confirmaResponsavelLegal: formData.confirmaResponsavelLegal,
          autorizaVisitas: formData.autorizaVisitas,
          aceitaAcompanhamento: formData.aceitaAcompanhamento,
          confirmaSaude: formData.confirmaSaude,
          autorizaVerificacao: formData.autorizaVerificacao,
          compromesteContato: formData.compromesteContato,
        },
        isDataUpdateMode // 🆕 Passar flag de atualização
      );

      if (response && response.data) {
        const acaoTextoFinal = response.updated ? 'atualizado' : 'criado';
        console.log(`✅ Termo ${acaoTextoFinal} com sucesso!`);

        setTermoData(response.data);
        setStep('termo');

        // Enviar PDF automaticamente após criar/atualizar termo
        await handleAutoSendEmail(response.data);
      }
    } catch (error: any) {
      console.error(`❌ Erro ao ${isDataUpdateMode ? 'atualizar' : 'criar'} termo:`, error);

      let errorMessage = `Erro ao ${isDataUpdateMode ? 'atualizar' : 'criar'} termo de responsabilidade.`;

      if (error.message.includes('Sessão expirada')) {
        Alert.alert('Sessão Expirada', 'Sua sessão expirou. Você será redirecionado para a tela anterior.', [
          { text: 'OK', onPress: handleGoBack },
        ]);
        return;
      }

      if (error.message.includes('já possui um termo')) {
        errorMessage = 'Você já possui um termo de responsabilidade.';
        await checkExistingTermo(); // Recarregar o termo existente
        return;
      } else if (error.message.includes('Todos os compromissos devem ser aceitos')) {
        errorMessage = 'Todos os compromissos devem ser aceitos.';
      }

      Alert.alert('Erro', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 📧 Função para enviar PDF automaticamente
  const handleAutoSendEmail = async (termo: TermoDoacaoData) => {
    try {
      setSendingEmail(true);
      console.log('📧 Enviando termo por email automaticamente...');

      const response = await sendTermoDoacaoEmail(termo.id);

      console.log('✅ Email enviado com sucesso:', response.data);

      handleEmailSentSuccess();
    } catch (error: any) {
      console.error('❌ Erro ao enviar email:', error);
      setSendingEmail(false);

      const retryText = isDataUpdateMode ? 'Tentar Reenviar' : 'Tentar Novamente';

      Alert.alert(
        'Erro no Envio',
        'Não foi possível enviar o PDF por email, mas seu termo foi processado com sucesso. Você pode tentar reenviar mais tarde.',
        [
          { text: 'Continuar Mesmo Assim', onPress: handleEmailSentSuccess },
          { text: retryText, onPress: () => handleAutoSendEmail(termo) },
        ]
      );
    }
  };

  // 🎉 Função chamada quando email foi enviado com sucesso
  const handleEmailSentSuccess = () => {
    setSendingEmail(false);
    setEmailSent(true);
    setStep('email-sent');

    // Aguardar 3 segundos e liberar o usuário
    setTimeout(() => {
      const acaoTexto = isDataUpdateMode ? 'atualizado' : 'criado';
      console.log(`🎉 Termo ${acaoTexto}, liberando acesso à tela...`);
      onTermoCompleted();
    }, 3000);
  };

  // 🔙 Função para voltar à tela anterior
  const handleGoBack = () => {
    console.log('🔙 Voltando à tela anterior...');
    router.back();
  };

  // Função para atualizar campo do formulário
  const updateFormField = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 🆕 Textos dinâmicos baseados no modo
  const headerTitle = isDataUpdateMode ? 'Atualização de Termo' : 'Termo de Responsabilidade';

  const headerSubtitle = isDataUpdateMode
    ? 'Requer nova assinatura com dados atualizados'
    : 'Obrigatório para cadastrar pets';

  const warningText = isDataUpdateMode
    ? 'Seus dados pessoais foram alterados. Para continuar cadastrando pets, você precisa reAssinar o termo com suas informações atualizadas.'
    : 'Para cadastrar pets para doação, você precisa assinar este termo de responsabilidade.';

  const buttonText = isDataUpdateMode ? 'Atualizar Termo' : 'Assinar Termo';

  const successTitle = isDataUpdateMode ? 'Termo Atualizado com Sucesso!' : 'Termo Assinado com Sucesso!';

  const successMessage = isDataUpdateMode
    ? 'Seu termo foi atualizado com seus dados atuais e reenviado por email.'
    : 'Seu termo de responsabilidade foi criado e enviado por email.';

  // 🆕 Função para mostrar os dados que foram alterados
  const renderDataChangesInfo = () => {
    if (!isDataUpdateMode || !termoData) return null;

    const dadosAtuais = {
      nome: usuarioLogado.nome || '',
      email: usuarioLogado.email || '',
      telefone: usuarioLogado.telefone || '',
    };

    const dadosNoTermo = {
      nome: termoData.doador_nome || '',
      email: termoData.doador_email || '',
      telefone: termoData.doador_telefone || '',
    };

    const mudancas = [];
    if (dadosAtuais.nome !== dadosNoTermo.nome) {
      mudancas.push(`Nome: "${dadosNoTermo.nome}" → "${dadosAtuais.nome}"`);
    }
    if (dadosAtuais.email !== dadosNoTermo.email) {
      mudancas.push(`Email: "${dadosNoTermo.email}" → "${dadosAtuais.email}"`);
    }
    if (dadosAtuais.telefone !== dadosNoTermo.telefone) {
      mudancas.push(
        `Telefone: "${dadosNoTermo.telefone || 'Não informado'}" → "${dadosAtuais.telefone || 'Não informado'}"`
      );
    }

    // Nota: Localização (cidade/estado) seria detectada automaticamente pelo backend
    // mas não temos acesso direto aos nomes aqui no modal
    // Se houver necessidade, pode ser adicionado uma nova chamada à API

    if (mudancas.length === 0) return null;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={() => {
        // Bloquear fechamento do modal no Android
        if (!emailSent) {
          Alert.alert('Termo Obrigatório', 'Você precisa assinar o termo para continuar.', [{ text: 'OK' }]);
        }
      }}
    >
      <View style={styles.container}>
        {/* Header fixo */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{headerTitle}</Text>
          <Text style={styles.headerSubtitle}>{headerSubtitle}</Text>
        </View>

        {/* Content */}
        {step === 'loading' && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4682B4" />
            <Text style={styles.loadingText}>
              {isDataUpdateMode ? 'Carregando dados para atualização...' : 'Verificando termo de responsabilidade...'}
            </Text>
          </View>
        )}

        {step === 'form' && (
          <ScrollView
            style={styles.contentContainer}
            contentContainerStyle={styles.formContentContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.warningContainer, isDataUpdateMode && styles.updateWarningContainer]}>
              <Text style={styles.warningIcon}>{isDataUpdateMode ? '🔄' : '⚠️'}</Text>
              <Text style={styles.warningText}>{warningText}</Text>
            </View>

            {/* 🆕 Mostrar informações sobre os dados alterados */}
            {renderDataChangesInfo()}

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                Motivo da Doação <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={formData.motivoDoacao}
                onChangeText={(value) => updateFormField('motivoDoacao', value)}
                placeholder="Ex: Mudança de cidade, não posso cuidar dos pets..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
                maxLength={150}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Condições para Adoção (opcional)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={formData.condicoesAdocao}
                onChangeText={(value) => updateFormField('condicoesAdocao', value)}
                placeholder="Ex: Preferência para famílias com experiência com pets..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={2}
                maxLength={150}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Observações (opcional)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={formData.observacoes}
                onChangeText={(value) => updateFormField('observacoes', value)}
                placeholder="Informações adicionais..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={2}
                maxLength={150}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                Assinatura Digital <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                value={formData.assinaturaDigital}
                onChangeText={(value) => updateFormField('assinaturaDigital', value)}
                placeholder="Digite seu nome completo"
                placeholderTextColor="#999"
                maxLength={100}
              />
            </View>

            {/* Compromissos */}
            <View style={styles.compromissosContainer}>
              <Text style={styles.compromissosTitle}>Compromissos Obrigatórios:</Text>

              <View style={styles.switchContainer}>
                <Switch
                  value={formData.confirmaResponsavelLegal}
                  onValueChange={(value) => updateFormField('confirmaResponsavelLegal', value)}
                  trackColor={{ false: '#DDD', true: '#4682B4' }}
                />
                <Text style={styles.switchLabel}>Confirmo que sou responsável legal pelos pets que cadastrar</Text>
              </View>

              <View style={styles.switchContainer}>
                <Switch
                  value={formData.autorizaVisitas}
                  onValueChange={(value) => updateFormField('autorizaVisitas', value)}
                  trackColor={{ false: '#DDD', true: '#4682B4' }}
                />
                <Text style={styles.switchLabel}>Autorizo visitas de potenciais adotantes</Text>
              </View>

              <View style={styles.switchContainer}>
                <Switch
                  value={formData.aceitaAcompanhamento}
                  onValueChange={(value) => updateFormField('aceitaAcompanhamento', value)}
                  trackColor={{ false: '#DDD', true: '#4682B4' }}
                />
                <Text style={styles.switchLabel}>Aceito acompanhamento pós-adoção</Text>
              </View>

              <View style={styles.switchContainer}>
                <Switch
                  value={formData.confirmaSaude}
                  onValueChange={(value) => updateFormField('confirmaSaude', value)}
                  trackColor={{ false: '#DDD', true: '#4682B4' }}
                />
                <Text style={styles.switchLabel}>
                  Confirmo que fornecerei informações verdadeiras sobre saúde dos pets
                </Text>
              </View>

              <View style={styles.switchContainer}>
                <Switch
                  value={formData.autorizaVerificacao}
                  onValueChange={(value) => updateFormField('autorizaVerificacao', value)}
                  trackColor={{ false: '#DDD', true: '#4682B4' }}
                />
                <Text style={styles.switchLabel}>Autorizo verificação de antecedentes dos adotantes</Text>
              </View>

              <View style={styles.switchContainer}>
                <Switch
                  value={formData.compromesteContato}
                  onValueChange={(value) => updateFormField('compromesteContato', value)}
                  trackColor={{ false: '#DDD', true: '#4682B4' }}
                />
                <Text style={styles.switchLabel}>Comprometo-me a manter contato durante processo de adoção</Text>
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.createButton, loading && styles.disabledButton]}
                onPress={handleCreateTermo}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.createButtonText}>{buttonText}</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
                <Text style={styles.backButtonText}>Voltar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {step === 'termo' && termoData && (
          <View style={styles.contentContainer}>
            {sendingEmail ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1E88E5" />
                <Text style={styles.loadingText}>
                  {isDataUpdateMode ? 'Enviando termo atualizado por email...' : 'Enviando PDF por email...'}
                </Text>
                <Text style={styles.subLoadingText}>Seu termo está sendo enviado para {termoData.doador_email}</Text>
              </View>
            ) : (
              <ScrollView contentContainerStyle={styles.termoContentContainer} showsVerticalScrollIndicator={false}>
                <Text style={styles.termoTitle}>TERMO DE RESPONSABILIDADE DE DOAÇÃO</Text>

                <View style={styles.termoHeader}>
                  <Text style={styles.termoId}>ID: {termoData.id}</Text>
                  <Text style={styles.termoDate}>Data: {formatDate(termoData.data_assinatura)}</Text>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>DADOS DO DOADOR</Text>
                  <Text style={styles.dataText}>Nome: {termoData.doador_nome}</Text>
                  <Text style={styles.dataText}>Email: {termoData.doador_email}</Text>
                  {termoData.doador_telefone && (
                    <Text style={styles.dataText}>Telefone: {termoData.doador_telefone}</Text>
                  )}
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>MOTIVO DA DOAÇÃO</Text>
                  <Text style={styles.dataText}>{termoData.motivo_doacao}</Text>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>COMPROMISSOS ASSUMIDOS</Text>
                  <Text style={styles.commitmentText}>
                    ✓ Responsabilidade legal pelos pets cadastrados{'\n'}✓ Autorização para visitas de adotantes{'\n'}✓
                    Aceite de acompanhamento pós-adoção{'\n'}✓ Fornecimento de informações verdadeiras sobre saúde{'\n'}
                    ✓ Autorização para verificação de adotantes{'\n'}✓ Manutenção de contato durante processo
                  </Text>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>ASSINATURA DIGITAL</Text>
                  <Text style={styles.dataText}>Assinatura: {termoData.assinatura_digital}</Text>
                  <Text style={styles.dataText}>Data: {formatDate(termoData.data_assinatura)}</Text>
                </View>
              </ScrollView>
            )}
          </View>
        )}

        {step === 'email-sent' && (
          <View style={styles.successContainer}>
            <Text style={styles.successIcon}>✅</Text>
            <Text style={styles.successTitle}>{successTitle}</Text>
            <Text style={styles.successMessage}>{successMessage}</Text>
            <Text style={styles.successSubMessage}>📧 Verifique sua caixa de entrada: {usuarioLogado.email}</Text>
            <View style={styles.successTimer}>
              <ActivityIndicator size="small" color="#2E8B57" />
              <Text style={styles.timerText}>Liberando acesso em alguns segundos...</Text>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#4682B4',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E8F5E8',
    textAlign: 'center',
    marginTop: 5,
  },
  contentContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  subLoadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  formContentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  warningContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF3CD',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
    alignItems: 'center',
  },
  // 🆕 Estilo especial para modo de atualização
  updateWarningContainer: {
    backgroundColor: '#E3F2FD',
    borderLeftColor: '#2196F3',
  },
  warningIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
  // 🆕 Estilos para mostrar as mudanças detectadas
  dataChangesContainer: {
    backgroundColor: '#F0F8FF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#4682B4',
  },
  dataChangesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4682B4',
    marginBottom: 10,
  },
  dataChangeItem: {
    fontSize: 13,
    color: '#333',
    marginBottom: 5,
    paddingLeft: 10,
  },
  dataChangeNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
    paddingLeft: 10,
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  required: {
    color: 'red',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  compromissosContainer: {
    backgroundColor: '#F9F9F9',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  compromissosTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4682B4',
    marginBottom: 15,
    textAlign: 'center',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 5,
  },
  switchLabel: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
  },
  buttonContainer: {
    marginTop: 20,
  },
  createButton: {
    backgroundColor: '#4682B4',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#CCC',
  },
  backButton: {
    backgroundColor: '#6C757D',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  termoContentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  termoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#2E8B57',
    marginBottom: 15,
  },
  termoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#DDD',
  },
  termoId: {
    fontSize: 12,
    color: '#666',
  },
  termoDate: {
    fontSize: 12,
    color: '#666',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E8B57',
    marginBottom: 8,
  },
  dataText: {
    fontSize: 13,
    color: '#333',
    marginBottom: 3,
  },
  commitmentText: {
    fontSize: 12,
    color: '#333',
    lineHeight: 18,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  successIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E8B57',
    textAlign: 'center',
    marginBottom: 15,
  },
  successMessage: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 22,
  },
  successSubMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  successTimer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#4682B4',
  },
});

export default TermoDoacaoModal;
