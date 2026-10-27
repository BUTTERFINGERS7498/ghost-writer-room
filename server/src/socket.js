import { Server } from 'socket.io';

let io;

const room = (storyId) => `story:${storyId}`;

function broadcastPresence(storyId) {
  const count = io.sockets.adapter.rooms.get(room(storyId))?.size ?? 0;
  io.to(room(storyId)).emit('presence', count);
}

export function initSocket(server, origin) {
  io = new Server(server, { cors: { origin } });

  io.on('connection', (socket) => {
    socket.on('story:join', (storyId) => {
      if (typeof storyId !== 'string') return;
      socket.join(room(storyId));
      broadcastPresence(storyId);
    });

    socket.on('story:leave', (storyId) => {
      if (typeof storyId !== 'string') return;
      socket.leave(room(storyId));
      broadcastPresence(storyId);
    });

    socket.on('disconnecting', () => {
      for (const r of socket.rooms) {
        if (r.startsWith('story:')) setImmediate(() => broadcastPresence(r.slice('story:'.length)));
      }
    });
  });
}

export function emitToStory(storyId, event, payload) {
  io?.to(room(String(storyId))).emit(event, payload);
}
