import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef, useState, useEffect } from 'react';
import { ActivityIndicator, Animated, Easing, Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AnimatedBackground from '../components/AnimatedBackground';
import { supabase } from '../services/supabaseClient';
import { scale, verticalScale, responsiveFontSize } from '../constants/Responsive';

const LandingScreen = () => {
  const [mode, setMode] = useState('sign-in');
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('');
  const [language, setLanguage] = useState('serbian');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const cardAnim = useRef(new Animated.Value(0)).current;
  const emailRef = useRef();
  const fullNameRef = useRef();
  const usernameRef = useRef();
  const passwordRef = useRef();
  const confirmRef = useRef();
  const router = useRouter();

  // Translations
  const translations = {
    serbian: {
      welcome: 'Dobrodosli u Sastav!',
      subtitleSignIn: 'Dobrodosli u Sastav, najbolju sportsku aplikaciju u regionu.',
      subtitleSignUp: 'Registrujte se za novi nalog',
      emailOrUsername: 'Email ili korisnicko ime',
      email: 'Email adresa',
      fullName: 'Ime i Prezime',
      username: 'Korisnicko ime',
      password: 'Lozinka',
      confirmPassword: 'Potvrdite lozinku',
      signIn: 'Prijavite se',
      signUp: 'Registrujte se',
      or: 'ili',
      noAccount: 'Nemate nalog? ',
      haveAccount: 'Imate nalog? ',
      register: 'Registrujte se',
      login: 'Prijavite se',
      usernameNotFound: 'Korisnicko ime nije pronadjeno.',
      usernameRequired: 'Korisnicko ime je obavezno.',
      passwordsDontMatch: 'Lozinke se ne poklapaju.',
      usernameTaken: 'Korisnicko ime je zauzeto.',
      error: 'Greska: ',
      success: 'Uspesno! Dobrodosli.',
      checkEmail: 'Uspesno! Proverite email za potvrdu.',
    },
    english: {
      welcome: 'Welcome to Sastav!',
      subtitleSignIn: 'Welcome to Sastav, the best sports app in the region.',
      subtitleSignUp: 'Register for a new account',
      emailOrUsername: 'Email or username',
      email: 'Email address',
      fullName: 'Full Name',
      username: 'Username',
      password: 'Password',
      confirmPassword: 'Confirm password',
      signIn: 'Sign In',
      signUp: 'Sign Up',
      or: 'or',
      noAccount: "Don't have an account? ",
      haveAccount: 'Have an account? ',
      register: 'Register',
      login: 'Sign In',
      usernameNotFound: 'Username not found.',
      usernameRequired: 'Username is required.',
      passwordsDontMatch: 'Passwords do not match.',
      usernameTaken: 'Username is taken.',
      error: 'Error: ',
      success: 'Success! Welcome.',
      checkEmail: 'Success! Check your email for confirmation.',
    }
  };

  const t = translations[language];

  // Load preferences
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem('language');
        const savedDarkMode = await AsyncStorage.getItem('isDarkMode');
        
        if (savedLanguage) setLanguage(savedLanguage);
        if (savedDarkMode !== null) setIsDarkMode(savedDarkMode === 'true');
      } catch (error) {
        console.log('Error loading preferences:', error);
      }
    };
    
    loadPreferences();
  }, []);

  const saveLanguage = async (lang) => {
    try {
      await AsyncStorage.setItem('language', lang);
      setLanguage(lang);
    } catch (error) {
      console.log('Error saving language:', error);
    }
  };

  const saveDarkMode = async (mode) => {
    try {
      await AsyncStorage.setItem('isDarkMode', mode.toString());
      setIsDarkMode(mode);
    } catch (error) {
      console.log('Error saving dark mode:', error);
    }
  };

  const handleLanguageToggle = () => {
    const newLanguage = language === 'serbian' ? 'english' : 'serbian';
    saveLanguage(newLanguage);
  };

  const handleDarkModeToggle = () => {
    saveDarkMode(!isDarkMode);
  };

  const animateCard = (up) => {
    Animated.timing(cardAnim, {
      toValue: up ? -80 : 0,
      duration: 350,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const handleFocus = () => animateCard(true);
  const handleBlur = () => animateCard(false);

  const handleAuth = async () => {
    setLoading(true);
    setMessage(null);
    if (mode === 'sign-in') {
      // Try to sign in with email or username
      let emailToUse = emailOrUsername;
      if (!emailOrUsername.includes('@')) {
        // Assume it's a username, look up email
        const { data, error } = await supabase.from('profiles').select('email').eq('username', emailOrUsername).single();
        if (error || !data) {
          setLoading(false);
          setMessage(t.usernameNotFound);
          setMessageType('error');
          return;
        }
        emailToUse = data.email;
      }
      const { error } = await supabase.auth.signInWithPassword({ email: emailToUse, password });
      setLoading(false);
      if (error) {
        setMessage(t.error + error.message);
        setMessageType('error');
      } else {
        setMessage(t.success);
        setMessageType('success');
        setTimeout(() => router.replace('/(tabs)'), 1000);
      }
    } else {
      if (!username) {
        setLoading(false);
        setMessage(t.usernameRequired);
        setMessageType('error');
        return;
      }
      if (password !== confirm) {
        setLoading(false);
        setMessage(t.passwordsDontMatch);
        setMessageType('error');
        return;
      }
      // Check if username is taken
      const { data: existing } = await supabase.from('profiles').select('id').eq('username', username);
      if (existing && existing.length > 0) {
        setLoading(false);
        setMessage(t.usernameTaken);
        setMessageType('error');
        return;
      }
      // Sign up
      const nameParts = fullName.trim().split(' ');
      const name = nameParts[0] || '';
      const surname = nameParts.slice(1).join(' ') || '';

      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            username: username,
            name: name,
            surname: surname,
          }
        }
      });
      if (error) {
        setLoading(false);
        setMessage(t.error + error.message);
        setMessageType('error');
        return;
      }
      setLoading(false);
      setMessage(t.checkEmail);
      setMessageType('success');
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <AnimatedBackground isDarkMode={isDarkMode}>
        <View style={styles.bg}>
          {/* Header with toggle buttons */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', width: '100%', paddingHorizontal: scale(16), paddingTop: scale(38) }}>
              {/* Dark Mode Toggle */}
              <TouchableOpacity 
                style={[styles.toggleButton, { backgroundColor: isDarkMode ? '#181818' : '#F5F5F5' }]}
                onPress={handleDarkModeToggle}
              >
                <Ionicons 
                  name={isDarkMode ? "sunny" : "moon"} 
                  size={scale(22)} 
                  color="#FFFF00" 
                />
              </TouchableOpacity>
              
              {/* Language Toggle */}
              <TouchableOpacity 
                style={[styles.toggleButton, { backgroundColor: isDarkMode ? '#181818' : '#F5F5F5' }]}
                onPress={handleLanguageToggle}
              >
                <Text style={{ color: '#FFFF00', fontSize: responsiveFontSize(14), fontWeight: '300', letterSpacing: 0.5 }}>
                  {language === 'serbian' ? 'EN' : 'SR'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <Animated.View style={[styles.card, { backgroundColor: isDarkMode ? '#181818' : '#F5F5F5', transform: [{ translateY: cardAnim }] }]}>
            <View style={styles.emojiCircle}><Text style={styles.emoji}>⚽️</Text></View>
            <Text style={[styles.welcome, { fontWeight: '300', fontSize: responsiveFontSize(19), letterSpacing: 0.8 }]}>{t.welcome}</Text>
            <Text style={[styles.subtitle, { color: isDarkMode ? '#b0b8c1' : '#666' }]}>{mode === 'sign-in' ? t.subtitleSignIn : t.subtitleSignUp}</Text>
            {mode === 'sign-in' ? (
              <View style={[styles.inputRow, { backgroundColor: isDarkMode ? '#10182a' : '#F0F0F0' }]}>
                <Ionicons name="person-outline" size={20} color={isDarkMode ? "#b0b8c1" : "#666"} style={styles.inputIcon} />
                <TextInput
                  style={[styles.inputFake, { color: isDarkMode ? '#b0b8c1' : '#000' }]}
                  placeholder={t.emailOrUsername}
                  placeholderTextColor={isDarkMode ? "#b0b8c1" : "#666"}
                  value={emailOrUsername}
                  onChangeText={setEmailOrUsername}
                  autoCapitalize="none"
                  returnKeyType="done"
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  onSubmitEditing={() => passwordRef.current && passwordRef.current.focus()}
                />
              </View>
            ) : (
              <React.Fragment>
                <View style={[styles.inputRow, { backgroundColor: isDarkMode ? '#10182a' : '#F0F0F0' }]}>
                  <Ionicons name="mail-outline" size={20} color={isDarkMode ? "#b0b8c1" : "#666"} style={styles.inputIcon} />
                  <TextInput
                    ref={emailRef}
                    style={[styles.inputFake, { color: isDarkMode ? '#b0b8c1' : '#000' }]}
                    placeholder={t.email}
                    placeholderTextColor={isDarkMode ? "#b0b8c1" : "#666"}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    returnKeyType="next"
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    onSubmitEditing={() => fullNameRef.current && fullNameRef.current.focus()}
                  />
                </View>
                <View style={[styles.inputRow, { backgroundColor: isDarkMode ? '#10182a' : '#F0F0F0' }]}>
                  <Ionicons name="person-outline" size={20} color={isDarkMode ? "#b0b8c1" : "#666"} style={styles.inputIcon} />
                  <TextInput
                    ref={fullNameRef}
                    style={[styles.inputFake, { color: isDarkMode ? '#b0b8c1' : '#000' }]}
                    placeholder={t.fullName}
                    placeholderTextColor={isDarkMode ? "#b0b8c1" : "#666"}
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                    returnKeyType="next"
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    onSubmitEditing={() => usernameRef.current && usernameRef.current.focus()}
                  />
                </View>
                <View style={[styles.inputRow, { backgroundColor: isDarkMode ? '#10182a' : '#F0F0F0' }]}>
                  <Ionicons name="at-outline" size={20} color={isDarkMode ? "#b0b8c1" : "#666"} style={styles.inputIcon} />
                  <TextInput
                    ref={usernameRef}
                    style={[styles.inputFake, { color: isDarkMode ? '#b0b8c1' : '#000' }]}
                    placeholder={t.username}
                    placeholderTextColor={isDarkMode ? "#b0b8c1" : "#666"}
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    returnKeyType="next"
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    onSubmitEditing={() => passwordRef.current && passwordRef.current.focus()}
                  />
                </View>
              </React.Fragment>
            )}
            <View style={[styles.inputRow, { backgroundColor: isDarkMode ? '#10182a' : '#F0F0F0' }]}>
              <Ionicons name="lock-closed-outline" size={20} color={isDarkMode ? "#b0b8c1" : "#666"} style={styles.inputIcon} />
              <TextInput
                ref={passwordRef}
                style={[styles.inputFake, { color: isDarkMode ? '#b0b8c1' : '#000' }]}
                placeholder={t.password}
                placeholderTextColor={isDarkMode ? "#b0b8c1" : "#666"}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                returnKeyType={mode === 'sign-up' ? 'next' : 'done'}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onSubmitEditing={() => {
                  if (mode === 'sign-up' && confirmRef.current) confirmRef.current.focus();
                  else handleAuth();
                }}
              />
            </View>
            {mode === 'sign-up' && (
              <View style={[styles.inputRow, { backgroundColor: isDarkMode ? '#10182a' : '#F0F0F0' }]}>
                <Ionicons name="lock-closed-outline" size={20} color={isDarkMode ? "#b0b8c1" : "#666"} style={styles.inputIcon} />
                <TextInput
                  ref={confirmRef}
                  style={[styles.inputFake, { color: isDarkMode ? '#b0b8c1' : '#000' }]}
                  placeholder={t.confirmPassword}
                  placeholderTextColor={isDarkMode ? "#b0b8c1" : "#666"}
                  value={confirm}
                  onChangeText={setConfirm}
                  secureTextEntry
                  returnKeyType="done"
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  onSubmitEditing={handleAuth}
                />
              </View>
            )}
            {message && (
              <Text style={[styles.message, messageType === 'error' ? styles.error : styles.success]}>{message}</Text>
            )}
            <TouchableOpacity style={styles.signInBtn} onPress={handleAuth} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#222" />
              ) : (
                <>
                  <Ionicons name={mode === 'sign-in' ? 'log-in-outline' : 'person-add-outline'} size={20} color="#222" style={{ marginRight: 8 }} />
                  <Text style={styles.signInBtnText}>{t.signIn}</Text>
                </>
              )}
            </TouchableOpacity>
            <View style={styles.dividerRow}>
              <View style={[styles.divider, { backgroundColor: isDarkMode ? '#232b3b' : '#DDD' }]} />
              <Text style={[styles.dividerText, { color: isDarkMode ? '#b0b8c1' : '#666' }]}>{t.or}</Text>
              <View style={[styles.divider, { backgroundColor: isDarkMode ? '#232b3b' : '#DDD' }]} />
            </View>
            <View style={styles.bottomRow}>
              <Text style={[styles.bottomText, { color: isDarkMode ? '#b0b8c1' : '#666' }]}>{mode === 'sign-in' ? t.noAccount : t.haveAccount}</Text>
              <TouchableOpacity onPress={() => { setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in'); setMessage(null); }}>
                <Text style={styles.signUpLink}>{mode === 'sign-in' ? t.register : t.login}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </AnimatedBackground>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  toggleButton: {
    borderRadius: scale(8),
    padding: scale(8),
    marginLeft: scale(8),
    minWidth: scale(38),
    minHeight: scale(38),
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#181818',
    borderRadius: 18,
    padding: 28,
    alignItems: 'center',
    width: 340,
  },
  emojiCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 18,
    backgroundColor: '#222b45',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 36,
    textAlign: 'center',
  },
  welcome: {
    fontSize: responsiveFontSize(19),
    fontWeight: '300',
    color: '#FFFF00',
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: 0.8,
  },
  subtitle: {
    color: '#b0b8c1',
    fontSize: responsiveFontSize(15),
    marginBottom: 22,
    textAlign: 'center',
    fontWeight: '300',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10182a',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
    width: 260,
  },
  inputIcon: {
    marginRight: 8,
  },
  inputFake: {
    color: '#b0b8c1',
    fontSize: responsiveFontSize(15),
    flex: 1,
    padding: 0,
    fontWeight: '300',
  },
  signInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFF00',
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 0,
    width: 260,
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 18,
  },
  signInBtnText: {
    color: '#181818',
    fontWeight: '300',
    fontSize: responsiveFontSize(14),
    letterSpacing: 0.5,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    width: 260,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#232b3b',
  },
  dividerText: {
    color: '#b0b8c1',
    marginHorizontal: 8,
    fontSize: responsiveFontSize(14),
    fontWeight: '300',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  bottomText: {
    color: '#b0b8c1',
    fontSize: responsiveFontSize(14),
    fontWeight: '300',
  },
  signUpLink: {
    color: '#FFFF00',
    fontWeight: '300',
    fontSize: responsiveFontSize(13),
    letterSpacing: 0.5,
  },
  message: {
    marginBottom: 10,
    fontWeight: '300',
    textAlign: 'center',
    letterSpacing: 0.5,
    fontSize: responsiveFontSize(14),
  },
  error: {
    color: 'red',
  },
  success: {
    color: 'green',
  },
});

export default LandingScreen; 