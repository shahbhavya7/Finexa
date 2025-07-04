import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/header";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Finexa",
  description: "Redefining the Future of Finance",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link rel="icon" href="/logo-sm.png" sizes="any" />
        </head>
        <body className={`${inter.className}`}>
          <Header />
          <main className="min-h-screen">{children}</main>
          <Toaster richColors />

          <footer className="bg-blue-50 py-12">
            <div className="container mx-auto px-4 text-center text-gray-600 py-8">
              <p>
                © 2025{" "}
                <span className="bg-gradient-to-r from-cyan-600 via-cyan-500 to-cyan-400 bg-clip-text text-transparent font-semibold">
                  Finexa
                </span>
              </p>
              <p>
                Crafted with care by{" "}
                <span className="bg-gradient-to-r from-gray-700 via-cyan-600 to-gray-700 bg-clip-text text-transparent font-medium">
                  Bhavya
                </span>
              </p>
            </div>
          </footer>
        </body>
      </html>
    </ClerkProvider>
  );
}
