import { PlusIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type DecorIconProps = {
	className?: string;
	position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
};

export function DecorIcon({
	className,
	position = "top-left",
}: DecorIconProps) {
	return (
		<span
			aria-hidden="true"
			className={cn(
				"pointer-events-none absolute flex size-4 items-center justify-center text-border",
				position === "top-left" && "-top-2 -left-2",
				position === "top-right" && "-top-2 -right-2",
				position === "bottom-left" && "-bottom-2 -left-2",
				position === "bottom-right" && "-right-2 -bottom-2",
				className,
			)}
		>
			<PlusIcon className="size-3" strokeWidth={1.5} />
		</span>
	);
}