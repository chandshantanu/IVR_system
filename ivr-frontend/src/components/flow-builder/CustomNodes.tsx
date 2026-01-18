import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { PhoneIncoming, Menu, Volume2, Users, PhoneForwarded, PhoneOff, GitBranch, Mic } from 'lucide-react';

// Base node component
const BaseNode = ({
  data,
  icon: Icon,
  color,
  hasInput = true,
  hasOutput = true
}: {
  data: any;
  icon: any;
  color: string;
  hasInput?: boolean;
  hasOutput?: boolean;
}) => {
  return (
    <div className={`px-4 py-3 shadow-lg rounded-lg border-2 ${color} bg-white min-w-[180px]`}>
      {hasInput && (
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 !bg-gray-400"
        />
      )}

      <div className="flex items-center space-x-2">
        <Icon className="w-5 h-5" />
        <div className="flex-1">
          <div className="font-semibold text-sm">{data.label}</div>
          {data.subtitle && (
            <div className="text-xs text-gray-500">{data.subtitle}</div>
          )}
        </div>
      </div>

      {data.config && (
        <div className="mt-2 text-xs text-gray-600 border-t pt-2">
          {Object.entries(data.config).slice(0, 2).map(([key, value]: [string, any]) => (
            <div key={key} className="truncate">
              <span className="font-medium">{key}:</span> {String(value)}
            </div>
          ))}
        </div>
      )}

      {hasOutput && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 !bg-gray-400"
        />
      )}
    </div>
  );
};

// Welcome Node
export const WelcomeNode = memo((props: NodeProps) => (
  <BaseNode
    data={props.data}
    icon={PhoneIncoming}
    color="border-green-500"
    hasInput={false}
  />
));
WelcomeNode.displayName = 'WelcomeNode';

// Menu Node (DTMF)
export const MenuNode = memo((props: NodeProps) => {
  const { data } = props;
  return (
    <div className="px-4 py-3 shadow-lg rounded-lg border-2 border-blue-500 bg-white min-w-[180px]">
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-gray-400"
      />

      <div className="flex items-center space-x-2 mb-2">
        <Menu className="w-5 h-5" />
        <div className="flex-1">
          <div className="font-semibold text-sm">{data.label}</div>
          {data.subtitle && (
            <div className="text-xs text-gray-500">{data.subtitle}</div>
          )}
        </div>
      </div>

      {data.options && (
        <div className="mt-2 text-xs text-gray-600 border-t pt-2">
          {Object.entries(data.options).map(([key, value]: [string, any]) => (
            <div key={key} className="flex items-center justify-between mb-1">
              <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">
                {key}
              </span>
              <span className="text-gray-500 text-xs ml-2 truncate">
                {value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Multiple output handles for each menu option */}
      {data.options && Object.keys(data.options).map((key, index) => (
        <Handle
          key={key}
          type="source"
          position={Position.Bottom}
          id={key}
          className="w-3 h-3 !bg-blue-400"
          style={{ left: `${20 + (index * 25)}%` }}
        />
      ))}
    </div>
  );
});
MenuNode.displayName = 'MenuNode';

// Play Message Node
export const PlayNode = memo((props: NodeProps) => (
  <BaseNode
    data={props.data}
    icon={Volume2}
    color="border-purple-500"
  />
));
PlayNode.displayName = 'PlayNode';

// Queue Node
export const QueueNode = memo((props: NodeProps) => (
  <BaseNode
    data={props.data}
    icon={Users}
    color="border-orange-500"
  />
));
QueueNode.displayName = 'QueueNode';

// Transfer Node
export const TransferNode = memo((props: NodeProps) => (
  <BaseNode
    data={props.data}
    icon={PhoneForwarded}
    color="border-indigo-500"
  />
));
TransferNode.displayName = 'TransferNode';

// Decision Node
export const DecisionNode = memo((props: NodeProps) => {
  const { data } = props;
  return (
    <div className="px-4 py-3 shadow-lg rounded-lg border-2 border-yellow-500 bg-white min-w-[180px]">
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-gray-400"
      />

      <div className="flex items-center space-x-2">
        <GitBranch className="w-5 h-5" />
        <div className="flex-1">
          <div className="font-semibold text-sm">{data.label}</div>
          {data.subtitle && (
            <div className="text-xs text-gray-500">{data.subtitle}</div>
          )}
        </div>
      </div>

      {data.config && (
        <div className="mt-2 text-xs text-gray-600 border-t pt-2">
          <div className="font-medium">Condition: {data.config.condition || 'Not set'}</div>
        </div>
      )}

      {/* Two outputs: True and False */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        className="w-3 h-3 !bg-green-400"
        style={{ left: '30%' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        className="w-3 h-3 !bg-red-400"
        style={{ left: '70%' }}
      />
    </div>
  );
});
DecisionNode.displayName = 'DecisionNode';

// Record Node
export const RecordNode = memo((props: NodeProps) => (
  <BaseNode
    data={props.data}
    icon={Mic}
    color="border-pink-500"
  />
));
RecordNode.displayName = 'RecordNode';

// Hangup Node
export const HangupNode = memo((props: NodeProps) => (
  <BaseNode
    data={props.data}
    icon={PhoneOff}
    color="border-red-500"
    hasOutput={false}
  />
));
HangupNode.displayName = 'HangupNode';

// Node types mapping
export const nodeTypes = {
  welcome: WelcomeNode,
  menu: MenuNode,
  play: PlayNode,
  queue: QueueNode,
  transfer: TransferNode,
  decision: DecisionNode,
  record: RecordNode,
  hangup: HangupNode,
};

// Node templates for palette
export const nodeTemplates = [
  {
    type: 'welcome',
    label: 'Welcome',
    icon: PhoneIncoming,
    color: 'bg-green-100 border-green-500',
    description: 'Entry point for the call',
    defaultData: {
      label: 'Welcome',
      subtitle: 'Entry point',
      config: {
        message: 'Welcome to our service',
        language: 'en',
      },
    },
  },
  {
    type: 'menu',
    label: 'Menu',
    icon: Menu,
    color: 'bg-blue-100 border-blue-500',
    description: 'DTMF menu with options',
    defaultData: {
      label: 'Menu',
      subtitle: 'DTMF input',
      options: {
        '1': 'Sales',
        '2': 'Support',
      },
      config: {
        timeout: 10,
        retries: 3,
      },
    },
  },
  {
    type: 'play',
    label: 'Play Message',
    icon: Volume2,
    color: 'bg-purple-100 border-purple-500',
    description: 'Play audio or TTS',
    defaultData: {
      label: 'Play Message',
      subtitle: 'Audio/TTS',
      config: {
        message: 'Please wait...',
        type: 'tts',
      },
    },
  },
  {
    type: 'queue',
    label: 'Queue',
    icon: Users,
    color: 'bg-orange-100 border-orange-500',
    description: 'Hold queue with music',
    defaultData: {
      label: 'Queue',
      subtitle: 'Hold queue',
      config: {
        queueName: 'Support Queue',
        maxWaitTime: 300,
      },
    },
  },
  {
    type: 'transfer',
    label: 'Transfer',
    icon: PhoneForwarded,
    color: 'bg-indigo-100 border-indigo-500',
    description: 'Transfer to agent',
    defaultData: {
      label: 'Transfer',
      subtitle: 'Agent routing',
      config: {
        destination: '+1234567890',
        strategy: 'round-robin',
      },
    },
  },
  {
    type: 'decision',
    label: 'Decision',
    icon: GitBranch,
    color: 'bg-yellow-100 border-yellow-500',
    description: 'Conditional branching',
    defaultData: {
      label: 'Decision',
      subtitle: 'Conditional',
      config: {
        condition: 'business_hours',
        operator: 'equals',
        value: 'true',
      },
    },
  },
  {
    type: 'record',
    label: 'Record',
    icon: Mic,
    color: 'bg-pink-100 border-pink-500',
    description: 'Record caller input',
    defaultData: {
      label: 'Record',
      subtitle: 'Voicemail',
      config: {
        maxDuration: 60,
        beep: true,
      },
    },
  },
  {
    type: 'hangup',
    label: 'Hangup',
    icon: PhoneOff,
    color: 'bg-red-100 border-red-500',
    description: 'End the call',
    defaultData: {
      label: 'Hangup',
      subtitle: 'End call',
      config: {
        reason: 'completed',
      },
    },
  },
];
