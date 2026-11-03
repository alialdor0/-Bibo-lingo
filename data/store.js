// عناصر المتجر. تُشترى بالجواهر التي يكسبها الطالب من اختباراته.
export const CATS = [['cover', 'الأغلفة'], ['pen', 'الأقلام'], ['sticker', 'الملصقات']];
export const STORE_ITEMS = [
  { id: 'cv-blue', cat: 'cover', name: 'غلاف أزرق', price: 20, color: '#1D4ED8' },
  { id: 'cv-red', cat: 'cover', name: 'غلاف أحمر', price: 20, color: '#B91C1C' },
  { id: 'cv-purple', cat: 'cover', name: 'غلاف بنفسجي', price: 25, color: '#6D28D9' },
  { id: 'cv-gold', cat: 'cover', name: 'غلاف ذهبي', price: 40, color: '#B45309' },
  { id: 'pn-blue', cat: 'pen', name: 'قلم أزرق', price: 10, color: '#1D4ED8' },
  { id: 'pn-red', cat: 'pen', name: 'قلم أحمر', price: 10, color: '#B91C1C' },
  { id: 'pn-green', cat: 'pen', name: 'قلم أخضر', price: 10, color: '#15803D' },
  { id: 'pn-purple', cat: 'pen', name: 'قلم بنفسجي', price: 15, color: '#7E22CE' },
  { id: 'st-star', cat: 'sticker', name: 'نجمة', price: 5, emoji: '⭐' },
  { id: 'st-rocket', cat: 'sticker', name: 'صاروخ', price: 10, emoji: '🚀' },
  { id: 'st-owl', cat: 'sticker', name: 'بومة', price: 15, emoji: '🦉' },
  { id: 'st-books', cat: 'sticker', name: 'كتب', price: 15, emoji: '📚' },
  { id: 'st-trophy', cat: 'sticker', name: 'كأس', price: 30, emoji: '🏆' },
];
export const findItem = (id) => STORE_ITEMS.find((i) => i.id === id);
// قيمة العنصر المستخدم (لون أو ملصق) أو القيمة الافتراضية.
export function equippedValue(inv, cat, fallback) {
  const it = findItem(inv && inv.equipped && inv.equipped[cat]);
  return it ? (it.color || it.emoji) : fallback;
}
