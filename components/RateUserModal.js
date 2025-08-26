import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Modal, Text, TouchableOpacity, View } from 'react-native';
import { scale } from '../constants/Responsive';
import AnimatedBackground from './AnimatedBackground';

const RateUserModal = ({ visible, onClose, user, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Greška', 'Molimo vas da ocenite korisnika');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(rating);
      onClose();
      setRating(0);
    } catch (error) {
      Alert.alert('Greška', 'Došlo je do greške prilikom ocenjivanja');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' }}>
        <AnimatedBackground>
          <View style={{ backgroundColor: '#181818', borderRadius: scale(18), padding: scale(24), width: '85%', maxWidth: 400, alignItems: 'center' }}>
            <TouchableOpacity onPress={handleClose} style={{ alignSelf: 'flex-end', marginBottom: scale(8) }}>
              <Ionicons name="close" size={28} color="#FFFF00" />
            </TouchableOpacity>
            
            <Text style={{ color: '#FFFF00', fontWeight: '400', fontSize: 17, marginTop: 8, marginBottom: 12, textAlign: 'center', letterSpacing: 0.8 }}>Oceni korisnika</Text>
            <Text style={{ color: '#FFFF00', fontWeight: '400', fontSize: 15, letterSpacing: 0.5 }}>{user.name} {user.surname}</Text>
            
            {submitting ? (
              <ActivityIndicator color="#FFFF00" style={{ marginTop: 24 }} />
            ) : (
              <>
                <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24, marginBottom: 24 }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setRating(star)}
                      style={{ marginHorizontal: 4 }}
                    >
                      <Ionicons
                        name={star <= rating ? 'star' : 'star-outline'}
                        size={40}
                        color={star <= rating ? '#FFFF00' : '#fff'}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                
                <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 24 }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setRating(star)}
                      style={{ marginHorizontal: 4 }}
                    >
                      <Ionicons
                        name={star <= rating ? 'star' : 'star-outline'}
                        size={40}
                        color={star <= rating ? '#FFFF00' : '#fff'}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={rating === 0 || submitting}
                  style={{ backgroundColor: '#FFFF00', borderRadius: scale(8), paddingVertical: scale(10), paddingHorizontal: scale(24), marginTop: 4, opacity: rating && !submitting ? 1 : 0.6 }}
                >
                  <Text style={{ color: '#181818', fontWeight: '400', fontSize: 14, letterSpacing: 0.5 }}>Posalji ocenu</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </AnimatedBackground>
      </View>
    </Modal>
  );
};

export default RateUserModal; 