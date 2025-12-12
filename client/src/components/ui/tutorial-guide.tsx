import { useState, useEffect } from "react";
import { Drawer } from "vaul";
import { Button } from "@/components/ui/button";
import { HelpCircle, ChevronRight, Check } from "lucide-react";
import { Card } from "@/components/ui/card";

export function TutorialGuide() {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState(1);

    useEffect(() => {
        // Check if user has seen the tutorial
        const hasSeenTutorial = localStorage.getItem("easysplit-tutorial-seen");
        if (!hasSeenTutorial) {
            // Small delay to let the app load
            setTimeout(() => setOpen(true), 1000);
        }
    }, []);

    const handleClose = () => {
        setOpen(false);
        localStorage.setItem("easysplit-tutorial-seen", "true");
    };

    const nextStep = () => {
        if (step < 3) {
            setStep(step + 1);
        } else {
            handleClose();
        }
    };

    return (
        <Drawer.Root open={open} onOpenChange={setOpen}>
            <Drawer.Trigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 z-40 transition-transform active:scale-95"
                    onClick={() => setStep(1)} // Reset to step 1 when manually opened
                >
                    <HelpCircle className="h-6 w-6" />
                </Button>
            </Drawer.Trigger>
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
                <Drawer.Content className="fixed bottom-0 left-0 right-0 max-h-[90vh] z-50 rounded-t-[10px] outline-none">
                    <div className="bg-background rounded-t-[10px] p-4 max-w-md mx-auto shadow-2xl">
                        <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-6" />

                        <div className="px-4 pb-8 space-y-6">
                            <div className="text-center space-y-2">
                                <h2 className="text-2xl font-bold">Welcome to Easy Split! 👋</h2>
                                <p className="text-muted-foreground">
                                    Split bills fairly in seconds. Here's how it works:
                                </p>
                            </div>

                            <div className="relative overflow-hidden min-h-[160px]">
                                {step === 1 && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <Card className="p-4 bg-primary/5 border-primary/20 flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xl">1</div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-lg">Add Items</h3>
                                                <p className="text-sm text-muted-foreground">Add manually or enter a code if your restaurant supports it.</p>
                                            </div>
                                        </Card>
                                        <div className="flex justify-center">
                                            <div className="flex gap-1">
                                                <div className="w-2 h-2 rounded-full bg-primary" />
                                                <div className="w-2 h-2 rounded-full bg-muted" />
                                                <div className="w-2 h-2 rounded-full bg-muted" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {step === 2 && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <Card className="p-4 bg-primary/5 border-primary/20 flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xl">2</div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-lg">Add People</h3>
                                                <p className="text-sm text-muted-foreground">Add everyone who is sharing the bill.</p>
                                            </div>
                                        </Card>
                                        <div className="flex justify-center">
                                            <div className="flex gap-1">
                                                <div className="w-2 h-2 rounded-full bg-muted" />
                                                <div className="w-2 h-2 rounded-full bg-primary" />
                                                <div className="w-2 h-2 rounded-full bg-muted" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {step === 3 && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <Card className="p-4 bg-primary/5 border-primary/20 flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xl">3</div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-lg">Assign & Split</h3>
                                                <p className="text-sm text-muted-foreground">Tap '+' to assign items. Use 'Split Evenly' for shared dishes!</p>
                                            </div>
                                        </Card>
                                        <div className="flex justify-center">
                                            <div className="flex gap-1">
                                                <div className="w-2 h-2 rounded-full bg-muted" />
                                                <div className="w-2 h-2 rounded-full bg-muted" />
                                                <div className="w-2 h-2 rounded-full bg-primary" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button variant="outline" className="flex-1 h-12" onClick={handleClose}>
                                    Skip
                                </Button>
                                <Button className="flex-[2] h-12" onClick={nextStep}>
                                    {step === 3 ? (
                                        <>
                                            Get Started <Check className="ml-2 h-4 w-4" />
                                        </>
                                    ) : (
                                        <>
                                            Next <ChevronRight className="ml-2 h-4 w-4" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
}
