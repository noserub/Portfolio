import { useCallback, useEffect, useState } from "react";
import { DEFAULT_CONTACT_PAGE, fetchContactPageData, type ContactPageData } from "../lib/contactPageContent";

export function useContactPageData() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ContactPageData>(DEFAULT_CONTACT_PAGE);
  const [reloadToken, setReloadToken] = useState(0);
  const reload = useCallback(() => setReloadToken((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchContactPageData()
      .then((resolved) => {
        if (!cancelled) setData(resolved);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  useEffect(() => {
    const onProfileUpdated = () => reload();
    window.addEventListener("portfolio-profile-updated", onProfileUpdated);
    return () => window.removeEventListener("portfolio-profile-updated", onProfileUpdated);
  }, [reload]);

  return { loading, data, reload };
}
