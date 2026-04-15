import React, { useEffect, useState } from "react";

const GOLD = "#C9A84C";
const GOLD_DARK = "#a07830";

function useIsMobile(bp = 768) {
  const [mobile, setMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= bp : false
  );
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth <= bp);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, [bp]);
  return mobile;
}

export default function LandingPage() {
  const [mobileNav, setMobileNav] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
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
    { num: "01", title: "Plan", desc: "Free consultation to discuss project scope, vision, and requirements. We gather crucial details: location, seating capacity, utility availability, and budget parameters." },
    { num: "02", title: "Design", desc: "We create detailed floor plans, specify equipment, and collaborate with your architects and engineers. You receive itemized equipment lists with specs, models, and accessories." },
    { num: "03", title: "Develop", desc: "With approved plans, we coordinate with your contractor and trades. We provide utility schedules, elevations, and installation instructions for smooth construction." },
  ];

  const testimonials = [
    { name: "Robert Smith", company: "Delta INC", initials: "RS", text: "Culinova has been our kitchen design partner for ten years. Their ability to deliver economical, high-quality designs — even under tight budget and space constraints — is unmatched." },
    { name: "John Doe", company: "Penta Co", initials: "JD", text: "After 30 years in one location, relocating felt daunting. Culinova made the process seamless — from design to equipment selection. Their expertise turned what could have been a nightmare into a smooth success." },
    { name: "Sarah Al-Rashidi", company: "Grand Hotel Riyadh", initials: "SR", text: "Culinova delivered a state-of-the-art hotel kitchen that exceeded our expectations. Their attention to workflow efficiency and code compliance was exceptional. We've now used them for three projects." },
  ];

  const px = isMobile ? "20px" : "5%";
  const sectionPad = isMobile ? "60px 20px" : "100px 5%";

  return (
    <>
      {/* ── Header ── */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
        background: scrolled ? "rgba(17,17,17,0.98)" : "rgba(17,17,17,0.92)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(201,168,76,0.2)",
        padding: `0 ${px}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 70,
        boxShadow: scrolled ? "0 4px 30px rgba(0,0,0,0.3)" : "none",
        transition: "all .3s",
      }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: isMobile ? 22 : 28, fontWeight: 700, color: GOLD, letterSpacing: 2 }}>
          CULINOVA
        </div>

        {/* Desktop Nav */}
        <nav className="lp-nav" style={{ display: "flex", gap: 32, listStyle: "none" }}>
          {[["About","about"],["Services","services"],["How We Work","process"],["Testimonials","testimonials"],["Contact","contact"]].map(([l,id]) => (
            <span key={id} style={{ color: "#ccc", fontSize: 14, fontWeight: 500, letterSpacing: 1, textTransform: "uppercase", cursor: "pointer" }}
              onClick={() => scrollTo(id)}
              onMouseEnter={e => e.target.style.color = GOLD}
              onMouseLeave={e => e.target.style.color = "#ccc"}
            >{l}</span>
          ))}
        </nav>

        <button className="lp-cta-btn" style={{ background: `linear-gradient(135deg,${GOLD},${GOLD_DARK})`, color: "#fff", padding: "10px 24px", borderRadius: 4, fontSize: 14, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }} onClick={() => scrollTo("contact")}>
          Get Free Quote
        </button>

        {/* Hamburger */}
        <button className="lp-hamburger" onClick={() => setMobileNav(!mobileNav)}
          style={{ display: "none", flexDirection: "column", gap: 5, cursor: "pointer", padding: 8, background: "transparent", border: "none" }}>
          {[0,1,2].map(i => (
            <span key={i} style={{
              display: "block", width: 25, height: 2, background: GOLD, borderRadius: 2,
              transition: "all .3s",
              transform: mobileNav
                ? (i === 0 ? "rotate(45deg) translate(5px,5px)" : i === 2 ? "rotate(-45deg) translate(5px,-5px)" : "scaleX(0)")
                : "none",
            }} />
          ))}
        </button>
      </header>

      {/* Mobile Nav Drawer */}
      {mobileNav && (
        <div className="lp-mobile-nav" style={{ display: "flex" }}>
          {[["About","about"],["Services","services"],["How We Work","process"],["Testimonials","testimonials"],["Contact","contact"]].map(([l,id]) => (
            <span key={id} onClick={() => scrollTo(id)} style={{ display: "block", padding: "14px 0", fontSize: 15, color: "#ccc", borderBottom: "1px solid rgba(255,255,255,0.05)", letterSpacing: 1, textTransform: "uppercase", cursor: "pointer" }}>{l}</span>
          ))}
          <button onClick={() => scrollTo("contact")} style={{ marginTop: 16, background: `linear-gradient(135deg,${GOLD},${GOLD_DARK})`, color: "#fff", padding: 14, borderRadius: 4, textAlign: "center", fontWeight: 600, fontSize: 15 }}>
            Get Free Quote
          </button>
        </div>
      )}

      {/* ── Hero ── */}
      <section style={{ minHeight: "100vh", position: "relative", display: "flex", alignItems: "center", overflow: "hidden", background: "linear-gradient(135deg,#0a0a0a,#1a1a1a)" }}>
        <div style={{ position: "absolute", inset: 0, background: "url('https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1600&q=80') center/cover no-repeat", opacity: 0.15 }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,rgba(10,10,10,0.95) 50%,rgba(201,168,76,0.05) 100%)" }} />

        <div className="hero-content" style={{ position: "relative", zIndex: 2, padding: isMobile ? "110px 20px 60px" : "120px 5% 80px", maxWidth: 750 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)", color: GOLD, padding: "6px 16px", borderRadius: 20, fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 24 }}>
            <span>★</span> Saudi Arabia's Premier Kitchen Design Firm
          </div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(30px,6vw,72px)", fontWeight: 700, color: "#fff", lineHeight: 1.15, marginBottom: 24 }}>
            Commercial Kitchen &amp; <span style={{ color: GOLD }}>Laundry Design</span> Excellence
          </h1>
          <p style={{ fontSize: "clamp(14px,2vw,18px)", color: "#aaa", lineHeight: 1.8, marginBottom: 40, maxWidth: 600 }}>
            16 years of expertise designing and executing world-class commercial kitchen and laundry projects for hotels, restaurants, hospitals, and hospitality venues across Saudi Arabia.
          </p>
          <div className="hero-btns" style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <button onClick={() => scrollTo("contact")} style={{ background: `linear-gradient(135deg,${GOLD},${GOLD_DARK})`, color: "#fff", padding: "16px 36px", borderRadius: 4, fontSize: 15, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", boxShadow: "0 4px 20px rgba(201,168,76,0.3)", border: "none", cursor: "pointer" }}>
              Start Your Project
            </button>
            <button onClick={() => scrollTo("services")} style={{ background: "transparent", color: GOLD, padding: "16px 36px", borderRadius: 4, fontSize: 15, fontWeight: 600, letterSpacing: 1, cursor: "pointer", border: "2px solid rgba(201,168,76,0.5)", textTransform: "uppercase" }}>
              Our Services
            </button>
          </div>
        </div>

        {/* Desktop stats */}
        <div className="hero-stats" style={{ position: "absolute", bottom: 50, right: "5%", display: "flex", gap: 40, zIndex: 2 }}>
          {[["16+","Years Experience"],["500+","Projects Completed"],["98%","Client Satisfaction"]].map(([n,l]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 36, fontWeight: 700, color: GOLD }}>{n}</div>
              <div style={{ fontSize: 12, color: "#888", textTransform: "uppercase", letterSpacing: 1 }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Mobile stats bar */}
      {isMobile && (
        <div style={{ background: "#111", padding: "24px 20px", display: "flex", justifyContent: "space-around" }}>
          {[["16+","Years"],["500+","Projects"],["98%","Satisfaction"]].map(([n,l]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 700, color: GOLD }}>{n}</div>
              <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 1 }}>{l}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── About ── */}
      <section id="about" style={{ padding: sectionPad, background: "#f9f9f9" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="grid2" style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit,minmax(300px,1fr))", gap: 40, alignItems: "center" }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: 3, color: GOLD, textTransform: "uppercase", marginBottom: 12 }}>~ About Culinova</p>
              <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(24px,4vw,46px)", fontWeight: 700, color: "#111", marginBottom: 20, lineHeight: 1.2 }}>
                16 Years of Commercial Kitchen Design Excellence
              </h2>
              <div style={{ width: 60, height: 3, background: `linear-gradient(90deg,${GOLD},${GOLD_DARK})`, margin: "0 0 30px" }} />
              <p style={{ fontSize: 15, color: "#555", lineHeight: 1.9, marginBottom: 16 }}>
                Culinova is Saudi Arabia's trusted partner for commercial kitchen and laundry project design. With extensive experience in value engineering and cost optimization, we deliver precision-designed foodservice facilities that perform at the highest level.
              </p>
              <p style={{ fontSize: 15, color: "#555", lineHeight: 1.9, marginBottom: 24 }}>
                We've served large hotels, restaurants, hospitals, places of worship, country clubs, university cafeterias, palaces, and industrial laundry facilities — bringing the same commitment to every project.
              </p>
              <div style={{ background: "linear-gradient(135deg,#1a1a1a,#2d2d2d)", padding: "24px 28px", borderRadius: 8, borderLeft: "4px solid #C9A84C", color: "#fff", marginBottom: 24 }}>
                <p style={{ color: GOLD, fontWeight: 600, marginBottom: 8, fontSize: 14 }}>Our Mission</p>
                <p style={{ color: "#bbb", fontSize: 14, lineHeight: 1.8 }}>To empower our clients with innovative, budget-conscious kitchen designs and expert guidance — from concept to completion.</p>
              </div>
              <div style={{ display: "flex", gap: isMobile ? 16 : 30, flexWrap: "wrap" }}>
                {[["16+","Years in Business"],["500+","Projects Done"],["100%","Client Focus"]].map(([n,l]) => (
                  <div key={l} style={{ flex: 1, minWidth: 80 }}>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 32, fontWeight: 700, color: GOLD }}>{n}</div>
                    <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
            {!isMobile && (
              <div style={{ borderRadius: 8, overflow: "hidden", position: "relative", background: "#1a1a1a", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
                <img src="https://images.unsplash.com/photo-1581299894007-aaa50297cf16?auto=format&fit=crop&w=700&h=480&q=80" alt="Commercial Kitchen" style={{ width: "100%", height: 480, objectFit: "cover" }} referrerPolicy="no-referrer" loading="lazy" />
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(to top,rgba(0,0,0,0.8),transparent)", padding: "40px 30px 30px" }}>
                  <p style={{ color: GOLD, fontWeight: 600, fontSize: 13, letterSpacing: 2, textTransform: "uppercase" }}>Precision Engineered</p>
                  <p style={{ color: "#fff", fontSize: 18, fontWeight: 600 }}>Commercial Kitchen Solutions</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Services ── */}
      <section id="services" style={{ padding: sectionPad }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: 3, color: GOLD, textTransform: "uppercase", marginBottom: 12 }}>~ Our Services</p>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(24px,4vw,46px)", fontWeight: 700, color: "#111", marginBottom: 20, lineHeight: 1.2 }}>Comprehensive Design &amp; Consulting Services</h2>
          <div style={{ width: 60, height: 3, background: `linear-gradient(90deg,${GOLD},${GOLD_DARK})`, margin: "0 0 40px" }} />
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit,minmax(260px,1fr))", gap: isMobile ? 16 : 28 }}>
            {services.map(s => (
              <div key={s.title} style={{ background: "#fff", borderRadius: 8, padding: isMobile ? "24px 20px" : "35px 30px", border: "1px solid #eee", transition: "all .3s", position: "relative", overflow: "hidden" }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 12px 40px rgba(201,168,76,0.15)"; e.currentTarget.style.transform = "translateY(-4px)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}>
                <div style={{ width: 52, height: 52, borderRadius: 12, background: `linear-gradient(135deg,${GOLD},${GOLD_DARK})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 16, color: "#fff" }}>{s.icon}</div>
                <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: "#111", marginBottom: 10 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: "#666", lineHeight: 1.8 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How We Work ── */}
      <section id="process" style={{ padding: sectionPad, background: "linear-gradient(135deg,#111,#1a1a1a)", color: "#fff" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: 3, color: GOLD, textTransform: "uppercase", marginBottom: 12 }}>~ How We Work</p>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(24px,4vw,46px)", fontWeight: 700, color: "#fff", marginBottom: 20 }}>Our Proven Three-Step Process</h2>
          <div style={{ width: 60, height: 3, background: `linear-gradient(90deg,${GOLD},${GOLD_DARK})`, margin: "0 0 40px" }} />
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: isMobile ? 16 : 28 }}>
            {steps.map(s => (
              <div key={s.num} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: isMobile ? "28px 20px" : "40px 35px", border: "1px solid rgba(201,168,76,0.2)", position: "relative", transition: "all .3s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)"; e.currentTarget.style.transform = "translateY(-4px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.2)"; e.currentTarget.style.transform = "translateY(0)"; }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 56, fontWeight: 700, color: "rgba(201,168,76,0.15)", position: "absolute", top: 16, right: 20, lineHeight: 1 }}>{s.num}</div>
                <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: GOLD, marginBottom: 14 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: "#bbb", lineHeight: 1.8 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Project Gallery ── */}
      <section style={{ padding: sectionPad, background: "#fff" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: 3, color: GOLD, textTransform: "uppercase", marginBottom: 12 }}>~ Our Projects</p>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(24px,4vw,46px)", fontWeight: 700, color: "#111", marginBottom: 20 }}>Featured Project Installations</h2>
          <div style={{ width: 60, height: 3, background: `linear-gradient(90deg,${GOLD},${GOLD_DARK})`, margin: "0 0 36px" }} />
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
            {[
              { url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&h=260&q=80", label: "5-Star Hotel Kitchen", location: "Riyadh, Saudi Arabia" },
              { url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&h=260&q=80", label: "Fine Dining Restaurant", location: "Jeddah, Saudi Arabia" },
              { url: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&h=260&q=80", label: "Hospital Central Kitchen", location: "Dammam, Saudi Arabia" },
              { url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&h=260&q=80", label: "Commercial Laundry", location: "Riyadh, Saudi Arabia" },
            ].map(p => (
              <div key={p.label} style={{ borderRadius: 8, overflow: "hidden", position: "relative", height: isMobile ? 200 : 260, background: "#1a1a1a" }}>
                <img src={p.url} alt={p.label} referrerPolicy="no-referrer" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(0,0,0,0.75),transparent)", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "20px 18px" }}>
                  <p style={{ color: GOLD, fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>{p.location}</p>
                  <p style={{ color: "#fff", fontSize: 16, fontWeight: 700 }}>{p.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" style={{ padding: sectionPad, background: "#f9f9f9" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: 3, color: GOLD, textTransform: "uppercase", marginBottom: 12 }}>~ Client Testimonials</p>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(24px,4vw,46px)", fontWeight: 700, color: "#111", marginBottom: 20 }}>What Our Clients Say</h2>
          <div style={{ width: 60, height: 3, background: `linear-gradient(90deg,${GOLD},${GOLD_DARK})`, margin: "0 0 36px" }} />
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit,minmax(280px,1fr))", gap: isMobile ? 16 : 28 }}>
            {testimonials.map(t => (
              <div key={t.name} style={{ background: "#fff", borderRadius: 12, padding: isMobile ? "28px 20px" : "35px 30px", border: "1px solid #eee", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", position: "relative" }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 60, color: GOLD, opacity: 0.2, lineHeight: 1, position: "absolute", top: 16, left: 20 }}>"</div>
                <p style={{ fontSize: 14, color: "#555", lineHeight: 1.8, marginBottom: 20, paddingTop: 16 }}>{t.text}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: `linear-gradient(135deg,${GOLD},${GOLD_DARK})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 16, flexShrink: 0 }}>{t.initials}</div>
                  <div>
                    <div style={{ fontWeight: 600, color: "#111", fontSize: 14 }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: "#888" }}>{t.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: sectionPad, textAlign: "center", background: "linear-gradient(135deg,#0a0a0a,#1a1a1a)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle,rgba(201,168,76,0.08) 0%,transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 2 }}>
          <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: 3, color: GOLD, textTransform: "uppercase", marginBottom: 16 }}>~ Ready to Start?</p>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(24px,4vw,52px)", fontWeight: 700, color: "#fff", marginBottom: 20 }}>
            Let's Design Your <span style={{ color: GOLD }}>Dream Kitchen</span>
          </h2>
          <p style={{ fontSize: 15, color: "#888", maxWidth: 520, margin: "0 auto 36px", lineHeight: 1.8 }}>
            Chat with our AI assistant below or contact us directly. Our team responds within 24 hours on business days.
          </p>
          <div className="cta-btns" style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="tel:+966548489341" style={{ width: isMobile ? "100%" : "auto" }}>
              <button style={{ background: `linear-gradient(135deg,${GOLD},${GOLD_DARK})`, color: "#fff", padding: "15px 28px", borderRadius: 4, fontSize: 15, fontWeight: 600, display: "flex", alignItems: "center", gap: 10, width: "100%", justifyContent: "center" }}>
                📞 Call: +966 54 848 9341
              </button>
            </a>
            <a href="mailto:contact@culinova.sa" style={{ width: isMobile ? "100%" : "auto" }}>
              <button style={{ background: "transparent", color: GOLD, padding: "15px 28px", borderRadius: 4, fontSize: 15, fontWeight: 600, border: "2px solid rgba(201,168,76,0.5)", width: "100%" }}>
                ✉ contact@culinova.sa
              </button>
            </a>
          </div>
        </div>
      </section>

      {/* ── Contact ── */}
      <section id="contact" style={{ padding: sectionPad }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: 3, color: GOLD, textTransform: "uppercase", marginBottom: 12 }}>~ Contact Us</p>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(24px,4vw,46px)", fontWeight: 700, color: "#111", marginBottom: 20 }}>Get In Touch</h2>
          <div style={{ width: 60, height: 3, background: `linear-gradient(90deg,${GOLD},${GOLD_DARK})`, margin: "0 0 40px" }} />
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 32 : 60, alignItems: "start" }}>
            <div>
              {[
                { icon: "📍", label: "Location",     value: "Saudi Arabia" },
                { icon: "📞", label: "Phone",         value: "+966 54 848 9341" },
                { icon: "✉",  label: "Email",         value: "contact@culinova.sa" },
                { icon: "🕐", label: "Working Hours", value: "Sunday – Friday, 09AM – 09PM" },
              ].map(c => (
                <div key={c.label} style={{ display: "flex", gap: 18, marginBottom: 24, alignItems: "flex-start" }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0, background: `linear-gradient(135deg,${GOLD},${GOLD_DARK})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{c.icon}</div>
                  <div>
                    <p style={{ fontSize: 12, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{c.label}</p>
                    <p style={{ fontSize: 15, color: "#111", fontWeight: 500 }}>{c.value}</p>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: "#f9f9f9", borderRadius: 12, padding: isMobile ? "28px 20px" : "40px 35px", border: "1px solid #eee" }}>
              <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, marginBottom: 24, color: "#111" }}>Send Us a Message</h3>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: "#0a0a0a", color: "#888", padding: isMobile ? "48px 20px 24px" : "60px 5% 30px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit,minmax(200px,1fr))", gap: isMobile ? 28 : 40, marginBottom: 40 }}>
            <div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, color: GOLD, letterSpacing: 2, marginBottom: 14 }}>CULINOVA</div>
              <p style={{ fontSize: 14, color: "#666", lineHeight: 1.8, maxWidth: 280 }}>Saudi Arabia's trusted commercial kitchen and laundry design partner. 16 years of excellence in foodservice facility design.</p>
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", textTransform: "uppercase", letterSpacing: 2, marginBottom: 18 }}>Quick Links</p>
              {["About Us","Our Services","How We Work","Contact Us"].map(l => (
                <span key={l} style={{ display: "block", fontSize: 14, color: "#666", marginBottom: 10, cursor: "pointer" }}
                  onMouseEnter={e => e.target.style.color = GOLD}
                  onMouseLeave={e => e.target.style.color = "#666"}
                >{l}</span>
              ))}
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", textTransform: "uppercase", letterSpacing: 2, marginBottom: 18 }}>Contact</p>
              {[["📍","Saudi Arabia"],["📞","+966 54 848 9341"],["✉","contact@culinova.sa"],["🕐","Sun–Fri, 09AM–09PM"]].map(([i,v]) => (
                <p key={v} style={{ fontSize: 14, color: "#666", marginBottom: 10, display: "flex", gap: 10 }}><span>{i}</span>{v}</p>
              ))}
            </div>
          </div>
          <hr style={{ border: "none", borderTop: "1px solid #1a1a1a", margin: "0 0 24px" }} />
          <p style={{ textAlign: "center", fontSize: 13, color: "#444" }}>© 2024 Culinova | All rights reserved. | Saudi Arabia</p>
        </div>
      </footer>
    </>
  );
}

function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [status, setStatus] = useState(null);
  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async e => {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, project_type: "Contact Form", lead_score: "warm" }),
      });
      setStatus(res.ok ? "sent" : "error");
      if (res.ok) setForm({ name: "", email: "", phone: "", message: "" });
    } catch {
      setStatus("error");
    }
  };

  const inp = { width: "100%", padding: "12px 14px", borderRadius: 6, border: "1px solid #ddd", fontSize: 14, color: "#333", background: "#fff", outline: "none", marginBottom: 14, fontFamily: "Inter,sans-serif" };

  return (
    <form onSubmit={submit}>
      {[{name:"name",placeholder:"Your Full Name *",required:true},{name:"phone",placeholder:"Phone Number"},{name:"email",placeholder:"Email Address"}].map(f => (
        <input key={f.name} type="text" name={f.name} placeholder={f.placeholder} required={!!f.required} value={form[f.name]} onChange={handle} style={inp}
          onFocus={e => e.target.style.borderColor = GOLD}
          onBlur={e => e.target.style.borderColor = "#ddd"} />
      ))}
      <textarea name="message" placeholder="Tell us about your project..." rows={4} value={form.message} onChange={handle} style={{ ...inp, marginBottom: 18, resize: "vertical" }}
        onFocus={e => e.target.style.borderColor = GOLD}
        onBlur={e => e.target.style.borderColor = "#ddd"} />
      <button type="submit" disabled={status === "sending"} style={{ width: "100%", padding: 14, background: status === "sent" ? "#27ae60" : `linear-gradient(135deg,${GOLD},${GOLD_DARK})`, color: "#fff", border: "none", borderRadius: 6, fontSize: 15, fontWeight: 600, cursor: "pointer", letterSpacing: 1, textTransform: "uppercase" }}>
        {status === "sending" ? "Sending…" : status === "sent" ? "✓ Message Sent!" : status === "error" ? "Error – Try Again" : "Send Message"}
      </button>
    </form>
  );
}
