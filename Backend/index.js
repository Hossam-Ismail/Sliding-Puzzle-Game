const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 5000;

app.use(cors(
    {
        origin: 'https://slider-puzzle-game.vercel.app'
    }
));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const directionsX = [1, -1, 0, 0]; // Movement directions for rows
const directionsY = [0, 0, 1, -1]; // Movement directions for columns
const solvedPuzzle = [[1, 2, 3], [4, 5, 6], [7, 8, 0]]; // Target solved state

let previousState = new Map(); // Tracks previous state leading to each state
let moveFromPrevious = new Map(); // Tracks move that led to each state

// Compare the current puzzle state with the solved state
function isSolved(currentPuzzle) {
    return JSON.stringify(currentPuzzle) === JSON.stringify(solvedPuzzle);
}

// Generate neighboring states and track the move made
function generateNeighbors(currentPuzzle, emptyTilePos) {
    const neighbors = [];

    for (let i = 0; i < 4; i++) {
        const newX = emptyTilePos[0] + directionsX[i];
        const newY = emptyTilePos[1] + directionsY[i];

        if (newX >= 0 && newX < 3 && newY >= 0 && newY < 3) {
            const newPuzzle = JSON.parse(JSON.stringify(currentPuzzle)); // Deep copy the current puzzle
            // Swap the empty tile (0) with the neighbor
            [newPuzzle[emptyTilePos[0]][emptyTilePos[1]], newPuzzle[newX][newY]] = [newPuzzle[newX][newY], newPuzzle[emptyTilePos[0]][emptyTilePos[1]]];
            neighbors.push({ puzzle: newPuzzle, move: [newY, newX] }); // Store the index of the moved tile
        }
    }

    return neighbors;
}

// BFS function to solve the puzzle
function solvePuzzle(initialPuzzle) {
    const queue = [];
    queue.push(initialPuzzle);
    previousState.set(initialPuzzle.toString(), null);
    moveFromPrevious.set(initialPuzzle.toString(), []);

    while (queue.length > 0) {
        const currentPuzzle = queue.shift();

        // Check if the puzzle is solved
        if (isSolved(currentPuzzle)) {
            // Reconstruct the path
            const moves = [];
            let currentState = currentPuzzle.toString();

            while (currentState !== initialPuzzle.toString()) {
                moves.push(moveFromPrevious.get(currentState));
                currentState = previousState.get(currentState).toString();
            }

            return { solved: true, moves: moves.reverse() };
        }

        // Find the position of the empty tile (0)
        let emptyTilePos;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (currentPuzzle[i][j] === 0) {
                    emptyTilePos = [i, j];
                }
            }
        }

        // Generate neighboring states
        const neighbors = generateNeighbors(currentPuzzle, emptyTilePos);

        for (const neighbor of neighbors) {
            const neighborStr = neighbor.puzzle.toString();
            if (!previousState.has(neighborStr)) {
                queue.push(neighbor.puzzle);
                previousState.set(neighborStr, currentPuzzle);
                moveFromPrevious.set(neighborStr, neighbor.move); // Store the move that led to this state
            }
        }
    }

    return { solved: false, moves: [] };
}

// POST API to receive puzzle input and solve it
app.post('/solve-puzzle', (req, res) => {
    const initialPuzzle = req.body.puzzle;

    // Validate input
    if (!initialPuzzle || initialPuzzle.length !== 3 || !initialPuzzle.every(row => row.length === 3)) {
        return res.status(400).json({ error: 'Invalid puzzle input. Must be a 3x3 grid.' });
    }

    // Clear previous state maps for new puzzle
    previousState.clear();
    moveFromPrevious.clear();

    // Solve the puzzle
    const result = solvePuzzle(initialPuzzle);

    // Return the result as a response
    if (result.solved) {
        res.json({ message: 'Puzzle solved!', moves: result.moves });
    } else {
        res.json({ message: 'No solution found.' });
    }
});

app.listen(port, () => {
    console.log(`Puzzle solver API listening at http://localhost:${port}`);
});
