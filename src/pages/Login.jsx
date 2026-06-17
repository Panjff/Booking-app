import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Mail, Lock, Loader2, Shield } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

// Récupérer l'email admin depuis les variables d'environnement
// Note: Les variables d'environnement côté client doivent commencer par VITE_
// Pour utiliser la variable du backend, on la définit aussi côté frontend
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || "emilie.tall@gmail.com";

export default function Login() {
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // Vérifier d'abord que l'email correspond à l'admin
      if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        throw new Error("Cet email n'est pas autorisé. Seul l'administrateur peut se connecter.");
      }

      const user = await login(email, password);
      
      // Vérifier si l'utilisateur est admin
      if (!user.isAdmin) {
        throw new Error("Accès non autorisé. Seul l'administrateur peut se connecter.");
      }
      
      navigate(redirect);
    } catch (err) {
      setError(err.message || "Email ou mot de passe incorrect");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={LogIn}
      title="Accès administrateur"
      subtitle="Connectez-vous à votre espace de gestion"
      footer={
        <div className="text-xs text-muted-foreground flex items-center justify-center gap-2">
          <Shield className="w-3 h-3" />
          <span>Accès réservé à l'administrateur</span>
        </div>
      }
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder={ADMIN_EMAIL}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <Shield className="w-3 h-3 text-primary" />
            Utilisez l'email administrateur : <strong className="text-primary">{ADMIN_EMAIL}</strong>
          </p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Mot de passe</Label>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Connexion...
            </>
          ) : (
            "Se connecter"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}