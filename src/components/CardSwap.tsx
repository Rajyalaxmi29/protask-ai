import React, {
    Children,
    cloneElement,
    forwardRef,
    isValidElement,
    ReactElement,
    ReactNode,
    RefObject,
    useEffect,
    useMemo,
    useRef
} from 'react';
import gsap from 'gsap';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for merging tailwind classes safely
function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export interface CardSwapProps {
    width?: number | string;
    height?: number | string;
    cardDistance?: number;
    verticalDistance?: number;
    delay?: number;
    pauseOnHover?: boolean;
    onCardClick?: (idx: number) => void;
    skewAmount?: number;
    easing?: 'linear' | 'elastic';
    children: ReactNode;
}

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    customClass?: string;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(({ customClass, className, ...rest }, ref) => (
    <div
        ref={ref}
        {...rest}
        className={cn(
            "absolute top-1/2 left-1/2 rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)] backdrop-blur-2xl shadow-[0_0_30px_rgba(255,255,255,0.03)] [transform-style:preserve-3d] [will-change:transform] [backface-visibility:hidden]",
            customClass,
            className
        )}
    />
));

Card.displayName = 'Card';

type CardRef = RefObject<HTMLDivElement | null>;

interface Slot {
    x: number;
    y: number;
    z: number;
    zIndex: number;
}

const makeSlot = (i: number, distX: number, distY: number, total: number): Slot => ({
    x: i * distX,
    y: -i * distY,
    z: -i * distX * 1.5,
    zIndex: total - i
});

const placeNow = (el: HTMLElement, slot: Slot, skew: number) =>
    gsap.set(el, {
        x: slot.x,
        y: slot.y,
        z: slot.z,
        xPercent: -50,
        yPercent: -50,
        skewY: skew,
        transformOrigin: 'center center',
        zIndex: slot.zIndex,
        force3D: true
    });

export const CardSwap: React.FC<CardSwapProps> = ({
    width = 500,
    height = 400,
    cardDistance = 60,
    verticalDistance = 70,
    delay = 5000,
    pauseOnHover = false,
    onCardClick,
    skewAmount = 6,
    easing = 'elastic',
    children
}) => {
    const config =
        easing === 'elastic'
            ? {
                ease: 'elastic.out(0.6,0.9)',
                durDrop: 1.5,
                durMove: 1.5,
                durReturn: 1.5,
                promoteOverlap: 0.9,
                returnDelay: 0.05
            }
            : {
                ease: 'power1.inOut',
                durDrop: 0.8,
                durMove: 0.8,
                durReturn: 0.8,
                promoteOverlap: 0.45,
                returnDelay: 0.2
            };

    // Convert children to an array to handle refs properly
    const childArr = useMemo(() => {
        return Children.toArray(children).filter(child => isValidElement(child)) as ReactElement<CardProps>[];
    }, [children]);

    const refs = useMemo<CardRef[]>(() => childArr.map(() => React.createRef<HTMLDivElement>()), [childArr.length]);
    const order = useRef<number[]>(Array.from({ length: childArr.length }, (_, i) => i));
    const tlRef = useRef<gsap.core.Timeline | null>(null);
    const intervalRef = useRef<number>(0);
    const container = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (refs.length === 0) return;

        const total = refs.length;
        refs.forEach((r, i) => {
            if (r.current) {
                placeNow(r.current, makeSlot(i, cardDistance, verticalDistance, total), skewAmount);
            }
        });

        const swap = () => {
            if (order.current.length < 2) return;
            const [front, ...rest] = order.current;
            const elFront = refs[front].current;
            if (!elFront) return;

            const tl = gsap.timeline();
            tlRef.current = tl;

            tl.to(elFront, {
                y: '+=500',
                duration: config.durDrop,
                ease: config.ease
            });

            tl.addLabel('promote', `-=${config.durDrop * config.promoteOverlap}`);
            rest.forEach((idx, i) => {
                const el = refs[idx].current;
                if (!el) return;
                const slot = makeSlot(i, cardDistance, verticalDistance, refs.length);
                tl.set(el, { zIndex: slot.zIndex }, 'promote');
                tl.to(
                    el,
                    {
                        x: slot.x,
                        y: slot.y,
                        z: slot.z,
                        duration: config.durMove,
                        ease: config.ease
                    },
                    `promote+=${i * 0.15}`
                );
            });

            const backSlot = makeSlot(refs.length - 1, cardDistance, verticalDistance, refs.length);
            tl.addLabel('return', `promote+=${config.durMove * config.returnDelay}`);
            tl.call(
                () => {
                    gsap.set(elFront, { zIndex: backSlot.zIndex });
                },
                undefined,
                'return'
            );

            tl.to(
                elFront,
                {
                    x: backSlot.x,
                    y: backSlot.y,
                    z: backSlot.z,
                    duration: config.durReturn,
                    ease: config.ease
                },
                'return'
            );

            tl.call(() => {
                order.current = [...rest, front];
            });
        };

        intervalRef.current = window.setInterval(swap, delay);

        if (pauseOnHover && container.current) {
            const node = container.current;
            const pause = () => {
                tlRef.current?.pause();
                clearInterval(intervalRef.current);
            };
            const resume = () => {
                tlRef.current?.play();
                intervalRef.current = window.setInterval(swap, delay);
            };
            node.addEventListener('mouseenter', pause);
            node.addEventListener('mouseleave', resume);
            return () => {
                node.removeEventListener('mouseenter', pause);
                node.removeEventListener('mouseleave', resume);
                clearInterval(intervalRef.current);
            };
        }

        return () => clearInterval(intervalRef.current);
    }, [cardDistance, verticalDistance, delay, pauseOnHover, skewAmount, easing, refs]);

    const rendered = childArr.map((child, i) =>
        cloneElement(child, {
            key: i,
            ref: refs[i],
            style: { width, height, ...(child.props.style ?? {}) },
            onClick: (e: React.MouseEvent<HTMLDivElement>) => {
                child.props.onClick?.(e);
                onCardClick?.(i);
            }
        } as any)
    );

    return (
        <div
            ref={container}
            className="relative perspective-[1200px] transform-gpu mx-auto"
            style={{ width, height }}
        >
            <div className="absolute inset-0 [transform-style:preserve-3d]">
                {rendered}
            </div>
        </div>
    );
};

export default CardSwap;
