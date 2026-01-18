import React from 'react';
import { nodeTemplates } from './CustomNodes';

interface NodePaletteProps {
  onDragStart: (event: React.DragEvent, nodeType: string) => void;
}

export const NodePalette: React.FC<NodePaletteProps> = ({ onDragStart }) => {
  return (
    <div className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
      <h3 className="font-semibold text-lg mb-4">Node Palette</h3>
      <p className="text-xs text-gray-500 mb-4">
        Drag nodes onto the canvas to build your flow
      </p>

      <div className="space-y-2">
        {nodeTemplates.map((template) => {
          const Icon = template.icon;
          return (
            <div
              key={template.type}
              draggable
              onDragStart={(event) => onDragStart(event, template.type)}
              className={`
                p-3 rounded-lg border-2 cursor-move
                transition-all hover:shadow-md hover:scale-105
                ${template.color}
              `}
            >
              <div className="flex items-center space-x-2">
                <Icon className="w-5 h-5" />
                <div className="flex-1">
                  <div className="font-semibold text-sm">{template.label}</div>
                  <div className="text-xs text-gray-600">{template.description}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-sm text-blue-900 mb-2">Tips</h4>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• Drag nodes to canvas</li>
          <li>• Click to select</li>
          <li>• Delete with Delete key</li>
          <li>• Connect by dragging handles</li>
        </ul>
      </div>
    </div>
  );
};
