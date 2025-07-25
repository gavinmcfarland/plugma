import React from 'react';

const Input = ({ value = '', type = 'text', showIcon = false, onChange, style }) => {
	const containerStyle = {
		...style,
	};

	const displayContentsStyle = {
		display: 'contents',
	};

	const labelStyle = {
		margin: '1px 0',
		display: 'flex',
		backgroundColor: 'var(--figma-color-bg-secondary)',
		border: '1px solid transparent',
		height: 'var(--spacer-4)',
		borderRadius: 'var(--radius-medium)',
		alignItems: 'center',
		gap: '4px',
		width: '100%',
	};

	const iconStyle = {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		height: 'var(--spacer-4)',
		width: 'var(--spacer-4)',
		flex: '0 0 var(--spacer-4)',
		lineHeight: 'var(--spacer-4)',
		stroke: 'unset',
		color: 'var(--figma-color-icon-secondary)',
		marginLeft: '-1px',
		verticalAlign: 'top',
		textTransform: 'none',
		MozOsxFontSmoothing: 'grayscale',
		WebkitFontSmoothing: 'antialiased',
		textAlign: 'center',
		pointerEvents: 'none',
		letterSpacing: 'inherit',
		textDecoration: 'none',
		fontWeight: '400',
		marginRight: '-8px',
	};

	const inputStyle = {
		height: 'var(--spacer-4)',
		display: 'flex',
		margin: '0',
		padding: '0 7px',
		border: '1px solid transparent',
		borderLeft: '0',
		borderRight: '0',
		backgroundClip: 'padding-box',
		marginLeft: '0',
		width: '100%',
		outline: 'none',
		backgroundColor: 'transparent',
		color: 'inherit',
		fontSize: 'inherit',
		fontFamily: 'inherit',
		minWidth: '0',
	};

	const handleInputChange = (event) => {
		if (onChange) {
			onChange(event.target.value);
		}
	};

	return (
		<>
			<style>
				{`
          input[type="number"]::-webkit-inner-spin-button,
          input[type="number"]::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }

          input[type="number"] {
            -moz-appearance: textfield;
          }
        `}
			</style>
			<div style={containerStyle} data-non-interactive="true">
				<div style={displayContentsStyle}>
					<label
						data-tooltip-type="text"
						data-tooltip="X-position"
						aria-label="X-position"
						data-onboarding-key="scrubbable-control-x-position"
						data-temporary-fpl-no-drag=""
						style={labelStyle}
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
		</>
	);
};

export default Input;
