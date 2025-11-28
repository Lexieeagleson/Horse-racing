# 🏇 Horse Racing - Multiplayer Mobile Game

A mobile-friendly, multiplayer web-based racing game where each player uses their own phone. One person hosts a game, generates a 4-digit room code, and up to 14 players can join from their devices.

## Features

- **Multiplayer**: Up to 14 players can race together
- **Mobile-First**: Optimized for iOS and Android browsers
- **Real-time Sync**: Uses Firebase Realtime Database
- **Multiple Game Modes**:
  - 🎲 **Random Mode**: Watch racers with random speed boosts and stumbles
  - 🧠 **Trivia Mode**: Answer questions for speed boosts
  - 👆 **Button Mash Mode**: Tap as fast as you can!
- **Two View Modes**:
  - Lane View: Traditional side-scrolling race
  - Birds-Eye View: Oval track from above
- **Custom Avatars**: Upload your own or choose from presets

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- A Firebase account (for multiplayer functionality)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Lexieeagleson/Horse-racing.git
cd Horse-racing
```

2. Install dependencies:
```bash
npm install
```

3. Set up Firebase:
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create a new project
   - Enable Realtime Database
   - Set database rules to allow read/write:
   ```json
   {
     "rules": {
       ".read": true,
       ".write": true
     }
   }
   ```
   - Copy your Firebase config

4. Create a `.env` file in the project root:
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

5. Run the development server:
```bash
npm run dev
```

6. Open your browser to `http://localhost:5173`

## Deployment to GitHub Pages

The project is configured for automatic deployment to GitHub Pages via GitHub Actions.

1. Push your changes to the `main` branch
2. The workflow will automatically build and deploy to GitHub Pages
3. Access your game at `https://yourusername.github.io/Horse-racing/`

### Manual Deployment

```bash
npm run build
```

The built files will be in the `dist` folder, ready for static hosting.

## How to Play

### Hosting a Game
1. Open the game on your phone
2. Enter your name and choose an avatar
3. Tap "Host Game"
4. Share the 4-digit code with friends
5. Choose game mode and view settings
6. Tap "Start Race" when everyone is ready

### Joining a Game
1. Open the game on your phone
2. Enter your name and choose an avatar
3. Enter the 4-digit room code
4. Tap "Join"
5. Wait for the host to start the race

## Project Structure

```
/src
├── core/
│   ├── firebase.js      # Firebase configuration
│   ├── network.js       # Room & multiplayer sync
│   └── raceEngine.js    # Core race logic
├── modes/
│   ├── triviaMode.js    # Trivia game logic
│   ├── buttonMashMode.js # Tap race logic
│   └── randomMode.js    # Random events logic
├── state/
│   └── GameContext.jsx  # Global state management
├── ui/
│   ├── menu/            # Main menu screens
│   ├── lobby/           # Pre-race lobby
│   ├── race/            # Race UI & HUD
│   └── results/         # Results screen
├── views/
│   ├── laneView.jsx     # Lane-based renderer
│   └── birdsEyeView.jsx # Birds-eye renderer
└── components/
    └── AvatarSelector.jsx # Avatar selection
```

## Future Enhancements

- 🎨 More avatar customization
- 🏆 Online tournaments
- 🎭 Track themes
- ⚡ Power-ups and items
- 📊 Statistics and leaderboards

## License

MIT License - see LICENSE file for details.
