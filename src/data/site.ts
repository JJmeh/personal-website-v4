/**
 * Site-wide identity, socials and contact details.
 *
 * Previously the same handles were copy-pasted into the header/footer
 * (`BaseLayout`), the home contact card and `SocialNavLinks`, which meant a
 * changed handle had to be edited in three places. Everything now reads here.
 */

export interface Social {
	/** Display label, uppercase in the UI. */
	label: string;
	href: string;
	/** `mailto:` links open in the same tab, everything else in a new one. */
	external: boolean;
}

export const person = {
	name: "Jeremiah Jason",
	jobTitle: "Full-Stack Web Developer",
	location: "Jakarta, Indonesia",
	/** IANA zone for the local-time readout in the feature panel HUD. */
	timeZone: "Asia/Jakarta",
	email: "jeremiah.kaliki@gmail.com",
	alumniOf: "Bina Nusantara University",
} as const;

export const socials: Social[] = [
	{
		label: "Email",
		href: `mailto:${person.email}`,
		external: false,
	},
	{
		label: "Instagram",
		href: "https://www.instagram.com/jj.klki_/",
		external: true,
	},
	{
		label: "LinkedIn",
		href: "https://www.linkedin.com/in/jeremiahjason/",
		external: true,
	},
	{
		label: "GitHub",
		href: "https://github.com/JJmeh",
		external: true,
	},
];

/** Structured data for search engines — one `Person` node for the whole site. */
export const personJsonLd = (siteUrl: URL) => ({
	"@context": "https://schema.org",
	"@type": "Person",
	name: person.name,
	jobTitle: person.jobTitle,
	url: siteUrl.href,
	email: `mailto:${person.email}`,
	alumniOf: { "@type": "CollegeOrUniversity", name: person.alumniOf },
	address: { "@type": "PostalAddress", addressLocality: person.location },
	sameAs: socials
		.filter((social) => social.external)
		.map((social) => social.href),
});
