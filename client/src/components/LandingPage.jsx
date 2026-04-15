import React, { useEffect, useRef, useState } from "react";

const styles = {
  /* ── Header ─────────────────────────────────────── */
  header: {
    position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
    background: "rgba(17,17,17,0.95)", backdropFilter: "blur(12px)",
    borderBottom: "1px solid rgba(201,168,76,0.2)", padding: "0 5%",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    height: 70,
  },
  logo: {
    fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700,
    color: "#C9A84C", letterSpacing: 2,
  },
  nav: { display: "flex", gap: 32, listStyle: "none" },
  navLink: {
    color: "#ccc", fontSize: 14, fontWeight: 500, letterSpacing: 1,
    textTransform: "uppercase", cursor: "pointer",
    transition: "color .2s",
  },
  ctaBtn: {
    background: "linear-gradient(135deg, #C9A84C, #a07830)",
    color: "#fff", padding: "10px 24px", borderRadius: 4, fontSize: 14,
    fontWeight: 600, letterSpacing: 1, cursor: "pointer", border: "none",
    textTransform: "uppercase",
  },

  /* ── Hero ────────────────────────────────────────── */
  hero: {
    minHeight: "100vh", position: "relative", display: "flex",
    alignItems: "center", overflow: "hidden",
    background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%)",
  },
  heroBg: {
    position: "absolute", inset: 0,
    background: `url('https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1600&q=80') center/cover no-repeat`,
    opacity: 0.15,
  },
  heroOverlay: {
    position: "absolute", inset: 0,
    background: "linear-gradient(135deg, rgba(10,10,10,0.95) 50%, rgba(201,168,76,0.05) 100%)",
  },
  heroContent: {
    position: "relative", zIndex: 2, padding: "120px 5% 80px",
    maxWidth: 750,
  },
  heroBadge: {
    display: "inline-flex", alignItems: "center", gap: 8,
    background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)",
    color: "#C9A84C", padding: "6px 16px", borderRadius: 20,
    fontSize: 12, fontWeight: 600, letterSpacing: 1,
    textTransform: "uppercase", marginBottom: 24,
    animation: "fadeInUp .8s ease forwards",
  },
  heroTitle: {
    fontFamily: "'Playfair Display', serif", fontSize: "clamp(38px, 6vw, 72px)",
    fontWeight: 700, color: "#fff", lineHeight: 1.15, marginBottom: 24,
    animation: "fadeInUp .8s .15s ease both",
  },
  heroGold: { color: "#C9A84C" },
  heroDesc: {
    fontSize: "clamp(15px, 2vw, 18px)", color: "#aaa", lineHeight: 1.8,
    marginBottom: 40, maxWidth: 600,
    animation: "fadeInUp .8s .3s ease both",
  },
  heroBtns: {
    display: "flex", gap: 16, flexWrap: "wrap",
    animation: "fadeInUp .8s .45s ease both",
  },
  btnPrimary: {
    background: "linear-gradient(135deg, #C9A84C, #a07830)",
    color: "#fff", padding: "16px 36px", borderRadius: 4, fontSize: 15,
    fontWeight: 600, letterSpacing: 1, cursor: "pointer", border: "none",
    textTransform: "uppercase", transition: "transform .2s, box-shadow .2s",
    boxShadow: "0 4px 20px rgba(201,168,76,0.3)",
  },
  btnSecondary: {
    background: "transparent", color: "#C9A84C",
    padding: "16px 36px", borderRadius: 4, fontSize: 15,
    fontWeight: 600, letterSpacing: 1, cursor: "pointer",
    border: "2px solid rgba(201,168,76,0.5)",
    textTransform: "uppercase", transition: "all .2s",
  },
  heroStats: {
    position: "absolute", bottom: 50, right: "5%", display: "flex", gap: 40,
    animation: "slideInRight .8s .5s ease both", zIndex: 2,
  },
  statItem: { textAlign: "center" },
  statNum: {
    fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 700,
    color: "#C9A84C",
  },
  statLabel: { fontSize: 12, color: "#888", textTransform: "uppercase", letterSpacing: 1 },

  /* ── Section ─────────────────────────────────────── */
  section: { padding: "100px 5%" },
  sectionLight: { padding: "100px 5%", background: "#f9f9f9" },
  sectionDark: {
    padding: "100px 5%",
    background: "linear-gradient(135deg, #111, #1a1a1a)",
    color: "#fff",
  },
  sectionTag: {
    fontSize: 13, fontWeight: 600, letterSpacing: 3, color: "#C9A84C",
    textTransform: "uppercase", marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "clamp(28px, 4vw, 46px)", fontWeight: 700,
    color: "#111", marginBottom: 20, lineHeight: 1.2,
  },
  sectionTitleLight: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "clamp(28px, 4vw, 46px)", fontWeight: 700,
    color: "#fff", marginBottom: 20, lineHeight: 1.2,
  },
  divider: {
    width: 60, height: 3,
    background: "linear-gradient(90deg, #C9A84C, #a07830)",
    margin: "0 0 50px",
  },
  grid2: {
    display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: 40, alignItems: "center",
  },
  grid3: {
    display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 30,
  },

  /* ── About ───────────────────────────────────────── */
  aboutText: { fontSize: 16, color: "#555", lineHeight: 1.9, marginBottom: 20 },
  aboutHighlight: {
    background: "linear-gradient(135deg, #1a1a1a, #2d2d2d)",
    padding: "30px 35px", borderRadius: 8,
    borderLeft: "4px solid #C9A84C", color: "#fff",
  },
  aboutStats: { display: "flex", gap: 30, marginTop: 30, flexWrap: "wrap" },
  aboutStat: { flex: 1, minWidth: 100 },
  aboutStatNum: {
    fontFamily: "'Playfair Display', serif", fontSize: 36,
    fontWeight: 700, color: "#C9A84C",
  },
  aboutStatLabel: { fontSize: 13, color: "#888", marginTop: 4 },
  aboutImage: {
    borderRadius: 8, overflow: "hidden", position: "relative",
    background: "#1a1a1a",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  },

  /* ── Services ────────────────────────────────────── */
  serviceCard: {
    background: "#fff", borderRadius: 8, padding: "35px 30px",
    border: "1px solid #eee", transition: "all .3s",
    cursor: "default", position: "relative", overflow: "hidden",
  },
  serviceIcon: {
    width: 56, height: 56, borderRadius: 12,
    background: "linear-gradient(135deg, #C9A84C, #a07830)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 24, marginBottom: 20, color: "#fff",
  },
  serviceTitle: {
    fontFamily: "'Playfair Display', serif", fontSize: 20,
    fontWeight: 700, color: "#111", marginBottom: 12,
  },
  serviceDesc: { fontSize: 14, color: "#666", lineHeight: 1.8 },

  /* ── How We Work ─────────────────────────────────── */
  stepCard: {
    background: "rgba(255,255,255,0.05)", borderRadius: 12,
    padding: "40px 35px", border: "1px solid rgba(201,168,76,0.2)",
    position: "relative", transition: "all .3s",
  },
  stepNum: {
    fontFamily: "'Playfair Display', serif", fontSize: 64,
    fontWeight: 700, color: "rgba(201,168,76,0.15)",
    position: "absolute", top: 20, right: 25, lineHeight: 1,
  },
  stepTitle: {
    fontFamily: "'Playfair Display', serif", fontSize: 24,
    fontWeight: 700, color: "#C9A84C", marginBottom: 16,
  },
  stepDesc: { fontSize: 15, color: "#bbb", lineHeight: 1.8 },

  /* ── Testimonials ────────────────────────────────── */
  testimonialCard: {
    background: "#fff", borderRadius: 12, padding: "35px 30px",
    border: "1px solid #eee", boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
    position: "relative",
  },
  quoteIcon: {
    fontFamily: "'Playfair Display', serif", fontSize: 72,
    color: "#C9A84C", opacity: 0.2, lineHeight: 1,
    position: "absolute", top: 20, left: 25,
  },
  testimonialText: {
    fontSize: 15, color: "#555", lineHeight: 1.8, marginBottom: 24,
    paddingTop: 20,
  },
  testimonialAuthor: {
    display: "flex", alignItems: "center", gap: 14,
  },
  authorAvatar: {
    width: 48, height: 48, borderRadius: "50%",
    background: "linear-gradient(135deg, #C9A84C, #a07830)",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#fff", fontWeight: 700, fontSize: 18,
  },
  authorName: { fontWeight: 600, color: "#111", fontSize: 15 },
  authorCompany: { fontSize: 13, color: "#888" },

  /* ── CTA ─────────────────────────────────────────── */
  ctaSection: {
    padding: "100px 5%", textAlign: "center",
    background: "linear-gradient(135deg, #0a0a0a, #1a1a1a)",
    position: "relative", overflow: "hidden",
  },
  ctaGlow: {
    position: "absolute", top: "50%", left: "50%",
    transform: "translate(-50%, -50%)",
    width: 600, height: 600, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%)",
    pointerEvents: "none",
  },

  /* ── Footer ──────────────────────────────────────── */
  footer: {
    background: "#0a0a0a", color: "#888", padding: "60px 5% 30px",
  },
  footerGrid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 40, marginBottom: 50,
  },
  footerLogo: {
    fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700,
    color: "#C9A84C", letterSpacing: 2, marginBottom: 16,
  },
  footerDesc: { fontSize: 14, color: "#666", lineHeight: 1.8, maxWidth: 280 },
  footerTitle: {
    fontSize: 14, fontWeight: 600, color: "#fff",
    textTransform: "uppercase", letterSpacing: 2, marginBottom: 20,
  },
  footerLink: { display: "block", fontSize: 14, color: "#666", marginBottom: 10, cursor: "pointer" },
  footerContact: { fontSize: 14, color: "#666", marginBottom: 10, display: "flex", gap: 10, alignItems: "flex-start" },
  footerDivider: { border: "none", borderTop: "1px solid #1a1a1a", margin: "0 0 25px" },
  footerBottom: { textAlign: "center", fontSize: 13, color: "#444" },

  /* ── Mobile Nav Hamburger ─────────────────────────── */
  hamburger: {
    display: "none", flexDirection: "column", gap: 5, cursor: "pointer",
    padding: 8,
  },
  hamburgerLine: {
    width: 25, height: 2, background: "#C9A84C", transition: "all .3s",
  },
};

export default function LandingPage() {
  const [mobileNav, setMobileNav] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileNav(false);
  };

  const services = [
    { icon: "🎯", title: "Free Initial Consultation", desc: "Complimentary project assessment covering scope, requirements, and budget estimation by our expert design team." },
    { icon: "📐", title: "Kitchen Floor Plans", desc: "Scaled, detailed floor plans for kitchen, serving counter, and bar areas tailored to your specific workflow needs." },
    { icon: "⚙️", title: "Equipment Specifications", desc: "Complete technical specifications for all equipment — features, dimensions, materials, capacity, and performance data." },
    { icon: "🔌", title: "Electrical & Plumbing Drawings", desc: "Precise rough-in drawings with detailed utility schedules to guide your architect and contractor." },
    { icon: "💰", title: "Equipment Cost Analysis", desc: "Budget-aligned equipment selection with itemized cost estimates to help manage your project finances." },
    { icon: "🔧", title: "Value Engineering", desc: "Expert adjustment of specifications to bring over-budget projects within financial targets without sacrificing quality." },
    { icon: "🏗️", title: "Contractor Coordination", desc: "Full collaboration with your architects, engineers, and general contractors for seamless project execution." },
    { icon: "👁️", title: "Site Supervision", desc: "On-site visits and construction oversight to verify specifications are met throughout the build process." },
    { icon: "🧺", title: "Laundry Project Design", desc: "Commercial laundry facility design for hotels, hospitals, and industrial operations of any scale." },
  ];

  const steps = [
    { num: "01", title: "Plan", desc: "Meet with our team for a free consultation to discuss project scope, vision, and requirements. We gather crucial details: location, seating capacity, utility availability, and budget parameters to provide an accurate design estimate." },
    { num: "02", title: "Design", desc: "Using your requirements, we create detailed floor plans, specify equipment, and collaborate with your architects and engineers. You receive itemized equipment lists with manufacturer specs, models, and accessories." },
    { num: "03", title: "Develop", desc: "With approved plans and equipment specs, we coordinate with your contractor and trades. We provide utility schedules, elevations, installation instructions, and renderings to ensure accurate estimates and smooth construction." },
  ];

  const testimonials = [
    { name: "Robert Smith", company: "Delta INC", initials: "RS", text: "Culinova has been our primary kitchen design partner for ten years. Their ability to deliver economical, high-quality designs — even under tight budget and space constraints — is unmatched. They always find a way." },
    { name: "John Doe", company: "Penta Co", initials: "JD", text: "After 30 years in one location, relocating felt daunting. Culinova made the process seamless — from design to equipment selection. Their expertise turned what could have been a nightmare into a smooth, successful move." },
    { name: "Sarah Al-Rashidi", company: "Grand Hotel Riyadh", initials: "SR", text: "Culinova delivered a state-of-the-art hotel kitchen that exceeded our expectations. Their attention to workflow efficiency and code compliance was exceptional. We've now used them for three projects." },
  ];

  return (
    <>
      {/* ── Header ── */}
      <header
        style={{
          ...styles.header,
          background: scrolled
            ? "rgba(17,17,17,0.98)"
            : "rgba(17,17,17,0.9)",
          boxShadow: scrolled ? "0 4px 30px rgba(0,0,0,0.3)" : "none",
        }}
      >
        <div style={styles.logo}>CULINOVA</div>

        <nav style={{ display: "flex", gap: 32, listStyle: "none" }}>
          {[
            ["About", "about"],
            ["Services", "services"],
            ["How We Work", "process"],
            ["Testimonials", "testimonials"],
            ["Contact", "contact"],
          ].map(([label, id]) => (
            <span
              key={id}
              style={{
                ...styles.navLink,
                display: "block",
              }}
              onClick={() => scrollTo(id)}
              onMouseEnter={(e) => (e.target.style.color = "#C9A84C")}
              onMouseLeave={(e) => (e.target.style.color = "#ccc")}
            >
              {label}
            </span>
          ))}
        </nav>

        <button style={styles.ctaBtn} onClick={() => scrollTo("contact")}>
          Get Free Quote
        </button>
      </header>

      {/* ── Hero ── */}
      <section style={styles.hero}>
        <div style={styles.heroBg} />
        <div style={styles.heroOverlay} />
        <div style={styles.heroContent}>
          <div style={styles.heroBadge}>
            <span>★</span> Saudi Arabia's Premier Kitchen Design Firm
          </div>
          <h1 style={styles.heroTitle}>
            Commercial Kitchen &amp;{" "}
            <span style={styles.heroGold}>Laundry Design</span>{" "}
            Excellence
          </h1>
          <p style={styles.heroDesc}>
            16 years of expertise designing and executing world-class
            commercial kitchen and laundry projects for hotels, restaurants,
            hospitals, and hospitality venues across Saudi Arabia.
          </p>
          <div style={styles.heroBtns}>
            <button
              style={styles.btnPrimary}
              onClick={() => scrollTo("contact")}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 8px 30px rgba(201,168,76,0.4)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 4px 20px rgba(201,168,76,0.3)";
              }}
            >
              Start Your Project
            </button>
            <button
              style={styles.btnSecondary}
              onClick={() => scrollTo("services")}
              onMouseEnter={(e) => {
                e.target.style.background = "rgba(201,168,76,0.1)";
                e.target.style.borderColor = "#C9A84C";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "transparent";
                e.target.style.borderColor = "rgba(201,168,76,0.5)";
              }}
            >
              Our Services
            </button>
          </div>
        </div>

        <div
          style={{
            ...styles.heroStats,
            "@media (max-width: 768px)": { display: "none" },
          }}
        >
          {[
            ["16+", "Years Experience"],
            ["500+", "Projects Completed"],
            ["98%", "Client Satisfaction"],
          ].map(([num, label]) => (
            <div key={label} style={styles.statItem}>
              <div style={styles.statNum}>{num}</div>
              <div style={styles.statLabel}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── About ── */}
      <section id="about" style={styles.sectionLight}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={styles.grid2}>
            <div>
              <p style={styles.sectionTag}>~ About Culinova</p>
              <h2 style={styles.sectionTitle}>
                16 Years of Commercial Kitchen Design Excellence
              </h2>
              <div style={styles.divider} />
              <p style={styles.aboutText}>
                Culinova is Saudi Arabia's trusted partner for commercial
                kitchen and laundry project design. With extensive experience
                in value engineering and cost optimization, we deliver
                precision-designed foodservice facilities that perform at the
                highest level.
              </p>
              <p style={styles.aboutText}>
                We've served large hotels, restaurants, hospitals, places of
                worship, country clubs, university cafeterias, palaces, and
                industrial laundry facilities — bringing the same commitment
                to quality and detail to every project regardless of scale.
              </p>
              <div style={styles.aboutHighlight}>
                <p
                  style={{
                    color: "#C9A84C",
                    fontWeight: 600,
                    marginBottom: 8,
                    fontSize: 15,
                  }}
                >
                  Our Mission
                </p>
                <p style={{ color: "#bbb", fontSize: 14, lineHeight: 1.8 }}>
                  To empower our clients with innovative, budget-conscious
                  kitchen designs and expert guidance — from concept to
                  completion — ensuring every project opens on time and
                  within budget.
                </p>
              </div>
              <div style={styles.aboutStats}>
                {[
                  ["16+", "Years in Business"],
                  ["500+", "Projects Done"],
                  ["100%", "Client Focus"],
                ].map(([n, l]) => (
                  <div key={l} style={styles.aboutStat}>
                    <div style={styles.aboutStatNum}>{n}</div>
                    <div style={styles.aboutStatLabel}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={styles.aboutImage}>
              <img
                src="https://images.unsplash.com/photo-1581299894007-aaa50297cf16?auto=format&fit=crop&w=700&h=480&q=80"
                alt="Commercial Kitchen"
                style={{ width: "100%", height: 480, objectFit: "cover" }}
                referrerPolicy="no-referrer"
                loading="lazy"
              />
              <div
                style={{
                  position: "absolute", bottom: 0, left: 0, right: 0,
                  background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
                  padding: "40px 30px 30px",
                }}
              >
                <p
                  style={{
                    color: "#C9A84C", fontWeight: 600, fontSize: 14,
                    letterSpacing: 2, textTransform: "uppercase",
                  }}
                >
                  Precision Engineered
                </p>
                <p style={{ color: "#fff", fontSize: 18, fontWeight: 600 }}>
                  Commercial Kitchen Solutions
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Services ── */}
      <section id="services" style={styles.section}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <p style={styles.sectionTag}>~ Our Services</p>
          <h2 style={styles.sectionTitle}>
            Comprehensive Design &amp; Consulting Services
          </h2>
          <div style={styles.divider} />
          <div style={styles.grid3}>
            {services.map((s) => (
              <div
                key={s.title}
                style={styles.serviceCard}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 12px 40px rgba(201,168,76,0.15)";
                  e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)";
                  e.currentTarget.style.transform = "translateY(-4px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.borderColor = "#eee";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div
                  style={{
                    position: "absolute", top: 0, left: 0, right: 0,
                    height: 3,
                    background: "linear-gradient(90deg, #C9A84C, #a07830)",
                    opacity: 0,
                    transition: "opacity .3s",
                  }}
                  className="card-top-border"
                />
                <div style={styles.serviceIcon}>{s.icon}</div>
                <h3 style={styles.serviceTitle}>{s.title}</h3>
                <p style={styles.serviceDesc}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How We Work ── */}
      <section id="process" style={styles.sectionDark}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <p style={{ ...styles.sectionTag }}>~ How We Work</p>
          <h2 style={styles.sectionTitleLight}>
            Our Proven Three-Step Process
          </h2>
          <div style={styles.divider} />
          <div style={styles.grid3}>
            {steps.map((s) => (
              <div
                key={s.num}
                style={styles.stepCard}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)";
                  e.currentTarget.style.background =
                    "rgba(201,168,76,0.05)";
                  e.currentTarget.style.transform = "translateY(-4px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor =
                    "rgba(201,168,76,0.2)";
                  e.currentTarget.style.background =
                    "rgba(255,255,255,0.05)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div style={styles.stepNum}>{s.num}</div>
                <h3 style={styles.stepTitle}>{s.title}</h3>
                <p style={styles.stepDesc}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Project Gallery ── */}
      <section style={{ padding: "80px 5%", background: "#fff" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <p style={styles.sectionTag}>~ Our Projects</p>
          <h2 style={styles.sectionTitle}>Featured Project Installations</h2>
          <div style={styles.divider} />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 20,
            }}
          >
            {[
              {
                url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&h=280&q=80",
                label: "5-Star Hotel Kitchen",
                location: "Riyadh, Saudi Arabia",
              },
              {
                url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&h=280&q=80",
                label: "Fine Dining Restaurant",
                location: "Jeddah, Saudi Arabia",
              },
              {
                url: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&h=280&q=80",
                label: "Hospital Central Kitchen",
                location: "Dammam, Saudi Arabia",
              },
              {
                url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&h=280&q=80",
                label: "Commercial Laundry Facility",
                location: "Riyadh, Saudi Arabia",
              },
            ].map((p) => (
              <div
                key={p.label}
                style={{
                  borderRadius: 8, overflow: "hidden", position: "relative",
                  height: 280, cursor: "pointer",
                  background: "#1a1a1a",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.querySelector(
                    ".overlay"
                  ).style.opacity = "1";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.querySelector(
                    ".overlay"
                  ).style.opacity = "0";
                }}
              >
                <img
                  src={p.url}
                  alt={p.label}
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.parentElement.style.background =
                      "linear-gradient(135deg, #1a1a1a, #2d2d2d)";
                  }}
                />
                <div
                  className="overlay"
                  style={{
                    position: "absolute", inset: 0,
                    background:
                      "linear-gradient(to top, rgba(0,0,0,0.85), rgba(201,168,76,0.2))",
                    display: "flex", flexDirection: "column",
                    justifyContent: "flex-end", padding: 24,
                    opacity: 0, transition: "opacity .3s",
                  }}
                >
                  <p
                    style={{
                      color: "#C9A84C", fontSize: 12, fontWeight: 600,
                      letterSpacing: 2, textTransform: "uppercase",
                      marginBottom: 6,
                    }}
                  >
                    {p.location}
                  </p>
                  <p
                    style={{ color: "#fff", fontSize: 18, fontWeight: 700 }}
                  >
                    {p.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" style={styles.sectionLight}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <p style={styles.sectionTag}>~ Client Testimonials</p>
          <h2 style={styles.sectionTitle}>What Our Clients Say</h2>
          <div style={styles.divider} />
          <div style={styles.grid3}>
            {testimonials.map((t) => (
              <div key={t.name} style={styles.testimonialCard}>
                <div style={styles.quoteIcon}>"</div>
                <p style={styles.testimonialText}>{t.text}</p>
                <div style={styles.testimonialAuthor}>
                  <div style={styles.authorAvatar}>{t.initials}</div>
                  <div>
                    <div style={styles.authorName}>{t.name}</div>
                    <div style={styles.authorCompany}>{t.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={styles.ctaSection}>
        <div style={styles.ctaGlow} />
        <div style={{ position: "relative", zIndex: 2 }}>
          <p
            style={{
              fontSize: 13, fontWeight: 600, letterSpacing: 3,
              color: "#C9A84C", textTransform: "uppercase", marginBottom: 16,
            }}
          >
            ~ Ready to Start?
          </p>
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(28px, 4vw, 52px)", fontWeight: 700,
              color: "#fff", marginBottom: 20,
            }}
          >
            Let's Design Your{" "}
            <span style={{ color: "#C9A84C" }}>Dream Kitchen</span>
          </h2>
          <p
            style={{
              fontSize: 16, color: "#888", maxWidth: 550,
              margin: "0 auto 40px", lineHeight: 1.8,
            }}
          >
            Chat with our AI assistant below or contact us directly. Our team
            responds within 24 hours on business days.
          </p>
          <div
            style={{
              display: "flex", gap: 16, justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <a href="tel:+966548489341">
              <button
                style={{
                  ...styles.btnPrimary,
                  display: "flex", alignItems: "center", gap: 10,
                }}
              >
                📞 Call Now: +966 54 848 9341
              </button>
            </a>
            <a href="mailto:contact@culinova.sa">
              <button style={styles.btnSecondary}>
                ✉ contact@culinova.sa
              </button>
            </a>
          </div>
        </div>
      </section>

      {/* ── Contact ── */}
      <section id="contact" style={styles.section}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <p style={styles.sectionTag}>~ Contact Us</p>
          <h2 style={styles.sectionTitle}>Get In Touch</h2>
          <div style={styles.divider} />
          <div style={styles.grid2}>
            <div>
              {[
                { icon: "📍", label: "Location", value: "Saudi Arabia" },
                {
                  icon: "📞",
                  label: "Phone",
                  value: "+966 54 848 9341",
                },
                { icon: "✉", label: "Email", value: "contact@culinova.sa" },
                {
                  icon: "🕐",
                  label: "Working Hours",
                  value: "Sunday – Friday, 09AM – 09PM",
                },
              ].map((c) => (
                <div
                  key={c.label}
                  style={{
                    display: "flex", gap: 20, marginBottom: 30,
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      width: 52, height: 52, borderRadius: 12, flexShrink: 0,
                      background:
                        "linear-gradient(135deg, #C9A84C, #a07830)",
                      display: "flex", alignItems: "center",
                      justifyContent: "center", fontSize: 20,
                    }}
                  >
                    {c.icon}
                  </div>
                  <div>
                    <p
                      style={{
                        fontSize: 13, color: "#888", textTransform: "uppercase",
                        letterSpacing: 1, marginBottom: 4,
                      }}
                    >
                      {c.label}
                    </p>
                    <p style={{ fontSize: 16, color: "#111", fontWeight: 500 }}>
                      {c.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                background: "#f9f9f9", borderRadius: 12, padding: "40px 35px",
                border: "1px solid #eee",
              }}
            >
              <h3
                style={{
                  fontFamily: "'Playfair Display', serif", fontSize: 24,
                  fontWeight: 700, marginBottom: 24, color: "#111",
                }}
              >
                Send Us a Message
              </h3>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={styles.footer}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={styles.footerGrid}>
            <div>
              <div style={styles.footerLogo}>CULINOVA</div>
              <p style={styles.footerDesc}>
                Saudi Arabia's trusted commercial kitchen and laundry design
                partner. 16 years of excellence in foodservice facility
                design and project execution.
              </p>
            </div>
            <div>
              <p style={styles.footerTitle}>Quick Links</p>
              {["About Us", "Our Services", "How We Work", "Contact Us"].map(
                (l) => (
                  <span
                    key={l}
                    style={{ ...styles.footerLink, display: "block" }}
                    onMouseEnter={(e) => (e.target.style.color = "#C9A84C")}
                    onMouseLeave={(e) => (e.target.style.color = "#666")}
                  >
                    {l}
                  </span>
                )
              )}
            </div>
            <div>
              <p style={styles.footerTitle}>Contact</p>
              <p style={styles.footerContact}>
                <span>📍</span> Saudi Arabia
              </p>
              <p style={styles.footerContact}>
                <span>📞</span> +966 54 848 9341
              </p>
              <p style={styles.footerContact}>
                <span>✉</span> contact@culinova.sa
              </p>
              <p style={styles.footerContact}>
                <span>🕐</span> Sunday – Friday, 09AM–09PM
              </p>
            </div>
          </div>
          <hr style={styles.footerDivider} />
          <p style={styles.footerBottom}>
            © 2024 Culinova | All rights reserved. | Saudi Arabia
          </p>
        </div>
      </footer>
    </>
  );
}

function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [status, setStatus] = useState(null);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          project_type: "Contact Form",
          lead_score: "warm",
        }),
      });
      if (res.ok) {
        setStatus("sent");
        setForm({ name: "", email: "", phone: "", message: "" });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  const inputStyle = {
    width: "100%", padding: "12px 16px", borderRadius: 6,
    border: "1px solid #ddd", fontSize: 14, color: "#333",
    background: "#fff", outline: "none", transition: "border-color .2s",
    fontFamily: "Inter, sans-serif",
  };

  return (
    <form onSubmit={submit}>
      {[
        { name: "name", placeholder: "Your Full Name *", required: true },
        { name: "phone", placeholder: "Phone Number", required: false },
        { name: "email", placeholder: "Email Address", required: false },
      ].map((f) => (
        <input
          key={f.name}
          type="text"
          name={f.name}
          placeholder={f.placeholder}
          required={f.required}
          value={form[f.name]}
          onChange={handle}
          style={{ ...inputStyle, marginBottom: 16 }}
          onFocus={(e) => (e.target.style.borderColor = "#C9A84C")}
          onBlur={(e) => (e.target.style.borderColor = "#ddd")}
        />
      ))}
      <textarea
        name="message"
        placeholder="Tell us about your project..."
        rows={4}
        value={form.message}
        onChange={handle}
        style={{ ...inputStyle, marginBottom: 20, resize: "vertical" }}
        onFocus={(e) => (e.target.style.borderColor = "#C9A84C")}
        onBlur={(e) => (e.target.style.borderColor = "#ddd")}
      />
      <button
        type="submit"
        disabled={status === "sending"}
        style={{
          width: "100%", padding: "14px",
          background:
            status === "sent"
              ? "#27ae60"
              : "linear-gradient(135deg, #C9A84C, #a07830)",
          color: "#fff", border: "none", borderRadius: 6,
          fontSize: 15, fontWeight: 600, cursor: "pointer",
          letterSpacing: 1, textTransform: "uppercase",
        }}
      >
        {status === "sending"
          ? "Sending..."
          : status === "sent"
          ? "✓ Message Sent!"
          : status === "error"
          ? "Error – Try Again"
          : "Send Message"}
      </button>
    </form>
  );
}
