import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

const DEFAULT_JSON = {};

const STORAGE_KEY = 'json-editor-content';

interface JsonDataContextType {
  jsonContent: string;
  setJsonContent: (content: string) => void;
  resetToDefault: () => void;
}

const JsonDataContext = createContext<JsonDataContextType | undefined>(undefined);

export const JsonDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [jsonContent, setJsonContentState] = useState<string>(() => {
    // Initialize from sessionStorage or use default
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored !== null ? stored : JSON.stringify(DEFAULT_JSON, null, 2);
  });

  // Sync to sessionStorage whenever content changes
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, jsonContent);
  }, [jsonContent]);

  const setJsonContent = (content: string) => {
    setJsonContentState(content);
  };

  const resetToDefault = () => {
    const defaultContent = JSON.stringify(DEFAULT_JSON, null, 2);
    setJsonContentState(defaultContent);
  };

  return (
    <JsonDataContext.Provider value={{ jsonContent, setJsonContent, resetToDefault }}>
      {children}
    </JsonDataContext.Provider>
  );
};

export const useJsonData = () => {
  const context = useContext(JsonDataContext);
  if (context === undefined) {
    throw new Error('useJsonData must be used within a JsonDataProvider');
  }
  return context;
};
