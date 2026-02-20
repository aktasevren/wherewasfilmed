import type { Metadata } from "next";
import "@fontsource/material-symbols-outlined/400.css";
import "./globals.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "alertifyjs/build/css/alertify.css";
import "leaflet/dist/leaflet.css";
import StoreProvider from "@/lib/redux/StoreProvider";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://wherewasfilmed.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Where Was It Filmed - Movie Filming Locations on Map",
    template: "%s | Where Was It Filmed"
  },
  description: "Discover where your favorite movies were filmed. Find every filming location on an interactive map — search by title and explore where it was shot.",
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
    siteName: "Where Was It Filmed",
    title: "Where Was It Filmed - Movie Filming Locations on Map",
    description: "Discover where your favorite movies were filmed. Find every filming location on an interactive map.",
    images: [
      {
        url: "/assets/film.png",
        width: 1200,
        height: 630,
        alt: "Where Was It Filmed - Movie Filming Locations",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Where Was It Filmed - Movie Filming Locations on Map",
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
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Where Was It Filmed",
    "url": siteUrl,
    "logo": { "@type": "ImageObject", "url": `${siteUrl}/assets/film.png` },
    "sameAs": ["https://github.com/aktasevren"],
  };
  const webApp = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Where Was It Filmed",
    "description": "Discover where your favorite movies were filmed! Find exact filming locations on an interactive map.",
    "url": siteUrl,
    "applicationCategory": "EntertainmentApplication",
    "operatingSystem": "Any",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
    "author": { "@type": "Person", "name": "Evren Aktaş", "url": "https://github.com/aktasevren" },
    "publisher": { "@type": "Organization", "name": "Where Was It Filmed", "logo": { "@type": "ImageObject", "url": `${siteUrl}/assets/film.png` } },
    "featureList": ["Find movie filming locations", "Interactive map with markers", "Search movies by title", "Detailed location information"],
  };
  const webSite = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Where Was It Filmed",
    "url": siteUrl,
    "description": "Discover where your favorite movies and TV shows were filmed. Interactive map of filming locations.",
    "publisher": { "@type": "Organization", "name": "Where Was It Filmed", "logo": { "@type": "ImageObject", "url": `${siteUrl}/assets/film.png` } },
    "potentialAction": {
      "@type": "SearchAction",
      "target": { "@type": "EntryPoint", "urlTemplate": `${siteUrl}/search?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
  const sanitizeJsonLd = (obj: object) =>
    JSON.stringify(obj).replace(/</g, "\\u003c").replace(/>/g, "\\u003e");

  return (
    <html lang="en" className="dark" data-scroll-behavior="smooth">
      <head>
        <meta name="theme-color" content="#0a0a0f" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: sanitizeJsonLd(organization) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: sanitizeJsonLd(webApp) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: sanitizeJsonLd(webSite) }} />
      </head>
      <body>
        <StoreProvider>
          {children}
        </StoreProvider>
      </body>
    </html>
  );
}
