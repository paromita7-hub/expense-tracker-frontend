// ✅ src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ExpenseDashboard from './pages/ExpenseDashboard'; // 🔹 Added this line

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<ExpenseDashboard />} /> {/* 🔹 Added this route */}
      </Routes>
    </Router>
  );
}

export default App;
