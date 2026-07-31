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
import { AlertTriangle, Loader2 } from 'lucide-react';
import { api, getApiErrorMessage } from '@/services/api';
import { type ClubResources } from '@inazuma/shared';
import { ClubResourcesDisplay } from '@/components/economy/ClubResourcesDisplay';
import { MarketRequestState } from '@/components/market/MarketRequestState';

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
  const [loadError, setLoadError] = useState<unknown>(null);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [selectedNodeData, setSelectedNodeData] = useState<any | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  
  const { setCenter, fitView } = useReactFlow();

  // 🎯 1. FETCH INICIAL (Se ejecuta solo al cargar la página)
  useEffect(() => {
    async function loadInitialMap() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const mapData = await api.market.getTeamMapForUser(clubId, baseTeamSlug);
        
        setNodes(mapData.nodes as Node[]);
        setEdges(mapData.edges as Edge[]);
        setLoadedMaps([baseTeamSlug]);
        setIsLoading(false);

        // Hacemos que la cámara encuadre el mapa inicial
        setTimeout(() => fitView({ duration: 800 }), 100);

      } catch (error) {
        console.error(error);
        setLoadError(error);
        setIsLoading(false);
      }
    }
    loadInitialMap();
  }, [clubId, baseTeamSlug, setNodes, setEdges, fitView]);


  /** Adjunta un submapa al grafo actual (sin tocar React state todavía). */
  const attachSubgraph = useCallback(async (
    gatewayNode: Node,
    currentNodes: Node[],
    currentEdges: Edge[],
  ): Promise<{ nodes: Node[]; edges: Edge[]; targetMapId: string } | null> => {
    const targetMapId = gatewayNode.data.targetMapId as string;
    const targetTeamSlug = gatewayNode.data.targetTeamSlug as string;
    const currentTeamSlug = (gatewayNode.data.sourceTeamSlug as string) || baseTeamSlug;

    const targetMap = await api.market.getTeamMapForUser(clubId, targetTeamSlug, currentTeamSlug);
    const targetNodes = targetMap.nodes as Node[];
    const targetEdges = targetMap.edges as Edge[];

    const entryNode = targetNodes.find(
      (n) => n.type === 'entryNode' && n.data.sourceTeamSlug === currentTeamSlug,
    );

    if (!entryNode) {
      console.error(`No se encontró una entrada desde ${currentTeamSlug} en el mapa de ${targetTeamSlug}`);
      return null;
    }

    const deltaX = gatewayNode.position.x - entryNode.position.x;
    const deltaY = gatewayNode.position.y - entryNode.position.y + 150;

    const shiftedNodes = targetNodes.map((node) => ({
      ...node,
      id: `${targetMapId}-${node.id}`,
      position: { x: node.position.x + deltaX, y: node.position.y + deltaY },
    }));

    const shiftedEdges = targetEdges.map((edge) => ({
      ...edge,
      id: `${targetMapId}-${edge.id}`,
      source: `${targetMapId}-${edge.source}`,
      target: `${targetMapId}-${edge.target}`,
    }));

    const bridgeEdge: Edge = {
      id: `bridge-${gatewayNode.id}-${targetMapId}`,
      source: gatewayNode.id,
      target: `${targetMapId}-${entryNode.id}`,
      animated: true,
      style: { stroke: '#a855f7', strokeWidth: 4, strokeDasharray: '5,5' },
      sourceHandle: 'bottom',
      targetHandle: 'top',
    };

    return {
      nodes: [...currentNodes, ...shiftedNodes],
      edges: [...currentEdges, ...shiftedEdges, bridgeEdge],
      targetMapId,
    };
  }, [clubId, baseTeamSlug]);

  // 🎯 2. FETCH DINÁMICO (Cuando pulsas una puerta)
  const toggleSubgraph = useCallback(async (gatewayNode: Node) => {
    if (gatewayNode.data.isLocked) {
      alert("🔒 ¡Camino Bloqueado! Necesitas completar todos los nodos anteriores para obtener las llaves de acceso.");
      return;
    }

    const targetMapId = gatewayNode.data.targetMapId as string;

    // CASO A: Si ya está abierto, lo cerramos
    if (loadedMaps.includes(targetMapId)) {
      setNodes(prev => prev.filter(node => !node.id.startsWith(`${targetMapId}-`)));
      setEdges(prev => prev.filter(edge =>
        !edge.id.startsWith(`${targetMapId}-`) &&
        edge.id !== `bridge-${gatewayNode.id}-${targetMapId}`
      ));
      setLoadedMaps(prev => prev.filter(id => id !== targetMapId));

      setCenter(gatewayNode.position.x, gatewayNode.position.y, { zoom: 1, duration: 800 });
      return;
    }

    // CASO B: Si está cerrado, pedimos los datos reales a la API
    try {
      setIsLoading(true);
      setInlineError(null);

      const attached = await attachSubgraph(gatewayNode, nodes, edges);
      if (!attached) return;

      setNodes(attached.nodes);
      setEdges(attached.edges);
      setLoadedMaps(prev => [...prev, attached.targetMapId]);

      const focusNode = attached.nodes.find((n) => n.id.startsWith(`${attached.targetMapId}-`));
      if (focusNode) {
        setTimeout(() => {
          setCenter(focusNode.position.x, focusNode.position.y + 200, { zoom: 0.9, duration: 800 });
        }, 100);
      }
    } catch (error) {
      console.error(error);
      setInlineError(getApiErrorMessage(error, "No se pudo cargar la siguiente zona."));
    } finally {
      setIsLoading(false);
    }
  }, [loadedMaps, nodes, edges, attachSubgraph, setNodes, setEdges, setCenter]);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (node.type === 'gatewayNode') {
      toggleSubgraph(node);
    }
    else if (node.type === 'playerNode') {
      setSelectedNodeData(node.data);
    }
  }, [toggleSubgraph]);

  /** Recarga el mapa base y vuelve a abrir las zonas que ya estaban desplegadas. */
  const refreshMap = useCallback(async () => {
    const openMapIds = loadedMaps.filter((id) => id !== baseTeamSlug);

    const mapRes = await api.market.getTeamMapForUser(clubId, baseTeamSlug);
    let nextNodes = mapRes.nodes as Node[];
    let nextEdges = mapRes.edges as Edge[];
    const nextLoaded = [baseTeamSlug];

    for (const targetMapId of openMapIds) {
      const gateway = nextNodes.find(
        (n) => n.type === 'gatewayNode' && n.data.targetMapId === targetMapId && !n.data.isLocked,
      );
      if (!gateway) continue;

      try {
        const attached = await attachSubgraph(gateway, nextNodes, nextEdges);
        if (!attached) continue;
        nextNodes = attached.nodes;
        nextEdges = attached.edges;
        nextLoaded.push(attached.targetMapId);
      } catch (error) {
        console.error(`No se pudo restaurar la zona ${targetMapId}`, error);
      }
    }

    setNodes(nextNodes);
    setEdges(nextEdges);
    setLoadedMaps(nextLoaded);
  }, [clubId, baseTeamSlug, loadedMaps, attachSubgraph, setNodes, setEdges]);

  const handleModalAction = useCallback(async (action: 'buy' | 'toll' | 'sell', nickname: string) => {
    try {
      setIsActionLoading(true);
      setInlineError(null);
      const result = await api.market.performAction(clubId, action, nickname);
      setResources((prev) => ({ ...prev, pp: result.newBalance as number }));
      setSelectedNodeData(null);
      await refreshMap();
    } catch (error: unknown) {
      const message = getApiErrorMessage(error, 'No se pudo procesar la transaccion.');
      console.error(error);
      setInlineError(message);
    } finally {
      setIsActionLoading(false);
    }
  }, [clubId, refreshMap]);

  // Pantalla de carga mientras se pide el mapa base
  if (isLoading && loadedMaps.length === 0) {
    return <MarketRequestState title="Conectando con la sede..." loadingLabel="Estamos cargando el mapa base del club." accentClassName="text-emerald-500" className="w-full h-screen bg-slate-950" />;
  }

  if (loadError && loadedMaps.length === 0) {
    return (
      <MarketRequestState
        title="Conectando con la sede..."
        error={loadError}
        onRetry={() => window.location.reload()}
        className="w-full h-screen bg-slate-950"
      />
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
          isLoading={isActionLoading}
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

      {inlineError && (
        <div className="absolute top-4 left-4 z-20 max-w-md rounded-xl border border-red-500/30 bg-red-950/85 px-4 py-3 text-sm text-red-100 shadow-xl backdrop-blur-sm">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-400" />
            <div>
              <p className="font-black uppercase tracking-wide text-red-300">Problema de conexion</p>
              <p className="mt-1 text-red-100/90">{inlineError}</p>
            </div>
          </div>
        </div>
      )}

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