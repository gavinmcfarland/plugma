<script>
	import Header from './Header.svelte'
	import '../styles/app.css'
	import Box from '../components/Box.svelte'
</script>

<div class="app">
	<!-- <Header /> -->

	<main>
		<slot />
	</main>

	<!-- <div class="fullwidth">
		<Box
			padding="var(--size-em-8) var(--rem-0) var(--rem-0)"
			display="flex"
			justifyContent="space-between">
			<Box><small>Copyright 2024 © Gavin McFarland</small></Box>
			<Box>
				<small class="Header_Link"
					><a href="https://twitter.com/gavinmcfarland">@gavinmcfarland</a></small>
			</Box>
		</Box>
	</div> -->
</div>

<style>
	@import 'https://unpkg.com/open-props/src/media.min.css';
	/* @import '../styles/props.media.css'; */
</style>
