import { createContext, useState } from 'react';

export const AuthContext = createContext({// default value cho createContext
    auth: {
        isAuthenticated: false,
        user: {
            email: "",
            name: "",
            role: "user",
            avatar: ""
        }
    },
    appLoading: true,
    cartCount: 0,
    setAuth: () => {},//hàm giả (dummy function) để tránh lỗi khi component dùng context nhưng chưa được bọc bởi AuthWrapper
    setAppLoading: () => {},
    setCartCount: () => {}
});

export const AuthWrapper = (props) => {//Context Provider
    const [auth, setAuth] = useState({
        isAuthenticated: false,
        user: {
            email: "",
            name: "",
            role: "user",
            avatar: ""
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
