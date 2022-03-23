import express from "express";
import fileUpload from "express-fileupload";
import fsextra from "fs-extra";
import path from "path";
import child_process from "child_process";
import ip from "ip";
import open from "open";
const uploadDir = "upload";
fsextra.ensureDir(uploadDir);
const app = express();
const port = 3070;
function getMeta() {
  const ipv4 = ip.address("public", "ipv4");
  const ipv6 = ip.address("public", "ipv6");
  const meta = {
    ipv4,
    ipv6,
    port,
    quickLink: `http://${ipv4}:${port}`,
  };
  return meta;
}
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(fileUpload({}));
app.post("/upload", async (req, res) => {
  const { files } = req;
  if (files) {
    const flattened = Array.from(Object.values(files)).flat();
    await Promise.all(flattened.map((file) => fsextra.writeFile(path.join(uploadDir, file.name), file.data)));
    res.end('<script>alert("Uploaded!");window.location.href = "/"</script>');
  } else {
    res.end('<script>alert("No files uploaded!");window.location.href = "/"</script>');
  }
});
app.get("/", (_, res) => {
  const meta = getMeta();
  res.render("index", meta);
});
app.post("/~invoke/explorer", (_, res) => {
  child_process.execFileSync("explorer.exe", [path.join(process.cwd(), uploadDir)], {
    shell: "powershell",
  });
  res.status(204).end();
});
app.listen(port, () => {
  console.log("uploader started.");
  open(`http://localhost:${port}`);
});
