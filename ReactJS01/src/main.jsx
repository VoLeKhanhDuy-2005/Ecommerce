import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

import { createBrowserRouter, RouterProvider } from "react-router-dom";
import AdminOrdersPage from "./pages/admin/orders.jsx";
import RegisterPage from "./pages/register.jsx";
import UserPage from "./pages/admin/users.jsx";
import HomePage from "./pages/home.jsx";
import LoginPage from "./pages/login.jsx";
import ProductDetailPage from "./pages/productDetail.jsx";
import SearchFilterPage from "./pages/search.jsx";
import CartPage from "./pages/user/cart.jsx";
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
        path: "user",
        element: <UserPage />,
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
      {
        path: "admin/orders",
        element: <AdminOrdersPage />,
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
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthWrapper>
      <RouterProvider router={router} />
    </AuthWrapper>
  </React.StrictMode>,
);
