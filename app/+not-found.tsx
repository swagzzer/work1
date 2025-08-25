import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { responsiveFontSize } from '../constants/Responsive';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={[styles.container, { backgroundColor: '#232b3b' }]}>
        <Text style={{ fontSize: responsiveFontSize(18), color: '#fff' }} numberOfLines={1} ellipsizeMode="tail">This screen does not exist.</Text>
        <Link href="/" style={styles.link}>
          <Text style={{ fontSize: responsiveFontSize(16), color: '#fff' }} numberOfLines={1} ellipsizeMode="tail">Go to home screen!</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
