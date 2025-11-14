import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { FavoritesProvider } from "./hooks/useFavorites";
import { Toaster } from "sonner";

function ResponsiveToaster() {
  const [position, setPosition] = useState<
    "top-right" | "top-center" | "top-left" | "bottom-right" | "bottom-center" | "bottom-left"
  >(typeof window !== "undefined" && window.innerWidth < 768 ? "top-center" : "top-right");

  useEffect(() => {
    function onResize() {
      setPosition(window.innerWidth < 768 ? "top-center" : "top-right");
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return <Toaster position={position} />;
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <FavoritesProvider>
      <App />
      <ResponsiveToaster />
    </FavoritesProvider>
  </React.StrictMode>
);
