import { Outlet } from "react-router-dom";
import Header from "./components/layout/header";
import { getCurrentUserApi, getCartApi } from "./util/api";
import { useContext, useEffect } from "react";
import { AuthContext } from "./components/context/auth.context";
import { Spin } from "antd";

function App() {
  const { setAuth, appLoading, setAppLoading, setCartCount } = useContext(AuthContext);

  useEffect(() => {
    const fetchAccount = async () => {
      setAppLoading(true);
      const res = await getCurrentUserApi();
      if (res && res.EC === 0 && res.user) {
        setAuth({
          isAuthenticated: true,
          user: {
            email: res.user.email,
            name: res.user.name,
            role: res.user.role,
            avatar: res.user.avatarURL,
          },
        });

        // Tải số lượng sản phẩm trong giỏ hàng
        try {
          const cartRes = await getCartApi();
          if (cartRes && cartRes.success && cartRes.data) {
            const count = cartRes.data.items.reduce((acc, item) => acc + item.quantity, 0);
            setCartCount(count);
          }
        } catch (error) {
          console.error("Lỗi khi lấy giỏ hàng ban đầu:", error);
        }
      }
      setAppLoading(false);
    };
    fetchAccount();
  }, []);


  return (
    <div>
      {appLoading === true ? (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          <Spin />
        </div>
      ) : (
        <>
          <Header />
          <Outlet />
        </>
      )}
    </div>
  );
}


export default App;
