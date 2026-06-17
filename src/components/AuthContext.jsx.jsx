import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "@/api/client";

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || "emilie.tall@gmail.com";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      api.auth
        .me()
        .then((user) => {
          if (user.isAdmin && user.email === ADMIN_EMAIL) {
            setUser(user);
          } else {
            localStorage.removeItem("auth_token");
            setUser(null);
          }
        })
        .catch(() => {
          localStorage.removeItem("auth_token");
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      throw new Error("Cet email n'est pas autorisé. Seul l'administrateur peut se connecter.");
    }

    try {
      const response = await api.auth.login({ email, password });
      const { token, user } = response;
      if (!user.isAdmin || user.email !== ADMIN_EMAIL) {
        throw new Error("Accès non autorisé. Seul l'administrateur peut se connecter.");
      }
      localStorage.setItem("auth_token", token);
      setUser(user);
      return user;
    } catch (error) {
      if (error.message) {
        throw error;
      }
      throw new Error("Erreur de connexion. Vérifiez vos identifiants.");
    }
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAdmin: user?.isAdmin || false,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}