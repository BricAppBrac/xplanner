import React, { useMemo } from 'react'
import { getZone } from '../lib/conseils'
import { getNow } from '../lib/dateTest'

const MOIS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']

const TYPES = [
  { key: 'semis_abri',  prefixe: 'semis_abri',  label: 'Semis abri',        bg: 'rgba(109,191,109,0.5)',  border: '#6dbf6d' },
  { key: 'semis_terre', prefixe: 'semis_terre',  label: 'Semis pleine terre', bg: 'rgba(109,191,109,0.85)', border: '#4a9a4a' },
  { key: 'plantation',  prefixe: 'plantation',   label: 'Plantation',         bg: '#FEFE8E',                border: '#d4d46a' },
  { key: 'recolte',     prefixe: 'recolte',      label: 'Récolte',            bg: 'rgba(180,50,50,0.7)',    border: '#c45555', labelColor: '#e88888' },
]

function moisChevauche(mois, debut, fin) {
  if (!debut || !fin) return false
  const mDebut = parseInt(debut.split('-')[0])
  const mFin = parseInt(fin.split('-')[0])
  if (mDebut <= mFin) return mois >= mDebut && mois <= mFin
  return mois >= mDebut || mois <= mFin
}

function calculerGrille(legumesRef, zone) {
  const legumes = [...legumesRef].sort((a, b) => (a.nom || '').localeCompare(b.nom || '', 'fr'))

  const groupes = []
  for (const leg of legumes) {
    const lignes = []
    for (const type of TYPES) {
      const debut = leg[`${type.prefixe}_${zone}_debut`]
      const fin = leg[`${type.prefixe}_${zone}_fin`]
      if (!debut || !fin) continue

      const moisData = []
      for (let m = 1; m <= 12; m++) {
        moisData.push(moisChevauche(m, debut, fin))
      }
      lignes.push({ type, moisData })
    }
    if (lignes.length > 0) {
      groupes.push({ nom: leg.nom, lignes })
    }
  }
  return groupes
}

export default function Calendrier({ profile, legumesRef }) {
  const zone = getZone(profile)
  const moisActuel = getNow().getMonth()

  const groupes = useMemo(
    () => calculerGrille(legumesRef || [], zone),
    [legumesRef, zone]
  )

  if (!legumesRef?.length) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#6dbf6d', fontSize: 16, fontFamily: 'Amaranth, sans-serif' }}>
        Chargement des légumes...
      </div>
    )
  }

  return (
    <div style={{ padding: '12px 0 24px', fontFamily: 'Amaranth, sans-serif' }}>
      {/* Légende */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '8px 16px',
        padding: '8px 16px 14px', fontSize: 13, color: '#e8f5e8',
      }}>
        {TYPES.map(t => (
          <div key={t.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 14, height: 14, borderRadius: 4,
              background: t.bg, border: `1px solid ${t.border}`,
            }} />
            <span style={{ color: t.labelColor || t.bg }}>{t.label}</span>
          </div>
        ))}
      </div>

      {/* Grille scrollable */}
      <div style={{ overflowX: 'auto', padding: '0 8px' }}>
        <table style={{
          width: '100%', minWidth: 600,
          borderCollapse: 'separate', borderSpacing: '2px 1px',
          tableLayout: 'fixed',
        }}>
          <colgroup>
            <col style={{ width: 140 }} />
            {MOIS.map((_, i) => <col key={i} />)}
          </colgroup>

          {/* En-tête mois */}
          <thead>
            <tr>
              <th style={{
                position: 'sticky', left: 0, zIndex: 2,
                background: '#1a2e1a', padding: '8px 6px',
                textAlign: 'left', color: '#6dbf6d', fontSize: 13,
              }}>
                Zone {zone}
              </th>
              {MOIS.map((m, i) => (
                <th key={i} style={{
                  padding: '8px 2px', textAlign: 'center',
                  color: i === moisActuel ? '#6dbf6d' : '#a8d5a2',
                  fontSize: 12,
                  fontWeight: i === moisActuel ? 'bold' : 'normal',
                  background: i === moisActuel ? 'rgba(109,191,109,0.1)' : 'transparent',
                  borderRadius: 4,
                }}>
                  {m}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {groupes.map((groupe, gi) => (
              <React.Fragment key={gi}>
                {/* Ligne nom du légume */}
                <tr>
                  <td style={{
                    position: 'sticky', left: 0, zIndex: 1,
                    background: '#1a2e1a',
                    padding: '6px 8px 2px', height: 32,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    color: '#e8f5e8', fontSize: 13, fontWeight: 'bold',
                  }}>
                    {groupe.nom}
                  </td>
                  {MOIS.map((_, mi) => (
                    <td key={mi} style={{ height: 32 }} />
                  ))}
                </tr>
                {/* Lignes d'activité */}
                {groupe.lignes.map((ligne, li) => (
                  <tr key={li}>
                    <td style={{
                      position: 'sticky', left: 0, zIndex: 1,
                      background: '#1a2e1a',
                      padding: '0 8px 0 16px', height: 28,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      color: ligne.type.bg, fontSize: 11,
                      borderBottom: li === groupe.lignes.length - 1 ? '2px solid rgba(109,191,109,0.15)' : 'none',
                    }}>
                      {ligne.type.label}
                    </td>
                    {ligne.moisData.map((actif, mi) => (
                      <td key={mi} style={{
                        padding: '2px 0', height: 28,
                        borderBottom: li === groupe.lignes.length - 1 ? '2px solid rgba(109,191,109,0.15)' : 'none',
                      }}>
                        <div style={{
                          width: '100%', height: '100%', minHeight: 22,
                          background: actif ? ligne.type.bg : 'transparent',
                          border: actif ? `1px solid ${ligne.type.border}` : 'none',
                          borderRadius: 4,
                          boxSizing: 'border-box',
                        }} />
                      </td>
                    ))}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
