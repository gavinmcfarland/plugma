import { useEffect, useState } from "react";
import {
	AutoLayout,
	Text,
	Input,
	useSyncedState,
	usePropertyMenu,
	PropertyMenu,
	useWidgetId,
} from "@figma/widget-sdk";

interface StickyNote {
	id: string;
	text: string;
	color: string;
}

const COLORS = [
	"#FFD700", // Yellow
	"#98FB98", // Light Green
	"#87CEEB", // Sky Blue
	"#FFB6C1", // Light Pink
	"#DDA0DD", // Plum
];

function StickyNoteWidget() {
	const [notes, setNotes] = useSyncedState<StickyNote[]>("notes", []);
	const [editingId, setEditingId] = useState<string | null>(null);
	const widgetId = useWidgetId();

	const addNote = () => {
		const newNote: StickyNote = {
			id: Date.now().toString(),
			text: "New Note",
			color: COLORS[Math.floor(Math.random() * COLORS.length)],
		};
		setNotes([...notes, newNote]);
	};

	const updateNote = (id: string, text: string) => {
		setNotes(
			notes.map((note) => (note.id === id ? { ...note, text } : note))
		);
	};

	const deleteNote = (id: string) => {
		setNotes(notes.filter((note) => note.id !== id));
	};

	usePropertyMenu(
		[
			{
				itemType: "action",
				propertyName: "add",
				tooltip: "Add Note",
				text: "Add Note",
			},
		],
		({ propertyName }) => {
			if (propertyName === "add") {
				addNote();
			}
		}
	);

	return (
		<AutoLayout
			direction="vertical"
			padding={16}
			spacing={16}
			width={300}
			fill="#FFFFFF"
		>
			{notes.map((note) => (
				<AutoLayout
					key={note.id}
					direction="vertical"
					padding={16}
					fill={note.color}
					cornerRadius={8}
					width="fill-parent"
				>
					{editingId === note.id ? (
						<Input
							value={note.text}
							onTextEditEnd={(e) => {
								updateNote(note.id, e.characters);
								setEditingId(null);
							}}
							width="fill-parent"
						/>
					) : (
						<Text
							onClick={() => setEditingId(note.id)}
							width="fill-parent"
						>
							{note.text}
						</Text>
					)}
					<AutoLayout
						direction="horizontal"
						spacing={8}
						width="fill-parent"
						horizontalAlignItems="end"
					>
						<Text
							onClick={() => deleteNote(note.id)}
							fontSize={12}
							fill="#666666"
						>
							Delete
						</Text>
					</AutoLayout>
				</AutoLayout>
			))}
			{notes.length === 0 && (
				<Text horizontalAlignText="center" fill="#666666">
					Click "Add Note" in the widget menu to create a sticky note
				</Text>
			)}
		</AutoLayout>
	);
}

widget.register(StickyNoteWidget);
