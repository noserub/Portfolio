import { useCallback, useRef, useState } from "react";
import { useHomePageContent } from "./useHomePageContent";

/** Edit-mode home CMS state (single `useHomePageContent` instance per Modern home page). */
export function useModernHomeHeroEditor() {
  const [heroEditorOpen, setHeroEditorOpen] = useState(false);
  const [isEditingHero, setIsEditingHero] = useState(false);
  const [bioEditorRevision, setBioEditorRevision] = useState(0);

  const isEditingHeroRef = useRef(isEditingHero);
  isEditingHeroRef.current = isEditingHero;

  const [greetingsTextValue, setGreetingsTextValue] = useState("");
  const greetingsTextValueRef = useRef(greetingsTextValue);
  greetingsTextValueRef.current = greetingsTextValue;

  const bumpBioEditorRevision = useCallback(() => setBioEditorRevision((n) => n + 1), []);

  const cms = useHomePageContent({
    bumpBioEditorRevision,
    isEditingHeroRef,
    greetingsTextValueRef,
    setIsEditingHero,
    isEditingHero,
    greetingsTextValue,
  });

  const openHeroEditor = useCallback(() => {
    setIsEditingHero(true);
    setHeroEditorOpen(true);
  }, []);

  const closeHeroEditor = useCallback(() => {
    setIsEditingHero(false);
    setHeroEditorOpen(false);
  }, []);

  return {
    heroEditorOpen,
    openHeroEditor,
    closeHeroEditor,
    bioEditorRevision,
    bumpBioEditorRevision,
    cms,
  };
}
