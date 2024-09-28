class CTFBot {
    constructor(game, color, difficulty = 1) {
        this.game = game;
        this.color = color;
        this.moveCache = new MoveCache();
        this.setDifficulty(difficulty);
        this.combinedMoveDepth = Math.min(difficulty, 3);
    }

    makeMove() {
        this.color = this.game.currentPlayer;
        const bestMove = this.findCombinedMoves();
        if (bestMove && bestMove[0]) {
            console.log(`Bot (${this.color}) moving from (${bestMove[0].from.row}, ${bestMove[0].from.col}) to (${bestMove[0].to.row}, ${bestMove[0].to.col})`);
            return this.game.makeMove(bestMove[0].from, bestMove[0].to);
        }
        return this.makeRandomMove();
    }

    makeRandomMove() {
        const randomMove = this.getRandomMove();
        if (randomMove) {
            return this.game.makeMove(randomMove.from, randomMove.to);
        }
        console.log("No moves available. Game might be in a stalemate.");
        return null;
    }

    setDifficulty(depth) {
        this.depth = depth;
    }

    // findCombinedMoves(depth = this.combinedMoveDepth) {
    //     if (depth <= 1) return this.findbestmove();

    //     let bestCombination = null;
    //     let bestScore = -Infinity;

    //     const initialMoves = this.getAllValidMoves();

    //     for (const move of initialMoves) {
    //         const tempBoard = JSON.parse(JSON.stringify(this.game.board));
    //         this.game.makeMove(move.from, move.to);

    //         const nextMoves = this.findCombinedMoves(depth - 1);
    //         const combinedScore = this.evaluateMove(move.from, move.to) +
    //             nextMoves.reduce((sum, m) => sum + this.evaluateMove(m.from, m.to), 0);

    //         if (combinedScore > bestScore) {
    //             bestScore = combinedScore;
    //             bestCombination = [move, ...nextMoves];
    //         }

    //         this.game.board = tempBoard;
    //     }

    //     return bestCombination;
    // }

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
                (nextMoves ? this.evaluateMove(nextMoves.from, nextMoves.to) : 0);
    
            if (combinedScore > bestScore) {
                bestScore = combinedScore;
                bestCombination = [move, ...nextMoves];
            }
    
            this.game.board = tempBoard;
        }
        return bestCombination;
    }

    findbestmove() {
        const allValidMoves = this.getAllValidMoves();
        if (allValidMoves.length === 0) return null;

        return allValidMoves.reduce((best, move) => {
            const score = this.evaluateMove(move.from, move.to);
            return score > best.score ? { move, score } : best;
        }, { move: allValidMoves[0], score: -Infinity }).move;
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

        const directions = {
            'P': [[-1, 0], [-1, -1], [-1, 1], [1, 0], [1, -1], [1, 1]],
            'R': [[-1, 0], [1, 0], [0, -1], [0, 1]],
            'N': [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]],
            'B': [[-1, -1], [-1, 1], [1, -1], [1, 1]],
            'T': [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]
        };

        return (directions[piece.type] || []).reduce((validMoves, [dx, dy]) => {
            const newRow = row + dx, newCol = col + dy;
            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8 &&
                this.game.isValidMove({ row, col }, { row: newRow, col: newCol })) {
                validMoves.push({ row: newRow, col: newCol });
            }
            return validMoves;
        }, []);
    }

    evaluateMove(from, to) {
        let score = 0;
        if (!from) return false;
        const movingPiece = this.game.board[from.row][from.col];
        const targetPiece = this.game.board[to.row][to.col];

        if (targetPiece && movingPiece && targetPiece.color !== movingPiece.color && targetPiece.type === 'F') {
            score += 2000;
        }

        if (movingPiece && this.game.hasFlag(movingPiece)) {
            const basePos = this.game.baseStations[this.color];
            const distanceToBase = Math.abs(to.row - basePos[0]) + Math.abs(to.col - basePos[1]);
            score += (14 - distanceToBase) * 200;
        } else {
            const forwardDirection = this.color === 'White' ? -1 : 1;
            score += forwardDirection * (to.row - from.row) * 20;
        }

        const opponentFlagPos = this.game.flags[this.getOpponentColor()].position;
        const distanceToFlag = Math.abs(to.row - opponentFlagPos[0]) + Math.abs(to.col - opponentFlagPos[1]);
        score += (14 - distanceToFlag) * 15;

        if (targetPiece && targetPiece.color !== this.color) {
            score += this.getPieceValue(targetPiece.type);
        }

        return score;
    }

    getOpponentColor() {
        return this.color === 'White' ? 'Black' : 'White';
    }

    getPieceValue(pieceType) {
        const values = { 'P': 10, 'R': 50, 'N': 30, 'B': 30, 'T': 40 };
        return values[pieceType] || 0;
    }

    getRandomMove() {
        const allMoves = this.getAllValidMoves();
        return allMoves.length > 0 ? allMoves[Math.floor(Math.random() * allMoves.length)] : null;
    }
}