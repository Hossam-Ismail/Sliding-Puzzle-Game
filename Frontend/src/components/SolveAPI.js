import axios from "axios";

const PUZZLE_SOLVE_API_URL = process.env.REACT_APP_PUZZLE_SOLVER_API;

export const handleSolvePuzzle = async (puzzle) => {
  try {
    const response = await axios.post(PUZZLE_SOLVE_API_URL, {
      puzzle,
    });
    return response.data;
  } catch (error) {
    console.error("Error solving puzzle:", error);
  }
};
