import express from "express";
import fileUpload from "express-fileupload";
import fsextra from "fs-extra";
import path from "path";
const uploadDir = "upload";
fsextra.ensureDir(uploadDir);
const app = express();
const port = 3070;

app.use(express.static("public"));
app.use(fileUpload({}));

app.post("/upload", async (req, res) => {
  const { files } = req;
  if (files) {
    const flattened = Array.from(Object.values(files)).flat();
    await Promise.all(
      flattened.map((file) =>
        fsextra.writeFile(path.join(uploadDir, file.name), file.data)
      )
    );
    res.end('<script>alert("Uploaded!");window.location.href = "/"</script>');
  } else {
    res.end(
      '<script>alert("No files uploaded!");window.location.href = "/"</script>'
    );
  }
});

app.listen(port, () => {
  console.log("uploader started.");
});
