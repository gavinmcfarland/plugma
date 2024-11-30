import './Button.css' // Import the styles

const Button = ({ children, href, target, style, onClick }) => {
	if (href) {
		return (
			<a className="Button" href={href} target={target} style={style} onClick={onClick}>
				{children}
			</a>
		)
	}

	return (
		<button className="Button" style={style} onClick={onClick}>
			{children}
		</button>
	)
}

export default Button
