
import { BrandLogo } from "./brand-logo";

export function AppLoader() {
    return (
        <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
            <div className="flex flex-col items-center gap-4 animate-pulse">
                <BrandLogo size="xl" />
                <p className="text-muted-foreground text-sm font-medium">Loading...</p>
            </div>
        </div>
    );
}
