const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const PriorityQueue = require('priorityqueuejs'); // Import a priority queue library

const app = express();
const port = 5000;

app.use(cors()); // Enable CORS for all routes
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

// Calculate the Manhattan Distance heuristic
function heuristic(puzzle) {
    let h = 0;
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            const value = puzzle[i][j];
            if (value !== 0) {
                const targetRow = Math.floor((value - 1) / 3);
                const targetCol = (value - 1) % 3;
                h += Math.abs(targetRow - i) + Math.abs(targetCol - j);
            }
        }
    }
    return h;
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
            neighbors.push({ puzzle: newPuzzle, move: [newX, newY] }); // Store the position of the moved tile
        }
    }

    return neighbors;
}

// A* function to solve the puzzle
function solvePuzzle(initialPuzzle) {
    const openList = new PriorityQueue((a, b) => a.f - b.f); // Priority queue for open list
    const closedSet = new Set(); // Set to track visited states

    const initialState = {
        puzzle: initialPuzzle,
        g: 0, // Cost to reach this node
        h: heuristic(initialPuzzle), // Heuristic cost
        f: heuristic(initialPuzzle), // Total cost (g + h)
        emptyTilePos: findEmptyTilePos(initialPuzzle),
        parent: null
    };

    openList.enq(initialState);
    previousState.set(JSON.stringify(initialPuzzle), null);
    moveFromPrevious.set(JSON.stringify(initialPuzzle), []);

    while (!openList.isEmpty()) {
        const currentNode = openList.deq();

        // Check if the puzzle is solved
        if (isSolved(currentNode.puzzle)) {
            // Reconstruct the path
            const moves = [];
            let currentState = JSON.stringify(currentNode.puzzle);

            while (currentState !== JSON.stringify(initialPuzzle)) {
                moves.push(moveFromPrevious.get(currentState));
                currentState = JSON.stringify(previousState.get(currentState));
            }

            return { solved: true, moves: moves.reverse() };
        }

        // Add to closed set
        closedSet.add(JSON.stringify(currentNode.puzzle));

        // Generate neighboring states
        const neighbors = generateNeighbors(currentNode.puzzle, currentNode.emptyTilePos);

        for (const neighbor of neighbors) {
            const neighborStr = JSON.stringify(neighbor.puzzle);

            if (!closedSet.has(neighborStr)) {
                const g = currentNode.g + 1;
                const h = heuristic(neighbor.puzzle);
                const f = g + h;

                if (!previousState.has(neighborStr) || g < previousState.get(neighborStr).g) {
                    openList.enq({ ...neighbor, g, h, f, parent: currentNode });
                    previousState.set(neighborStr, currentNode.puzzle);
                    moveFromPrevious.set(neighborStr, neighbor.move); // Store the move that led to this state
                }
            }
        }
    }

    return { solved: false, moves: [] };
}

// Helper function to find the position of the empty tile (0)
function findEmptyTilePos(puzzle) {
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (puzzle[i][j] === 0) {
                return [i, j];
            }
        }
    }
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
