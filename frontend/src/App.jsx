import {BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom'
import React from 'react'
import Login from './pages/auth/Login';
import SignUp from './pages/auth/SignUp';
import Home from './pages/home/Home'
const App = () => {
  return (
    <div>
      <Router>
        <Routes>
          <Route path="/dashboard" element={<Home />} />                                               
          <Route path="/login" element={<Login />} />
          <Route path="/signUp" element={<SignUp />} />
        </Routes>
      </Router>

    </div>
  )
}

export default App
