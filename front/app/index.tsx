import { View, Text, TextInput, Button } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [erreur, setErreur] = useState('');
  
  const router = useRouter(); 

  async function handleLogin() {
    try {
      const response = await fetch('http://127.0.0.1:3000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (data.success === "true") {
        // 1. Stocker le token
        await AsyncStorage.setItem('token', data.token);
        console.log('Token stocké !');
        const role = data.role; 
        if (role === 'wait') {
          router.replace('/wait');
        } else {
          router.replace('/tree');
        }


      } else {
        setErreur(data.message);
      }
    } catch (error) {
      setErreur('Serveur injoignable');
    }
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Connexion</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />

      <TextInput
        placeholder="Mot de passe"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />

      {erreur ? <Text style={{ color: 'red', marginBottom: 10 }}>{erreur}</Text> : null}

      <Button title="Se connecter" onPress={handleLogin} />
    </View>
  );
}