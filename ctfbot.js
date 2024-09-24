class CTFBot {
    constructor(game, color) {
        this.game = game;
        this.color = color;
        this.moveCache = new MoveCache();
    }

    makeMove() {
        const cachedMove = this.moveCache.getBestMove();
        if (cachedMove && this.game.isValidMove(cachedMove.from, cachedMove.to)) {
            return cachedMove;
        }

        const newMove = this.findBestMove();
        this.moveCache.addMove(newMove, this.evaluateMove(newMove));
        return newMove;
    }

    getAllPossibleMoves() {
        const moves = [];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.game.board[row][col];
                if (piece && piece.color === this.color) {
                    for (let toRow = 0; toRow < 8; toRow++) {
                        for (let toCol = 0; toCol < 8; toCol++) {
                            if (this.game.isValidMove({ row, col }, { row: toRow, col: toCol })) {
                                moves.push({ from: { row, col }, to: { row: toRow, col: toCol } });
                            }
                        }
                    }
                }
            }
        }
        return moves;
    }

    isFlagCapture(move) {
        const targetPiece = this.game.board[move.to.row][move.to.col];
        return targetPiece && this.game.hasFlag(targetPiece);
    }

    isFlagReturn(move) {
        const movingPiece = this.game.board[move.from.row][move.from.col];
        if (!movingPiece.hasFlag) return false;

        const baseStation = this.game.baseStations[this.game.getOpponentColor()];
        return move.to.row === baseStation[0] && move.to.col === baseStation[1];
    }

    getRandomMove(moves) {
        return moves[Math.floor(Math.random() * moves.length)];
    }

    evaluatePosition(board, depth) {
        let binaryScore = '';
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece && piece.color === this.color) {
                    binaryScore += this.getPieceBinaryScore(piece, row, col, board);
                }
            }
        }
        // Take the first 10 bits if we have more, or pad with zeros if less
        binaryScore = binaryScore.slice(0, 10).padEnd(10, '0');
        return parseInt(binaryScore, 2) / depth;
    }

    getPieceBinaryScore(piece, row, col, board) {
        let score = 0;
        score += this.rateProximityToFlag(row, col, board) * 1;
        score += this.rateProximityToDanger(row, col, board) * 1;
        return score.toString(2).padStart(2, '0');
    }

    rateProximityToFlag(row, col, board) {
        const opponentFlag = this.game.flags[this.game.getOpponentColor()];
        const distance = Math.max(Math.abs(row - opponentFlag.position[0]), Math.abs(col - opponentFlag.position[1]));
        if (distance <= 1) return 3;
        if (distance <= 3) return 2;
        if (distance <= 5) return 1;
        return 0;
    }

    rateProximityToDanger(row, col, board) {
        let dangerLevel = 0;
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue;
                const newRow = row + i, newCol = col + j;
                if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                    const nearbyPiece = board[newRow][newCol];
                    if (nearbyPiece && nearbyPiece.color !== this.color) {
                        dangerLevel = Math.max(dangerLevel, this.getPieceThreatLevel(nearbyPiece.type));
                    }
                }
            }
        }
        return 3 - dangerLevel; // Invert so 3 is safest, 0 is most dangerous
    }

    getPieceThreatLevel(pieceType) {
        switch (pieceType) {
            case 'T': return 3; // Turret is most dangerous
            case 'R': case 'B': return 2;
            case 'N': case 'P': return 1;
            default: return 0;
        }
    }
}
