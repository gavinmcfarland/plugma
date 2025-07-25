import html from 'html-template-tag';

/**
 * @param {Object} props
 * @param {string} [props.value]
 * @param {string} [props.type]
 * @param {boolean} [props.showIcon]
 * @param {(value: string) => void} [props.onInput]
 */
export function InputField({ value = '', type = 'text', showIcon = false, onInput } = {}) {
	const id = `input-${Math.random().toString(36).slice(2)}`;

	setTimeout(() => {
		const input = document.getElementById(id);
		if (input) {
			input.value = value;
			input.addEventListener('input', (e) => {
				onInput?.(e.target.value);
			});
		}
	}, 0);

	return html`
		<div class="Input" data-non-interactive="true">
			<div class="displayContents">
				<label
					data-tooltip-type="text"
					data-tooltip="X-position"
					aria-label="X-position"
					data-onboarding-key="scrubbable-control-x-position"
					data-temporary-fpl-no-drag=""
				>
					${showIcon ? html`<span class="icon"><span>X</span></span>` : ''}
					<input id="${id}" type="${type}" spellcheck="false" dir="auto" />
				</label>
			</div>
		</div>
	`;
}
