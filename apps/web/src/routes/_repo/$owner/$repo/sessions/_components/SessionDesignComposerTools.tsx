"use client";

import type { Id } from "@eva/backend";
import { PersonaDropdown } from "./PersonaSelector";
import { NumDesignsControl } from "./NumDesignsControl";

interface SessionDesignComposerToolsProps {
  repoId: Id<"githubRepos">;
  personaId: Id<"designPersonas"> | undefined;
  onPersonaChange: (personaId: Id<"designPersonas"> | undefined) => void;
  numDesigns: number;
  onNumDesignsChange: (count: number) => void;
  disabled?: boolean;
}

/** Persona + variation-count controls shown when composer mode is Design. */
export function SessionDesignComposerTools({
  repoId,
  personaId,
  onPersonaChange,
  numDesigns,
  onNumDesignsChange,
  disabled = false,
}: SessionDesignComposerToolsProps) {
  return (
    <>
      <PersonaDropdown
        repoId={repoId}
        value={personaId}
        onChange={onPersonaChange}
      />
      <NumDesignsControl
        value={numDesigns}
        onChange={onNumDesignsChange}
        disabled={disabled}
      />
    </>
  );
}
