import { createContext, useState } from 'react';

export const AuthContext = createContext({
    isAuthenticated: false,
    user: {
        email: "",
        name: ""
    },
    appLoading: true,
    cartCount: 0,
    setCartCount: () => {}
});

export const AuthWrapper = (props) => {
    const [auth, setAuth] = useState({
        isAuthenticated: false,
        user: {
            email: "",
            name: ""
        }
    });

    const [appLoading, setAppLoading] = useState(true);
    const [cartCount, setCartCount] = useState(0);

    return (
        <AuthContext.Provider value={{
            auth, setAuth, appLoading, setAppLoading, cartCount, setCartCount
        }}>
            {props.children}
        </AuthContext.Provider>
    );
}