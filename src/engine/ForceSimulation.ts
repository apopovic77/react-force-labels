import { Vector2 } from 'arkturian-typescript-utils';
import type { Label, PositionedLabel, ForceConfig } from '../types';
import {
  forceSimulation,
  forceX,
  forceY,
  forceManyBody,
  forceCollide,
  type SimulationNodeDatum,
} from 'd3-force';

interface D3Node extends SimulationNodeDatum {
  id: string;
  label?: PositionedLabel;
  isAnchor?: boolean;
  anchorX: number;
  anchorY: number;
  width: number;
  height: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

/**
 * Force-directed simulation engine using D3-force
 *
 * Uses proper physics simulation with:
 * - Anchor attraction (pulls labels to their anchor points)
 * - Label-to-label repulsion (charge force)
 * - Label-to-anchor repulsion (anchors are fixed nodes with charge)
 * - Collision detection (prevents overlap)
 */
export class ForceSimulation {
  private labels: PositionedLabel[] = [];
  private config: Required<ForceConfig>;
  private simulation: ReturnType<typeof forceSimulation<D3Node>> | null = null;
  private nodes: D3Node[] = [];

  constructor(config: ForceConfig = {}) {
    this.config = {
      anchorStrength: config.anchorStrength ?? 0.1,
      repulsionStrength: config.repulsionStrength ?? 50,
      repulsionRadius: config.repulsionRadius ?? 100,
      enableCollision: config.enableCollision ?? true,
      collisionPadding: config.collisionPadding ?? 10,
      minDistance: config.minDistance ?? 40,
      maxDistance: config.maxDistance ?? 200,
      friction: config.friction ?? 0.9,
      iterations: config.iterations ?? 3,
      maxVelocity: config.maxVelocity ?? 5,
      threshold: config.threshold ?? 0.1,
    };
  }

  /**
   * Create distance constraint force function
   */
  private createDistanceConstraintForce() {
    return () => {
      for (const node of this.nodes) {
        if (node.isAnchor || !node.label) continue;

        const dx = (node.x ?? 0) - node.anchorX;
        const dy = (node.y ?? 0) - node.anchorY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
          let targetDistance = distance;
          let strength = 0;

          // Push away if too close
          if (distance < this.config.minDistance) {
            targetDistance = this.config.minDistance;
            strength = 0.5; // Strong push
          }
          // Pull back if too far
          else if (distance > this.config.maxDistance) {
            targetDistance = this.config.maxDistance;
            strength = 0.3; // Moderate pull
          }

          if (strength > 0) {
            const angle = Math.atan2(dy, dx);
            const targetX = node.anchorX + Math.cos(angle) * targetDistance;
            const targetY = node.anchorY + Math.sin(angle) * targetDistance;

            node.vx = (node.vx ?? 0) + (targetX - (node.x ?? 0)) * strength;
            node.vy = (node.vy ?? 0) + (targetY - (node.y ?? 0)) * strength;
          }
        }
      }
    };
  }

  /**
   * Initialize simulation with labels
   */
  setLabels(labels: Label[]): void {
    // Calculate center point from all anchors
    let centerX = 0;
    let centerY = 0;
    for (const label of labels) {
      centerX += label.anchor.x;
      centerY += label.anchor.y;
    }
    centerX /= labels.length || 1;
    centerY /= labels.length || 1;

    // Create nodes for labels AND anchors
    this.nodes = [];

    // Add label nodes
    for (const label of labels) {
      // Initial position: radially outward from center along anchor direction
      const dx = label.anchor.x - centerX;
      const dy = label.anchor.y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const angle = distance > 1 ? Math.atan2(dy, dx) : Math.random() * Math.PI * 2;
      const radius = this.config.minDistance + 20;

      const posLabel: PositionedLabel = {
        ...label,
        position: new Vector2(
          centerX + Math.cos(angle) * radius,
          centerY + Math.sin(angle) * radius
        ),
        velocity: new Vector2(0, 0),
        force: new Vector2(0, 0),
        width: label.width ?? 100,
        height: label.height ?? 30,
      };

      this.labels.push(posLabel);

      this.nodes.push({
        id: label.id,
        label: posLabel,
        x: posLabel.position.x,
        y: posLabel.position.y,
        anchorX: label.anchor.x,
        anchorY: label.anchor.y,
        width: posLabel.width ?? 100,
        height: posLabel.height ?? 30,
        isAnchor: false,
      });
    }

    // Add anchor nodes (fixed positions with charge - they repel labels!)
    for (const label of labels) {
      this.nodes.push({
        id: `anchor-${label.id}`,
        x: label.anchor.x,
        y: label.anchor.y,
        fx: label.anchor.x, // Fixed X
        fy: label.anchor.y, // Fixed Y
        anchorX: label.anchor.x,
        anchorY: label.anchor.y,
        width: 20, // Small anchor size
        height: 20,
        isAnchor: true,
      });
    }

    // Custom force to enforce min/max distance from anchor
    const distanceConstraintForce = this.createDistanceConstraintForce();

    // Create D3 force simulation
    this.simulation = forceSimulation<D3Node>(this.nodes)
      .alphaDecay(1 - this.config.friction) // Friction/damping
      .velocityDecay(0.4) // Velocity damping
      .force('charge', forceManyBody<D3Node>()
        .strength((d: D3Node) => {
          // Anchors repel strongly, labels repel normally
          return d.isAnchor
            ? -this.config.repulsionStrength * 2
            : -this.config.repulsionStrength;
        })
        .distanceMax(this.config.repulsionRadius)
      )
      .force('anchorX', forceX<D3Node>()
        .x((d: D3Node) => d.anchorX)
        .strength((d: D3Node) => d.isAnchor ? 0 : this.config.anchorStrength * ((d.label?.priority ?? 1)))
      )
      .force('anchorY', forceY<D3Node>()
        .y((d: D3Node) => d.anchorY)
        .strength((d: D3Node) => d.isAnchor ? 0 : this.config.anchorStrength * ((d.label?.priority ?? 1)))
      )
      .force('collision', forceCollide<D3Node>()
        .radius((d: D3Node) => {
          if (d.isAnchor) return 10; // Small collision for anchors
          return Math.max(d.width, d.height) / 2 + this.config.collisionPadding;
        })
        .strength(1)
      )
      .force('distanceConstraint', distanceConstraintForce)
      .stop(); // Don't auto-run, we control ticks manually
  }

  /**
   * Run one simulation step
   * Returns true if simulation has converged
   */
  step(): boolean {
    if (!this.simulation || this.labels.length === 0) return true;

    // Run multiple iterations per frame for stability
    for (let i = 0; i < this.config.iterations; i++) {
      this.simulation.tick();
    }

    // Update label positions from D3 nodes
    for (const node of this.nodes) {
      if (node.isAnchor || !node.label) continue;

      const label = node.label;

      label.position.x = node.x ?? label.position.x;
      label.position.y = node.y ?? label.position.y;
      label.velocity.x = node.vx ?? 0;
      label.velocity.y = node.vy ?? 0;
    }

    // Check convergence
    const alpha = this.simulation.alpha();
    return alpha < this.config.threshold;
  }

  /**
   * Get current label positions
   */
  getLabels(): PositionedLabel[] {
    return this.labels;
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<ForceConfig>): void {
    this.config = { ...this.config, ...config };

    // Update D3 forces if simulation exists
    if (this.simulation) {
      this.simulation
        .alphaDecay(1 - this.config.friction)
        .force('charge', forceManyBody<D3Node>()
          .strength((d: D3Node) => d.isAnchor ? -this.config.repulsionStrength * 2 : -this.config.repulsionStrength)
          .distanceMax(this.config.repulsionRadius)
        )
        .force('anchorX', forceX<D3Node>()
          .x((d: D3Node) => d.anchorX)
          .strength((d: D3Node) => d.isAnchor ? 0 : this.config.anchorStrength * ((d.label?.priority ?? 1)))
        )
        .force('anchorY', forceY<D3Node>()
          .y((d: D3Node) => d.anchorY)
          .strength((d: D3Node) => d.isAnchor ? 0 : this.config.anchorStrength * ((d.label?.priority ?? 1)))
        )
        .force('collision', forceCollide<D3Node>()
          .radius((d: D3Node) => {
            if (d.isAnchor) return 10;
            return Math.max(d.width, d.height) / 2 + this.config.collisionPadding;
          })
          .strength(1)
        )
        .force('distanceConstraint', this.createDistanceConstraintForce());
    }
  }
}
