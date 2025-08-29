import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Linking, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const InviteFriendsPopup = ({ visible, onClose, isDarkMode = true, language = 'serbian', t }) => {
  const inviteMessage = "Pozdrav! Pridruži se meni na Sastav aplikaciji i igraj najbolje mečeve u gradu! 🏆🔵🏀🎾";

  const handleInstagramInvite = () => {
    const instagramUrl = `https://www.instagram.com/`;
    Linking.openURL(instagramUrl);
  };

  const handleWhatsAppInvite = () => {
    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(inviteMessage)}`;
    Linking.canOpenURL(whatsappUrl).then(supported => {
      if (supported) {
        Linking.openURL(whatsappUrl);
      } else {
        // Fallback to web WhatsApp
        const webWhatsappUrl = `https://wa.me/?text=${encodeURIComponent(inviteMessage)}`;
        Linking.openURL(webWhatsappUrl);
      }
    });
  };

  const handleViberInvite = () => {
    const viberUrl = `viber://forward?text=${encodeURIComponent(inviteMessage)}`;
    Linking.canOpenURL(viberUrl).then(supported => {
      if (supported) {
        Linking.openURL(viberUrl);
      } else {
        // Fallback to web Viber
        const webViberUrl = `https://invite.viber.com/?g=${encodeURIComponent(inviteMessage)}`;
        Linking.openURL(webViberUrl);
      }
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.title}>{t.inviteFriendsTitle}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#00D4AA" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionText}>
              {t.inviteFriendsDescription}
            </Text>
          </View>

          {/* Social Media Options */}
          <View style={styles.socialContainer}>
            {/* Instagram */}
            <TouchableOpacity
              onPress={handleInstagramInvite}
              style={[styles.socialButton, styles.instagramButton]}
            >
              <View style={styles.socialIconContainer}>
                <Ionicons name="logo-instagram" size={28} color="#FFFFFF" />
              </View>
              <Text style={styles.socialButtonText}>Instagram</Text>
            </TouchableOpacity>

            {/* WhatsApp */}
            <TouchableOpacity
              onPress={handleWhatsAppInvite}
              style={[styles.socialButton, styles.whatsappButton]}
            >
              <View style={styles.socialIconContainer}>
                <Ionicons name="logo-whatsapp" size={28} color="#FFFFFF" />
              </View>
              <Text style={styles.socialButtonText}>WhatsApp</Text>
            </TouchableOpacity>

            {/* Viber */}
            <TouchableOpacity
              onPress={handleViberInvite}
              style={[styles.socialButton, styles.viberButton]}
            >
              <View style={styles.socialIconContainer}>
                <Ionicons name="chatbubble" size={28} color="#FFFFFF" />
              </View>
              <Text style={styles.socialButtonText}>Viber</Text>
            </TouchableOpacity>
          </View>

          {/* Close Button */}
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButtonContainer}
          >
            <Text style={styles.closeButtonText}>
              {t.close}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 28,
    paddingBottom: 50,
    height: '50%',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  header: {
    marginBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 0.5,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  descriptionContainer: {
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  descriptionText: {
    color: '#000',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
    textAlign: 'center',
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
    paddingHorizontal: 4,
  },
  socialButton: {
    flex: 1,
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    minWidth: 110, // Balanced width for text to fit on one line
    textAlign: 'center',
  },
  instagramButton: {
    backgroundColor: '#E4405F',
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  viberButton: {
    backgroundColor: '#7360F2',
  },
  socialIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  socialButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    alignSelf: 'center',
    flex: 1,
    textAlignVertical: 'center',
  },
  closeButtonContainer: {
    backgroundColor: '#00D4AA',
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
    letterSpacing: 0.5,
  },
});

export default InviteFriendsPopup; 