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
    const baseStyles = "inline-flex items-center justify-center rounded-none text-xs font-black uppercase tracking-[0.2em] transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold-500 disabled:pointer-events-none disabled:opacity-50 h-11 px-8 py-2 active:scale-[0.98]";
    const variants = {
        primary: "bg-dark-900 text-white hover:bg-gold-500 hover:text-white border border-transparent hover:border-gold-600",
        outline: "border border-dark-900 bg-transparent text-dark-900 hover:bg-dark-900 hover:text-white",
        ghost: "hover:bg-neutral-100 text-dark-900"
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
                "flex h-12 w-full rounded-none border-b-2 border-neutral-200 bg-transparent px-0 py-2 text-sm font-sans transition-all focus:border-gold-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-neutral-400 focus:placeholder:text-gold-500/50",
                className
            )}
            {...props}
        />
    );
});

export const Card = ({ className, children, ...props }: { className?: string; children: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("rounded-none border border-neutral-200 bg-white text-dark-900 shadow-sm", className)} {...props}>
        {children}
    </div>
);
