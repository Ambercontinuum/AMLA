import React from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { VisualizationData } from '../types';

interface VisualizationProps {
  data: VisualizationData;
}

const Visualization: React.FC<VisualizationProps> = ({ data }) => {
  const isLine = data.type === 'line';
  const ChartComponent = isLine ? LineChart : BarChart;

  return (
    <div className="my-6 p-4 bg-gray-900 border border-gray-700 rounded-lg shadow-lg overflow-hidden">
      {data.title && (
        <h3 className="text-gray-300 font-medium mb-4 text-sm uppercase tracking-wider">{data.title}</h3>
      )}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ChartComponent data={data.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey={data.xKey} 
              stroke="#9ca3af" 
              fontSize={12}
              tickLine={false}
            />
            <YAxis 
              stroke="#9ca3af" 
              fontSize={12}
              tickLine={false}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }}
              itemStyle={{ color: '#60a5fa' }}
            />
            <Legend wrapperStyle={{ paddingTop: '10px' }}/>
            {isLine ? (
              <Line 
                type="monotone" 
                dataKey={data.yKey} 
                stroke="#60a5fa" 
                strokeWidth={2} 
                dot={{ r: 4, fill: '#60a5fa' }} 
              />
            ) : (
              <Bar 
                dataKey={data.yKey} 
                fill="#3b82f6" 
                radius={[4, 4, 0, 0]}
              />
            )}
          </ChartComponent>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Visualization;