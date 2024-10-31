import html from "html-template-tag";
import javascriptLogo from './assets/javascript.svg'
import { Icon } from "./components/Icon";

export default (function App() {
	return html`
	<div class="container">
		<div class="banner">
			$${Icon({ svg: "plugma", size: 38 })}
			$${Icon({ svg: "plus", size: 24 })}
			<img src="${javascriptLogo}" width="40" height="40" alt="JavaScript Logo" />
		</div>
		<a href="https://plugma.dev/docs" target="_blank" class="button">Read the docs</a>
	</div>
	`
})()
