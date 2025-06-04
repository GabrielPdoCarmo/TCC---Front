// TermoAdocaoModal.tsx - Atualizado com modo de atualização de nome para termos de compromisso

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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createOrUpdateTermoCompromisso, getTermoByPetWithNameCheck } from '@/services/api/TermoCompromisso/checkCanAdopt'; // 🆕 Funções atualizadas
import { sendTermoEmail } from '@/services/api/TermoCompromisso/sendTermoEmail';

interface Pet {
  id: number;
  nome: string;
  raca_nome?: string;
  pet_raca_nome?: string;
  idade: string;
  usuario_nome?: string;
  usuario_email?: string;
  usuario_telefone?: string;
  pet_especie_nome?: string;
  pet_sexo_nome?: string;
}

interface TermoData {
  id: number;
  pet_nome: string;
  pet_raca_nome: string;
  pet_especie_nome: string;
  pet_sexo_nome: string;
  pet_idade: number;
  doador_nome: string;
  doador_email: string;
  doador_telefone?: string;
  adotante_nome: string;
  adotante_email: string;
  adotante_telefone?: string;
  assinatura_digital: string;
  data_assinatura: string;
  observacoes?: string;
  hash_documento: string;
}

interface TermoModalProps {
  visible: boolean;
  onClose: () => void;
  pet: Pet;
  usuarioLogado: {
    id: number;
    nome: string;
    email: string;
    telefone?: string;
  };
  // 🆕 Indica se já existe termo (para ir direto para visualização)
  hasExistingTermo?: boolean;
  // 🆕 Callback quando termo é criado com sucesso (NÃO fecha modal)
  onSuccess?: () => void;
  // 🆕 Callback quando email é enviado com sucesso (fecha modal e vai para WhatsApp)
  onEmailSent?: () => void;
  // 🆕 NOVAS PROPS para modo de atualização de nome
  isNameUpdateMode?: boolean;
  nameNeedsUpdate?: boolean;
}

const TermoAdocaoModal: React.FC<TermoModalProps> = ({
  visible,
  onClose,
  pet,
  usuarioLogado,
  hasExistingTermo = false,
  onSuccess,
  onEmailSent,
  isNameUpdateMode = false, // 🆕 Default false para compatibilidade
  nameNeedsUpdate = false, // 🆕 Default false para compatibilidade
}) => {
  const [step, setStep] = useState<'loading' | 'form' | 'termo'>('loading');
  const [assinaturaDigital, setAssinaturaDigital] = useState(usuarioLogado.nome || '');
  const [observacoes, setObservacoes] = useState('');
  const [termoData, setTermoData] = useState<TermoData | null>(null);
  const [loading, setLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // 📱 Função para formatar telefone no padrão brasileiro
  const formatTelefone = (telefone: string | undefined): string => {
    if (!telefone) return '';

    const numbers = telefone.replace(/\D/g, '');

    if (!numbers) return '';

    if (numbers.length === 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    } else if (numbers.length === 10) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
    } else if (numbers.length === 13 && numbers.startsWith('55')) {
      return `+55 (${numbers.slice(2, 4)}) ${numbers.slice(4, 9)}-${numbers.slice(9)}`;
    } else if (numbers.length >= 8) {
      if (numbers.length === 8) {
        return `${numbers.slice(0, 4)}-${numbers.slice(4)}`;
      } else if (numbers.length === 9) {
        return `${numbers.slice(0, 5)}-${numbers.slice(5)}`;
      }
    }

    return numbers.replace(/(\d{4})(?=\d)/g, '$1-');
  };

  // 🆕 Função para obter o token de autenticação
  const getAuthToken = async () => {
    try {
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
          console.log('✅ Token encontrado em userData');
          return user.token || user.accessToken || user.authToken;
        }
      }

      console.warn('⚠️ Token de autenticação não encontrado no AsyncStorage');
      return null;
    } catch (error) {
      console.error('❌ Erro ao buscar token:', error);
      return null;
    }
  };

  // 🔧 Carregar token e inicializar modal quando abrir
  useEffect(() => {
    if (visible && !initialLoadComplete) {
      initializeModal();
    }
  }, [visible, isNameUpdateMode, nameNeedsUpdate]); // 🆕 Adicionadas dependências

  // 🆕 Função ATUALIZADA para inicializar o modal
  const initializeModal = async () => {
    const modoTexto = isNameUpdateMode ? 'atualização de nome' : hasExistingTermo ? 'visualização' : 'criação inicial';
    console.log(`🚀 Inicializando modal do termo (${modoTexto})...`);
    
    setStep('loading');

    // Carregar token
    const token = await getAuthToken();
    setAuthToken(token);

    if (!token) {
      console.warn('⚠️ Token não encontrado, mas tentando continuar');
    }

    // 🆕 Lógica ATUALIZADA baseada no modo
    if (isNameUpdateMode || nameNeedsUpdate) {
      // Modo de atualização de nome - carregar dados e ir para formulário
      console.log('🔄 Modo atualização de nome - carregando dados do termo para pré-preenchimento');
      await loadExistingTermoData();
      setStep('form');
    } else if (hasExistingTermo) {
      // Modo de visualização - carregar termo completo
      console.log('ℹ️ Modal indicou que existe termo, buscando...');
      await loadTermoCompleto();
    } else {
      // Modo de criação - ir direto para formulário
      console.log('ℹ️ Modal indicou que não existe termo, indo para formulário');
      setStep('form');
    }

    setInitialLoadComplete(true);
  };

  // 🆕 Função para carregar dados do termo existente (para pré-preencher formulário na atualização)
  const loadExistingTermoData = async () => {
    try {
      console.log('📋 Carregando dados do termo existente para pré-preenchimento...');
      
      const response = await getTermoByPetWithNameCheck(pet.id);
      
      if (response && response.data) {
        const termo = response.data;
        
        // Pré-preencher formulário com dados existentes, MAS com nome atual do usuário
        setAssinaturaDigital(usuarioLogado.nome || termo.assinatura_digital || ''); // 🆕 Usar nome atual do usuário
        setObservacoes(termo.observacoes || '');
        
        setTermoData(termo);
        console.log('✅ Dados do termo carregados para atualização');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar dados do termo existente:', error);
      // Em caso de erro, manter formulário com dados do usuário atual
      setAssinaturaDigital(usuarioLogado.nome || '');
    }
  };

  // 🔧 Função ATUALIZADA para criar/atualizar termo
  const handleCreateTermo = async () => {
    if (!assinaturaDigital.trim()) {
      Alert.alert('Erro', 'Por favor, digite seu nome para assinatura digital.');
      return;
    }

    try {
      setLoading(true);

      const acaoTexto = isNameUpdateMode ? 'Atualizando' : 'Criando';
      console.log(`📝 ${acaoTexto} termo para pet ID:`, pet.id);

      // 🆕 Usar função atualizada que suporta criação e atualização
      const response = await createOrUpdateTermoCompromisso(
        {
          petId: pet.id,
          assinaturaDigital: assinaturaDigital.trim(),
          observacoes: observacoes.trim() || undefined,
        },
        isNameUpdateMode // 🆕 Passar flag de atualização
      );

      console.log(`📨 Resposta do ${acaoTexto.toLowerCase()}:`, response);

      if (response && (response.data || response.message)) {
        const acaoTextoFinal = response.updated ? 'atualizado' : 'criado';
        console.log(`✅ Termo ${acaoTextoFinal} com sucesso, buscando dados completos...`);

        // 🔧 Pequeno delay para garantir que o backend salvou completamente
        await new Promise((resolve) => setTimeout(resolve, 500));

        // 🔧 Buscar termo completo após criação/atualização para garantir dados atualizados
        await loadTermoCompleto();

        // 🆕 Notificar que termo foi criado/atualizado (para o fluxo iOS) - MAS NÃO FECHA MODAL
        if (onSuccess) {
          onSuccess();
        }

        const mensagemSucesso = isNameUpdateMode 
          ? 'Termo de compromisso atualizado com seu nome atual! Agora envie por email para habilitar o WhatsApp.'
          : 'Termo de compromisso criado com sucesso! Agora envie por email para habilitar o WhatsApp.';
        
        Alert.alert('Sucesso', mensagemSucesso);
      } else {
        throw new Error('Resposta inválida da API');
      }
    } catch (error: any) {
      console.error(`❌ Erro ao ${isNameUpdateMode ? 'atualizar' : 'criar'} termo:`, error);

      let errorMessage = `Erro ao ${isNameUpdateMode ? 'atualizar' : 'criar'} termo de compromisso.`;

      if (error.message.includes('Sessão expirada')) {
        errorMessage = 'Sessão expirada. Faça login novamente.';
        Alert.alert('Erro de Autenticação', errorMessage, [{ text: 'OK', onPress: handleClose }]);
        return;
      }

      if (error.message.includes('Este pet já possui um termo')) {
        if (!isNameUpdateMode) {
          errorMessage = 'Este pet já possui um termo de compromisso.';
          console.log('ℹ️ Termo já existe, carregando dados...');
          await loadTermoCompleto();

          // 🆕 Notificar que termo existe (para o fluxo iOS)
          if (onSuccess) {
            onSuccess();
          }

          Alert.alert('Informação', 'Este pet já possui um termo de compromisso. Exibindo o termo existente.');
          return;
        }
      } else if (error.message.includes('não pode adotar seu próprio pet')) {
        errorMessage = 'Você não pode adotar seu próprio pet.';
      } else if (error.message.includes('Pet não encontrado')) {
        errorMessage = 'Pet não encontrado.';
      } else {
        errorMessage = error.message;
      }

      Alert.alert('Erro', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 🆕 Função centralizada para carregar termo completo
  const loadTermoCompleto = async () => {
    try {
      console.log('🔄 Carregando termo completo para pet ID:', pet.id);

      const response = await getTermoByPetWithNameCheck(pet.id);

      if (response && response.data) {
        console.log('✅ Termo completo carregado:', response.data);
        setTermoData(response.data);
        setStep('termo');
      } else {
        console.warn('⚠️ Termo não encontrado após criação/atualização');
        setStep('form');
      }
    } catch (error: any) {
      console.error('❌ Erro ao carregar termo completo:', error);

      if (error.message.includes('Sessão expirada')) {
        Alert.alert('Erro de Autenticação', 'Sessão expirada. Faça login novamente.', [
          { text: 'OK', onPress: handleClose },
        ]);
        return;
      }

      // Se der erro ao buscar, mostrar formulário
      setStep('form');
    }
  };

  // 🆕 Função para buscar termo atualizado (útil para refresh)
  const refreshTermo = async () => {
    if (!termoData) return;

    try {
      setLoading(true);
      console.log('🔄 Atualizando dados do termo...');
      await loadTermoCompleto();
      console.log('✅ Termo atualizado');
    } catch (error) {
      console.error('❌ Erro ao atualizar termo:', error);
    } finally {
      setLoading(false);
    }
  };

  // 📧 Função para enviar termo por email (com callback para o fluxo iOS)
  const handleSendEmail = async () => {
    if (!termoData) return;

    try {
      setSendingEmail(true);
      console.log('📧 Enviando termo por email para ID:', termoData.id);

      const response = await sendTermoEmail(termoData.id);

      const mensagemSucesso = isNameUpdateMode 
        ? `O termo foi atualizado e enviado com sucesso para:\n\n📧 ${response.data.destinatario}\n\nVerifique a caixa de entrada e spam.`
        : `O termo foi enviado com sucesso para:\n\n📧 ${response.data.destinatario}\n\nVerifique a caixa de entrada e spam.`;

      Alert.alert(
        'Email Enviado! 📧',
        mensagemSucesso,
        [
          {
            text: 'OK',
            onPress: () => {
              const acaoTexto = isNameUpdateMode ? 'atualizado' : 'criado';
              console.log(`📧 Email do termo ${acaoTexto} enviado com sucesso, notificando fluxo iOS...`);

              // 🆕 Notificar que email foi enviado (fecha modal e vai para WhatsApp habilitado)
              if (onEmailSent) {
                onEmailSent();
              } else {
                // Fallback: fechar modal
                handleClose();
              }
            },
          },
        ]
      );

      console.log('✅ Email enviado com sucesso:', response.data);
    } catch (error: any) {
      console.error('❌ Erro ao enviar email:', error);

      if (error.message.includes('Sessão expirada')) {
        Alert.alert('Erro de Autenticação', 'Sessão expirada. Faça login novamente.', [
          { text: 'OK', onPress: handleClose },
        ]);
        return;
      }

      let errorMessage = 'Erro ao enviar email com o termo.';

      if (error.message.includes('Email do adotante não está disponível')) {
        errorMessage = 'Email do adotante não está disponível no sistema.';
      } else if (error.message.includes('Falha no envio do email')) {
        errorMessage = 'Falha no envio do email. Verifique o endereço e tente novamente.';
      } else if (error.message.includes('Termo não encontrado')) {
        errorMessage = 'Termo não encontrado no sistema.';
      }

      Alert.alert('Erro no Envio', errorMessage);
    } finally {
      setSendingEmail(false);
    }
  };

  // 🔧 Função de fechamento com reset completo
  const handleClose = () => {
    console.log('🔒 Fechando modal do termo e resetando estados...');

    // Reset todos os estados
    setStep('loading');
    setAssinaturaDigital(usuarioLogado.nome || '');
    setObservacoes('');
    setTermoData(null);
    setLoading(false);
    setSendingEmail(false);
    setAuthToken(null);
    setInitialLoadComplete(false);

    onClose();
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
  const headerTitle = isNameUpdateMode 
    ? 'Atualização de Termo'
    : 'Termo de Compromisso';
    
  const formTitle = isNameUpdateMode
    ? 'Atualizar Termo de Adoção'
    : 'Criar Termo de Adoção';
    
  const buttonText = isNameUpdateMode ? 'Atualizar Termo' : 'Criar Termo';
  
  const loadingText = isNameUpdateMode
    ? 'Carregando dados para atualização...'
    : hasExistingTermo 
      ? 'Carregando termo existente...' 
      : 'Preparando criação do termo...';

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{headerTitle}</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Content */}
          {step === 'loading' && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4682B4" />
              <Text style={styles.loadingText}>{loadingText}</Text>
            </View>
          )}

          {step === 'form' && (
            <ScrollView
              style={styles.formContainer}
              contentContainerStyle={styles.formContentContainer}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.sectionTitle}>{formTitle}</Text>

              {/* 🆕 Aviso especial para atualização de nome */}
              {isNameUpdateMode && (
                <View style={styles.updateWarningContainer}>
                  <Text style={styles.updateWarningIcon}>🔄</Text>
                  <Text style={styles.updateWarningText}>
                    Seu nome foi alterado no perfil. Para continuar com o processo de adoção, você precisa atualizar o termo com seu nome atual.
                  </Text>
                </View>
              )}

              <View style={styles.petInfoContainer}>
                <Text style={styles.petInfoTitle}>Pet: {pet.nome}</Text>
                <Text style={styles.petInfoText}>Raça: {pet.raca_nome || pet.pet_raca_nome || 'Não informado'}</Text>
                <Text style={styles.petInfoText}>Idade: {pet.idade} anos</Text>
                <Text style={styles.petInfoText}>Dono: {pet.usuario_nome || 'Não informado'}</Text>
                {/* 📱 Telefone formatado do dono do pet */}
                {pet.usuario_telefone && (
                  <Text style={styles.petInfoText}>Telefone: {formatTelefone(pet.usuario_telefone)}</Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Assinatura Digital *</Text>
                <TextInput
                  style={styles.textInput}
                  value={assinaturaDigital}
                  onChangeText={setAssinaturaDigital}
                  placeholder="Digite seu nome completo"
                  placeholderTextColor="#999"
                />
                {/* 🆕 Texto explicativo para atualização de nome */}
                {isNameUpdateMode && (
                  <Text style={styles.inputHelperText}>
                    ✅ Nome atualizado automaticamente para "{usuarioLogado.nome}"
                  </Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Observações (opcional)</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={observacoes}
                  onChangeText={setObservacoes}
                  placeholder="Digite suas observações sobre a adoção"
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <TouchableOpacity
                style={[styles.createButton, loading && styles.disabledButton, isNameUpdateMode && styles.updateButton]}
                onPress={handleCreateTermo}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.createButtonText}>{buttonText}</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          )}

          {step === 'termo' && termoData && (
            <ScrollView
              style={styles.termoContainer}
              contentContainerStyle={styles.termoContentContainer}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.termoTitle}>TERMO DE COMPROMISSO DE ADOÇÃO</Text>

              <View style={styles.termoHeader}>
                <Text style={styles.termoId}>ID: {termoData.id}</Text>
                <Text style={styles.termoDate}>Data: {formatDate(termoData.data_assinatura)}</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>DADOS DO PET</Text>
                <Text style={styles.dataText}>Nome: {termoData.pet_nome}</Text>
                <Text style={styles.dataText}>Espécie: {termoData.pet_especie_nome}</Text>
                <Text style={styles.dataText}>Raça: {termoData.pet_raca_nome}</Text>
                <Text style={styles.dataText}>Sexo: {termoData.pet_sexo_nome}</Text>
                <Text style={styles.dataText}>Idade: {termoData.pet_idade} anos</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>DADOS DO DOADOR</Text>
                <Text style={styles.dataText}>Nome: {termoData.doador_nome}</Text>
                <Text style={styles.dataText}>Email: {termoData.doador_email}</Text>
                {/* 📱 Telefone formatado do doador */}
                {termoData.doador_telefone && (
                  <Text style={styles.dataText}>Telefone: {formatTelefone(termoData.doador_telefone)}</Text>
                )}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>DADOS DO ADOTANTE</Text>
                <Text style={styles.dataText}>Nome: {termoData.adotante_nome}</Text>
                <Text style={styles.dataText}>Email: {termoData.adotante_email}</Text>
                {/* 📱 Telefone formatado do adotante */}
                {termoData.adotante_telefone && (
                  <Text style={styles.dataText}>Telefone: {formatTelefone(termoData.adotante_telefone)}</Text>
                )}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>COMPROMISSOS DO ADOTANTE</Text>
                <Text style={styles.commitmentText}>
                  1. Proporcionar cuidados veterinários adequados ao pet.{'\n'}
                  2. Oferecer alimentação adequada e de qualidade.{'\n'}
                  3. Providenciar abrigo seguro e confortável.{'\n'}
                  4. Não abandonar, maltratar ou submeter o animal a maus-tratos.{'\n'}
                  5. Entrar em contato com o doador antes de repassar a terceiros.{'\n'}
                  6. Permitir visitas do doador mediante agendamento prévio.{'\n'}
                  7. Informar mudanças de endereço ou contato.
                </Text>
              </View>

              {termoData.observacoes && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>OBSERVAÇÕES</Text>
                  <Text style={styles.dataText}>{termoData.observacoes}</Text>
                </View>
              )}

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>ASSINATURA DIGITAL</Text>
                <Text style={styles.dataText}>Assinatura: {termoData.assinatura_digital}</Text>
                <Text style={styles.dataText}>Data: {formatDate(termoData.data_assinatura)}</Text>
                <Text style={styles.hashText}>Hash: {termoData.hash_documento}</Text>
              </View>

              <TouchableOpacity
                style={[styles.emailButton, sendingEmail && styles.disabledButton]}
                onPress={handleSendEmail}
                disabled={sendingEmail}
              >
                {sendingEmail ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.emailButtonText}>
                    {isNameUpdateMode ? 'Enviar Termo Atualizado' : 'Enviar por Email'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '95%',
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#4682B4',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
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
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  formContainer: {
    padding: 20,
  },
  formContentContainer: {
    paddingBottom: 30,
  },
  // 🆕 Estilo para aviso de atualização de nome
  updateWarningContainer: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
    alignItems: 'center',
  },
  updateWarningIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  updateWarningText: {
    flex: 1,
    fontSize: 14,
    color: '#1565C0',
    lineHeight: 20,
  },
  petInfoContainer: {
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  petInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4682B4',
    marginBottom: 5,
  },
  petInfoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
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
  // 🆕 Texto de ajuda para inputs
  inputHelperText: {
    fontSize: 12,
    color: '#2E8B57',
    marginTop: 5,
    fontStyle: 'italic',
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
  createButton: {
    backgroundColor: '#4682B4',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  // 🆕 Estilo especial para botão de atualização
  updateButton: {
    backgroundColor: '#2196F3',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#CCC',
    borderColor: '#CCC',
  },
  termoContainer: {
    padding: 20,
    paddingBottom: 30,
  },
  termoContentContainer: {
    paddingBottom: 30,
  },
  termoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#4682B4',
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
    color: '#4682B4',
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
  hashText: {
    fontSize: 10,
    color: '#999',
    fontFamily: 'monospace',
  },
  emailButton: {
    backgroundColor: '#1E88E5',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  emailButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TermoAdocaoModal;