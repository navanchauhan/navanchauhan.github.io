---
date: 2025-12-12 23:36
description: Just a custom page with brewskis after brewskis!
tags: Life, Skiing
draft: false
---

# Brewskis While Skiing

This was originally meant to be a collection of brewskis consumed over the thirty days I got this season, but some were enjoyed off the slopes and felt worth saving, and I also forgot to record a few. So this is simply a post to commemorate some excellent brewskis from the 2024–2025 season...

<style>
@import url('https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&family=Pirata+One&family=Special+Elite&display=swap');

/* Override page background for this post */
body, main, article, .content, .post-content, .page {
  background: #f4e4bc !important;
}

/* ===== AGED PARCHMENT MAP ===== */
.expedition-map {
  position: relative;
  background: transparent;
  padding: 3rem 2rem;
  box-shadow: none;
  border: none;
  border-radius: 0;
  overflow: hidden;
}


/* ===== BURN MARKS / DAMAGE ===== */
.burn-mark {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  z-index: 2;
}

.burn-1 {
  top: 8%;
  right: 12%;
  width: 60px;
  height: 45px;
  background: radial-gradient(ellipse at center,
    rgba(30, 15, 5, 0.4) 0%,
    rgba(60, 30, 10, 0.3) 30%,
    rgba(90, 50, 20, 0.15) 60%,
    transparent 100%
  );
  transform: rotate(25deg);
  filter: blur(2px);
}

.burn-2 {
  bottom: 15%;
  left: 5%;
  width: 80px;
  height: 50px;
  background: radial-gradient(ellipse at center,
    rgba(20, 10, 0, 0.35) 0%,
    rgba(50, 25, 10, 0.25) 40%,
    rgba(80, 45, 15, 0.1) 70%,
    transparent 100%
  );
  transform: rotate(-15deg);
  filter: blur(3px);
}

.burn-3 {
  top: 45%;
  right: 3%;
  width: 40px;
  height: 70px;
  background: radial-gradient(ellipse at center,
    rgba(25, 12, 5, 0.3) 0%,
    rgba(55, 30, 12, 0.2) 50%,
    transparent 100%
  );
  transform: rotate(60deg);
  filter: blur(2px);
}

.burn-4 {
  top: 72%;
  left: 15%;
  width: 55px;
  height: 35px;
  background: radial-gradient(ellipse at center,
    rgba(35, 18, 8, 0.25) 0%,
    rgba(70, 40, 15, 0.15) 50%,
    transparent 100%
  );
  transform: rotate(-30deg);
  filter: blur(2px);
}


/* Fold/crease lines */
.fold-line {
  position: absolute;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(139, 90, 43, 0.15) 45%,
    rgba(101, 67, 33, 0.25) 50%,
    rgba(139, 90, 43, 0.15) 55%,
    transparent 100%
  );
  pointer-events: none;
  z-index: 2;
}

.fold-h {
  left: 0;
  right: 0;
  height: 3px;
  top: 33%;
}

.fold-v {
  top: 0;
  bottom: 0;
  width: 3px;
  left: 50%;
  background: linear-gradient(180deg,
    transparent 0%,
    rgba(139, 90, 43, 0.12) 45%,
    rgba(101, 67, 33, 0.2) 50%,
    rgba(139, 90, 43, 0.12) 55%,
    transparent 100%
  );
}

/* ===== DECORATIVE MAP ELEMENTS ===== */
.compass-rose {
  position: absolute;
  top: 20px;
  right: 30px;
  width: 80px;
  height: 80px;
  opacity: 0.6;
  z-index: 2;
}

.compass-rose::before {
  content: "✧";
  font-size: 70px;
  color: #654321;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.compass-rose::after {
  content: "N";
  font-family: 'IM Fell English', serif;
  font-size: 14px;
  color: #654321;
  position: absolute;
  top: -5px;
  left: 50%;
  transform: translateX(-50%);
  font-weight: bold;
}

/* ===== EXPEDITION TITLE ===== */
.expedition-header {
  text-align: center;
  margin-bottom: 2rem;
  position: relative;
  z-index: 10;
  border-bottom: 2px solid #8B6914;
  padding-bottom: 1.5rem;
}

.expedition-header::before,
.expedition-header::after {
  content: "❧";
  font-size: 1.5rem;
  color: #654321;
  vertical-align: middle;
  margin: 0 1rem;
}

.expedition-title {
  font-family: 'Pirata One', cursive;
  font-size: 2.8rem;
  color: #3d2914;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
  letter-spacing: 3px;
  margin: 0;
  display: inline;
}

.expedition-subtitle {
  font-family: 'IM Fell English', serif;
  font-size: 1.1rem;
  color: #5c4033;
  font-style: italic;
  display: block;
  margin-top: 0.75rem;
}

.expedition-date {
  font-family: 'Special Elite', cursive;
  font-size: 0.9rem;
  color: #6b5344;
  margin-top: 0.5rem;
  letter-spacing: 2px;
}

/* ===== LEGEND CARTOUCHE ===== */
.map-cartouche {
  background: linear-gradient(135deg, #f5e6c8 0%, #e8d4a8 100%);
  border: 3px double #8B6914;
  border-radius: 8px;
  padding: 1.25rem 1.5rem;
  margin: 0 auto 2.5rem;
  max-width: 500px;
  position: relative;
  z-index: 10;
  box-shadow:
    inset 0 0 20px rgba(139, 90, 43, 0.15),
    3px 3px 10px rgba(0,0,0,0.2);
}

.cartouche-title {
  font-family: 'Pirata One', cursive;
  font-size: 1.1rem;
  color: #3d2914;
  text-align: center;
  margin-bottom: 1rem;
  letter-spacing: 2px;
  border-bottom: 1px solid #a08060;
  padding-bottom: 0.5rem;
}

.cartouche-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.cartouche-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-family: 'IM Fell English', serif;
  font-size: 0.9rem;
  color: #4a3728;
}

.cartouche-symbol {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
}

.sym-green {
  color: #2d5a27;
  font-size: 1.4rem;
}

.sym-blue {
  color: #1e4d6b;
  font-size: 1.2rem;
}

.sym-black {
  color: #1a1a1a;
  font-size: 1.3rem;
}

.sym-terrain {
  color: #8B4513;
  font-size: 1.2rem;
}

/* ===== REGION BANNERS ===== */
.region-banner {
  position: relative;
  z-index: 10;
  margin: 2.5rem 0 1.5rem;
  text-align: center;
}

.region-scroll {
  display: inline-block;
  background: linear-gradient(180deg, #e8d5a3 0%, #d4c090 50%, #e8d5a3 100%);
  padding: 0.75rem 2.5rem;
  position: relative;
  box-shadow: 0 3px 10px rgba(0,0,0,0.2);
  border-top: 2px solid #a08060;
  border-bottom: 2px solid #a08060;
}

/* Scroll ends */
.region-scroll::before,
.region-scroll::after {
  content: "";
  position: absolute;
  top: -5px;
  bottom: -5px;
  width: 25px;
  background: linear-gradient(180deg, #c9b896 0%, #a08060 20%, #d4c090 50%, #a08060 80%, #c9b896 100%);
  border-radius: 3px;
  box-shadow: 2px 2px 5px rgba(0,0,0,0.2);
}

.region-scroll::before {
  left: -15px;
  border-left: 2px solid #8B6914;
}

.region-scroll::after {
  right: -15px;
  border-right: 2px solid #8B6914;
}

.region-name {
  font-family: 'Pirata One', cursive;
  font-size: 1.4rem;
  color: #3d2914;
  letter-spacing: 2px;
  margin: 0;
}

.region-territory {
  font-family: 'IM Fell English', serif;
  font-size: 0.8rem;
  color: #6b5344;
  font-style: italic;
  display: block;
  margin-top: 2px;
}

/* ===== PHOTO SPECIMENS GRID ===== */
.specimen-collection {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  justify-content: center;
  padding: 1rem;
  position: relative;
  z-index: 10;
}

/* ===== VINTAGE PHOTOGRAPH ===== */
.vintage-photo {
  background: #f8f4e8;
  padding: 12px 12px 55px 12px;
  box-shadow:
    0 2px 4px rgba(0,0,0,0.15),
    0 6px 20px rgba(0,0,0,0.2),
    inset 0 0 40px rgba(139, 90, 43, 0.1);
  transform: rotate(var(--tilt, 0deg));
  transition: all 0.4s ease;
  position: relative;
  width: 210px;
  flex-shrink: 0;
  /* Aged photo paper */
  background: linear-gradient(145deg,
    #faf6ec 0%,
    #f0e8d8 30%,
    #f5efe0 70%,
    #ebe3d0 100%
  );
  border: 1px solid #c9b896;
}

.vintage-photo:nth-child(5n+1) { --tilt: -3deg; }
.vintage-photo:nth-child(5n+2) { --tilt: 2.5deg; }
.vintage-photo:nth-child(5n+3) { --tilt: -1.5deg; }
.vintage-photo:nth-child(5n+4) { --tilt: 4deg; }
.vintage-photo:nth-child(5n+5) { --tilt: -2deg; }

.vintage-photo:hover {
  transform: rotate(0deg) scale(1.05) translateY(-8px);
  box-shadow:
    0 15px 35px rgba(0,0,0,0.25),
    inset 0 0 40px rgba(139, 90, 43, 0.1);
  z-index: 100;
}

/* Photo corner mounts */
.vintage-photo::before,
.vintage-photo::after {
  content: "";
  position: absolute;
  width: 20px;
  height: 20px;
  border: 2px solid #8B6914;
  opacity: 0.5;
}

.vintage-photo::before {
  top: 6px;
  left: 6px;
  border-right: none;
  border-bottom: none;
}

.vintage-photo::after {
  bottom: 50px;
  right: 6px;
  border-left: none;
  border-top: none;
}

/* Wax seal for rating */
.wax-seal {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  z-index: 5;
  box-shadow:
    inset -2px -2px 4px rgba(0,0,0,0.3),
    inset 2px 2px 4px rgba(255,255,255,0.2),
    2px 2px 6px rgba(0,0,0,0.3);
}

.seal-green {
  background: radial-gradient(circle at 30% 30%, #4a8f44, #2d5a27);
  color: #c5e8c2;
}

.seal-blue {
  background: radial-gradient(circle at 30% 30%, #3a7ca5, #1e4d6b);
  color: #b8d4e8;
}

.seal-black {
  background: radial-gradient(circle at 30% 30%, #4a4a4a, #1a1a1a);
  color: #c0c0c0;
}

.seal-terrain {
  background: radial-gradient(circle at 30% 30%, #b8860b, #8B4513);
  color: #f5deb3;
}

/* Vintage photo image */
.vintage-photo img {
  width: 100%;
  height: 175px;
  object-fit: cover;
  display: block;
  /* Base sepia/vintage tint */
  filter: sepia(20%) contrast(1.05) brightness(0.95) saturate(0.9);
  border: 1px solid #d4c4a8;
}

/* Varying sepia intensities for different photos */
.vintage-photo.sepia-heavy img {
  filter: sepia(45%) contrast(1.1) brightness(0.88) saturate(0.75);
}

.vintage-photo.sepia-medium img {
  filter: sepia(30%) contrast(1.08) brightness(0.92) saturate(0.85);
}

.vintage-photo.sepia-light img {
  filter: sepia(15%) contrast(1.02) brightness(0.96) saturate(0.95);
}

/* Faded/damaged photo effects */
.vintage-photo.faded img {
  filter: sepia(35%) contrast(0.95) brightness(1.05) saturate(0.7);
  opacity: 0.92;
}

.vintage-photo.sun-damaged img {
  filter: sepia(25%) contrast(1.15) brightness(1.1) saturate(0.6);
}

/* Photo damage overlays */
.photo-damage {
  position: absolute;
  top: 12px;
  left: 12px;
  right: 12px;
  bottom: 55px;
  pointer-events: none;
  z-index: 3;
}

/* Scratches effect */
.scratches::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    linear-gradient(73deg, transparent 30%, rgba(255,255,255,0.1) 30.5%, transparent 31%),
    linear-gradient(112deg, transparent 60%, rgba(255,255,255,0.08) 60.3%, transparent 60.6%),
    linear-gradient(167deg, transparent 45%, rgba(0,0,0,0.05) 45.2%, transparent 45.4%);
}

/* Water damage / foxing spots */
.foxing::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(circle at 15% 20%, rgba(139, 100, 60, 0.15) 0%, transparent 8%),
    radial-gradient(circle at 80% 70%, rgba(120, 85, 50, 0.12) 0%, transparent 6%),
    radial-gradient(circle at 60% 30%, rgba(150, 110, 70, 0.1) 0%, transparent 5%),
    radial-gradient(circle at 25% 80%, rgba(130, 95, 55, 0.08) 0%, transparent 7%);
}

/* Corner wear */
.corner-wear::before {
  content: "";
  position: absolute;
  bottom: 0;
  right: 0;
  width: 30px;
  height: 30px;
  background: radial-gradient(ellipse at 100% 100%,
    rgba(255, 250, 240, 0.6) 0%,
    rgba(245, 235, 215, 0.3) 40%,
    transparent 70%
  );
}

/* Vignette effect on photos */
.vignette::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  box-shadow: inset 0 0 30px rgba(60, 40, 20, 0.4);
  pointer-events: none;
}

/* Typewriter caption */
.photo-caption {
  position: absolute;
  bottom: 8px;
  left: 12px;
  right: 12px;
  text-align: center;
}

.specimen-name {
  font-family: 'Special Elite', cursive;
  font-size: 0.8rem;
  color: #3d2914;
  display: block;
  line-height: 1.3;
}

.specimen-notes {
  font-family: 'IM Fell English', serif;
  font-size: 0.7rem;
  color: #6b5344;
  font-style: italic;
  display: block;
  margin-top: 3px;
}

/* ===== CATALOG NUMBER ===== */
.catalog-no {
  position: absolute;
  bottom: 52px;
  left: 14px;
  font-family: 'Special Elite', cursive;
  font-size: 0.6rem;
  color: #a08060;
}

/* ===== MAP DECORATIONS ===== */
.map-decoration {
  position: absolute;
  font-family: 'IM Fell English', serif;
  color: #8B6914;
  opacity: 0.4;
  z-index: 1;
  pointer-events: none;
}

.deco-1 {
  top: 15%;
  left: 5%;
  font-size: 2rem;
  transform: rotate(-15deg);
}

.deco-2 {
  top: 40%;
  right: 3%;
  font-size: 1.5rem;
  transform: rotate(10deg);
}

.deco-3 {
  bottom: 25%;
  left: 8%;
  font-size: 1.8rem;
  transform: rotate(-8deg);
}

.deco-4 {
  top: 60%;
  right: 8%;
  font-size: 1.2rem;
}

/* ===== EXPEDITION LOG (STATS) ===== */
.expedition-log {
  background: linear-gradient(135deg, #f5e6c8 0%, #e8d4a8 100%);
  border: 3px double #8B6914;
  border-radius: 4px;
  padding: 1.5rem;
  margin-top: 2.5rem;
  position: relative;
  z-index: 10;
  box-shadow:
    inset 0 0 30px rgba(139, 90, 43, 0.15),
    4px 4px 15px rgba(0,0,0,0.2);
}

.log-header {
  font-family: 'Pirata One', cursive;
  font-size: 1.2rem;
  color: #3d2914;
  text-align: center;
  margin-bottom: 1rem;
  letter-spacing: 2px;
  border-bottom: 1px solid #a08060;
  padding-bottom: 0.5rem;
}

.log-entries {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.log-entry {
  text-align: center;
  padding: 0.5rem;
  border-right: 1px solid #c9b896;
}

.log-entry:last-child {
  border-right: none;
}

.log-value {
  font-family: 'Pirata One', cursive;
  font-size: 1.8rem;
  color: #3d2914;
  display: block;
}

.log-label {
  font-family: 'IM Fell English', serif;
  font-size: 0.8rem;
  color: #6b5344;
  font-style: italic;
}

/* ===== FOOTER FLOURISH ===== */
.map-footer {
  text-align: center;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #a08060;
  position: relative;
  z-index: 10;
}

.footer-text {
  font-family: 'IM Fell English', serif;
  font-style: italic;
  color: #5c4033;
  font-size: 0.95rem;
}

.footer-flourish {
  font-size: 1.5rem;
  color: #8B6914;
  margin-top: 0.5rem;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 600px) {
  .expedition-map {
    padding: 2rem 1rem;
  }

  .expedition-title {
    font-size: 2rem;
  }

  .expedition-header::before,
  .expedition-header::after {
    display: none;
  }

  .vintage-photo {
    width: 170px;
    padding: 10px 10px 50px 10px;
  }

  .vintage-photo img {
    height: 145px;
  }

  .cartouche-grid {
    grid-template-columns: 1fr;
  }

  .region-scroll {
    padding: 0.6rem 2rem;
  }

  .region-name {
    font-size: 1.2rem;
  }

  .compass-rose {
    display: none;
  }

  .log-entries {
    grid-template-columns: repeat(2, 1fr);
  }

  .log-entry {
    border-right: none;
    border-bottom: 1px solid #c9b896;
  }
}
</style>

<div class="expedition-map">

<!-- Burn marks and damage -->
<div class="burn-mark burn-1"></div>
<div class="burn-mark burn-2"></div>
<div class="burn-mark burn-3"></div>
<div class="burn-mark burn-4"></div>
<div class="singed-corner singed-corner-tr"></div>
<div class="singed-corner singed-corner-bl"></div>
<div class="fold-line fold-h"></div>
<div class="fold-line fold-v"></div>

<div class="compass-rose"></div>

<!-- Map Decorations -->
<div class="map-decoration deco-1">⛰</div>
<div class="map-decoration deco-2">🗻</div>
<div class="map-decoration deco-3">🌲</div>
<div class="map-decoration deco-4">❄</div>

<div class="expedition-header">
<span class="expedition-title">Brewskis While Skiing</span>
<span class="expedition-subtitle">A Catalogue of Libations Procured During Alpine Expeditions</span>
<span class="expedition-date">— SEASON 1924–1925 —</span>
</div>

<div class="map-cartouche">
<div class="cartouche-title">~ Classification Guide ~</div>
<div class="cartouche-grid">
<div class="cartouche-item">
<span class="cartouche-symbol sym-green">●</span>
<span><b>Green Circle</b> — Novice Grade</span>
</div>
<div class="cartouche-item">
<span class="cartouche-symbol sym-blue">■</span>
<span><b>Blue Square</b> — Intermediate</span>
</div>
<div class="cartouche-item">
<span class="cartouche-symbol sym-black">◆</span>
<span><b>Black Diamond</b> — Expert</span>
</div>
<div class="cartouche-item">
<span class="cartouche-symbol sym-terrain">▲</span>
<span><b>Terrain Park</b> — Peculiar</span>
</div>
</div>
</div>

<div class="region-banner">
<div class="region-scroll">
<div class="region-name">Snowbird</div>
<div class="region-territory">Territory of Utah</div>
</div>
</div>

<div class="specimen-collection">

<div class="vintage-photo sepia-medium">
<div class="wax-seal seal-blue">■</div>
<img src="/brewskis/snowbird_lager.jpeg" alt="Wasatch Last One Down Lager">
<div class="photo-damage foxing"></div>
<span class="catalog-no">No. 001</span>
<div class="photo-caption">
<span class="specimen-name">Wasatch Last One Down</span>
<span class="specimen-notes">Lager · Acquired on chairlift</span>
</div>
</div>

<div class="vintage-photo sepia-heavy">
<div class="wax-seal seal-green">●</div>
<img src="/brewskis/snowbird_carlsberg.jpeg" alt="Carlsberg">
<div class="photo-damage scratches"></div>
<span class="catalog-no">No. 002</span>
<div class="photo-caption">
<span class="specimen-name">Carlsberg</span>
<span class="specimen-notes">Danish Pilsner · On the slopes</span>
</div>
</div>

<div class="vintage-photo sepia-light">
<div class="wax-seal seal-terrain">▲</div>
<img src="/brewskis/snowbird_grapefruit.JPG" alt="Grapefruit Lager">
<span class="catalog-no">No. 003</span>
<div class="photo-caption">
<span class="specimen-name">Grapefruit Lager</span>
<span class="specimen-notes">Citrus variety · Chairlift</span>
</div>
</div>

<div class="vintage-photo faded">
<div class="wax-seal seal-blue">■</div>
<img src="/brewskis/snowbird_pilsner.jpeg" alt="Left Hand 1265">
<div class="photo-damage corner-wear"></div>
<span class="catalog-no">No. 004</span>
<div class="photo-caption">
<span class="specimen-name">Left Hand 1265</span>
<span class="specimen-notes">Pilsner · Chairlift specimen</span>
</div>
</div>

</div>

<div class="region-banner">
<div class="region-scroll">
<div class="region-name">Brighton</div>
<div class="region-territory">Territory of Utah</div>
</div>
</div>

<div class="specimen-collection">

<div class="vintage-photo sepia-heavy">
<div class="wax-seal seal-black">◆</div>
<img src="/brewskis/brighton_lager.jpeg" alt="Butt Head Bock">
<div class="photo-damage vignette"></div>
<span class="catalog-no">No. 005</span>
<div class="photo-caption">
<span class="specimen-name">Butt Head Bock</span>
<span class="specimen-notes">Doppelbock · 1994 Edition</span>
</div>
</div>

<div class="vintage-photo sun-damaged">
<div class="wax-seal seal-terrain">▲</div>
<img src="/brewskis/brighton_pilsner.jpeg" alt="Bohemian Brew Ski">
<div class="photo-damage scratches foxing"></div>
<span class="catalog-no">No. 006</span>
<div class="photo-caption">
<span class="specimen-name">Bohemian Brew Ski</span>
<span class="specimen-notes">Remarkably apropos nomenclature</span>
</div>
</div>

</div>

<div class="region-banner">
<div class="region-scroll">
<div class="region-name">Arapahoe Basin</div>
<div class="region-territory">Colorado Territory</div>
</div>
</div>

<div class="specimen-collection">

<div class="vintage-photo sepia-light">
<div class="wax-seal seal-terrain">▲</div>
<img src="/brewskis/abay_loadout.jpeg" alt="A-Bay Loadout">
<div class="photo-damage corner-wear"></div>
<span class="catalog-no">No. 007</span>
<div class="photo-caption">
<span class="specimen-name">The A-Bay Loadout</span>
<span class="specimen-notes">Assorted provisions · Tailgate</span>
</div>
</div>

<div class="vintage-photo sepia-medium">
<div class="wax-seal seal-black">◆</div>
<img src="/brewskis/abay_sour.jpeg" alt="Platt Park Watermelon">
<div class="photo-damage foxing"></div>
<span class="catalog-no">No. 008</span>
<div class="photo-caption">
<span class="specimen-name">Platt Park Watermelon</span>
<span class="specimen-notes">Berliner Weisse · Tart variety</span>
</div>
</div>

<div class="vintage-photo faded">
<div class="wax-seal seal-blue">■</div>
<img src="/brewskis/abay_stampede.jpeg" alt="Stampede">
<div class="photo-damage scratches"></div>
<span class="catalog-no">No. 009</span>
<div class="photo-caption">
<span class="specimen-name">Stampede</span>
<span class="specimen-notes">Lager · Chairlift specimen</span>
</div>
</div>

</div>

<div class="region-banner">
<div class="region-scroll">
<div class="region-name">Eldora</div>
<div class="region-territory">Colorado Territory</div>
</div>
</div>

<div class="specimen-collection">

<div class="vintage-photo sepia-heavy">
<div class="wax-seal seal-black">◆</div>
<img src="/brewskis/eldora_chaider.jpeg" alt="Schilling Chaider">
<div class="photo-damage vignette foxing"></div>
<span class="catalog-no">No. 010</span>
<div class="photo-caption">
<span class="specimen-name">Schilling Chaider</span>
<span class="specimen-notes">Spiced chai cider · Exotic</span>
</div>
</div>

<div class="vintage-photo sepia-light">
<div class="wax-seal seal-terrain">▲</div>
<img src="/brewskis/eldora_jorts.jpeg" alt="Lady Justice Ski Jorts">
<div class="photo-damage scratches"></div>
<span class="catalog-no">No. 011</span>
<div class="photo-caption">
<span class="specimen-name">Lady Justice Ski Jorts</span>
<span class="specimen-notes">Pale Lager · Curious title</span>
</div>
</div>

<div class="vintage-photo sepia-medium">
<div class="wax-seal seal-blue">■</div>
<img src="/brewskis/eldora_maple.jpeg" alt="Tommyknocker Maple Nut">
<div class="photo-damage corner-wear"></div>
<span class="catalog-no">No. 012</span>
<div class="photo-caption">
<span class="specimen-name">Tommyknocker Maple</span>
<span class="specimen-notes">Brown Ale · Arboreal notes</span>
</div>
</div>

</div>

<div class="region-banner">
<div class="region-scroll">
<div class="region-name">Winter Park</div>
<div class="region-territory">Colorado Territory</div>
</div>
</div>

<div class="specimen-collection">

<div class="vintage-photo sun-damaged">
<div class="wax-seal seal-black">◆</div>
<img src="/brewskis/winterpark_kolsch.jpeg" alt="New Terrain Key Largo">
<div class="photo-damage vignette scratches"></div>
<span class="catalog-no">No. 013</span>
<div class="photo-caption">
<span class="specimen-name">New Terrain Key Largo</span>
<span class="specimen-notes">Key Lime Kölsch · Tropical</span>
</div>
</div>

</div>

<div class="region-banner">
<div class="region-scroll">
<div class="region-name">Supplementary Specimens</div>
<div class="region-territory">Off-Mountain Acquisitions</div>
</div>
</div>

<div class="specimen-collection">

<div class="vintage-photo sepia-medium">
<div class="wax-seal seal-terrain">▲</div>
<img src="/brewskis/kiitos_big_gay.jpeg" alt="Kiitos Big Gay Ale">
<div class="photo-damage foxing"></div>
<span class="catalog-no">No. 014</span>
<div class="photo-caption">
<span class="specimen-name">Kiitos Big Gay Ale</span>
<span class="specimen-notes">Contains edible glitter · SLC</span>
</div>
</div>

<div class="vintage-photo sepia-light">
<div class="wax-seal seal-terrain">▲</div>
<img src="/brewskis/blucider.jpeg" alt="Good Things Blucider">
<div class="photo-damage scratches"></div>
<span class="catalog-no">No. 015</span>
<div class="photo-caption">
<span class="specimen-name">Blucider</span>
<span class="specimen-notes">Blue cider · Caffeinated!</span>
</div>
</div>

<div class="vintage-photo sepia-heavy">
<div class="wax-seal seal-blue">■</div>
<img src="/brewskis/hall_esb.jpeg" alt="Diebolt ESB">
<div class="photo-damage vignette"></div>
<span class="catalog-no">No. 016</span>
<div class="photo-caption">
<span class="specimen-name">Diebolt ESB</span>
<span class="specimen-notes">English Pale · Hall Ranch</span>
</div>
</div>

<div class="vintage-photo faded">
<div class="wax-seal seal-green">●</div>
<img src="/brewskis/wonderland_athlethic.jpeg" alt="Athletic Brewing">
<div class="photo-damage corner-wear foxing"></div>
<span class="catalog-no">No. 017</span>
<div class="photo-caption">
<span class="specimen-name">Athletic Brewing</span>
<span class="specimen-notes">Non-alcoholic · Temperance</span>
</div>
</div>

<div class="vintage-photo sun-damaged">
<div class="wax-seal seal-terrain">▲</div>
<img src="/brewskis/boco_chile_ale.JPG" alt="Soulcraft Green Chile">
<div class="photo-damage scratches vignette"></div>
<span class="catalog-no">No. 018</span>
<div class="photo-caption">
<span class="specimen-name">Soulcraft Green Chile</span>
<span class="specimen-notes">Pueblo peppers · Fiery</span>
</div>
</div>

<div class="vintage-photo sepia-medium">
<div class="wax-seal seal-blue">■</div>
<img src="/brewskis/boco_drydock.jpeg" alt="Dry Dock Apricot Blonde">
<div class="photo-damage foxing corner-wear"></div>
<span class="catalog-no">No. 019</span>
<div class="photo-caption">
<span class="specimen-name">Dry Dock Apricot</span>
<span class="specimen-notes">Blonde Ale · Stone fruit</span>
</div>
</div>

<div class="vintage-photo sepia-heavy">
<div class="wax-seal seal-black">◆</div>
<img src="/brewskis/boco_olddoods.jpeg" alt="Odell Old Doods">
<div class="photo-damage vignette scratches foxing"></div>
<span class="catalog-no">No. 020</span>
<div class="photo-caption">
<span class="specimen-name">Odell Old Doods</span>
<span class="specimen-notes">Stout · Rich & robust</span>
</div>
</div>

<div class="vintage-photo faded">
<div class="wax-seal seal-blue">■</div>
<img src="/brewskis/betasso_pilsner.JPG" alt="Odell Pilsner">
<div class="photo-damage scratches"></div>
<span class="catalog-no">No. 021</span>
<div class="photo-caption">
<span class="specimen-name">Odell Pilsner</span>
<span class="specimen-notes">Pilsner · Betasso trails</span>
</div>
</div>

</div>

<div class="map-footer">
<div class="footer-text">"Here's to the expeditions yet to come"</div>
<div class="footer-flourish">— ❦ —</div>
</div>

</div>

Low-key, there is one special mention I have to make, because I would be committing a sin of the highest order if I didn’t record this pivotal moment. The most memorable beer, however, is the one I drank after I almost died. How I managed not to hit any trees or rocks while sliding headfirst at such speed, and over such a distance, is known only to the supreme brewer. In any case, calling it quits would have ruined my season, so we went back up. I stopped by the lodge for a draft brewski, and then we did it again.
