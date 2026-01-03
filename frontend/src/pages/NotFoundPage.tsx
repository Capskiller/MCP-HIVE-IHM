import { Link } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <AlertTriangle className="w-16 h-16 text-muted-foreground mb-4" />
      <h1 className="text-4xl font-bold mb-2">404</h1>
      <p className="text-muted-foreground mb-8">Page non trouvée</p>
      <Button asChild>
        <Link to="/">
          <Home className="w-4 h-4 mr-2" />
          Retour à l'accueil
        </Link>
      </Button>
    </div>
  );
}
