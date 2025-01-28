<svelte:options accessors />

<script lang="ts">
	import { createEventDispatcher, onDestroy, onMount } from 'svelte'
	import Icon from './Icon.svelte'

	export let id: string | null = null
	export let variant: string = 'primary'
	export let size: string = 'small'
	export let style: string | null = null
	export let href: string | null = null
	export let target: string | null = null
	export let disabled: boolean = false
	export let loading: boolean = false
	export let active = false

	export function setLoading(boolean: boolean) {
		loading = boolean
	}

	// Setting ID when button mounts won't work because it will always set a new ID. Using nanodID will only work if the ID is set when the application mounts

	onMount(() => {})

	const dispatch = createEventDispatcher()

	// async function handleClick(event: any) {
	// 	dispatch('click')
	// }
</script>

{#if href}
	<a {id} {href} class="Button" {style} data-variant={variant} data-size={size} {target}>
		{#if loading}
			<Icon svg="spinner" />
		{:else}
			<span class="label"><slot /></span>
		{/if}
	</a>
{:else}
	<button
		on:click
		on:mouseover
		on:mouseenter
		on:mouseleave
		on:focus
		{id}
		class="Button"
		{style}
		data-variant={variant}
		data-size={size}
		{disabled}
		data-loading={loading}
		data-active={active ? 'true' : undefined}
	>
		{#if loading}
			<!-- {#if size === 'mini'}
				<Icon svg="spinner" size={20} />
			{:else}
				<Icon svg="spinner" size={24} />
			{/if} -->
		{:else}
			<span class="label"><slot /></span>
		{/if}
	</button>
{/if}

<style>
	.Button {
		flex-grow: 0;
		position: relative;
		width: 24px;
		height: 24px;
		border-radius: 4px;
		border: none;
		padding: 0;
		background-color: transparent;
		color: inherit;
	}

	.Button::after {
		display: block;
		content: '';
		width: 100%;
		height: 100%;
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 1;
		border-radius: 4px;
	}

	.Button:hover::after {
		background-color: var(--figma-color-bg-inverse);
		opacity: 0.08;
	}

	.Button[data-active]::after {
		background-color: var(--figma-color-bg-inverse);
		opacity: 0.08;
	}

	[data-active] {
		fill: var(--figma-color-icon-brand) !important;
		color: var(--figma-color-icon-brand) !important;
	}
</style>
