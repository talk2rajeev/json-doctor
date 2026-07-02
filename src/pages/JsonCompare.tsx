import React, { useRef, useEffect } from 'react';
import { DiffEditor, type DiffOnMount } from '@monaco-editor/react';
import { Copy, ArrowLeftRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useFontSize } from '../context/FontSizeContext';
import { useJsonDiff } from '../context/JsonDiffContext';
import Button from '../components/Button';
import ChatInterface from '../components/ChatInterface';

const JsonCompare: React.FC = () => {
  const diffEditorRef = useRef<any>(null);
  const { theme } = useTheme();
  const { fontSize } = useFontSize();
  const { originalJson, modifiedJson, setOriginalJson, setModifiedJson, swapJson } = useJsonDiff();

  const handleDiffEditorDidMount: DiffOnMount = (editor) => {
    diffEditorRef.current = editor;

    const originalEditor = editor.getOriginalEditor();
    const modifiedEditor = editor.getModifiedEditor();

    // Sync to context only when editor loses focus (to avoid cursor jumping)
    originalEditor.onDidBlurEditorText(() => {
      const model = originalEditor.getModel();
      if (model) {
        setOriginalJson(model.getValue());
      }
    });

    modifiedEditor.onDidBlurEditorText(() => {
      const model = modifiedEditor.getModel();
      if (model) {
        setModifiedJson(model.getValue());
      }
    });
  };

  // Sync to context when component unmounts
  useEffect(() => {
    return () => {
      if (diffEditorRef.current) {
        const originalEditor = diffEditorRef.current.getOriginalEditor();
        const modifiedEditor = diffEditorRef.current.getModifiedEditor();
        
        const originalModel = originalEditor?.getModel();
        const modifiedModel = modifiedEditor?.getModel();
        
        if (originalModel) {
          setOriginalJson(originalModel.getValue());
        }
        if (modifiedModel) {
          setModifiedJson(modifiedModel.getValue());
        }
      }
    };
  }, [setOriginalJson, setModifiedJson]);

  const handleSwap = () => {
    // Get current values from editor before swapping
    if (diffEditorRef.current) {
      const originalEditor = diffEditorRef.current.getOriginalEditor();
      const modifiedEditor = diffEditorRef.current.getModifiedEditor();
      
      const originalValue = originalEditor.getValue();
      const modifiedValue = modifiedEditor.getValue();
      
      // Swap the values in the editors directly
      originalEditor.setValue(modifiedValue);
      modifiedEditor.setValue(originalValue);
      
      // Update context
      swapJson();
    }
  };

  const handleFormatOriginal = () => {
    if (diffEditorRef.current) {
      const originalEditor = diffEditorRef.current.getOriginalEditor();
      originalEditor.getAction('editor.action.formatDocument').run();
    }
  };

  const handleFormatModified = () => {
    if (diffEditorRef.current) {
      const modifiedEditor = diffEditorRef.current.getModifiedEditor();
      modifiedEditor.getAction('editor.action.formatDocument').run();
    }
  };

  const handleCopyOriginal = async () => {
    if (diffEditorRef.current) {
      const originalEditor = diffEditorRef.current.getOriginalEditor();
      const value = originalEditor.getValue();
      try {
        await navigator.clipboard.writeText(value);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const handleCopyModified = async () => {
    if (diffEditorRef.current) {
      const modifiedEditor = diffEditorRef.current.getModifiedEditor();
      const value = modifiedEditor.getValue();
      try {
        await navigator.clipboard.writeText(value);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  return (
    <div className="h-[calc(100vh-100px)] w-full flex flex-col">
      <div className="grid grid-cols-3 items-center mb-4">
        {/* Left: Format and Copy buttons for original */}
        <div className="flex justify-start space-x-2">
          <Button label="Format" onClick={handleFormatOriginal} variant="blue" />
          <Button 
            label={
              <div className="flex items-center space-x-2">
                <Copy size={16} />
                <span>Copy</span>
              </div>
            }
            onClick={handleCopyOriginal}
            variant="gray"
          />
        </div>

        {/* Center: Swap button */}
        <div className="flex justify-center">
          <Button 
            label={
              <div className="flex items-center space-x-2">
                <ArrowLeftRight size={16} />
                <span>Swap</span>
              </div>
            }
            onClick={handleSwap}
            variant="purple"
            title="Swap Original and Modified"
          />
        </div>

        {/* Right: Format and Copy buttons for modified */}
        <div className="flex justify-end space-x-2">
          <Button 
            label={
              <div className="flex items-center space-x-2">
                <span>Format</span>
              </div>
            }
            onClick={handleFormatModified}
            variant="blue" 
          />
          <Button 
            label={
              <div className="flex items-center space-x-2">
                <Copy size={16} />
                <span>Copy</span>
              </div>
            }
            onClick={handleCopyModified}
            variant="gray"
          />
          
        </div>
      </div>

      <div className="flex-grow w-full">
        <DiffEditor
          height="100%"
          width="100%"
          language="json"
          originalLanguage="json"
          modifiedLanguage="json"
          original={originalJson}
          modified={modifiedJson}
          theme={theme}
          onMount={handleDiffEditorDidMount}
          options={{
            minimap: { enabled: false },
            fontSize: fontSize,
            readOnly: false,
            renderSideBySide: true,
            originalEditable: true,
            enableSplitViewResizing: true,
          }}
        />
      </div>
      {new URLSearchParams(window.location.search).get('enableAiChat') === '1' && (
        <ChatInterface source="compare" />
      )}
    </div>
  );
};

export default JsonCompare;
