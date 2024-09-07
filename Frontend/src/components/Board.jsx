import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Box from "./Box";
import BoardLogic from "./BoardLogic";
import { handleSolvePuzzle } from "./SolveAPI";

const Board = ({ size = 3, data }) => {
  const [boardLogic, setBoardLogic] = useState(null);
  const [board, setBoard] = useState([]);
  const [moves, setMoves] = useState(0);
  const [isWin, setIsWin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [movedIndexes, setMovedIndexes] = useState([]);

  useEffect(() => {
    const initialBoardLogic = new BoardLogic(data || size);
    setBoardLogic(initialBoardLogic);
    setBoard(data ? initialBoardLogic.matrix : initialBoardLogic.scramble());
    setMoves(0);
    setIsWin(initialBoardLogic.checkWin());
    setMovedIndexes([]);
  }, [data, size]);

  const move = (i, j) => {
    if (isWin || !boardLogic) return;
    if (boardLogic.move(i, j)) {
      setBoard(boardLogic.matrix);
      setMoves((prevMoves) => prevMoves + 1);
      setIsWin(boardLogic.checkWin());
      setMovedIndexes((prevIndexes) => [...prevIndexes, [i, j]]); // Add the moved index
    }
  };

  const performAutoMoves = async (moves) => {
    for (const [i, j] of moves) {
      move(i, j);
      await new Promise((resolve) => setTimeout(resolve, 300)); // Delay between moves
    }
  };

  const solvePuzzle = async () => {
    setLoading(true);
    const result = await handleSolvePuzzle(board);
    setLoading(false);
    if (result && result.moves) {
      performAutoMoves(result.moves);
    }
  };

  /**
   * returns a single slider row given the row data
   * @param {Object} rowData row data
   * @param {Number} i row number
   */
  const getRow = (rowData, j) => (
    <div key={j} className="flex justify-center">
      {rowData.map((bNum, i) => (
        <Box key={bNum} boxNumber={bNum} onClick={() => move(i, j)} />
      ))}
    </div>
  );

  const newGame = () => {
    const newBoardLogic = new BoardLogic(data || size);
    setBoardLogic(newBoardLogic);
    setBoard(data ? newBoardLogic.matrix : newBoardLogic.scramble());
    setMoves(0);
    setIsWin(newBoardLogic.checkWin());
    setMovedIndexes([]);
  };

  let rows = board.map(getRow);

  return (
    <div className="mt-4 w-full flex flex-col lg:flex-row justify-center items-center lg:items-start">
      {/* Main Puzzle Area */}
      <div className="flex flex-col items-center lg:ml-[28rem]">
        {rows}
        <div className="mt-5 flex justify-center">
          <button
            className="outline-0 m-5 text-base font-semibold text-white bg-[#5C8374] border-none px-16 py-4 transition-all duration-100 ease-out shadow-inner hover:bg-[#93B1A6] active:bg-[#b1f1da] rounded-lg"
            onClick={newGame}
          >
            New Game
          </button>
          <button
            className="outline-0 m-5 text-base font-semibold text-white bg-[#5C8374] border-none px-16 py-4 transition-all duration-100 ease-out shadow-inner hover:bg-[#93B1A6] active:bg-[#b1f1da] rounded-lg"
            onClick={solvePuzzle}
            disabled={loading}
          >
            {loading ? <div className="loader"></div> : "Solve"}
          </button>
        </div>

        <span className="block text-center font-bold text-2xl mt-4 text-white">
          Total Moves: {moves}
        </span>
        {isWin && (
          <span className="block text-center text-green-400 font-bold font-mono text-2xl mt-2">
            Congratulations! You've won!
          </span>
        )}
      </div>

      {/* Sidebar with Moves */}
      <div className="lg:ml-10 mt-10 lg:mt-0 min-h-[30rem] max-h-[30rem] min-w-[25rem] overflow-auto text-white p-5 rounded-lg bg-[#183D3D] shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Moves</h2>
        <div className="text-2xl space-y-2">
          {movedIndexes.length > 0 ? (
            movedIndexes.map(([i, j], index) => (
              <div
                key={index}
                className="bg-[#2E4E4E] p-2 rounded-md border border-[#4A7070] hover:bg-[#375E5E] transition-colors"
              >
                Move {index + 1}: Row {i}, Column {j}
              </div>
            ))
          ) : (
            <span className="font-mono">No moves yet</span>
          )}
        </div>
      </div>
    </div>
  );
};

Board.propTypes = {
  data: PropTypes.array,
  size: PropTypes.number,
};

export default Board;
