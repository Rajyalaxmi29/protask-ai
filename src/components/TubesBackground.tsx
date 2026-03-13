import React, { useEffect, useRef, useState } from 'react';

// Helper for random colors
const randomColors = (count: number) => {
    return new Array(count)
        .fill(0)
        .map(() => "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'));
};

interface TubesBackgroundProps {
    children?: React.ReactNode;
    className?: string;
    enableClickInteraction?: boolean;
}

export function TubesBackground({
    children,
    className,
    enableClickInteraction = true
}: TubesBackgroundProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const tubesRef = useRef<any>(null);

    useEffect(() => {
        let mounted = true;
        let cleanup: (() => void) | undefined;

        const initTubes = async () => {
            if (!canvasRef.current) return;

            try {
                // The CDN build bundles its own Three.js which conflicts with our npm 'three'
                // We temporarily remove the global THREE objects before import to suppress the warning
                const globalThree = (window as any).THREE;
                const globalThreeDunder = (window as any).__THREE__;

                if (globalThree) {
                    delete (window as any).THREE;
                }
                if (globalThreeDunder) {
                    delete (window as any).__THREE__;
                }

                // We use the specific build from the CDN as it contains the exact effect requested
                // Using native dynamic import which works in modern browsers
                // @ts-ignore
                const module = await import('https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js');
                const TubesCursor = module.default;

                // Restore global THREE if we had one
                if (globalThree) {
                    (window as any).THREE = globalThree;
                }
                if (globalThreeDunder) {
                    (window as any).__THREE__ = globalThreeDunder;
                }

                if (!mounted) return;

                const app = TubesCursor(canvasRef.current, {
                    tubes: {
                        colors: ["#8B5CF6", "#06B6D4", "#10B981"],
                        lights: {
                            intensity: 150,
                            colors: ["#8B5CF6", "#06B6D4", "#10B981", "#3B82F6"]
                        }
                    }
                });

                tubesRef.current = app;
                setIsLoaded(true);

                const handleResize = () => {
                };

                window.addEventListener('resize', handleResize);

                cleanup = () => {
                    window.removeEventListener('resize', handleResize);
                };

            } catch (error) {
                console.error("Failed to load TubesCursor:", error);
            }
        };

        initTubes();

        return () => {
            mounted = false;
            if (cleanup) cleanup();
            if (tubesRef.current?.destroy) tubesRef.current.destroy();
        };
    }, []);

    const handleClick = () => {
        if (!enableClickInteraction || !tubesRef.current) return;

        const colors = randomColors(3);
        const lightsColors = randomColors(4);

        tubesRef.current.tubes.setColors(colors);
        tubesRef.current.tubes.setLightsColors(lightsColors);
    };

    return (
        <div
            className={cn("relative w-full h-full overflow-hidden bg-[#030303]", className)}
            onClick={handleClick}
        >
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full block"
                style={{ touchAction: 'pan-y' }}
            />

            {/* Content Overlay */}
            <div className="relative z-10 w-full h-full pointer-events-none">
                {children}
            </div>
        </div>
    );
}

export default TubesBackground;

// Utility for class merging
function cn(...inputs: (string | undefined | null | false)[]) {
    return inputs.filter(Boolean).join(" ");
}
