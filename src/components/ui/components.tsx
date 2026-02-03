import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const Button = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'outline' | 'ghost' }
>(({ className, variant = 'primary', ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center rounded-lg text-sm font-semibold tracking-wide transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 disabled:pointer-events-none disabled:opacity-50 h-11 px-6 py-2 active:scale-95";
    const variants = {
        primary: "gold-gradient text-white shadow-[0_4px_14px_0_rgba(197,146,34,0.39)] hover:shadow-[0_6px_20px_rgba(197,146,34,0.23)] hover:scale-[1.02]",
        outline: "border-2 border-gold-500 bg-transparent shadow-sm hover:bg-gold-50 text-gold-600 font-bold",
        ghost: "hover:bg-gold-50 hover:text-gold-700 text-neutral-600"
    };

    return (
        <button
            ref={ref}
            className={cn(baseStyles, variants[variant], className)}
            {...props}
        />
    );
});

export const Input = React.forwardRef<
    HTMLInputElement,
    React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
    return (
        <input
            ref={ref}
            className={cn(
                "flex h-11 w-full rounded-lg border border-neutral-200 bg-white/50 px-4 py-2 text-sm transition-all focus:bg-white focus:border-gold-400 focus:ring-4 focus:ring-gold-500/10 outline-none disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-neutral-400",
                className
            )}
            {...props}
        />
    );
});

export const Card = ({ className, children, ...props }: { className?: string; children: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("rounded-2xl border border-neutral-100 bg-white text-neutral-950 shadow-sm", className)} {...props}>
        {children}
    </div>
);
