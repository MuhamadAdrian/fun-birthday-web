export type CakeStyle = 'realistic' | 'cute'

export interface CakeDefinition {
  id: string
  name: string
  style: CakeStyle
  description: string
  colors: { base: string; frosting: string; accent: string }
  glbPath?: string
  thumbnailEmoji: string
}

export const CAKES: CakeDefinition[] = [
  {
    id: 'choco-01',
    name: 'Choco Delight',
    style: 'realistic',
    description: 'Coklat ganache dengan cherry di atas',
    colors: { base: '#4B2E1A', frosting: '#6B3A2A', accent: '#E63946' },
    thumbnailEmoji: '🍫',
    glbPath: '/models/cake-choco-01.glb',
  },
  {
    id: 'vanilla-01',
    name: 'Vanilla Dream',
    style: 'realistic',
    description: 'Vanilla buttercream klasik',
    colors: { base: '#F5E6C8', frosting: '#FFF8E7', accent: '#FFD23F' },
    thumbnailEmoji: '🍰',
    glbPath: '/models/cake-vanilla-01.glb',
  },
  {
    id: 'pastel-01',
    name: 'Pastel Party',
    style: 'cute',
    description: 'Warna pastel dengan sprinkle rainbow',
    colors: { base: '#FFB5D8', frosting: '#FFE5EC', accent: '#A8E6CF' },
    thumbnailEmoji: '🌈',
    glbPath: '/models/cake-pastel-01.glb',
  },
  {
    id: 'bear-01',
    name: 'Bear Hug',
    style: 'cute',
    description: 'Kue beruang lucu untuk yang tersayang',
    colors: { base: '#D6A77A', frosting: '#FFF0D6', accent: '#FF8FAB' },
    thumbnailEmoji: '🧸',
    glbPath: '/models/cake-bear-01.glb',
  },
]

export function getCakeById(id: string) {
  return CAKES.find((c) => c.id === id) ?? CAKES[0]
}
