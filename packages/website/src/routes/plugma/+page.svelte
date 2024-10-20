<script>
	import Card from '@/components/Card.svelte'
	import Icon from '@/components/Icon.svelte'
</script>

<div class="dark:bg-black dark:text-white border-gray-200 dark:border-gray-700">
	<!-- Navigation -->
	<nav
		class="p-4 flex justify-between items-center border-b sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur-lg"
	>
		<div class="flex items-center gap-3">
			<Icon svg="terminal-filled" size={20} strokeWidth={1.5} />
			<span>Plugma</span>
		</div>
		<div class="flex gap-6">
			<a href="/docs" class="hover:underline">Docs</a>
			<a href="https://github.com/yourusername/plugma" class="hover:underline" target="_blank">GitHub</a>
		</div>
	</nav>

	<div class="py-32">
		<div class="max-w-6xl mx-auto">
			<div class="text-center">
				<h1 class="text-5xl sm:text-7xl/snug text-center font-medium mb-6">
					Create Figma plugins <br />without the boilerplate
				</h1>
				<p class="mb-16">Supports React, Svelte, Vue, and JavaScript</p>
				<pre class="p-4 border w-fit mx-auto mb-6 rounded-md"><code>npm create plugma@latest</code></pre>
			</div>
		</div>
	</div>

	<div class="py-32 px-8 w-full justify-center items-center border-t">
		<h2 class="text-4xl sm:text-4xl text-center font-medium mb-8">Features</h2>

		<div class="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
			<Card>
				<Icon svg="bolt" size={48} strokeWidth={1.1} />
				<h2 class="text-lg font-medium">Faster development</h2>
				<p>
					Accelerates development and improves debugging by eliminating the need to rebuild for every change.
				</p>
			</Card>

			<Card>
				<Icon svg="window" size={48} strokeWidth={1.1} />
				<h2 class="text-lg font-medium">Browser preview</h2>
				<p>
					Preview in any browser during development using websockets to pass messages from figma to the
					browser.
				</p>
			</Card>

			<Card>
				<Icon svg="vite-logo" size={48} strokeWidth={1.1} />
				<h2 class="text-lg font-medium">Built with Vite</h2>
				<p>
					Built using Vite, it works seamlessly with most frameworks and offers support for numerous Vite and
					Rollup plugins.
				</p>
			</Card>
		</div>
	</div>

	<div class="py-32 px-8 w-full justify-center items-center border-t">
		<h2 class="text-4xl sm:text-4xl text-center font-medium mb-12">Commands</h2>
		<p class="text-center mb-8 max-w-2xl mx-auto">
			Below are some of the key commands you can use with Plugma. These commands help you start the development
			server, create builds, preview your plugin, and release it to GitHub. They are designed to make your
			development workflow as smooth as possible, even if you're new to working with CLI tools.
		</p>
		<div class="lg:max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">
			<div>
				<h4 class="font-bold mb-2">Start dev server</h4>
				<pre class="p-2 border mb-6 rounded-sm w-full"><code>plugma dev</code></pre>
			</div>
			<div>
				<h4 class="font-bold mb-2">Create a build</h4>
				<pre class="p-2 border mb-6 rounded-sm w-full"><code>plugma build</code></pre>
			</div>
			<div>
				<h4 class="font-bold mb-2">Preview in any browser</h4>
				<pre class="p-2 border mb-6 rounded-sm w-full"><code>plugma preview</code></pre>
			</div>
			<div>
				<h4 class="font-bold mb-2">Release to github</h4>
				<pre class="p-2 border mb-6 rounded-sm w-full"><code>plugma release</code></pre>
			</div>
		</div>
	</div>

	<div class="py-32 w-full justify-center items-center inline-flex border-t">
		<div class="w-[688px] flex justify-center">
			<div class="text-center">
				<h2 class="text-7xl font-medium font-poppins leading-[90px] mb-4">Go create</h2>
				<!-- <Button class="rounded-full">
				<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path
						d="M22.8013 11.9309C24.1163 11.0642 24.9895 9.56342 24.9895 7.86179C24.9895 5.17724 22.8118 3 20.1502 3H11.8393C9.16715 3 7 5.1878 7 7.86179C7 9.56342 7.87317 11.0642 9.18819 11.9309C7.87317 12.7976 7 14.2984 7 16C7 17.7016 7.87317 19.2024 9.18819 20.0691C7.87317 20.9358 7 22.4366 7 24.1382C7 26.8228 9.18819 29 11.8708 29C14.585 29 16.7943 26.7911 16.7943 24.0854V19.5935C17.6569 20.3756 18.8036 20.8618 20.0555 20.8618H20.1607C22.8328 20.8618 25 18.674 25 16C24.9895 14.2984 24.1163 12.7976 22.8013 11.9309ZM15.2057 24.0854C15.2057 25.9138 13.7119 27.4146 11.8708 27.4146C10.0614 27.4146 8.58854 25.9455 8.58854 24.1382C8.58854 22.3309 10.0508 20.8724 11.8393 20.8618H15.2057V24.0854ZM15.2057 19.2764H11.8393C10.0403 19.2764 8.58854 17.8073 8.58854 16C8.58854 14.1927 10.0508 12.7236 11.8498 12.7236H15.2162V19.2764H15.2057ZM15.2057 11.1382H11.8393C10.0403 11.1382 8.57802 9.66911 8.57802 7.86179C8.57802 6.05447 10.0403 4.58537 11.8393 4.58537H15.2057V11.1382ZM16.7838 4.58537H20.1502C21.9492 4.58537 23.4115 6.05447 23.4115 7.86179C23.4115 9.66911 21.9492 11.1382 20.1502 11.1382H16.7838V4.58537ZM20.1502 19.2764H20.045C18.2461 19.2764 16.7838 17.8073 16.7838 16C16.7838 14.1927 18.2461 12.7236 20.045 12.7236H20.1502C21.9492 12.7236 23.4115 14.1927 23.4115 16C23.4115 17.8073 21.9492 19.2764 20.1502 19.2764Z"
						fill="white"
					/>
				</svg>
				Try it now
			</Button> -->
			</div>
		</div>
	</div>
</div>
