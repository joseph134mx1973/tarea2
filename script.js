const startCameraBtn = document.getElementById("startCamera");
const takePhotoBtn = document.getElementById("takePhoto");
const stopCameraBtn = document.getElementById("stopCamera");
const cameraVideo = document.getElementById("cameraVideo");
const videoOverlay = document.getElementById("videoOverlay");
const photoCanvas = document.getElementById("photoCanvas");
const noPhotoText = document.getElementById("noPhotoText");
const downloadLink = document.getElementById("downloadLink");
const uploadImageInput = document.getElementById("uploadImage");
const plateResult = document.getElementById("plateResult");

let stream = null;

async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false
    });
    cameraVideo.srcObject = stream;
    videoOverlay.style.display = "none";
    takePhotoBtn.disabled = false;
    stopCameraBtn.disabled = false;
    startCameraBtn.disabled = true;
  } catch (error) {
    videoOverlay.textContent = "No se pudo acceder a la cámara. Revisa permisos.";
    videoOverlay.style.display = "grid";
    console.error(error);
  }
}

function stopCamera() {
  if (!stream) return;
  stream.getTracks().forEach(track => track.stop());
  stream = null;
  cameraVideo.srcObject = null;
  videoOverlay.textContent = "Cámara detenida.";
  videoOverlay.style.display = "grid";
  takePhotoBtn.disabled = true;
  stopCameraBtn.disabled = true;
  startCameraBtn.disabled = false;
}

function takePhoto() {
  if (!stream) return;

  const width = cameraVideo.videoWidth;
  const height = cameraVideo.videoHeight;
  if (!width || !height) return;

  photoCanvas.width = width;
  photoCanvas.height = height;

  const ctx = photoCanvas.getContext("2d");
  ctx.drawImage(cameraVideo, 0, 0, width, height);

  const imageDataUrl = photoCanvas.toDataURL("image/png");
  photoCanvas.style.display = "block";
  noPhotoText.style.display = "none";
  plateResult.value = "Procesando placa...";
  plateResult.classList.add("processing");

  downloadLink.href = imageDataUrl;
  downloadLink.classList.remove("disabled");
  recognizePlate(imageDataUrl);
}

function handleUploadImage(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) {
    return;
  }
  if (!file.type.startsWith("image/")) {
    plateResult.value = "Selecciona un archivo de imagen válido.";
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    processImageDataUrl(reader.result);
  };
  reader.readAsDataURL(file);
}

function processImageDataUrl(imageDataUrl) {
  const image = new Image();
  image.onload = () => {
    photoCanvas.width = image.width;
    photoCanvas.height = image.height;

    const ctx = photoCanvas.getContext("2d");
    ctx.drawImage(image, 0, 0, image.width, image.height);

    photoCanvas.style.display = "block";
    noPhotoText.style.display = "none";
    plateResult.value = "Procesando placa...";
    plateResult.classList.add("processing");

    downloadLink.href = imageDataUrl;
    downloadLink.classList.remove("disabled");
    recognizePlate(imageDataUrl);
  };
  image.onerror = () => {
    plateResult.value = "No se pudo cargar la imagen. Intenta otra vez.";
  };
  image.src = imageDataUrl;
}

function formatPlate(rawText) {
  const cleaned = rawText.replace(/[^A-Z0-9]/gi, "");
  return cleaned.toUpperCase();
}

async function recognizePlate(imageDataUrl) {
  try {
    const { data: { text } } = await Tesseract.recognize(imageDataUrl, "eng", {
      logger: () => {}
    });
    const plateText = formatPlate(text);
    plateResult.classList.remove("processing");

    if (plateText) {
      plateResult.value = plateText;
    } else {
      plateResult.value = "No se detectó una placa clara. Intenta otra foto.";
    }
  } catch (error) {
    plateResult.classList.remove("processing");
    plateResult.value = "Error al leer la placa. Intenta de nuevo.";
    console.error(error);
  }
}

startCameraBtn.addEventListener("click", startCamera);
takePhotoBtn.addEventListener("click", takePhoto);
stopCameraBtn.addEventListener("click", stopCamera);
uploadImageInput.addEventListener("change", handleUploadImage);

downloadLink.addEventListener("click", (event) => {
  if (downloadLink.classList.contains("disabled")) {
    event.preventDefault();
  }
});
