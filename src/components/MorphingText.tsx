import { useState, useEffect } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export interface MorphingTextProps {
    words: string[];
    className?: string;
    interval?: number;
}

export const MorphingText = ({
    words,
    className,
    interval = 3000
}: MorphingTextProps) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [displayText, setDisplayText] = useState("");
    const [morphProgress, setMorphProgress] = useState(0);

    const currentWord = words[currentIndex];
    // Guard against empty words array
    const nextWord = words.length > 0 ? words[(currentIndex + 1) % words.length] : "";

    useEffect(() => {
        if (!words || words.length === 0) return;

        // Morph animation
        const morphDuration = 800;
        const steps = 20;
        let step = 0;

        const morphInterval = setInterval(() => {
            step++;
            const progress = step / steps;
            setMorphProgress(progress);

            if (progress < 0.5) {
                // Morphing out
                const charCount = Math.floor(currentWord.length * (1 - progress * 2));
                setDisplayText(currentWord.slice(0, charCount));
            } else {
                // Morphing in
                const charCount = Math.floor(nextWord.length * ((progress - 0.5) * 2));
                setDisplayText(nextWord.slice(0, charCount));
            }

            if (step >= steps) {
                clearInterval(morphInterval);
                setDisplayText(nextWord);
            }
        }, morphDuration / steps);

        const wordTimeout = setTimeout(() => {
            setCurrentIndex((currentIndex + 1) % words.length);
        }, interval);

        return () => {
            clearInterval(morphInterval);
            clearTimeout(wordTimeout);
        };
    }, [currentIndex, currentWord, nextWord, interval, words, words.length]);

    return (
        <div className={cn("relative inline-block", className)}>
            <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-[#F8FAFC] to-[#94A3B8]">
                {displayText}
                <span className="inline-block w-0.5 h-[1em] bg-gradient-to-b from-[#F8FAFC] to-[#94A3B8] animate-pulse ml-1 align-middle opacity-50" />
            </span>
        </div>
    );
};
