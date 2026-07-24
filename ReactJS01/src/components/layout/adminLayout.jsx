import React, { useContext, useState, useEffect } from "react";
import { Layout, Menu, Avatar, Dropdown } from "antd";
import {
  UsergroupAddOutlined,
  ShoppingOutlined,
  TagsOutlined,
  HistoryOutlined,
  LogoutOutlined,
  HomeOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/auth.context";
import { getCurrentUserApi, logoutApi } from "../../util/api";
import { Spin } from "antd";

const { Sider, Content } = Layout;

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { auth, setAuth } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAccount = async () => {
      setIsLoading(true);
      const res = await getCurrentUserApi();
      if (res && res.EC === 0 && res.user) {
        if (res.user.role !== "admin") {
          navigate("/"); // Nếu không phải admin thì về trang chủ
          return;
        }
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
      } else {
        navigate("/login");
      }
      setIsLoading(false);
    };
    fetchAccount();
  }, []);

  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch (e) {
      console.log(e);
    }
    localStorage.removeItem("access_token");
    setAuth({ isAuthenticated: false, user: { email: "", name: "" } });
    navigate("/");
  };

  const menuItems = [
    {
      key: "/admin/orders",
      icon: <HistoryOutlined />,
      label: <Link to="/admin/orders">Quản lý Đơn hàng</Link>,
    },
    {
      key: "/admin/users",
      icon: <UsergroupAddOutlined />,
      label: <Link to="/admin/users">Quản lý Người dùng</Link>,
    },
    {
      key: "/admin/categories",
      icon: <TagsOutlined />,
      label: <Link to="/admin/categories">Quản lý Danh mục</Link>,
    },
    {
      key: "/admin/products",
      icon: <ShoppingOutlined />,
      label: <Link to="/admin/products">Quản lý Sản phẩm</Link>,
    },
  ];

  const userMenuItems = {
    items: [
      {
        key: "logout",
        label: (
          <span className="flex items-center gap-2 text-red-500 font-medium">
            <LogoutOutlined /> Đăng xuất
          </span>
        ),
        onClick: handleLogout,
      },
    ],
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        width={250}
        theme="light"
        breakpoint="lg"
        collapsedWidth="0"
        style={{
          height: "100vh",
          position: "sticky",
          top: 0,
          left: 0,
          borderRight: "1px solid #f0f0f0",
        }}
      >
        <div className="flex flex-col h-full">
          <div className="p-5 flex items-center justify-center border-b border-gray-100 flex-shrink-0">
            <Link
              to="/admin/orders"
              className="flex items-center gap-2 flex-shrink-0 group"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white text-lg leading-none">🍜</span>
              </div>
              <div className="leading-tight">
                <span className="font-black text-lg text-gray-900 tracking-tight">
                  Food
                </span>
                <span className="font-black text-lg text-orange-500 tracking-tight">
                  Shop
                </span>
              </div>
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto">
            <Menu
              mode="inline"
              selectedKeys={[location.pathname]}
              items={menuItems}
              style={{ borderRight: 0, padding: "10px 0" }}
            />
          </div>

          <div className="p-4 border-t border-gray-100 bg-white flex-shrink-0">
            <Dropdown menu={userMenuItems} placement="topLeft" arrow>
              <button className="flex items-center gap-2.5 w-full p-2 rounded-xl hover:bg-orange-50 transition-colors border border-transparent hover:border-orange-100 group">
                <Avatar
                  size={32}
                  className="bg-gradient-to-br from-orange-400 to-red-500 text-white font-bold flex-shrink-0"
                  icon={<UserOutlined />}
                  src={auth?.user?.avatar}
                >
                  {auth?.user?.name?.[0]?.toUpperCase()}
                </Avatar>
                <div className="text-left flex-1 overflow-hidden">
                  <p className="text-sm font-semibold text-gray-800 leading-tight group-hover:text-orange-600 transition-colors truncate">
                    {auth?.user?.name || "Admin"}
                  </p>
                  <p className="text-xs text-gray-400 leading-tight truncate">
                    {auth?.user?.email}
                  </p>
                </div>
              </button>
            </Dropdown>
          </div>
        </div>
      </Sider>

      <Layout>
        <Content
          style={{
            background: "#f5f7fa",
            minHeight: "100%",
            paddingBottom: "60px",
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
