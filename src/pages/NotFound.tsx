import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEOHead from "@/components/SEOHead";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <SEOHead title="Page Not Found – DayMyTime" description="The page you're looking for doesn't exist." />
      <div className="text-center max-w-sm">
        <p className="text-6xl font-display font-bold text-primary mb-2">404</p>
        <h1 className="text-xl font-display font-bold mb-2">Page not found</h1>
        <p className="text-muted-foreground text-sm mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Button asChild>
          <Link to="/">
            <Home className="h-4 w-4 mr-2" /> Back to Home
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
