import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

import { createBrowserRouter, RouterProvider } from "react-router-dom";
import AdminLayout from "./components/layout/adminLayout.jsx";
import AdminOrdersPage from "./pages/admin/orders.jsx";
import AdminCategoriesPage from "./pages/admin/categories.jsx";
import AdminProductsPage from "./pages/admin/products.jsx";
import RegisterPage from "./pages/register.jsx";
import UserPage from "./pages/admin/users.jsx";
import HomePage from "./pages/home.jsx";
import LoginPage from "./pages/login.jsx";
import ProductDetailPage from "./pages/productDetail.jsx";
import SearchFilterPage from "./pages/search.jsx";
import CartPage from "./pages/user/cart.jsx";
import ForgotPasswordPage from "./pages/forgot-password.jsx";
import OrdersPage from "./pages/user/orders.jsx";
import EditProfilePage from "./pages/user/editProfile.jsx";
import { AuthWrapper } from "./components/context/auth.context.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "product/:id",
        element: <ProductDetailPage />,
      },
      {
        path: "search",
        element: <SearchFilterPage />,
      },
      {
        path: "cart",
        element: <CartPage />,
      },
      {
        path: "orders",
        element: <OrdersPage />,
      },
      {
        path: "profile",
        element: <EditProfilePage />,
      },
    ],
  },
  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      {
        path: "users",
        element: <UserPage />,
      },
      {
        path: "orders",
        element: <AdminOrdersPage />,
      },
      {
        path: "categories",
        element: <AdminCategoriesPage />,
      },
      {
        path: "products",
        element: <AdminProductsPage />,
      },
    ],
  },
  {
    path: "register",
    element: <RegisterPage />,
  },
  {
    path: "login",
    element: <LoginPage />,
  },
  {
    path: "forgot-password",
    element: <ForgotPasswordPage />,
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthWrapper>
      <RouterProvider router={router} />
    </AuthWrapper>
  </React.StrictMode>,
);
