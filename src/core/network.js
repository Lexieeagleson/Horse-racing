import { database, ref, set, onValue, update, remove, get, onDisconnect, serverTimestamp, isFirebaseConfigured } from './firebase';

// Generate a 4-digit room code
const generateRoomCode = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// Generate a unique player ID
const generatePlayerId = () => {
  return 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// Create a new room
export const createRoom = async (hostName, hostAvatar) => {
  let roomCode = generateRoomCode();
  const playerId = generatePlayerId();
  
  // Check if room exists and generate new code if it does
  let attempts = 0;
  while (attempts < 10) {
    const snapshot = await get(ref(database, `rooms/${roomCode}`));
    if (!snapshot.exists()) break;
    roomCode = generateRoomCode();
    attempts++;
  }

  const roomData = {
    code: roomCode,
    hostId: playerId,
    status: 'lobby', // lobby, racing, finished
    settings: {
      viewMode: 'lane', // 'lane' or 'birdsEye'
      gameMode: 'random', // 'trivia', 'buttonMash', 'random'
      maxPlayers: 14
    },
    players: {
      [playerId]: {
        id: playerId,
        name: hostName,
        avatar: hostAvatar,
        isHost: true,
        progress: 0,
        speed: 0,
        connected: true,
        lastUpdate: serverTimestamp()
      }
    },
    race: null,
    createdAt: serverTimestamp()
  };

  await set(ref(database, `rooms/${roomCode}`), roomData);
  
  // Set up disconnect handler
  const playerRef = ref(database, `rooms/${roomCode}/players/${playerId}`);
  onDisconnect(playerRef).update({ connected: false });

  return { roomCode, playerId };
};

// Join an existing room
export const joinRoom = async (roomCode, playerName, playerAvatar) => {
  const roomRef = ref(database, `rooms/${roomCode}`);
  const snapshot = await get(roomRef);

  if (!snapshot.exists()) {
    throw new Error('Room not found');
  }

  const roomData = snapshot.val();
  
  if (roomData.status !== 'lobby') {
    throw new Error('Race already in progress');
  }

  const playerCount = Object.keys(roomData.players || {}).length;
  if (playerCount >= roomData.settings.maxPlayers) {
    throw new Error('Room is full');
  }

  const playerId = generatePlayerId();
  const playerData = {
    id: playerId,
    name: playerName,
    avatar: playerAvatar,
    isHost: false,
    progress: 0,
    speed: 0,
    connected: true,
    lastUpdate: serverTimestamp()
  };

  await set(ref(database, `rooms/${roomCode}/players/${playerId}`), playerData);
  
  // Set up disconnect handler
  const playerRef = ref(database, `rooms/${roomCode}/players/${playerId}`);
  onDisconnect(playerRef).update({ connected: false });

  return { roomCode, playerId };
};

// Leave a room
export const leaveRoom = async (roomCode, playerId, isHost) => {
  if (isHost) {
    // If host leaves, delete the room
    await remove(ref(database, `rooms/${roomCode}`));
  } else {
    await remove(ref(database, `rooms/${roomCode}/players/${playerId}`));
  }
};

// Update room settings (host only)
export const updateRoomSettings = async (roomCode, settings) => {
  await update(ref(database, `rooms/${roomCode}/settings`), settings);
};

// Start the race (host only)
export const startRace = async (roomCode) => {
  const roomRef = ref(database, `rooms/${roomCode}`);
  const snapshot = await get(roomRef);
  const roomData = snapshot.val();
  
  // Initialize race state
  const players = roomData.players || {};
  const raceState = {
    startTime: Date.now(),
    endTime: null,
    winner: null,
    rankings: []
  };

  // Reset all players' progress
  const playerUpdates = {};
  Object.keys(players).forEach(id => {
    playerUpdates[`players/${id}/progress`] = 0;
    playerUpdates[`players/${id}/speed`] = 1;
  });

  await update(ref(database, `rooms/${roomCode}`), {
    status: 'racing',
    race: raceState,
    ...playerUpdates
  });
};

// Update player progress
export const updatePlayerProgress = async (roomCode, playerId, progress, speed) => {
  await update(ref(database, `rooms/${roomCode}/players/${playerId}`), {
    progress: Math.min(100, Math.max(0, progress)),
    speed,
    lastUpdate: serverTimestamp()
  });
};

// End the race
export const endRace = async (roomCode, winner, rankings) => {
  await update(ref(database, `rooms/${roomCode}`), {
    status: 'finished',
    'race/endTime': Date.now(),
    'race/winner': winner,
    'race/rankings': rankings
  });
};

// Return to lobby
export const returnToLobby = async (roomCode) => {
  const roomRef = ref(database, `rooms/${roomCode}`);
  const snapshot = await get(roomRef);
  const roomData = snapshot.val();
  
  // Reset all players' progress
  const players = roomData.players || {};
  const playerUpdates = {};
  Object.keys(players).forEach(id => {
    playerUpdates[`players/${id}/progress`] = 0;
    playerUpdates[`players/${id}/speed`] = 0;
  });

  await update(ref(database, `rooms/${roomCode}`), {
    status: 'lobby',
    race: null,
    ...playerUpdates
  });
};

// Subscribe to room updates
export const subscribeToRoom = (roomCode, callback) => {
  const roomRef = ref(database, `rooms/${roomCode}`);
  return onValue(roomRef, (snapshot) => {
    const data = snapshot.val();
    callback(data);
  });
};

// Send trivia answer
export const sendTriviaAnswer = async (roomCode, playerId, questionId, answer, isCorrect) => {
  await update(ref(database, `rooms/${roomCode}/players/${playerId}`), {
    lastAnswer: { questionId, answer, isCorrect, timestamp: Date.now() }
  });
};

// Update room with current trivia question
export const setCurrentTrivia = async (roomCode, triviaData) => {
  await update(ref(database, `rooms/${roomCode}`), {
    currentTrivia: triviaData
  });
};

// Send button mash input
export const sendTapInput = async (roomCode, playerId, tapCount) => {
  await update(ref(database, `rooms/${roomCode}/players/${playerId}`), {
    tapCount,
    lastTap: serverTimestamp()
  });
};

export { generatePlayerId, generateRoomCode, isFirebaseConfigured };
