import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useContent } from '../context/ContentContext.tsx';

export const FaqSection: React.FC = () => {
  const { content } = useContent();
  const { faqs } = content;
  const [openId, setOpenId] = useState<string | null>(faqs[0]?.id || null);

  return (
    <section className="py-20 bg-stone-100/70 dark:bg-stone-900/40 border-b border-stone-200/80 dark:border-stone-800/80">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="text-xs uppercase font-bold tracking-widest text-amber-700 dark:text-amber-400 mb-2">
            Clear Answers
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100 font-serif">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-stone-600 dark:text-stone-400 text-sm sm:text-base">
            Everything you need to know about building a house in Chennai with VSHN Builders.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div
                key={faq.id}
                className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-800 overflow-hidden shadow-xs transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : faq.id)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 focus:outline-none"
                >
                  <span className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-stone-500 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-amber-500' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed border-t border-stone-100 dark:border-stone-800/60">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
