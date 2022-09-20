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
  try {
    await window.navigator.clipboard.writeText(copyContent);
    alert(`Copied ${copyContent} to clipboard!`);
  } catch (error) {
    alert(error.message);
  }
}
async function openFolder() {
  await fetch("/~invoke/explorer", {
    method: "post",
  });
}
function showSize() {
  alert(
    JSON.stringify(
      {
        "window.innerHeight": window.innerHeight,
        "window.innerWidth": window.innerWidth,
        "window.outerHeight": window.outerHeight,
        "window.outerWidth": window.outerWidth,
        "document.documentElement.offsetHeight": document.documentElement.offsetHeight,
        "document.documentElement.offsetWidth": document.documentElement.offsetWidth,
      },
      undefined,
      2
    )
  );
}
window.addEventListener("load", () => {
  const qrcode = new QRCode(document.getElementById("qrcode"), {
    width: 240,
    height: 240,
  });
  qrcode.makeCode(quickLink);
});
const ws = new WebSocket(`ws://${location.host}/im`);
const wsReady = new Promise((resolve) => {
  ws.addEventListener("open", () => {
    console.debug("WebSocket connected.");
    resolve();
  });
});
ws.addEventListener("message", (e) => {
  const data = e.data;
  if (data instanceof Blob) {
    const metaSize = 1 << 10;
    const reader = new FileReader();
    const metaPart = data.slice(0, metaSize);
    reader.readAsText(metaPart, "utf-8");
    reader.onloadend = () => {
      /** @type {string} */
      const result = reader.result;
      const meta = JSON.parse([...result].filter((char) => char.charCodeAt(0)).join(""));
      console.debug(`Parsed metadata:`, meta);
      const dataPart = data.slice(metaSize);
      const url = URL.createObjectURL(new Blob([dataPart], { type: meta.mimetype }));
      const link = document.createElement("a");
      link.href = url;
      link.appendChild(new Text(meta.fileName));
      document.body.appendChild(link);
    };
  }
});
async function send(ip) {
  const formWrapper = document.getElementById("chat-form-wrapper");
  formWrapper.querySelector("input").value = ip;
  const form = formWrapper.querySelector("form");
  const formdata = new FormData(form);
  // use fetch API for easier multi post.
  await fetch("/chat-file", {
    method: "post",
    body: formdata,
  });
  alert(`Files are posted to ${ip}.`);
}
