# Sticky Notes Widget for Figma

A simple sticky notes widget that allows you to create, edit, and delete notes directly in your Figma designs.

## Features

-   Create multiple sticky notes
-   Edit note content by clicking on the text
-   Delete notes
-   Random color assignment for visual organization
-   Persistent storage within the widget

## Setup

1. Install dependencies:

```bash
npm install
```

2. Build the widget:

```bash
npm run build
```

3. In Figma, go to Plugins > Development > Import plugin from manifest...
4. Select the `manifest.json` file from this directory

## Development

To start development with hot reloading:

```bash
npm run watch
```

## Usage

1. Add the widget to your Figma canvas
2. Click the widget menu (three dots) and select "Add Note" to create a new note
3. Click on any note to edit its content
4. Click the "Delete" button to remove a note

## Notes

-   Notes are saved within the widget instance
-   Each note gets a random color from a predefined palette
-   The widget supports multiple instances with independent notes
