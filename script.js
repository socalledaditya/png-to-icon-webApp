const fileInput = document.getElementById("file-input");
const convertBtn = document.getElementById("convert-btn");
const previewBox = document.getElementById("preview-box");

let image = null;

fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];

  if (!file || file.type !== "image/png") {
    alert("❌ Please select a valid PNG file.");
    fileInput.value = "";
    previewBox.style.display = "none";
    previewBox.src = "#";
    image = null;
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    image = new Image();
    image.onload = () => {
      // Set preview
      previewBox.src = image.src;
      previewBox.style.display = "block";
    };
    image.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

convertBtn.addEventListener("click", async () => {
  if (!image) return alert("Please load a PNG image.");

  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, 32, 32);

  const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
  const pngData = new Uint8Array(await blob.arrayBuffer());

  // === Create ICO binary ===
  const header = new Uint8Array(6);
  header[2] = 1; // Icon type
  header[4] = 1; // 1 image

  const entry = new Uint8Array(16);
  entry[0] = 32; // width
  entry[1] = 32; // height
  entry[2] = 0;
  entry[3] = 0;
  entry[4] = 1;
  entry[5] = 0;
  entry[6] = 32;
  entry[7] = 0;

  const size = pngData.length;
  entry[8] = size & 0xff;
  entry[9] = (size >> 8) & 0xff;
  entry[10] = (size >> 16) & 0xff;
  entry[11] = (size >> 24) & 0xff;

  const offset = 6 + 16;
  entry[12] = offset & 0xff;
  entry[13] = (offset >> 8) & 0xff;
  entry[14] = (offset >> 16) & 0xff;
  entry[15] = (offset >> 24) & 0xff;

  const icoBuffer = new Uint8Array(
    header.length + entry.length + pngData.length
  );
  icoBuffer.set(header, 0);
  icoBuffer.set(entry, header.length);
  icoBuffer.set(pngData, header.length + entry.length);

  const icoBlob = new Blob([icoBuffer], { type: "image/x-icon" });
  const url = URL.createObjectURL(icoBlob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "favicon.ico";
  a.click();
  URL.revokeObjectURL(url);
});
