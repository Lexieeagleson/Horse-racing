import { GameProvider, useGame } from './state/GameContext';
import MainMenu from './ui/menu/MainMenu';
import Lobby from './ui/lobby/Lobby';
import LocalLobby from './ui/lobby/LocalLobby';
import RaceScreen from './ui/race/RaceScreen';
import Results from './ui/results/Results';
import './App.css';

// Main game router component
const GameRouter = () => {
  const { state } = useGame();

  switch (state.screen) {
    case 'menu':
      return <MainMenu />;
    case 'hosting':
    case 'joining':
    case 'lobby':
      return <Lobby />;
    case 'localLobby':
      return <LocalLobby />;
    case 'race':
      return <RaceScreen />;
    case 'results':
      return <Results />;
    default:
      return <MainMenu />;
  }
};

function App() {
  return (
    <GameProvider>
      <div className="app">
        <GameRouter />
      </div>
    </GameProvider>
  );
}

export default App;
