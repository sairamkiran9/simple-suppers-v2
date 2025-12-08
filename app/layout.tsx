import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/lib/auth-context';
import { Toaster } from '@/components/ui/sonner';
import RegisterSW from './register-sw';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Simple Suppers - Meal Planning Made Simple',
  description: 'Subscribe to meal plans created by real people for real budgets. Get weekly menus, shopping lists, and cooking tips starting at just $6/month.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Simple Suppers',
    // startUpImage: [],
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  viewport: 'width=device-width, initial-scale=1',
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: `
          :root{--color-cream-50:rgba(252,252,249,1);--color-cream-100:rgba(255,255,253,1);--color-gray-200:rgba(245,245,245,1);--color-gray-300:rgba(167,169,169,1);--color-slate-500:rgba(98,108,113,1);--color-slate-900:rgba(19,52,59,1);--color-teal-300:rgba(50,184,198,1);--color-teal-500:rgba(33,128,141,1);--color-teal-600:rgba(29,116,128,1);--color-brown-600-rgb:94,82,64;--color-teal-500-rgb:33,128,141;--color-slate-900-rgb:19,52,59;--color-background:var(--color-cream-50);--color-surface:var(--color-cream-100);--color-text:var(--color-slate-900);--color-text-secondary:var(--color-slate-500);--color-primary:var(--color-teal-500);--color-primary-hover:var(--color-teal-600);--color-border:rgba(var(--color-brown-600-rgb),.2);--color-btn-primary-text:var(--color-cream-50);--color-focus-ring:rgba(var(--color-teal-500-rgb),.4);--font-size-base:14px;--font-size-lg:16px;--font-size-xl:18px;--font-size-2xl:20px;--font-size-3xl:24px;--space-8:8px;--space-12:12px;--space-16:16px;--space-20:20px;--space-24:24px;--space-32:32px;--radius-base:8px;--radius-lg:12px;--radius-full:9999px;--duration-fast:150ms;--duration-normal:250ms;--ease-standard:cubic-bezier(.16,1,.3,1);--container-lg:1024px;--container-xl:1280px}
          [data-color-scheme="dark"]{--color-background:rgba(31,33,33,1);--color-surface:rgba(38,40,40,1);--color-text:var(--color-gray-200);--color-primary:var(--color-teal-300)}
          html{font-size:var(--font-size-base);font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;line-height:1.5;color:var(--color-text);background-color:var(--color-background);-webkit-font-smoothing:antialiased;box-sizing:border-box}
          body{margin:0;padding:0}
          *,*::before,*::after{box-sizing:inherit}
          .navbar{background:var(--color-surface);border-bottom:1px solid var(--color-border);position:sticky;top:0;z-index:100}
          .nav-content{display:flex;justify-content:space-between;align-items:center;padding:var(--space-16) 0}
          .nav-brand{display:flex;align-items:center;gap:var(--space-8);font-size:var(--font-size-xl);font-weight:600;color:var(--color-primary)}
          .nav-right{display:flex;align-items:center;gap:var(--space-16)}
          .nav-links{display:flex;gap:var(--space-24)}
          .nav-link{color:var(--color-text-secondary);font-weight:500;transition:color var(--duration-fast) var(--ease-standard);cursor:pointer;background:none;border:none;font-size:var(--font-size-base)}
          .nav-link:hover,.nav-link.active{color:var(--color-primary)}
          .hero-redesigned{position:relative;height:100vh;min-height:600px;display:flex;align-items:center;overflow:hidden;margin-bottom:var(--space-32)}
          .hero-background{position:absolute;top:0;left:0;width:100%;height:100%;z-index:1}
          .hero-background .hero-image{width:100%;height:100%;object-fit:cover;margin:0}
          .hero-overlay{position:absolute;top:0;left:0;width:100%;height:100%;background:linear-gradient(135deg,rgba(0,0,0,.4),rgba(0,0,0,.2));z-index:2}
          .hero-container{position:relative;z-index:3;height:100%;display:flex;align-items:center}
          .hero-redesigned .hero-content{max-width:700px;text-align:center;margin:0 auto;color:#fff}
          .hero-redesigned h1{font-size:clamp(var(--font-size-3xl),5vw,3.5rem);margin-bottom:var(--space-20);color:#fff;text-shadow:0 2px 8px rgba(0,0,0,.7);font-weight:600;line-height:1.1}
          .hero-redesigned p{font-size:var(--font-size-xl);color:rgba(255,255,255,.9);margin-bottom:var(--space-32);line-height:1.6;text-shadow:0 1px 2px rgba(0,0,0,.3)}
          .hero-redesigned .hero-actions{display:flex;gap:var(--space-20);justify-content:center;flex-wrap:wrap;margin-bottom:var(--space-32)}
          .btn{display:inline-flex;align-items:center;justify-content:center;padding:var(--space-8) var(--space-16);border-radius:var(--radius-base);font-size:var(--font-size-base);font-weight:500;line-height:1.5;cursor:pointer;transition:all var(--duration-normal) var(--ease-standard);border:none;text-decoration:none}
          .btn--primary{background:var(--color-primary);color:var(--color-btn-primary-text)}
          .btn--primary:hover{background:var(--color-primary-hover)}
          .btn--lg{padding:var(--space-12) var(--space-20);font-size:var(--font-size-lg);border-radius:var(--radius-base)}
          .container{width:100%;margin-right:auto;margin-left:auto;padding-right:var(--space-16);padding-left:var(--space-16)}
          @media(min-width:1024px){.container{max-width:var(--container-lg)}}
          @media(min-width:1280px){.container{max-width:var(--container-xl)}}
        ` }} />
      </head>
      <body className={inter.className}>
        <Providers>
          <AuthProvider>
            <RegisterSW />
            {children}
            <Toaster />
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}