import { ReactNode } from 'react';
import { useInView } from '../hooks/useInView';

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: 'section' | 'div';
  id?: string;
}

/** Wraps content and adds scroll-triggered fade-in/slide-up when in view. */
export function AnimatedSection({
  children,
  className = '',
  delay = 0,
  as: Tag = 'section',
  id,
}: AnimatedSectionProps) {
  const { ref, inView } = useInView({ threshold: 0.08, triggerOnce: true });

  return (
    <Tag id={id} className={className.trim() || undefined}>
      <div
        ref={ref}
        className={`landing-animate-section ${inView ? 'landing-animate-visible' : ''}`.trim()}
        style={{ ['--animate-delay' as string]: `${delay}ms` }}
      >
        {children}
      </div>
    </Tag>
  );
}
