import { Routes, Route, useLocation } from "react-router-dom";
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

function App() {
  // const location = useLocation();
  const noHeaderFooterPaths = ["/login", "/register", ];
  const hideHeaderFooter = noHeaderFooterPaths.includes(location.pathname);
  const { fetchMe, fetchDoctor } = useAuth();
  const user = useAuthContext()

  useEffect(() => {
      fetchMe(); // gọi /auth/me → đọc cookie
  }, []);

  useEffect(() => {
    if (user.user?._id && user.user.role === 'doctor') {
      fetchDoctor(user.user._id);
    }
  }, [user.user?._id, user.user?.role]);
  return (
    <div className="App">
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
        <Route path="/specialty/:slug" element={<Specialty />} />
      </Routes>
        <Chat />
      {!hideHeaderFooter && <Footer />}
      
    </div>
  );
}

export default App;