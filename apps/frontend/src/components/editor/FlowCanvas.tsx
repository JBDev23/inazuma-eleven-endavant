"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
  NodeTypes,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

import PlayerNode from "./PlayerNode";

import dagre from "dagre";
import { useEditor } from "@/context/EditorContext";
import { Player, Team } from "@inazuma/shared";
import GatewayNode from "./GatewayNode";
import ShieldNode from "./ShieldNode";
import { api } from "@/services/api";
import { Save } from "lucide-react";
import EntryNode from "./EntryNode";

const nodeWidth = 200;
const nodeHeight = 150;

export const getLayoutedElements = (nodes: any[], edges: any[]) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({ rankdir: "TB", nodesep: 80, ranksep: 100 });

  // 1. Detectamos quién tiene conexiones
  const connectedNodeIds = new Set();
  edges.forEach((edge) => {
    connectedNodeIds.add(edge.source);
    connectedNodeIds.add(edge.target);
  });

  // 2. A Dagre SOLO le pasamos los jugadores y las Puertas que YA están conectadas
  nodes.forEach((node) => {
    if (node.type === 'gatewayNode' && !connectedNodeIds.has(node.id)) return;

    let w = 192, h = 140; // Default Jugador

    if (node.type === 'gatewayNode') {
      w = 224; h = 120;
    } else if (node.type === 'shieldNode') {
      w = 160; h = 160; 
    }
    
    dagreGraph.setNode(node.id, { width: w, height: h });
  });

  // 3. Pasamos las flechas verticales
  edges.forEach((edge) => {
    if (
      edge.sourceHandle === 'right' || edge.sourceHandle === 'left' ||
      edge.targetHandle === 'right' || edge.targetHandle === 'left'
    ) return; 
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  // 4. Calculamos dónde colocar las puertas "Vacías" (el dock de abajo)
  let maxY = 0;
  let minX = Infinity;
  let maxX = -Infinity;

  // Analizamos el tamaño del árbol que sí ha procesado Dagre
  nodes.forEach((node) => {
    if (node.type !== 'gatewayNode' || connectedNodeIds.has(node.id)) {
      const pos = dagreGraph.node(node.id);
      if (pos) {
        if (pos.y > maxY) maxY = pos.y;
        if (pos.x < minX) minX = pos.x;
        if (pos.x > maxX) maxX = pos.x;
      }
    }
  });

  const centerX = minX !== Infinity ? (minX + maxX) / 2 : 0;
  const emptyGateways = nodes.filter(n => n.type === 'gatewayNode' && !connectedNodeIds.has(n.id));
  
  // Posiciones para las puertas sin conectar
  const gatewayWidth = 224;
  const gatewaySpacing = 80;
  const totalEmptyWidth = emptyGateways.length * gatewayWidth + Math.max(0, emptyGateways.length - 1) * gatewaySpacing;
  const startX = centerX - (totalEmptyWidth / 2) + (gatewayWidth / 2);

  const emptyGatewayPositions = new Map();
  emptyGateways.forEach((gw, index) => {
    emptyGatewayPositions.set(gw.id, {
      x: startX + index * (gatewayWidth + gatewaySpacing),
      y: maxY + 200 // Solo las vacías van al sótano
    });
  });

  // 5. Aplicamos las posiciones finales
  const layoutedNodes = nodes.map((node) => {
    const isGateway = node.type === 'gatewayNode';
    const w = isGateway ? 224 : 192;
    const h = isGateway ? 120 : 140;

    // A) Si es una Puerta VACÍA, usamos nuestra posición del sótano
    if (isGateway && !connectedNodeIds.has(node.id)) {
      const pos = emptyGatewayPositions.get(node.id);
      return {
        ...node,
        position: { x: pos.x - w / 2, y: pos.y - h / 2 }
      };
    }

    // B) Si es cualquier nodo CONECTADO (Jugador o Puerta), dejamos que Dagre mande
    const pos = dagreGraph.node(node.id);
    if (!pos) return node; // Por seguridad

    return {
      ...node,
      position: { x: pos.x - w / 2, y: pos.y - h / 2 }
    };
  });

  return { nodes: layoutedNodes, edges };
};

function FlowCanvasContent({ team, allTeams }: { team: Team, allTeams: Team[] }) {

  const handleAddChild = useCallback((parentId: string) => {
    // 1. Calculamos un ÚNICO ID y lo guardamos
    const timestamp = Date.now();
    const newId = `node-${timestamp}`; 

    setNodes((nds) => {
      const parentNode = nds.find((n) => n.id === parentId);
      if (!parentNode) return nds;

      const newNode: Node = {
        id: newId, // Usamos el ID generado
        type: "playerNode",
        position: {
          x: parentNode.position.x + (Math.random() * 100 - 50),
          y: parentNode.position.y + 180,
        },
        data: { player: null },
      };

      return [...nds, newNode];
    });

    setEdges((eds) => {
      const newEdge: Edge = {
        id: `e-${parentId}-${newId}`,
        source: parentId,
        target: newId,
        animated: true,
        style: {
          stroke: "#eab308",
          strokeWidth: 3,
          strokeDasharray: "5, 5",
          opacity: 0.6,
        },
      };
      return [...eds, newEdge];
    });

    setHasUnsavedChanges(true);
  }, []);

  const getInitialData = () => {
    if (team.mapData && team.mapData.nodes && team.mapData.nodes.length > 0) {
      return { 
        initialNodes: team.mapData.nodes, 
        initialEdges: team.mapData.edges 
      };
    }
    
    if (team.type === 'CENTRAL') {
      return {
        initialNodes: [
          {
            id: `entry-1`,
            type: 'entryNode',
            position: { x: -300, y: 0 },
            data: { sourceName: null, sourceMapId: null, onMarkUnsaved: () => setHasUnsavedChanges(true), allTeams }, 
          },
          {
            id: `entry-2`,
            type: 'entryNode',
            position: { x: 0, y: 0 },
            data: { sourceName: null, sourceMapId: null, onMarkUnsaved: () => setHasUnsavedChanges(true), allTeams }, 
          },
          {
            id: `entry-3`,
            type: 'entryNode',
            position: { x: 300, y: 0 },
            data: { sourceName: null, sourceMapId: null, onMarkUnsaved: () => setHasUnsavedChanges(true), allTeams }, 
          },
        ],
        initialEdges: [],
      };
    }

    return {
      initialNodes: [
        {
          id: `root-${team.id}`,
          type: 'shieldNode',
          position: { x: 0, y: 0 },
          data: { teamId: team.id, teamName: team.name, teamSlug: team.slug },
        },
      ],
      initialEdges: [],
    };
  };

  const { initialNodes, initialEdges } = getInitialData();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isSaving, setIsSaving] = useState(false);  
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const { fitView } = useReactFlow();
  const { setUsedPlayerIds } = useEditor();
  


  const usedIdsString = useMemo(() => {
    return nodes
      .map((n) => (n.data?.player as Player)?.id)
      .filter(Boolean)
      .sort()
      .join(',');
  }, [nodes]);

  useEffect(() => {
    if (usedIdsString) {
      setUsedPlayerIds(usedIdsString.split(','));
    } else {
      setUsedPlayerIds([]);
    }
  }, [usedIdsString, setUsedPlayerIds]);

  const onLayout = useCallback(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      nodes,
      edges,
    );
    setNodes([...layoutedNodes]);
    setEdges([...layoutedEdges]);

    setTimeout(() => fitView({ duration: 800 }), 50);
  }, [nodes, edges, fitView]);

  useEffect(() => {
    onLayout();
  }, [nodes.length]);

  const nodeTypes = useMemo<NodeTypes>(
    () => ({ playerNode: PlayerNode, gatewayNode: GatewayNode, shieldNode: ShieldNode, entryNode: EntryNode }),
    []
  );

  const handleNodesChange = useCallback((changes: any) => {
    onNodesChange(changes);
  
    const isRealChange = changes.some(
      (change: any) => change.type === 'position' || change.type === 'remove' || change.type === 'add'
    );
  
    if (isRealChange) {
      setHasUnsavedChanges(true);
    }
  }, [onNodesChange]);

  const handleEdgesChange = useCallback((changes: any) => {
    onEdgesChange(changes);
  
    const isRealChange = changes.some(
      (change: any) => change.type === 'remove' || change.type === 'add' || change.type === 'change'
    );
  
    if (isRealChange) {
      setHasUnsavedChanges(true);
    }
  }, [onEdgesChange]);

  const onConnect = useCallback((params: Connection) => {
    const edgeExists = edges.some(
      (e) => e.source === params.source && e.target === params.target
    );
    if (edgeExists) return;

    // 1. Identificamos qué tipo de nodo es el destino
    const targetNode = nodes.find((n) => n.id === params.target);
    const isGateway = targetNode?.type === 'gatewayNode';
    const isTargetFilled = !!targetNode?.data?.player;

    // 2. Configuramos la flecha dinámicamente
    const newEdge: Edge = {
      ...params,
      id: `e-${params.source}-${params.target}-${Date.now()}`,
      type: "default", 
      animated: isGateway ? false : !isTargetFilled,
      style: {
        stroke: isGateway ? "#a855f7" : "#eab308",
        strokeWidth: 3,
        strokeDasharray: (isGateway || isTargetFilled) ? "0" : "5, 5",
        opacity: (isGateway || isTargetFilled) ? 1 : 0.6,
        cursor: "pointer",
      },
    };

    const newEdges = addEdge(newEdge, edges);
    
    const isLateral = 
      params.sourceHandle === 'left' || params.sourceHandle === 'right' ||
      params.targetHandle === 'left' || params.targetHandle === 'right';

    if (isLateral) {
      setEdges(newEdges);
    } else {
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, newEdges);
      setNodes([...layoutedNodes]);
      setEdges([...layoutedEdges]);

      window.requestAnimationFrame(() => {
        setTimeout(() => fitView({ duration: 800 }), 50);
      });
    }

  }, [nodes, edges, setNodes, setEdges, fitView]);

  const onEdgeDoubleClick = useCallback((event: React.MouseEvent, clickedEdge: Edge) => {
    event.preventDefault(); 
    
    const targetId = clickedEdge.target;
    const targetNode = nodes.find((n) => n.id === targetId);
    let canDelete = false;

    // REGLA 1: Puertas
    if (targetNode?.type === 'gatewayNode') canDelete = true;

    // REGLA 2: Laterales
    const isLateral = 
      clickedEdge.sourceHandle === 'left' || clickedEdge.sourceHandle === 'right' ||
      clickedEdge.targetHandle === 'left' || clickedEdge.targetHandle === 'right';
    if (isLateral) canDelete = true;

    // REGLA 3: Confluencia (Múltiples padres)
    const otherIncomingEdges = edges.filter(
      (e) => e.target === targetId && e.id !== clickedEdge.id
    );
    if (!isLateral && otherIncomingEdges.length > 0) canDelete = true;

    // Si no cumple ninguna, bloqueamos
    if (!canDelete) {
      console.log("No puedes borrar la única conexión de este nodo.");
      return; 
    }

    // 🎯 LA MAGIA DEL REORDENAMIENTO
    const newEdges = edges.filter((e) => e.id !== clickedEdge.id);
    
    // Pasamos el nuevo mapa por Dagre
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, newEdges);
    
    setNodes([...layoutedNodes]);
    setEdges([...layoutedEdges]);

    setTimeout(() => fitView({ duration: 800 }), 50);
    
  }, [nodes, edges, setNodes, setEdges, fitView]); 

  const handleFillNode = useCallback((nodeId: string, player: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, player } };
        }
        return node;
      }),
    );

    setEdges((eds) =>
      eds.map((edge) => {
        if (edge.target === nodeId) {
          return {
            ...edge,
            animated: false,
            style: {
              ...edge.style,
              strokeDasharray: "0",
              opacity: 1,
            },
          };
        }
        return edge;
      }),
    );

    setHasUnsavedChanges(true);
  }, []);

  const handleDeleteNode = useCallback((nodeId: string) => {
    const nodesToDelete = new Set<string>([nodeId]);
    const queue = [nodeId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      
      const childrenIds = edges
        .filter((e) => {
          if (e.sourceHandle === 'left' || e.sourceHandle === 'right') {
            return false;
          }
          return e.source === currentId;
        })
        .map((e) => e.target);

      childrenIds.forEach((childId) => {
        if (!nodesToDelete.has(childId)) {
          nodesToDelete.add(childId);
          queue.push(childId);
        }
      });
    }

    if (nodeId === "root-1") {
      setNodes((nds) =>
        nds
          .filter((n) => !nodesToDelete.has(n.id) || n.id === "root-1")
          .map((n) =>
            n.id === "root-1" ? { ...n, data: { ...n.data, player: null } } : n
          )
      );
    } else {
      setNodes((nds) => nds.filter((n) => !nodesToDelete.has(n.id)));
    }

    setEdges((eds) =>
      eds.filter(
        (e) => !nodesToDelete.has(e.source) && !nodesToDelete.has(e.target)
      )
    );

    setHasUnsavedChanges(true);
  }, [edges]);


  const handleSaveMap = async () => {
    setIsSaving(true);
    try {
      const cleanedNodes = nodes.map((node) => {
        const { 
          allTeams, 
          baseClubs, 
          onMarkUnsaved, 
          onAddChild, 
          onDeleteNode, 
          onFillNode,
          ...cleanData
        } = node.data;

        return {
          ...node,
          data: cleanData,
        };
      });

      await api.teams.saveMap(team.id.toString(), { 
        nodes: cleanedNodes, 
        edges: edges 
      });

      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Error al guardar el mapa:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddGateway = () => {
    const newGateway: Node = {
      id: `gateway-${Date.now()}`,
      type: "gatewayNode",
      position: { x: 200, y: 300 },
      data: {
        targetMapId: null,
        targetName: null,
        targetTeamSlug: null,
        sourceTeamSlug: team.slug,
        keys: 0,
        onDeleteNode: handleDeleteNode,
        onMarkUnsaved: () => setHasUnsavedChanges(true), 
        allTeams,
      },
    };
  
    setNodes((prev) => [...prev, newGateway]);
    setHasUnsavedChanges(true);
  };

  useEffect(() => {
    setNodes((currentNodes) => 
      currentNodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          onAddChild: handleAddChild,
          onDeleteNode: handleDeleteNode,
          onMarkUnsaved: () => setHasUnsavedChanges(true),
          allTeams,
        }
      }))
    );
  }, [setNodes, handleAddChild, handleDeleteNode, allTeams]);

  const nodesWithFunctions = nodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      onFillNode: handleFillNode,
      onAddChild: handleAddChild,
      onDeleteNode: handleDeleteNode,
    },
  }));

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodesWithFunctions}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onEdgeDoubleClick={onEdgeDoubleClick}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        <Controls />
      </ReactFlow>

      {/* Mini panel de debug */}
      <div className="absolute bottom-4 right-4 bg-white p-2 rounded-md shadow-md text-xs font-mono text-slate-500 z-10">
        Nodos: {nodes.length} | Conexiones: {edges.length}
      </div>
      <div className="absolute top-4 right-4 flex gap-2 z-10">
      </div>

      <div className="absolute flex-col top-4 right-4 z-50 flex gap-2">
        <button
          onClick={handleAddGateway}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold shadow-md hover:bg-purple-500 transition-colors border-2 border-purple-800"
        >
          Añadir Puerta
        </button>
        <button
          onClick={() => {
            onLayout();
          }}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold shadow-md hover:bg-purple-500 transition-colors border-2 border-purple-800"
        >
          Reordenar Árbol
        </button>
        <button
          onClick={handleSaveMap}
          disabled={isSaving || !hasUnsavedChanges}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all relative
            ${!hasUnsavedChanges 
              ? "bg-slate-800 text-slate-400 border-2 border-slate-700 cursor-not-allowed" 
              : "bg-emerald-600 text-white border-2 border-emerald-800 hover:bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
            }
          `}
        >
          <Save size={18} />
          {isSaving ? "GUARDANDO..." : hasUnsavedChanges ? "GUARDAR CAMBIOS" : "GUARDADO"}
          
          {hasUnsavedChanges && !isSaving && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

export default function FlowCanvas({ team, allTeams }: { team: Team, allTeams: Team[] }) {
  return (
    <ReactFlowProvider>
      <FlowCanvasContent team={team} allTeams={allTeams} />
    </ReactFlowProvider>
  );
}
