import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

const DEFAULT_ORIGINAL_JSON = {
  "name": "John Doe",
  "age": 30,
  "city": "New York"
};

const DEFAULT_MODIFIED_JSON = {
  "name": "John Doe",
  "age": 31,
  "city": "San Francisco",
  "country": "USA"
};

const ORIGINAL_STORAGE_KEY = 'json-diff-original';
const MODIFIED_STORAGE_KEY = 'json-diff-modified';

interface JsonDiffContextType {
  originalJson: string;
  modifiedJson: string;
  setOriginalJson: (content: string) => void;
  setModifiedJson: (content: string) => void;
  swapJson: () => void;
  resetToDefaults: () => void;
}

const JsonDiffContext = createContext<JsonDiffContextType | undefined>(undefined);

export const JsonDiffProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [originalJson, setOriginalJsonState] = useState<string>(() => {
    const stored = sessionStorage.getItem(ORIGINAL_STORAGE_KEY);
    return stored !== null ? stored : JSON.stringify(DEFAULT_ORIGINAL_JSON, null, 2);
  });

  const [modifiedJson, setModifiedJsonState] = useState<string>(() => {
    const stored = sessionStorage.getItem(MODIFIED_STORAGE_KEY);
    return stored !== null ? stored : JSON.stringify(DEFAULT_MODIFIED_JSON, null, 2);
  });

  // Sync to sessionStorage
  useEffect(() => {
    sessionStorage.setItem(ORIGINAL_STORAGE_KEY, originalJson);
  }, [originalJson]);

  useEffect(() => {
    sessionStorage.setItem(MODIFIED_STORAGE_KEY, modifiedJson);
  }, [modifiedJson]);

  const setOriginalJson = (content: string) => {
    setOriginalJsonState(content);
  };

  const setModifiedJson = (content: string) => {
    setModifiedJsonState(content);
  };

  const swapJson = () => {
    // Swap both values atomically using functional updates
    const tempOriginal = originalJson;
    const tempModified = modifiedJson;
    setOriginalJsonState(tempModified);
    setModifiedJsonState(tempOriginal);
  };

  const resetToDefaults = () => {
    setOriginalJsonState(JSON.stringify(DEFAULT_ORIGINAL_JSON, null, 2));
    setModifiedJsonState(JSON.stringify(DEFAULT_MODIFIED_JSON, null, 2));
  };

  return (
    <JsonDiffContext.Provider value={{ originalJson, modifiedJson, setOriginalJson, setModifiedJson, swapJson, resetToDefaults }}>
      {children}
    </JsonDiffContext.Provider>
  );
};

export const useJsonDiff = () => {
  const context = useContext(JsonDiffContext);
  if (context === undefined) {
    throw new Error('useJsonDiff must be used within a JsonDiffProvider');
  }
  return context;
};
