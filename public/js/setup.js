/// <reference path="../../global.ts" />
window.ipv4 = document.querySelector("meta[name='ipv4-address']").content;
window.ipv6 = document.querySelector("meta[name='ipv6-address']").content;
window.port = document.querySelector("meta[name='serve-port']").content;
window.quickLink = document.querySelector("meta[name='quick-link']").content;
/**
 * Copy ipv4 to clipboard
 */
async function copyToClipboard(text) {
  const copyContent = text || window.ipv4;
  await window.navigator.clipboard.writeText(copyContent);
  alert(`Copied ${copyContent} to clipboard!`);
}
async function openFolder() {
  await fetch("/~invoke/explorer", {
    method: "post",
  });
}
window.addEventListener("load", () => {
  const qrcode = new QRCode(document.getElementById("qrcode"), {
    width: 240,
    height: 240,
  });
  qrcode.makeCode(quickLink);
});
