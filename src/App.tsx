import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import JsonEditor from './pages/JsonEditor';
import JsonCompare from './pages/JsonCompare';
import { ThemeProvider } from './context/ThemeContext';
import { FontSizeProvider } from './context/FontSizeContext';
import { JsonDataProvider } from './context/JsonDataContext';
import { JsonDiffProvider } from './context/JsonDiffContext';
import './App.css';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <FontSizeProvider>
        <JsonDataProvider>
          <JsonDiffProvider>
            <Router>
              <div className="min-h-screen bg-gray-50 flex flex-col">
                <Header />
                <main className="flex-grow p-4">
                  <Routes>
                    <Route path="/" element={<JsonEditor />} />
                    <Route path="/editor" element={<JsonEditor />} />
                    <Route path="/compare" element={<JsonCompare />} />
                    <Route path="*" element={<div>404 Not Found</div>} />
                  </Routes>
                </main>
              </div>
            </Router>
          </JsonDiffProvider>
        </JsonDataProvider>
      </FontSizeProvider>
    </ThemeProvider>
  );
};

export default App;
