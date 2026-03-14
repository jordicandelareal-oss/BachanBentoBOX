import React, { useState } from 'react'
import { useBentoMaker } from '../../hooks/useBentoMaker'

export default function BentoMaker() {
  const { 
    bentoName, setBentoName, 
    salePrice, setSalePrice, 
    portions, setPortions,
    items, addItem, updateItemQuantity, removeItem,
    totals, saveBento
  } = useBentoMaker()

  const [isSaving, setIsSaving] = useState(false)

  // This would ideally come from useIngredients / useRecipes hooks
  // Mocking for UI building purposes
  const handleAddMockIngredient = () => {
    addItem({
      type: 'ingredient',
      id: 1,
      name: 'Salmón fresco',
      costPerUnit: 0.025, // 25€/kg -> 0.025€/g
      unit: 'g',
      quantity: 100
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await saveBento()
      alert('Bento guardado con éxito!')
    } catch (error) {
      console.error(error)
      alert('Error guardando el bento: ' + error.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="bento-maker-container">
      <div className="card bento-header">
        <input 
          type="text" 
          placeholder="Nombre del Bento..." 
          value={bentoName}
          onChange={(e) => setBentoName(e.target.value)}
          className="bento-title-input"
        />
        
        <div className="bento-meta">
          <div>
            <label>Raciones:</label>
            <input 
              type="number" 
              value={portions} 
              onChange={(e) => setPortions(Number(e.target.value))}
              min="1"
            />
          </div>
          <div>
            <label>Precio Venta (€):</label>
            <input 
              type="number" 
              value={salePrice} 
              onChange={(e) => setSalePrice(Number(e.target.value))}
              step="0.5"
            />
          </div>
        </div>
      </div>

      <div className="bento-body">
        <div className="card bento-items">
          <h3>Ingredientes y Elaboraciones</h3>
          
          <table className="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Cant.</th>
                <th>Costo Ud.</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item._key}>
                  <td>{item.name}</td>
                  <td>
                    <input 
                      type="number" 
                      value={item.quantity}
                      onChange={(e) => updateItemQuantity(item._key, e.target.value)}
                      style={{ width: '80px' }}
                    /> {item.unit}
                  </td>
                  <td>{(item.costPerUnit * 1000).toFixed(2)}€/kg</td>
                  <td><b>{(item.costPerUnit * item.quantity).toFixed(2)}€</b></td>
                  <td>
                    <button onClick={() => removeItem(item._key)} className="btn-remove">✕</button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan="5" className="empty-state">No hay ingredientes. ¡Añade alguno!</td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="add-controls">
            {/* Here we would place the Autocomplete component */}
            <button className="btn-secondary" onClick={handleAddMockIngredient}>
              + Añadir Salmón (Demo)
            </button>
          </div>
        </div>

        <div className="card bento-summary">
          <h3>Resumen de Rentabilidad</h3>
          
          <div className="summary-row">
            <span>Coste Total:</span>
            <span className="value">{totals.totalCost.toFixed(2)} €</span>
          </div>
          <div className="summary-row">
            <span>Coste x Ración:</span>
            <span className="value">{totals.costPerPortion.toFixed(2)} €</span>
          </div>
          
          <hr />
          
          <div className="summary-row highlight">
            <span>Margen Bruto:</span>
            <span className={`value ${totals.margin >= 70 ? 'good' : 'warning'}`}>
              {totals.margin.toFixed(1)}%
            </span>
          </div>

          <button 
            className="btn-primary w-full mt-4" 
            onClick={handleSave}
            disabled={isSaving || !bentoName}
          >
            {isSaving ? 'Guardando...' : 'Guardar Escandallo'}
          </button>
        </div>
      </div>
    </div>
  )
}
