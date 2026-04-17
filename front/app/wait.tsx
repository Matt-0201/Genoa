import { View, Text, Button } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Pending() {
  const router = useRouter();

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    router.replace('/');
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 40, marginBottom: 20 }}>⏳</Text>
      <Text style={{ fontSize: 18, textAlign: 'center', marginBottom: 20 }}>
        Veuillez attendre la validation d'un administrateur pour pouvoir consulter l'arbre.
      </Text>
      <Button title="Se déconnecter" onPress={handleLogout} />
    </View>
  );
}