import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Home from "./pages/Home.jsx";
import CatProfile from "./pages/CatProfile.jsx";

import DailyCare from "./pages/DailyCare.jsx";
import BehaviorTracker from "./pages/BehaviorTracker.jsx";
import Insights from "./pages/Insights.jsx";

import VetAppointments from "./pages/VetAppointments.jsx";
import MedicalRecords from "./pages/MedicalRecords.jsx";

import FoodGuide from "./pages/FoodGuide.jsx";
import Chatbot from "./pages/Chatbot.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import UserProfile from "./pages/UserProfile.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/profile" element={<UserProfile />} />

        <Route path="/cats" element={<CatProfile />} />

        <Route path="/daily-care" element={<DailyCare />} />
        <Route path="/behavior" element={<BehaviorTracker />} />
        <Route path="/insights" element={<Insights />} />

        <Route path="/vet-appointments" element={<VetAppointments />} />
        <Route path="/medical-records" element={<MedicalRecords />} />

        <Route path="/food" element={<FoodGuide />} />
        <Route path="/chat" element={<Chatbot />} />
      </Routes>
    </Layout>
  );
}