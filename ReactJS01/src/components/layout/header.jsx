import React, { useContext, useState } from "react";
import {
  HomeOutlined,
  SearchOutlined,
  UserOutlined,
  LogoutOutlined,
  LoginOutlined,
  UsergroupAddOutlined,
  MenuOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/auth.context";
import { Avatar, Dropdown } from "antd";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { auth, setAuth } = useContext(AuthContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    setAuth({ isAuthenticated: false, user: { email: "", name: "" } });
    navigate("/");
  };

  const navLinks = [
    { to: "/", label: "Trang chủ", icon: <HomeOutlined /> },
    { to: "/search", label: "Tìm kiếm", icon: <SearchOutlined /> },
  ];

  const userMenuItems = {
    items: [
      {
        key: "info",
        label: (
          <div className="px-2 py-1">
            <p className="font-semibold text-gray-800">
              {auth?.user?.name || "Thành viên"}
            </p>
            <p className="text-xs text-gray-500">{auth?.user?.email}</p>
          </div>
        ),
        disabled: true,
      },
      { type: "divider" },
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

  return (
    <header className="navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo thương hiệu */}
          <Link
            to="/"
            className="flex items-center gap-2.5 flex-shrink-0 group"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
              <span className="text-white text-xl leading-none">🍜</span>
            </div>
            <div className="leading-tight">
              <span className="font-black text-xl text-gray-900 tracking-tight">
                Food
              </span>
              <span className="font-black text-xl text-orange-500 tracking-tight">
                Shop
              </span>
            </div>
          </Link>

          {/* Navigation links*/}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                    isActive
                      ? "bg-orange-100 text-orange-600 shadow-sm"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Khu vực bên phải: User info hoặc nút Đăng nhập */}
          <div className="flex items-center gap-3">
            {auth.isAuthenticated ? (
              /* Khi đã đăng nhập: hiển thị Info + Dropdown menu */
              <Dropdown menu={userMenuItems} placement="bottomRight" arrow>
                <button className="flex items-center gap-2.5 pl-2 pr-4 py-2 rounded-xl hover:bg-orange-50 transition-colors border border-transparent hover:border-orange-100 group">
                  <Avatar
                    size={32}
                    className="bg-gradient-to-br from-orange-400 to-red-500 text-white font-bold flex-shrink-0"
                    icon={<UserOutlined />}
                  >
                    {auth?.user?.name?.[0]?.toUpperCase()}
                  </Avatar>
                  <div className="text-left hidden sm:block">
                    <p className="text-sm font-semibold text-gray-800 leading-tight group-hover:text-orange-600 transition-colors">
                      {auth?.user?.name || "Thành viên"}
                    </p>
                    <p className="text-xs text-gray-400 leading-tight truncate max-w-[120px]">
                      {auth?.user?.email}
                    </p>
                  </div>
                </button>
              </Dropdown>
            ) : (
              /* Khi chưa đăng nhập: hiển thị nút Đăng nhập */
              <Link
                to="/login"
                className="flex items-center gap-2 px-5 py-2 bg-orange-500 text-white font-semibold text-sm rounded-xl hover:bg-orange-600 transition-all shadow-sm hover:shadow-md"
              >
                <LoginOutlined /> Đăng nhập
              </Link>
            )}

            {/* Nút hamburger cho màn hình Mobile */}
            <button
              className="md:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <CloseOutlined /> : <MenuOutlined />}
            </button>
          </div>
        </div>

        {/* Mobile Menu (ẩn trên desktop) */}
        {mobileMenuOpen && (
          <nav className="md:hidden border-t border-gray-100 py-3 pb-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-orange-50 hover:text-orange-600 font-medium transition-colors"
              >
                {link.icon} {link.label}
              </Link>
            ))}
            {auth.isAuthenticated && (
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 font-medium transition-colors"
              >
                <LogoutOutlined /> Đăng xuất
              </button>
            )}
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
