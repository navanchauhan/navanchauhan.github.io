---
date: 2026-04-06 00:00
description: A curated list of places I liked
tags: Lists
visible_on_main: false
---

# Places

A collection of places I liked.

<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>

<style>
.city-map {
    height: 400px;
    width: 100%;
    margin: 1em 0;
    border-radius: 6px;
    border: 1px solid #ccc;
    z-index: 0;
    display: none;
}
.city-map.active {
    display: block;
}
.view-toggle {
    cursor: pointer;
    padding: 0.4em 1em;
    border: 1px solid #2e5a72;
    border-radius: 4px;
    background: #2e5a72;
    color: #fff;
    font-size: 0.9em;
    margin: 0.5em 0 1em 0;
}
.view-toggle:hover {
    background: #1a5b74;
}
.emoji-marker {
    background: rgba(26, 91, 116, 0.6);
    border: none;
    border-radius: 50%;
    text-align: center;
}
</style>

<button class="view-toggle" id="toggle-maps">Show Maps</button>

## San Francisco, CA

<div class="city-map" id="map-sf" data-lat="37.7749" data-lng="-122.4194" data-zoom="13"></div>

### Food

- **Côte Ouest Bistro** — IYKYK <!-- geo:37.7990,-122.4466 -->
- **Sotto Mare** — Good cioppino <!-- geo:37.7998,-122.4085 -->
- **Mo's Grill** <!-- geo:37.7992,-122.4072 -->
- **Copra SF** <!-- geo:37.7854,-122.4328 -->
- **The Ramp Restaurant** — Casual waterfront spot on Mission Bay <!-- geo:37.7647,-122.3882 -->

### Bars

- **Vesuvio** — Yes. <!-- geo:37.7976,-122.4066 -->
- **Shotwell's Saloon** — If you are around Mission <!-- geo:37.7588,-122.4155 -->
- **Local Edition** — Jazz <!-- geo:37.7870,-122.4032 -->
- **Bow Bow Cocktail Lounge** — Shitty Chinese bar that does karaoke <!-- geo:37.7986,-122.4074 -->
- **Li Po Cocktail Lounge** — Another shitty Chinese bar but they do a good Mai Tai <!-- geo:37.7952,-122.4067 -->
- **The View Lounge** — A very good view! <!-- geo:37.7856,-122.4033 -->
- **Johnny Foley's** — A good Irish House <!-- geo:37.7864,-122.4082 -->
- **Red Jack Saloon** — It is a "Boston" bar <!-- geo:37.8058,-122.4138 -->
- **Final Final** — Go after/before Côte Ouest <!-- geo:37.7986,-122.4465 -->
- **Harlan Records** — Japanese listening room vibes, vinyl records and live music <!-- geo:37.7873,-122.4075 -->
- **Tupelo** — Kind of a CU bar <!-- geo:37.7993,-122.4075 -->

### Landmarks

- **Palace of Fine Arts** — Just go there... <!-- geo:37.8020,-122.4483 -->
- **Salesforce Park** — Silly <!-- geo:37.7897,-122.3943 -->
- **Exploratorium** <!-- geo:37.8009,-122.3985 -->
- **Musée Mécanique** — Arcade museum <!-- geo:37.8092,-122.4158 -->

## San Mateo, CA

<div class="city-map" id="map-sanmateo" data-lat="37.5635" data-lng="-122.3230" data-zoom="17"></div>

### Food

- **Sushi Maruyama** — IYKYK <!-- geo:37.5638,-122.3226 -->
- **Zhangliang Malatang** — Chinese hot pot <!-- geo:37.5632,-122.3230 -->
- **Kajiken Ramen** <!-- geo:37.5668,-122.3240 -->
- **Tai Er Sichuan Cuisine** <!-- geo:37.5646,-122.3197 -->
- **Izakaya Fusion Grill Keitan** <!-- geo:37.5669,-122.3204 -->
- **Joy Sushi** <!-- geo:37.5672,-122.3245 -->
- **Somisomi** <!-- geo:37.5666,-122.3238 -->
- **Mountain Mike's Pizza** — When you are hungry after a movie <!-- geo:37.5666,-122.3237 -->
- **Molly Tea** — I thought their Jasmine milk tea was probably overrated. It isn't. <!-- geo:37.5665,-122.3233 -->
- **Pausa Bar & Cookery** <!-- geo:37.5647,-122.3220 -->
- **Chill Spot Rendezvous** — Their ice-cream is amazing... <!-- geo:37.5672,-122.3256 -->

### Bars

- **Wunderbar** — "Speakeasy" <!-- geo:37.5641,-122.3231 -->
- **Fogbird** — Cocktail Bar <!-- geo:37.5631,-122.3232 -->
- **O'Neil's Irish Pub** — Shitty Irish Bar <!-- geo:37.5671,-122.3249 -->
- **Eddie's Sports Bar** — When you need a drink after a movie! <!-- geo:37.5662,-122.3230 -->

<script>
(function () {
    var mapsInitialized = false;
    var maps = [];
    var mapVisible = false;

    var toggleBtn = document.getElementById("toggle-maps");

    toggleBtn.addEventListener("click", function () {
        mapVisible = !mapVisible;
        toggleBtn.textContent = mapVisible ? "Hide Maps" : "Show Maps";

        document.querySelectorAll(".city-map").forEach(function (el) {
            if (mapVisible) {
                el.classList.add("active");
            } else {
                el.classList.remove("active");
            }
        });

        if (mapVisible && !mapsInitialized) {
            initMaps();
            mapsInitialized = true;
        }

        // Leaflet needs a resize nudge when shown from display:none
        maps.forEach(function (m) { m.invalidateSize(); });
    });

    var categoryIcons = {
        "food": "\u{1F37D}\uFE0F",
        "bars": "\u{1F37A}",
        "landmarks": "\u{1F3DB}\uFE0F",
        "music": "\u{1F3B5}"
    };

    function emojiIcon(emoji) {
        return L.divIcon({
            html: '<span style="font-size:24px;line-height:1;">' + emoji + '</span>',
            className: 'emoji-marker',
            iconSize: [40, 40],
            iconAnchor: [20, 20],
            popupAnchor: [0, -20]
        });
    }

    function categoryForHeading(text) {
        var t = text.toLowerCase().trim();
        for (var key in categoryIcons) {
            if (t === key) return key;
        }
        return null;
    }

    function initMaps() {
        document.querySelectorAll(".city-map").forEach(function (el) {
            var lat = parseFloat(el.dataset.lat);
            var lng = parseFloat(el.dataset.lng);
            var zoom = parseInt(el.dataset.zoom) || 13;
            var map = L.map(el.id).setView([lat, lng], zoom);
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                maxZoom: 19
            }).addTo(map);
            maps.push(map);

            // Collect markers: walk DOM siblings after this map div until next .city-map or <hr>
            var node = el.nextElementSibling;
            var currentCategory = null;
            while (node) {
                if (node.classList && node.classList.contains("city-map")) break;
                if (node.tagName === "HR") break;

                // Track which h3 category we're under
                if (node.tagName === "H3") {
                    currentCategory = categoryForHeading(node.textContent);
                }

                // Check list items for geo comments
                var items = node.tagName === "LI" ? [node] : node.querySelectorAll ? Array.from(node.querySelectorAll("li")) : [];
                items.forEach(function (li) {
                    var html = li.innerHTML;
                    var geoMatch = html.match(/geo:([-\d.]+),([-\d.]+)/);
                    if (geoMatch) {
                        var plat = parseFloat(geoMatch[1]);
                        var plng = parseFloat(geoMatch[2]);
                        var name = li.querySelector("strong") ? li.querySelector("strong").textContent : li.textContent.split("\u2014")[0].trim();
                        var opts = {};
                        if (currentCategory && categoryIcons[currentCategory]) {
                            opts.icon = emojiIcon(categoryIcons[currentCategory]);
                        }
                        L.marker([plat, plng], opts).addTo(map).bindPopup(name);
                    }
                });

                node = node.nextElementSibling;
            }
        });
    }
})();
</script>
