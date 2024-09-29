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

        // Prioritize capturing the opponent's flag
        if (targetPiece && targetPiece.color !== this.color && targetPiece.type === 'F') {
            score += 2000;
        }

        // Prioritize moving towards the opponent's flag
        const opponentFlagPos = this.game.flags[this.getOpponentColor()].position;
        const distanceToFlag = Math.abs(to.row - opponentFlagPos[0]) + Math.abs(to.col - opponentFlagPos[1]);
        score += (14 - distanceToFlag) * 15;

        // Prioritize capturing opponent pieces
        if (targetPiece && targetPiece.color !== this.color) {
            score += this.getPieceValue(targetPiece.type) * 3;
        }

        // Bonus for moving pieces forward
        const forwardDirection = this.color === 'White' ? -1 : 1;
        score += (to.row - from.row) * forwardDirection * 5;

        // Bonus for controlling the center
        if ((to.row === 3 || to.row === 4) && (to.col === 3 || to.col === 4)) {
            score += 10;
        }

        return score;
    }

    getPieceValue(pieceType) {
        const values = { 'P': 10, 'R': 50, 'N': 30, 'B': 30, 'F': 2000, 'W': 1000 };
        return values[pieceType] || 0;
    }

    getOpponentColor() {
        return this.color === 'White' ? 'Black' : 'White';
    }
}