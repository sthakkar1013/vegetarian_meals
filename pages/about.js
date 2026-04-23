import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'

// ─── ADD YOUR DISH IMAGES HERE ───────────────────────────────────────────────
// Put image files in the /public/dishes/ folder on GitHub
// Then add the filenames to this list below
// Example: if you add "dal-makhani.jpg" to public/dishes/, add '/dishes/dal-makhani.jpg'
const DISH_IMAGES = [
  // '/dishes/dal-makhani.jpg',
  // '/dishes/rajma-chawal.jpg',
  // '/dishes/palak-paneer.jpg',
  // '/dishes/sabzi.jpg',
  // '/dishes/thali.jpg',
  // Add more here as you add photos to public/dishes/
]

// Placeholder images shown until you add real ones
// These are warm food-toned placeholder blocks
const PLACEHOLDER_COUNT = 6

export default function About() {
  const [floatingImages, setFloatingImages] = useState([])
  const textRef = useRef(null)

  // Decide which images to show — real ones or placeholders
  const images = DISH_IMAGES.length > 0
    ? DISH_IMAGES
    : Array.from({ length: PLACEHOLDER_COUNT }, (_, i) => null)

  useEffect(() => {
    // Randomly position images around the text on each load
    const positions = generatePositions(images.length)
    setFloatingImages(positions)
  }, [])

  function generatePositions(count) {
    // Creates varied positions — some left-floating, some right, some inline
    const layouts = ['float-left', 'float-right', 'float-left', 'float-right', 'float-left', 'float-right']
    const rotations = [-3, 2, -1.5, 3, -2, 1]
    const sizes = ['sm', 'md', 'md', 'sm', 'lg', 'md']

    return Array.from({ length: count }, (_, i) => ({
      id: i,
      layout: layouts[i % layouts.length],
      rotation: rotations[i % rotations.length],
      size: sizes[i % sizes.length],
      delay: i * 0.15,
    }))
  }

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

      {/* HERO STRIP */}
      <div className="about-hero">
        <div className="about-hero-inner">
          <div className="hero-tag">🌿 Our Story</div>
          <h1>Made with <em>care</em>,<br />cooked with <em>love</em></h1>
        </div>
      </div>

      <main className="about-main">
        <div className="about-container">

          {/* FLOATING IMAGE MOSAIC + TEXT */}
          <div className="story-wrap" ref={textRef}>

            {/* Images injected before/between paragraphs */}
            {floatingImages.slice(0, 2).map(img => (
              <FloatImage key={img.id} img={img} src={images[img.id]} />
            ))}

            <div className="story-block">
              <h2 className="story-heading">Home cooked veg meals</h2>
              <p className="story-text drop-cap">
                The vision behind setting this up is simple — I am an OCD who washes their
                garlic and onions post peeling before putting them into my food. When ordering
                from outside I often wonder if the vegetables used would have been cleaned before
                cooking the way I do?
              </p>
            </div>

            {floatingImages.slice(2, 4).map(img => (
              <FloatImage key={img.id} img={img} src={images[img.id]} />
            ))}

            <div className="story-block">
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
            </div>

            {floatingImages.slice(4).map(img => (
              <FloatImage key={img.id} img={img} src={images[img.id]} />
            ))}

            <div className="story-block">
              <p className="story-text">
                I would like to offer others a chance to enjoy the food I cook — and hence
                I will be starting by taking only <strong>2 orders a day</strong>. Small,
                intentional, and made properly. That is what Ghar Ka Khana is about.
              </p>
            </div>

            <div className="clearfix" />
          </div>

          {/* VALUES STRIP */}
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

        /* ── MAIN ── */
        .about-main { background: var(--cream); }
        .about-container { max-width: 860px; margin: 0 auto; padding: 3rem 1.5rem 4rem; }

        /* ── STORY ── */
        .story-wrap { position: relative; margin-bottom: 3rem; }
        .story-block { margin-bottom: 1.8rem; }
        .story-heading {
          font-family: 'Playfair Display', serif;
          font-size: 1.7rem;
          color: var(--dark);
          margin-bottom: 1rem;
          line-height: 1.2;
        }
        .story-text {
          font-size: 1.05rem;
          line-height: 1.85;
          color: var(--text);
          margin-bottom: 1.1rem;
          font-weight: 300;
        }
        .drop-cap::first-letter {
          font-family: 'Playfair Display', serif;
          font-size: 3.8rem;
          font-weight: 700;
          color: var(--saffron);
          float: left;
          line-height: 0.75;
          margin: 0.1rem 0.12em 0 0;
        }
        .story-text strong { color: var(--saffron); font-weight: 600; }
        .clearfix::after { content: ''; display: table; clear: both; }

        /* ── FLOATING IMAGES ── */
        .float-img-wrap {
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 6px 24px rgba(44,24,16,0.15);
          margin-bottom: 1.2rem;
          transition: transform 0.3s ease;
          background: white;
          border: 3px solid white;
        }
        .float-img-wrap:hover { transform: scale(1.02) rotate(0deg) !important; }
        .float-left {
          float: left;
          margin-right: 1.8rem;
          margin-bottom: 1rem;
          clear: left;
        }
        .float-right {
          float: right;
          margin-left: 1.8rem;
          margin-bottom: 1rem;
          clear: right;
        }
        .size-sm { width: 180px; height: 160px; }
        .size-md { width: 220px; height: 190px; }
        .size-lg { width: 260px; height: 220px; }

        .float-img-wrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .placeholder-img {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: linear-gradient(135deg, rgba(232,98,26,0.08), rgba(242,168,29,0.12));
          color: var(--light-brown);
          font-size: 12px;
          text-align: center;
          padding: 1rem;
        }
        .placeholder-img .ph-icon { font-size: 2rem; opacity: 0.5; }
        .placeholder-img .ph-text { opacity: 0.6; line-height: 1.4; }

        /* ── VALUES ── */
        .values-strip {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 1rem;
          margin-bottom: 3rem;
          padding: 2rem;
          background: white;
          border-radius: 16px;
          border: 1px solid rgba(196,149,106,0.2);
        }
        .value-card { text-align: center; padding: 1rem 0.5rem; }
        .value-icon { font-size: 1.8rem; margin-bottom: 0.6rem; }
        .value-title {
          font-family: 'Playfair Display', serif;
          font-size: 1rem;
          font-weight: 700;
          color: var(--dark);
          margin-bottom: 0.4rem;
        }
        .value-desc { font-size: 12px; color: var(--muted); line-height: 1.6; }

        /* ── CTA ── */
        .about-cta {
          text-align: center;
          padding: 2.5rem;
          background: linear-gradient(135deg, var(--dark), var(--brown));
          border-radius: 16px;
        }
        .about-cta p {
          font-family: 'Playfair Display', serif;
          font-size: 1.3rem;
          color: rgba(255,255,255,0.85);
          margin-bottom: 1.2rem;
          font-style: italic;
        }
        .cta-btn {
          display: inline-block;
          background: var(--saffron);
          color: white;
          padding: 12px 28px;
          border-radius: 6px;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: background 0.2s;
        }
        .cta-btn:hover { background: var(--turmeric); color: var(--dark); }

        @media (max-width: 600px) {
          .float-left, .float-right {
            float: none !important;
            margin: 0 auto 1.2rem !important;
            display: block;
          }
          .size-sm, .size-md, .size-lg { width: 100%; height: 200px; }
          .values-strip { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </>
  )
}

// ── FLOATING IMAGE COMPONENT ──────────────────────────────────────────────────
function FloatImage({ img, src }) {
  return (
    <div
      className={`float-img-wrap ${img.layout} size-${img.size}`}
      style={{
        transform: `rotate(${img.rotation}deg)`,
        animationDelay: `${img.delay}s`,
      }}
    >
      {src ? (
        <img src={src} alt="Dish from Ghar Ka Khana" loading="lazy" />
      ) : (
        <div className="placeholder-img">
          <span className="ph-icon">📸</span>
          <span className="ph-text">Your dish<br />photo here</span>
        </div>
      )}
    </div>
  )
}
