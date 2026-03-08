'use client';

interface MenuInsightsProps {
  title: string;
  summary: string;
  description: string;
  details: string[];
  badges: string[];
}

export default function MenuInsights({ title, summary, description, details, badges }: MenuInsightsProps) {
  return (
    <div className="w-full max-w-2xl mx-auto px-5 pb-3">
      <div className="rounded-[24px] bg-[linear-gradient(135deg,#FFFFFF_0%,#F7FAFF_100%)] border border-[#DCE8FF] shadow-[0_2px_14px_rgba(49,130,246,0.08)] p-5">
        <p className="text-[12px] font-bold tracking-[0.18em] text-[#7B8DB0]">TODAY&apos;S READ</p>
        <h2 className="mt-2 text-[20px] font-bold tracking-tight text-[#191F28]">{title}</h2>
        <p className="mt-2 text-[14px] font-semibold text-[#3565B2]">{summary}</p>
        <p className="mt-3 text-[14px] leading-6 text-[#4E5968]">{description}</p>
        <div className="mt-3 space-y-1.5">
          {details.map((detail) => (
            <p key={detail} className="text-[13px] leading-6 text-[#4E5968]">
              {detail}
            </p>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {badges.map((badge) => (
            <span
              key={badge}
              className="rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-[#3565B2] border border-[#DCE8FF]"
            >
              {badge}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
