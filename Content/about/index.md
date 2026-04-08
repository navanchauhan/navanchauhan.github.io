---
date: 2003-12-21 22:32
description: About Me
tags: Personal
---

# About Me

Hi!

My name is Navan, and welcome to my small corner of the internet.

I currently work at a software company in California where I have the amazing opportunity to work on the AI Agents team.

I enjoy solving problems across different fields. While I’m a programmer by trade, I have recently spent significant time working in drug discovery. I fell in love with Mathematics during college, with a particular interest in probability theory.

Besides spending too much time in front of the screen, I do occasionally like to touch grass while Hiking or MTBiking. I also enjoy skiing, reading, homebrewing, and watching movies.

## "Virtual Furniture"

This section is inspired by `@helinvision` and `@celinekeomany`'s designs on their personal websites. I don’t have time to virtualise everything just yet, but you can feel superior about your taste in music. Or, if you’re trying to figure out which record to bribe me with, this is the place to start.

<style>
.vinyl-scene {
    position: relative;
    width: 100%;
}

.vinyl-stand-container {
    position: relative;
    width: 100%;
}

.vinyl-stand-image {
    width: 100%;
    height: auto;
    display: block;
}

.vinyl-rack {
    position: absolute;
    bottom: 11%;
    left: 70.3%;
    width: 21.5%;
    height: 45%;
    display: flex;
    align-items: flex-end;
    justify-content: flex-start;
    gap: 0;
    perspective: 1000px;
}

.vinyl-rack.expanded {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.95);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
    padding: 40px;
    flex-wrap: wrap;
}

.vinyl-sleeve {
    width: 11.11%;
    height: 100%;
    border-radius: 2px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    transform-origin: bottom center;
    position: relative;
    box-shadow: -1px 0 3px rgba(0, 0, 0, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
}

.vinyl-spine-text {
    writing-mode: vertical-rl;
    text-orientation: mixed;
    transform: rotate(180deg);
    font-size: clamp(3px, 0.8vw, 7px);
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    width: 100%;
    white-space: nowrap;
    overflow: hidden;
}

.vinyl-spine-artist {
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.3px;
}

.vinyl-spine-artist::after {
    content: " \2022 ";
    font-weight: 400;
}

.vinyl-spine-album {
    font-weight: 400;
}

.vinyl-sleeve:hover {
    transform: translateY(-12%) rotate(-3deg);
    z-index: 10;
    box-shadow: -2px 2px 8px rgba(0, 0, 0, 0.3);
}

.vinyl-rack.expanded .vinyl-sleeve {
    width: 180px;
    height: 180px;
    transform: none;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    background-size: cover !important;
    background-position: center !important;
    padding: 0;
    border-radius: 4px;
}

.vinyl-rack.expanded .vinyl-sleeve .vinyl-spine-text {
    display: none;
}

.vinyl-rack.expanded .vinyl-sleeve:hover {
    transform: scale(1.1) rotate(0deg);
}

/* Album spine colors */
.vinyl-sleeve:nth-child(1) { background: linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%); color: #ffffff; }
.vinyl-sleeve:nth-child(2) { background: linear-gradient(180deg, #e8c547, #d4a82b); color: #2c2c2c; }
.vinyl-sleeve:nth-child(3) { background: linear-gradient(180deg, #1a3a5c, #0f2844); color: #ffffff; }
.vinyl-sleeve:nth-child(4) { background: linear-gradient(180deg, #8b4513, #5d2e0a); color: #f5e6d3; }
.vinyl-sleeve:nth-child(5) { background: linear-gradient(180deg, #d3d3d3, #a9a9a9); color: #1a1a1a; }
.vinyl-sleeve:nth-child(6) { background: linear-gradient(180deg, #ffffff, #f0f0f0); color: #1a1a1a; }
.vinyl-sleeve:nth-child(7) { background: linear-gradient(180deg, #f8f4e8, #e8e4d8); color: #1a1a1a; }
.vinyl-sleeve:nth-child(8) { background: linear-gradient(180deg, #e63946, #d62839, #c81d25); color: #ffd700; }
.vinyl-sleeve:nth-child(9) { background: linear-gradient(180deg, #2d6a4f, #1b4332); color: #ffffff; }

.vinyl-info {
    position: absolute;
    bottom: -40px;
    left: 50%;
    transform: translateX(-50%);
    color: white;
    font-size: 12px;
    text-align: center;
    white-space: nowrap;
    opacity: 0;
    transition: opacity 0.3s;
}

.vinyl-rack.expanded .vinyl-info {
    opacity: 1;
}

.vinyl-close-btn {
    position: fixed;
    top: 20px;
    right: 20px;
    width: 50px;
    height: 50px;
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    color: white;
    font-size: 24px;
    cursor: pointer;
    display: none;
    align-items: center;
    justify-content: center;
    z-index: 1001;
    transition: all 0.3s;
}

.vinyl-close-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: rotate(90deg);
}

.vinyl-close-btn.visible {
    display: flex;
}

.vinyl-hint {
    text-align: center;
    color: rgba(0, 0, 0, 0.4);
    font-size: 12px;
    margin-top: 10px;
}

@media (max-width: 768px) {
    .vinyl-rack.expanded {
        padding: 60px 20px;
        gap: 15px;
    }
    .vinyl-rack.expanded .vinyl-sleeve {
        width: 100px;
        height: 100px;
    }
    .vinyl-info {
        font-size: 10px;
        bottom: -30px;
    }
}

@media (max-width: 480px) {
    .vinyl-rack.expanded .vinyl-sleeve {
        width: 80px;
        height: 80px;
    }
    .vinyl-hint {
        font-size: 10px;
    }
    .vinyl-close-btn {
        width: 40px;
        height: 40px;
        font-size: 20px;
    }
}

@keyframes vinylSlideIn {
    from { opacity: 0; transform: translateY(50px); }
    to { opacity: 1; transform: translateY(0); }
}

.vinyl-rack.expanded .vinyl-sleeve {
    animation: vinylSlideIn 0.5s ease-out forwards;
}

.vinyl-rack.expanded .vinyl-sleeve:nth-child(1) { animation-delay: 0.05s; }
.vinyl-rack.expanded .vinyl-sleeve:nth-child(2) { animation-delay: 0.1s; }
.vinyl-rack.expanded .vinyl-sleeve:nth-child(3) { animation-delay: 0.15s; }
.vinyl-rack.expanded .vinyl-sleeve:nth-child(4) { animation-delay: 0.2s; }
.vinyl-rack.expanded .vinyl-sleeve:nth-child(5) { animation-delay: 0.25s; }
.vinyl-rack.expanded .vinyl-sleeve:nth-child(6) { animation-delay: 0.3s; }
.vinyl-rack.expanded .vinyl-sleeve:nth-child(7) { animation-delay: 0.35s; }
.vinyl-rack.expanded .vinyl-sleeve:nth-child(8) { animation-delay: 0.4s; }
.vinyl-rack.expanded .vinyl-sleeve:nth-child(9) { animation-delay: 0.45s; }
</style>

<!-- TODO: living room layout with TV, posters, and vinyl <div class="living-room"><div class="lr-posters-left"><div class="movie-poster" data-title="Casablanca (1942)"><img src="/assets/about-page/posters/casablanca.jpg" alt="Casablanca"></div><div class="movie-poster" data-title="Blade Runner (1982)"><img src="/assets/about-page/posters/blade_runner.jpg" alt="Blade Runner"></div><div class="movie-poster" data-title="Back to the Future (1985)"><img src="/assets/about-page/posters/back_to_the_future.jpg" alt="Back to the Future"></div></div><div class="lr-vinyl"> -->
<div class="vinyl-scene">
    <div class="vinyl-stand-container">
        <img src="/assets/about-page/record_player_stand.png" alt="Record Player Stand" class="vinyl-stand-image">
        <div class="vinyl-rack" id="vinylRack">
            <div class="vinyl-sleeve" data-album="Thriller" data-cover="/assets/about-page/covers/thriller.jpg">
                <div class="vinyl-spine-text">
                    <span class="vinyl-spine-artist">Michael Jackson</span>
                    <span class="vinyl-spine-album">Thriller</span>
                </div>
                <span class="vinyl-info">Thriller</span>
            </div>
            <div class="vinyl-sleeve" data-album="Golden Hour" data-cover="/assets/about-page/covers/golden-hour.jpg">
                <div class="vinyl-spine-text">
                    <span class="vinyl-spine-artist">Kacey Musgraves</span>
                    <span class="vinyl-spine-album">Golden Hour</span>
                </div>
                <span class="vinyl-info">Golden Hour</span>
            </div>
            <div class="vinyl-sleeve" data-album="Kind of Blue" data-cover="/assets/about-page/covers/kind-of-blue.jpg">
                <div class="vinyl-spine-text">
                    <span class="vinyl-spine-artist">Miles Davis</span>
                    <span class="vinyl-spine-album">Kind of Blue</span>
                </div>
                <span class="vinyl-info">Kind of Blue</span>
            </div>
            <div class="vinyl-sleeve" data-album="Evermore" data-cover="/assets/about-page/covers/evermore.jpg">
                <div class="vinyl-spine-text">
                    <span class="vinyl-spine-artist">Taylor Swift</span>
                    <span class="vinyl-spine-album">Evermore</span>
                </div>
                <span class="vinyl-info">Evermore</span>
            </div>
            <div class="vinyl-sleeve" data-album="Folklore" data-cover="/assets/about-page/covers/folklore.jpg">
                <div class="vinyl-spine-text">
                    <span class="vinyl-spine-artist">Taylor Swift</span>
                    <span class="vinyl-spine-album">Folklore</span>
                </div>
                <span class="vinyl-info">Folklore</span>
            </div>
            <div class="vinyl-sleeve" data-album="McCartney III" data-cover="/assets/about-page/covers/mccartney-iii.jpg">
                <div class="vinyl-spine-text">
                    <span class="vinyl-spine-artist">McCartney</span>
                    <span class="vinyl-spine-album">III</span>
                </div>
                <span class="vinyl-info">McCartney III</span>
            </div>
            <div class="vinyl-sleeve" data-album="Rumours" data-cover="/assets/about-page/covers/rumours.jpg">
                <div class="vinyl-spine-text">
                    <span class="vinyl-spine-artist">Fleetwood Mac</span>
                    <span class="vinyl-spine-album">Rumours</span>
                </div>
                <span class="vinyl-info">Rumours</span>
            </div>
            <div class="vinyl-sleeve" data-album="Sgt. Pepper's" data-cover="/assets/about-page/covers/sgt-peppers.jpg">
                <div class="vinyl-spine-text">
                    <span class="vinyl-spine-album">Sgt. Peppers Anniversary Edition</span>
                </div>
                <span class="vinyl-info">Sgt. Pepper's</span>
            </div>
            <div class="vinyl-sleeve" data-album="Come Away with Me" data-cover="/assets/about-page/covers/come-away-with-me.jpg">
                <div class="vinyl-spine-text">
                    <span class="vinyl-spine-artist">Norah Jones</span>
                    <span class="vinyl-spine-album">Come Away with Me</span>
                </div>
                <span class="vinyl-info">Come Away with Me</span>
            </div>
        </div>
        <p class="vinyl-hint">Click vinyls to browse collection</p>
    </div>
</div>
<!-- TODO: TV scene and right posters <div class="lr-tv"><div class="tv-screen"><div class="tv-content"><div class="tv-now-playing">Now Playing</div><div class="tv-movie-title">The Great Dictator</div><div class="tv-movie-year">1940 &bull; Charlie Chaplin</div></div></div><div class="tv-stand-container"><img src="/assets/about-page/tv_stand.png" alt="TV Stand" class="tv-stand-image"></div></div><div class="lr-posters-right"><div class="movie-poster" data-title="Star Wars (1977)"><img src="/assets/about-page/posters/star_wars.jpg" alt="Star Wars"></div><div class="movie-poster" data-title="The Mummy (1999)"><img src="/assets/about-page/posters/the_mummy.jpg" alt="The Mummy"></div><div class="movie-poster" data-title="Citizen Kane (1941)"><img src="/assets/about-page/posters/citizen_kane.jpg" alt="Citizen Kane"></div></div></div> -->
<button class="vinyl-close-btn" id="vinylCloseBtn">&times;</button>
<script>
(function() {
    const vinylRack = document.getElementById('vinylRack');
    const closeBtn = document.getElementById('vinylCloseBtn');
    const vinyls = document.querySelectorAll('.vinyl-sleeve');
    let isExpanded = false;
    vinyls.forEach(vinyl => {
        vinyl.addEventListener('click', (e) => {
            if (!isExpanded) { expandRack(); }
        });
    });
    closeBtn.addEventListener('click', collapseRack);
    vinylRack.addEventListener('click', (e) => {
        if (isExpanded && e.target === vinylRack) { collapseRack(); }
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isExpanded) { collapseRack(); }
    });
    function expandRack() {
        isExpanded = true;
        vinylRack.classList.add('expanded');
        closeBtn.classList.add('visible');
        document.body.style.overflow = 'hidden';
        vinyls.forEach(vinyl => {
            const cover = vinyl.dataset.cover;
            if (cover) { vinyl.style.backgroundImage = 'url(' + cover + ')'; }
        });
    }
    function collapseRack() {
        isExpanded = false;
        vinylRack.classList.remove('expanded');
        closeBtn.classList.remove('visible');
        document.body.style.overflow = '';
        vinyls.forEach(vinyl => { vinyl.style.backgroundImage = ''; });
    }
})();
</script>

<style>
/* TODO: Living room CSS - uncomment when re-enabling TV/posters layout
.living-room {
    display: grid;
    grid-template-columns: minmax(0, 10%) minmax(0, 38%) minmax(0, 10%) minmax(0, 35%);
    grid-template-rows: 1fr;
    align-items: end;
    justify-items: center;
    gap: 2%;
    margin: 20px auto;
    max-width: 100%;
}

/* Column assignments: left-posters(col1) TV(col2) right-posters(col3) vinyl(col4) */
.lr-posters-left { grid-column: 1; grid-row: 1; }
.lr-tv { grid-column: 2; grid-row: 1; }
.lr-posters-right { grid-column: 3; grid-row: 1; }
.lr-vinyl { grid-column: 4; grid-row: 1; }

.lr-posters-left, .lr-posters-right {
    display: flex;
    flex-direction: column;
    gap: 6px;
    align-items: center;
    align-self: start;
    padding-top: 8px;
}

.lr-vinyl { align-self: end; }

/* TV unit: screen + stand are a single flex column, never separated */
.lr-tv {
    display: flex;
    flex-direction: column;
    align-items: center;
    align-self: end;
    width: 100%;
}

/* Poster frames */
.movie-poster {
    width: 100%;
    max-width: 90px;
    border: 3px solid #1a1a1a;
    border-radius: 1px;
    overflow: hidden;
    box-shadow: 2px 3px 8px rgba(0,0,0,0.5);
    cursor: default;
    transition: transform 0.3s, box-shadow 0.3s;
    position: relative;
    line-height: 0;
}

.movie-poster img {
    width: 100%;
    height: auto;
    display: block;
}

.movie-poster:hover {
    transform: scale(1.06);
    z-index: 10;
    box-shadow: 3px 5px 15px rgba(0,0,0,0.6);
}

.movie-poster[data-title]:hover::after {
    content: attr(data-title);
    position: absolute;
    bottom: -24px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0,0,0,0.9);
    color: white;
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 10px;
    white-space: nowrap;
    z-index: 100;
    pointer-events: none;
    font-family: -apple-system, sans-serif;
    line-height: 1.4;
}

/* TV screen: width follows container, aspect ratio keeps it proportional */
.tv-screen {
    width: 85%;
    aspect-ratio: 16/9;
    background: linear-gradient(135deg, #0a0a1a, #1a0a0a, #2a0a0a);
    border: 3px solid #1a1a1a;
    border-bottom: none;
    border-radius: 3px 3px 0 0;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 15px rgba(0,0,0,0.4), inset 0 0 20px rgba(0,0,0,0.3);
    position: relative;
    overflow: hidden;
    z-index: 2;
}

.tv-screen::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: radial-gradient(ellipse at center, rgba(200,50,50,0.12) 0%, rgba(0,0,100,0.08) 50%, transparent 70%);
    pointer-events: none;
}

.tv-content { text-align: center; z-index: 1; }
.tv-now-playing {
    font-size: clamp(6px, 1vw, 9px);
    color: rgba(255,255,255,0.4);
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-bottom: 4px;
}
.tv-movie-title {
    font-family: Georgia, serif;
    font-size: clamp(11px, 2.2vw, 22px);
    color: #e8e0d0;
    font-weight: 700;
    letter-spacing: 1px;
    text-shadow: 0 0 10px rgba(200,180,150,0.3);
}
.tv-movie-year {
    font-size: clamp(7px, 1vw, 10px);
    color: rgba(255,255,255,0.35);
    margin-top: 3px;
    letter-spacing: 1px;
}

/* Stand is slightly wider than the TV to look natural */
.tv-stand-container {
    width: 100%;
    position: relative;
    z-index: 1;
    margin-top: -2px;
}

.tv-stand-image {
    width: 100%;
    height: auto;
    display: block;
}

/* ── Tablet: 2-column layout (sidebar disappears at 48em/768px) ── */
@media (max-width: 48em) {
    .living-room {
        grid-template-columns: auto 1fr;
        grid-template-rows: auto auto;
        gap: 10px 8px;
        justify-items: center;
    }
    .lr-posters-left {
        grid-column: 1; grid-row: 1;
        flex-direction: row; gap: 5px; padding-top: 0; align-self: center;
    }
    .lr-tv { grid-column: 2; grid-row: 1; max-width: 320px; }
    .lr-posters-right {
        grid-column: 1; grid-row: 2;
        flex-direction: row; gap: 5px; padding-top: 0; align-self: center;
    }
    .lr-vinyl { grid-column: 2; grid-row: 2; }
    .movie-poster { max-width: 70px; }
}

/* ── Mobile: single column, everything stacked ── */
@media (max-width: 600px) {
    .living-room {
        grid-template-columns: 1fr;
        grid-template-rows: auto;
        gap: 12px;
        justify-items: center;
    }
    .lr-tv { grid-column: 1; order: 1; max-width: 90%; }
    .lr-posters-left {
        grid-column: 1; order: 2;
        flex-direction: row; gap: 8px; justify-content: center; padding-top: 0;
    }
    .lr-posters-right {
        grid-column: 1; order: 3;
        flex-direction: row; gap: 8px; justify-content: center; padding-top: 0;
    }
    .lr-vinyl { grid-column: 1; order: 4; max-width: 90%; }
    .movie-poster { max-width: 75px; }
}
END TODO */
</style>

<style>
.bookshelf {
    width: 100%;
    margin: 30px auto;
    position: relative;
}

.shelf-items {
    display: flex;
    align-items: flex-end;
    gap: 1px;
    padding: 0 8px;
    overflow-x: auto;
    overflow-y: visible;
    scrollbar-width: thin;
    scrollbar-color: #a67c52 transparent;
    padding-top: 50px;
    padding-bottom: 0;
    -webkit-overflow-scrolling: touch;
}

.shelf-items::-webkit-scrollbar { height: 6px; }
.shelf-items::-webkit-scrollbar-track { background: transparent; }
.shelf-items::-webkit-scrollbar-thumb { background: #a67c52; border-radius: 3px; }

.shelf-plank {
    height: 18px;
    background: linear-gradient(180deg, #d4a574 0%, #c4956a 20%, #a67c52 50%, #8b6339 100%);
    border-radius: 0 0 4px 4px;
    box-shadow: 0 6px 12px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.2);
    position: relative;
}

.shelf-plank::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 4px;
    background: linear-gradient(180deg, #e0b88a, #d4a574);
}

/* The Thinker bookend */
.thinker-bookend {
    width: 55px;
    height: 90px;
    flex-shrink: 0;
    position: relative;
    margin-right: 6px;
    align-self: flex-end;
}

.thinker-bookend svg {
    width: 100%;
    height: 100%;
}

/* Book spines */
.shelf-item {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: default;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s;
    transform-origin: bottom center;
    position: relative;
    border-radius: 2px 2px 0 0;
    box-shadow: -1px 0 2px rgba(0,0,0,0.2), 1px 0 2px rgba(0,0,0,0.1);
    flex-shrink: 0;
}

.shelf-item:hover {
    transform: translateY(-14px) rotate(-2deg);
    z-index: 10;
    box-shadow: -3px 5px 14px rgba(0,0,0,0.4);
}

.shelf-item .spine-text {
    writing-mode: vertical-rl;
    text-orientation: mixed;
    transform: rotate(180deg);
    font-size: 11px;
    line-height: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    height: 92%;
    display: flex;
    align-items: center;
    gap: 4px;
    font-family: Georgia, 'Times New Roman', serif;
    letter-spacing: 0.3px;
}

.spine-author {
    font-weight: 700;
    text-transform: uppercase;
    font-size: 10px;
    letter-spacing: 0.5px;
}

.spine-author::after {
    content: " \2022 ";
    font-weight: 400;
}

.spine-title {
    font-weight: 400;
    font-style: italic;
}

/* Blu-ray cases */
.shelf-item.bluray {
    border-radius: 1px 1px 0 0;
    box-shadow: -1px 0 3px rgba(0,0,0,0.2), 1px 0 1px rgba(0,0,0,0.1);
}

.shelf-item.bluray .spine-text {
    font-family: -apple-system, Helvetica, Arial, sans-serif;
    font-size: 9px;
}

/* Tooltip */
.shelf-item[data-tooltip]:hover::after {
    content: attr(data-tooltip);
    position: absolute;
    top: -32px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0,0,0,0.88);
    color: white;
    padding: 5px 10px;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;
    writing-mode: horizontal-tb;
    z-index: 100;
    pointer-events: none;
    font-family: -apple-system, sans-serif;
    font-style: normal;
}

.shelf-hint {
    text-align: center;
    color: rgba(0,0,0,0.35);
    font-size: 12px;
    margin-top: 14px;
}

@media (max-width: 600px) {
    .shelf-items { padding-top: 40px; }
    .shelf-hint { font-size: 10px; }
}
</style>

<div class="bookshelf">
    <div class="shelf-items">
        <!-- Low-poly Thinker bookend -->
        <div class="thinker-bookend">
            <svg viewBox="0 0 60 100" xmlns="http://www.w3.org/2000/svg">
                <!-- base -->
                <polygon points="10,100 50,100 48,92 12,92" fill="#4a4a4a"/>
                <!-- legs -->
                <polygon points="18,92 28,92 30,72 20,75" fill="#5a5a5a"/>
                <polygon points="28,92 38,92 35,78 30,72" fill="#505050"/>
                <!-- torso -->
                <polygon points="20,75 35,78 38,55 22,52" fill="#585858"/>
                <polygon points="22,52 38,55 36,45 24,43" fill="#525252"/>
                <!-- right arm (on knee) -->
                <polygon points="35,78 38,55 42,60 40,75" fill="#4e4e4e"/>
                <!-- left arm (to chin) -->
                <polygon points="22,52 24,43 28,32 20,38" fill="#565656"/>
                <polygon points="20,38 28,32 30,28 22,30" fill="#5e5e5e"/>
                <!-- head -->
                <polygon points="26,28 34,26 36,18 32,12 26,14 24,22" fill="#545454"/>
                <polygon points="28,32 30,28 34,26 26,28" fill="#4c4c4c"/>
                <!-- hand touching chin -->
                <polygon points="28,32 30,28 26,28 24,30" fill="#585858"/>
            </svg>
        </div>
        <!-- Books & Blu-rays in shelf order (left to right) -->
        <div class="shelf-item" data-tooltip="Aesop's Fables" style="width:38px; height:150px; background: linear-gradient(90deg, #b8d4c8 40%, #c4a35a 40%); color: #2c2c2c;">
            <div class="spine-text"><span class="spine-author">Aesop</span><span class="spine-title">Fables</span></div>
        </div>
        <div class="shelf-item" data-tooltip="The Best of Sherlock Holmes" style="width:36px; height:155px; background: linear-gradient(90deg, #c4a35a 50%, #f5f0e0 50%); color: #3a2a1a;">
            <div class="spine-text"><span class="spine-author">Conan Doyle</span><span class="spine-title">Sherlock Holmes</span></div>
        </div>
        <div class="shelf-item" data-tooltip="Anthem" style="width:24px; height:140px; background: linear-gradient(180deg, #1a1a1a, #0d0d0d); color: #d4af37;">
            <div class="spine-text"><span class="spine-author">Ayn Rand</span><span class="spine-title">Anthem</span></div>
        </div>
        <div class="shelf-item" data-tooltip="Lost in the Labyrinth (CYOA)" style="width:20px; height:132px; background: #f5f5f0; color: #1a1a1a;">
            <div class="spine-text"><span class="spine-title">Lost in the Labyrinth</span></div>
        </div>
        <!-- Blu-rays -->
        <div class="shelf-item bluray" data-tooltip="Hacksaw Ridge" style="width:16px; height:134px; background: linear-gradient(180deg, #1a1a2e, #0f0f1e); color: #6eb5ff;">
            <div class="spine-text"><span class="spine-title">Hacksaw Ridge</span></div>
        </div>
        <div class="shelf-item bluray" data-tooltip="Now You See Me" style="width:16px; height:134px; background: linear-gradient(180deg, #0d1b2a, #1b2838); color: #e0e0e0;">
            <div class="spine-text"><span class="spine-title">Now You See Me</span></div>
        </div>
        <div class="shelf-item bluray" data-tooltip="The Mummy Trilogy" style="width:22px; height:134px; background: linear-gradient(180deg, #1a1a1a, #2a2a2a); color: #c0c0c0;">
            <div class="spine-text"><span class="spine-title">The Mummy Trilogy</span></div>
        </div>
        <div class="shelf-item bluray" data-tooltip="World War Z" style="width:16px; height:134px; background: linear-gradient(180deg, #2a2a2a, #1a1a1a); color: #d4d4d4;">
            <div class="spine-text"><span class="spine-title">World War Z</span></div>
        </div>
        <!-- Books continue -->
        <div class="shelf-item" data-tooltip="The Best Medicine: Stories of Healing" style="width:28px; height:146px; background: repeating-linear-gradient(180deg, #e63946 0px, #e63946 10px, #f4a261 10px, #f4a261 20px, #2a9d8f 20px, #2a9d8f 30px, #e9c46a 30px, #e9c46a 40px, #264653 40px, #264653 50px); color: #fff; text-shadow: 0 1px 3px rgba(0,0,0,0.7);">
            <div class="spine-text"><span class="spine-title">The Best Medicine</span></div>
        </div>
        <div class="shelf-item" data-tooltip="The Talented Mr Ripley" style="width:28px; height:158px; background: linear-gradient(180deg, #e63946, #d62839); color: #ffd700;">
            <div class="spine-text"><span class="spine-author">Highsmith</span><span class="spine-title">Mr Ripley</span></div>
        </div>
        <div class="shelf-item" data-tooltip="The Ionian Mission" style="width:26px; height:146px; background: #f0ede4; color: #1a1a1a;">
            <div class="spine-text"><span class="spine-author">O'Brian</span><span class="spine-title">The Ionian Mission</span></div>
        </div>
        <div class="shelf-item" data-tooltip="Meditations" style="width:22px; height:136px; background: #f8f4e8; color: #1a1a1a;">
            <div class="spine-text"><span class="spine-author">Aurelius</span><span class="spine-title">Meditations</span></div>
        </div>
        <div class="shelf-item" data-tooltip="Diamonds Are Forever" style="width:22px; height:142px; background: #0d0d0d; color: #e0e0e0;">
            <div class="spine-text"><span class="spine-author">Fleming</span><span class="spine-title">Diamonds Are Forever</span></div>
        </div>
        <div class="shelf-item" data-tooltip="Tomorrow, and Tomorrow, and Tomorrow" style="width:34px; height:152px; background: linear-gradient(180deg, #1a6b8a, #2d9cb8, #f4a261); color: #fff;">
            <div class="spine-text"><span class="spine-author">Zevin</span><span class="spine-title">Tomorrow x3</span></div>
        </div>
        <div class="shelf-item" data-tooltip="The Godfather" style="width:30px; height:148px; background: linear-gradient(180deg, #1a1a1a, #2a2a2a); color: #fff;">
            <div class="spine-text"><span class="spine-author">Puzo</span><span class="spine-title">The Godfather</span></div>
        </div>
        <div class="shelf-item" data-tooltip="Gabriel Garcia Marquez" style="width:28px; height:146px; background: linear-gradient(180deg, #1a2a4a, #0f1e3a); color: #e0d5c0;">
            <div class="spine-text"><span class="spine-author">Garcia Marquez</span></div>
        </div>
        <div class="shelf-item" data-tooltip="The Patala Prophecy" style="width:26px; height:144px; background: linear-gradient(180deg, #2a2a3a, #1a1a2a); color: #d0d0d0;">
            <div class="spine-text"><span class="spine-author">C.C. Doyle</span><span class="spine-title">Patala Prophecy</span></div>
        </div>
        <div class="shelf-item" data-tooltip="The Stranger" style="width:22px; height:136px; background: #f5ecd7; color: #1a1a1a;">
            <div class="spine-text"><span class="spine-author">Camus</span><span class="spine-title">The Stranger</span></div>
        </div>
        <div class="shelf-item" data-tooltip="The Complete Musashi" style="width:36px; height:152px; background: linear-gradient(180deg, #1a1a1a, #111); color: #c9b458;">
            <div class="spine-text"><span class="spine-title">The Complete Musashi</span></div>
        </div>
        <div class="shelf-item" data-tooltip="Notes from Underground" style="width:24px; height:140px; background: linear-gradient(90deg, #f0ede4 70%, #c0392b 70%); color: #2a1a1a;">
            <div class="spine-text"><span class="spine-author">Dostoevsky</span><span class="spine-title">Underground</span></div>
        </div>
        <div class="shelf-item" data-tooltip="Live and Let Die" style="width:22px; height:142px; background: #0d0d0d; color: #e0e0e0;">
            <div class="spine-text"><span class="spine-author">Fleming</span><span class="spine-title">Live and Let Die</span></div>
        </div>
        <div class="shelf-item" data-tooltip="Casino Royale" style="width:22px; height:142px; background: linear-gradient(180deg, #0d0d0d 80%, #8b0000 80%); color: #e0e0e0;">
            <div class="spine-text"><span class="spine-author">Fleming</span><span class="spine-title">Casino Royale</span></div>
        </div>
        <div class="shelf-item" data-tooltip="A Mathematician's Apology" style="width:18px; height:130px; background: #555; color: #fff;">
            <div class="spine-text"><span class="spine-author">Hardy</span><span class="spine-title">Apology</span></div>
        </div>
        <div class="shelf-item" data-tooltip="Introduction to Mathematical Philosophy" style="width:24px; height:136px; background: #6e6e6e; color: #fff;">
            <div class="spine-text"><span class="spine-author">Russell</span><span class="spine-title">Math Philosophy</span></div>
        </div>
        <div class="shelf-item" data-tooltip="Dan Brown" style="width:34px; height:158px; background: linear-gradient(180deg, #8b0000, #c0392b, #8b0000); color: #ffd700;">
            <div class="spine-text"><span class="spine-author">Dan Brown</span></div>
        </div>
        <div class="shelf-item" data-tooltip="Why Men Don't Listen and Women Can't Read Maps" style="width:28px; height:144px; background: linear-gradient(180deg, #d35400, #e74c3c); color: #fff;">
            <div class="spine-text"><span class="spine-author">Pease</span><span class="spine-title">Why Men Don't Listen</span></div>
        </div>
    </div>
    <div class="shelf-plank"></div>
    <p class="shelf-hint">Hover over spines to see titles</p>
</div>

## Contact Me

The best way to reach out to me is by e-mail: contact[at]navan.email

My GPG Fingerprint:

`1DA1 04AA DEB7 7473 A4FA C27B 4EFC A289 7342 A778`

## Links

* [GitHub: @navanchauhan](https://github.com/navanchauhan)
* [Twitter: @navanchauhan](https://x.com/navanchauhan)
* [Matrix: @navan:navan.dev](https://matrix.to/#/@navan:navan.dev)
