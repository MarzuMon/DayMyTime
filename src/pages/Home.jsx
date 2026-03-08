// Legacy Home page — redirects to Landing
import { Navigate } from "react-router-dom";

export default function Home() {
  return <Navigate to="/" replace />;
}