const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());

const directionsX = [1, 1, 0, 0]; // Movement directions for rows
const directionsY = [0, 0, 1, -1]; // Movement directions for columns
const solvedPuzzle = [[1, 2, 3], [4, 5, 6], [7, 8, 0]]; // Target solved state

// Hash function for puzzle state
function hashPuzzle(puzzle) {
    return puzzle.flat().join(',');
}

// Compare the current puzzle state with the solved state
function isSolved(currentPuzzle) {
    return hashPuzzle(currentPuzzle) === hashPuzzle(solvedPuzzle);
}

// Generate neighboring states and track the move made
function generateNeighbors(currentPuzzle, emptyTilePos) {
    const neighbors = [];
    const [emptyRow, emptyCol] = emptyTilePos;

    for (let i = 0; i < 4; i++) {
        const newX = emptyRow + directionsX[i];
        const newY = emptyCol + directionsY[i];

        if (newX >= 0 && newX < 3 && newY >= 0 && newY < 3) {
            const newPuzzle = currentPuzzle.map(row => row.slice()); // Deep copy of the puzzle
            // Swap the empty tile (0) with the neighbor
            [newPuzzle[emptyRow][emptyCol], newPuzzle[newX][newY]] = [newPuzzle[newX][newY], newPuzzle[emptyRow][emptyCol]];
            neighbors.push({ puzzle: newPuzzle, move: [newY, newX], newEmptyPos: [newX, newY] });
        }
    }

    return neighbors;
}

// BFS function to solve the puzzle
function solvePuzzle(initialPuzzle, initialEmptyPos) {
    const queue = [];
    const visited = new Set();
    
    const initialHash = hashPuzzle(initialPuzzle);
    queue.push({ puzzle: initialPuzzle, emptyPos: initialEmptyPos, path: [] });
    visited.add(initialHash);

    while (queue.length > 0) {
        const { puzzle: currentPuzzle, emptyPos: currentEmptyPos, path: currentPath } = queue.shift();

        // Check if the puzzle is solved
        if (isSolved(currentPuzzle)) {
            return { solved: true, moves: currentPath };
        }

        // Generate neighboring states
        const neighbors = generateNeighbors(currentPuzzle, currentEmptyPos);

        for (const neighbor of neighbors) {
            const neighborHash = hashPuzzle(neighbor.puzzle);
            if (!visited.has(neighborHash)) {
                visited.add(neighborHash);
                queue.push({
                    puzzle: neighbor.puzzle,
                    emptyPos: neighbor.newEmptyPos,
                    path: [...currentPath, neighbor.move] // Append new move to path
                });
            }
        }
    }

    return { solved: false, moves: [] };
}

// Find the empty tile (0) in the puzzle
function findEmptyTile(puzzle) {
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (puzzle[i][j] === 0) {
                return [i, j];
            }
        }
    }
    return null;
}

// POST API to receive puzzle input and solve it
app.post('/solve-puzzle', (req, res) => {
    const initialPuzzle = req.body.puzzle;

    // Validate input
    if (!initialPuzzle || initialPuzzle.length !== 3 || !initialPuzzle.every(row => row.length === 3)) {
        return res.status(400).json({ error: 'Invalid puzzle input. Must be a 3x3 grid.' });
    }

    // Find the position of the empty tile (0)
    const initialEmptyPos = findEmptyTile(initialPuzzle);

    // Solve the puzzle
    const result = solvePuzzle(initialPuzzle, initialEmptyPos);

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
