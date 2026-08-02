import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import AppLayout from '../layouts/AppLayout';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Tree from '../pages/Tree';
import Events from '../pages/Events';
import Messages from '../pages/Messages';
import Directory from '../pages/Directory';
import Validations from '../pages/Validations';
import Profile from '../pages/Profile';
import PersonPage from '../pages/PersonPage';

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/tree" element={<Tree />} />
          <Route path="/events" element={<Events />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/directory" element={<Directory />} />
          <Route path="/validations" element={<Validations />} />
          <Route path="/profile" element={<Profile />} /> {/* Ajout */}
          <Route path="/person/:id" element={<PersonPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;