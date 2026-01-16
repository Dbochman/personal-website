import { Button } from "@/components/ui/button";

export function ErrorFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-md">
        <h1 className="text-2xl font-bold text-foreground">
          Something went wrong
        </h1>
        <p className="text-foreground/70">
          An unexpected error occurred. The error has been reported and we'll look into it.
        </p>
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          className="mt-4"
        >
          Reload page
        </Button>
      </div>
    </div>
  );
}
