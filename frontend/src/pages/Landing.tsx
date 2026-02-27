import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AnimatedSection } from '../components/AnimatedSection';
import { getImageUrl, imageProxyOnError } from '../utils/imageProxy';
import { API_BASE } from '../utils/env';
import './Landing.css';

interface LandingData {
  hero: {
    title: string;
    subtitle: string;
    backgroundImageUrl?: string;
    backgroundImageUrls?: string[];
    primaryBackgroundIndex?: number;
    backgroundVideoUrl?: string;
    ctaText: string;
    ctaLink: string;
    introText: string;
  } | null;
  gallery: Array<{ _id: string; imageUrl: string; title?: string; eventType: string }>;
  offers: Array<{ _id: string; title: string; description: string; imageUrl: string; price: number; originalPrice?: number; currency: string; features?: string[] }>;
  locations: Array<{
    _id: string;
    name: string;
    address: string;
    mapEmbedUrl: string;
    phone?: string;
    email?: string;
    hours: Array<{ day: string; open: string; close: string; isClosed: boolean }>;
  }>;
  testimonials: Array<{ _id: string; clientName: string; clientImageUrl?: string; text: string; eventType?: string; rating?: number }>;
  faq: Array<{ _id: string; question: string; answer: string }>;
  blog: Array<{ _id: string; title: string; excerpt: string; coverImageUrl: string; slug: string }>;
  siteSettings: {
    siteName: string;
    phone?: string;
    email?: string;
    mapLink?: string;
    facebookUrl?: string;
    instagramUrl?: string;
    twitterUrl?: string;
    whatsappNumber?: string;
    footerText?: string;
  } | null;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  wedding: 'أعراس',
  engagement: 'خطوبة',
  private_events: 'مناسبات خاصة',
};

/** Extract the embed URL from a raw URL or pasted iframe HTML so the map always renders. */
function getMapEmbedSrc(value: string | undefined): string {
  if (!value || !value.trim()) return '';
  const trimmed = value.trim();
  const srcMatch = trimmed.match(/src\s*=\s*["']([^"']+)["']/i);
  if (srcMatch) return srcMatch[1].trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return trimmed;
}

/** Week days for display (order: Sunday=0 to Saturday=6, matches getDay()). */
const WEEK_DAY_LABELS: Record<string, string> = {
  sunday: 'الأحد',
  monday: 'الإثنين',
  tuesday: 'الثلاثاء',
  wednesday: 'الأربعاء',
  thursday: 'الخميس',
  friday: 'الجمعة',
  saturday: 'السبت',
};
const WEEK_DAY_ORDER = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/* Location info icons (inline SVG for consistency, no extra deps) */
const IconLocation = () => (
  <svg className="landing-location-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
const IconPhone = () => (
  <svg className="landing-location-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);
const IconEmail = () => (
  <svg className="landing-location-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);
const IconClock = () => (
  <svg className="landing-location-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

function getSortedHours(hours: Array<{ day: string; open: string; close: string; isClosed: boolean }> | undefined) {
  if (!hours?.length) return [];
  const byDay = new Map(hours.map((h) => [h.day.toLowerCase(), h]));
  return WEEK_DAY_ORDER.map((key) => byDay.get(key)).filter(Boolean) as Array<{ day: string; open: string; close: string; isClosed: boolean }>;
}

function isToday(dayKey: string): boolean {
  const today = new Date().getDay();
  const key = dayKey.toLowerCase();
  return WEEK_DAY_ORDER[today] === key;
}

export default function Landing() {
  const [data, setData] = useState<LandingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [galleryFilter, setGalleryFilter] = useState<string>('all');
  const [offerIndex, setOfferIndex] = useState(0);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [faqOpen, setFaqOpen] = useState<string | null>(null);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    axios.get<LandingData>(`${API_BASE}/landing`).then((res) => {
      setData(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filteredGallery = data?.gallery?.filter((i) => galleryFilter === 'all' || i.eventType === galleryFilter) ?? [];
  const offers = data?.offers ?? [];
  const testimonials = data?.testimonials ?? [];
  const faq = data?.faq ?? [];
  const blog = data?.blog ?? [];
  const hero = data?.hero;
  const settings = data?.siteSettings;
  const locations = data?.locations ?? [];
  // Hero background slider (when no video): use hero images (primary first), then fallback to legacy single URL
  const heroSlides = useMemo(() => {
    const urls = hero?.backgroundImageUrls;
    if (Array.isArray(urls) && urls.length > 0) {
      const primary = Math.min(hero?.primaryBackgroundIndex ?? 0, urls.length - 1);
      const ordered = [urls[primary], ...urls.slice(0, primary), ...urls.slice(primary + 1)].filter(Boolean);
      return ordered;
    }
    if (hero?.backgroundImageUrl) return [hero.backgroundImageUrl];
    return [];
  }, [hero?.backgroundImageUrls, hero?.primaryBackgroundIndex, hero?.backgroundImageUrl]);
  const [heroSlideIndex, setHeroSlideIndex] = useState(0);
  useEffect(() => {
    if (hero?.backgroundVideoUrl || heroSlides.length <= 1) return;
    const t = setInterval(() => setHeroSlideIndex((i) => (i + 1) % heroSlides.length), 5000);
    return () => clearInterval(t);
  }, [hero?.backgroundVideoUrl, heroSlides.length]);

  // Offer carousel auto-advance
  useEffect(() => {
    if (offers.length <= 1) return;
    const t = setInterval(() => setOfferIndex((i) => (i + 1) % offers.length), 5000);
    return () => clearInterval(t);
  }, [offers.length]);

  // Testimonials carousel auto-advance
  useEffect(() => {
    if (testimonials.length <= 1) return;
    const t = setInterval(() => setTestimonialIndex((i) => (i + 1) % testimonials.length), 6000);
    return () => clearInterval(t);
  }, [testimonials.length]);

  if (loading) {
    return (
      <div className="landing-loading">
        <div className="landing-spinner" />
        <p>جاري التحميل...</p>
      </div>
    );
  }

  const closeNav = () => setNavOpen(false);

  return (
    <div className="landing">
      {/* Header / Navbar */}
      <nav className="landing-nav" aria-label="القائمة الرئيسية">
        <div className="landing-nav-inner">
          <Link to="/" className="landing-nav-brand" onClick={closeNav}>
            {settings?.siteName || 'استوديو العمري'}
          </Link>
          <button
            type="button"
            className="landing-nav-toggle"
            onClick={() => setNavOpen((o) => !o)}
            aria-expanded={navOpen}
            aria-controls="landing-nav-menu"
            aria-label={navOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
          >
            <span className="landing-nav-toggle-bar" />
            <span className="landing-nav-toggle-bar" />
            <span className="landing-nav-toggle-bar" />
          </button>
          <div
            id="landing-nav-menu"
            className={`landing-nav-menu ${navOpen ? 'open' : ''}`}
          >
            <a href="#offers" onClick={closeNav}>العروض</a>
            <Link to="/booking" onClick={closeNav}>الحجز</Link>
            <a href="#gallery" onClick={closeNav}>المعرض</a>
            <a href="#locations" onClick={closeNav}>الموقع</a>
            <a href="#faq" onClick={closeNav}>الأسئلة الشائعة</a>
            <Link to="/login" onClick={closeNav} className="landing-nav-login">تسجيل الدخول</Link>
            <Link to="/booking" className="landing-nav-cta" onClick={closeNav}>احجز الآن</Link>
          </div>
        </div>
      </nav>
      <div
        className={`landing-nav-overlay ${navOpen ? 'visible' : ''}`}
        onClick={closeNav}
        aria-hidden="true"
      />

      {/* Sticky booking CTA (kept for quick access when scrolled) */}
      <Link to="/booking" className="landing-cta-sticky">
        احجز الآن
      </Link>

      {/* Hero – single full-bleed div: background media + overlay + content */}
      <header className="landing-hero">
        <div className="landing-hero-inner">
          {hero?.backgroundVideoUrl ? (
            <video className="landing-hero-media-video" autoPlay muted loop playsInline>
              <source src={hero.backgroundVideoUrl} type="video/mp4" />
            </video>
          ) : heroSlides.length > 0 ? (
            <div className="landing-hero-media-slider">
              {heroSlides.map((url, i) => (
                <div
                  key={`${url}-${i}`}
                  className={`landing-hero-media-slide ${i === heroSlideIndex ? 'active' : ''}`}
                  style={{ backgroundImage: `url(${getImageUrl(url)})` }}
                />
              ))}
            </div>
          ) : hero?.backgroundImageUrl ? (
            <div
              className="landing-hero-media-img"
              style={{ backgroundImage: `url(${getImageUrl(hero.backgroundImageUrl)})` }}
            />
          ) : (
            <div className="landing-hero-media-placeholder" />
          )}
          {heroSlides.length > 1 && (
            <div className="landing-hero-slider-dots" role="tablist" aria-label="خلفيات المعرض">
              {heroSlides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === heroSlideIndex}
                  aria-label={`شريحة ${i + 1}`}
                  className={`landing-hero-slider-dot ${i === heroSlideIndex ? 'active' : ''}`}
                  onClick={() => setHeroSlideIndex(i)}
                />
              ))}
            </div>
          )}
          <div className="landing-hero-overlay" />
        </div>
      </header>

      {/* Gallery */}
      <AnimatedSection id="gallery" className="landing-section landing-gallery">
        <h2 className="landing-section-title">معرض الأعمال</h2>
        <div className="landing-gallery-filters">
          {['all', 'wedding', 'engagement', 'private_events'].map((key) => (
            <button
              key={key}
              type="button"
              className={`landing-gallery-filter ${galleryFilter === key ? 'active' : ''}`}
              onClick={() => setGalleryFilter(key)}
            >
              {key === 'all' ? 'الكل' : EVENT_TYPE_LABELS[key] || key}
            </button>
          ))}
        </div>
        <div className="landing-gallery-grid">
          {filteredGallery.map((item) => (
            <div key={item._id} className="landing-gallery-item">
              <img src={getImageUrl(item.imageUrl)} alt={item.title || ''} loading="lazy" onError={imageProxyOnError(item.imageUrl)} />
              {item.title ? (
                <span className="landing-gallery-item-bar">
                  <span className="landing-gallery-item-title">{item.title}</span>
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </AnimatedSection>

      {/* Offers */}
      <AnimatedSection id="offers" className="landing-section landing-offers">
        <h2 className="landing-section-title">العروض والباقات</h2>
        {offers.length > 0 ? (
          <>
            <div className="landing-offers-carousel">
              <div
                className="landing-offers-track"
                style={{
                  width: `${offers.length * 100}%`,
                  transform: `translateX(-${offerIndex * (100 / offers.length)}%)`,
                }}
              >
                {offers.map((offer) => (
                <div
                  key={offer._id}
                  className="landing-offer-card"
                  style={{ flex: `0 0 ${100 / offers.length}%` }}
                >
                  <div className="landing-offer-image">
                    <img src={getImageUrl(offer.imageUrl)} alt={offer.title} loading="lazy" onError={imageProxyOnError(offer.imageUrl)} />
                  </div>
                  <div className="landing-offer-body">
                    <h3>{offer.title}</h3>
                    {offer.description ? <p>{offer.description}</p> : null}
                    <div className="landing-offer-price">
                      <span className="current">{offer.price} {offer.currency}</span>
                      {offer.originalPrice != null && offer.originalPrice > offer.price ? (
                        <span className="original">{offer.originalPrice} {offer.currency}</span>
                      ) : null}
                    </div>
                    {offer.features?.length ? (
                      <ul className="landing-offer-features">
                        {offer.features.map((f, j) => (
                          <li key={j}>{f}</li>
                        ))}
                      </ul>
                    ) : null}
                    <Link to="/booking" className="landing-offer-cta">احجز الباقة</Link>
                  </div>
                </div>
                ))}
              </div>
            </div>
            {offers.length > 1 && (
              <div className="landing-offers-dots">
                {offers.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={i === offerIndex ? 'active' : ''}
                    onClick={() => setOfferIndex(i)}
                    aria-label={`عرض ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="landing-empty">لا توجد عروض حالياً. تواصل معنا للاستفسار.</p>
        )}
      </AnimatedSection>

      {/* Location & Hours */}
      <AnimatedSection id="locations" className="landing-section landing-locations">
        <h2 className="landing-section-title">الموقع وساعات العمل</h2>
        {locations.length > 0 ? (
          <div className={`landing-locations-grid${locations.length === 1 ? ' landing-locations-grid--single' : ''}`}>
            {locations.map((loc) => (
              <div key={loc._id} className="landing-location-card">
                <h3>{loc.name}</h3>
                <div className="landing-location-contact">
                  <div className="landing-location-info landing-location-info--address">
                    <IconLocation />
                    <span className="landing-location-info-text">{loc.address}</span>
                  </div>
                  {loc.phone ? (
                    <div className="landing-location-info landing-location-info--phone">
                      <IconPhone />
                      <a href={`tel:${loc.phone}`} className="landing-location-info-text landing-location-info-link">{loc.phone}</a>
                    </div>
                  ) : null}
                  {loc.email ? (
                    <div className="landing-location-info landing-location-info--email">
                      <IconEmail />
                      <a href={`mailto:${loc.email}`} className="landing-location-info-text landing-location-info-link">{loc.email}</a>
                    </div>
                  ) : null}
                </div>
                <div className="landing-location-hours">
                  <h4><IconClock /> ساعات العمل</h4>
                  {getSortedHours(loc.hours).length > 0 ? (
                    <div className="landing-location-hours-table">
                      {getSortedHours(loc.hours).map((h, i) => {
                        const dayKey = h.day.toLowerCase();
                        const today = isToday(dayKey);
                        return (
                          <div
                            key={i}
                            className={`landing-location-hour-row ${today ? 'landing-location-hour-row--today' : ''}`}
                          >
                            <span className="landing-location-hour-day">
                              {WEEK_DAY_LABELS[dayKey] || h.day}
                              {today && <span className="landing-location-hour-badge">اليوم</span>}
                            </span>
                            <span className="landing-location-hour-time">
                              {h.isClosed ? 'مغلق' : `${h.open} – ${h.close}`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="landing-location-hours-empty">لم يتم تحديد ساعات العمل بعد.</p>
                  )}
                </div>
                {getMapEmbedSrc(loc.mapEmbedUrl) && (
                  <div className="landing-location-map">
                    <iframe
                      title={loc.name}
                      src={getMapEmbedSrc(loc.mapEmbedUrl)}
                      width="100%"
                      height="200"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          settings?.mapLink && (
            <div className="landing-location-single">
              <p><a href={settings.mapLink} target="_blank" rel="noopener noreferrer">عرض الموقع على الخريطة</a></p>
            </div>
          )
        )}
      </AnimatedSection>

      {/* Testimonials */}
      <AnimatedSection id="testimonials" className="landing-section landing-testimonials">
        <h2 className="landing-section-title">آراء العملاء</h2>
        {testimonials.length > 0 ? (
          <>
            <div
              className="landing-testimonials-carousel"
              style={{ ['--testimonials-count' as string]: testimonials.length }}
            >
              <div
                className="landing-testimonials-track"
                style={{
                  width: `${testimonials.length * 100}%`,
                  transform: `translateX(-${testimonialIndex * (100 / testimonials.length)}%)`,
                }}
              >
                {testimonials.map((t) => (
                  <div key={t._id} className="landing-testimonial-card">
                    {t.clientImageUrl ? (
                      <img src={getImageUrl(t.clientImageUrl)} alt={t.clientName} className="landing-testimonial-avatar" loading="lazy" onError={imageProxyOnError(t.clientImageUrl)} />
                    ) : (
                      <div className="landing-testimonial-avatar-placeholder">{t.clientName.charAt(0)}</div>
                    )}
                    <blockquote>{t.text}</blockquote>
                    <cite>{t.clientName}{t.eventType ? ` — ${t.eventType}` : ''}</cite>
                    {t.rating != null ? <div className="landing-testimonial-rating">{'★'.repeat(t.rating)}{'☆'.repeat(5 - t.rating)}</div> : null}
                  </div>
                ))}
              </div>
            </div>
            {testimonials.length > 1 && (
              <div className="landing-testimonials-dots">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={i === testimonialIndex ? 'active' : ''}
                    onClick={() => setTestimonialIndex(i)}
                    aria-label={`عرض ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="landing-empty">قريباً آراء عملائنا.</p>
        )}
      </AnimatedSection>

      {/* Booking CTA block */}
      <AnimatedSection className="landing-section landing-booking-cta">
        <div className="landing-booking-cta-inner">
          <h2>جاهز لتصوير يومك الخاص؟</h2>
          <p>احجز جلستك الآن واترك الباقي لنا.</p>
          <Link to="/booking" className="landing-booking-cta-btn">احجز الآن</Link>
        </div>
      </AnimatedSection>

      {/* FAQ */}
      <AnimatedSection id="faq" className="landing-section landing-faq">
        <h2 className="landing-section-title">الأسئلة الشائعة</h2>
        {faq.length > 0 ? (
          <div className="landing-faq-list">
            {faq.map((item) => (
              <div
                key={item._id}
                className={`landing-faq-item ${faqOpen === item._id ? 'open' : ''}`}
              >
                <button
                  type="button"
                  className="landing-faq-question"
                  onClick={() => setFaqOpen(faqOpen === item._id ? null : item._id)}
                >
                  {item.question}
                  <span className="landing-faq-icon" />
                </button>
                <div className="landing-faq-answer">{item.answer}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="landing-empty">قريباً أسئلة شائعة.</p>
        )}
      </AnimatedSection>

      {/* Blog / Tips */}
      <AnimatedSection id="blog" className="landing-section landing-blog">
        <h2 className="landing-section-title">نصائح ومقالات</h2>
        {blog.length > 0 ? (
          <div className="landing-blog-grid">
            {blog.slice(0, 6).map((post) => (
              <article key={post._id} className="landing-blog-card">
                <div className="landing-blog-image">
                  <img src={getImageUrl(post.coverImageUrl)} alt={post.title} loading="lazy" onError={imageProxyOnError(post.coverImageUrl)} />
                </div>
                <div className="landing-blog-body">
                  <h3>{post.title}</h3>
                  <p>{post.excerpt}</p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="landing-empty">قريباً نصائح ومقالات عن التصوير.</p>
        )}
      </AnimatedSection>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-brand">
            <h3>{settings?.siteName || 'استوديو العمري'}</h3>
            {settings?.footerText ? <p>{settings.footerText}</p> : null}
          </div>
          <div className="landing-footer-links">
          <a href="#offers">العروض</a>
          <Link to="/booking">الحجز</Link>
            <a href="#gallery">المعرض</a>
            <a href="#faq">الأسئلة الشائعة</a>
            <Link to="/login">تسجيل الدخول (إدارة)</Link>
          </div>
          <div className="landing-footer-contact">
            {settings?.phone ? <p><a href={`tel:${settings.phone}`}>{settings.phone}</a></p> : null}
            {settings?.email ? <p><a href={`mailto:${settings.email}`}>{settings.email}</a></p> : null}
            {settings?.mapLink ? <p><a href={settings.mapLink} target="_blank" rel="noopener noreferrer">الموقع على الخريطة</a></p> : null}
            <div className="landing-footer-social">
              {settings?.facebookUrl ? <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" aria-label="Facebook">f</a> : null}
              {settings?.instagramUrl ? <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram">ig</a> : null}
              {settings?.whatsappNumber ? <a href={`https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">wa</a> : null}
            </div>
          </div>
        </div>
        <div className="landing-footer-bottom">
          <p>© {new Date().getFullYear()} {settings?.siteName || 'استوديو العمري'}. جميع الحقوق محفوظة.</p>
        </div>
      </footer>
    </div>
  );
}
