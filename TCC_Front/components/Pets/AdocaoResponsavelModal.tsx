import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AdocaoResponsavelModalProps {
  visible: boolean;
  onClose: () => void;
}

const AdocaoResponsavelModal: React.FC<AdocaoResponsavelModalProps> = ({ visible, onClose }) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.centeredView}>
        <View style={styles.modalView}>
          <View style={styles.header}>
            <Text style={styles.modalTitle}>Adoção Responsável</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.scrollContent}>
            <Text style={styles.sectionTitle}>O que é adoção responsável?</Text>
            <Text style={styles.text}>
              A adoção responsável é um compromisso que vai muito além do ato de levar um animal para casa. 
              É um compromisso para toda a vida do pet, garantindo bem-estar e qualidade de vida.
            </Text>
            
            <Text style={styles.sectionTitle}>Antes de adotar</Text>
            
            <Text style={styles.subTitle}>1. Avalie sua rotina e estilo de vida</Text>
            <Text style={styles.text}>
              • Você tem tempo para cuidar de um pet?{'\n'}
              • Sua rotina permite passear com o animal diariamente?{'\n'}
              • Você tem condições financeiras para arcar com alimentação, vacinas e possíveis tratamentos veterinários?{'\n'}
              • Sua moradia é adequada para o tipo de animal que deseja adotar?
            </Text>
            
            <Text style={styles.subTitle}>2. Envolva toda a família</Text>
            <Text style={styles.text}>
              É fundamental que todos os membros da família estejam de acordo com a adoção e dispostos a 
              participar dos cuidados com o animal.
            </Text>
            
            <Text style={styles.subTitle}>3. Pesquise sobre as necessidades da espécie</Text>
            <Text style={styles.text}>
              Cada espécie e raça tem necessidades específicas de alimentação, exercícios e cuidados veterinários. 
              Informe-se antes de adotar.
            </Text>
            
            <Text style={styles.sectionTitle}>Durante o processo de adoção</Text>
            
            <Text style={styles.subTitle}>1. Adote de fontes confiáveis</Text>
            <Text style={styles.text}>
              Prefira ONGs, abrigos e protetores independentes que realizam triagem e acompanhamento pós-adoção.
            </Text>
            
            <Text style={styles.subTitle}>2. Verifique a saúde do animal</Text>
            <Text style={styles.text}>
              Pergunte sobre o histórico médico, vacinação e condições de saúde do animal. 
              Muitas organizações já entregam os animais castrados e vacinados.
            </Text>
            
            <Text style={styles.subTitle}>3. Conheça sua personalidade</Text>
            <Text style={styles.text}>
              Passe algum tempo com o animal antes de finalizar a adoção. 
              Assim, você pode verificar se o temperamento dele é compatível com sua família e estilo de vida.
            </Text>
            
            <Text style={styles.sectionTitle}>Após a adoção</Text>
            
            <Text style={styles.subTitle}>1. Período de adaptação</Text>
            <Text style={styles.text}>
              Todo animal precisa de tempo para se adaptar ao novo lar. 
              Seja paciente e ofereça um ambiente seguro e tranquilo nos primeiros dias.
            </Text>
            
            <Text style={styles.subTitle}>2. Cuidados veterinários</Text>
            <Text style={styles.text}>
              Leve o animal ao veterinário logo após a adoção para uma avaliação geral e para estabelecer 
              um cronograma de vacinação e prevenção de parasitas.
            </Text>
            
            <Text style={styles.subTitle}>3. Castração</Text>
            <Text style={styles.text}>
              Se o animal ainda não for castrado, planeje a cirurgia na idade adequada. 
              A castração é essencial para evitar ninhadas indesejadas e prevenir problemas de saúde.
            </Text>
            
            <Text style={styles.subTitle}>4. Identificação</Text>
            <Text style={styles.text}>
              Coloque uma coleira com identificação ou considere a implantação de microchip, 
              o que facilita encontrar o animal caso ele se perca.
            </Text>
            
            <Text style={styles.subTitle}>5. Educação e socialização</Text>
            <Text style={styles.text}>
              Invista tempo na educação do seu pet. Ensine comandos básicos, 
              habitue-o a passear com guia e promova a socialização com outros animais e pessoas.
            </Text>
            
            <Text style={styles.sectionTitle}>Lembre-se</Text>
            <Text style={styles.text}>
              A adoção é para toda a vida do pet. Antes de adotar, certifique-se de que está preparado 
              para esse compromisso que pode durar muitos anos. Abandonar um animal é crime ambiental, 
              além de ser uma atitude cruel e irresponsável.
            </Text>
            
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Ao adotar, você não está apenas salvando uma vida, mas ganhando um amigo fiel e leal!
              </Text>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  modalView: {
    flex: 1,
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingBottom: 10
  },
  closeButton: {
    padding: 5
  },
  scrollContent: {
    flex: 1
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4682B4'
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4682B4',
    marginTop: 20,
    marginBottom: 10
  },
  subTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 5
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 10,
    textAlign: 'justify'
  },
  footer: {
    marginTop: 30,
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f0f8ff',
    borderRadius: 10
  },
  footerText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#4682B4'
  }
});

export default AdocaoResponsavelModal;