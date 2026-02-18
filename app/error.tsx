'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-6 w-6" aria-hidden />
            <CardTitle>Algo salió mal</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Ha ocurrido un error inesperado. Puedes intentar de nuevo o volver al inicio.
          </p>
          <div className="flex gap-2">
            <Button onClick={reset}>Intentar de nuevo</Button>
            <Button variant="outline" asChild>
              <a href="/">Ir al inicio</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
