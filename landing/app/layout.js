import './globals.css';

export const metadata = {
  title: 'DetecTicket — Detección Semántica de Duplicados',
  description: 'Detecta tickets duplicados y relacionados automáticamente usando vectores de lenguaje y similitud de coseno.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
