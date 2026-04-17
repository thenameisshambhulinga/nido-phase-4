import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ModernErrorPage from "@/components/shared/ModernErrorPage";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <ModernErrorPage
      variant="not-found"
      title="We could not find this page"
      description="The requested route does not exist or has moved. Use the home page to continue navigating the app."
      detail={`Missing route: ${location.pathname}`}
      primaryActionLabel="Go Home"
      secondaryActionLabel="Go Back"
      onPrimaryAction={() => (window.location.href = "/home")}
      onSecondaryAction={() => navigate(-1)}
      showHomeAction={false}
    />
  );
};

export default NotFound;
