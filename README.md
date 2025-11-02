# React Force Labels

Force-directed label positioning system for React - automatically distributes labels around anchor points using physics simulation.

Perfect for **product annotations**, **data visualizations**, **interactive diagrams**, and any scenario where you need intelligent label placement.

## Features

- 🎯 **Automatic Distribution** - Labels position themselves intelligently around anchor points
- ⚡ **Force Simulation** - Uses physics-based algorithms for natural, organic positioning
- 🔄 **Smooth Animation** - Real-time convergence with customizable parameters
- 📦 **Collision Detection** - Prevents label overlap with smart avoidance
- 🎨 **Fully Customizable** - Style labels, connectors, and behavior
- 🖼️ **Dual Rendering** - Choose between Canvas or HTML/SVG rendering
- 🎮 **Interactive** - Click handlers and priority-based positioning
- 📱 **Responsive** - Works with dynamic layouts and resizing

## Installation

```bash
npm install @arkturian/react-force-labels
```

## Quick Start

```tsx
import { ForceLabels } from '@arkturian/react-force-labels';
import { Vector2 } from 'arkturian-typescript-utils';

function ProductAnnotation() {
  const labels = [
    {
      id: 'price',
      anchor: new Vector2(300, 150),
      content: '€ 59,99',
      priority: 2,
    },
    {
      id: 'name',
      anchor: new Vector2(150, 200),
      content: "O'NEAL Flow Jersey",
      priority: 3,
    },
    {
      id: 'feature',
      anchor: new Vector2(300, 300),
      content: '⚡ Quick Dry',
      priority: 1,
    },
  ];

  return (
    <ForceLabels
      labels={labels}
      width={600}
      height={400}
      showConnectors={true}
      onLabelClick={(label) => console.log('Clicked:', label)}
    />
  );
}
```

## API

### `<ForceLabels>`

Main component for force-directed label positioning.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `labels` | `Label[]` | required | Array of labels with anchor points |
| `width` | `number` | required | Canvas width |
| `height` | `number` | required | Canvas height |
| `forceConfig` | `ForceConfig` | `{}` | Physics simulation parameters |
| `renderMode` | `'canvas' \| 'html'` | `'html'` | Rendering method |
| `style` | `LabelStyle` | `{}` | Label visual styling |
| `showConnectors` | `boolean` | `true` | Show lines from labels to anchors |
| `onLabelClick` | `(label: Label) => void` | - | Click handler for labels |
| `className` | `string` | `''` | CSS class for container |

### `Label` Type

```typescript
type Label = {
  id: string;                      // Unique identifier
  anchor: Vector2;                 // World position (x, y)
  content: string | React.ReactNode;  // Label content
  priority?: number;               // Higher = closer to anchor (default: 1)
  width?: number;                  // Estimated width (auto-calculated if omitted)
  height?: number;                 // Estimated height (auto-calculated if omitted)
};
```

### `ForceConfig` Type

```typescript
type ForceConfig = {
  anchorStrength?: number;      // Attraction to anchor (default: 0.1)
  repulsionStrength?: number;   // Label-to-label repulsion (default: 50)
  repulsionRadius?: number;     // Repulsion active distance (default: 100)
  enableCollision?: boolean;    // Prevent box overlap (default: true)
  collisionPadding?: number;    // Padding around labels (default: 10)
  minDistance?: number;         // Min distance from anchor (default: 40)
  maxDistance?: number;         // Max distance from anchor (default: 200)
  friction?: number;            // Velocity damping (default: 0.9)
  iterations?: number;          // Simulation steps per frame (default: 3)
  maxVelocity?: number;         // Max movement per frame (default: 5)
  threshold?: number;           // Convergence threshold (default: 0.1)
};
```

### `LabelStyle` Type

```typescript
type LabelStyle = {
  backgroundColor?: string;     // Background color
  textColor?: string;           // Text color
  borderColor?: string;         // Border color
  borderWidth?: number;         // Border width (px)
  borderRadius?: number;        // Corner radius (px)
  padding?: number;             // Inner padding (px)
  fontSize?: number;            // Font size (px)
  fontFamily?: string;          // Font family
  fontWeight?: string | number; // Font weight
  opacity?: number;             // Label opacity (0-1)
  shadow?: boolean;             // Drop shadow effect
};
```

## Advanced Usage

### Custom Styling

```tsx
<ForceLabels
  labels={labels}
  width={800}
  height={600}
  style={{
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    textColor: '#ffffff',
    borderColor: '#3b82f6',
    borderWidth: 2,
    borderRadius: 8,
    fontSize: 16,
    fontWeight: 600,
    shadow: true,
  }}
/>
```

### Fine-tuning Physics

```tsx
<ForceLabels
  labels={labels}
  width={800}
  height={600}
  forceConfig={{
    anchorStrength: 0.2,        // Stronger attraction
    repulsionStrength: 100,     // Stronger repulsion
    minDistance: 60,            // Keep labels further away
    maxDistance: 150,           // But not too far
    friction: 0.85,             // More damping
  }}
/>
```

### Priority-based Positioning

Labels with higher priority stay closer to their anchor:

```tsx
const labels = [
  { id: '1', anchor: center, content: 'Important', priority: 5 },
  { id: '2', anchor: center, content: 'Medium', priority: 3 },
  { id: '3', anchor: center, content: 'Optional', priority: 1 },
];
```

## Use Cases

### Product Annotations (E-commerce)
```tsx
// Like the O'NEAL example - annotate product features
<ForceLabels labels={productFeatures} />
```

### Data Visualization
```tsx
// Scatter plot labels that don't overlap
<ForceLabels labels={dataPoints} />
```

### Interactive Diagrams
```tsx
// Network graphs, mind maps, etc.
<ForceLabels labels={nodes} onLabelClick={handleNodeClick} />
```

## Development

```bash
# Install dependencies
npm install

# Run demo app
npm run dev

# Build library
npm run build:lib

# Run tests
npm test

# Type check
npm run typecheck
```

## How It Works

The library uses a **force-directed simulation** inspired by graph layout algorithms:

1. **Anchor Force** - Pulls labels towards their anchor points
2. **Repulsion Force** - Pushes overlapping labels apart
3. **Collision Detection** - Prevents label bounding boxes from overlapping
4. **Bounds Constraints** - Keeps labels within min/max distance from anchors
5. **Velocity Damping** - Smoothly converges to stable positions

The simulation runs in real-time using `requestAnimationFrame`, typically converging in 1-2 seconds.

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR.

## Credits

Built with:
- React
- TypeScript
- Vite
- arkturian-typescript-utils

Inspired by D3-force and physics-based layout algorithms.
