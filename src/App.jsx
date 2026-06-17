import { Toaster } from "sonner";

import { QueryClientProvider } from '@tanstack/react-query';

import { queryClientInstance } from '@/lib/query-client';

import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import PageNotFound from '@/lib/PageNotFound';

import { AuthProvider } from '@/lib/AuthContext';

import ScrollToTop from '@/components/ScrollToTop';

import ProtectedRoute from '@/components/ProtectedRoute';

import ManageAuthRequired from '@/components/ManageAuthRequired';

import Home from '@/pages/Home';

import ManageSlots from '@/pages/ManageSlots';

import Login from '@/pages/Login';

import Register from '@/pages/Register';

import ForgotPassword from '@/pages/ForgotPassword';

import ResetPassword from '@/pages/ResetPassword';



function App() {

  return (

    <AuthProvider>

      <QueryClientProvider client={queryClientInstance}>

        <Router>

          <ScrollToTop />

          <Routes>

            <Route path="/" element={<Home />} />

            <Route path="/login" element={<Login />} />

            <Route path="/register" element={<Register />} />

            <Route path="/forgot-password" element={<ForgotPassword />} />

            <Route path="/reset-password" element={<ResetPassword />} />

            <Route

              element={

                <ProtectedRoute unauthenticatedElement={<ManageAuthRequired />} />

              }

            >

              <Route path="/manage" element={<ManageSlots />} />

            </Route>

            <Route path="*" element={<PageNotFound />} />

          </Routes>

        </Router>

        <Toaster richColors position="top-center" />

      </QueryClientProvider>

    </AuthProvider>

  );

}



export default App;

