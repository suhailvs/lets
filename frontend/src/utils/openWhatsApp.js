export function openWhatsApp(phone, message = '') {
  if (!phone) return;
  const encodedMessage = encodeURIComponent(message);
  const cleanPhone = String(phone).replace(/[^0-9]/g, '');
  const url = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}
