import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Animated, Dimensions, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { createSupportRequest, sendSupportEmail, supabase } from '../services/supabaseClient';

const { width, height } = Dimensions.get('window');
const modalWidth = width * 0.85;
const modalHeight = height * 0.85;

const SettingsModal = ({ visible, onClose, profile, onProfileUpdate, language = 'serbian', isDarkMode = true }) => {
  const [currentPage, setCurrentPage] = useState('main');
  const [slideAnim] = useState(new Animated.Value(0));
  
  // Account details state
  const [accountDetails, setAccountDetails] = useState({
    name: profile?.name || '',
    surname: profile?.surname || '',
    username: profile?.username || '',
    password: '',
    confirmPassword: ''
  });
  
  // Privacy state
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    showOnlineStatus: true,
    allowFriendRequests: true,
    showMatchHistory: true
  });
  
  // Location state
  const [location, setLocation] = useState(profile?.location || '');
  
  // Contact support state
  const [contactSupport, setContactSupport] = useState({
    subject: '',
    message: ''
  });

  const navigateToPage = (page) => {
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setCurrentPage(page);
      slideAnim.setValue(0);
    });
  };

  const goBack = () => {
    if (currentPage === 'main') {
      onClose();
    } else {
      setCurrentPage('main');
    }
  };

  const handleSaveAccountDetails = async () => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          name: accountDetails.name,
          surname: accountDetails.surname,
          username: accountDetails.username
        })
        .eq('id', user.id);

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      if (accountDetails.password && accountDetails.password !== accountDetails.confirmPassword) {
        Alert.alert('Error', 'Passwords do not match');
        return;
      }

      if (accountDetails.password) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: accountDetails.password
        });
        if (passwordError) {
          Alert.alert('Error', passwordError.message);
          return;
        }
      }

      onProfileUpdate({
        ...profile,
        name: accountDetails.name,
        surname: accountDetails.surname,
        username: accountDetails.username
      });

      Alert.alert('Success', 'Account details updated successfully');
      setCurrentPage('main');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleSavePrivacy = async () => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          privacy_settings: privacySettings
        })
        .eq('id', user.id);

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      Alert.alert('Success', 'Privacy settings updated successfully');
      setCurrentPage('main');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleSaveLocation = async () => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ location })
        .eq('id', user.id);

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      onProfileUpdate({ ...profile, location });
      Alert.alert('Success', 'Location updated successfully');
      setCurrentPage('main');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleContactSupport = async () => {
    try {
      if (!contactSupport.subject.trim() || !contactSupport.message.trim()) {
        Alert.alert('Error', language === 'english' ? 'Please fill in both subject and message' : 'Molimo vas da popunite naslov i poruku');
        return;
      }

      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      // First, create support request in database
      const { data: requestId, error: dbError } = await createSupportRequest(
        contactSupport.subject.trim(),
        contactSupport.message.trim()
      );

      if (dbError) {
        Alert.alert('Error', dbError.message);
        return;
      }

      // Then send email via edge function
      const { data: emailData, error: emailError } = await sendSupportEmail(
        contactSupport.subject.trim(),
        contactSupport.message.trim(),
        user.email,
        `${profile?.name || ''} ${profile?.surname || ''}`.trim()
      );

      if (emailError) {
        console.log('Email error (non-critical):', emailError);
        // Still show success since the request was saved to database
      }

      // Clear the form
      setContactSupport({ subject: '', message: '' });
      
      Alert.alert(
        language === 'english' ? 'Success' : 'Uspešno', 
        language === 'english' ? 'Support request sent successfully. We will get back to you soon!' : 'Zahtev za podršku je uspešno poslat. Odgovorićemo vam uskoro!'
      );
      setCurrentPage('main');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const renderMainPage = () => (
    <Animated.View style={{ flex: 1 }}>
      <View style={{ padding: 24 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Text style={{ color: isDarkMode ? '#fff' : '#000', fontWeight: '600', fontSize: 24, letterSpacing: 0.8 }}>
            {language === 'english' ? 'Settings' : 'Podešavanja'}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color={isDarkMode ? '#fff' : '#000'} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Account Section */}
          <View style={{ marginBottom: 32 }}>
            <Text style={{ color: isDarkMode ? '#fff' : '#000', fontSize: 18, fontWeight: '600', marginBottom: 16 }}>
              {language === 'english' ? 'Account' : 'Nalog'}
            </Text>
            
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => navigateToPage('account')}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <MaterialIcons name="person" size={20} color="#FFFF00" style={{ marginRight: 12 }} />
                <Text style={styles.settingText}>
                  {language === 'english' ? 'Account details' : 'Detalji naloga'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={isDarkMode ? '#fff' : '#000'} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => navigateToPage('location')}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <MaterialIcons name="location-on" size={20} color="#FFFF00" style={{ marginRight: 12 }} />
                <Text style={styles.settingText}>
                  {language === 'english' ? 'Location' : 'Lokacija'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={isDarkMode ? '#fff' : '#000'} />
            </TouchableOpacity>
          </View>

          {/* App Section */}
          <View style={{ marginBottom: 32 }}>
            <Text style={{ color: isDarkMode ? '#fff' : '#000', fontSize: 18, fontWeight: '600', marginBottom: 16 }}>
              {language === 'english' ? 'App' : 'Aplikacija'}
            </Text>
            
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => navigateToPage('privacy')}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <MaterialIcons name="security" size={20} color="#FFFF00" style={{ marginRight: 12 }} />
                <Text style={styles.settingText}>
                  {language === 'english' ? 'Privacy' : 'Privatnost'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={isDarkMode ? '#fff' : '#000'} />
            </TouchableOpacity>
          </View>

          {/* Support Section */}
          <View style={{ marginBottom: 32 }}>
            <Text style={{ color: isDarkMode ? '#fff' : '#000', fontSize: 18, fontWeight: '600', marginBottom: 16 }}>
              {language === 'english' ? 'Support' : 'Podrška'}
            </Text>
            
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => navigateToPage('contact')}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <MaterialIcons name="support-agent" size={20} color="#FFFF00" style={{ marginRight: 12 }} />
                <Text style={styles.settingText}>
                  {language === 'english' ? 'Contact support' : 'Kontaktirajte podršku'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={isDarkMode ? '#fff' : '#000'} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Animated.View>
  );

  const renderAccountPage = () => (
    <Animated.View style={{ flex: 1 }}>
      <View style={{ padding: 24 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <TouchableOpacity onPress={() => setCurrentPage('main')}>
            <Ionicons name="arrow-back" size={24} color={isDarkMode ? '#fff' : '#000'} />
          </TouchableOpacity>
          <Text style={{ color: isDarkMode ? '#fff' : '#000', fontWeight: '600', fontSize: 20 }}>
            {language === 'english' ? 'Account Details' : 'Detalji naloga'}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.inputLabel}>{language === 'english' ? 'Name' : 'Ime'}</Text>
          <TextInput
            style={styles.textInput}
            value={accountDetails.name}
            onChangeText={(text) => setAccountDetails({...accountDetails, name: text})}
            placeholder={language === 'english' ? 'Enter your name' : 'Unesite vaše ime'}
            placeholderTextColor={isDarkMode ? '#b0b8c1' : '#666'}
          />

          <Text style={styles.inputLabel}>{language === 'english' ? 'Surname' : 'Prezime'}</Text>
          <TextInput
            style={styles.textInput}
            value={accountDetails.surname}
            onChangeText={(text) => setAccountDetails({...accountDetails, surname: text})}
            placeholder={language === 'english' ? 'Enter your surname' : 'Unesite vaše prezime'}
            placeholderTextColor={isDarkMode ? '#b0b8c1' : '#666'}
          />

          <Text style={styles.inputLabel}>{language === 'english' ? 'Username' : 'Korisničko ime'}</Text>
          <TextInput
            style={styles.textInput}
            value={accountDetails.username}
            onChangeText={(text) => setAccountDetails({...accountDetails, username: text})}
            placeholder={language === 'english' ? 'Enter username' : 'Unesite korisničko ime'}
            placeholderTextColor={isDarkMode ? '#b0b8c1' : '#666'}
          />

          <Text style={styles.inputLabel}>{language === 'english' ? 'New Password' : 'Nova lozinka'}</Text>
          <TextInput
            style={styles.textInput}
            value={accountDetails.password}
            onChangeText={(text) => setAccountDetails({...accountDetails, password: text})}
            placeholder={language === 'english' ? 'Enter new password' : 'Unesite novu lozinku'}
            placeholderTextColor={isDarkMode ? '#b0b8c1' : '#666'}
            secureTextEntry
          />

          <Text style={styles.inputLabel}>{language === 'english' ? 'Confirm Password' : 'Potvrdite lozinku'}</Text>
          <TextInput
            style={styles.textInput}
            value={accountDetails.confirmPassword}
            onChangeText={(text) => setAccountDetails({...accountDetails, confirmPassword: text})}
            placeholder={language === 'english' ? 'Confirm new password' : 'Potvrdite novu lozinku'}
            placeholderTextColor={isDarkMode ? '#b0b8c1' : '#666'}
            secureTextEntry
          />

          <TouchableOpacity style={styles.saveButton} onPress={handleSaveAccountDetails}>
            <Text style={styles.saveButtonText}>
              {language === 'english' ? 'Save Changes' : 'Sačuvaj izmene'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Animated.View>
  );

  const renderPrivacyPage = () => (
    <Animated.View style={{ flex: 1 }}>
      <View style={{ padding: 24 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <TouchableOpacity onPress={() => setCurrentPage('main')}>
            <Ionicons name="arrow-back" size={24} color={isDarkMode ? '#fff' : '#000'} />
          </TouchableOpacity>
          <Text style={{ color: isDarkMode ? '#fff' : '#000', fontWeight: '600', fontSize: 20 }}>
            {language === 'english' ? 'Privacy' : 'Privatnost'}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
                     <View style={styles.privacyItem}>
             <Text style={styles.privacyLabel}>
               {language === 'english' ? 'Profile Visibility' : 'Vidljivost profila'}
             </Text>
             <View style={styles.dualToggleContainer}>
               <TouchableOpacity 
                 style={[
                   styles.dualToggleButton, 
                   styles.dualToggleLeft,
                   privacySettings.profileVisibility === 'private' && styles.dualToggleActive
                 ]}
                 onPress={() => setPrivacySettings({
                   ...privacySettings,
                   profileVisibility: 'private'
                 })}
               >
                 <Text style={[
                   styles.dualToggleText,
                   privacySettings.profileVisibility === 'private' && styles.dualToggleTextActive
                 ]}>
                   {language === 'english' ? 'Private' : 'Privatno'}
                 </Text>
               </TouchableOpacity>
               <TouchableOpacity 
                 style={[
                   styles.dualToggleButton, 
                   styles.dualToggleRight,
                   privacySettings.profileVisibility === 'public' && styles.dualToggleActive
                 ]}
                 onPress={() => setPrivacySettings({
                   ...privacySettings,
                   profileVisibility: 'public'
                 })}
               >
                 <Text style={[
                   styles.dualToggleText,
                   privacySettings.profileVisibility === 'public' && styles.dualToggleTextActive
                 ]}>
                   {language === 'english' ? 'Public' : 'Javno'}
                 </Text>
               </TouchableOpacity>
             </View>
           </View>

          <View style={styles.privacyItem}>
            <Text style={styles.privacyLabel}>
              {language === 'english' ? 'Show Online Status' : 'Prikaži online status'}
            </Text>
            <TouchableOpacity 
              style={[styles.toggleButton, privacySettings.showOnlineStatus && styles.toggleButtonActive]}
              onPress={() => setPrivacySettings({
                ...privacySettings,
                showOnlineStatus: !privacySettings.showOnlineStatus
              })}
            >
              <Text style={[styles.toggleText, privacySettings.showOnlineStatus && styles.toggleTextActive]}>
                {privacySettings.showOnlineStatus 
                  ? (language === 'english' ? 'On' : 'Uključeno')
                  : (language === 'english' ? 'Off' : 'Isključeno')
                }
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.privacyItem}>
            <Text style={styles.privacyLabel}>
              {language === 'english' ? 'Allow Friend Requests' : 'Dozvoli zahteve za prijateljstvo'}
            </Text>
            <TouchableOpacity 
              style={[styles.toggleButton, privacySettings.allowFriendRequests && styles.toggleButtonActive]}
              onPress={() => setPrivacySettings({
                ...privacySettings,
                allowFriendRequests: !privacySettings.allowFriendRequests
              })}
            >
              <Text style={[styles.toggleText, privacySettings.allowFriendRequests && styles.toggleTextActive]}>
                {privacySettings.allowFriendRequests 
                  ? (language === 'english' ? 'On' : 'Uključeno')
                  : (language === 'english' ? 'Off' : 'Isključeno')
                }
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.privacyItem}>
            <Text style={styles.privacyLabel}>
              {language === 'english' ? 'Show Match History' : 'Prikaži istoriju mečeva'}
            </Text>
            <TouchableOpacity 
              style={[styles.toggleButton, privacySettings.showMatchHistory && styles.toggleButtonActive]}
              onPress={() => setPrivacySettings({
                ...privacySettings,
                showMatchHistory: !privacySettings.showMatchHistory
              })}
            >
              <Text style={[styles.toggleText, privacySettings.showMatchHistory && styles.toggleTextActive]}>
                {privacySettings.showMatchHistory 
                  ? (language === 'english' ? 'On' : 'Uključeno')
                  : (language === 'english' ? 'Off' : 'Isključeno')
                }
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSavePrivacy}>
            <Text style={styles.saveButtonText}>
              {language === 'english' ? 'Save Changes' : 'Sačuvaj izmene'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Animated.View>
  );

  const renderLocationPage = () => (
    <Animated.View style={{ flex: 1 }}>
      <View style={{ padding: 24 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <TouchableOpacity onPress={() => setCurrentPage('main')}>
            <Ionicons name="arrow-back" size={24} color={isDarkMode ? '#fff' : '#000'} />
          </TouchableOpacity>
          <Text style={{ color: isDarkMode ? '#fff' : '#000', fontWeight: '600', fontSize: 20 }}>
            {language === 'english' ? 'Location' : 'Lokacija'}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.inputLabel}>{language === 'english' ? 'City' : 'Grad'}</Text>
          <TextInput
            style={styles.textInput}
            value={location}
            onChangeText={setLocation}
            placeholder={language === 'english' ? 'Enter your city' : 'Unesite vaš grad'}
            placeholderTextColor={isDarkMode ? '#b0b8c1' : '#666'}
          />

          <TouchableOpacity style={styles.saveButton} onPress={handleSaveLocation}>
            <Text style={styles.saveButtonText}>
              {language === 'english' ? 'Save Location' : 'Sačuvaj lokaciju'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Animated.View>
  );

  const renderContactPage = () => (
    <Animated.View style={{ flex: 1 }}>
      <View style={{ padding: 24 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <TouchableOpacity onPress={() => setCurrentPage('main')}>
            <Ionicons name="arrow-back" size={24} color={isDarkMode ? '#fff' : '#000'} />
          </TouchableOpacity>
          <Text style={{ color: isDarkMode ? '#fff' : '#000', fontWeight: '600', fontSize: 20 }}>
            {language === 'english' ? 'Contact Support' : 'Kontaktirajte podršku'}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.inputLabel}>{language === 'english' ? 'Subject' : 'Naslov'}</Text>
          <TextInput
            style={styles.textInput}
            value={contactSupport.subject}
            onChangeText={(text) => setContactSupport({...contactSupport, subject: text})}
            placeholder={language === 'english' ? 'Enter subject' : 'Unesite naslov'}
            placeholderTextColor={isDarkMode ? '#b0b8c1' : '#666'}
          />

          <Text style={styles.inputLabel}>{language === 'english' ? 'Message' : 'Poruka'}</Text>
          <TextInput
            style={[styles.textInput, { height: 120, textAlignVertical: 'top' }]}
            value={contactSupport.message}
            onChangeText={(text) => setContactSupport({...contactSupport, message: text})}
            placeholder={language === 'english' ? 'Enter your message' : 'Unesite vašu poruku'}
            placeholderTextColor={isDarkMode ? '#b0b8c1' : '#666'}
            multiline
          />

          <TouchableOpacity style={styles.saveButton} onPress={handleContactSupport}>
            <Text style={styles.saveButtonText}>
              {language === 'english' ? 'Send Message' : 'Pošalji poruku'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Animated.View>
  );

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'account':
        return renderAccountPage();
      case 'privacy':
        return renderPrivacyPage();
      case 'location':
        return renderLocationPage();
      case 'contact':
        return renderContactPage();
      default:
        return renderMainPage();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalView, { width: modalWidth, height: modalHeight }]}>
          {renderCurrentPage()}
        </View>
      </View>
    </Modal>
  );
};

const styles = {
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#232b3b',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  settingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '400',
  },
  inputLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 16,
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
  },
  saveButton: {
    backgroundColor: '#FFFF00',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 24,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#181818',
    fontWeight: '600',
    fontSize: 16,
  },
  privacyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  privacyLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '400',
    flex: 1,
  },
  toggleButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    minWidth: 60,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#FFFF00',
  },
  toggleText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  toggleTextActive: {
    color: '#181818',
  },
  dualToggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    overflow: 'hidden',
    minWidth: 120,
  },
  dualToggleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dualToggleLeft: {
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  dualToggleRight: {
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
  },
  dualToggleActive: {
    backgroundColor: '#FFFF00',
  },
  dualToggleText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  dualToggleTextActive: {
    color: '#181818',
  },
};

export default SettingsModal;
