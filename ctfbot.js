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
        const opponentFlagPos = (this.game.flags[this.getOpponentColor()].position) ? this.game.flags[this.getOpponentColor()].position : this.game.defaultFlags[this.getOpponentColor()].position;
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
