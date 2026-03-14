import BentoMaker from '../components/BentoMaker/BentoMaker'
import '../components/BentoMaker/BentoMaker.css'

export default function BentoPage() {
  return (
    <div>
      <h1 style={{ marginBottom: '24px', color: 'var(--color-primary)' }}>Creador de Escandallos</h1>
      <BentoMaker />
    </div>
  )
}
