import React from 'react';
import { NavLink } from 'react-router-dom';
import viteLogo from '/logo.png';
import { useTheme, themeOptions } from '../context/ThemeContext';
import { useFontSize, fontSizeOptions } from '../context/FontSizeContext';

const Header: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { fontSize, setFontSize } = useFontSize();

  return (
    <header className="grid grid-cols-3 items-center px-4 py-3 bg-gray-800 text-white shadow-md">
      {/* Left: Logo */}
      <div className="flex items-center">
        <img src={viteLogo} className="w-24 mr-2" alt="Vite logo" />
      </div>
      
      {/* Center: Theme and Font Size Dropdowns */}
      <div className="flex items-center justify-center space-x-4">
        <div className="flex items-center space-x-2">
          <label htmlFor="theme-select" className="text-sm">Editor Theme:</label>
          <select
            id="theme-select"
            value={theme}
            onChange={(e) => setTheme(e.target.value as any)}
            className="px-3 py-1 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {themeOptions.map((themeOption) => (
              <option key={themeOption} value={themeOption}>
                {themeOption}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center space-x-2">
          <label htmlFor="font-size-select" className="text-sm">Editor Font:</label>
          <select
            id="font-size-select"
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="px-3 py-1 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {fontSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}px
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right: Navigation Links */}
      <nav className="flex justify-end">
        <ul className="flex space-x-4">
          <li>
            <NavLink 
              to="/editor" 
              className={({ isActive }) => 
                `hover:text-blue-400 transition-colors ${isActive ? 'text-blue-400 border-b-2 border-blue-400' : ''}`
              }
            >
              Json Editor
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/compare" 
              className={({ isActive }) => 
                `hover:text-blue-400 transition-colors ${isActive ? 'text-blue-400 border-b-2 border-blue-400' : ''}`
              }
            >
              Compare Json
            </NavLink>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
