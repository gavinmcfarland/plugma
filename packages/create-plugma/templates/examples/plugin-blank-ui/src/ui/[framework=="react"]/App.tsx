import React from "react";
import reactLogo from "./assets/react.svg";
import Icon from "./components/Icon";

const App: React.FC = () => {
	const styles = {
		container: {
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
			height: "100%",
			width: "100%",
			flexDirection: "column" as const,
		},
		banner: {
			display: "flex",
			alignItems: "center",
			gap: "18px",
			marginBottom: "16px",
		},
		nodeCount: {
			fontSize: "11px",
		}
	};

	return (
		<div style={styles.container}>
			<div style={styles.banner}>
				<Icon svg="plugma" size={38} />
				<Icon svg="plus" size={24} />
				<img src={reactLogo} width="44" height="44" alt="Svelte logo" />
			</div>
		</div>
	);
};

export default App;
