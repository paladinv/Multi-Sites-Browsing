import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "MSB | Multi-Sites Browsing",
  description: "Split your screen and browse multiple sites at once.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <header className="top-bar">
            <div className="brand">
              <div className="brand-mark">MSB</div>
              <div className="brand-sub">Multi-Sites Browsing</div>
            </div>
            <nav className="nav">
              <Link href="/" className="nav-link">
                Start
              </Link>
              <Link href="/about" className="nav-link">
                About
              </Link>
            </nav>
          </header>
          <main className="main">{children}</main>
          <footer className="footer">
            Built for split-screen focus. Licensed under GNU GPL v3.0.
          </footer>
        </div>
      </body>
    </html>
  );
}
