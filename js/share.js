// ===== SHARE PAGE =====
window.sharePage = async function () {
  const url = window.location.href;

  // Use dynamic title set by updatePageMeta()
  const title = document.title && document.title !== "Product"
    ? document.title
    : "Have a look at this product";

  const text = "Have a look at this product 👇";

  // ✅ Modern browsers (Android / iOS / Chrome / Safari)
  if (navigator.share) {
    try {
      await navigator.share({
        title: title,
        text: text,
        url: url
      });
    } catch (err) {
      console.log("Share cancelled", err);
    }
    return;
  }

  // 🔁 Fallback 1 — WhatsApp direct
  const waUrl = `https://wa.me/?text=${encodeURIComponent(
    `${title}\n\n${text}\n${url}`
  )}`;

  // Try opening WhatsApp
  const opened = window.open(waUrl, "_blank");

  // 🔁 Fallback 2 — Copy link if popup blocked
  if (!opened) {
    try {
      await navigator.clipboard.writeText(url);
      showShareToast("Link copied 📋");
    } catch (err) {
      alert("Copy this link:\n" + url);
    }
  }
};

// ===== SMALL TOAST =====
function showShareToast(msg) {
  const toast = document.createElement("div");
  toast.innerText = msg;

  toast.style.position = "fixed";
  toast.style.bottom = "90px";
  toast.style.left = "50%";
  toast.style.transform = "translateX(-50%)";
  toast.style.background = "#000";
  toast.style.color = "#fff";
  toast.style.padding = "10px 16px";
  toast.style.borderRadius = "20px";
  toast.style.fontSize = "14px";
  toast.style.fontWeight = "500";
  toast.style.zIndex = "9999";
  toast.style.opacity = "0";
  toast.style.transition = "opacity 0.3s ease";

  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = "1";
  });

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}