import { derived, writable } from 'svelte/store'
import { nanoid } from 'nanoid'

export interface Notification {
	id?: string
	message: string
	timeout?: number | null
	type?: string
}

export const notifications = writable<Notification[]>([])

export function notify({ type, message, timeout }: Notification) {
	const id = nanoid()

	notifications.update((notifications) => [...notifications, { id, message, type, timeout }])

	// Return an object with an update and remove method
	return {
		update: ({ type, message, timeout }: Notification): void => {
			notifications.update((n) =>
				n.map((notif) =>
					notif.id === id
						? { ...notif, type, message, timeout } // Apply default timeout if not provided
						: notif,
				),
			)
		},
		remove: (): void => {
			notifications.update((n) => n.filter((notif) => notif.id !== id))
		},
	}
}
