<Box display="flex" flexDirection="column" alignItems="center">
	<Box textAlign="center" padding="var(--em-7) var(--em-0) var(--em-5)">
		<h1>Plugma</h1>
		<p style="font-size: var(--font-size-2)" class="Header_Tagline">
			Create Figma plugins without the boilerplate
		</p>
		<!-- <a class="Button" href="https://github.com/gavinmcfarland/plugma">View on Github</a> -->
	</Box>
</Box>

<Box display="flex" flexDirection="column" alignItems="center">
	<Box
		display="grid"
		gridTemplateColumns="repeat(26, 1fr)"
		gap="var(--em--1)"
		maxWidth="1096px"
		gridAutoFlow="dense">
		<Box
			border="1px solid var(--border-color-tertiary)"
			element="section"
			display="grid"
			padding="var(--rem-4) 0"
			flexDirection="column"
			justifyContent="center"
			alignItems="center"
			gridTemplateColumns="subgrid"
			gridColumn="span 26"
			borderRadius="2px">
			<!-- <Box gridColumn="span 5">{@html data.features.content}</Box> -->
			<Box gridColumn="10 /span 10">
				{@html data['get-started'].content}
			</Box>
		</Box>

		<Box display="grid" gridTemplateColumns="subgrid" gridColumn="span 26">
			<Box
				border="1px solid var(--border-color-tertiary)"
				element="section"
				display="grid"
				justifyContent="center"
				gridColumn="span 14"
				gridTemplateColumns="subgrid"
				padding="var(--rem-4) 0"
				borderRadius="2px">
				<!-- <Box gridColumn="span 5">{@html data.features.content}</Box> -->
				<Box gridColumn="span 5"><h2 style="margin-left: var(--em-1); margin-top: 0;">Dev</h2></Box>
				<Box gridColumn="span 7">
					{@html data['developing'].content}
				</Box>
			</Box>

			<Box
				border="1px solid var(--border-color-tertiary)"
				element="section"
				display="grid"
				padding="var(--rem-4) 0"
				justifyContent="center"
				gridColumn="span 12"
				gridTemplateColumns="subgrid"
				borderRadius="2px">
				<Box gridColumn="span 6" alignItems="center" display="grid" justifyContent="center">
					<img src={logo} alt="SvelteKit" style="width: 100px; height: 100px" />
				</Box>
				<p style="grid-column: 7 / span 5">
					Plugma uses Vite's modern ecosystem and is optimised for performance. Ensuring your
					development experience is seamless and efficient. Create your Figma plugins quickly and
					effortlessly with the speed and versatility of Vite.
				</p>
			</Box>
		</Box>

		<Box
			border="1px solid var(--border-color-tertiary)"
			element="section"
			display="grid"
			gridTemplateColumns="subgrid"
			padding="var(--rem-4) 0"
			justifyContent="center"
			gridColumn="span 26"
			borderRadius="2px">
			<!-- <Box gridColumn="span 5">{@html data.features.content}</Box> -->
			<Box gridColumn="span 7"
				><h2 style="margin-left: var(--em-1); margin-top: 0;">Folder structure</h2></Box>
			<Box gridColumn="span 10">
				<FolderDiagram>
					<Folder name="my-plugin/" id="1">
						<Folder name="dist/" id="2" />
						<Folder name="src/" id="3">
							<File name="code.ts" />
							<File name="ui.ts" />
							<File name="styles.css" />
						</Folder>
						<File name="README.md" />
						<File name="package.json" />
						<File name="tsconfig.js" />
						<File name="vite.config.js" />
					</Folder>
				</FolderDiagram>
			</Box>

			<Box gridColumn="20 / span 5">
				<Info>
					<p>Only the folders and files you need. Customise their names and locations.</p></Info>
			</Box>
		</Box>

		<Box
			border="1px solid var(--border-color-tertiary)"
			element="section"
			display="grid"
			gridTemplateColumns="subgrid"
			padding="var(--rem-4) 0"
			justifyContent="center"
			gridColumn="span 26"
			borderRadius="2px">
			<!-- <Box gridColumn="span 5">{@html data.features.content}</Box> -->
			<Box gridColumn="span 9"><h2 style="margin-left: var(--em-1); margin-top: 0;">Build</h2></Box>
			<Box gridColumn="span 10">
				{@html data['building'].content}
			</Box>
		</Box>
	</Box>
</Box>
