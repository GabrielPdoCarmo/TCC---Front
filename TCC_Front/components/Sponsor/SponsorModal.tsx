import React, { useState, useEffect } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, Image, Dimensions, Alert, Linking } from 'react-native';

interface SponsorModalProps {
  visible: boolean;
  onClose: () => void;
}

interface SponsorAd {
  id: number;
  type: 'racao' | 'veterinaria' | 'brinquedos' | 'petshop' | 'banho' | 'seguro';
  title: string;
  subtitle: string;
  description: string;
  backgroundColor: string;
  textColor: string;
  icon: string;
  buttonText: string;
  buttonColor: string;
  phone?: string;
  website?: string;
}

const sponsorAds: SponsorAd[] = [
  {
    id: 1,
    type: 'racao',
    title: '🍖 Super Ração Premium',
    subtitle: 'Nutrição completa para seu pet',
    description:
      'Ração premium com ingredientes naturais. Ideal para todas as idades. Entrega grátis na primeira compra!',
    backgroundColor: '#FF6B35',
    textColor: '#FFFFFF',
    icon: '🥘',
    buttonText: 'Ver Ofertas',
    buttonColor: '#FF4500',
    phone: '(11) 9999-8888',
    website: 'https://www.superracao.com.br',
  },
  {
    id: 2,
    type: 'veterinaria',
    title: '🏥 Clínica VetCare',
    subtitle: 'Cuidado completo para seu amigo',
    description:
      'Consultas, vacinas, cirurgias e emergências 24h. Primeira consulta com 50% de desconto para adotantes!',
    backgroundColor: '#4CAF50',
    textColor: '#FFFFFF',
    icon: '🩺',
    buttonText: 'Agendar Consulta',
    buttonColor: '#388E3C',
    phone: '(11) 3333-7777',
    website: 'https://www.vetcare.com.br',
  },
  {
    id: 3,
    type: 'brinquedos',
    title: '🎾 PetToys Diversão',
    subtitle: 'Brinquedos que seu pet vai amar',
    description:
      'Bolinhas, cordas, pelúcias e muito mais! Estimule a mente do seu pet com nossos brinquedos educativos.',
    backgroundColor: '#9C27B0',
    textColor: '#FFFFFF',
    icon: '🧸',
    buttonText: 'Comprar Agora',
    buttonColor: '#7B1FA2',
    phone: '(11) 2222-6666',
    website: 'https://www.pettoys.com.br',
  },
  {
    id: 4,
    type: 'petshop',
    title: '🏪 Mega PetShop',
    subtitle: 'Tudo para seu pet em um só lugar',
    description:
      'Ração, acessórios, higiene, medicamentos e muito mais. Frete grátis acima de R$ 99 para novos clientes!',
    backgroundColor: '#2196F3',
    textColor: '#FFFFFF',
    icon: '🛍️',
    buttonText: 'Explorar Loja',
    buttonColor: '#1976D2',
    phone: '(11) 4444-5555',
    website: 'https://www.megapetshop.com.br',
  },
  {
    id: 5,
    type: 'banho',
    title: '🛁 Banho & Tosa Premium',
    subtitle: 'Beleza e higiene profissional',
    description:
      'Banho, tosa, hidratação e cuidados especiais. Agende online e ganhe 20% de desconto na primeira visita!',
    backgroundColor: '#00BCD4',
    textColor: '#FFFFFF',
    icon: '✂️',
    buttonText: 'Agendar Banho',
    buttonColor: '#0097A7',
    phone: '(11) 5555-4444',
    website: 'https://www.banhoetosa.com.br',
  }
];
   
const { width } = Dimensions.get('window');

const SponsorModal: React.FC<SponsorModalProps> = ({ visible, onClose }) => {
  const [currentAd, setCurrentAd] = useState<SponsorAd | null>(null);

  // Selecionar propaganda aleatória quando o modal abrir
  useEffect(() => {
    if (visible) {
      const randomIndex = Math.floor(Math.random() * sponsorAds.length);
      setCurrentAd(sponsorAds[randomIndex]);
    }
  }, [visible]);

  // Função para ligar para o patrocinador
  const handleCallSponsor = () => {
    if (!currentAd?.phone) return;

    const phoneNumber = currentAd.phone.replace(/\D/g, '');
    const phoneUrl = `tel:${phoneNumber}`;

    Linking.canOpenURL(phoneUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(phoneUrl);
        } else {
          Alert.alert('Telefone', `Ligue para: ${currentAd.phone}`, [{ text: 'OK' }]);
        }
      })
      .catch(() => {
        Alert.alert('Telefone', `Ligue para: ${currentAd.phone}`, [{ text: 'OK' }]);
      });
  };

  // Função para abrir site do patrocinador
  const handleVisitWebsite = () => {
    if (!currentAd?.website) return;

    Linking.canOpenURL(currentAd.website)
      .then((supported) => {
        if (supported) {
          Linking.openURL(currentAd.website!);
        } else {
          Alert.alert('Website', `Visite: ${currentAd.website}`, [{ text: 'OK' }]);
        }
      })
      .catch(() => {
        Alert.alert('Website', `Visite: ${currentAd.website}`, [{ text: 'OK' }]);
      });
  };

  if (!currentAd) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header com botão fechar */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>📢 Nossos Patrocinadores</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Conteúdo da propaganda */}
          <View style={[styles.adContainer, { backgroundColor: currentAd.backgroundColor }]}>
            <View style={styles.adHeader}>
              <Text style={styles.adIcon}>{currentAd.icon}</Text>
              <View style={styles.adTitleContainer}>
                <Text style={[styles.adTitle, { color: currentAd.textColor }]}>{currentAd.title}</Text>
                <Text style={[styles.adSubtitle, { color: currentAd.textColor }]}>{currentAd.subtitle}</Text>
              </View>
            </View>

            <Text style={[styles.adDescription, { color: currentAd.textColor }]}>{currentAd.description}</Text>

            {/* Botões de ação */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: currentAd.buttonColor }]}
                onPress={handleVisitWebsite}
              >
                <Text numberOfLines={1} style={styles.actionButtonText}>
                  {currentAd.buttonText}
                </Text>
              </TouchableOpacity>

              {currentAd.phone && (
                <TouchableOpacity style={[styles.actionButton, styles.phoneButton]} onPress={handleCallSponsor}>
                  <Text style={styles.actionButtonText}>📞 Ligar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>❤️ Obrigado por apoiar a adoção responsável!</Text>
            <Text style={styles.footerSubtext}>Estes parceiros ajudam a manter nosso app gratuito</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000, // Garantir que apareça acima de outros modais
  },
  modalContainer: {
    width: width * 0.85,
    maxWidth: 350,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#4682B4',
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
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
  adContainer: {
    padding: 20,
  },
  adHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  adIcon: {
    fontSize: 40,
    marginRight: 15,
  },
  adTitleContainer: {
    flex: 1,
  },
  adTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  adSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.9,
  },
  adDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
    opacity: 0.95,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  phoneButton: {
    backgroundColor: '#25D366', // Verde WhatsApp
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  footer: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 20,
    paddingVertical: 15,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4682B4',
    textAlign: 'center',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});

export default SponsorModal;
