// This is the service worker with the Cache-first network

// Add this below content to your HTML page, or add the js file to your page at the very top to register service worker

// Check compatibility for the browser we're running this in
if ("serviceWorker" in navigator) {
  const currentScript = document.currentScript;
  const swVersion = currentScript?.dataset?.swVersion || "1";

  navigator.serviceWorker
    .register(`/pwabuilder-sw.js?v=${encodeURIComponent(swVersion)}`, {
      scope: "./"
    })
    .then(function (reg) {
      console.log("[PWA Builder] Service worker ready for scope: " + reg.scope);
    });
}
