class CTFBot {
    constructor(game, color) {
        this.game = game;
        this.color = color;
        this.moveCache = new MoveCache();
    }

    makeMove() {
        const bestMove = this.findbestmove();
        this.game.selectPiece = bestMove.from;
        this.game.moveTo = bestMove.to;
        if (bestMove) {
            this.game.makeMove(bestMove.from, bestMove.to);
        }
        return bestMove;
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
    
    evaluateMove(from, to) {
        const movingPiece = this.game.board[from.row][from.col];
        const targetPiece = this.game.board[to.row][to.col];
        let score = 0;

        // Prioritize capturing the opponent's flag
        if (targetPiece && targetPiece.color !== this.color && targetPiece.type === 'F') {
            score += 1000;
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

    getPieceValue(pieceType) {
        const values = {
            'P': 10,
            'R': 50,
            'N': 30,
            'B': 30,
            'T': 40,
            'F': 1000,
            'K': 900
        };
        return values[pieceType] || 0;
    }

    isVulnerable(position) {
        // Check if the position can be captured by any opponent piece
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.game.board[row][col];
                if (piece && piece.color !== this.color) {
                    if (this.game.isValidMove({row, col}, position)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    getOpponentColor() {
        return this.color === 'White' ? 'Black' : 'White';
    }
}
