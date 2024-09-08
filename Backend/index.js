const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());

const directionsX = [1, -1, 0, 0]; // Movement directions for rows
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

// Generate neighboring states with in-place swap to avoid deep copy
function generateNeighbors(currentPuzzle, emptyTilePos) {
    const neighbors = [];
    const [emptyRow, emptyCol] = emptyTilePos;

    for (let i = 0; i < 4; i++) {
        const newX = emptyRow + directionsX[i];
        const newY = emptyCol + directionsY[i];

        if (newX >= 0 && newX < 3 && newY >= 0 && newY < 3) {
            // In-place swap the empty tile (0) with the neighbor
            [currentPuzzle[emptyRow][emptyCol], currentPuzzle[newX][newY]] = 
                [currentPuzzle[newX][newY], currentPuzzle[emptyRow][emptyCol]];
            
            neighbors.push({ 
                puzzle: currentPuzzle.map(row => row.slice()), // Save a copy for the neighbor
                move: [newy, newx], 
                newEmptyPos: [newX, newY] 
            });

            // Undo the swap for the next iteration
            [currentPuzzle[emptyRow][emptyCol], currentPuzzle[newX][newY]] = 
                [currentPuzzle[newX][newY], currentPuzzle[emptyRow][emptyCol]];
        }
    }

    return neighbors;
}

// Bidirectional BFS to solve the puzzle
function bidirectionalSolve(initialPuzzle, initialEmptyPos) {
    const queueStart = [];
    const queueEnd = [];
    const visitedStart = new Map();
    const visitedEnd = new Map();
    
    const initialHash = hashPuzzle(initialPuzzle);
    const solvedHash = hashPuzzle(solvedPuzzle);
    
    queueStart.push({ puzzle: initialPuzzle, emptyPos: initialEmptyPos, path: [] });
    queueEnd.push({ puzzle: solvedPuzzle, emptyPos: [2, 2], path: [] });
    
    visitedStart.set(initialHash, []);
    visitedEnd.set(solvedHash, []);

    while (queueStart.length > 0 && queueEnd.length > 0) {
        // Expand from the start
        const result = expandBFS(queueStart, visitedStart, visitedEnd, true);
        if (result) return { solved: true, moves: result };

        // Expand from the end
        const reverseResult = expandBFS(queueEnd, visitedEnd, visitedStart, false);
        if (reverseResult) return { solved: true, moves: reverseResult };
    }

    return { solved: false, moves: [] };
}

// BFS expansion function for bidirectional search
function expandBFS(queue, visitedCurrent, visitedOther, isForward) {
    const { puzzle: currentPuzzle, emptyPos: currentEmptyPos, path: currentPath } = queue.shift();

    // Generate neighbors
    const neighbors = generateNeighbors(currentPuzzle, currentEmptyPos);

    for (const neighbor of neighbors) {
        const neighborHash = hashPuzzle(neighbor.puzzle);
        if (!visitedCurrent.has(neighborHash)) {
            visitedCurrent.set(neighborHash, [...currentPath, neighbor.move]);

            if (visitedOther.has(neighborHash)) {
                const otherPath = visitedOther.get(neighborHash);
                return isForward ? [...currentPath, neighbor.move, ...otherPath.reverse()] : [...otherPath.reverse(), ...currentPath, neighbor.move];
            }

            queue.push({
                puzzle: neighbor.puzzle,
                emptyPos: neighbor.newEmptyPos,
                path: [...currentPath, neighbor.move]
            });
        }
    }
    return null;
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
    const result = bidirectionalSolve(initialPuzzle, initialEmptyPos);

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
