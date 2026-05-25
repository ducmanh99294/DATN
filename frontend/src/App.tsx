import { Routes, Route, useLocation } from "react-router-dom"; // Đảm bảo đã import
import { useEffect } from "react";
import { useAuth } from "./hooks/useAuth";
import Home from "./components/Home";
import Header from "./components/Header";
import Footer from "./components/Footer";
import './App.css'
import Login from "./components/Login";
import Register from "./components/Register";
import BookingFlow from "./components/BookingFlow";
import DoctorSchedule from "./components/DoctorAvailable";
import { useAuthContext } from "./context/AuthContext";
import Products from "./components/Product";
import Account from "./components/Account";
import Checkout from "./components/Checkout";
import Cart from "./components/Cart";
import Orders from "./components/Order";
import Chat from "./components/Chatbot";
import Appoinments from "./components/Appointment";
import Specialty from "./components/Specialty";
import News from "./components/News";

// ADMIN
import Dashboard from "./components/dashboard/dashboard";
import AdminOrders from "./components/dashboard/orderAdmin";
import AdminProducts from "./components/dashboard/productAdmin";
import AdminUsers from "./components/dashboard/userAdmin";
import AdminDashboard from "./components/dashboard/home";
import Test from "./components/Notfound";
import CheckoutSuccess from "./components/CheckoutSuccess";

function App() {
  // 1. MỞ COMMENT DÒNG NÀY ĐỂ REACT ĐƯỢC LẮNG NGHE URL THAY ĐỔI
  const location = useLocation(); 
  
  const noHeaderFooterPaths = ["/login", "/register",];
  const hideHeaderFooter = noHeaderFooterPaths.includes(location.pathname);
  
  const { fetchMe, fetchDoctor } = useAuth();
  const user = useAuthContext();

  useEffect(() => {
      fetchMe(); 
  }, []);

  useEffect(() => {
    if (user.user?._id && user.user.role === 'doctor') {
      fetchDoctor(user.user._id);
    }
  }, [user.user?._id, user.user?.role]);

  return (
    <div className={`App ${hideHeaderFooter ? "no-padding" : ""}`}>
      {!hideHeaderFooter && <Header />}
      
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register/>} />
        <Route path="/booking" element={<BookingFlow />} />
        <Route path="/products" element={<Products />} />
        <Route path="/available" element={<DoctorSchedule />} />
        <Route path="/account" element={<Account />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/appoinments" element={<Appoinments />} />
        <Route path="/news" element={<News />} />
        <Route path="/news/:slug" element={<News />} />
        <Route path="/specialty/:slug" element={<Specialty />} />
        <Route path="/notFound" element={<Test/>} />
        <Route path="/checkout/success/:orderId" element={<CheckoutSuccess />} />

        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/dashborads" element={<Dashboard />} />
        <Route path="/admin/orders" element={<AdminOrders />} />
        <Route path="/admin/products" element={<AdminProducts />} />
        <Route path="/admin/users" element={<AdminUsers/> } />
      </Routes>
      
      {/* 2. THÊM ĐIỀU KIỆN CHO CHATBOT */}
      {!hideHeaderFooter && <Chat />}
      
      {!hideHeaderFooter && <Footer />}
    </div>
  );
}

export default App;