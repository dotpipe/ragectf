class CTFBot {
    constructor(game, color, difficulty = 1) {
        this.game = game;
        this.color = color;
        this.moveCache = new MoveCache();
        this.setDifficulty(difficulty);
        this.combinedMoveDepth = Math.min(difficulty, 3); // Cap at 3 for performance
    }

    makeMove() {
        this.color = this.game.currentPlayer; // Update the bot's color to the current player
        const bestMove = this.findCombinedMoves();
        if (bestMove && bestMove[0]) {
            console.log(`Bot (${this.color}) moving from (${bestMove[0].from.row}, ${bestMove[0].from.col}) to (${bestMove[0].to.row}, ${bestMove[0].to.col})`);
            this.game.makeMove(bestMove[0].from, bestMove[0].to);
            return bestMove[0];
        }
        const randomMove = this.getRandomMove();
        if (randomMove) {
            this.game.makeMove(randomMove.from, randomMove.to);
            return randomMove;
        }
        console.log("No moves available. Game might be in a stalemate.");
        return null;
    }

    getRandomMove() {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.game.board[row][col];
                if (piece && piece.color === this.color) {
                    const moves = this.getValidMovesForPiece(row, col);
                    if (moves.length > 0) {
                        const randomTo = moves[Math.floor(Math.random() * moves.length)];
                        return { from: { row, col }, to: randomTo };
                    }
                }
            }
        }
        return null;
    }

    setDifficulty(depth) {
        this.depth = depth;
    }

    findbestmove() {
        let allValidMoves = [];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.game.board[row][col];
                if (piece && piece.color === this.color) {
                    const moves = this.getValidMovesForPiece(row, col);
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

        return bestMove || allValidMoves[Math.floor(Math.random() * allValidMoves.length)];
    }

    evaluateMoveWithDepth(move, depth) {
        if (depth === 0) return this.evaluateMove(move.from, move.to);

        const tempBoard = JSON.parse(JSON.stringify(this.game.board));
        this.game.makeMove(move.from, move.to);

        let bestScore = this.color === 'White' ? -Infinity : Infinity;
        const opponentMoves = this.getAllValidMoves();

        for (const opponentMove of opponentMoves) {
            const score = this.evaluateMoveWithDepth(opponentMove, depth - 1);
            bestScore = this.color === 'White' ? Math.max(bestScore, score) : Math.min(bestScore, score);
        }

        this.game.board = tempBoard;
        return bestScore;
    }

    getAllValidMoves() {
        let allMoves = [];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.game.board[row][col];
                if (piece && piece.color === this.color) {
                    const moves = this.getValidMovesForPiece(row, col);
                    allMoves = allMoves.concat(moves.map(to => ({ from: { row, col }, to })));
                }
            }
        }
        return allMoves;
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
                if (this.game.isValidMove({ row, col }, { row: newRow, col: newCol })) {
                    validMoves.push({ row: newRow, col: newCol });
                }
            }
        }

        console.log(`Found ${validMoves.length} valid moves for ${piece.type} at ${row},${col}`);
        return validMoves;
    }

    findCombinedMoves(depth = this.combinedMoveDepth) {
        if (depth <= 1) return [this.findbestmove()];

        let bestCombination = null;
        let bestScore = -Infinity;

        const initialMoves = this.getAllValidMoves();

        for (const move of initialMoves) {
            const tempBoard = JSON.parse(JSON.stringify(this.game.board));
            this.game.makeMove(move.from, move.to);

            const nextMoves = this.findCombinedMoves(depth - 1);
            const combinedScore = this.evaluateMove(move.from, move.to) +
                nextMoves.reduce((sum, m) => sum + this.evaluateMove(m.from, m.to), 0);

            if (combinedScore > bestScore) {
                bestScore = combinedScore;
                bestCombination = [move, ...nextMoves];
            }

            this.game.board = tempBoard;
        }

        return bestCombination;
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

    findOpponentWithFlag() {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.game.board[row][col];
                if (piece && piece.color !== this.color && piece.hasFlag) {
                    return { row, col };
                }
            }
        }
        return null;
    }

    evaluateMove(from, to) {
        let score = 0;
        const movingPiece = this.game.board[from.row][from.col];
        const targetPiece = this.game.board[to.row][to.col];

        // Prioritize recapturing own flag and returning it to base
        if (targetPiece && targetPiece.color === this.color && targetPiece.type === 'F') {
            score += 1500;
            const basePos = this.game.baseStations[this.color];
            const distanceToBase = Math.abs(to.row - basePos[0]) + Math.abs(to.col - basePos[1]);
            score += (14 - distanceToBase) * 100;
        }

        // Prioritize capturing the opponent's flag
        if (targetPiece && targetPiece.color !== movingPiece.color && targetPiece.type === 'F') {
            score += 2000;
        }

        if (movingPiece.type === 'P') {
            // Encourage pawns to move towards the opponent's base
            const forwardDirection = this.color === 'White' ? -1 : 1;
            if (Math.sign(to.row - from.row) === forwardDirection) {
                score += 10;
            }

            // Extra bonus for pawns near the opponent's base
            const opponentBaseRow = this.color === 'White' ? 0 : 7;
            const distanceToBase = Math.abs(to.row - opponentBaseRow);
            if (distanceToBase <= 2) {
                score += (3 - distanceToBase) * 20;
            }
        }

        if (movingPiece && this.game.hasFlag(movingPiece)) {
            // Prioritize moving towards our base with the captured flag
            const basePos = this.game.baseStations[this.color];
            const distanceToBase = Math.abs(to.row - basePos[0]) + Math.abs(to.col - basePos[1]);
            score += (14 - distanceToBase) * 200;

            // Extra bonus for reaching the base
            if (to.row === basePos[0] && to.col === basePos[1]) {
                score += 2000;
            }
        } else if (targetPiece && this.game.hasFlag(targetPiece) && targetPiece.color === this.color) {
            // Encourage transferring the flag to a potentially better-positioned piece
            score += 100;
        }

        // Prioritize chasing the opponent with the flag
        const opponentWithFlag = this.findOpponentWithFlag();
        if (opponentWithFlag) {
            const distanceToFlagCarrier = Math.abs(to.row - opponentWithFlag.row) + Math.abs(to.col - opponentWithFlag.col);
            score += (14 - distanceToFlagCarrier) * 50;
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
            'B': 30
        };
        return values[pieceType] || 0;
    }
}
