import { Link, useLocation } from "react-router-dom";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ManageAuthRequired() {
  const location = useLocation();
  const loginUrl = `/login?redirect=${encodeURIComponent(location.pathname)}`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10">
          <Lock className="w-8 h-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold font-heading text-foreground flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Accès réservé
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Connectez-vous pour gérer les créneaux de disponibilité.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Button asChild className="rounded-xl font-semibold h-11">
            <Link to={loginUrl}>Se connecter</Link>
          </Button>
          <Button asChild variant="ghost" className="rounded-xl text-sm">
            <Link to="/">← Retour à la réservation</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
