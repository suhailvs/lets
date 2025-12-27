import { createContext, useContext,useEffect, useRef, type PropsWithChildren } from 'react';
// import axios from 'axios';
import api from '@/constants/api';
import * as SecureStore from 'expo-secure-store';
import { useStorageState } from './useStorageState';

const AuthContext = createContext<{
  // signIn: () => void;
  signIn: (username: string, password: string, expoPushToken:string) => Promise<void>;
  signOut: () => void;
  session?: string | null;
  isLoading: boolean;
}>({
  signIn: async () => {},
  signOut: () => null,
  session: null,
  isLoading: false,
});

const isLoggingOutRef = useRef(false);
// This hook can be used to access the user info.
export function useSession() {
  const value = useContext(AuthContext);
  if (process.env.NODE_ENV !== 'production') {
    if (!value) {
      throw new Error('useSession must be wrapped in a <SessionProvider />');
    }
  }

  return value;
}

// const api = axios.create({
//   baseURL: 'http://192.168.85.167:8000', // Replace with your API URL
// });

export function SessionProvider({ children }: PropsWithChildren) {
  const [[isLoading, session], setSession] = useStorageState('session');
  if (session) {
    api.defaults.headers.common['Authorization'] = `Token ${session}`;
  }
  
  // Sign-in function
  const signIn = async (username: string, password: string, expoPushToken:string) => {
    console.log(username);
    try {
      const response = await api.post('/login/', { username, password, expoPushToken });
      const data = response.data;
      const token = data.key;
      setSession(token); // Store token securely
      api.defaults.headers.common['Authorization'] = `Token ${token}`;
      await SecureStore.setItemAsync('user_data', JSON.stringify(data));
      
    } catch (error:any) {
      if (error.response) {
        // Server responded with a status code outside 2xx
        console.log('Response Data:', error.response.data);
        console.log('Status:', error.response.status);
        console.log('Headers:', error.response.headers);
        // Server responded with an error (e.g., 400, 401)
        throw new Error(JSON.stringify(error.response.data) || "Invalid credentials");
      } else if (error.request) {
        // Request was made but no response received
        console.log('No Response:', error.request);
        // No response received (network error)
        throw new Error("Network error. Please try again.");
      } else {
        // Something else happened while setting up the request
        console.log('Error Message:', error.message);
        throw new Error("Something went wrong. Please try again.");
      }
      // console.log('Full Error:', JSON.stringify(error, null, 2)); // Convert error object to JSON
      
    }
  };

  // Sign-out function
  const signOut = () => {
    setSession(null);
    delete api.defaults.headers.common['Authorization'];
  };

  // if token has been deleted from the table, then user need to signout
  useEffect(() => {
    const interceptorId = api.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401 && !isLoggingOutRef.current) {signOut();}
        return Promise.reject(error);
      }
    );
    return () => {api.interceptors.response.eject(interceptorId);};
  }, []);

  return (
    <AuthContext.Provider value={{ signIn, signOut, session, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
