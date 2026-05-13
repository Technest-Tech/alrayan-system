'use client'

import { useState, useMemo } from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { whatsappLink } from '@/config/site'
import { faqs, faqCategories } from '@/content/faq'
import type { FaqCategory } from '@/content/faq'
import { Search, MessageCircle } from 'lucide-react'

export function FaqContent() {
  const [activeCategory, setActiveCategory] = useState<FaqCategory | 'All'>('All')
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return faqs.filter((faq) => {
      const matchesCategory =
        activeCategory === 'All' || faq.category === activeCategory
      const matchesSearch =
        !q || faq.q.toLowerCase().includes(q) || faq.a.toLowerCase().includes(q)
      return matchesCategory && matchesSearch
    })
  }, [activeCategory, searchQuery])

  const grouped = useMemo(() => {
    if (activeCategory !== 'All' || searchQuery) return null
    return faqCategories.map((cat) => ({
      category: cat,
      items: filtered.filter((f) => f.category === cat),
    }))
  }, [activeCategory, searchQuery, filtered])

  return (
    <div className="grid md:grid-cols-[220px_1fr] gap-10 items-start">
      {/* ── Category sidebar ── */}
      <nav
        aria-label="FAQ categories"
        className="md:sticky md:top-28 flex md:flex-col gap-2 flex-wrap"
      >
        <button
          onClick={() => setActiveCategory('All')}
          className={[
            'w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors',
            activeCategory === 'All'
              ? 'bg-secondary text-white'
              : 'text-primary hover:bg-cream',
          ].join(' ')}
        >
          All
        </button>
        {faqCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={[
              'w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors',
              activeCategory === cat
                ? 'bg-secondary text-white'
                : 'text-primary hover:bg-cream',
            ].join(' ')}
          >
            {cat}
          </button>
        ))}
      </nav>

      {/* ── Questions column ── */}
      <div>
        {/* Search input */}
        <div className="relative mb-8">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="search"
            placeholder="Search questions…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 h-12 rounded-xl border border-border-soft bg-white text-sm text-primary placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-colors"
          />
        </div>

        {/* No results */}
        {filtered.length === 0 && (
          <div className="text-center py-16 px-6">
            <MessageCircle
              className="size-10 text-muted-foreground/40 mx-auto mb-4"
              aria-hidden="true"
            />
            <p className="text-primary font-semibold mb-2">No questions found</p>
            <p className="text-muted-foreground text-sm mb-6">
              Try a different search term or browse all categories.
            </p>
            <a
              href={whatsappLink('Assalamu alaikum, I have a question I couldn\'t find in the FAQ.')}
              target="_blank"
              rel="noopener noreferrer"
              className="text-secondary font-semibold text-sm hover:underline"
            >
              Ask us on WhatsApp →
            </a>
          </div>
        )}

        {/* Grouped view (All + no search) */}
        {grouped &&
          grouped
            .filter((g) => g.items.length > 0)
            .map(({ category, items }) => (
              <div key={category} className="mb-10">
                <h3 className="text-xs font-bold uppercase tracking-widest text-secondary mb-4">
                  {category}
                </h3>
                <div className="border border-border-soft rounded-2xl overflow-hidden divide-y divide-border-soft">
                  <Accordion multiple>
                    {items.map((faq) => (
                      <AccordionItem key={faq.id} value={faq.id}>
                        <AccordionTrigger className="px-6 py-4 text-sm font-semibold text-primary hover:no-underline">
                          {faq.q}
                        </AccordionTrigger>
                        <AccordionContent className="px-6">
                          <p className="text-muted-foreground text-sm leading-relaxed">
                            {faq.a}
                          </p>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </div>
            ))}

        {/* Flat view (filtered by category or search) */}
        {!grouped && filtered.length > 0 && (
          <div className="border border-border-soft rounded-2xl overflow-hidden divide-y divide-border-soft">
            <Accordion multiple>
              {filtered.map((faq) => (
                <AccordionItem key={faq.id} value={faq.id}>
                  <AccordionTrigger className="px-6 py-4 text-sm font-semibold text-primary hover:no-underline">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="px-6">
                    <p className="text-muted-foreground text-sm leading-relaxed">{faq.a}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}
      </div>
    </div>
  )
}
