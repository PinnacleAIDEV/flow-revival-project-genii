
import React from 'react';
import { Database, FileText, Globe, Server, Filter, Shuffle, Calculator, Zap, BarChart3, PieChart, LineChart, Table2, Download, Share, Mail, FileOutput } from 'lucide-react';

const nodeCategories = [
  {
    title: 'Data Sources',
    nodes: [
      { type: 'dataSource', label: 'CSV File', icon: FileText, sourceType: 'csv' },
      { type: 'dataSource', label: 'Database', icon: Database, sourceType: 'database' },
      { type: 'dataSource', label: 'API', icon: Globe, sourceType: 'api' },
      { type: 'dataSource', label: 'JSON', icon: Server, sourceType: 'json' },
    ]
  },
  {
    title: 'Transformations',
    nodes: [
      { type: 'transform', label: 'Data Cleaning', icon: Zap, transformType: 'clean' },
      { type: 'transform', label: 'Filter Data', icon: Filter, transformType: 'filter' },
      { type: 'transform', label: 'Aggregate', icon: Calculator, transformType: 'aggregate' },
      { type: 'transform', label: 'Join Tables', icon: Shuffle, transformType: 'join' },
    ]
  },
  {
    title: 'Visualizations',
    nodes: [
      { type: 'visualization', label: 'Bar Chart', icon: BarChart3, chartType: 'bar' },
      { type: 'visualization', label: 'Pie Chart', icon: PieChart, chartType: 'pie' },
      { type: 'visualization', label: 'Line Chart', icon: LineChart, chartType: 'line' },
      { type: 'visualization', label: 'Data Table', icon: Table2, chartType: 'table' },
    ]
  },
  {
    title: 'Outputs',
    nodes: [
      { type: 'output', label: 'Download', icon: Download, outputType: 'download' },
      { type: 'output', label: 'Share Link', icon: Share, outputType: 'share' },
      { type: 'output', label: 'Email Report', icon: Mail, outputType: 'email' },
      { type: 'output', label: 'Export Data', icon: FileOutput, outputType: 'export' },
    ]
  }
];

export const NodePanel = () => {
  const onDragStart = (event: React.DragEvent, nodeType: string, nodeData: any) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify({ nodeType, nodeData }));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Node Library</h2>
        <p className="text-sm text-gray-600">Drag nodes to the canvas</p>
      </div>
      
      <div className="p-4 space-y-6">
        {nodeCategories.map((category) => (
          <div key={category.title}>
            <h3 className="text-sm font-medium text-gray-700 mb-2">{category.title}</h3>
            <div className="space-y-2">
              {category.nodes.map((node) => (
                <div
                  key={node.label}
                  draggable
                  onDragStart={(e) => onDragStart(e, node.type, node)}
                  className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg cursor-move hover:bg-gray-100 transition-colors"
                >
                  <node.icon className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-700">{node.label}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
