
import { cn } from "@/lib/utils";

interface BrandLogoProps {
    className?: string;
    size?: "sm" | "md" | "lg" | "xl";
}

export function BrandLogo({ className, size = "md" }: BrandLogoProps) {
    const sizeClasses = {
        sm: "text-lg",
        md: "text-xl",
        lg: "text-2xl",
        xl: "text-3xl",
    };

    return (
        <span className={cn("font-heading italic tracking-tighter", sizeClasses[size], className)}>
            EasySplit 🍔
        </span>
    );
}
