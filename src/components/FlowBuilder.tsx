
import React, { useCallback, useState } from 'react';
import {
  ReactFlow,
  addEdge,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { DataSourceNode } from './nodes/DataSourceNode';
import { TransformNode } from './nodes/TransformNode';
import { VisualizationNode } from './nodes/VisualizationNode';
import { OutputNode } from './nodes/OutputNode';

const nodeTypes = {
  dataSource: DataSourceNode,
  transform: TransformNode,
  visualization: VisualizationNode,
  output: OutputNode,
};

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'dataSource',
    position: { x: 100, y: 100 },
    data: { label: 'CSV Data Source', sourceType: 'csv' },
  },
  {
    id: '2',
    type: 'transform',
    position: { x: 400, y: 150 },
    data: { label: 'Data Cleaning', transformType: 'clean' },
  },
  {
    id: '3',
    type: 'visualization',
    position: { x: 700, y: 100 },
    data: { label: 'Bar Chart', chartType: 'bar' },
  },
];

const initialEdges: Edge[] = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    animated: true,
    style: { stroke: '#8b5cf6' },
  },
  {
    id: 'e2-3',
    source: '2',
    target: '3',
    animated: true,
    style: { stroke: '#8b5cf6' },
  },
];

export const FlowBuilder = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isRunning, setIsRunning] = useState(false);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({
      ...params,
      animated: true,
      style: { stroke: '#8b5cf6' },
    }, eds)),
    [setEdges],
  );

  const runFlow = () => {
    setIsRunning(true);
    setTimeout(() => setIsRunning(false), 3000);
  };

  return (
    <div className="w-full h-full relative">
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <button
          onClick={runFlow}
          disabled={isRunning}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg disabled:opacity-50"
        >
          {isRunning ? 'Running...' : 'Run Flow'}
        </button>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        className="bg-gradient-to-br from-slate-50 to-slate-100"
      >
        <Controls className="bg-white shadow-lg" />
        <MiniMap 
          className="bg-white shadow-lg" 
          nodeColor="#8b5cf6"
          maskColor="rgba(0, 0, 0, 0.1)"
        />
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={20} 
          size={1} 
          color="#e2e8f0"
        />
      </ReactFlow>
    </div>
  );
};
