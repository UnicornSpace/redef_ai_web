"use client";

import type { Testimonial } from "@/lib/testimonials-data";
import {
	testimonialItems,
	testimonialsGridCopy,
} from "@/lib/testimonials-data";
import {
	TestimonialQuoteCard,
	TestimonialSectionHeader,
	TestimonialStagger,
	TestimonialStaggerItem,
} from "@/lib/testimonials-primitives";
import { ContentRail, SectionShell } from "@/components/layout-contract";

export function TestimonialsGridSection() {
	return (
		<SectionShell spacingMode="section">
			<ContentRail maxWidth="max-w-5xl" className="space-y-10">
				<TestimonialSectionHeader
					description={testimonialsGridCopy.description}
					title={testimonialsGridCopy.title}
				/>

				<TestimonialStagger className="grid gap-4 md:grid-cols-3">
					{testimonialItems.slice(0, 3).map((item: Testimonial) => (
						<TestimonialStaggerItem key={item.name}>
							<TestimonialQuoteCard item={item} />
						</TestimonialStaggerItem>
					))}
				</TestimonialStagger>
			</ContentRail>
		</SectionShell>
	);
}

export const TestimonialsSection = TestimonialsGridSection;
