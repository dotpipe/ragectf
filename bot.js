class CTFAI {
    constructor(game, color) {
        this.game = game;
        this.color = color;
        this.difficultyLevels = {
            easy: 3,
            medium: 2,
            hard: 1,
            extreme: 1
        };
        this.positionRatings = new Map();
        this.learningRate = 0.1;
        this.loadLearnedData();
    }

    makeMove() {
        const moves = this.generateAllPossibleMoves();
        const selectedMove = this.selectBestMove(moves);
        if (selectedMove) {
            this.game.makeMove(selectedMove.from, selectedMove.to);
            this.updatePositionRatings(selectedMove);
            return selectedMove;
        }
        return null;
    }

    generateAllPossibleMoves() {
        const moves = [];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.game.board[row][col];
                if (piece && piece.color === this.game.currentPlayer) {
                    for (let toRow = 0; toRow < 8; toRow++) {
                        for (let toCol = 0; toCol < 8; toCol++) {
                            const from = { row, col };
                            const to = { row: toRow, col: toCol };
                            if (this.game.isValidMove(from, to)) {
                                moves.push({ from, to, score: this.evaluateMove(from, to) });
                            }
                        }
                    }
                }
            }
        }
        return moves;
    }

    selectBestMove(moves) {
        let bestMove = null;
        let bestScore = -Infinity;
        for (const move of moves) {
            if (move.score > bestScore) {
                bestScore = move.score;
                bestMove = move;
            }
        }
        return bestMove;
    }

    evaluateMove(from, to) {
        const movingPiece = this.game.board[from.row][from.col];
        const targetPiece = this.game.board[to.row][to.col];
        let score = 0;
        if 
        (movingPiece === null) {
            return score;
        }

        // Prioritize capturing the opponent's flag
        if (targetPiece && targetPiece.color !== this.game.currentPlayer && targetPiece.type === 'F') {
            score += 10000; // Increased from 1000 to 10000
        }

        // Prioritize moving towards the opponent's flag
        const opponentFlagPos = this.game.flags[this.getOpponentColor()].position;
        const distanceToFlag = Math.abs(to.row - opponentFlagPos[0]) + Math.abs(to.col - opponentFlagPos[1]);
        score += (14 - distanceToFlag) * 20; // Increased from 10 to 20

        // Prioritize capturing opponent pieces
        if (targetPiece && targetPiece.color !== this.game.currentPlayer) {
            score += this.getPieceValue(targetPiece.type);
        }

        // Add a high score for returning the flag
        if (movingPiece.hasFlag) {
            const baseStation = this.game.baseStations[this.game.currentPlayer];
            const distanceToBase = Math.abs(to.row - baseStation[0]) + Math.abs(to.col - baseStation[1]);
            score += (14 - distanceToBase) * 100; // High priority for returning the flag
        }

        // Avoid moving into positions where the piece can be captured
        if (this.isVulnerable(to)) {
            score -= this.getPieceValue(movingPiece.type);
        }

        // Add logic for moving backwards when reaching the other side of the board
        if ((this.color === 'White' && to.row === 0) || (this.color === 'Black' && to.row === 7)) {
            score += 50; // Encourage moving backwards
        }

        return score;
    }

    getPieceValue(pieceType) {
        const values = { 'P': 10, 'R': 50, 'N': 30, 'B': 30, 'F': 2000, 'W': 1000 };
        return values[pieceType] || 0;
    }

    getOpponentColor() {
        return this.game.currentPlayer === 'White' ? 'Black' : 'White';
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

    updatePositionRatings(move) {
        const key = `${move.to.row},${move.to.col}`;
        const currentRating = this.getPositionRating(move.to);
        const newRating = currentRating + this.learningRate * (this.evaluateMove(move.from, move.to));
        this.positionRatings.set(key, newRating);
        this.saveLearnedData();
    }

    getPositionRating(position) {
        const key = `${position.row},${position.col}`;
        return this.positionRatings.get(key) || 0;
    }

    saveLearnedData() {
        localStorage.setItem('ctfaiPositionRatings', JSON.stringify(Array.from(this.positionRatings.entries())));
    }

    loadLearnedData() {
        const savedData = localStorage.getItem('ctfaiPositionRatings');
        if (savedData) {
            this.positionRatings = new Map(JSON.parse(savedData));
        }
    }
}