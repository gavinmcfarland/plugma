import { mount } from "plugma/lib/ui";
import html from "html-template-tag";
import "./style.css";

// function App() {
// 	return html`
// 	<div><p>Plugin!</p></div>
// 	`
// }

// mount(App)

document.querySelector("#app").innerHTML = html`
	<div>Hello world</div> 
`;
