import React from 'react';
import './Input.css'; // Import the styles

interface InputProps {
  value?: string;
  type?: string;
  showIcon?: boolean;
  onChange?: (value: string) => void;
}

const Input: React.FC<InputProps> = ({ value = '', type = 'text', showIcon = false, onChange }) => {
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(event.target.value);
    }
  };

  return (
    <div className="Input" data-non-interactive="true">
      <div className="displayContents">
        <label
          data-tooltip-type="text"
          data-tooltip="X-position"
          aria-label="X-position"
          data-onboarding-key="scrubbable-control-x-position"
          data-temporary-fpl-no-drag=""
        >
          {showIcon && (
            <span className="icon">
              <i18n-text>X</i18n-text>
            </span>
          )}
          <input
            type={type}
            value={value}
            onChange={handleInputChange}
            spellCheck={false}
            dir="auto"
          />
        </label>
      </div>
    </div>
  );
};

export default Input;
