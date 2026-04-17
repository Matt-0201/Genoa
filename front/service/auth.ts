import AsyncStorage from '@react-native-async-storage/async-storage';

// Récupère le token stocké
export async function getToken(): Promise<string | null> {
  return await AsyncStorage.getItem('token');
}

// Décode le payload du JWT
export function decodeToken(token: string) {
  const payload = token.split('.')[1];
  const decoded = atob(payload);
  return JSON.parse(decoded);
}

// Récupère le rôle depuis le token
export async function getRoleFromToken(): Promise<string | null> {
  const token = await getToken();
  if (!token) return null;
  const payload = decodeToken(token);
  return payload.role ?? null;
}