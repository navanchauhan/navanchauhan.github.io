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
    max-width: 500px;
    margin: 0 auto;
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

<button class="vinyl-close-btn" id="vinylCloseBtn">&times;</button>

<script>
(function() {
    const vinylRack = document.getElementById('vinylRack');
    const closeBtn = document.getElementById('vinylCloseBtn');
    const vinyls = document.querySelectorAll('.vinyl-sleeve');
    let isExpanded = false;

    vinyls.forEach(vinyl => {
        vinyl.addEventListener('click', (e) => {
            if (!isExpanded) {
                expandRack();
            }
        });
    });

    closeBtn.addEventListener('click', collapseRack);

    vinylRack.addEventListener('click', (e) => {
        if (isExpanded && e.target === vinylRack) {
            collapseRack();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isExpanded) {
            collapseRack();
        }
    });

    function expandRack() {
        isExpanded = true;
        vinylRack.classList.add('expanded');
        closeBtn.classList.add('visible');
        document.body.style.overflow = 'hidden';

        vinyls.forEach(vinyl => {
            const cover = vinyl.dataset.cover;
            if (cover) {
                vinyl.style.backgroundImage = `url(${cover})`;
            }
        });
    }

    function collapseRack() {
        isExpanded = false;
        vinylRack.classList.remove('expanded');
        closeBtn.classList.remove('visible');
        document.body.style.overflow = '';

        vinyls.forEach(vinyl => {
            vinyl.style.backgroundImage = '';
        });
    }
})();
</script>

## Contact Me

The best way to reach out to me is by e-mail: contact[at]navan.email

My GPG Fingerprint:

`1DA1 04AA DEB7 7473 A4FA C27B 4EFC A289 7342 A778`

## Links

* [GitHub: @navanchauhan](https://github.com/navanchauhan)
* [Twitter: @navanchauhan](https://github.com/navanchauhan)
* [Matrix: @navan:navan.dev](https://matrix.to/#/@navan:navan.dev)
