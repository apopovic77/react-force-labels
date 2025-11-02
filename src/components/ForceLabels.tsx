import React, { useEffect, useRef, useState } from 'react';
import { ForceSimulation } from '../engine/ForceSimulation';
import type { ForceLabelsProps, PositionedLabel, LabelStyle } from '../types';

const defaultStyle: Required<LabelStyle> = {
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  textColor: '#000000',
  borderColor: '#cccccc',
  borderWidth: 1,
  borderRadius: 4,
  padding: 8,
  fontSize: 14,
  fontFamily: 'system-ui, -apple-system, sans-serif',
  fontWeight: 400,
  opacity: 1,
  shadow: true,
};

export const ForceLabels: React.FC<ForceLabelsProps> = ({
  labels,
  width,
  height,
  forceConfig = {},
  renderMode = 'html',
  style = {},
  showConnectors = true,
  onLabelClick,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simulationRef = useRef<ForceSimulation | null>(null);
  const rafRef = useRef<number | null>(null);
  const [positionedLabels, setPositionedLabels] = useState<PositionedLabel[]>([]);
  const mergedStyle = { ...defaultStyle, ...style };

  // Initialize simulation
  useEffect(() => {
    if (!simulationRef.current) {
      simulationRef.current = new ForceSimulation(forceConfig);
    } else {
      simulationRef.current.setConfig(forceConfig);
    }
  }, [forceConfig]);

  // Update labels
  useEffect(() => {
    if (!simulationRef.current) return;

    // Estimate label dimensions if not provided
    const labelsWithDimensions = labels.map(label => ({
      ...label,
      width: label.width ?? estimateLabelWidth(label.content, mergedStyle),
      height: label.height ?? mergedStyle.fontSize * 1.5 + mergedStyle.padding * 2,
    }));

    simulationRef.current.setLabels(labelsWithDimensions);
    setPositionedLabels(simulationRef.current.getLabels());

    // Start animation
    let converged = false;
    const animate = () => {
      if (!simulationRef.current || converged) return;

      converged = simulationRef.current.step();
      setPositionedLabels([...simulationRef.current.getLabels()]);

      if (!converged) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [labels, mergedStyle]);

  // Canvas rendering
  useEffect(() => {
    if (renderMode !== 'canvas' || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw connectors
    if (showConnectors) {
      ctx.strokeStyle = mergedStyle.borderColor;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);

      for (const label of positionedLabels) {
        ctx.beginPath();
        ctx.moveTo(label.anchor.x, label.anchor.y);
        ctx.lineTo(label.position.x, label.position.y);
        ctx.stroke();
      }

      ctx.setLineDash([]);
    }

    // Draw labels
    for (const label of positionedLabels) {
      const labelWidth = label.width ?? 100;
      const labelHeight = label.height ?? 30;
      const x = label.position.x - labelWidth / 2;
      const y = label.position.y - labelHeight / 2;

      // Background
      ctx.fillStyle = mergedStyle.backgroundColor;
      ctx.strokeStyle = mergedStyle.borderColor;
      ctx.lineWidth = mergedStyle.borderWidth;

      if (mergedStyle.shadow) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2;
      }

      roundRect(ctx, x, y, labelWidth, labelHeight, mergedStyle.borderRadius);
      ctx.fill();
      ctx.stroke();

      ctx.shadowColor = 'transparent';

      // Text
      ctx.fillStyle = mergedStyle.textColor;
      ctx.font = `${mergedStyle.fontWeight} ${mergedStyle.fontSize}px ${mergedStyle.fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        String(label.content),
        label.position.x,
        label.position.y
      );

      // Draw anchor point
      ctx.fillStyle = mergedStyle.borderColor;
      ctx.beginPath();
      ctx.arc(label.anchor.x, label.anchor.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [positionedLabels, width, height, renderMode, showConnectors, mergedStyle]);

  if (renderMode === 'canvas') {
    return (
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className={className}
        style={{ display: 'block' }}
      />
    );
  }

  // HTML rendering
  return (
    <div
      className={`force-labels ${className}`}
      style={{
        position: 'relative',
        width,
        height,
        overflow: 'hidden',
      }}
    >
      {/* Connectors */}
      {showConnectors && (
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        >
          {positionedLabels.map(label => (
            <line
              key={label.id}
              x1={label.anchor.x}
              y1={label.anchor.y}
              x2={label.position.x}
              y2={label.position.y}
              stroke={mergedStyle.borderColor}
              strokeWidth={1}
              strokeDasharray="2,2"
              opacity={0.5}
            />
          ))}
          {/* Anchor points */}
          {positionedLabels.map(label => (
            <circle
              key={`anchor-${label.id}`}
              cx={label.anchor.x}
              cy={label.anchor.y}
              r={3}
              fill={mergedStyle.borderColor}
            />
          ))}
        </svg>
      )}

      {/* Labels */}
      {positionedLabels.map(label => (
        <div
          key={label.id}
          onClick={() => onLabelClick?.(label)}
          style={{
            position: 'absolute',
            left: label.position.x - (label.width ?? 100) / 2,
            top: label.position.y - (label.height ?? 30) / 2,
            width: label.width ?? 100,
            height: label.height ?? 30,
            backgroundColor: mergedStyle.backgroundColor,
            color: mergedStyle.textColor,
            border: `${mergedStyle.borderWidth}px solid ${mergedStyle.borderColor}`,
            borderRadius: mergedStyle.borderRadius,
            padding: mergedStyle.padding,
            fontSize: mergedStyle.fontSize,
            fontFamily: mergedStyle.fontFamily,
            fontWeight: mergedStyle.fontWeight,
            opacity: mergedStyle.opacity,
            boxShadow: mergedStyle.shadow ? '0 2px 4px rgba(0,0,0,0.2)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: onLabelClick ? 'pointer' : 'default',
            userSelect: 'none',
            whiteSpace: 'nowrap',
            transition: 'transform 0.05s ease-out',
          }}
        >
          {label.content}
        </div>
      ))}
    </div>
  );
};

/**
 * Estimate label width based on content and style
 */
function estimateLabelWidth(content: string | React.ReactNode, style: Required<LabelStyle>): number {
  if (typeof content !== 'string') return 120; // Default for React nodes

  // Rough estimate: 0.6 * fontSize per character + padding
  const charWidth = style.fontSize * 0.6;
  return content.length * charWidth + style.padding * 2 + 20;
}

/**
 * Draw rounded rectangle (for canvas rendering)
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
