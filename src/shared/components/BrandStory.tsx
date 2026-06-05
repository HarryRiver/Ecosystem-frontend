'use client';

import { useTranslation } from 'react-i18next';

interface BrandStoryProps {
  onBookingClick: () => void;
}

export default function BrandStory({ onBookingClick }: BrandStoryProps) {
  const { t } = useTranslation();

  const storyBlocks = [
    {
      eyebrow: t('brandStory.about.eyebrow'),
      title: t('brandStory.about.title'),
      description: t('brandStory.about.desc'),
    },
    {
      eyebrow: t('brandStory.mission.eyebrow'),
      title: t('brandStory.mission.title'),
      description: t('brandStory.mission.desc'),
    },
    {
      eyebrow: t('brandStory.difference.eyebrow'),
      title: t('brandStory.difference.title'),
      description: t('brandStory.difference.desc'),
    },
  ];

  const uspCards = [
    {
      icon: '♻️',
      title: t('brandStory.usp.handling.title'),
      text: t('brandStory.usp.handling.text'),
    },
    {
      icon: '⚙️',
      title: t('brandStory.usp.operation.title'),
      text: t('brandStory.usp.operation.text'),
    },
    {
      icon: '🔎',
      title: t('brandStory.usp.transparency.title'),
      text: t('brandStory.usp.transparency.text'),
    },
  ];

  return (
    <section id="about" className="bg-[#F5FBF6] py-20">
      <div className="container mx-auto px-4">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="grid gap-5">
            {storyBlocks.map((block) => (
              <article
                key={block.eyebrow}
                className="rounded-[28px] border border-[#D6EEDD] bg-white p-7 shadow-[0_20px_60px_rgba(15,61,46,0.08)]"
              >
                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#2F855A]">
                  {block.eyebrow}
                </p>
                <h2 className="mb-3 text-2xl font-bold text-[#103B2D] md:text-3xl">
                  {block.title}
                </h2>
                <p className="max-w-2xl text-base leading-7 text-[#476458]">
                  {block.description}
                </p>
              </article>
            ))}
          </div>

          <aside className="rounded-[32px] border border-[#CFE7D7] bg-[#103B2D] p-8 text-white shadow-[0_24px_80px_rgba(16,59,45,0.24)]">
            <div className="mb-8">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#8DE0A6]">
                Why EcoCollect
              </p>
              <h3 className="text-3xl font-bold leading-tight">
                {t('brandStory.sidebarTitle')}
              </h3>
            </div>

            <div className="space-y-4">
              {uspCards.map((card) => (
                <div
                  key={card.title}
                  className="rounded-3xl border border-white/10 bg-white/[0.08] p-5 backdrop-blur-sm"
                >
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#8DE0A6]/15 text-2xl">
                    {card.icon}
                  </div>
                  <h4 className="mb-2 text-lg font-semibold">{card.title}</h4>
                  <p className="text-sm leading-6 text-white/75">{card.text}</p>
                </div>
              ))}
            </div>

            <button
              onClick={onBookingClick}
              className="mt-8 w-full rounded-full bg-[#8DE0A6] px-6 py-4 text-sm font-bold text-[#103B2D] transition-transform duration-300 hover:-translate-y-0.5"
            >
              {t('brandStory.cta')}
            </button>
          </aside>
        </div>
      </div>
    </section>
  );
}
