import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth.jsx';
import { Login, Register } from './Login.jsx';
import Shell, { Empty } from './Shell.jsx';
import { Chat } from './Chats.jsx';
import { ListingDetail, ListingForm } from './Listings.jsx';
import Profile from './Profile.jsx';

function Protected({ children }) {
  const { session } = useAuth();
  return session ? children : <Navigate to="/login" replace />;
}

function Public({ children }) {
  const { session } = useAuth();
  return session ? <Navigate to="/chats" replace /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Public><Login /></Public>} />
        <Route path="/register" element={<Public><Register /></Public>} />
        <Route path="/" element={<Protected><Shell /></Protected>}>
          <Route index element={<Navigate to="/chats" replace />} />
          <Route path="chats" element={<Empty />} />
          <Route path="chats/:userId" element={<Chat />} />

          <Route path="offerings" element={<Empty />} />
          <Route path="offerings/new" element={<ListingForm type="O" />} />
          <Route path="offerings/:id" element={<ListingDetail />} />
          <Route path="offerings/:id/edit" element={<ListingForm type="O" editing />} />

          <Route path="wants" element={<Empty />} />
          <Route path="wants/new" element={<ListingForm type="W" />} />
          <Route path="wants/:id" element={<ListingDetail />} />
          <Route path="wants/:id/edit" element={<ListingForm type="W" editing />} />

          <Route path="me" element={<Profile />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
