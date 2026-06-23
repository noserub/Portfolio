import { useCallback, useEffect, useReducer, useState } from "react";
import {
  DEFAULT_CONTACT_PAGE,
  fetchContactPageData,
  type ContactPageData,
} from "../lib/contactPageContent";

type ContactPageState = {
  data: ContactPageData;
  /** True only after the first fetch resolves — data and ready flip in one reducer pass. */
  tilesReady: boolean;
};

type ContactPageAction = { type: "success"; data: ContactPageData };

function contactPageReducer(state: ContactPageState, action: ContactPageAction): ContactPageState {
  return { data: action.data, tilesReady: true };
}

export function useContactPageData() {
  const [state, dispatch] = useReducer(contactPageReducer, {
    data: DEFAULT_CONTACT_PAGE,
    tilesReady: false,
  });
  const [reloadToken, setReloadToken] = useState(0);
  const reload = useCallback(() => setReloadToken((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;

    void fetchContactPageData().then((resolved) => {
      if (!cancelled) dispatch({ type: "success", data: resolved });
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

  return { hydrated: state.tilesReady, data: state.data, reload };
}
