import React from 'react';
import './Button.css'; // Import the styles

interface ButtonProps {
  children: React.ReactNode;
  href?: string;
  target?: string;
  style?: React.CSSProperties;
  onClick?: React.MouseEventHandler<HTMLAnchorElement | HTMLButtonElement>;
}

const Button: React.FC<ButtonProps> = ({ children, href, target, style, onClick }) => {
  if (href) {
    return (
      <a
        className="Button"
        href={href}
        target={target}
        style={style}
        onClick={onClick}
      >
        {children}
      </a>
    );
  }

  return (
    <button className="Button" style={style} onClick={onClick}>
      {children}
    </button>
  );
};

export default Button;
