import axios from "axios";

export const handleSolvePuzzle = async (puzzle) => {
  try {
    const response = await axios.post("http://localhost:5000/solve-puzzle", {
      puzzle,
    });
    return response.data;
  } catch (error) {
    console.error("Error solving puzzle:", error);
  }
};
