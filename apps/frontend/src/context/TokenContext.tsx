import { createContext, useContext, useEffect, useState } from 'react';

type TokenContextType = {
  token: string;
  setToken: (token: string) => void;
};

const TokenContext = createContext<TokenContextType>({
  token: '',
  setToken: () => {},
});

export const useToken = () => useContext(TokenContext);

export const TokenProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setTokenState] = useState('');

  useEffect(() => {
    const storedToken = localStorage.getItem('access_token');
    if (storedToken) {
      setTokenState(storedToken);
    } else {
      console.warn('No auth token found, proceeding without auth');
    }
  }, []);

  const setToken = (newToken: string) => {
    localStorage.setItem('access_token', newToken);
    setTokenState(newToken);
  };

  return (
    <TokenContext.Provider value={{ token, setToken }}>
      {children}
    </TokenContext.Provider>
  );
};