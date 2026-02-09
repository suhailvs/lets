import { Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import Nav from './pages/Nav';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import User from './pages/User';
import Map from './pages/Map';
import PrivateRoute from './components/PrivateRoute';
import { AuthContext } from './utils/AuthContext';

function App() {
  // const isAuthenticated = !!localStorage.getItem('user');
  // alert(isAuthenticated)
  const { isAuthenticated } = useContext(AuthContext);
  return (
    <div className="container">
      <Nav />
      <Routes>
        <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} 
        />
        <Route 
          path="/register" 
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register />} 
        />
        
        <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/map" element={<Map />} />
            <Route path="/user/:id" element={<User />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;