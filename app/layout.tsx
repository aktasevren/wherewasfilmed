import type { Metadata } from "next";
import "@fontsource/material-symbols-outlined/400.css";
import "./globals.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "alertifyjs/build/css/alertify.css";
import "leaflet/dist/leaflet.css";
import StoreProvider from "@/lib/redux/StoreProvider";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://where-was-filmed.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Where Was Filmed - Movie & Series Filming Locations on Map",
    template: "%s | Where Was Filmed"
  },
  description: "Discover where your favorite movies and series were filmed. Find every filming location on an interactive map — search by title and explore where it was shot.",
  keywords: [
    "movie filming locations",
    "film locations",
    "where was this filmed",
    "movie location finder",
    "filming spots",
    "movie sets",
    "location scouting",
    "movie map",
    "film geography",
    "cinema locations",
    "movie tourism",
    "film destinations"
  ],
  authors: [{ name: "Evren Aktaş", url: "https://github.com/aktasevren" }],
  creator: "Evren Aktaş",
  publisher: "Evren Aktaş",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Where Was Filmed",
    title: "Where Was Filmed - Movie & Series Filming Locations on Map",
    description: "Discover where your favorite movies and series were filmed. Find every filming location on an interactive map.",
    images: [
      {
        url: "/assets/film.png",
        width: 1200,
        height: 630,
        alt: "Where Was Filmed - Movie & Series Filming Locations",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Where Was Filmed - Movie & Series Filming Locations on Map",
    description: "Discover where your favorite movies were filmed! Find exact filming locations on an interactive map.",
    images: ["/assets/film.png"],
    creator: "@aktasevren",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
  verification: {
    // Add Google Search Console verification if needed
    // google: "your-google-verification-code",
  },
  category: "Entertainment",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Where Was Filmed",
    "description": "Discover where your favorite movies were filmed! Find exact filming locations on an interactive map.",
    "url": siteUrl,
    "applicationCategory": "EntertainmentApplication",
    "operatingSystem": "Any",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "author": {
      "@type": "Person",
      "name": "Evren Aktaş",
      "url": "https://github.com/aktasevren",
      "sameAs": [
        "https://www.linkedin.com/in/evren-aktas/",
        "https://github.com/aktasevren"
      ]
    },
    "publisher": {
      "@type": "Organization",
      "name": "Where Was Filmed",
      "logo": {
        "@type": "ImageObject",
        "url": `${siteUrl}/assets/film.png`
      }
    },
    "featureList": [
      "Find movie filming locations",
      "Interactive map with markers",
      "Search movies by title",
      "Search movies and series",
      "Detailed location information"
    ]
  };

  return (
    <html lang="en" className="dark">
      <head>
        {/* Preload critical fonts */}
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Lato:wght@400;700&family=Montserrat:wght@700&display=swap"
          as="style"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <StoreProvider>
          {children}
        </StoreProvider>
      </body>
    </html>
  );
}
