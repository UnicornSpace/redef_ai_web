"use client";

import { StarIcon } from "lucide-react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { useRef, type ReactNode } from "react";
import { defaultSpring, motionStagger, motionViewport } from "@/lib/motion-tokens";
import { cn } from "@/lib/utils";
import type { Testimonial } from "./testimonials-data";

const spring = { type: "spring" as const, duration: 0.3, bounce: 0 };

export function getInitials(name: string) {
	return name
		.split(/\s+/)
		.map((part) => part[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();
}

export function useTestimonialItemVariants() {
	const reduceMotion = useReducedMotion();

	return reduceMotion
		? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
		: {
				hidden: { opacity: 0, filter: "blur(4px)", y: 8 },
				visible: { opacity: 1, filter: "blur(0px)", y: 0, transition: spring },
			};
}

export function TestimonialStagger({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	const ref = useRef<HTMLDivElement>(null);
	const inView = useInView(ref, motionViewport);

	return (
		<motion.div
			animate={inView ? "visible" : "hidden"}
			className={className}
			initial="hidden"
			ref={ref}
			variants={{
				hidden: {},
				visible: { transition: { staggerChildren: motionStagger.item, delayChildren: 0.04 } },
			}}
		>
			{children}
		</motion.div>
	);
}

export function TestimonialStaggerItem({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	const itemVariants = useTestimonialItemVariants();

	return (
		<motion.div className={className} variants={itemVariants}>
			{children}
		</motion.div>
	);
}

export function TestimonialSectionHeader({
	eyebrow,
	title,
	description,
	className,
	align = "center",
}: {
	eyebrow?: string;
	title: string;
	description?: string;
	className?: string;
	align?: "center" | "left";
}) {
	return (
		<TestimonialStagger
			className={cn(
				"max-w-2xl",
				align === "center" ? "mx-auto text-center" : "text-left",
				className,
			)}
		>
			{eyebrow ? (
				<TestimonialStaggerItem>
					<p className="text-muted-foreground text-sm">{eyebrow}</p>
				</TestimonialStaggerItem>
			) : null}
			<TestimonialStaggerItem>
				<h2 className="mt-2 text-balance font-medium text-2xl tracking-tight md:text-3xl">
					{title}
				</h2>
			</TestimonialStaggerItem>
			{description ? (
				<TestimonialStaggerItem>
					<p className="mt-3 text-pretty text-muted-foreground text-sm leading-relaxed md:text-base">
						{description}
					</p>
				</TestimonialStaggerItem>
			) : null}
		</TestimonialStagger>
	);
}

export function TestimonialStars({ className }: { className?: string }) {
	return (
		<div className={cn("flex gap-0.5 text-primary", className)} aria-hidden>
			{Array.from({ length: 5 }).map((_, index) => (
				<StarIcon className="size-3.5 fill-current" key={index} />
			))}
		</div>
	);
}

export function TestimonialAvatar({
	name,
	className,
	size = "md",
}: {
	name: string;
	className?: string;
	size?: "sm" | "md";
}) {
	const box = size === "sm" ? "size-8 text-[10px]" : "size-10 text-xs";

	return (
		<span
			className={cn(
				"flex shrink-0 items-center justify-center rounded-full bg-muted/40 font-medium text-foreground/80",
				box,
				className,
			)}
		>
			{getInitials(name)}
		</span>
	);
}

export function TestimonialQuoteCard({
	item,
	className,
	compact = false,
}: {
	item: Testimonial;
	className?: string;
	compact?: boolean;
}) {
	return (
		<blockquote
			className={cn(
				"flex h-full flex-col justify-between rounded-xl bg-background p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.2)]",
				className,
			)}
		>
			<div>
				<TestimonialStars />
				<p
					className={cn(
						"mt-4 text-pretty leading-relaxed",
						compact ? "text-sm" : "text-sm md:text-base",
					)}
				>
					&ldquo;{item.quote}&rdquo;
				</p>
			</div>
			<footer className="mt-5 flex items-center gap-3 border-border border-t pt-4">
				<TestimonialAvatar name={item.name} size="sm" />
				<div className="min-w-0">
					<p className="font-medium text-sm">{item.name}</p>
					<p className="truncate text-muted-foreground text-xs">
						{item.role}, {item.company}
					</p>
				</div>
			</footer>
		</blockquote>
	);
}

export function TestimonialAttribution({
	item,
	className,
}: {
	item: Testimonial;
	className?: string;
}) {
	return (
		<p className={cn("text-muted-foreground text-sm", className)}>
			<span className="font-medium text-foreground">{item.name}</span>
			{" · "}
			{item.role}, {item.company}
		</p>
	);
}

export function TestimonialSelector({
	items,
	active,
	onSelect,
	className,
	chipClassName,
}: {
	items: Testimonial[];
	active: number;
	onSelect: (index: number) => void;
	className?: string;
	chipClassName?: string;
}) {
	return (
		<div className={cn("flex flex-wrap items-center justify-center gap-2", className)}>
			{items.map((item, index) => {
				const isActive = index === active;

				return (
					<button
						aria-label={`Show testimonial from ${item.name}`}
						aria-pressed={isActive}
						className={cn(
							"flex min-h-11 items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-[background-color,opacity,transform] active:scale-[0.96]",
							chipClassName,
							isActive
								? "bg-muted/50 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
								: "opacity-60 hover:opacity-100",
						)}
						key={item.name}
						onClick={() => onSelect(index)}
						type="button"
					>
						<TestimonialAvatar name={item.name} size="sm" />
						<span className="hidden min-w-0 sm:block">
							<span className="block font-medium text-xs">{item.name}</span>
							<span className="block text-[10px] text-muted-foreground">{item.company}</span>
						</span>
					</button>
				);
			})}
		</div>
	);
}

export function TestimonialQuoteReveal({
	item,
	className,
}: {
	item: Testimonial;
	className?: string;
}) {
	return (
		<motion.div
			animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
			className={cn("text-center", className)}
			exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
			initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
			key={item.name}
			transition={defaultSpring}
		>
			<TestimonialStars className="justify-center" />
			<p className="mt-6 text-balance font-medium text-xl leading-relaxed tracking-tight md:text-2xl">
				&ldquo;{item.quote}&rdquo;
			</p>
			<TestimonialAttribution className="mt-6" item={item} />
		</motion.div>
	);
}
