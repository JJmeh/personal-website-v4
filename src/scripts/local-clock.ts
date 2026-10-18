/**
 * Tiny local-time readout for the feature panel HUD.
 *
 * Re-renders on the minute boundary rather than polling every second: one
 * `setTimeout` chained to the next whole minute is a couple of wake-ups per
 * minute, and it is the same construction that keeps the digits from ever
 * looking stale for most of a minute.
 *
 * Minute alignment is computed from the host clock, so a zone with a non-whole
 * offset would refresh up to a minute late — harmless for a decorative
 * readout, and noted so nobody debugs it later.
 */
export function startLocalClock(
	element: HTMLElement,
	timeZone: string
): () => void {
	const format = new Intl.DateTimeFormat("en-GB", {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
		timeZone,
	});

	let timer = 0;

	const paint = () => {
		const text = format.format(new Date());
		if (element.textContent === text) return;
		element.textContent = text;
		element.hidden = false;
	};

	const schedule = () => {
		const delay = 60_000 - (Date.now() % 60_000) + 250;
		timer = window.setTimeout(() => {
			paint();
			schedule();
		}, delay);
	};

	const onVisibilityChange = () => {
		clearTimeout(timer);
		if (document.visibilityState !== "visible") return;
		paint();
		schedule();
	};

	paint();
	schedule();
	document.addEventListener("visibilitychange", onVisibilityChange);

	return () => {
		clearTimeout(timer);
		document.removeEventListener("visibilitychange", onVisibilityChange);
	};
}
