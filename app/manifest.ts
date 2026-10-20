import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'VendaControl Pro',
    short_name: 'VendaControl',
    description: 'Sistema de Inteligência Comercial',
    // Abre direto no painel; quem não estiver logado cai no login pelo proxy.
    start_url: '/app/dashboard',
    display: 'standalone',
    background_color: '#0d0f1a',
    theme_color: '#0d0f1a',
    lang: 'pt-BR',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      // Sem um ícone maskable o Android envolve a arte num quadrado branco.
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
