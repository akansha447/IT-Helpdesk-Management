import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TicketsList from './pages/TicketsList';
import TicketDetail from './pages/TicketDetail';
import CreateTicket from './pages/CreateTicket';
import Users from './pages/Users';
import Categories from './pages/Categories';
import ChangeRequests from './pages/ChangeRequests';
import Departments from './pages/Departments';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tickets"
        element={
          <ProtectedRoute>
            <Layout>
              <TicketsList />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tickets/new"
        element={
          <ProtectedRoute>
            <Layout>
              <CreateTicket />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tickets/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <TicketDetail />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute roles={['admin', 'manager']}>
            <Layout>
              <Users />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/categories"
        element={
          <ProtectedRoute roles={['admin']}>
            <Layout>
              <Categories />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="/change-requests" element={<ProtectedRoute roles={['admin', 'manager', 'agent', 'employee']}><Layout><ChangeRequests /></Layout></ProtectedRoute>} />
      <Route path="/departments" element={<ProtectedRoute roles={['admin']}><Layout><Departments /></Layout></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
