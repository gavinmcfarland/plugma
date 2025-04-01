type Member = {
	id: string;
	room: string;
};

type RoomState = {
	[roomName: string]: Member[];
};

class RoomStore {
	private state: RoomState = {};
	private listeners: ((state: RoomState) => void)[] = [];

	constructor() {
		this.state = {
			browser: [],
			figma: [],
			node: [],
		};
	}

	addMember(room: string, member: Member) {
		if (!this.state[room]) {
			this.state[room] = [];
		}
		this.state[room].push(member);
		this.notify();
	}

	removeMember(room: string, memberId: string) {
		if (this.state[room]) {
			this.state[room] = this.state[room].filter(
				(m) => m.id !== memberId
			);
			this.notify();
		}
	}

	getState(): RoomState {
		return this.state;
	}

	subscribe(listener: (state: RoomState) => void) {
		this.listeners.push(listener);
		return () => {
			this.listeners = this.listeners.filter((l) => l !== listener);
		};
	}

	private notify() {
		this.listeners.forEach((listener) => listener(this.state));
	}

	clear() {
		this.state = {
			browser: [],
			figma: [],
			node: [],
		};
		this.notify();
	}
}

export const roomStore = new RoomStore();
