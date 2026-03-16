export default function Jardin({ profile }) {
  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ color: '#e8f5e8', fontSize: 20, margin: '0 0 8px' }}>
        Ton jardin 🌿
      </h2>
      <p style={{ color: '#6dbf6d', fontSize: 14, margin: '0 0 24px' }}>
        Aucune culture pour l'instant. Ajoute ta première !
      </p>
      <button style={{
        padding: '12px 20px', background: 'linear-gradient(135deg, #4a7c4a, #6dbf6d)',
        border: 'none', borderRadius: 12, color: '#fff', fontSize: 14,
        cursor: 'pointer', fontFamily: 'Georgia, serif'
      }}>
        + Ajouter une culture
      </button>
    </div>
  )
}