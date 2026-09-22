import type { Config } from 'tailwindcss';
export default { content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'], theme: { extend: { colors: { eagle: { 50:'#f0fdf4', 100:'#dcfce7', 500:'#16a34a', 600:'#15803d', 700:'#166534', 900:'#14532d' } } } }, plugins: [] } satisfies Config;
