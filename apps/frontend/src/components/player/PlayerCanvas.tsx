"use client";

import { useCallback, useEffect, useState } from 'react';
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
import { Loader2 } from 'lucide-react';
import { api } from '@/services/api';
import { type ClubResources } from '@inazuma/shared';
import { ClubResourcesDisplay } from '@/components/economy/ClubResourcesDisplay';

// 🎯 Nodos Visuales
import ViewerPlayerNode from '@/components/viewer-nodes/ViewerPlayerNode';
import ViewerShieldNode from '@/components/viewer-nodes/ViewerShieldNode';
import ViewerGatewayNode from '@/components/viewer-nodes/ViewerGatewayNode';
import ViewerEntryNode from '@/components/viewer-nodes/ViewerEntryNode';
import PlayerModal from './PlayerModal';

const nodeTypes = {
  playerNode: ViewerPlayerNode,
  shieldNode: ViewerShieldNode,
  gatewayNode: ViewerGatewayNode,
  entryNode: ViewerEntryNode,
};

// Necesitamos que alguien le diga al Canvas quién es el usuario y cuál es su mapa base
interface CanvasProps {
  clubId: string;
  baseTeamSlug: string;
  initialResources: ClubResources;
}

function CanvasLogica({ clubId, baseTeamSlug, initialResources }: CanvasProps) {
  const [resources, setResources] = useState<ClubResources>(initialResources);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  
  const [loadedMaps, setLoadedMaps] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNodeData, setSelectedNodeData] = useState<any | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  
  const { setCenter, fitView } = useReactFlow();

  // 🎯 1. FETCH INICIAL (Se ejecuta solo al cargar la página)
  useEffect(() => {
    async function loadInitialMap() {
      try {
        const mapData = await api.market.getTeamMapForUser(clubId, baseTeamSlug);
        
        setNodes(mapData.nodes);
        setEdges(mapData.edges);
        setLoadedMaps([baseTeamSlug]);
        setIsLoading(false);

        // Hacemos que la cámara encuadre el mapa inicial
        setTimeout(() => fitView({ duration: 800 }), 100);

      } catch (error) {
        console.error(error);
        alert("Error de conexión con el mercado.");
        setIsLoading(false);
      }
    }
    loadInitialMap();
  }, [clubId, baseTeamSlug, setNodes, setEdges, fitView]);


  // 🎯 2. FETCH DINÁMICO (Cuando pulsas una puerta)
  const toggleSubgraph = useCallback(async (gatewayNode: Node) => {
    if (gatewayNode.data.isLocked) {
      alert("🔒 ¡Camino Bloqueado! Necesitas completar todos los nodos anteriores para obtener las llaves de acceso.");
      return;
    }

    const targetMapId = gatewayNode.data.targetMapId as string;
    const targetTeamSlug = gatewayNode.data.targetTeamSlug as string;
    const currentTeamSlug = gatewayNode.data.sourceTeamSlug as string || baseTeamSlug;
    
    // CASO A: Si ya está abierto, lo cerramos
    if (loadedMaps.includes(targetMapId)) {
      setNodes(prev => prev.filter(node => !node.id.startsWith(`${targetMapId}-`)));
      setEdges(prev => prev.filter(edge => 
        !edge.id.startsWith(`${targetMapId}-`) && 
        edge.id !== `bridge-${gatewayNode.id}-${targetMapId}`
      ));
      setLoadedMaps(prev => prev.filter(id => id !== targetMapId));
      
      // Devolvemos la cámara al Gateway que acabamos de pulsar
      setCenter(gatewayNode.position.x, gatewayNode.position.y, { zoom: 1, duration: 800 });
      return;
    }

    // CASO B: Si está cerrado, pedimos los datos reales a la API
    try {
      setIsLoading(true);
      
      // 1. Llamada a tu API real usando el slug del equipo destino
      const targetMap = await api.market.getTeamMapForUser(clubId, targetTeamSlug, currentTeamSlug);

      // 2. Buscamos el nodo de entrada (EntryNode) en el nuevo mapa
      // Buscamos el nodo que se conecte con nuestro mapa actual. 
      // Por si acaso hubiera varias entradas en ese mapa, comprobamos el sourceMapId.
      const entryNode = targetMap.nodes.find((n: any) => 
        n.type === 'entryNode' && n.data.sourceTeamSlug === currentTeamSlug
      );

      if (!entryNode) {
          console.error(`No se encontró una entrada desde ${currentTeamSlug} en el mapa de ${targetTeamSlug}`);
          return;
      }

      // 3. Matemáticas de posicionamiento
      // Calculamos cuánto hay que mover TODOS los nodos del nuevo mapa
      // para que su EntryNode se coloque justo debajo de nuestro GatewayNode
      const deltaX = gatewayNode.position.x - entryNode.position.x;
      const deltaY = gatewayNode.position.y - entryNode.position.y + 150;

      const shiftedNodes = targetMap.nodes.map((node: any) => ({
        ...node,
        // Añadimos el prefijo para evitar que IDs de diferentes mapas choquen
        id: `${targetMapId}-${node.id}`, 
        position: { x: node.position.x + deltaX, y: node.position.y + deltaY },
      }));

      const shiftedEdges = targetMap.edges.map((edge: any) => ({
        ...edge,
        id: `${targetMapId}-${edge.id}`,
        // ¡OJO! A los source y targets también hay que ponerles el prefijo
        source: `${targetMapId}-${edge.source}`,
        target: `${targetMapId}-${edge.target}`,
      }));

      // 4. Creamos el puente que conecta el Gateway (viejo mapa) con el Entry (nuevo mapa)
      const bridgeEdge: Edge = {
        id: `bridge-${gatewayNode.id}-${targetMapId}`,
        source: gatewayNode.id,
        // El EntryNode del nuevo mapa ahora tiene prefijo
        target: `${targetMapId}-${entryNode.id}`, 
        animated: true,
        style: { stroke: '#a855f7', strokeWidth: 4, strokeDasharray: '5,5' }, // Morado y punteado
        sourceHandle: 'bottom', 
        targetHandle: 'top'
      };

      // 5. Actualizamos el estado
      setNodes(prev => [...prev, ...shiftedNodes]);
      setEdges(prev => [...prev, ...shiftedEdges, bridgeEdge]);
      setLoadedMaps(prev => [...prev, targetMapId]);

      // 6. Movemos la cámara al centro del nuevo mapa
      setTimeout(() => {
        setCenter(shiftedNodes[0].position.x, shiftedNodes[0].position.y + 200, { zoom: 0.9, duration: 800 });
      }, 100);

    } catch (error) {
      console.error(error);
      alert("Error al cargar la siguiente zona");
    } finally {
      setIsLoading(false);
    }

  }, [loadedMaps, setNodes, setEdges, setCenter, clubId]);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (node.type === 'gatewayNode') {
      toggleSubgraph(node);
    }
    else if (node.type === 'playerNode') {
      setSelectedNodeData(node.data);
    }
  }, [toggleSubgraph]);

  const refreshMap = useCallback(async () => {
    const mapRes = await api.market.getTeamMapForUser(clubId, baseTeamSlug);
    setNodes(mapRes.nodes);
    setEdges(mapRes.edges);
    setLoadedMaps([baseTeamSlug]);
  }, [clubId, baseTeamSlug, setNodes, setEdges]);

  const handleModalAction = useCallback(async (action: 'buy' | 'toll' | 'sell', nickname: string) => {
    try {
      setIsActionLoading(true);
      const result = await api.market.performAction(clubId, action, nickname);
      setResources((prev) => ({ ...prev, pp: result.newBalance as number }));
      setSelectedNodeData(null);
      await refreshMap();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al procesar la transacción';
      console.error(error);
      alert(`❌ ${message}`);
    } finally {
      setIsActionLoading(false);
    }
  }, [clubId, refreshMap]);

  // Pantalla de carga mientras se pide el mapa base
  if (isLoading && loadedMaps.length === 0) {
    return (
      <div className="w-full h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="animate-spin mb-4" size={48} />
        <h2 className="text-xl font-black uppercase tracking-widest">Conectando con la sede...</h2>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-slate-950 relative overflow-hidden">
      {selectedNodeData && (
        <PlayerModal 
          player={selectedNodeData.player}
          status={selectedNodeData.status}
          onClose={() => setSelectedNodeData(null)}
          onAction={handleModalAction}
          isLoading={isLoading}
          resources={resources}
          clubId={clubId}
          onDebugComplete={refreshMap}
        />
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
      >
        <Background color="#334155" gap={24} />
        <Controls className="bg-slate-900 border-slate-700 fill-white" />
      </ReactFlow>

      <ClubResourcesDisplay
        resources={resources}
        variant="hud"
        title="Recursos"
        className="absolute top-4 right-4 z-10"
      />

      {isLoading && loadedMaps.length > 0 && (
        <div className="absolute top-4 left-4 z-10 bg-slate-900/80 p-3 rounded-xl border border-slate-600 backdrop-blur-sm text-slate-300 flex items-center gap-2 font-black text-xs uppercase shadow-xl">
          <Loader2 className="animate-spin" size={16} /> Descargando zona...
        </div>
      )}
    </div>
  );
}

export default function PlayerCanvas(props: CanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasLogica {...props} />
    </ReactFlowProvider>
  );
}