import React, { type ReactNode, type ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: ReactNode;
  variant?: 'blue' | 'red' | 'green' | 'gray' | 'purple';
}

const Button: React.FC<ButtonProps> = ({ label, variant = 'blue', className = '', ...props }) => {
  const variantClasses = {
    blue: 'bg-blue-500 hover:bg-blue-600',
    red: 'bg-red-500 hover:bg-red-600',
    green: 'bg-green-500 hover:bg-green-600',
    gray: 'bg-gray-500 hover:bg-gray-600',
    purple: 'bg-purple-500 hover:bg-purple-600',
  };

  return (
    <button
      className={`px-4 py-2 text-white rounded transition-colors text-xs ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {label}
    </button>
  );
};

export default Button;
