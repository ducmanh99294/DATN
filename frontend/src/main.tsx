import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { CartProvider } from "./context/CartContext";
import { SocketProvider } from "./context/SocketContext";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  // <React.StrictMode>
    <BrowserRouter>
      <NotificationProvider>
        <AuthProvider>
          <CartProvider>
            <SocketProvider>
              <App />
            </SocketProvider>
          </CartProvider>
        </AuthProvider>
      </NotificationProvider>
    </BrowserRouter>
  // </React.StrictMode>
);