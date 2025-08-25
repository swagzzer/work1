import React, { useState } from 'react';
import { Keyboard, Modal, Platform, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { responsiveFontSize, scale, verticalScale } from '../constants/Responsive';
import { supabase } from '../services/supabaseClient';

const CreateMatchModal = ({ visible, onClose, onMatchCreated }) => {
  const [step, setStep] = useState(1);
  const [sport, setSport] = useState(null);
  const [form, setForm] = useState({ name: '', location: '', price: '', slots: '', time: '', sport: 'Tennis' });
  const [message, setMessage] = useState(null);

  const handleCreate = async () => {
    setMessage(null);
    const { name, location, price, slots, time } = form;
    if (!name || !location || !price || !slots || !time) {
      setMessage('Popunite sva polja!');
      return;
    }
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
        setMessage('Morate biti ulogovani da biste kreirali mec.');
        return;
    }

    // Combine date and time for a full ISO string
    // For simplicity, we're assuming "today". A date picker would be better.
    const [hours, minutes] = time.split(':');
    const matchTime = new Date();
    matchTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

    const { error } = await supabase.from('matches').insert({
      name,
      location,
      price: parseFloat(price),
      slots: parseInt(slots),
      time: matchTime.toISOString(),
      creator: user.id,
    });

    if (error) {
      setMessage('Greska: ' + error.message);
    } else {
      onMatchCreated();
      onClose();
      setForm({ name: '', location: '', price: '', slots: '', time: '', sport: 'Tennis' });
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={Platform.OS === 'web' ? null : Keyboard.dismiss}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: '#232b3b', borderRadius: scale(16), padding: scale(28), width: scale(320), alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: responsiveFontSize(20), marginBottom: verticalScale(16) }}>Kreiraj mec</Text>
              <TextInput style={styles.input} placeholder="Naziv" value={form.name} onChangeText={v => setForm(f => ({ ...f, name: v }))} returnKeyType="done" />
              <TextInput style={styles.input} placeholder="Lokacija" value={form.location} onChangeText={v => setForm(f => ({ ...f, location: v }))} returnKeyType="done" />
              <TextInput style={styles.input} placeholder="Cena (RSD)" value={form.price} onChangeText={v => setForm(f => ({ ...f, price: v }))} keyboardType="numeric" returnKeyType="done" />
              <TextInput style={styles.input} placeholder="Slobodna mesta" value={form.slots} onChangeText={v => setForm(f => ({ ...f, slots: v }))} keyboardType="numeric" returnKeyType="done" />
              <TextInput style={styles.input} placeholder="Vreme (npr. 18:00)" value={form.time} onChangeText={v => setForm(f => ({ ...f, time: v }))} returnKeyType="done" />
              {message && <Text style={{ color: 'red', marginBottom: verticalScale(10), textAlign: 'center' }}>{message}</Text>}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                <TouchableOpacity style={styles.button} onPress={handleCreate}>
                  <Text style={styles.buttonText}>Sacuvaj</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
                  <Text style={[styles.buttonText, {color: '#333'}]}>Otkazi</Text>
                </TouchableOpacity>
              </View>
            </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = {
    input: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: scale(8),
        padding: scale(10),
        marginBottom: scale(10),
        backgroundColor: '#fff'
    },
    button: {
        backgroundColor: '#00b894',
        paddingVertical: scale(10),
        paddingHorizontal: scale(24),
        borderRadius: scale(8),
        marginTop: scale(10),
        marginHorizontal: scale(5)
    },
    cancelButton: {
        backgroundColor: '#ccc'
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: responsiveFontSize(16)
    }
}

export default CreateMatchModal; 