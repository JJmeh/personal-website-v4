/**
 * The case studies behind `/works/<slug>/`.
 *
 * Kept apart from `works.ts` on purpose: the catalogue there is what the index
 * grid and the filter pills read, while this file is the long-form copy that
 * only a detail page needs. The `Record<WorkSlug, ...>` type is the contract —
 * a new work without copy fails the type-check instead of rendering an empty
 * page.
 *
 * Written for a prospective client, not for a developer: what the project was,
 * what was made, what changed. No implementation detail — and no credit for
 * visual design, since the work here is development, delivered with Skalatama.
 */
import type { WorkSlug } from "./works";

export interface WorkScopeItem {
	/** Short label for the thing that was built. */
	title: string;
	body: string;
}

export interface WorkCaseStudy {
	/** One-liner under the title: what this thing is, in a sentence. */
	summary: string;
	/** What my part was, e.g. "Development". */
	role: string;
	/** Who the work was delivered with. */
	collaboration: string;
	/** Why the project existed, as paragraphs. */
	problem: string[];
	/** What was built, as paragraphs. */
	solution: string[];
	/** The concrete pieces of the build. */
	scope: WorkScopeItem[];
	/** What changed once it shipped. */
	outcomes: string[];
}

export const workCases: Record<WorkSlug, WorkCaseStudy> = {
	"ata-aluminum": {
		summary:
			"A company profile for an export-ready aluminium extrusion factory: what it can make, the certification behind it, and references at the scale its buyers work at.",
		role: "Development",
		collaboration: "With Skalatama",
		problem: [
			"PT ATA Internasional Industri extrudes custom aluminium profiles and handles anodizing, fabrication and finishing, with SNI and ISO certification and an export-ready line. None of that was self-serve online: buyers met the company through trade decks, spec sheets and a phone call.",
			"The people making the first decision are a façade contractor, a developer's procurement team or an automotive applicator, and they look for three things in a fixed order: can you make my profile, are you certified, and have you done this at my scale. Answering those one at a time by email loses the enquiry long before the call.",
		],
		solution: [
			"The site answers in that order. A capability statement opens, and products and applications come after the credentials rather than before them.",
			"References are split by sector — industrial, high-rise, automotive, residential — because a contractor working on a tower reads a tower. Photography from projects at a recognisable scale is a stronger credential than a logo wall.",
			"Certification sits in the header as its own page rather than a PDF in the footer, so the thing that decides a procurement conversation is always one click away.",
		],
		scope: [
			{
				title: "Capability-led home page",
				body: "The opening screen states what the factory can make and which certification qualifies it, so a first-time visitor self-qualifies immediately.",
			},
			{
				title: "Sector reference hub",
				body: "Industrial, high-rise, automotive and residential references as separate pages, each with project photography at the buyer's own scale.",
			},
			{
				title: "Product & facility pages",
				body: "Custom profiles plus anodizing, fabrication and finishing, described in the language of a specifier rather than a brochure.",
			},
			{
				title: "Certification page",
				body: "The accreditation evidence an exporter is asked to prove, reachable from the main navigation.",
			},
			{
				title: "One route to sales",
				body: "A contact block at the close of every page, with a single call to action so nothing competes with the enquiry.",
			},
		],
		outcomes: [
			"Every claim the sales team makes on a call now has a page it can point at.",
			"Sector reference pages let a contractor self-qualify before making contact.",
			"The company adds new projects and certificates itself, without waiting on a developer.",
		],
	},

	karlivahome: {
		summary:
			"A furniture catalogue for a Solo-based manufacturer selling overseas: 24 models, filterable by what fits, with every enquiry going straight to WhatsApp.",
		role: "Development",
		collaboration: "With Skalatama",
		problem: [
			"Karliva manufactures wooden furniture in Solo and sells it abroad. The catalogue used to sit on a service outside the site, and it failed often enough that the product pages were the least reliable part of it: missing thumbnails, and detail pages that could open empty.",
			"That is the wrong thing to be flaky when the visitor is an overseas buyer comparing suppliers. They need to see the full range, narrow it to what fits an interior, and open one model in detail — all inside a single visit.",
		],
		solution: [
			"The catalogue is part of the site now. All 24 items and their photographs arrive with the page, so the collection is there whenever the site is.",
			"Browsing happens by type — sets, tables, chairs — as filtered views of one collection, and every item opens a page with its own gallery and details. An enquiry becomes a WhatsApp message with the number already in place, so a buyer goes from \u201cthis one\u201d to a conversation in one tap.",
			"A second collection covers custom interior work, because a manufacturer at this size loses as many jobs to one-off commissions as to catalogue orders.",
			"Photography is the product here, so images are served at the size the screen needs — which keeps the catalogue quick on exactly the overseas connection this audience uses.",
		],
		scope: [
			{
				title: "Full catalogue",
				body: "24 models with their own photography and specifications, browsable as one collection.",
			},
			{
				title: "Filterable range",
				body: "Sets, tables and chairs as views of the same catalogue rather than three separate lists.",
			},
			{
				title: "Model pages",
				body: "Each piece with its own gallery and detail, the page buyers actually compare on.",
			},
			{
				title: "Custom interior collection",
				body: "A parallel track for bespoke commissions, with its own route into an enquiry.",
			},
			{
				title: "Company story & facilities",
				body: "The workshop, its history and a gallery, for buyers who want to know who they are dealing with.",
			},
			{
				title: "WhatsApp-first enquiries",
				body: "Every enquiry button opens a chat with the number prefilled, not a mail form nobody completes abroad.",
			},
		],
		outcomes: [
			"Product pages stay up: nothing outside the site sits between a buyer and a photograph.",
			"The whole range can be browsed, filtered and opened on a phone, which is where most of these enquiries start.",
			"Questions about a specific piece arrive with the piece already named.",
		],
	},

	daoke: {
		summary:
			"An inventory and process application for produce: every stage from delivery to packing, recorded with weight, photo and the person responsible, instead of scattered across paper and chat.",
		role: "Development",
		collaboration: "With Skalatama",
		problem: [
			"Produce moves through a chain of hands — delivered by a supplier, sorted, packed, shipped — and each stage was written down in its own way: a weighing slip, a photo on someone's phone, a note in a group chat. By the time anyone asked what happened to a batch, the answer was spread across three of those.",
			"The people who needed the numbers were not the people entering them. Management wanted stock, waste and staff output; the floor needed to keep working with one hand while holding a crate of vegetables in the other.",
		],
		solution: [
			"Daoke gives each stage a screen of its own: newly arrived produce, produce in process and finished produce, plus a warehouse view — each recording supplier, staff, weight and photographs in a single entry. A statistics view reads those same records back as stock and staff figures, and access is set by role, so a floor user sees their stage and not the rest of the system.",
			"The interface is built for that one-handed context: capture straight from the camera, weight as the main action, and a preview of the photographs before a record is saved.",
		],
		scope: [
			{
				title: "A screen per stage",
				body: "Newly arrived, in process and finished produce as separate screens, plus a warehouse view and a daily recap.",
			},
			{
				title: "Photographs on every record",
				body: "Weight plus images per entry, with a viewer to check them before or after the fact.",
			},
			{
				title: "Statistics",
				body: "Stock and staff figures drawn from the entries themselves, filterable by date.",
			},
			{
				title: "Role-based access",
				body: "Each person sees only the stages they work on, not the whole operation.",
			},
			{
				title: "Supplier & staff records",
				body: "The reference data the floor works from, kept in one place.",
			},
			{
				title: "Built for the floor",
				body: "Camera capture, large targets, and pages that stay usable on a slow connection.",
			},
		],
		outcomes: [
			"A batch is one record with its photographs, instead of a search through a group chat.",
			"Stock and staff figures come from entries the floor already makes, so nobody keeps a second set of books.",
			"A disputed weight can be checked against its photographs rather than argued about.",
		],
	},

	"purest-coldpress": {
		summary:
			"A storefront for a cold-pressed juice brand: the full range, the packages and subscriptions, and a cleanse program explained — with every order ending in a pre-filled WhatsApp message.",
		role: "Development",
		collaboration: "With Skalatama",
		problem: [
			"Purest sells juice direct, over chat. The menu, the bundles, the monthly subscriptions and the cleanse program were spread across Instagram highlights and pinned messages, so the same questions arrived every day: what is in this bottle, which package fits me, how many days does a detox run, and how do I order.",
			"A DM thread is a bad menu. The brand needed one page where a first-time visitor could read the range, understand a cleanse, and reach an order without having to ask anything first.",
		],
		solution: [
			"The site is one continuous storefront. The menu leads with the full range — the juice line plus the almond variants — then the packages, then the subscriptions, then the cleanse program: who it is for, how a detox day runs, and what changes for a visitor with a stomach condition.",
			"Every call to action is a WhatsApp message already written, so a conversation opens with context instead of \u201chi, price?\u201d. Testimonials sit immediately before the ordering instructions, where a hesitating buyer is still deciding.",
			"The page is light enough to open on a phone in a shop with a weak signal, which is where most of these orders begin.",
		],
		scope: [
			{
				title: "Full menu, per-product gallery",
				body: "Every juice with its own images, size and price, without a separate page for each bottle.",
			},
			{
				title: "Packages & subscriptions",
				body: "Bundles and monthly plans with the saving and delivery terms on the card, so the comparison happens on the page, not in chat.",
			},
			{
				title: "Cleanse program explainer",
				body: "The most-asked-about offer given its own sequence: who it suits, the daily schedule, and the caveats.",
			},
			{
				title: "Social proof",
				body: "Three distinct testimonials, placed at the point of decision.",
			},
			{
				title: "WhatsApp everywhere",
				body: "Each button opens a chat with a message naming the product, so an order starts half-written.",
			},
			{
				title: "Copy in Indonesian",
				body: "Written in the language customers actually order in, including the health copy, rather than translated marketing English.",
			},
		],
		outcomes: [
			"Each repeated question now has a section of its own, so a chat starts at the product instead of the basics.",
			"The page opens quickly on a phone, on a weak connection, in a shop.",
			"Ordering stays where the brand already operates, with no checkout to build or maintain.",
		],
	},

	skalatama: {
		summary:
			"A branding consultant's own site: three pages up front, 23 client projects underneath, and a scroll experience that holds up on a phone.",
		role: "Development",
		collaboration: "With the Skalatama team",
		problem: [
			"A consultancy that sells clarity has to survive its own advice. Skalatama had proof — 23 client projects across F&B, interiors and furniture — but no structure that let a prospect read one of them in depth.",
			"The site leans on scrolling animation to hold attention, which is also its risk: on a mid-range phone that is the first thing to stutter, and a stutter reads as an unfinished site to exactly the audience being sold to.",
		],
		solution: [
			"Three pages up front — home, works, about — with a case study underneath each client project, carrying the category, the work done and the result.",
			"The animation was tuned for phones rather than assumed: scrolling stays smooth under a thumb, a transition keeps moving while a flick is already decaying, and the page still opens if an opening animation never finishes.",
			"Photography is the bulk of the site, so images arrive softly blurred instead of as empty boxes, and the pages stay quick to open with twenty-odd projects behind them.",
		],
		scope: [
			{
				title: "Three pages, 23 case studies",
				body: "One page per client project with its category and the work done, so a prospect can read the work at depth instead of scanning a logo strip.",
			},
			{
				title: "Scroll-led storytelling",
				body: "Sections that hold while the story catches up, on home, about and works.",
			},
			{
				title: "Smooth on touch",
				body: "The animation keeps its timing when the page is scrolled with a thumb, not just a mouse wheel.",
			},
			{
				title: "Images that arrive softly",
				body: "A blurred version of each photograph in place while the full one loads.",
			},
			{
				title: "Consultation enquiries",
				body: "Every call to action opens a WhatsApp conversation rather than a form.",
			},
			{
				title: "Every page describes itself",
				body: "Each of the 26 pages carries its own headline and summary, so a search or a share never lands on a generic page.",
			},
		],
		outcomes: [
			"A prospect can read a full case study instead of a logo strip.",
			"The site's own animation no longer stalls on a phone.",
			"Pages open quickly with twenty-odd client projects of photography behind them.",
		],
	},
};
