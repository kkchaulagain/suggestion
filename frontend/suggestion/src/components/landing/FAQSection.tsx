import Accordion from '../ui/Accordion'
import SectionHeading from './SectionHeading'

export interface FAQItem {
  question: string
  answer: string
}

export interface FAQSectionProps {
  items: FAQItem[]
  heading?: string
  subheading?: string
}

export default function FAQSection({ items, heading, subheading }: FAQSectionProps) {
  if (items.length === 0) return null
  const accordionItems = items.map((item, i) => ({
    id: `faq-${i}`,
    title: item.question,
    content: <p className="text-stone-600 dark:text-stone-400">{item.answer}</p>,
  }))
  return (
    <div className="space-y-8">
      {(heading || subheading) ? (
        <SectionHeading title={heading ?? ''} subtitle={subheading} align="center" />
      ) : null}
      <div className="mx-auto max-w-2xl">
        <Accordion items={accordionItems} defaultOpenId={accordionItems[0]?.id} />
      </div>
    </div>
  )
}
