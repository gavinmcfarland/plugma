export class Timer {
	private startTime: number | null = null
	private endTime: number | null = null

	start() {
		this.startTime = performance.now()
		this.endTime = null // reset end time in case of reuse
	}

	stop() {
		if (this.startTime === null) {
			throw new Error('Timer has not been started.')
		}
		this.endTime = performance.now()
	}

	getDuration(): string | undefined {
		if (this.startTime === null || this.endTime === null) {
			return undefined
		}
		return (this.endTime - this.startTime).toFixed(0)
	}
}
