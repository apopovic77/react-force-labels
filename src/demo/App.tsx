import { useState } from 'react';
import { Vector2 } from 'arkturian-typescript-utils';
import { ForceLabels } from '../components/ForceLabels';
import type { Label, ForceConfig } from '../types';
import './App.css';

function App() {
  const [showConnectors, setShowConnectors] = useState(true);
  const [repulsionStrength, setRepulsionStrength] = useState(50);
  const [anchorStrength, setAnchorStrength] = useState(0.1);

  // Example: Product annotation (like your image)
  const productLabels: Label[] = [
    {
      id: 'price',
      anchor: new Vector2(300, 200),
      content: '€ 59,99',
      priority: 2,
    },
    {
      id: 'name',
      anchor: new Vector2(150, 220),
      content: "O'NEAL Flow Jersey",
      priority: 3,
    },
    {
      id: 'feature1',
      anchor: new Vector2(300, 300),
      content: '⚡ Quick Dry',
      priority: 1,
    },
    {
      id: 'feature2',
      anchor: new Vector2(350, 340),
      content: '🎨 4 Colors Avail.',
      priority: 1,
    },
  ];

  // Example: Multiple anchor points
  const multiAnchorLabels: Label[] = Array.from({ length: 8 }, (_, i) => ({
    id: `label-${i}`,
    anchor: new Vector2(
      300 + Math.cos((i * Math.PI * 2) / 8) * 100,
      300 + Math.sin((i * Math.PI * 2) / 8) * 100
    ),
    content: `Label ${i + 1}`,
  }));

  const [activeDemo, setActiveDemo] = useState<'product' | 'multi'>('product');
  const labels = activeDemo === 'product' ? productLabels : multiAnchorLabels;

  const forceConfig: ForceConfig = {
    anchorStrength,
    repulsionStrength,
    repulsionRadius: 100,
    minDistance: 40,
    maxDistance: 200,
    enableCollision: true,
  };

  return (
    <div className="app">
      <header className="header">
        <h1>React Force Labels</h1>
        <p>Force-directed label positioning for React</p>
      </header>

      <div className="controls">
        <div className="control-group">
          <label>Demo:</label>
          <button
            className={activeDemo === 'product' ? 'active' : ''}
            onClick={() => setActiveDemo('product')}
          >
            Product Annotation
          </button>
          <button
            className={activeDemo === 'multi' ? 'active' : ''}
            onClick={() => setActiveDemo('multi')}
          >
            Multiple Anchors
          </button>
        </div>

        <div className="control-group">
          <label>
            Show Connectors:
            <input
              type="checkbox"
              checked={showConnectors}
              onChange={(e) => setShowConnectors(e.target.checked)}
            />
          </label>
        </div>

        <div className="control-group">
          <label>
            Anchor Strength: {anchorStrength.toFixed(2)}
            <input
              type="range"
              min="0.01"
              max="0.5"
              step="0.01"
              value={anchorStrength}
              onChange={(e) => setAnchorStrength(parseFloat(e.target.value))}
            />
          </label>
        </div>

        <div className="control-group">
          <label>
            Repulsion: {repulsionStrength}
            <input
              type="range"
              min="10"
              max="200"
              step="10"
              value={repulsionStrength}
              onChange={(e) => setRepulsionStrength(parseInt(e.target.value))}
            />
          </label>
        </div>
      </div>

      <div className="canvas-container">
        <ForceLabels
          labels={labels}
          width={600}
          height={600}
          forceConfig={forceConfig}
          renderMode="html"
          showConnectors={showConnectors}
          onLabelClick={(label) => console.log('Clicked:', label)}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            textColor: '#1a1a1a',
            borderColor: '#3b82f6',
            borderWidth: 2,
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 600,
            shadow: true,
          }}
        />
      </div>

      <div className="info">
        <h2>Features</h2>
        <ul>
          <li>🎯 Automatic label distribution around anchor points</li>
          <li>⚡ Force-directed simulation for natural positioning</li>
          <li>🔄 Real-time animation with smooth convergence</li>
          <li>📦 Collision detection and avoidance</li>
          <li>🎨 Customizable styling</li>
          <li>🖼️ Canvas or HTML rendering modes</li>
        </ul>
      </div>
    </div>
  );
}

export default App;
