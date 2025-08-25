import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Linking, Modal, Text, TouchableOpacity, View } from 'react-native';
import { scale, verticalScale } from '../constants/Responsive';

const InviteFriendsPopup = ({ visible, onClose, isDarkMode = true }) => {
  const inviteMessage = "Pozdrav! Pridruži se meni na Sastav aplikaciji i igraj najbolje mečeve u gradu! 🏆⚽🏀🎾";

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
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
        <View style={{ 
          backgroundColor: isDarkMode ? '#2a3441' : '#fff', 
          borderTopLeftRadius: scale(18), 
          borderTopRightRadius: scale(18), 
          padding: scale(16),
          paddingBottom: scale(20),
          height: '30%' // Takes up 30% from bottom
        }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: scale(12) }}>
            <Text style={{ color: '#FFFF00', fontWeight: '300', fontSize: 14, letterSpacing: 0.8 }}>Pozovi prijatelje</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={20} color="#FFFF00" />
            </TouchableOpacity>
          </View>

          {/* Description */}
          <Text style={{ color: isDarkMode ? '#fff' : '#000', fontSize: 12, textAlign: 'center', marginBottom: scale(16), lineHeight: 16, fontWeight: '300' }}>
            Podeli Sastav sa svojim prijateljima!
          </Text>

          {/* Social Media Options - Side by Side */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: scale(12) }}>
            {/* Instagram */}
            <TouchableOpacity
              onPress={handleInstagramInvite}
              style={{
                flex: 1,
                backgroundColor: '#FFFF00',
                borderRadius: scale(12),
                padding: scale(12),
                alignItems: 'center',
                marginRight: scale(4)
              }}
            >
              <Ionicons name="logo-instagram" size={20} color="#000" style={{ marginBottom: scale(4) }} />
              <Text style={{ color: '#000', fontWeight: '300', fontSize: 10, textAlign: 'center' }}>Instagram</Text>
            </TouchableOpacity>

            {/* WhatsApp */}
            <TouchableOpacity
              onPress={handleWhatsAppInvite}
              style={{
                flex: 1,
                backgroundColor: '#FFFF00',
                borderRadius: scale(12),
                padding: scale(12),
                alignItems: 'center',
                marginHorizontal: scale(2)
              }}
            >
              <Ionicons name="logo-whatsapp" size={20} color="#000" style={{ marginBottom: scale(4) }} />
              <Text style={{ color: '#000', fontWeight: '300', fontSize: 10, textAlign: 'center' }}>WhatsApp</Text>
            </TouchableOpacity>

            {/* Viber */}
            <TouchableOpacity
              onPress={handleViberInvite}
              style={{
                flex: 1,
                backgroundColor: '#FFFF00',
                borderRadius: scale(12),
                padding: scale(12),
                alignItems: 'center',
                marginLeft: scale(4)
              }}
            >
              <Ionicons name="chatbubble" size={20} color="#000" style={{ marginBottom: scale(4) }} />
              <Text style={{ color: '#000', fontWeight: '300', fontSize: 10, textAlign: 'center' }}>Viber</Text>
            </TouchableOpacity>
          </View>

          {/* Close Button */}
          <TouchableOpacity
            onPress={onClose}
            style={{
              backgroundColor: '#FFFF00',
              borderRadius: scale(8),
              padding: scale(8),
              alignItems: 'center',
              marginTop: 'auto'
            }}
          >
            <Text style={{ color: '#000', fontWeight: '300', fontSize: 12, letterSpacing: 0.5 }}>
              Zatvori
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default InviteFriendsPopup; 