// apps/frontend/src/context/EditorContext.tsx
"use client";

import { createContext, useContext, useState, ReactNode } from 'react';

interface EditorContextType {
  usedPlayerIds: string[];
  setUsedPlayerIds: (ids: string[]) => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export function EditorProvider({ children }: { children: ReactNode }) {
  const [usedPlayerIds, setUsedPlayerIds] = useState<string[]>([]);

  return (
    <EditorContext.Provider value={{ usedPlayerIds, setUsedPlayerIds }}>
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  const context = useContext(EditorContext);
  if (!context) throw new Error("useEditor debe usarse dentro de EditorProvider");
  return context;
}