const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 5000;

app.use(cors()); // Enable CORS for all routes
app.use(bodyParser.json());

const directions = [
    { row: 1, col: 0 },  // down
    { row: -1, col: 0 },  // up
    { row: 0, col: 1 },  // right
    { row: 0, col: -1 }  // left
];
const solvedPuzzle = [[1, 2, 3], [4, 5, 6], [7, 8, 0]]; // Target solved state

let previousState = new Map(); // Tracks previous state leading to each state
let moveFromPrevious = new Map(); // Tracks move that led to each state

// Helper function to find the zero (empty tile) position
function findZero(puzzle) {
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (puzzle[i][j] === 0) {
                return { row: i, col: j };
            }
        }
    }
}

// Heuristic function (Manhattan Distance)
function heuristic(puzzle) {
    let h = 0;
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            const tile = puzzle[i][j];
            if (tile !== 0) {
                const goalRow = Math.floor((tile - 1) / 3);
                const goalCol = (tile - 1) % 3;
                h += Math.abs(goalRow - i) + Math.abs(goalCol - j);
            }
        }
    }
    return h;
}

// A* algorithm function
function solvePuzzleAStar(initialPuzzle) {
    const openList = [];
    const visitedMap = new Set();

    const startNode = {
        puzzle: initialPuzzle,
        g: 0,  // cost to reach the node
        h: heuristic(initialPuzzle),  // heuristic cost to goal
        zeroPos: findZero(initialPuzzle),
        parent: null
    };
    startNode.f = startNode.g + startNode.h;
    openList.push(startNode);
    previousState.set(initialPuzzle.toString(), null);
    moveFromPrevious.set(initialPuzzle.toString(), []);

    while (openList.length > 0) {
        // Sort openList based on the f value (lowest first) and pick the first node
        openList.sort((a, b) => a.f - b.f);
        const current = openList.shift();

        // Check if the puzzle is solved
        if (JSON.stringify(current.puzzle) === JSON.stringify(solvedPuzzle)) {
            const moves = [];
            let state = current;
            while (state.parent !== null) {
                moves.push(moveFromPrevious.get(state.puzzle.toString()));
                state = previousState.get(state.puzzle.toString());
            }
            return { solved: true, moves: moves.reverse() };
        }

        // Mark current state as visited
        visitedMap.add(current.puzzle.toString());

        // Generate neighbors (possible moves)
        for (const dir of directions) {
            const newRow = current.zeroPos.row + dir.row;
            const newCol = current.zeroPos.col + dir.col;

            // Check if the new position is within bounds
            if (newRow >= 0 && newRow < 3 && newCol >= 0 && newCol < 3) {
                const newPuzzle = current.puzzle.map(row => row.slice());  // Deep copy
                [newPuzzle[current.zeroPos.row][current.zeroPos.col], newPuzzle[newRow][newCol]] =
                    [newPuzzle[newRow][newCol], newPuzzle[current.zeroPos.row][current.zeroPos.col]];

                // Skip if already visited
                if (!visitedMap.has(newPuzzle.toString())) {
                    const newG = current.g + 1;
                    const newH = heuristic(newPuzzle);
                    const neighborNode = {
                        puzzle: newPuzzle,
                        g: newG,
                        h: newH,
                        f: newG + newH,
                        zeroPos: { row: newRow, col: newCol },
                        parent: current
                    };
                    openList.push(neighborNode);
                    previousState.set(newPuzzle.toString(), current);
                    moveFromPrevious.set(newPuzzle.toString(), [newRow, newCol]);
                }
            }
        }
    }

    return { solved: false, moves: [] };
}

// POST API to receive puzzle input and solve it using A* algorithm
app.post('/solve-puzzle', (req, res) => {
    const initialPuzzle = req.body.puzzle;

    // Validate input
    if (!initialPuzzle || initialPuzzle.length !== 3 || !initialPuzzle.every(row => row.length === 3)) {
        return res.status(400).json({ error: 'Invalid puzzle input. Must be a 3x3 grid.' });
    }

    // Clear previous state maps for new puzzle
    previousState.clear();
    moveFromPrevious.clear();

    // Solve the puzzle using A* algorithm
    const result = solvePuzzleAStar(initialPuzzle);

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
