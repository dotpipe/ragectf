class CTFBot {
    constructor(game, color) {
        this.game = game;
        this.color = color;
    }

    makeMove() {
        const bestMove = this.findbestmove();
        if (bestMove) {
            // Use the CTFChess makeMove method to execute the move
            this.game.selectedPiece = bestMove.from;  // Set the piece to move
            this.game.moveTo = bestMove.to;           // Set the destination square
            if (this.game.isValidMove(bestMove.from, bestMove.to)) {
                this.game.makeMove(bestMove.from, bestMove.to);
                return bestMove;
            }
        }
        return null;  // No valid move found
    }

    findbestmove() {
        let bestMove = null;
        let bestScore = -Infinity;

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.game.board[row][col];
                if (piece && piece.color === this.color) {
                    for (let toRow = 0; toRow < 8; toRow++) {
                        for (let toCol = 0; toCol < 8; toCol++) {
                            const from = { row, col };
                            const to = { row: toRow, col: toCol };
                            if (this.game.isValidMove(from, to)) {
                                const score = this.evaluateMove(from, to);
                                if (score > bestScore) {
                                    bestScore = score;
                                    bestMove = { from, to };
                                }
                            }
                        }
                    }
                }
            }
        }
        return bestMove;
    }

    evaluateMove(from, to) {
        
        // Double the evaluation points for pieces carrying the flag
        const movingPiece = this.game.board[from.row][from.col];
        const targetPiece = this.game.board[to.row][to.col];
        let score = 0;
    
        if (movingPiece.hasFlag) {
            score += 10000;  // Very high base score for flag carrier moves
    
            // Additional score for moving towards base
            const basePos = this.game.baseStations[this.color];
            const currentDistanceToBase = Math.abs(from.row - basePos[0]) + Math.abs(from.col - basePos[1]);
            const newDistanceToBase = Math.abs(to.row - basePos[0]) + Math.abs(to.col - basePos[1]);
            
            if (newDistanceToBase < currentDistanceToBase) {
                score += 5000;  // Bonus for moving closer to base
                return score;
            }
        }

        // Prioritize capturing the opponent's flag
        // Significantly increase the priority of capturing the flag
        if (targetPiece && targetPiece.type === 'F' && targetPiece.color !== this.color) {
            score += 2000;  // Doubled from previous value
        }

        // Increase priority of moving towards the opponent's flag
        const opponentFlagPos = this.game.flags[this.getOpponentColor()].position;
        const distanceToFlag = Math.abs(to.row - opponentFlagPos[0]) + Math.abs(to.col - opponentFlagPos[1]);
        score += (14 - distanceToFlag) * 20;  // Doubled from previous value

        // Greatly increase priority of returning the flag to base
        if (movingPiece.hasFlag) {
            const ourBasePos = this.game.baseStations[this.color];
            const distanceToBase = Math.abs(to.row - ourBasePos[0]) + Math.abs(to.col - ourBasePos[1]);
            score += (14 - distanceToBase) * 50;  // Significantly increased
        }

        // Prioritize capturing opponent pieces
        if (targetPiece && targetPiece.color !== this.color) {
            score += this.getPieceValue(targetPiece.type);
        }

        // Double the score again if the piece is returning to base with the flag
        if (movingPiece.hasFlag) {
            const ourBasePos = this.game.baseStations[this.color];
            const distanceToBase = Math.abs(to.row - ourBasePos[0]) + Math.abs(to.col - ourBasePos[1]);
            score += (14 - distanceToBase) * 20;  // Double the priority for returning to base
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
