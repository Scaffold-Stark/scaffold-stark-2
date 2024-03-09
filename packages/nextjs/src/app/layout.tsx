import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ScaffoldStarkAppWithProviders } from "~~/src/app/components/ScaffoldStarkAppWithProviders";
import '@radix-ui/themes/styles.css';
import { Theme } from '@radix-ui/themes';
import Header from "./components/Header";
import { UserProvider } from "@/contexts/userContenxt";



const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Starknet Speedrun",
  description: "Fast track your starknet journey",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en"data-theme="mytheme">
      <body>
      <Theme>
        <UserProvider>
        <ScaffoldStarkAppWithProviders>
          <Header />
          {children}
        </ScaffoldStarkAppWithProviders>
        </UserProvider>
        </Theme>
      </body>
    </html>
  );
}
