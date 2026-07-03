import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

/** Renders `value` as a QR image (data URL). Empty until it encodes. */
export function QrCode({ value }: { value: string }) {
  const [dataUrl, setDataUrl] = useState('');
  useEffect(() => {
    if (!value) return;
    let alive = true;
    QRCode.toDataURL(value, { width: 240, margin: 1 })
      .then((url) => alive && setDataUrl(url))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [value]);

  if (!dataUrl) return null;
  return (
    <img className="pairing-qr" src={dataUrl} alt="Your pairing QR code" data-testid="pairing-qr" />
  );
}
