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
    }

    makeMove() {
        const moves = this.generateWidelySpreadMoves();
        const selectedMove = this.selectMoveBasedOnDifficulty(moves);
        if (selectedMove) {
            this.game.makeMove(selectedMove.from, selectedMove.to);
            this.updatePositionRatings(selectedMove);
            return selectedMove;
        }
        return null;
    }

    generateWidelySpreadMoves() {
        const allMoves = this.generateAllPossibleMoves();
        return allMoves.filter((move, index) => index % 3 === 0);
    }

    selectMoveBasedOnDifficulty(moves) {
        const forwardDirection = this.color === 'White' ? -1 : 1;
        moves.sort((a, b) => {
            const aForwardScore = (a.to.row - a.from.row) * forwardDirection;
            const bForwardScore = (b.to.row - b.from.row) * forwardDirection;
            if (aForwardScore !== bForwardScore) {
                return bForwardScore - aForwardScore;
            }
            return b.score - a.score;
        });
        return moves[0];
    }

    calculateForesightScore(move) {
        const immediateScore = this.evaluateMove(move.from, move.to);
        const futurePositionScore = this.getPositionRating(move.to);
        return immediateScore + futurePositionScore;
    }

    getPositionRating(position) {
        const key = `${position.row},${position.col}`;
        return this.positionRatings.get(key) || 0;
    }

    updatePositionRatings(move) {
        const key = `${move.to.row},${move.to.col}`;
        const currentRating = this.getPositionRating(move.to);
        const newRating = currentRating + this.learningRate * (this.evaluateMove(move.from, move.to)); // - currentRating);
        this.positionRatings.set(key, newRating);
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

        if (movingPiece === null || targetPiece === null) return false;
        
        if (targetPiece && targetPiece.color != this.color && targetPiece.hasFlag) {
            score += 100000;
        }
        
        if (movingPiece.type === 'F') {
            score += 40000;  // Bonus for moving the flag
        }

        // Prioritize capturing the opponent's flag
        if (targetPiece && targetPiece.color !== this.color && targetPiece.type === 'F') {
            score += 2000;
        }

        // Prioritize capturing opponent's pieces
        if (movingPiece.hasFlag) {
            const pos = this.game.baseStations[this.getOpponentColor()].position;
            if (to.row === pos[0] && to.col === pos[1] && this.game.flags[this.color].captured)
                score += 50000;
        }

        // Prioritize moving towards the opponent's flag
        const opponentFlagPos = this.game.flags[this.getOpponentColor()].position;
        const distanceToFlag = Math.abs(to.col - opponentFlagPos[0]) + Math.abs(to.row - opponentFlagPos[1]);
        score += (7 - distanceToFlag) * 150;

        // Prioritize capturing opponent pieces
        if (targetPiece && targetPiece.color !== this.color) {
            score += this.getPieceValue(targetPiece.type) * 300;
        }

        // Bonus for moving pieces forward
        const forwardDirection = this.color === 'White' ? -1 : 1;
        score += (to.row - from.row) * forwardDirection * 150;

        // Bonus for controlling the center
        if ((to.row === 3 || to.row === 4) && (to.col === 3 || to.col === 4)) {
            score += 10;
        }

        // Add a bonus for moving away from white pieces
        score += this.calculateDistanceBonus(from, to);

        // Add a huge bonus for returning the flag to base
        if (movingPiece.hasFlag) {
            const baseStation = this.game.baseStations[this.color].position;
            const currentDistanceToBase = Math.abs(from.row - baseStation[0]) + Math.abs(from.col - baseStation[1]);
            const newDistanceToBase = Math.abs(to.row - baseStation[0]) + Math.abs(to.col - baseStation[1]);
            score += Math.abs(currentDistanceToBase - newDistanceToBase) * 200;
        }

        if (movingPiece.type === 'N' && to.row === this.game.flags[this.getOpponentColor()].position[0] && to.col === this.game.flags[this.getOpponentColor()].position[1]) {
            const opponentFlagPos = this.game.flags[this.getOpponentColor()].position;
            const currentDistanceToFlag = Math.max(Math.abs(from.row - opponentFlagPos[0]), Math.abs(from.col - opponentFlagPos[1]));
            const newDistanceToFlag = Math.max(Math.abs(to.row - opponentFlagPos[0]), Math.abs(to.col - opponentFlagPos[1]));
            score += Math.abs(currentDistanceToFlag - newDistanceToFlag) * 1000;
        }

        return score;
    }
    
    calculateDistanceBonus(from, to) {
        let bonus = 0;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.game.board[row][col];
                if (piece && piece.color === 'White') {
                    const oldDistance = Math.abs(from.row - row) + Math.abs(from.col - col);
                    const newDistance = Math.abs(to.row - row) + Math.abs(to.col - col);
                    bonus += newDistance - oldDistance;
                }
            }
        }
        return bonus * 500; // Adjust the multiplier as needed
    }

    getPieceValue(pieceType) {
        const values = { 'P': 10, 'R': 50, 'N': 30, 'B': 30, 'F': 2000, 'W': 1000 };
        return values[pieceType] || 0;
    }

    getOpponentColor() {
        return this.color === 'White' ? 'Black' : 'White';
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