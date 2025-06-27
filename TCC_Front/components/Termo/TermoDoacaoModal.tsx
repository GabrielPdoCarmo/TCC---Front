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
import { createOrUpdateTermoDoacao } from '@/services/api/TermoDoacao/checkCanCreatePets';
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
  onTermoCompleted: () => void;
  isDataUpdateMode?: boolean;
  isVoluntaryView?: boolean; // Nova prop para identificar visualização voluntária
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
  isDataUpdateMode = false,
  isVoluntaryView = false, // Nova prop
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

  // Bloquear botão de voltar do Android quando modal estiver aberto (EXCETO visualização voluntária)
  useEffect(() => {
    const backAction = () => {
      // Se for visualização voluntária, permitir voltar normalmente
      if (isVoluntaryView) {
        handleGoBack();
        return true;
      }

      // Comportamento original para casos obrigatórios
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
  }, [visible, emailSent, isDataUpdateMode, isVoluntaryView]);

  // Função para obter o token de autenticação
  const getAuthToken = async () => {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const possibleTokenKeys = ['@App:authToken', '@App:token', '@App:accessToken', '@App:userToken', '@App:jwt'];

      for (const key of possibleTokenKeys) {
        const token = await AsyncStorage.getItem(key);
        if (token) {
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
      return null;
    }
  };

  // Inicializar modal quando abrir
  useEffect(() => {
    if (visible) {
      initializeModal();
    }
  }, [visible, isDataUpdateMode, isVoluntaryView]);

  // Função para inicializar o modal
  const initializeModal = async () => {
    setStep('loading');
    setEmailSent(false);

    // Carregar token
    const token = await getAuthToken();
    setAuthToken(token);

    // Lógica diferente baseada no modo
    if (isVoluntaryView) {
      // Para visualização voluntária, sempre mostrar o termo existente
      await loadExistingTermoForView();
    } else if (isDataUpdateMode) {
      // Para atualização de dados, carregar dados existentes para o formulário
      await loadExistingTermoData();
      setStep('form');
    } else {
      // Para criação inicial, verificar se já existe
      await checkExistingTermo();
    }
  };

  // Função para carregar termo existente apenas para visualização
  const loadExistingTermoForView = async () => {
    try {
      const response = await getTermoDoacao();

      if (response && response.data) {
        setTermoData(response.data);
        setStep('termo');
      } else {
        Alert.alert('Termo não encontrado', 'Você ainda não possui um termo de responsabilidade.', [
          { text: 'OK', onPress: () => onTermoCompleted() }
        ]);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar o termo. Tente novamente mais tarde.', [
        { text: 'OK', onPress: () => onTermoCompleted() }
      ]);
    }
  };

  // Função para carregar dados do termo existente
  const loadExistingTermoData = async () => {
    try {
      const response = await getTermoDoacao();

      if (response && response.data) {
        const termo = response.data;

        setFormData((prev) => ({
          ...prev,
          motivoDoacao: termo.motivo_doacao || '',
          assinaturaDigital: usuarioLogado.nome || termo.assinatura_digital || '',
          condicoesAdocao: termo.condicoes_adocao || '',
          observacoes: termo.observacoes || '',
          confirmaResponsavelLegal: true,
          autorizaVisitas: true,
          aceitaAcompanhamento: true,
          confirmaSaude: true,
          autorizaVerificacao: true,
          compromesteContato: true,
        }));

        setTermoData(termo);
      }
    } catch (error) {
      // Em caso de erro, manter formulário vazio
    }
  };

  // Função para verificar termo existente
  const checkExistingTermo = async () => {
    try {
      const response = await getTermoDoacao();

      if (response && response.data) {
        setTermoData(response.data);
        setStep('termo');

        if (!response.data.data_envio_pdf) {
          await handleAutoSendEmail(response.data);
        } else {
          handleEmailSentSuccess();
        }
      } else {
        setStep('form');
      }
    } catch (error: any) {
      if (error.message.includes('não possui um termo')) {
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

  // Função para reenviar email voluntariamente
  const handleVoluntaryResendEmail = async () => {
    if (!termoData) {
      Alert.alert('Erro', 'Dados do termo não encontrados. Tente fechar e reabrir o termo.');
      return;
    }

    if (!termoData.id) {
      Alert.alert('Erro', 'ID do termo não encontrado. Tente fechar e reabrir o termo.');
      return;
    }

    try {
      setSendingEmail(true);
      
      
      const response = await sendTermoDoacaoEmail(termoData.id);
      
      
      setSendingEmail(false);
      
      // Mostrar mensagem de sucesso e então fechar o modal
      Alert.alert(
        'Sucesso', 
        `Termo reenviado com sucesso para ${termoData.doador_email}!`, 
        [{ text: 'OK', onPress: () => onTermoCompleted() }]
      );
    } catch (error: any) {
      setSendingEmail(false);
      

      let errorMessage = 'Não foi possível reenviar o termo.';
      
      if (error.message) {
        if (error.message.includes('Sessão expirada') || error.message.includes('não autenticado')) {
          errorMessage = 'Sua sessão expirou. Faça login novamente.';
          Alert.alert('Sessão Expirada', errorMessage, [
            { text: 'OK', onPress: () => onTermoCompleted() }
          ]);
          return;
        } else if (error.message.includes('Termo não encontrado')) {
          errorMessage = 'Termo não encontrado no sistema. Tente recarregar a tela.';
        } else if (error.message.includes('Email não disponível')) {
          errorMessage = 'Email não disponível para envio. Verifique seu perfil.';
        } else if (error.message.includes('Falha no envio')) {
          errorMessage = 'Falha no servidor de email. Tente novamente em alguns minutos.';
        } else {
          errorMessage = `Erro: ${error.message}`;
        }
      } else if (error.status) {
        switch (error.status) {
          case 401:
            errorMessage = 'Não autorizado. Faça login novamente.';
            break;
          case 403:
            errorMessage = 'Sem permissão para reenviar o termo.';
            break;
          case 404:
            errorMessage = 'Termo não encontrado no servidor.';
            break;
          case 500:
            errorMessage = 'Erro interno do servidor. Tente novamente mais tarde.';
            break;
          default:
            errorMessage = `Erro do servidor (${error.status}). Tente novamente.`;
        }
      }

      Alert.alert('Erro no Reenvio', errorMessage, [
        { text: 'OK' }
      ]);
    }
  };

  // Função para criar/atualizar termo
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
        isDataUpdateMode
      );

      if (response && response.data) {
        setTermoData(response.data);
        setStep('termo');
        await handleAutoSendEmail(response.data);
      }
    } catch (error: any) {
      let errorMessage = `Erro ao ${isDataUpdateMode ? 'atualizar' : 'criar'} termo de responsabilidade.`;

      if (error.message.includes('Sessão expirada')) {
        Alert.alert('Sessão Expirada', 'Sua sessão expirou. Você será redirecionado para a tela anterior.', [
          { text: 'OK', onPress: handleGoBack },
        ]);
        return;
      }

      if (error.message.includes('já possui um termo')) {
        errorMessage = 'Você já possui um termo de responsabilidade.';
        await checkExistingTermo();
        return;
      } else if (error.message.includes('Todos os compromissos devem ser aceitos')) {
        errorMessage = 'Todos os compromissos devem ser aceitos.';
      }

      Alert.alert('Erro', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Função para enviar PDF automaticamente
  const handleAutoSendEmail = async (termo: TermoDoacaoData) => {
    try {
      setSendingEmail(true);
      const response = await sendTermoDoacaoEmail(termo.id);
      handleEmailSentSuccess();
    } catch (error: any) {
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

  // Função chamada quando email foi enviado com sucesso
  const handleEmailSentSuccess = () => {
    setSendingEmail(false);
    setEmailSent(true);
    setStep('email-sent');

    setTimeout(() => {
      onTermoCompleted();
    }, 3000);
  };

  // CORREÇÃO PRINCIPAL: Função para voltar baseada no contexto
  const handleGoBack = async () => {
    try {
      if (isVoluntaryView) {
        // Se for visualização voluntária, simplesmente fechar o modal
        onTermoCompleted();
        return;
      }

      // 🚨 Para casos obrigatórios: Limpar qualquer lastRoute que possa ter sido salvo para PetDonation
      await AsyncStorage.removeItem('@App:lastRoute');
      
      // Voltar para a tela principal ao invés de tentar voltar para doação
      router.replace('/pages/PetAdoptionScreen');
    } catch (error) {
      // Em caso de erro, ainda assim voltar para tela principal
      if (isVoluntaryView) {
        onTermoCompleted();
      } else {
        router.replace('/pages/PetAdoptionScreen');
      }
    }
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

  // Textos dinâmicos baseados no modo
  const getHeaderTexts = () => {
    if (isVoluntaryView) {
      return {
        title: 'Visualizar Termo',
        subtitle: 'Termo de responsabilidade atual'
      };
    }
    
    if (isDataUpdateMode) {
      return {
        title: 'Atualização de Termo',
        subtitle: 'Requer nova assinatura com dados atualizados'
      };
    }
    
    return {
      title: 'Termo de Responsabilidade',
      subtitle: 'Obrigatório para cadastrar pets'
    };
  };

  const getWarningText = () => {
    if (isVoluntaryView) {
      return 'Este é seu termo de responsabilidade atual. Você pode reenviar uma cópia para seu email se necessário.';
    }
    
    if (isDataUpdateMode) {
      return 'Seus dados pessoais foram alterados. Para continuar cadastrando pets, você precisa reAssinar o termo com suas informações atualizadas.';
    }
    
    return 'Para cadastrar pets para doação, você precisa assinar este termo de responsabilidade.';
  };

  const getButtonText = () => {
    if (isVoluntaryView) {
      return 'Fechar';
    }
    
    return isDataUpdateMode ? 'Atualizar Termo' : 'Assinar Termo';
  };

  const getSuccessTexts = () => {
    if (isDataUpdateMode) {
      return {
        title: 'Termo Atualizado com Sucesso!',
        message: 'Seu termo foi atualizado com seus dados atuais e reenviado por email.'
      };
    }
    
    return {
      title: 'Termo Assinado com Sucesso!',
      message: 'Seu termo de responsabilidade foi criado e enviado por email.'
    };
  };

  const headerTexts = getHeaderTexts();
  const warningText = getWarningText();
  const buttonText = getButtonText();
  const successTexts = getSuccessTexts();

  // Função para mostrar os dados que foram alterados
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

    if (mudancas.length === 0) return null;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={() => {
        if (isVoluntaryView) {
          handleGoBack();
        } else if (!emailSent) {
          Alert.alert('Termo Obrigatório', 'Você precisa assinar o termo para continuar.', [{ text: 'OK' }]);
        }
      }}
    >
      <View style={styles.container}>
        {/* Header fixo */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{headerTexts.title}</Text>
          <Text style={styles.headerSubtitle}>{headerTexts.subtitle}</Text>
        </View>

        {/* Content */}
        {step === 'loading' && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4682B4" />
            <Text style={styles.loadingText}>
              {isVoluntaryView 
                ? 'Carregando termo...' 
                : isDataUpdateMode 
                  ? 'Carregando dados para atualização...' 
                  : 'Verificando termo de responsabilidade...'
              }
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
                {/* Warning para visualização voluntária */}
                {isVoluntaryView && (
                  <View style={styles.voluntaryWarningContainer}>
                    <Text style={styles.warningIcon}>📋</Text>
                    <Text style={styles.voluntaryWarningText}>{warningText}</Text>
                  </View>
                )}

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

                {/* Botões para visualização voluntária */}
                {isVoluntaryView && (
                  <View style={styles.voluntaryButtonContainer}>
                    <TouchableOpacity
                      style={[styles.resendEmailButton, sendingEmail && styles.disabledButton]}
                      onPress={handleVoluntaryResendEmail}
                      disabled={sendingEmail}
                    >
                      {sendingEmail ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <Text style={styles.resendEmailButtonText}>Reenviar por Email</Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.voluntaryBackButton} onPress={handleGoBack}>
                      <Text style={styles.voluntaryBackButtonText}>Fechar</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        )}

        {step === 'email-sent' && (
          <View style={styles.successContainer}>
            <Text style={styles.successIcon}>✅</Text>
            <Text style={styles.successTitle}>{successTexts.title}</Text>
            <Text style={styles.successMessage}>{successTexts.message}</Text>
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

// Estilos
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
  updateWarningContainer: {
    backgroundColor: '#E3F2FD',
    borderLeftColor: '#2196F3',
  },
  // Container de warning para visualização voluntária
  voluntaryWarningContainer: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
    alignItems: 'center',
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
  // Texto de warning para visualização voluntária
  voluntaryWarningText: {
    flex: 1,
    fontSize: 14,
    color: '#1E88E5',
    lineHeight: 20,
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
    color: '#1E88E5',
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
    color: '#1E88E5',
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
  // Container de botões para visualização voluntária
  voluntaryButtonContainer: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#DDD',
  },
  resendEmailButton: {
    backgroundColor: '#1E88E5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  resendEmailButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  voluntaryBackButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  voluntaryBackButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
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