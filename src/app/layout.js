import "./globals.css";
import { CartProvider } from "../context/CartContext";

export const metadata = {
  title: "Inversiones EJ | Tienda Oficial",
  description: "Catálogo exclusivo de Inversiones EJ",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
      </head>
      <body className="antialiased bg-darkgray-950 text-white">
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}