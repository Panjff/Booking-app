import { Toaster } from "sonner";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from '@/lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Home from '@/pages/Home';
import ManageSlots from '@/pages/ManageSlots';
import Login from '@/pages/Login';

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <Routes>
            {/* Routes publiques */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            
            {/* Routes protégées (admin uniquement) */}
            <Route
              path="/manage"
              element={
                <ProtectedRoute>
                  <ManageSlots />
                </ProtectedRoute>
              }
            />
            
            {/* Page 404 */}
            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </Router>
        <Toaster richColors position="top-center" />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;