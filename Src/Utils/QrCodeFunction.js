import QRCode from "qrcode";

async function generateQrCode({ data = "" } = {}) {
  const QrCode = QRCode.toDataURL(JSON.stringify(data), {
    errorCorrectionLevel: "H",
  });

  return QrCode;
}

export default generateQrCode;
