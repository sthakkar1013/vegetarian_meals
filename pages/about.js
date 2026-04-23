import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'

// ─── ADD YOUR DISH IMAGES HERE ───────────────────────────────────────────────
// 1. Put photo files into the /public/dishes/ folder on GitHub
// 2. Add the filenames to this list below
// Example: if you upload "dal.jpg" to public/dishes/, add '/dishes/dal.jpg'
const DISH_IMAGES = [
  // '/dishes/dal.jpg',
  // '/dishes/sabzi.jpg',
  // '/dishes/thali.jpg',
  // '/dishes/roti.jpg',
  // '/dishes/raita.jpg',
  // '/dishes/sweet.jpg',
]

// How many placeholder boxes to show until real photos are added
const PLACEHOLDER_COUNT = 8

export default function About() {
  const [scattered, setScattered] = useState([])

  const images = DISH_IMAGES.length > 0
    ? DISH_IMAGES
    : Array.from({ length: PLACEHOLDER_COUNT }, () => null)

  useEffect(() => {
    // Generate random scatter positions on mount so they differ each page load
    const items = images.map((src, i) => ({
      id: i,
      src,
      // Random rotation between -12 and +12 degrees
      rotation: (Math.random() * 24 - 12).toFixed(1),
      // Random top offset within a band — spread across page height
      // We split the page into bands so images don't all cluster at top
      topPct: (i * (90 / images.length) + Math.random() * 8).toFixed(1),
      // Alternate left/right with a random inward nudge
      side: i % 2 === 0 ? 'left' : 'right',
      nudge: (Math.random() * 20).toFixed(1),
      // Random subtle scale between 0.92 and 1.05
      scale: (0.92 + Math.random() * 0.13).toFixed(3),
    }))
    setScattered(items)
  }, [])

  return (
    <>
      <Head>
        <title>About Us — Ghar Ka Khana</title>
        <meta name="description" content="The story behind Ghar Ka Khana — fresh, clean, home-cooked Indian vegetarian meals." />
      </Head>

      <nav>
        <span className="nav-brand">Ghar Ka <span>Khana</span></span>
        <div className="nav-links">
          <Link href="/" className="nav-btn">Today's Menu</Link>
          <Link href="/about" className="nav-btn active">About Us</Link>
          <Link href="/admin" className="nav-btn">Admin</Link>
        </div>
      </nav>

      {/* HERO */}
      <div className="about-hero">
        <div className="about-hero-inner">
          <div className="hero-tag">🌿 Our Story</div>
          <h1>Made with <em>care</em>,<br />cooked with <em>love</em></h1>
        </div>
      </div>

      <main className="about-main">

        {/* SCATTERED IMAGES LAYER — absolutely positioned behind text */}
        <div className="scatter-layer" aria-hidden="true">
          {scattered.map(img => (
            <div
              key={img.id}
              className={`scatter-img scatter-${img.side}`}
              style={{
                top: `${img.topPct}%`,
                [img.side]: `${img.nudge}px`,
                transform: `rotate(${img.rotation}deg) scale(${img.scale})`,
              }}
            >
              {img.src ? (
                <img src={img.src} alt="Dish from Ghar Ka Khana" loading="lazy" />
              ) : (
                <div className="scatter-placeholder">
                  <span className="ph-icon">📸</span>
                  <span className="ph-label">your photo</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CONTENT */}
        <div className="about-content">

          {/* PULL HEADING */}
          <div className="pull-heading">
            <h2>Was your garlic washed?</h2>
            <div className="pull-line" />
          </div>

          {/* STORY */}
          <div className="story-card">
            <h3 className="story-title">Home cooked veg meals</h3>

            <p className="story-text drop-cap">
              The vision behind setting this up is simple — I am an OCD who washes their
              garlic and onions post peeling before putting them into my food. When ordering
              from outside I often wonder if the vegetables used would have been cleaned before
              cooking the way I do?
            </p>

            <p className="story-text">
              I have often found the okra tops within the sabzi I would get from outside —
              or even the packaged cut vegetables I had once upon a time picked up for easing
              my burden. Small things that stay with you.
            </p>

            <p className="story-text">
              I try to cook fresh for my home on a daily basis with fresh vegetables
              — except for frozen peas and corn — since I place a higher value on
              unpackaged and unfrozen food. Every meal starts with whole, clean ingredients
              prepared the way I would want them prepared for my own family.
            </p>

            <p className="story-text">
              I would like to offer others a chance to enjoy the food I cook — and hence
              I will be starting by taking only <strong>2 orders a day</strong>. Small,
              intentional, and made properly. That is what Ghar Ka Khana is about.
            </p>
          </div>

          {/* VALUES */}
          <div className="values-strip">
            <div className="value-card">
              <div className="value-icon">🧄</div>
              <div className="value-title">Washed & clean</div>
              <div className="value-desc">Every vegetable peeled, washed and prepared properly before it goes into the pot.</div>
            </div>
            <div className="value-card">
              <div className="value-icon">🥬</div>
              <div className="value-title">Fresh daily</div>
              <div className="value-desc">Cooked fresh each day. No pre-cut packaged vegetables. No shortcuts.</div>
            </div>
            <div className="value-card">
              <div className="value-icon">🍽️</div>
              <div className="value-title">2 orders a day</div>
              <div className="value-desc">Small and intentional. Quality over quantity — the way home cooking should be.</div>
            </div>
            <div className="value-card">
              <div className="value-icon">🏠</div>
              <div className="value-title">Made like home</div>
              <div className="value-desc">Cooked the same way I cook for my own family. Nothing less.</div>
            </div>
          </div>

          {/* CTA */}
          <div className="about-cta">
            <p>Curious? Come see what's cooking today.</p>
            <Link href="/" className="cta-btn">View Today's Menu →</Link>
          </div>

        </div>
      </main>

      <style jsx>{`
        /* ── HERO ── */
        .about-hero {
          background: linear-gradient(135deg, var(--dark) 0%, var(--brown) 100%);
          padding: 3.5rem 2rem 2.5rem;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .about-hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at 60% 50%, rgba(242,168,29,0.09) 0%, transparent 70%);
        }
        .about-hero-inner { position: relative; }
        .about-hero h1 {
          font-family: 'Playfair Display', serif;
          font-size: clamp(2rem, 5vw, 3.5rem);
          color: white;
          line-height: 1.15;
          margin-top: 1rem;
        }
        .about-hero h1 em { color: var(--turmeric); font-style: italic; }

        /* ── PAGE LAYOUT ── */
        .about-main {
          position: relative;
          background: var(--cream);
          min-height: 100vh;
          overflow: hidden;
        }

        /* ── SCATTERED IMAGES LAYER ── */
        .scatter-layer {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
        }
        .scatter-img {
          position: absolute;
          width: 110px;
          height: 110px;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 16px rgba(44,24,16,0.18);
          border: 3px solid white;
          transition: transform 0.3s ease;
        }
        .scatter-img img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .scatter-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          background: linear-gradient(135deg,
            rgba(232,98,26,0.10),
            rgba(242,168,29,0.14));
        }
        .ph-icon { font-size: 1.6rem; opacity: 0.45; }
        .ph-label {
          font-size: 9px;
          color: var(--light-brown);
          opacity: 0.7;
          text-align: center;
          letter-spacing: 0.04em;
        }

        /* ── CONTENT (sits above scatter layer) ── */
        .about-content {
          position: relative;
          z-index: 1;
          max-width: 640px;
          margin: 0 auto;
          padding: 3rem 1.5rem 4rem;
        }

        /* ── PULL HEADING ── */
        .pull-heading {
          text-align: center;
          margin-bottom: 2.5rem;
        }
        .pull-heading h2 {
          font-family: 'Playfair Display', serif;
          font-size: clamp(1.8rem, 4vw, 2.8rem);
          color: var(--dark);
          line-height: 1.2;
          margin-bottom: 0.8rem;
        }
        .pull-line {
          width: 60px;
          height: 3px;
          background: linear-gradient(90deg, var(--saffron), var(--turmeric));
          margin: 0 auto;
          border-radius: 2px;
        }

        /* ── STORY CARD ── */
        .story-card {
          background: rgba(255,255,255,0.88);
          backdrop-filter: blur(8px);
          border-radius: 16px;
          padding: 2rem 2.2rem;
          border: 1px solid rgba(196,149,106,0.2);
          box-shadow: 0 4px 24px rgba(44,24,16,0.07);
          margin-bottom: 2.5rem;
        }
        .story-title {
          font-family: 'Playfair Display', serif;
          font-size: 1.4rem;
          color: var(--brown);
          margin-bottom: 1.2rem;
          padding-bottom: 0.8rem;
          border-bottom: 1px solid rgba(196,149,106,0.2);
        }
        .story-text {
          font-size: 1rem;
          line-height: 1.85;
          color: var(--text);
          margin-bottom: 1.1rem;
          font-weight: 300;
        }
        .story-text:last-child { margin-bottom: 0; }
        .drop-cap::first-letter {
          font-family: 'Playfair Display', serif;
          font-size: 3.6rem;
          font-weight: 700;
          color: var(--saffron);
          float: left;
          line-height: 0.78;
          margin: 0.08rem 0.12em 0 0;
        }
        .story-text strong { color: var(--saffron); font-weight: 600; }

        /* ── VALUES ── */
        .values-strip {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.8rem;
          margin-bottom: 2.5rem;
        }
        .value-card {
          background: rgba(255,255,255,0.88);
          backdrop-filter: blur(8px);
          border-radius: 12px;
          padding: 1.2rem;
          border: 1px solid rgba(196,149,106,0.18);
          text-align: center;
        }
        .value-icon { font-size: 1.6rem; margin-bottom: 0.5rem; }
        .value-title {
          font-family: 'Playfair Display', serif;
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--dark);
          margin-bottom: 0.3rem;
        }
        .value-desc { font-size: 11px; color: var(--muted); line-height: 1.55; }

        /* ── CTA ── */
        .about-cta {
          text-align: center;
          padding: 2rem 2rem;
          background: linear-gradient(135deg, var(--dark), var(--brown));
          border-radius: 14px;
        }
        .about-cta p {
          font-family: 'Playfair Display', serif;
          font-size: 1.2rem;
          color: rgba(255,255,255,0.85);
          margin-bottom: 1.1rem;
          font-style: italic;
        }
        .cta-btn {
          display: inline-block;
          background: var(--saffron);
          color: white;
          padding: 11px 26px;
          border-radius: 6px;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: background 0.2s;
        }
        .cta-btn:hover { background: var(--turmeric); color: var(--dark); }

        /* ── MOBILE ── */
        @media (max-width: 600px) {
          /* Hide scattered images on mobile — too cramped */
          .scatter-layer { display: none; }
          .story-card { padding: 1.4rem 1.2rem; }
          .values-strip { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </>
  )
}
