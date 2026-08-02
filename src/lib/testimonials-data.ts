export type Testimonial = {
	quote: string;
	name: string;
	role: string;
	company: string;
};

export const testimonialItems: Testimonial[] = [
	{
		quote:
			"We installed six hero blocks in an afternoon — motion felt authored, not pasted from a template kit.",
		name: "Sarah Chen",
		role: "VP Product",
		company: "Northwind",
	},
	{
		quote:
			"Copy Prompt handoff cut our design-to-registry loop in half. Devs stopped re-explaining spacing tokens.",
		name: "Marcus Webb",
		role: "Engineering Lead",
		company: "Vertex",
	},
	{
		quote:
			"The Pro registry paid for itself the first week — one pricing block replaced a contractor sprint.",
		name: "Elena Rossi",
		role: "COO",
		company: "Lumen",
	},
	{
		quote:
			"Preview-before-install is the feature. We ship landing pages without gambling on block quality.",
		name: "James Okonkwo",
		role: "Design Director",
		company: "Atlas",
	},
	{
		quote:
			"Motion tags map to real patterns in our codebase — onboarding designers finally speaks dev language.",
		name: "Priya Nair",
		role: "Head of Design",
		company: "Relay",
	},
	{
		quote:
			"We replaced three SaaS section libraries with Nusaiba. One CLI, one motion vocabulary, zero glue.",
		name: "Tomás Álvarez",
		role: "Founder",
		company: "Parcel",
	},
];

export const testimonialsGridCopy = {
	title: "Loved by product teams",
	description: "Real feedback from teams shipping registry-native landing pages.",
} as const;

export const testimonialsSpotlightCopy = {
	eyebrow: "Social proof",
	title: "Teams ship faster with the registry",
} as const;

export const testimonialsMarqueeCopy = {
	title: "What builders say",
	description: "Rolling quotes from teams who install blocks instead of rebuilding sections.",
} as const;

export const testimonialsSplitCopy = {
	title: "Featured story",
	description: "One quote up front — a short stack of voices beside it.",
} as const;

export const testimonialsFeaturedCopy = {
	eyebrow: "Customer story",
	title: "One install changed their launch timeline",
	metric: "2,400+",
	metricLabel: "blocks installed last quarter",
} as const;

export const testimonialsListCopy = {
	title: "Voices from the catalog",
	description: "Compact rows for dense social proof without a carousel.",
} as const;

export const testimonialsMetricCopy = {
	title: "Proof in the numbers",
	description: "Teams report faster ship loops after standardizing on registry blocks.",
} as const;

export const testimonialsBentoCopy = {
	title: "Wall of praise",
	description: "Asymmetric bento — one flagship quote with supporting voices.",
} as const;

export const testimonialsFilmstripCopy = {
	title: "Swipe the quotes",
	description: "Horizontal filmstrip with scroll-snap — pause on the story that fits.",
} as const;

export const testimonialsFramedCopy = {
	eyebrow: "Pro customers",
	title: "Editorial proof panel",
	description: "Framed quote cycle for premium landing pages — slow, intentional, readable.",
} as const;
