import React from 'react';

const Button = ({ children, href, target, style, onClick }) => {
	const buttonStyle = {
		display: 'block',
		borderRadius: '5px',
		border: '1px solid var(--figma-color-border)',
		padding: '0 7px',
		lineHeight: '22px',
		textDecoration: 'none',
		color: 'var(--figma-color-text)',
		...style, // Merge with any passed styles
	};

	if (href) {
		return (
			<a href={href} target={target} style={buttonStyle} onClick={onClick}>
				{children}
			</a>
		);
	}

	return (
		<button style={buttonStyle} onClick={onClick}>
			{children}
		</button>
	);
};

export default Button;
