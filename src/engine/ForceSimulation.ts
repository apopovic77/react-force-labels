import { Vector2 } from 'arkturian-typescript-utils';
import type { Label, PositionedLabel, ForceConfig } from '../types';

/**
 * Force-directed simulation engine for label positioning
 *
 * Applies multiple forces:
 * 1. Anchor attraction - pulls labels towards their anchor point
 * 2. Label repulsion - pushes overlapping labels apart
 * 3. Bounds constraints - keeps labels within min/max distance
 * 4. Collision avoidance - prevents label overlap
 */
export class ForceSimulation {
  private labels: PositionedLabel[] = [];
  private config: Required<ForceConfig>;

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

    this.labels = labels.map((label) => {
      // Initial position: place label radially outward from center along anchor direction
      const dx = label.anchor.x - centerX;
      const dy = label.anchor.y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // If anchor is at center, use a random angle
      const angle = distance > 1 ? Math.atan2(dy, dx) : Math.random() * Math.PI * 2;
      const radius = this.config.minDistance + 20;

      // Place label in the direction of its anchor, at minDistance
      const position = new Vector2(
        centerX + Math.cos(angle) * radius,
        centerY + Math.sin(angle) * radius
      );

      return {
        ...label,
        position,
        velocity: new Vector2(0, 0),
        force: new Vector2(0, 0),
        width: label.width ?? 100,
        height: label.height ?? 30,
      };
    });
  }

  /**
   * Run one simulation step
   * Returns true if simulation has converged
   */
  step(): boolean {
    if (this.labels.length === 0) return true;

    let maxForce = 0;

    // Run multiple iterations per frame for stability
    for (let iter = 0; iter < this.config.iterations; iter++) {
      // Reset forces
      for (const label of this.labels) {
        label.force.x = 0;
        label.force.y = 0;
      }

      // Apply forces
      this.applyAnchorForces();
      this.applyRepulsionForces();
      this.applyAnchorRepulsion(); // NEW: Anchors repel labels like fixed stars
      if (this.config.enableCollision) {
        this.applyCollisionForces();
      }

      // Update positions
      for (const label of this.labels) {
        // Apply force to velocity
        label.velocity.x += label.force.x;
        label.velocity.y += label.force.y;

        // Apply friction
        label.velocity.x *= this.config.friction;
        label.velocity.y *= this.config.friction;

        // Clamp velocity
        const speed = Math.sqrt(label.velocity.x ** 2 + label.velocity.y ** 2);
        if (speed > this.config.maxVelocity) {
          label.velocity.x = (label.velocity.x / speed) * this.config.maxVelocity;
          label.velocity.y = (label.velocity.y / speed) * this.config.maxVelocity;
        }

        // Update position
        label.position.x += label.velocity.x;
        label.position.y += label.velocity.y;

        // Track max force for convergence check
        const forceMag = Math.sqrt(label.force.x ** 2 + label.force.y ** 2);
        maxForce = Math.max(maxForce, forceMag);
      }

      // Apply constraints
      this.applyBoundsConstraints();
    }

    // Check convergence
    return maxForce < this.config.threshold;
  }

  /**
   * Attract labels towards their anchor points
   */
  private applyAnchorForces(): void {
    for (const label of this.labels) {
      const dx = label.anchor.x - label.position.x;
      const dy = label.anchor.y - label.position.y;
      const distance = Math.sqrt(dx ** 2 + dy ** 2);

      if (distance > 0) {
        const strength = this.config.anchorStrength * (label.priority ?? 1);
        label.force.x += (dx / distance) * distance * strength;
        label.force.y += (dy / distance) * distance * strength;
      }
    }
  }

  /**
   * Repel overlapping labels
   */
  private applyRepulsionForces(): void {
    for (let i = 0; i < this.labels.length; i++) {
      for (let j = i + 1; j < this.labels.length; j++) {
        const a = this.labels[i];
        const b = this.labels[j];

        const dx = b.position.x - a.position.x;
        const dy = b.position.y - a.position.y;
        const distance = Math.sqrt(dx ** 2 + dy ** 2);

        if (distance < this.config.repulsionRadius && distance > 0) {
          const strength = this.config.repulsionStrength / (distance ** 2);
          const fx = (dx / distance) * strength;
          const fy = (dy / distance) * strength;

          a.force.x -= fx;
          a.force.y -= fy;
          b.force.x += fx;
          b.force.y += fy;
        }
      }
    }
  }

  /**
   * Repel labels from ALL anchor points (like fixed stars)
   * This prevents labels from overlapping anchor points
   */
  private applyAnchorRepulsion(): void {
    const anchorRepulsionRadius = this.config.repulsionRadius * 0.5; // Smaller radius for anchors
    const anchorRepulsionStrength = this.config.repulsionStrength * 2; // Stronger repulsion

    for (const label of this.labels) {
      // Check against ALL anchors (including other labels' anchors)
      for (const otherLabel of this.labels) {
        // Skip own anchor (we want to be attracted to it)
        if (label.id === otherLabel.id) continue;

        const dx = label.position.x - otherLabel.anchor.x;
        const dy = label.position.y - otherLabel.anchor.y;
        const distance = Math.sqrt(dx ** 2 + dy ** 2);

        // Repel if too close to another label's anchor
        if (distance < anchorRepulsionRadius && distance > 0) {
          const strength = anchorRepulsionStrength / (distance ** 2);
          const fx = (dx / distance) * strength;
          const fy = (dy / distance) * strength;

          label.force.x += fx;
          label.force.y += fy;
        }
      }
    }
  }

  /**
   * Prevent label box overlap
   */
  private applyCollisionForces(): void {
    const padding = this.config.collisionPadding;

    for (let i = 0; i < this.labels.length; i++) {
      for (let j = i + 1; j < this.labels.length; j++) {
        const a = this.labels[i];
        const b = this.labels[j];

        // Calculate bounding box overlap
        const dx = b.position.x - a.position.x;
        const dy = b.position.y - a.position.y;

        const minDistX = ((a.width ?? 100) + (b.width ?? 100)) / 2 + padding;
        const minDistY = ((a.height ?? 30) + (b.height ?? 30)) / 2 + padding;

        const overlapX = minDistX - Math.abs(dx);
        const overlapY = minDistY - Math.abs(dy);

        if (overlapX > 0 && overlapY > 0) {
          // Boxes overlap - push apart on smallest overlap axis
          const strength = 0.5;
          if (overlapX < overlapY) {
            // Separate horizontally
            const fx = (dx > 0 ? overlapX : -overlapX) * strength;
            a.force.x -= fx;
            b.force.x += fx;
          } else {
            // Separate vertically
            const fy = (dy > 0 ? overlapY : -overlapY) * strength;
            a.force.y -= fy;
            b.force.y += fy;
          }
        }
      }
    }
  }

  /**
   * Keep labels within min/max distance from anchor
   */
  private applyBoundsConstraints(): void {
    for (const label of this.labels) {
      const dx = label.position.x - label.anchor.x;
      const dy = label.position.y - label.anchor.y;
      const distance = Math.sqrt(dx ** 2 + dy ** 2);

      if (distance < this.config.minDistance && distance > 0) {
        // Too close - push away
        const scale = this.config.minDistance / distance;
        label.position.x = label.anchor.x + dx * scale;
        label.position.y = label.anchor.y + dy * scale;
      } else if (distance > this.config.maxDistance && distance > 0) {
        // Too far - pull back
        const scale = this.config.maxDistance / distance;
        label.position.x = label.anchor.x + dx * scale;
        label.position.y = label.anchor.y + dy * scale;
      }
    }
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
  }
}
