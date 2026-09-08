// Service Worker registration
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch(function () {});
}

// PWA install prompt
var deferredPrompt = null;

window.addEventListener("beforeinstallprompt", function (e) {
  e.preventDefault();
  deferredPrompt = e;
  var btn = document.getElementById("installBtn");
  if (btn) btn.hidden = false;
});

window.addEventListener("appinstalled", function () {
  deferredPrompt = null;
  var btn = document.getElementById("installBtn");
  if (btn) btn.hidden = true;
});

document.addEventListener("DOMContentLoaded", function () {
  var btn = document.getElementById("installBtn");
  if (btn) {
    btn.addEventListener("click", function () {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(function () { deferredPrompt = null; });
    });
  }
});