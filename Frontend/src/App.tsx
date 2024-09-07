import "./App.css";
import Board from "./components/Board";

function App() {
  return (
    <div className="App">
      <header className="App-header bg-[#040D12] min-h-[100vh] flex flex-col items-center justify-center text-center text-4xl md:text-5xl">
        <h1 className="text-white m-5">Slider Puzzle</h1>
        <Board />
      </header>
    </div>
  );
}

export default App;
