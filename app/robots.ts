import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://demiurgos.vercel.app";
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/chat", "/auth"] },
    sitemap: `${base}/sitemap.xml`,
  };
}
