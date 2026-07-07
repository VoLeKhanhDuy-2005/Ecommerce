import { Outlet, useNavigate } from "react-router-dom";
import Header from "./components/layout/header";
import { getCurrentUserApi, getCartApi } from "./util/api";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "./components/context/auth.context";
import { Spin } from "antd";

function App() {
  const { setAuth, setCartCount } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAccount = async () => {
      setIsLoading(true);
      try {
        const res = await getCurrentUserApi();
        if (res && res.EC === 0 && res.user) {
          setAuth({
            isAuthenticated: true,
            user: {
              email: res.user.email,
              name: res.user.name,
              role: res.user.role,
              avatar: res.user.avatarURL,
              phone: res.user.phone,
              address: res.user.address,
            },
          });

          if (res.user.role === "admin") {
            navigate("/admin/orders");
            setIsLoading(false);
            return;
          }

          // Tải số lượng sản phẩm trong giỏ hàng
          try {
            const cartRes = await getCartApi();
            if (cartRes && cartRes.success && cartRes.data) {
              const count = cartRes.data.items.reduce(
                (acc, item) => acc + item.quantity,
                0,
              );
              setCartCount(count);
            }
          } catch (error) {
            console.error("Lỗi khi lấy giỏ hàng ban đầu:", error);
          }
        }
      } catch (error) {
        console.error("Fetch account error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAccount();
  }, []);

  return (
    <div>
      {isLoading === true ? (
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
