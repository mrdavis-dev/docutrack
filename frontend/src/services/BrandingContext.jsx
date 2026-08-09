import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getSettings, getLogoUrl } from "./api";
import { applyBrandColor } from "./branding";

const DEFAULT_TITLE = "Docutrack";
const DEFAULT_SUBTITLE = "Trámites vehiculares rápidos y seguros";

const BrandingContext = createContext({
  logoUrl: null,
  title: DEFAULT_TITLE,
  subtitle: DEFAULT_SUBTITLE,
  refresh: () => {},
});

export function BrandingProvider({ children }) {
  const [logoUrl, setLogoUrl] = useState(null);
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [subtitle, setSubtitle] = useState(DEFAULT_SUBTITLE);

  const refresh = useCallback(async () => {
    try {
      const { data } = await getSettings();
      if (data.brand_color) applyBrandColor(data.brand_color);
      // cache-bust so a just-replaced logo shows immediately instead of the old cached image
      setLogoUrl(data.logo_url ? `${getLogoUrl()}?v=${Date.now()}` : null);
      setTitle(data.portal_title || DEFAULT_TITLE);
      setSubtitle(data.portal_subtitle || DEFAULT_SUBTITLE);
    } catch {
      /* keep the defaults if settings can't be reached */
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <BrandingContext.Provider value={{ logoUrl, title, subtitle, refresh }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  return useContext(BrandingContext);
}
