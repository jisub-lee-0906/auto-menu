'use client';

import React from 'react';

interface MenuSlotProps {
    title: string;
    menuItem: string;
    isLocked: boolean;
    onToggleLock: () => void;
    onRefresh: () => void;
    onExclude?: () => void;
    className?: string; // allow external grid positioning
}

export default function MenuSlot({
    title,
    menuItem,
    isLocked,
    onToggleLock,
    onRefresh,
    onExclude,
    className = '',
}: MenuSlotProps) {
    return (
        <div
            className={`
                group relative flex flex-col justify-between p-5 
                rounded-[24px] transition-all duration-200 ease-spring
                ${isLocked
                    ? 'bg-[#F2F4F6] ring-inset ring-2 ring-[#E5E8EB]'
                    : 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:-translate-y-1 active:scale-[0.96]'
                }
                ${className}
            `}
        >
            {/* Header: Title & Controls */}
            <div className="relative mb-2 min-h-[3.5rem] pt-10">
                <div className="flex flex-col min-w-0 pr-16">
                    {/* Subtitle is hidden or very subtle in minimal design, treating Title as the main label */}
                    <h3 className="text-[14px] font-semibold text-[#6B7684] tracking-tight leading-snug break-keep md:whitespace-nowrap">
                        {title}
                    </h3>
                </div>

                <div className="absolute top-0 right-0 flex gap-1 shrink-0 z-10">
                    {/* Lock Button */}
                    <button
                        onClick={(e) => { e.stopPropagation(); onToggleLock(); }}
                        className={`p-1.5 rounded-full transition-colors ${isLocked ? 'bg-[#FFEDED] text-[#F04452]' : 'hover:bg-[#F2F4F6] text-[#B0B8C1]'}`}
                        aria-label={isLocked ? "Unlock" : "Lock"}
                    >
                        {isLocked ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
                        )}
                    </button>

                    {/* Refresh Button */}
                    {!isLocked && (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); onRefresh(); }}
                                className="p-1.5 rounded-full hover:bg-[#F2F4F6] text-[#B0B8C1] hover:text-[#3182F6] transition-colors"
                                aria-label="Refresh Item"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            </button>
                            {onExclude ? (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onExclude(); }}
                                    className="p-1.5 rounded-full hover:bg-[#FFF4E5] text-[#B0B8C1] hover:text-[#F97316] transition-colors"
                                    aria-label="Exclude Item"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            ) : null}
                        </>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-grow flex items-center justify-center py-0.5 w-full">
                <p className={`
                    w-full text-center font-bold leading-normal break-words pb-1 -translate-y-[0.875rem]
                    ${isLocked ? 'text-[#8B95A1]' : 'text-[#191F28]'}
                    text-[15px]
                    line-clamp-4
                `}>
                    {menuItem || <span className="text-[#D1D6DB] animate-pulse">...</span>}
                </p>
            </div>

            <style jsx>{`
                .ease-spring { transition-timing-function: cubic-bezier(0.175, 0.885, 0.32, 1.275); }
            `}</style>
        </div>
    );
}
