/**
 * Генерирует случайный HEX-цвет
 * @returns Строка с HEX-цветом (например, '#A3F2B1')
 */
function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

export default getRandomColor;
