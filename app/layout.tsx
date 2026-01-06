import "./globals.css";

export const metadata = {
  title: "Registro de Clientes | Físico Matemático",
  description: "Gestión de clientes, planes, horas y abonos.",
};

const themeInitScript = `
(function () {
  try {
    var t = localStorage.getItem("fm_theme") || "blue";
    document.documentElement.classList.toggle("dark", t === "dark");
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen text-[rgb(var(--foreground-rgb))]">
        {children}
      </body>
    </html>
  );
}
