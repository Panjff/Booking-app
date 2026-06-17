import { useEffect } from 'react';

import { Outlet } from 'react-router-dom';

import { useAuth } from '@/lib/AuthContext';



const DefaultFallback = () => (

  <div className="fixed inset-0 flex flex-col items-center justify-center gap-3 bg-background">

    <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />

    <p className="text-sm text-muted-foreground font-medium">Vérification...</p>

  </div>

);



export default function ProtectedRoute({ fallback = <DefaultFallback />, unauthenticatedElement }) {

  const { isAuthenticated, isLoadingAuth, authChecked, checkUserAuth } = useAuth();



  useEffect(() => {

    if (!authChecked && !isLoadingAuth) {

      checkUserAuth();

    }

  }, [authChecked, isLoadingAuth, checkUserAuth]);



  if (isLoadingAuth || !authChecked) {

    return fallback;

  }



  if (!isAuthenticated) {

    return unauthenticatedElement;

  }



  return <Outlet />;

}

