import React, { useRef, useState } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import { Copy } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useFontSize } from '../context/FontSizeContext';
import { useJsonData } from '../context/JsonDataContext';
import Button from '../components/Button';
import ChatInterface from '../components/ChatInterface';

interface JsonError {
  message: string;
  line?: number;
}

const JsonEditor: React.FC = () => {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const { theme } = useTheme();
  const { fontSize } = useFontSize();
  const { jsonContent, setJsonContent } = useJsonData();
  const [jsonError, setJsonError] = useState<JsonError | null>(null);

  const validateJSON = (value: string) => {
    if (!value.trim()) {
      setJsonError(null);
      clearMarkers();
      return;
    }

    try {
      JSON.parse(value);
      setJsonError(null);
      clearMarkers();
    } catch (e: any) {
      const errorMessage = e.message;
      
      // Extract position from error message - JSON.parse errors often include position
      let line = 1;
      
      // Try to find position in the error message (e.g., "at position 123")
      const posMatch = errorMessage.match(/position (\d+)/i);
      if (posMatch) {
        const position = parseInt(posMatch[1], 10);
        // Count newlines up to this position to get line number
        const textUpToError = value.substring(0, position);
        line = (textUpToError.match(/\n/g) || []).length + 1;
      } else if (editorRef.current && monacoRef.current) {
        // Fallback: try to parse again and use Monaco to find the error
        // Parse character by character to find exact error position
        for (let i = 0; i < value.length; i++) {
          try {
            JSON.parse(value.substring(0, i + 1));
          } catch {
            const textUpToError = value.substring(0, i);
            line = (textUpToError.match(/\n/g) || []).length + 1;
            break;
          }
        }
      }

      setJsonError({ message: errorMessage, line });
      highlightErrorLine(line);
    }
  };

  const clearMarkers = () => {
    if (editorRef.current && monacoRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        monacoRef.current.editor.setModelMarkers(model, 'json', []);
      }
    }
  };

  const highlightErrorLine = (line: number) => {
    if (editorRef.current && monacoRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        monacoRef.current.editor.setModelMarkers(model, 'json', [
          {
            startLineNumber: line,
            startColumn: 1,
            endLineNumber: line,
            endColumn: model.getLineMaxColumn(line),
            message: 'JSON syntax error',
            severity: monacoRef.current.MarkerSeverity.Error,
          },
        ]);
      }
    }
  };

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    
    // Validate on mount
    validateJSON(editor.getValue());

    // Validate and sync on content change
    editor.onDidChangeModelContent(() => {
      const value = editor.getValue();
      validateJSON(value);
      setJsonContent(value);
    });
  };

  const handleClear = () => {
    if (editorRef.current) {
      editorRef.current.setValue('');
    }
  };

  const handleFormat = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument').run();
    }
  };

  const handleMinify = () => {
    if (editorRef.current) {
      try {
        const value = editorRef.current.getValue();
        const minified = JSON.stringify(JSON.parse(value));
        editorRef.current.setValue(minified);
      } catch (e) {
        console.error("Invalid JSON", e);
      }
    }
  };

  const handleCopy = async () => {
    if (editorRef.current) {
      const value = editorRef.current.getValue();
      try {
        await navigator.clipboard.writeText(value);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  return (
    <div className="h-[calc(100vh-100px)] w-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div className="space-x-2">
          <Button label="Clear" onClick={handleClear} variant="red" />
          <Button label="Format" onClick={handleFormat} variant="blue" />
          <Button label="Minify" onClick={handleMinify} variant="green" />
          <Button 
            label={
              <div className="flex items-center space-x-2">
                <Copy size={16} />
                <span>Copy</span>
              </div>
            }
            onClick={handleCopy}
            variant="gray"
          />
        </div>
      </div>
      
      {jsonError && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative flex items-start justify-between">
          <div>
            <strong className="font-bold">JSON Error{jsonError.line ? ` at line ${jsonError.line}` : ''}: </strong>
            <span className="block sm:inline">{jsonError.message}</span>
          </div>
          <button
            onClick={() => setJsonError(null)}
            className="ml-4 text-red-700 hover:text-red-900"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      <div className="flex-grow w-full">
        <Editor
          height="100%"
          width="100%"
          defaultLanguage="json"
          value={jsonContent}
          theme={theme}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            fontSize: fontSize,
          }}
        />
      </div>
      {new URLSearchParams(window.location.search).get('enableAiChat') === '1' && (
        <ChatInterface source="editor" />
      )}
    </div>
  );
};

export default JsonEditor;
