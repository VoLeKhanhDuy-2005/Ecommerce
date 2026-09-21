/* eslint-disable react-refresh/only-export-components */
import { createContext, useState } from 'react';

export const AuthContext = createContext({
  // Default value for createContext
  auth: {
    isAuthenticated: false,
    user: {
      email: '',
      name: '',
      role: 'user',
      avatar: '',
      phone: '',
      address: '',
    },
  },
  cartCount: 0,
});

export const AuthWrapper = (props) => {
  // Context Provider component
  const [auth, setAuth] = useState({
    isAuthenticated: false,
    user: {
      email: '',
      name: '',
      role: 'user',
      avatar: '',
      phone: '',
      address: '',
    },
  });
  const [cartCount, setCartCount] = useState(0);
  const [isAuthLoading, setIsAuthLoading] = useState(true); // true khi đang chờ verify token từ server (tránh redirect sớm)
  return (
    <AuthContext.Provider
      value={{
        auth,
        setAuth,
        cartCount,
        setCartCount,
        isAuthLoading,
        setIsAuthLoading,
      }}
    >
      {props.children}
    </AuthContext.Provider>
  );
};
