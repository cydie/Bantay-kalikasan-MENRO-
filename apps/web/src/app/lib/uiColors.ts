export const statIconColors: Record<string, { bg: string; text: string }> = {
  blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
  green: { bg: 'bg-green-100', text: 'text-green-600' },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-600' },
  pink: { bg: 'bg-pink-100', text: 'text-pink-600' },
  indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600' },
  red: { bg: 'bg-red-100', text: 'text-red-600' },
  gray: { bg: 'bg-gray-100', text: 'text-gray-600' },
  teal: { bg: 'bg-teal-100', text: 'text-teal-600' },
  cyan: { bg: 'bg-cyan-100', text: 'text-cyan-600' },
  emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600' },
  lime: { bg: 'bg-lime-100', text: 'text-lime-600' },
};

export function getStatIconColors(color: string) {
  return statIconColors[color] ?? statIconColors.green;
}
