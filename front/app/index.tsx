import { Text, View, TextInput, Button } from "react-native";
import {useState} from 'react';

export default function Index() {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); 

  function handleLogin() {
    console.log('Email:', email);
    console.log('Mot de Passe:', password);
  }

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Bienvenue sur Genoa</Text>

      <Text>Connectez vous avec votre adresse mail et votre mot de passe</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={{ borderWidth: 1, padding: 8, marginBottom: 8 }}
      />

      <TextInput
        placeholder="Mot de Passe"
        value={password}
        onChangeText={setPassword}
        style={{ borderWidth: 1, padding: 8, marginBottom: 8 }}
      />

    </View>
  );
}
