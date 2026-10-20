import type { ReactNode } from "react";
import "./globals.css";
import AppChrome from "./components/AppChrome";

export const metadata = {
  title: "Que Dice Mi Mascota — un juego",
  description:
    "Sube un video corto de tu perro o gato y le pondremos un doblaje inventado. Solo para reírnos.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}