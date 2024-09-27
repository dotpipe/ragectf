class CTFBot {
    constructor(game, color, difficulty = 1) {
        this.game = game;
        this.color = color;
        this.moveCache = new MoveCache();
        this.setDifficulty(difficulty);
        this.combinedMoveDepth = Math.min(difficulty, 3); // Cap at 3 for performance
    }

    makeMove() {
            const bestMove = this.findbestmove();
            if (bestMove) {
                console.log(`Bot moving from (${bestMove.from.row}, ${bestMove.from.col}) to (${bestMove.to.row}, ${bestMove.to.col})`);
                this.game.makeMove(bestMove.from, bestMove.to);
                return bestMove;
            } else {
                console.log("No valid move found. Selecting random move.");
                const randomMove = this.getRandomMove();
                if (randomMove) {
                    this.game.makeMove(randomMove.from, randomMove.to);
                    return randomMove;
                }
            }
            console.log("No moves available. Game might be in a stalemate.");
            return null;
        
        // const bestMove = this.findbestmove();
        if (bestMove) {
            console.log(`Bot making move from (${bestMove.from.row}, ${bestMove.from.col}) to (${bestMove.to.row}, ${bestMove.to.col})`);
            this.game.selectPiece = bestMove.from;
            this.game.moveTo = bestMove.to;
            this.game.makeMove(bestMove.from, bestMove.to);
            this.game.print_board(); // Add this line to update the visual board
        } else {
            console.log("Bot couldn't find a valid move");
        }
        return bestMove;
    }
    getRandomMove() {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.game.board[row][col];
                if (piece && piece.color === this.color) {
                    const moves = this.getValidMovesForPiece(row, col);
                    if (moves.length > 0) {
                        const randomTo = moves[Math.floor(Math.random() * moves.length)];
                        return { from: {row, col}, to: randomTo };
                    }
                }
            }
        }
        return null;
    }

    setDifficulty(depth) {
        this.depth = depth;
    }
    // findbestmove() {
    //     let bestMove = null;
    //     let bestScore = -Infinity;

    //     for (let row = 0; row < 8; row++) {
    //         for (let col = 0; col < 8; col++) {
    //             const piece = this.game.board[row][col];
    //             if (piece && piece.color === this.color) {
    //                 for (let toRow = 0; toRow < 8; toRow++) {
    //                     for (let toCol = 0; toCol < 8; toCol++) {
    //                         const from = { row, col };
    //                         const to = { row: toRow, col: toCol };
    //                         if (this.game.isValidMove(from, to)) {
    //                             const score = this.evaluateMoveWithDepth(from, to);
    //                             if (score > bestScore) {
    //                                 bestScore = score;
    //                                 bestMove = { from, to };
    //                             }
    //                         }
    //                     }
    //                 }
    //             }
    //         }
    //     }
    //     return bestMove;
    // }

    // findbestmove() {
    //     let bestMove = null;
    //     let bestScore = -Infinity;
    //     let validMoves = [];

    //     for (let row = 0; row < 8; row++) {
    //         for (let col = 0; col < 8; col++) {
    //             const piece = this.game.board[row][col];
    //             if (piece && piece.color === this.color) {
    //                 for (let toRow = 0; toRow < 8; toRow++) {
    //                     for (let toCol = 0; toCol < 8; toCol++) {
    //                         const from = { row, col };
    //                         const to = { row: toRow, col: toCol };
    //                         if (this.game.isValidMove(from, to)) {
    //                             validMoves.push({ from, to });
    //                             const score = this.evaluateMove(from, to);
    //                             if (score > bestScore) {
    //                                 bestScore = score;
    //                                 bestMove = { from, to };
    //                             }
    //                         }
    //                     }
    //                 }
    //             }
    //         }
    //     }

    //     console.log(`Bot found ${validMoves.length} valid moves`);
    //     return bestMove || (validMoves.length > 0 ? validMoves[Math.floor(Math.random() * validMoves.length)] : null);
    // }
    findbestmove() {
        console.log("Starting findbestmove");
        let allValidMoves = [];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.game.board[row][col];
                if (piece && piece.color === this.color) {
                    console.log(`Checking piece at ${row},${col}: ${piece.type}`);
                    const moves = this.getValidMovesForPiece(row, col);
                    console.log(`Found ${moves.length} moves for piece at ${row},${col}`);
                    allValidMoves = allValidMoves.concat(moves.map(to => ({ from: { row, col }, to })));
                }
            }
        }
        if (allValidMoves.length === 0) {
            return null;
        }

        // Evaluate and select the best move
        let bestMove = allValidMoves[0];
        let bestScore = -Infinity;
        for (const move of allValidMoves) {
            const score = this.evaluateMove(move.from, move.to);
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }

        return bestMove;
    }


    getValidMovesForPiece(row, col) {
        const piece = this.game.board[row][col];
        if (!piece) return [];
    
        const validMoves = [];
        const directions = {
            'P': [[-1, 0], [-1, -1], [-1, 1], [1, 0], [1, -1], [1, 1]],
            'R': [[-1, 0], [1, 0], [0, -1], [0, 1]],
            'N': [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]],
            'B': [[-1, -1], [-1, 1], [1, -1], [1, 1]],
            'T': [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]],
            'K': [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]
        };
    
        const moves = directions[piece.type] || [];
        for (const [dx, dy] of moves) {
            let newRow = row + dx;
            let newCol = col + dy;
            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                if (this.game.isValidMove({row, col}, {row: newRow, col: newCol})) {
                    validMoves.push({row: newRow, col: newCol});
                }
            }
        }
    
        console.log(`Found ${validMoves.length} valid moves for ${piece.type} at ${row},${col}`);
        return validMoves;
    }
    


    findCombinedMoves(depth = this.combinedMoveDepth) {
        if (depth <= 1) return this.findbestmove();

        let bestCombination = null;
        let bestScore = -Infinity;

        const initialMoves = this.getAllPossibleMoves();

        for (const move of initialMoves) {
            const tempBoard = JSON.parse(JSON.stringify(this.game.board));
            this.game.makeMove(move.from, move.to);

            const nextMoves = this.findCombinedMoves(depth - 1);
            const combinedScore = this.evaluateMove(move.from, move.to) + (nextMoves ? this.evaluateMove(nextMoves.from, nextMoves.to) : 0);

            if (combinedScore > bestScore) {
                bestScore = combinedScore;
                bestCombination = [move, nextMoves];
            }

            this.game.board = tempBoard;
        }

        return bestCombination;
    }

    evaluateMoveWithDepth(from, to, depth) {
        if (depth === 0) return this.evaluateMove(from, to);

        const tempBoard = JSON.parse(JSON.stringify(this.game.board));
        // this.game.makeMove(from, to);

        let bestScore = -Infinity;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.game.board[row][col];
                if (piece && piece.color !== this.color) {
                    for (let toRow = 0; toRow < 8; toRow++) {
                        for (let toCol = 0; toCol < 8; toCol++) {
                            if (this.game.isValidMove({ row, col }, { row: toRow, col: toCol })) {
                                const score = -this.evaluateMoveWithDepth({ row, col }, { row: toRow, col: toCol }, depth - 1);
                                bestScore = Math.max(bestScore, score);
                            }
                        }
                    }
                }
            }
        }

        this.game.board = tempBoard;
        return bestScore;
    }

    getAllPossibleMoves() {
        const moves = [];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.game.board[row][col];
                if (piece && piece.color === this.color) {
                    for (let toRow = 0; toRow < 8; toRow++) {
                        for (let toCol = 0; toCol < 8; toCol++) {
                            const from = { row, col };
                            const to = { row: toRow, col: toCol };
                            if (this.game.isValidMove(from, to)) {
                                moves.push({ from, to });
                            }
                        }
                    }
                }
            }
        }
        return moves;
    }

    evaluateMove(from, to) {
        const movingPiece = this.game.board[from.row][from.col];
        const targetPiece = this.game.board[to.row][to.col];
        let score = 0;

        // Prioritize capturing the opponent's flag
        if (targetPiece && targetPiece.color !== movingPiece.color && targetPiece.type === 'F') {
            score += 2000;
        }

        if (movingPiece && this.game.hasFlag(movingPiece) && targetPiece && targetPiece.type === 'K') {
            score += 3500;
        }
        // Prioritize moving towards the opponent's flag
        const opponentFlagPos = this.game.flags[this.getOpponentColor()].position;
        const distanceToFlag = Math.abs(to.row - opponentFlagPos[0]) + Math.abs(to.col - opponentFlagPos[1]);
        score += (14 - distanceToFlag) * 10;

        // Prioritize capturing opponent pieces
        if (targetPiece && targetPiece.color !== this.color) {
            score += this.getPieceValue(targetPiece.type);
        }

        // Prioritize protecting our own flag
        const ourFlagPos = this.game.flags[this.color].position;
        if (movingPiece.type === 'T') {
            const distanceToOurFlag = Math.abs(to.row - ourFlagPos[0]) + Math.abs(to.col - ourFlagPos[1]);
            score += (7 - distanceToOurFlag) * 5;
        }

        // Avoid moving into positions where the piece can be captured
        if (this.isVulnerable(to)) {
            score -= this.getPieceValue(movingPiece.type);
        }

        return score;
    }

    getOpponentColor() {
        return this.color === 'White' ? 'Black' : 'White';
    }

    isVulnerable(position) {
        // Check if the position can be captured by any opponent piece
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.game.board[row][col];
                if (piece && piece.color !== this.color) {
                    if (this.game.isValidMove({ row, col }, position)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    getPieceValue(pieceType) {
        const values = {
            'P': 10,
            'R': 50,
            'N': 30,
            'B': 30,
            'T': 40
        };
        return values[pieceType] || 0;
    }
}
