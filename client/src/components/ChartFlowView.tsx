import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  useNodesState,
  useEdgesState,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Badge } from '@/components/ui/badge';
import type { ChartAccountNode } from '@/lib/chartAccountUtils';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  PiggyBank,
  Folder,
  FolderOpen,
} from 'lucide-react';

interface ChartFlowViewProps {
  tree: ChartAccountNode[];
  expandedNodes: Set<string>;
  onToggleExpand: (id: string) => void;
}

// Custom node component
function AccountNode({ data }: { data: any }) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'receita':
        return {
          bg: 'bg-green-50 dark:bg-green-950/20',
          border: 'border-green-500',
          text: 'text-green-700 dark:text-green-400',
          icon: <TrendingUp className="h-4 w-4" />,
        };
      case 'despesa':
        return {
          bg: 'bg-red-50 dark:bg-red-950/20',
          border: 'border-red-500',
          text: 'text-red-700 dark:text-red-400',
          icon: <TrendingDown className="h-4 w-4" />,
        };
      case 'ativo':
        return {
          bg: 'bg-blue-50 dark:bg-blue-950/20',
          border: 'border-blue-500',
          text: 'text-blue-700 dark:text-blue-400',
          icon: <Wallet className="h-4 w-4" />,
        };
      case 'passivo':
        return {
          bg: 'bg-amber-50 dark:bg-amber-950/20',
          border: 'border-amber-500',
          text: 'text-amber-700 dark:text-amber-400',
          icon: <CreditCard className="h-4 w-4" />,
        };
      case 'patrimonio_liquido':
        return {
          bg: 'bg-violet-50 dark:bg-violet-950/20',
          border: 'border-violet-500',
          text: 'text-violet-700 dark:text-violet-400',
          icon: <PiggyBank className="h-4 w-4" />,
        };
      default:
        return {
          bg: 'bg-gray-50 dark:bg-gray-950/20',
          border: 'border-gray-500',
          text: 'text-gray-700 dark:text-gray-400',
          icon: <Folder className="h-4 w-4" />,
        };
    }
  };

  const colors = getTypeColor(data.type);
  const hasChildren = data.hasChildren;

  return (
    <div
      className={`${colors.bg} ${colors.border} border-2 rounded-lg p-3 min-w-[200px] shadow-md cursor-pointer hover-elevate transition-all`}
      onClick={() => data.onToggle?.(data.id)}
      data-testid={`flow-node-${data.id}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className={colors.text}>
          {hasChildren ? (
            data.isExpanded ? (
              <FolderOpen className="h-4 w-4" />
            ) : (
              <Folder className="h-4 w-4" />
            )
          ) : (
            colors.icon
          )}
        </div>
        {data.code && (
          <Badge variant="secondary" className="font-mono text-[9px] px-1.5 py-0 h-4">
            {data.code}
          </Badge>
        )}
      </div>
      <div className={`font-semibold text-sm ${colors.text} mb-1`}>
        {data.name}
      </div>
      {data.description && (
        <div className="text-[10px] text-muted-foreground truncate">
          {data.description}
        </div>
      )}
    </div>
  );
}

const nodeTypes = {
  accountNode: AccountNode,
};

export function ChartFlowView({ tree, expandedNodes, onToggleExpand }: ChartFlowViewProps) {
  // Convert tree to nodes and edges with hierarchical layout
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const nodePositions = new Map<string, { x: number; y: number }>();

    const HORIZONTAL_SPACING = 350; // Increased from 280
    const VERTICAL_SPACING = 200; // Increased from 120
    const ROOT_SPACING = 500; // Space between root nodes

    // Count total width needed for each subtree
    const countSubtreeWidth = (node: ChartAccountNode): number => {
      const isExpanded = expandedNodes.has(node.id);
      if (!isExpanded || node.children.length === 0) {
        return 1;
      }
      return node.children.reduce((sum, child) => sum + countSubtreeWidth(child), 0);
    };

    // Calculate positions using hierarchical layout
    const calculatePositions = (
      node: ChartAccountNode,
      level: number,
      startX: number,
      endX: number
    ) => {
      const x = (startX + endX) / 2; // Center in available space
      const y = level * VERTICAL_SPACING;

      nodePositions.set(node.id, { x, y });

      const isExpanded = expandedNodes.has(node.id);
      const hasChildren = node.children.length > 0;

      // Create node
      nodes.push({
        id: node.id,
        type: 'accountNode',
        position: { x, y },
        data: {
          name: node.name,
          code: node.code,
          type: node.type,
          description: node.description,
          hasChildren,
          isExpanded,
          id: node.id,
          onToggle: onToggleExpand,
        },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      });

      // Process children if expanded
      if (isExpanded && hasChildren) {
        let currentX = startX;
        node.children.forEach((child) => {
          const childWidth = countSubtreeWidth(child) * HORIZONTAL_SPACING;
          const childStartX = currentX;
          const childEndX = currentX + childWidth;
          
          calculatePositions(child, level + 1, childStartX, childEndX);
          currentX = childEndX;

          // Create edge
          edges.push({
            id: `${node.id}-${child.id}`,
            source: node.id,
            target: child.id,
            type: 'smoothstep',
            animated: true,
            style: {
              stroke: getEdgeColor(node.type),
              strokeWidth: 2,
            },
          });
        });
      }
    };

    // Process each root node with proper spacing
    let currentX = 0;
    tree.forEach((rootNode) => {
      const rootWidth = countSubtreeWidth(rootNode) * HORIZONTAL_SPACING;
      const startX = currentX;
      const endX = currentX + rootWidth;
      
      calculatePositions(rootNode, 0, startX, endX);
      currentX = endX + ROOT_SPACING; // Add spacing between root trees
    });

    return { nodes, edges };
  }, [tree, expandedNodes, onToggleExpand]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes/edges when tree or expanded state changes
  useMemo(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (node.data.hasChildren) {
        onToggleExpand(node.id);
      }
    },
    [onToggleExpand]
  );

  return (
    <div className="h-[700px] w-full border rounded-lg bg-background">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3, minZoom: 0.5, maxZoom: 1 }}
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.6 }}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const type = node.data.type;
            switch (type) {
              case 'receita':
                return '#22c55e';
              case 'despesa':
                return '#ef4444';
              case 'ativo':
                return '#3b82f6';
              case 'passivo':
                return '#f59e0b';
              case 'patrimonio_liquido':
                return '#8b5cf6';
              default:
                return '#6b7280';
            }
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>
    </div>
  );
}

function getEdgeColor(type: string): string {
  switch (type) {
    case 'receita':
      return '#22c55e';
    case 'despesa':
      return '#ef4444';
    case 'ativo':
      return '#3b82f6';
    case 'passivo':
      return '#f59e0b';
    case 'patrimonio_liquido':
      return '#8b5cf6';
    default:
      return '#6b7280';
  }
}
