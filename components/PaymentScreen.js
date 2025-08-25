import React, { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { WebView } from 'react-native-webview';

export default function PaymentScreen({ amount = '10.00', match, onSuccess }) {
  const [showWebView, setShowWebView] = useState(false);
  const [clientToken, setClientToken] = useState(null);

  const getClientToken = async () => {
    setShowWebView(false);
    setClientToken(null);
    try {
      const res = await fetch('https://sport-three-sand.vercel.app/api/client_token');
      const data = await res.json();
      setClientToken(data.clientToken);
      setShowWebView(true);
    } catch (e) {
      Alert.alert('Error', 'Could not get client token');
    }
  };

  useEffect(() => {
    getClientToken();
  }, []);

  const handleWebViewMessage = async (event) => {
    const nonce = event.nativeEvent.data;
    try {
      const res = await fetch('https://sport-three-sand.vercel.app/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethodNonce: nonce, amount }),
      });
      const data = await res.json();
      if (data.success || data.transaction) {
        Alert.alert('Success', 'Payment completed!');
        if (onSuccess) onSuccess();
      } else {
        Alert.alert('Error', 'Payment failed');
      }
    } catch (e) {
      Alert.alert('Error', 'Payment failed');
    }
    setShowWebView(false);
  };

  return (
    <View style={{ flex: 1, justifyContent: showWebView ? 'flex-start' : 'center', alignItems: 'center' }}>
      {/* No Pay Now button, just show webview when ready */}
      {showWebView && clientToken && (
        <View style={{ flex: 1, width: '100%' }}>
          <WebView
            source={{ uri: `https://swagzzer.github.io/braintree-dropin-page/index.html?token=${clientToken}&amount=${amount}` }}
            onMessage={handleWebViewMessage}
            style={{ flex: 1 }}
          />
        </View>
      )}
    </View>
  );
} 