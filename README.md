# 👻 Ghost Writer Room

**A collaborative storytelling app where strangers write a story together, one paragraph per round.**

Each round, writers submit a continuation and the room votes. The winning paragraph becomes **canon**. The others don't disappear: they stay in the story's tree as **ghost branches**, which anyone can explore.

Built with the **MERN** stack (MongoDB, Express, React, Node.js) and Socket.io for real-time updates.

---

## Features

| Workflow | What it does |
|---|---|
| **Accounts** | Register and log in with JWT; passwords are hashed with bcrypt |
| **Start a story** | Title, genre, opening paragraph and rules (paragraph limit, round length, number of rounds) |
| **Write** | Submit one continuation per round, within the story's character limit |
| **Vote** | One vote per round. Voting for another entry moves your vote, clicking again removes it, and you can't vote for yourself |
| **Rounds** | When the timer ends, the top-voted entry becomes canon and the next round begins. If nobody wrote anything, the round is extended |
| **Live room** | New entries, vote counts, round results and the number of readers update live for everyone (Socket.io) |
| **Branch tree** | Interactive map of every paragraph ever written, with the canon path highlighted (React Flow) |
| **Explore** | Filter by genre and status, search titles, sort by newest or ending soon, paginate |
| **Profiles** | Entries, rounds won, win rate and stories started |

---

## Tech stack

- **Frontend:** React 19, Vite, React Router, Tailwind CSS v4, @xyflow/react, socket.io-client
- **Backend:** Node.js, Express 5, Mongoose, Socket.io, JWT, bcryptjs, Zod
- **Database:** MongoDB

---

## Design decisions

### 1. Storing the story tree
Each paragraph stores its `parent` **and** an `ancestors` array (the full path back to the opening paragraph):

```js
Paragraph { story, parent, ancestors: [ObjectId], author, content, round, voters, voteCount, isCanon }
```

To render the whole canon story, the server reads the latest canon paragraph and fetches `ancestors + itself` in **one query**, with no recursive tree walk. This is MongoDB's "array of ancestors" tree pattern.

### 2. Rounds close lazily, with no cron job
Rounds don't need a scheduler. Whenever a story is read, `settleRound()` checks whether `roundEndsAt` has passed and, if so, closes the round. The client refetches when its countdown hits zero, so the result appears right away.

### 3. Safe under concurrent requests
If two users load a story at the same moment, both may try to close the round. The close is a **conditional update**:

```js
Story.findOneAndUpdate({ _id, currentRound: round, roundEndsAt: oldDeadline, status: 'active' }, update)
```

Only one request can match, so a winner is never crowned twice.

### 4. One entry per user per round, enforced by the database
A unique compound index `{ story, round, author }` guarantees it, even if two requests arrive at the same time.

---

## API

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | | Create an account |
| POST | `/api/auth/login` | | Log in |
| GET | `/api/auth/me` | ✓ | Current user |
| GET | `/api/stories?genre=&status=&sort=&q=&page=` | | List stories |
| POST | `/api/stories` | ✓ | Create a story |
| GET | `/api/stories/:id` | | Story, canon text and current round entries |
| GET | `/api/stories/:id/tree` | | Every paragraph, for the tree view |
| POST | `/api/stories/:id/paragraphs` | ✓ | Submit an entry for the current round |
| POST | `/api/paragraphs/:id/vote` | ✓ | Vote, move a vote, or remove a vote |
| GET | `/api/users/:id` | | Public profile |

**Socket events** (room `story:<id>`): `entry:new`, `votes:updated`, `round:closed`, `presence`.

---

## Running locally

**Requirements:** Node.js 18+ and a MongoDB database (local, or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster).

```bash
# 1. Install everything
npm run install:all

# 2. Configure the server
cp server/.env.example server/.env
#    then edit server/.env: set MONGO_URI and a long random JWT_SECRET

# 3. Run the API (port 5000) and the client (port 5173) together
npm run dev
```

Open http://localhost:5173.

**Demo tip:** when creating a story, choose **"2 minutes (demo)"** as the round length to see a full round finish during a presentation.

---

## Deployment

- **Database:** MongoDB Atlas. Allow network access from your backend host.
- **Backend → Render** (Web Service): root directory `server`, build `npm install`, start `npm start`. Environment variables: `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL` (your frontend URL).
- **Frontend → Vercel:** root directory `client`, framework Vite. Environment variable: `VITE_API_URL` (your backend URL, e.g. `https://ghost-writer-api.onrender.com`). `client/vercel.json` is already included, so client-side routes work when the page is refreshed.

---

## Project structure

```
ghost-writer/
├── server/src/
│   ├── index.js              Express + Socket.io bootstrap
│   ├── socket.js             story rooms, presence, emit helper
│   ├── models/               User, Story, Paragraph
│   ├── controllers/          auth, story, paragraph, user
│   ├── routes/
│   ├── middleware/           auth (JWT), validate (Zod), schemas, error handler
│   ├── services/roundService.js   round settlement logic
│   └── utils/helpers.js
└── client/src/
    ├── api/client.js         fetch wrapper + socket
    ├── context/AuthContext.jsx
    ├── hooks/useCountdown.js
    ├── components/           Navbar, StoryCard, Countdown, Avatar, Spinner
    └── pages/                Home, Login, Register, CreateStory, StoryRoom, TreeView, Profile
```

## Possible extensions
- **"The Ghost" AI player** that writes an entry when a round gets no submissions
- Export a finished story as a PDF
- Emoji reactions on paragraphs and badges for writers
