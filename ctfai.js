class CTFAI {
    constructor(game, color) {
        this.game = game;
        this.color = color;
        this.difficultyLevels = {
            easy: 1,
            medium: 2,
            hard: 3,
            extreme: 4
        };
    }

    makeMove() {
        const moves = this.generateWidelySpreadMoves();
        const selectedMove = this.selectMoveBasedOnDifficulty(moves);
        if (selectedMove) {
            this.game.makeMove(selectedMove.from, selectedMove.to);
            return selectedMove;
        }
        return null;
    }

    generateWidelySpreadMoves() {
        const allMoves = this.generateAllPossibleMoves();
        return allMoves.filter((move, index) => index % 3 === 0);
    }

    selectMoveBasedOnDifficulty(moves) {
        const difficulty = this.getCurrentDifficulty();
        const sortedMoves = moves.sort((a, b) => b.score - a.score);
        const index = Math.floor(Math.random() * difficulty);
        return sortedMoves[index] || sortedMoves[0];
    }

    getCurrentDifficulty() {
        const flagCaptured = this.game.flags[this.getOpponentColor()].captured;
        return flagCaptured ? this.difficultyLevels.hard : this.difficultyLevels.medium;
    }

    generateAllPossibleMoves() {
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
                                moves.push({ from, to, score: this.evaluateMove(from, to) });
                            }
                        }
                    }
                }
            }
        }
        return moves;
    }

    evaluateMove(from, to) {
        let score = 0;
        const movingPiece = this.game.board[from.row][from.col];
        const targetPiece = this.game.board[to.row][to.col];

        if (movingPiece.hasFlag) {
            const basePos = this.game.baseStations[this.color];
            const distanceToBase = Math.abs(to.row - basePos[0]) + Math.abs(to.col - basePos[1]);
            score += 1000 - (distanceToBase * 100);
        }

        if (targetPiece && targetPiece.color !== this.color) {
            score += this.getPieceValue(targetPiece.type);
        }

        if (targetPiece && (targetPiece.type === 'F' || targetPiece.type === 'W')) {
            score += 2000;
        }

        return score;
    }

    getPieceValue(pieceType) {
        const values = { 'P': 10, 'R': 50, 'N': 30, 'B': 30, 'T': 40, 'F': 1000, 'W': 1000 };
        return values[pieceType] || 0;
    }

    getOpponentColor() {
        return this.color === 'White' ? 'Black' : 'White';
    }
}