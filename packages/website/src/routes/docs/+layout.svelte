<script lang="ts">
	import Icon from '@/components/Icon.svelte';
	import Section from '@/components/Section.svelte';

	export let data;
</script>

<div>
	<Section class="border-t-0 py-8 md:py-8">
		<div class="max-w-4xl mx-auto md:flex">
			<div class="w-64 mb-6">
				<nav>
					<ul>
						{#each data.navItems as { slug, title }}
							<li><a href={`/docs/${slug}`} class="hover:underline">{title}</a></li>
						{/each}
					</ul>
				</nav>
			</div>

			<div class="grow">
				<slot />
				<!-- Slot to include page-specific content -->
			</div>
		</div>
	</Section>

	<!-- {#each $notifications as notification}
		<Notification id={notification.id} timeout={notification.timeout} type={notification.type}>
			<slot slot="message">{@html notification.message}</slot>
		</Notification>
	{/each} -->
</div>
