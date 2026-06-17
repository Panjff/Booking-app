import { Link, useLocation } from 'react-router-dom';
import { Home, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PageNotFound() {
  const location = useLocation();
  const pageName = location.pathname.substring(1);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <Sparkles className="w-8 h-8 text-primary mx-auto opacity-50" />
          <h1 className="text-7xl font-extrabold font-heading text-primary/20">404</h1>
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl font-bold font-heading text-foreground">
            Page introuvable
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            La page <span className="font-semibold text-foreground">"{pageName || '/'}"</span> n'existe pas.
          </p>
        </div>

        <Button asChild className="rounded-xl font-semibold">
          <Link to="/">
            <Home className="w-4 h-4 mr-2" />
            Retour à l'accueil
          </Link>
        </Button>
      </div>
    </div>
  );
}
