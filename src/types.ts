import { Vector2 } from 'arkturian-typescript-utils';

/**
 * A label with an anchor point and content
 */
export type Label = {
  id: string;
  anchor: Vector2;  // World position to attach to
  content: string | React.ReactNode;
  priority?: number;  // Higher priority = closer to anchor
  width?: number;  // Estimated label width
  height?: number;  // Estimated label height
};

/**
 * Positioned label with calculated position
 */
export type PositionedLabel = Label & {
  position: Vector2;  // Calculated label position
  velocity: Vector2;  // For animation
  force: Vector2;  // Current force vector
};

/**
 * Configuration for force simulation
 */
export type ForceConfig = {
  // Attraction to anchor point
  anchorStrength?: number;  // Default: 0.1

  // Repulsion between labels
  repulsionStrength?: number;  // Default: 50
  repulsionRadius?: number;  // Default: 100

  // Collision detection
  enableCollision?: boolean;  // Default: true
  collisionPadding?: number;  // Default: 10

  // Bounds constraints
  minDistance?: number;  // Min distance from anchor (default: 40)
  maxDistance?: number;  // Max distance from anchor (default: 200)

  // Simulation
  friction?: number;  // Velocity damping (default: 0.9)
  iterations?: number;  // Iterations per frame (default: 3)
  maxVelocity?: number;  // Max velocity per frame (default: 5)

  // Convergence
  threshold?: number;  // Stop when forces < threshold (default: 0.1)
};

/**
 * Render mode for labels
 */
export type RenderMode = 'canvas' | 'html';

/**
 * Style configuration for labels
 */
export type LabelStyle = {
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  padding?: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string | number;
  opacity?: number;
  shadow?: boolean;
};

/**
 * Props for ForceLabels component
 */
export type ForceLabelsProps = {
  labels: Label[];
  width: number;
  height: number;
  forceConfig?: ForceConfig;
  renderMode?: RenderMode;
  style?: LabelStyle;
  showConnectors?: boolean;  // Draw lines from label to anchor
  onLabelClick?: (label: Label) => void;
  className?: string;
};
