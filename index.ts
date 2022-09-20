import express from "express";
import fileUpload from "express-fileupload";
import fsextra from "fs-extra";
import path from "path";
import child_process from "child_process";
import expressWS from "express-ws";
import ip from "ip";
import open from "open";
import dotenv from "dotenv";
const uploadDir = "upload";
dotenv.config();
fsextra.ensureDir(uploadDir);
const app = expressWS(express()).app;
const port = +(process.env.PORT ?? "3080");
function getMeta(req: express.Request) {
  const ipv4 = ip.address("public", "ipv4");
  const host = ipv4;
  const ipv6 = ip.address("public", "ipv6");
  const meta = {
    ipv4,
    ipv6,
    port,
    lastPaste,
    room,
    ip: req.ip,
    quickLink: `http://${host}:${port}`,
  };
  return meta;
}
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(fileUpload({}));
const endMessage = (res: express.Response, msg: string) => {
  res.end(`<script>alert('${msg}');window.location.href = "/"</script>`);
};
app.post("/upload", async (req, res) => {
  const { files } = req;
  if (files) {
    const flattened = Array.from(Object.values(files)).flat();
    await Promise.all(flattened.map((file) => fsextra.writeFile(path.join(uploadDir, file.name), file.data)));
    endMessage(res, "Uploaded!");
  } else {
    endMessage(res, "No files uploaded!");
  }
});
app.get("/", (req, res) => {
  const meta = getMeta(req);
  res.render("index", meta);
});
app.post("/~invoke/explorer", (_, res) => {
  child_process.execFileSync("explorer.exe", [path.join(process.cwd(), uploadDir)], {
    shell: "powershell",
  });
  res.status(204).end();
});

let lastPaste = "";
app.post("/paste", (req, res) => {
  const content: string = req.body.content;
  console.debug(content);
  lastPaste = content;
  res.redirect("/");
});
interface Member {
  ip: string;
  send: (msg: Uint8Array) => void;
}

const room: Member[] = [];
app.ws("/im", (ws, req) => {
  const ip = req.ip;
  const send = (msg: Uint8Array) => {
    console.debug(`sending to ${ip}`);
    ws.send(msg);
  };
  room.push({
    ip,
    send,
  });
  console.debug(`added member ${ip}`);
  ws.on("close", () => {
    room.splice(room.findIndex((item) => item.ip === ip));
    console.debug(`removed member ${ip}`);
  });
});
app.post("/chat-file", (req, res) => {
  const { files } = req;
  const ip = req.body.ip;
  const targetMember = room.find((m) => m.ip === ip);
  if (!targetMember) {
    endMessage(res, `member ${ip} is not present`);
    return;
  }
  if (files) {
    const allFiles = Array.from(Object.values(files)).flat();
    for (const file of allFiles) {
      const { data, encoding, mimetype, name } = file;
      const meta = {
        encoding,
        mimetype,
        fileName: name,
      };
      const jsonBin = Buffer.from(JSON.stringify(meta), "utf-8");
      const metaSize = 1 << 10;
      if (jsonBin.length > metaSize) {
        console.warn("meta data size exceeded", meta);
        continue;
      }
      const buf = Buffer.alloc(data.length + metaSize);
      buf.set(jsonBin, 0);
      buf.set(data, metaSize);
      targetMember.send(buf);
    }
    endMessage(res, "Chat file posted.");
  } else {
    endMessage(res, "No file selected.");
  }
});
app.listen(port, () => {
  console.info("Uploader started.");
  open(`http://localhost:${port}`);
});
