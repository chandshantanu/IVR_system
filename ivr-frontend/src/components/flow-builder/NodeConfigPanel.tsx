import React, { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface NodeConfigPanelProps {
  selectedNode: Node | null;
  onClose: () => void;
  onUpdate: (nodeId: string, data: any) => void;
}

export const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({
  selectedNode,
  onClose,
  onUpdate,
}) => {
  const [label, setLabel] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [config, setConfig] = useState<Record<string, any>>({});

  useEffect(() => {
    if (selectedNode) {
      setLabel(selectedNode.data.label || '');
      setSubtitle(selectedNode.data.subtitle || '');
      setConfig(selectedNode.data.config || {});
    }
  }, [selectedNode]);

  if (!selectedNode) {
    return null;
  }

  const handleSave = () => {
    onUpdate(selectedNode.id, {
      ...selectedNode.data,
      label,
      subtitle,
      config,
    });
  };

  const handleConfigChange = (key: string, value: any) => {
    setConfig((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const renderConfigFields = () => {
    switch (selectedNode.type) {
      case 'welcome':
        return (
          <>
            <div>
              <Label htmlFor="message">Welcome Message</Label>
              <Input
                id="message"
                value={config.message || ''}
                onChange={(e) => handleConfigChange('message', e.target.value)}
                placeholder="Enter welcome message"
              />
            </div>
            <div>
              <Label htmlFor="language">Language</Label>
              <select
                id="language"
                value={config.language || 'en'}
                onChange={(e) => handleConfigChange('language', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="hi">Hindi</option>
              </select>
            </div>
          </>
        );

      case 'menu':
        return (
          <>
            <div>
              <Label htmlFor="timeout">Timeout (seconds)</Label>
              <Input
                id="timeout"
                type="number"
                value={config.timeout || 10}
                onChange={(e) => handleConfigChange('timeout', parseInt(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="retries">Max Retries</Label>
              <Input
                id="retries"
                type="number"
                value={config.retries || 3}
                onChange={(e) => handleConfigChange('retries', parseInt(e.target.value))}
              />
            </div>
            <div>
              <Label>Menu Options</Label>
              {selectedNode.data.options && Object.entries(selectedNode.data.options).map(([key, value]: [string, any]) => (
                <div key={key} className="flex items-center space-x-2 mt-2">
                  <Input
                    value={key}
                    disabled
                    className="w-16"
                  />
                  <Input
                    value={value}
                    onChange={(e) => {
                      const newOptions = { ...selectedNode.data.options };
                      newOptions[key] = e.target.value;
                      onUpdate(selectedNode.id, {
                        ...selectedNode.data,
                        options: newOptions,
                      });
                    }}
                    placeholder="Option label"
                  />
                </div>
              ))}
            </div>
          </>
        );

      case 'play':
        return (
          <>
            <div>
              <Label htmlFor="message">Message</Label>
              <Input
                id="message"
                value={config.message || ''}
                onChange={(e) => handleConfigChange('message', e.target.value)}
                placeholder="Enter message"
              />
            </div>
            <div>
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                value={config.type || 'tts'}
                onChange={(e) => handleConfigChange('type', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="tts">Text-to-Speech</option>
                <option value="audio">Audio File</option>
              </select>
            </div>
            {config.type === 'audio' && (
              <div>
                <Label htmlFor="audioUrl">Audio URL</Label>
                <Input
                  id="audioUrl"
                  value={config.audioUrl || ''}
                  onChange={(e) => handleConfigChange('audioUrl', e.target.value)}
                  placeholder="https://example.com/audio.mp3"
                />
              </div>
            )}
          </>
        );

      case 'queue':
        return (
          <>
            <div>
              <Label htmlFor="queueName">Queue Name</Label>
              <Input
                id="queueName"
                value={config.queueName || ''}
                onChange={(e) => handleConfigChange('queueName', e.target.value)}
                placeholder="Support Queue"
              />
            </div>
            <div>
              <Label htmlFor="maxWaitTime">Max Wait Time (seconds)</Label>
              <Input
                id="maxWaitTime"
                type="number"
                value={config.maxWaitTime || 300}
                onChange={(e) => handleConfigChange('maxWaitTime', parseInt(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="musicUrl">Hold Music URL (optional)</Label>
              <Input
                id="musicUrl"
                value={config.musicUrl || ''}
                onChange={(e) => handleConfigChange('musicUrl', e.target.value)}
                placeholder="https://example.com/music.mp3"
              />
            </div>
          </>
        );

      case 'transfer':
        return (
          <>
            <div>
              <Label htmlFor="destination">Destination Number</Label>
              <Input
                id="destination"
                value={config.destination || ''}
                onChange={(e) => handleConfigChange('destination', e.target.value)}
                placeholder="+1234567890"
              />
            </div>
            <div>
              <Label htmlFor="strategy">Routing Strategy</Label>
              <select
                id="strategy"
                value={config.strategy || 'round-robin'}
                onChange={(e) => handleConfigChange('strategy', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="round-robin">Round Robin</option>
                <option value="longest-idle">Longest Idle</option>
                <option value="random">Random</option>
              </select>
            </div>
          </>
        );

      case 'decision':
        return (
          <>
            <div>
              <Label htmlFor="condition">Condition Variable</Label>
              <Input
                id="condition"
                value={config.condition || ''}
                onChange={(e) => handleConfigChange('condition', e.target.value)}
                placeholder="business_hours"
              />
            </div>
            <div>
              <Label htmlFor="operator">Operator</Label>
              <select
                id="operator"
                value={config.operator || 'equals'}
                onChange={(e) => handleConfigChange('operator', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="equals">Equals</option>
                <option value="not_equals">Not Equals</option>
                <option value="greater_than">Greater Than</option>
                <option value="less_than">Less Than</option>
                <option value="contains">Contains</option>
              </select>
            </div>
            <div>
              <Label htmlFor="value">Value</Label>
              <Input
                id="value"
                value={config.value || ''}
                onChange={(e) => handleConfigChange('value', e.target.value)}
                placeholder="true"
              />
            </div>
          </>
        );

      case 'record':
        return (
          <>
            <div>
              <Label htmlFor="maxDuration">Max Duration (seconds)</Label>
              <Input
                id="maxDuration"
                type="number"
                value={config.maxDuration || 60}
                onChange={(e) => handleConfigChange('maxDuration', parseInt(e.target.value))}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="beep"
                checked={config.beep || false}
                onChange={(e) => handleConfigChange('beep', e.target.checked)}
                className="w-4 h-4"
              />
              <Label htmlFor="beep">Play beep before recording</Label>
            </div>
          </>
        );

      case 'hangup':
        return (
          <div>
            <Label htmlFor="reason">Hangup Reason</Label>
            <select
              id="reason"
              value={config.reason || 'completed'}
              onChange={(e) => handleConfigChange('reason', e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="completed">Completed</option>
              <option value="user_requested">User Requested</option>
              <option value="timeout">Timeout</option>
              <option value="error">Error</option>
            </select>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">Node Configuration</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="label">Node Label</Label>
          <Input
            id="label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Enter label"
          />
        </div>

        <div>
          <Label htmlFor="subtitle">Subtitle (optional)</Label>
          <Input
            id="subtitle"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="Enter subtitle"
          />
        </div>

        <div className="border-t pt-4">
          <h4 className="font-semibold text-sm mb-3">Node Settings</h4>
          {renderConfigFields()}
        </div>

        <div className="flex space-x-2 pt-4">
          <Button onClick={handleSave} className="flex-1">
            Save Changes
          </Button>
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
        </div>
      </div>

      <div className="mt-6 p-3 bg-gray-50 rounded-lg border">
        <div className="text-xs text-gray-600">
          <div className="font-medium mb-1">Node ID:</div>
          <div className="font-mono text-xs break-all">{selectedNode.id}</div>
        </div>
      </div>
    </div>
  );
};
