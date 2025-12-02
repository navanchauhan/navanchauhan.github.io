---
date: 2025-04-15 12:00
description: Rating all the beers from the 2024-2025 ski season using ski trail difficulty ratings
tags: Life, Skiing
draft: false
---

# Brewskis While Skiing

The 2024-2025 ski season was filled with powder days, lift rides, and of course... brewskis. Here's every beer rated using the only rating system that matters: ski trail difficulty.

<style>
/* ===== SKI MAP BACKGROUND ===== */
.ski-map {
  background:
    /* Topographic contour lines */
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 40px,
      rgba(139, 90, 43, 0.08) 40px,
      rgba(139, 90, 43, 0.08) 41px
    ),
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 40px,
      rgba(139, 90, 43, 0.08) 40px,
      rgba(139, 90, 43, 0.08) 41px
    ),
    /* Subtle terrain texture */
    radial-gradient(ellipse at 20% 30%, rgba(144, 238, 144, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse at 70% 60%, rgba(173, 216, 230, 0.12) 0%, transparent 40%),
    radial-gradient(ellipse at 50% 80%, rgba(255, 255, 255, 0.3) 0%, transparent 30%),
    /* Base parchment color */
    linear-gradient(180deg, #f5f0e6 0%, #ebe6dc 50%, #f0ebe1 100%);
  padding: 2rem 1rem;
  border-radius: 8px;
  position: relative;
  box-shadow:
    inset 0 0 60px rgba(139, 90, 43, 0.1),
    0 4px 20px rgba(0, 0, 0, 0.15);
  border: 1px solid #d4cbb8;
}

.ski-map::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 80 Q 30 60, 50 70 T 90 50' stroke='%23228B22' stroke-width='0.5' fill='none' opacity='0.15'/%3E%3Cpath d='M5 40 Q 25 20, 45 30 T 85 20' stroke='%231E90FF' stroke-width='0.5' fill='none' opacity='0.15'/%3E%3Cpath d='M20 90 Q 40 70, 60 85 T 95 70' stroke='%23333' stroke-width='0.3' fill='none' opacity='0.1'/%3E%3C/svg%3E");
  background-size: 200px 200px;
  pointer-events: none;
  opacity: 0.5;
}

/* ===== POLAROID CONTAINER ===== */
.polaroid-board {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  justify-content: center;
  padding: 1rem;
  position: relative;
  z-index: 1;
}

/* ===== POLAROID CARDS ===== */
.polaroid {
  background: #fff;
  padding: 12px 12px 45px 12px;
  box-shadow:
    0 2px 4px rgba(0,0,0,0.1),
    0 8px 20px rgba(0,0,0,0.15),
    inset 0 0 0 1px rgba(0,0,0,0.05);
  transform: rotate(var(--rotation, 0deg));
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  position: relative;
  width: 240px;
  flex-shrink: 0;
  /* Slight paper texture */
  background-image:
    linear-gradient(rgba(255,255,255,0.9), rgba(250,248,245,0.9)),
    url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
}

.polaroid:nth-child(4n+1) { --rotation: -3deg; }
.polaroid:nth-child(4n+2) { --rotation: 2deg; }
.polaroid:nth-child(4n+3) { --rotation: -1.5deg; }
.polaroid:nth-child(4n+4) { --rotation: 2.5deg; }

.polaroid:hover {
  transform: rotate(0deg) scale(1.05) translateY(-5px);
  box-shadow:
    0 4px 8px rgba(0,0,0,0.15),
    0 15px 35px rgba(0,0,0,0.2);
  z-index: 10;
}

/* ===== PUSH PIN ===== */
.push-pin {
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 24px;
  z-index: 5;
}

.push-pin::before {
  content: "";
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 12px;
  background: linear-gradient(180deg, #888 0%, #666 100%);
  border-radius: 0 0 2px 2px;
}

.push-pin::after {
  content: "";
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 20px;
  border-radius: 50%;
  box-shadow:
    0 2px 4px rgba(0,0,0,0.3),
    inset 0 -2px 4px rgba(0,0,0,0.2),
    inset 0 2px 4px rgba(255,255,255,0.4);
}

/* Pin colors based on rating */
.pin-green::after { background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%); }
.pin-blue::after { background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%); }
.pin-black::after { background: linear-gradient(135deg, #525252 0%, #1a1a1a 100%); }
.pin-orange::after { background: linear-gradient(135deg, #fb923c 0%, #f97316 100%); }

/* ===== POLAROID IMAGE ===== */
.polaroid-img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  display: block;
  border: 1px solid #e5e5e5;
}

/* ===== HANDWRITTEN CAPTION ===== */
.polaroid-caption {
  position: absolute;
  bottom: 8px;
  left: 12px;
  right: 12px;
  font-family: 'Segoe Print', 'Bradley Hand', 'Chilanka', cursive;
  font-size: 0.85rem;
  color: #2c2c2c;
  text-align: center;
  line-height: 1.3;
}

.polaroid-caption .beer-name {
  font-weight: 600;
  display: block;
  margin-bottom: 2px;
}

.polaroid-caption .beer-info {
  font-size: 0.7rem;
  color: #666;
}

/* ===== TRAIL RATING STICKER ===== */
.trail-sticker {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.2rem;
  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  transform: rotate(5deg);
  z-index: 2;
}

.sticker-green {
  background: #22c55e;
  color: white;
  border-radius: 50%;
}

.sticker-blue {
  background: #3b82f6;
  color: white;
  border-radius: 4px;
}

.sticker-black {
  background: #1a1a1a;
  color: white;
  border-radius: 4px;
  transform: rotate(50deg);
}

.sticker-terrain {
  background: linear-gradient(135deg, #fb923c 0%, #ea580c 100%);
  color: white;
  border-radius: 4px;
  clip-path: polygon(50% 0%, 100% 100%, 0% 100%);
  width: 40px;
  height: 36px;
  font-size: 0.6rem;
  padding-top: 14px;
}

/* ===== RESORT MARKERS ===== */
.resort-marker {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 2.5rem 0 1.5rem;
  padding: 0.75rem 1.25rem;
  background: rgba(255, 255, 255, 0.85);
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border-left: 4px solid;
  position: relative;
  z-index: 1;
  font-family: 'Trebuchet MS', sans-serif;
}

.resort-marker.utah { border-color: #ef4444; }
.resort-marker.colorado { border-color: #3b82f6; }
.resort-marker.bonus { border-color: #f97316; }

.resort-icon {
  font-size: 1.5rem;
}

.resort-name {
  font-weight: bold;
  font-size: 1.1rem;
  color: #1e293b;
  letter-spacing: 0.5px;
}

.resort-state {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: normal;
}

/* ===== LEGEND BOX ===== */
.map-legend {
  background: rgba(255, 255, 255, 0.92);
  border: 2px solid #8B4513;
  border-radius: 4px;
  padding: 1rem 1.5rem;
  margin-bottom: 2rem;
  position: relative;
  z-index: 1;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.map-legend-title {
  font-family: 'Trebuchet MS', sans-serif;
  font-weight: bold;
  font-size: 0.9rem;
  color: #5c4033;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 0.75rem;
  border-bottom: 1px solid #d4c4a8;
  padding-bottom: 0.5rem;
}

.legend-items {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #4a4a4a;
}

.legend-symbol {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.8rem;
  color: white;
}

.legend-symbol.sym-green { background: #22c55e; border-radius: 50%; }
.legend-symbol.sym-blue { background: #3b82f6; border-radius: 3px; }
.legend-symbol.sym-black { background: #1a1a1a; border-radius: 3px; transform: rotate(45deg); }
.legend-symbol.sym-terrain {
  background: linear-gradient(135deg, #fb923c, #ea580c);
  clip-path: polygon(50% 0%, 100% 100%, 0% 100%);
}

/* ===== TIMELINE CONNECTOR ===== */
.timeline-line {
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 3px;
  background:
    repeating-linear-gradient(
      180deg,
      #8B4513 0px,
      #8B4513 10px,
      transparent 10px,
      transparent 20px
    );
  opacity: 0.3;
  z-index: 0;
}

/* ===== STATS CARD ===== */
.stats-card {
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid #8B4513;
  border-radius: 6px;
  padding: 1.25rem;
  margin-top: 2rem;
  position: relative;
  z-index: 1;
}

.stats-card h3 {
  font-family: 'Trebuchet MS', sans-serif;
  color: #5c4033;
  margin: 0 0 1rem 0;
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.stats-card ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.5rem;
}

.stats-card li {
  padding: 0.25rem 0;
  font-size: 0.9rem;
  color: #4a4a4a;
}

.stats-card li strong {
  color: #2c2c2c;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 600px) {
  .polaroid {
    width: 200px;
    padding: 10px 10px 40px 10px;
  }

  .polaroid-img {
    height: 160px;
  }

  .polaroid-caption {
    font-size: 0.75rem;
  }

  .legend-items {
    flex-direction: column;
    gap: 0.5rem;
  }

  .resort-marker {
    flex-direction: column;
    text-align: center;
    gap: 0.25rem;
  }
}
</style>

<div class="ski-map">

<div class="map-legend">
<div class="map-legend-title">Trail Difficulty Rating System</div>
<div class="legend-items">
<div class="legend-item">
<div class="legend-symbol sym-green"></div>
<span><strong>Green Circle</strong> - Bunny slope beer</span>
</div>
<div class="legend-item">
<div class="legend-symbol sym-blue"></div>
<span><strong>Blue Square</strong> - Solid cruise</span>
</div>
<div class="legend-item">
<div class="legend-symbol sym-black"></div>
<span><strong>Double Black</strong> - Expert level</span>
</div>
<div class="legend-item">
<div class="legend-symbol sym-terrain"></div>
<span><strong>Terrain Park</strong> - Wild card</span>
</div>
</div>
</div>

<div class="resort-marker utah">
<span class="resort-icon">🏔️</span>
<span class="resort-name">Snowbird <span class="resort-state">Utah</span></span>
</div>

<div class="polaroid-board">

<div class="polaroid">
<div class="push-pin pin-blue"></div>
<img class="polaroid-img" src="/brewskis/snowbird_lager.jpeg" alt="Wasatch Last One Down Lager">
<div class="trail-sticker sticker-blue">■</div>
<div class="polaroid-caption">
<span class="beer-name">Wasatch Last One Down</span>
<span class="beer-info">Lager • On the lift</span>
</div>
</div>

<div class="polaroid">
<div class="push-pin pin-green"></div>
<img class="polaroid-img" src="/brewskis/snowbird_carlsberg.jpeg" alt="Carlsberg Danish Pilsner">
<div class="trail-sticker sticker-green">●</div>
<div class="polaroid-caption">
<span class="beer-name">Carlsberg</span>
<span class="beer-info">Danish Pilsner • On the slopes</span>
</div>
</div>

<div class="polaroid">
<div class="push-pin pin-orange"></div>
<img class="polaroid-img" src="/brewskis/snowbird_grapefruit.JPG" alt="Grapefruit Lager">
<div class="trail-sticker sticker-terrain">▲</div>
<div class="polaroid-caption">
<span class="beer-name">Grapefruit Lager</span>
<span class="beer-info">Fruit Lager • On the lift</span>
</div>
</div>

<div class="polaroid">
<div class="push-pin pin-blue"></div>
<img class="polaroid-img" src="/brewskis/snowbird_pilsner.jpeg" alt="Left Hand 1265 Pilsner">
<div class="trail-sticker sticker-blue">■</div>
<div class="polaroid-caption">
<span class="beer-name">Left Hand 1265</span>
<span class="beer-info">Pilsner • On the lift</span>
</div>
</div>

</div>

<div class="resort-marker utah">
<span class="resort-icon">⛷️</span>
<span class="resort-name">Brighton <span class="resort-state">Utah</span></span>
</div>

<div class="polaroid-board">

<div class="polaroid">
<div class="push-pin pin-black"></div>
<img class="polaroid-img" src="/brewskis/brighton_lager.jpeg" alt="Butt Head Bock">
<div class="trail-sticker sticker-black">◆</div>
<div class="polaroid-caption">
<span class="beer-name">Butt Head Bock</span>
<span class="beer-info">Doppelbock • On the lift</span>
</div>
</div>

<div class="polaroid">
<div class="push-pin pin-orange"></div>
<img class="polaroid-img" src="/brewskis/brighton_pilsner.jpeg" alt="Bohemian Brew Ski">
<div class="trail-sticker sticker-terrain">▲</div>
<div class="polaroid-caption">
<span class="beer-name">Bohemian Brew Ski</span>
<span class="beer-info">It's literally called Brew Ski!</span>
</div>
</div>

</div>

<div class="resort-marker colorado">
<span class="resort-icon">🎿</span>
<span class="resort-name">Arapahoe Basin <span class="resort-state">Colorado</span></span>
</div>

<div class="polaroid-board">

<div class="polaroid">
<div class="push-pin pin-orange"></div>
<img class="polaroid-img" src="/brewskis/abay_loadout.jpeg" alt="A-Bay Loadout">
<div class="trail-sticker sticker-terrain">▲</div>
<div class="polaroid-caption">
<span class="beer-name">The A-Bay Loadout</span>
<span class="beer-info">Tailgate spread</span>
</div>
</div>

<div class="polaroid">
<div class="push-pin pin-black"></div>
<img class="polaroid-img" src="/brewskis/abay_sour.jpeg" alt="Platt Park Watermelon Sour">
<div class="trail-sticker sticker-black">◆</div>
<div class="polaroid-caption">
<span class="beer-name">Platt Park Watermelon</span>
<span class="beer-info">Berliner Weisse • Tailgating</span>
</div>
</div>

<div class="polaroid">
<div class="push-pin pin-blue"></div>
<img class="polaroid-img" src="/brewskis/abay_stampede.jpeg" alt="Stampede">
<div class="trail-sticker sticker-blue">■</div>
<div class="polaroid-caption">
<span class="beer-name">Stampede</span>
<span class="beer-info">Lager • On the lift</span>
</div>
</div>

</div>

<div class="resort-marker colorado">
<span class="resort-icon">🌲</span>
<span class="resort-name">Eldora <span class="resort-state">Colorado</span></span>
</div>

<div class="polaroid-board">

<div class="polaroid">
<div class="push-pin pin-black"></div>
<img class="polaroid-img" src="/brewskis/eldora_chaider.jpeg" alt="Schilling Chaider">
<div class="trail-sticker sticker-black">◆</div>
<div class="polaroid-caption">
<span class="beer-name">Schilling Chaider</span>
<span class="beer-info">Spiced Chai Cider</span>
</div>
</div>

<div class="polaroid">
<div class="push-pin pin-orange"></div>
<img class="polaroid-img" src="/brewskis/eldora_jorts.jpeg" alt="Lady Justice Ski Jorts">
<div class="trail-sticker sticker-terrain">▲</div>
<div class="polaroid-caption">
<span class="beer-name">Lady Justice Ski Jorts</span>
<span class="beer-info">Pale Lager • On the lift</span>
</div>
</div>

<div class="polaroid">
<div class="push-pin pin-blue"></div>
<img class="polaroid-img" src="/brewskis/eldora_maple.jpeg" alt="Tommyknocker Maple Nut">
<div class="trail-sticker sticker-blue">■</div>
<div class="polaroid-caption">
<span class="beer-name">Tommyknocker Maple Nut</span>
<span class="beer-info">Brown Ale • On the lift</span>
</div>
</div>

</div>

<div class="resort-marker colorado">
<span class="resort-icon">❄️</span>
<span class="resort-name">Winter Park <span class="resort-state">Colorado</span></span>
</div>

<div class="polaroid-board">

<div class="polaroid">
<div class="push-pin pin-black"></div>
<img class="polaroid-img" src="/brewskis/winterpark_kolsch.jpeg" alt="New Terrain Key Largo">
<div class="trail-sticker sticker-black">◆</div>
<div class="polaroid-caption">
<span class="beer-name">New Terrain Key Largo</span>
<span class="beer-info">Key Lime Kölsch</span>
</div>
</div>

</div>

<div class="resort-marker bonus">
<span class="resort-icon">🍻</span>
<span class="resort-name">Bonus Rounds <span class="resort-state">Off-Mountain Vibes</span></span>
</div>

<div class="polaroid-board">

<div class="polaroid">
<div class="push-pin pin-orange"></div>
<img class="polaroid-img" src="/brewskis/kiitos_big_gay.jpeg" alt="Kiitos Big Gay Ale">
<div class="trail-sticker sticker-terrain">▲</div>
<div class="polaroid-caption">
<span class="beer-name">Kiitos Big Gay Ale</span>
<span class="beer-info">With Edible Glitter! • SLC</span>
</div>
</div>

<div class="polaroid">
<div class="push-pin pin-orange"></div>
<img class="polaroid-img" src="/brewskis/blucider.jpeg" alt="Good Things Blucider">
<div class="trail-sticker sticker-terrain">▲</div>
<div class="polaroid-caption">
<span class="beer-name">Good Things Blucider</span>
<span class="beer-info">Blue Cider • Home base</span>
</div>
</div>

<div class="polaroid">
<div class="push-pin pin-blue"></div>
<img class="polaroid-img" src="/brewskis/hall_esb.jpeg" alt="Diebolt ESB">
<div class="trail-sticker sticker-blue">■</div>
<div class="polaroid-caption">
<span class="beer-name">Diebolt ESB</span>
<span class="beer-info">English Pale Ale • Hall Ranch</span>
</div>
</div>

<div class="polaroid">
<div class="push-pin pin-green"></div>
<img class="polaroid-img" src="/brewskis/wonderland_athlethic.jpeg" alt="Athletic Brewing">
<div class="trail-sticker sticker-green">●</div>
<div class="polaroid-caption">
<span class="beer-name">Athletic Brewing</span>
<span class="beer-info">Non-Alcoholic • Wonderland</span>
</div>
</div>

<div class="polaroid">
<div class="push-pin pin-orange"></div>
<img class="polaroid-img" src="/brewskis/boco_chile_ale.JPG" alt="Soulcraft Green Chile Ale">
<div class="trail-sticker sticker-terrain">▲</div>
<div class="polaroid-caption">
<span class="beer-name">Soulcraft Green Chile</span>
<span class="beer-info">Pueblo & Serrano Chiles</span>
</div>
</div>

<div class="polaroid">
<div class="push-pin pin-blue"></div>
<img class="polaroid-img" src="/brewskis/boco_drydock.jpeg" alt="Dry Dock Apricot Blonde">
<div class="trail-sticker sticker-blue">■</div>
<div class="polaroid-caption">
<span class="beer-name">Dry Dock Apricot Blonde</span>
<span class="beer-info">Blonde Ale • Boulder County</span>
</div>
</div>

<div class="polaroid">
<div class="push-pin pin-black"></div>
<img class="polaroid-img" src="/brewskis/boco_olddoods.jpeg" alt="Odell Old Doods Stout">
<div class="trail-sticker sticker-black">◆</div>
<div class="polaroid-caption">
<span class="beer-name">Odell Old Doods</span>
<span class="beer-info">Stout • Boulder County</span>
</div>
</div>

<div class="polaroid">
<div class="push-pin pin-blue"></div>
<img class="polaroid-img" src="/brewskis/betasso_pilsner.JPG" alt="Odell Pilsner">
<div class="trail-sticker sticker-blue">■</div>
<div class="polaroid-caption">
<span class="beer-name">Odell Pilsner</span>
<span class="beer-info">Pilsner • Betasso MTB</span>
</div>
</div>

</div>

<div class="stats-card">
<h3>Season Stats</h3>
<ul>
<li><strong>Resorts:</strong> Snowbird, Brighton, A-Basin, Eldora, Winter Park</li>
<li><strong>States:</strong> Colorado, Utah</li>
<li><strong>Total Brewskis:</strong> 20+</li>
<li><strong>Double Blacks:</strong> 6</li>
<li><strong>Terrain Park Wildcards:</strong> 7</li>
<li><strong>Regrets:</strong> Zero</li>
</ul>
</div>

</div>

*Here's to the 2025-2026 season!*
