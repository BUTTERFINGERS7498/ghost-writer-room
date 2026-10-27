import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Background, Controls, Handle, Position, ReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { api } from '../api/client.js';
import Spinner, { ErrorBox } from '../components/Spinner.jsx';

const NODE_W = 220;
const X_GAP = 40;
const Y_GAP = 150;

// Tidy-tree layout: leaves get consecutive slots, parents sit centred over their children.
// Canon children are placed first so the winning path runs down the left edge.
function layoutTree(nodes) {
  const children = new Map();
  let root = null;
  for (const n of nodes) {
    if (!n.parent) root = n;
    else {
      if (!children.has(n.parent)) children.set(n.parent, []);
      children.get(n.parent).push(n);
    }
  }
  if (!root) return new Map();

  const x = new Map();
  let nextSlot = 0;
  (function place(n) {
    const kids = (children.get(n._id) || []).sort((a, b) => b.isCanon - a.isCanon);
    if (!kids.length) {
      x.set(n._id, nextSlot++);
    } else {
      kids.forEach(place);
      x.set(n._id, (x.get(kids[0]._id) + x.get(kids[kids.length - 1]._id)) / 2);
    }
  })(root);
  return x;
}

function ParagraphNode({ data }) {
  const { node, pending, selected } = data;
  const style = node.isCanon
    ? 'border-ghost bg-ghost/10'
    : pending
      ? 'border-dashed border-ghost-dim bg-mist'
      : 'border-line bg-mist opacity-55';
  return (
    <div
      className={`cursor-pointer rounded-lg border p-3 text-left transition ${style} ${selected ? 'ring-2 ring-ghost' : ''}`}
      style={{ width: NODE_W }}
    >
      <Handle type="target" position={Position.Top} className="!opacity-0" />
      <div className="mb-1 flex justify-between text-[10px] uppercase tracking-wider text-faded">
        <span>{node.round === 0 ? 'Opening' : `Round ${node.round}`}</span>
        <span>{node.isCanon ? '★ canon' : pending ? 'voting' : '👻 ghost'}</span>
      </div>
      <p className="line-clamp-3 font-serif text-xs leading-snug text-paper">{node.content}</p>
      <div className="mt-2 flex justify-between text-[10px] text-faded">
        <span>{node.author.username}</span>
        {node.round > 0 && <span>▲ {node.voteCount}</span>}
      </div>
      <Handle type="source" position={Position.Bottom} className="!opacity-0" />
    </div>
  );
}

const nodeTypes = { paragraph: ParagraphNode };

export default function TreeView() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    api(`/stories/${id}/tree`)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [id]);

  const { nodes, edges } = useMemo(() => {
    if (!data) return { nodes: [], edges: [] };
    const xs = layoutTree(data.nodes);
    const isPending = (n) => data.story.status === 'active' && n.round === data.story.currentRound;
    return {
      nodes: data.nodes.map((n) => ({
        id: n._id,
        type: 'paragraph',
        position: { x: (xs.get(n._id) ?? 0) * (NODE_W + X_GAP), y: n.round * Y_GAP },
        data: { node: n, pending: isPending(n), selected: n._id === selectedId },
      })),
      edges: data.nodes
        .filter((n) => n.parent)
        .map((n) => ({
          id: `${n.parent}-${n._id}`,
          source: n.parent,
          target: n._id,
          animated: isPending(n),
          style: { stroke: n.isCanon ? 'var(--color-ghost)' : 'var(--color-line)', strokeWidth: n.isCanon ? 2 : 1 },
        })),
    };
  }, [data, selectedId]);

  if (error) return <ErrorBox message={error} />;
  if (!data) return <Spinner />;

  const selected = data.nodes.find((n) => n._id === selectedId);
  const ghostCount = data.nodes.filter((n) => !n.isCanon && n.round > 0).length;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link to={`/stories/${id}`} className="text-sm text-faded hover:text-ghost">
            ← Back to the story
          </Link>
          <h1 className="font-display text-4xl font-semibold">{data.story.title}</h1>
          <p className="text-sm text-faded">
            {data.nodes.length} paragraphs · {ghostCount} ghost branches. Click any paragraph to read it.
          </p>
        </div>
        <div className="flex gap-4 text-xs text-faded">
          <span>
            <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-ghost" /> canon
          </span>
          <span>
            <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm border border-dashed border-ghost-dim" /> voting now
          </span>
          <span>
            <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-line" /> ghost branch
          </span>
        </div>
      </div>

      <div className="card relative h-[70vh] overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={(_, node) => setSelectedId(node.id)}
          onPaneClick={() => setSelectedId(null)}
          nodesDraggable={false}
          nodesConnectable={false}
          fitView
          fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
          minZoom={0.2}
          colorMode="dark"
        >
          <Background color="#2b2f3d" gap={24} />
          <Controls showInteractive={false} />
        </ReactFlow>

        {selected && (
          <aside className="absolute bottom-4 right-4 z-10 max-h-[60%] w-80 overflow-y-auto rounded-xl border border-line bg-night/95 p-5 shadow-2xl backdrop-blur">
            <div className="mb-2 flex justify-between text-xs text-faded">
              <span>{selected.round === 0 ? 'Opening' : `Round ${selected.round}`}</span>
              <button onClick={() => setSelectedId(null)} className="hover:text-paper">
                ✕
              </button>
            </div>
            <p className="font-serif leading-relaxed">{selected.content}</p>
            <p className="mt-3 text-xs text-faded">
              — {selected.author.username}
              {selected.round > 0 && ` · ${selected.voteCount} votes`}
            </p>
          </aside>
        )}
      </div>
    </div>
  );
}
