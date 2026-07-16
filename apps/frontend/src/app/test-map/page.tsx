"use client";

import { useCallback, useState } from 'react';
import { 
  ReactFlow, 
  useNodesState, 
  useEdgesState, 
  Background, 
  Controls, 
  ReactFlowProvider, 
  useReactFlow,
  Node,
  Edge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// 🎯 1. IMPORTAMOS TU NUEVO NODO
import ViewerPlayerNode from '@/components/viewer-nodes/ViewerPlayerNode';
import ViewerShieldNode from '@/components/viewer-nodes/ViewerShieldNode';
import ViewerGatewayNode from '@/components/viewer-nodes/ViewerGatewayNode';
import ViewerEntryNode from '@/components/viewer-nodes/ViewerEntryNode';
// 🎯 2. LO REGISTRAMOS
const nodeTypes = {
    playerNode: ViewerPlayerNode,
    shieldNode: ViewerShieldNode,
    gatewayNode: ViewerGatewayNode,
    entryNode: ViewerEntryNode,
  };

// --- 🛑 DATOS FALSOS CON LOS NUEVOS ESTADOS ---
// Función falsa para ver los clics en consola
const handleAction = (action: string, id: number) => alert(`Acción: ${action} | Jugador ID: ${id}`);

// --- 🛑 DATOS FALSOS CON LOS NUEVOS COMPONENTES VISUALES ---
// Función falsa para ver los clics en consola

const MOCK_OCCULT = {
  nodes: [
    // 🛡️ ESCUDO BASE
    { 
      id: 'occult-root', 
      type: 'shieldNode', 
      position: { x: 0, y: 0 }, 
      data: { teamSlug: 'occult' } 
    },
    
    // 🟢 JUGADOR: DISPONIBLE
    { 
      id: 'occult-p1', 
      type: 'playerNode', 
      position: { x: 0, y: 180 }, 
      data: { 
        player: { id: 1, name: 'Talisman', position: 'MD', price: 100, spriteUrl: '/sprites/talisman.webp' },
        status: 'available',
        onAction: handleAction
      } 
    },
    
    // 🚪 PUERTAS DE SALIDA
    { 
      id: 'occult-gateway-zeus', 
      type: 'gatewayNode', 
      position: { x: -150, y: 400 }, 
      data: { targetName: 'ZEUS', targetMapId: 'zeus', isGateway: true } 
    },
    { 
      id: 'occult-gateway-umbrella', 
      type: 'gatewayNode', 
      position: { x: 150, y: 400 }, 
      data: { targetName: 'UMBRELLA', targetMapId: 'umbrella', isGateway: true } 
    },
  ],
  edges: [
    { id: 'e1', source: 'occult-root', target: 'occult-p1' },
    { id: 'e2', source: 'occult-p1', target: 'occult-gateway-zeus' },
    { id: 'e3', source: 'occult-p1', target: 'occult-gateway-umbrella' },
  ]
};

const MOCK_ZEUS = {
  nodes: [
    // 📥 ENTRADA AL ZEUS
    { 
      id: 'zeus-entry', 
      type: 'entryNode', 
      position: { x: 0, y: 0 }, 
      data: { sourceName: 'OCCULT', sourceMapId: 'occult', isEntry: true } 
    },
    
    // 🔴 JUGADOR: PEAJE
    { 
      id: 'zeus-p1', 
      type: 'playerNode', 
      position: { x: 0, y: 180 }, 
      data: { 
        player: { id: 2, name: 'Byron Love', position: 'MD', price: 500, spriteUrl: '/sprites/sprites_zeus/byron_love.webp' },
        status: 'toll',
        onAction: handleAction
      } 
    },

    // 🔒 JUGADOR: BLOQUEADO
    { 
      id: 'zeus-p2', 
      type: 'playerNode', 
      position: { x: 0, y: 380 }, 
      data: { 
        player: { id: 3, name: 'Poseidón', position: 'PR', price: 300, spriteUrl: '/sprites/sprites_zeus/poseidon.webp' },
        status: 'locked',
        onAction: handleAction
      } 
    },
  ],
  edges: [
    { id: 'ez1', source: 'zeus-entry', target: 'zeus-p1' },
    { id: 'ez2', source: 'zeus-p1', target: 'zeus-p2' },
  ]
};

const MOCK_UMBRELLA = {
  nodes: [
    // 📥 ENTRADA AL UMBRELLA
    { 
      id: 'umb-entry', 
      type: 'entryNode', 
      position: { x: 0, y: 0 }, 
      data: { sourceName: 'OCCULT', sourceMapId: 'occult', isEntry: true } 
    },
    
    // 🔵 JUGADOR: COMPRADO (PROPIEDAD)
    { 
      id: 'umb-p1', 
      type: 'playerNode', 
      position: { x: 0, y: 180 }, 
      data: { 
        player: { id: 4, name: 'Feldt', position: 'PR', price: 150, spriteUrl: '/sprites/sprites_umbrella/feldt.webp' },
        status: 'owned',
        onAction: handleAction
      } 
    },
  ],
  edges: [
    { id: 'eu1', source: 'umb-entry', target: 'umb-p1' },
  ]
};
// ------------------------------------

function CanvasLogica() {
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>(MOCK_OCCULT.nodes as Node[]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(MOCK_OCCULT.edges as Edge[]);
  const [loadedMaps, setLoadedMaps] = useState<string[]>(['occult']);
  
  const { setCenter } = useReactFlow();

  const toggleSubgraph = useCallback((gatewayNode: Node) => {
    const targetMapId = gatewayNode.data.targetMapId as string;
    
    if (loadedMaps.includes(targetMapId)) {
      setNodes(prev => prev.filter(node => !node.id.startsWith(`${targetMapId}-`)));
      setEdges(prev => prev.filter(edge => !edge.id.startsWith(`${targetMapId}-`) && edge.id !== `bridge-${gatewayNode.id}-${targetMapId}`));
      setLoadedMaps(prev => prev.filter(id => id !== targetMapId));
      return;
    }

    let targetMap = null;
    if (targetMapId === 'zeus') targetMap = MOCK_ZEUS;
    if (targetMapId === 'umbrella') targetMap = MOCK_UMBRELLA;
    if (!targetMap) return;

    const entryNode = targetMap.nodes.find(n => n.data.isEntry && n.data.sourceMapId === 'occult');
    if (!entryNode) return;

    const deltaX = gatewayNode.position.x - entryNode.position.x;
    const deltaY = gatewayNode.position.y - entryNode.position.y + 150;

    const shiftedNodes = targetMap.nodes.map(node => ({
      ...node,
      id: `${targetMapId}-${node.id}`, 
      position: { x: node.position.x + deltaX, y: node.position.y + deltaY },
      // Respetamos los estilos del nodo si no es un nodo por defecto
      style: node.type === 'default' ? { border: '2px solid #eab308', backgroundColor: '#1e293b', color: 'white' } : undefined
    }));

    const shiftedEdges = targetMap.edges.map(edge => ({
      ...edge,
      id: `${targetMapId}-${edge.id}`,
      source: `${targetMapId}-${edge.source}`,
      target: `${targetMapId}-${edge.target}`,
      animated: true,
      style: { stroke: '#eab308', strokeWidth: 2 }
    }));

    const bridgeEdge: Edge = {
      id: `bridge-${gatewayNode.id}-${targetMapId}`,
      source: gatewayNode.id,
      target: `${targetMapId}-${entryNode.id}`,
      animated: true,
      style: { stroke: '#10b981', strokeWidth: 4 }
    };

    setNodes(prev => [...prev, ...shiftedNodes]);
    setEdges(prev => [...prev, ...shiftedEdges, bridgeEdge]);
    setLoadedMaps(prev => [...prev, targetMapId]);

    setTimeout(() => {
      setCenter(shiftedNodes[1].position.x, shiftedNodes[1].position.y, { zoom: 0.9, duration: 800 });
    }, 100);

  }, [loadedMaps, setNodes, setEdges, setCenter]);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (node.data.isGateway) {
      toggleSubgraph(node);
    }
  }, [toggleSubgraph]);

  return (
    <div className="w-full h-screen bg-slate-950">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        // 🎯 AÑADIMOS TUS NODOS PERSONALIZADOS AQUÍ
        nodeTypes={nodeTypes}
        nodesDraggable={false} 
        nodesConnectable={false}
        elementsSelectable={true}
        fitView
      >
        <Background color="#334155" gap={24} />
        <Controls className="bg-slate-900 border-slate-700 fill-white" />
      </ReactFlow>
    </div>
  );
}

export default function PlayerCanvas() {
  return (
    <ReactFlowProvider>
      <CanvasLogica />
    </ReactFlowProvider>
  );
}