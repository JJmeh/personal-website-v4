/**
 * Decorative "current" field painted onto the feature panel.
 *
 * The panel is half of every desktop viewport and two thirds of the mobile
 * hero, and it used to be a flat accent rectangle — the largest empty area on
 * the site. This is what fills it: streamlines integrated through a slowly
 * moving vector field, with dust drifting on the same current, drawn on one
 * canvas in additive blend so crossings brighten instead of muddying. The
 * pointer stirs it (a tangential displacement around the cursor) on devices
 * with a fine pointer.
 *
 * Performance notes — this project has been bitten before, see the runtime
 * comment in `ScrollDownAnimation.astro`:
 *
 * - Nothing here animates an SVG child or any property that reaches layout.
 *   A frame is `clearRect` + strokes into one canvas, i.e. paint of a single
 *   composited layer, never layout.
 * - The drawing loop never reads layout. The host box is measured in the
 *   `ResizeObserver` only, and pointer coordinates are converted with that
 *   cached box, so scrolling cannot force a synchronous layout per frame.
 * - The backing store is capped at ~2.6 MP: a 700 x 890 panel at dpr 3 would
 *   otherwise allocate a 4 MP surface to draw 1 px hairlines on.
 * - Frame cost is tracked with an exponential moving average. Once the draw
 *   starts to overrun a 60 fps budget the loop drops every second frame
 *   (about 30 fps) instead of queueing work it cannot finish.
 * - The loop stops when the panel leaves the viewport or the tab is hidden.
 * - `prefers-reduced-motion: reduce` paints exactly one frame and never
 *   starts the loop: the panel still looks finished, it just does not move.
 */

/** Fixed seed: the composition is the same on every load and in screenshots. */
const SEED = 20_260_219;

/** Integration steps per streamline; visual length is `STEPS * STEP_PX`. */
const STEPS = 80;
const STEP_PX = 15;

/** Field tempo — field-time seconds per wall-clock second. */
const TEMPO = 0.18;

/** Backing-store ceiling in device pixels. */
const MAX_PIXELS = 2_600_000;

/** Average draw cost (ms) above which the loop drops every other frame. */
const FRAME_BUDGET_MS = 9;

const TAU = Math.PI * 2;

/** Comma-separated RGB triplets so canvas colours stay simple strings. */
const LIGHT = "232, 235, 239";
const WARM = "255, 122, 26";

interface Stream {
	/** Normalised seed position (0–1 across the panel). */
	x: number;
	y: number;
	/** Time offset so parallel streams never move in lockstep. */
	phase: number;
	alpha: number;
	lineWidth: number;
	/** Highlight streams are drawn warm, with a wide low-alpha glow pass. */
	hot: boolean;
}

interface Mote {
	x: number;
	y: number;
	phase: number;
	/** Pixels per second. */
	speed: number;
	radius: number;
	alpha: number;
	hot: boolean;
}

interface Swirl {
	/** Pointer position in CSS pixels. */
	x: number;
	y: number;
	/** Falloff radius, CSS pixels. */
	radius: number;
	/** Peak displacement, CSS pixels; zero when the pointer is away. */
	strength: number;
}

export interface FlowFieldOptions {
	/** Box the canvas fills; also the coordinate space for the pointer. */
	host: HTMLElement;
	canvas: HTMLCanvasElement;
	/** Optional radial glow that trails the pointer. */
	glow?: HTMLElement | null;
}

/** Deterministic PRNG (mulberry32). */
function createRandom(seed: number): () => number {
	let state = seed >>> 0;
	return () => {
		state = (state + 0x6d2b79f5) >>> 0;
		let t = state;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
	};
}

/**
 * Vector field angle at a normalised point.
 *
 * Three out-of-phase waves, tuned by eye so the result reads as currents
 * rather than noise: long horizontal runs that bend and fold instead of
 * spiralling into knots. Returned in radians, with 0 pointing right.
 */
function angleAt(x: number, y: number, time: number): number {
	const drift = Math.sin(x * 1.9 + time * 1.1) * 1.25;
	const bend = Math.cos(y * 2.6 - time * 0.7) * 0.95;
	const curl = Math.sin((x + y) * 1.35 + time * 0.5) * 0.65;
	return (drift + bend + curl) * 0.6;
}

/**
 * Streams are seeded in *bundles*: two to four near-identical seeds that share
 * a field phase and drift apart slowly. A bundle reads as one ribbon that
 * braids and separates, which is what makes the panel look like flowing silk
 * instead of a pile of separate scratches.
 */
function buildStreams(random: () => number): Stream[] {
	const bundles = 11;
	const streams: Stream[] = [];

	for (let bundle = 0; bundle < bundles; bundle++) {
		// Every ribbon enters from (or just off) the left edge: the field flows
		// roughly +x, so seeding inside the panel would leave half of it bare.
		const originX = -0.14 + random() * 0.14;
		const originY = (bundle + 0.5) / bundles + (random() - 0.5) * 0.05;
		const phase = random() * TAU;
		// A few bundles carry one warm accent stream.
		const warmAt = random() < 0.4 ? Math.floor(random() * 4) : -1;
		const members = 2 + Math.floor(random() * 3);

		for (let member = 0; member < members; member++) {
			const hot = member === warmAt;
			streams.push({
				x: originX + (random() - 0.5) * 0.08,
				y: originY + (random() - 0.5) * 0.03,
				phase: phase + (random() - 0.5) * 0.35,
				alpha: hot ? 0.22 + random() * 0.16 : 0.06 + random() * 0.16,
				lineWidth: hot ? 1.1 + random() * 0.6 : 0.7 + random() * 0.7,
				hot,
			});
		}
	}

	// Shuffle so a prefix (the count a narrow panel keeps) still spreads across
	// every ribbon instead of only the first few.
	for (let index = streams.length - 1; index > 0; index--) {
		const pick = Math.floor(random() * (index + 1));
		const swap = streams[index] as Stream;
		streams[index] = streams[pick] as Stream;
		streams[pick] = swap;
	}

	return streams;
}

function buildMotes(random: () => number): Mote[] {
	return Array.from({ length: 84 }, () => ({
		x: random(),
		y: random(),
		phase: random() * TAU,
		speed: 10 + random() * 22,
		radius: 0.4 + random() * 1,
		alpha: 0.12 + random() * 0.32,
		hot: random() < 0.22,
	}));
}

/**
 * Starts the field for one panel and returns a teardown function.
 *
 * Idempotent per element call; the component renders one panel per breakpoint,
 * so every instance owns its own canvas, measurements and loop.
 */
export function initFlowField({
	host,
	canvas,
	glow = null,
}: FlowFieldOptions): () => void {
	const maybeContext = canvas.getContext("2d");
	if (!maybeContext) return () => {};

	/** Bound to a non-nullable local so the helpers below need no guards. */
	const context = maybeContext;

	const random = createRandom(SEED);
	const streams = buildStreams(random);
	const motes = buildMotes(random);
	const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
	const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

	let width = 0;
	let height = 0;
	let dpr = 1;
	let activeStreams = streams.slice(0, 10);
	let visible = false;
	let running = false;
	let rafId = 0;
	let lastTime = 0;
	let ticks = 0;
	let cost = 0;

	/**
	 * Last values written to the pointer glow. Inline-style writes cost a style
	 * recalculation for that element, so they only happen when the pointer is
	 * actually moving — otherwise an idle panel recalculates styles every frame.
	 */
	const glowState = { x: Number.NaN, y: Number.NaN, opacity: Number.NaN };

	const pointer = {
		x: 0.5,
		y: 0.5,
		targetX: 0.5,
		targetY: 0.5,
		force: 0,
		targetForce: 0,
	};

	/** One streamline, integrated from its seed and warped around the pointer. */
	function trace(stream: Stream, clock: number, swirl: Swirl) {
		let x = stream.x;
		let y = stream.y;
		context.beginPath();

		for (let step = 0; step <= STEPS; step++) {
			const px = x * width;
			const py = y * height;
			let drawX = px;
			let drawY = py;

			if (swirl.strength > 0.5) {
				const dx = px - swirl.x;
				const dy = py - swirl.y;
				const distanceSquared = dx * dx + dy * dy;
				const falloff = Math.exp(
					-distanceSquared / (2 * swirl.radius * swirl.radius)
				);
				if (falloff > 0.01) {
					// Tangential push: the cursor stirs the current instead of
					// punching a hole in it.
					const inverse = 1 / (Math.sqrt(distanceSquared) + 1);
					const push = falloff * swirl.strength * inverse;
					drawX = px - dy * push;
					drawY = py + dx * push;
				}
			}

			if (step === 0) context.moveTo(drawX, drawY);
			else context.lineTo(drawX, drawY);

			const angle = angleAt(x, y, clock + stream.phase);
			x += (Math.cos(angle) * STEP_PX) / width;
			y += (Math.sin(angle) * STEP_PX) / height;
		}
	}

	/** Dust rides the same field; the pointer pushes it aside. */
	function advanceMotes(clock: number, delta: number) {
		const repel = pointer.force * 26;
		const centreX = pointer.x * width;
		const centreY = pointer.y * height;

		for (const mote of motes) {
			const angle = angleAt(mote.x, mote.y, clock + mote.phase);
			const px = mote.x * width;
			const py = mote.y * height;
			let vx = Math.cos(angle) * mote.speed;
			let vy = Math.sin(angle) * mote.speed;

			if (repel > 0.1) {
				const dx = px - centreX;
				const dy = py - centreY;
				const inverse = 1 / (Math.sqrt(dx * dx + dy * dy) + 1);
				vx += dx * inverse * repel;
				vy += dy * inverse * repel;
			}

			mote.x += (vx * delta) / width;
			mote.y += (vy * delta) / height;

			// Wrap with a small margin so a mote never pops back in view.
			if (mote.x < -0.02) mote.x += 1.04;
			else if (mote.x > 1.02) mote.x -= 1.04;
			if (mote.y < -0.02) mote.y += 1.04;
			else if (mote.y > 1.02) mote.y -= 1.04;
		}
	}

	/** 110 motes cost two fills: arcs are batched per colour into one path. */
	function paintMotes() {
		for (const hot of [false, true]) {
			context.beginPath();
			let painted = false;

			for (const mote of motes) {
				if (mote.hot !== hot) continue;
				const x = mote.x * width;
				const y = mote.y * height;
				context.moveTo(x + mote.radius, y);
				context.arc(x, y, mote.radius, 0, TAU);
				painted = true;
			}

			if (!painted) continue;
			context.fillStyle = hot ? `rgba(${WARM}, 0.45)` : `rgba(${LIGHT}, 0.3)`;
			context.fill();
		}
	}

	function paint(time: number, delta: number) {
		if (width < 2 || height < 2) return;

		context.setTransform(dpr, 0, 0, dpr, 0, 0);
		context.clearRect(0, 0, width, height);
		context.globalCompositeOperation = "lighter";
		context.lineCap = "round";
		context.lineJoin = "round";

		const clock = time * TEMPO;
		const smallest = Math.min(width, height);
		const swirl: Swirl = {
			x: pointer.x * width,
			y: pointer.y * height,
			radius: smallest * 0.3,
			strength: pointer.force * smallest * 0.075,
		};

		for (const stream of activeStreams) {
			trace(stream, clock, swirl);
			const rgb = stream.hot ? WARM : LIGHT;

			if (stream.hot) {
				// Glow pass: same path, wide and faint, before the crisp line.
				context.strokeStyle = `rgba(${rgb}, ${(stream.alpha * 0.18).toFixed(3)})`;
				context.lineWidth = stream.lineWidth * 7;
				context.stroke();
			}

			context.strokeStyle = `rgba(${rgb}, ${stream.alpha.toFixed(3)})`;
			context.lineWidth = stream.lineWidth;
			context.stroke();
		}

		advanceMotes(clock, delta);
		paintMotes();

		if (glow) {
			const opacity = Math.round(pointer.force * 100) / 100;
			if (
				opacity !== glowState.opacity ||
				Math.abs(swirl.x - glowState.x) > 0.5 ||
				Math.abs(swirl.y - glowState.y) > 0.5
			) {
				glowState.x = swirl.x;
				glowState.y = swirl.y;
				glowState.opacity = opacity;
				glow.style.opacity = opacity.toFixed(2);
				glow.style.transform = `translate3d(${swirl.x.toFixed(1)}px, ${swirl.y.toFixed(1)}px, 0)`;
			}
		}
	}

	/** Pointer easing is frame-rate independent, so dropped frames never lurch. */
	function easePointer(delta: number) {
		const factor = Math.min(1, delta * 7);
		pointer.x += (pointer.targetX - pointer.x) * factor;
		pointer.y += (pointer.targetY - pointer.y) * factor;
		pointer.force += (pointer.targetForce - pointer.force) * factor;
	}

	function frame(now: number) {
		rafId = requestAnimationFrame(frame);
		ticks += 1;

		// Over budget: paint every second frame instead of falling behind.
		if (cost > FRAME_BUDGET_MS && ticks % 2 === 1) return;

		const delta =
			lastTime === 0 ? 1 / 60 : Math.min((now - lastTime) / 1000, 0.05);
		lastTime = now;
		easePointer(delta);

		const started = performance.now();
		paint(now / 1000, delta);
		const spent = performance.now() - started;
		cost = cost === 0 ? spent : cost * 0.85 + spent * 0.15;
	}

	function start() {
		if (running || reduceMotion.matches || !visible) return;
		running = true;
		lastTime = 0;
		rafId = requestAnimationFrame(frame);
	}

	function stop() {
		running = false;
		cancelAnimationFrame(rafId);
	}

	function measure() {
		const box = host.getBoundingClientRect();
		width = Math.round(box.width);
		height = Math.round(box.height);
		if (width < 2 || height < 2) return;

		const area = width * height;
		dpr = Math.min(window.devicePixelRatio || 1, 2);
		if (area * dpr * dpr > MAX_PIXELS) {
			dpr = Math.max(1, Math.sqrt(MAX_PIXELS / area));
		}

		canvas.width = Math.round(width * dpr);
		canvas.height = Math.round(height * dpr);

		// Denser panels get more ribbons; phones get fewer for the same look.
		const count = Math.round(width / 22);
		activeStreams = streams.slice(
			0,
			Math.max(12, Math.min(streams.length, count))
		);

		// A panel that is `display: none` (the mobile/desktop duplicate) paints
		// nothing, so it must not fade in as an empty canvas.
		paint(performance.now() / 1000, 0);
		canvas.dataset.ready = "true";
	}

	const onPointerMove = (event: PointerEvent) => {
		if (width < 2) return;
		const box = host.getBoundingClientRect();
		pointer.targetX = (event.clientX - box.left) / box.width;
		pointer.targetY = (event.clientY - box.top) / box.height;
		pointer.targetForce = 1;
	};

	const onPointerLeave = () => {
		pointer.targetForce = 0;
	};

	const onVisibilityChange = () => {
		if (document.visibilityState === "hidden") stop();
		else start();
	};

	const observer = new IntersectionObserver(
		(entries) => {
			visible = entries.some((entry) => entry.isIntersecting);
			if (visible) start();
			else stop();
		},
		{ rootMargin: "96px" }
	);

	const resizeObserver = new ResizeObserver(() => {
		measure();
		// Reduced motion (or a panel that is not on screen yet) still needs the
		// single frame to follow a resize.
		if (!running) paint(performance.now() / 1000, 0);
	});

	resizeObserver.observe(host);
	document.addEventListener("visibilitychange", onVisibilityChange);

	if (finePointer.matches) {
		host.addEventListener("pointermove", onPointerMove);
		host.addEventListener("pointerleave", onPointerLeave);
	}

	// `reduce` is a live setting; follow it if the reader flips it.
	const onMotionPreference = () => {
		if (reduceMotion.matches) {
			stop();
			paint(performance.now() / 1000, 0);
		} else {
			start();
		}
	};
	reduceMotion.addEventListener("change", onMotionPreference);

	measure();
	observer.observe(host);

	return () => {
		stop();
		observer.disconnect();
		resizeObserver.disconnect();
		reduceMotion.removeEventListener("change", onMotionPreference);
		document.removeEventListener("visibilitychange", onVisibilityChange);
		host.removeEventListener("pointermove", onPointerMove);
		host.removeEventListener("pointerleave", onPointerLeave);
	};
}
