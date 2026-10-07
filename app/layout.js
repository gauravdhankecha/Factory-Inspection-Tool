import '../legacy/tool.css';
import './globals.css';

export const metadata = {
  title: 'ફેક્ટરી ઇન્સ્પેક્શન ટૂલ',
  description: 'ઔદ્યોગિક સલામતી અને સ્વાસ્થ્ય કચેરી, નવસારી — ઇન્સ્પેક્શન નોટિસ અને રેકોર્ડ',
};

export const viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function RootLayout({ children }) {
  return (
    <html lang="gu" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Hind+Vadodara:wght@400;500;600;700&display=swap"
        />
        {/* apply the saved light/dark choice before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('theme');if(t==='dark'||t==='light')document.documentElement.setAttribute('data-theme',t)}catch(e){}",
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
