<script context="module">
	// import Icon from './Icon.svelte'
	const bannerNotifications = {}

	export function getBannerNotification(id = '') {
		return bannerNotifications[id]
	}
</script>

<script lang="ts">
	import { onMount, onDestroy, afterUpdate, createEventDispatcher } from 'svelte'
	// import { IconButton, Button } from 'svelte-components'
	import { fly } from 'svelte/transition'

	const dispatch = createEventDispatcher()

	export let id = ''
	export let type = 'info'
	// export let show
	export let timeout: number | null = 5000

	let timeoutId: number | undefined

	let show = true

	function close() {
		const shouldContinue = dispatch('close')
		if (shouldContinue || !timeout) {
			show = false
		}

		clearTimeout(timeoutId)
	}

	function open() {
		show = true
	}

	onMount(() => {
		// open()
		dispatch('open', { height: banner.offsetHeight })

		if (timeout) {
			if (timeout > 0) {
				timeoutId = setTimeout(() => close(), timeout)
			}
		}

		return () => {
			clearTimeout(timeoutId)
		}
	})

	afterUpdate(() => {
		clearTimeout(timeoutId)
		if (timeout) {
			if (timeout > 0 && show) {
				timeoutId = setTimeout(() => close(), timeout)
			}
		}
	})

	onDestroy(() => {
		dispatch('close')
		delete bannerNotifications[id]
	})

	bannerNotifications[id] = { close }

	let banner
</script>

{#if show}
	<div bind:this={banner} {id} class="Notification rounded-sm" data-type={type}>
		{#if $$slots.message}
			<div class="content">
				<!-- {#if $$slots.icon}
				<slot name="icon" />
			{/if} -->
				<slot name="message" />
			</div>
		{/if}

		<div class="group">
			{#if $$slots.action}
				<slot name="action" />
			{/if}

			<!-- <IconButton
			on:click={() => {
				close()
			}}
		>
			<Icon icon="cross" />
		</IconButton> -->
		</div>
	</div>
{/if}

<style>
	.Notification {
		position: fixed;
		bottom: 16px;
		right: 16px;
		/* content */

		/* Auto layout */
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: 12px 16px;
		gap: 24px;

		/* width: 340px; */
		/* height: 40px; */

		/* Inside auto layout */
		flex: none;
		order: 0;
		align-self: stretch;
		flex-grow: 0;
		background-color: var(--color-bg-reverse);
		color: var(--color-text-reverse);
	}

	.Notification :global(a) {
		color: white;
		text-decoration: underline;
		text-underline-offset: 2px;
		text-decoration-skip-ink: none;
	}

	.group:empty {
		display: none;
	}

	[data-type='passive'] {
		background-color: var(--color-bg);
		color: var(--color-text);
		border: 2px solid var(--color-border);
	}
</style>
