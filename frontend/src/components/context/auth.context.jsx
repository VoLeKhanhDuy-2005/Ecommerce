import { createContext, useState } from "react";

export const AuthContext = createContext({
  // default value cho createContext
  auth: {
    isAuthenticated: false,
    user: {
      email: "",
      name: "",
      role: "user",
      avatar: "",
      phone: "",
      address: "",
    },
  },
  cartCount: 0,
  setAuth: () => {}, //hàm giả (dummy function) để tránh lỗi khi component dùng context nhưng chưa được bọc bởi AuthWrapper
  setCartCount: () => {},
});

export const AuthWrapper = (props) => {
  //Context Provider
  const [auth, setAuth] = useState({
    isAuthenticated: false,
    user: {
      email: "",
      name: "",
      role: "user",
      avatar: "",
      phone: "",
      address: "",
    },
  });
  const [cartCount, setCartCount] = useState(0);
  return (
    <AuthContext.Provider
      value={{
        auth,
        setAuth,
        cartCount,
        setCartCount,
      }}
    >
      {props.children}
    </AuthContext.Provider>
  );
};
