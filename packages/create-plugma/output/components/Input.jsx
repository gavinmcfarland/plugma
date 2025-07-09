import React from 'react';

const Input = ({ value = '', type = 'text', showIcon = false, onChange }) => {
	const containerStyle = {
		display: 'flex',
		alignItems: 'center',
		gap: '4px',
		padding: '4px 8px',
		border: '1px solid var(--figma-color-border)',
		borderRadius: '4px',
		backgroundColor: 'var(--figma-color-bg)',
		color: 'var(--figma-color-text)',
		fontSize: '12px',
		fontFamily: 'Inter, sans-serif',
	};

	const inputStyle = {
		border: 'none',
		outline: 'none',
		backgroundColor: 'transparent',
		color: 'inherit',
		fontSize: 'inherit',
		fontFamily: 'inherit',
		width: '100%',
		minWidth: '0',
	};

	const iconStyle = {
		color: 'var(--figma-color-text-secondary)',
		fontSize: '10px',
		fontWeight: 'bold',
	};

	const handleInputChange = (event) => {
		if (onChange) {
			onChange(event.target.value);
		}
	};

	return (
		<div style={containerStyle} data-non-interactive="true">
			<div style={{ display: 'contents' }}>
				<label
					data-tooltip-type="text"
					data-tooltip="X-position"
					aria-label="X-position"
					data-onboarding-key="scrubbable-control-x-position"
					data-temporary-fpl-no-drag=""
					style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '100%' }}
				>
					{showIcon && <span style={iconStyle}>X</span>}
					<input
						type={type}
						value={value}
						onChange={handleInputChange}
						spellCheck={false}
						dir="auto"
						style={inputStyle}
					/>
				</label>
			</div>
		</div>
	);
};

export default Input;
