import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/layout/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Secure Notes",
  description: "Secure Note-Taking Application",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex h-screen flex-col overflow-hidden bg-zinc-50 dark:bg-black">
        <AuthProvider>
          {/* Navbar reads the current pathname (to highlight the active
              link). For a route with a dynamic segment not covered by
              generateStaticParams (e.g. /users/[userId]/posts), that value
              isn't known at prerender time, so the hook suspends — this
              boundary lets the rest of the static shell render regardless. */}
          <Suspense fallback={null}>
            <Navbar />
          </Suspense>
          {/* min-h-0 is required for a flex child to be allowed to shrink
              below its content size — without it, a page that wants its
              own internal independently-scrolling regions (e.g. /notes)
              would instead just grow main/body and scroll the whole
              document. Pages that don't need that just render normally and
              scroll inside main like before. */}
          <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
