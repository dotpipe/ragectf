class CTFChess {
    constructor() {
        this.board = this.initializeBoard();
        this.currentPlayer = 'White';
        this.flags = {
            'White': { position: [7, 4], captured: false },
            'Black': { position: [0, 4], captured: false }
        };
        this.baseStations = {
            'White': [7, 3],
            'Black': [0, 3]
        };
        this.score = { 'White': 0, 'Black': 0 };
    }

    initializeBoard() {
        let board = Array(8).fill().map(() => Array(8).fill(null));
        
        // Set up pieces
        const setupRow = (row, color) => {
            board[row] = [
                { type: 'R', color }, { type: 'N', color }, { type: 'B', color },
                { type: 'T', color }, { type: 'F', color }, { type: 'B', color },
                { type: 'N', color }, { type: 'R', color }
            ];
        };
    
        setupRow(0, 'Black');
        setupRow(7, 'White');
    
        // Set up pawns
        for (let i = 0; i < 8; i++) {
            board[1][i] = { type: 'P', color: 'Black' };
            board[6][i] = { type: 'P', color: 'White' };
        }
    
        // Place immovable kings
        board[2][4] = { type: 'K', color: 'Black', immovable: true };
        board[5][4] = { type: 'K', color: 'White', immovable: true };
    
        return board;
    }
    
    isValidTurretMove(from, to) {
        const rowDiff = Math.abs(to.row - from.row);
        const colDiff = Math.abs(to.col - from.col);
        return (rowDiff <= 1 && colDiff <= 1 && (rowDiff + colDiff > 0));
    }

    makeMove(from, to) {
        if (!this.isValidMove(from, to)) return false;

        const movingPiece = this.board[from.row][from.col];
        const targetPiece = this.board[to.row][to.col];

        // Handle turret movement (no shooting allowed)
        if (movingPiece.type === 'T') {
            this.board[to.row][to.col] = movingPiece;
            this.board[from.row][from.col] = null;
            this.currentPlayer = this.getOpponentColor();
            return true;
        }

        // Handle flag capture
        if (targetPiece && this.hasFlag(targetPiece)) {
            movingPiece.hasFlag = true;
            this.flags[targetPiece.color].captured = true;
        }

        // Move the piece
        this.board[to.row][to.col] = movingPiece;
        this.board[from.row][from.col] = null;

        // Check if flag has been returned to base
        if (movingPiece.hasFlag) {
            const baseStation = this.baseStations[this.getOpponentColor()];
            if (to.row === baseStation[0] && to.col === baseStation[1]) {
                this.score[this.currentPlayer]++;
                this.resetGame();
            }
        }

        // Handle turret shooting
        this.handleTurretShoot(to);

        this.currentPlayer = this.getOpponentColor();
        return true;
    }

    handleTurretShoot(position) {
        const directions = [
            [-1, 0], [1, 0], [0, -1], [0, 1],
            [-1, -1], [-1, 1], [1, -1], [1, 1]
        ];

        for (let [dx, dy] of directions) {
            let row = position.row + dx;
            let col = position.col + dy;
            while (row >= 0 && row < 8 && col >= 0 && col < 8) {
                if (this.board[row][col] && this.board[row][col].type === 'T') {
                    const targetPiece = this.board[position.row][position.col];
                    if (targetPiece) {
                        if (targetPiece.hasFlag) {
                            // Drop the flag
                            this.flags[targetPiece.color].position = [position.row, position.col];
                            this.flags[targetPiece.color].captured = false;
                            targetPiece.hasFlag = false;
                        }
                        // Remove the piece
                        this.board[position.row][position.col] = null;
                    }
                    return;
                }
                if (this.board[row][col]) break;
                row += dx;
                col += dy;
            }
        }
    }

    resetGame() {
        this.board = this.initializeBoard();
        this.flags = {
            'White': { position: [7, 4], captured: false },
            'Black': { position: [0, 4], captured: false }
        };
    }

    getOpponentColor() {
        return this.currentPlayer === 'White' ? 'Black' : 'White';
    }

    isValidMove(from, to) {
        const piece = this.board[from.row][from.col];
        if (!piece || piece.color !== this.currentPlayer) return false;

        switch (piece.type) {
            case 'P': return this.isValidPawnMove(from, to);
            case 'R': return this.isValidRookMove(from, to);
            case 'N': return this.isValidKnightMove(from, to);
            case 'B': return this.isValidBishopMove(from, to);
            case 'T': return this.isValidTurretMove(from, to);
            case 'F': return false; // Flags can't move on their own
            default: return false;
        }
    }

    isValidPawnMove(from, to) {
        const rowDiff = Math.abs(to.row - from.row);
        const colDiff = Math.abs(to.col - from.col);

        // Move forward one square (no capture)
        if (colDiff === 0 && rowDiff === 1 && !this.board[to.row][to.col]) {
            return true;
        }

        // Capture in any direction, one square away
        if (rowDiff <= 1 && colDiff <= 1 && (rowDiff + colDiff > 0)) {
            const targetPiece = this.board[to.row][to.col];
            return targetPiece && (targetPiece.color !== this.currentPlayer || this.hasFlag(targetPiece));
        }

        return false;
    }

    isValidRookMove(from, to) {
        if (from.row !== to.row && from.col !== to.col) return false;
        return this.isPathClear(from, to);
    }

    isValidKnightMove(from, to) {
        const rowDiff = Math.abs(to.row - from.row);
        const colDiff = Math.abs(to.col - from.col);
        return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
    }

    isValidBishopMove(from, to) {
        if (Math.abs(to.row - from.row) !== Math.abs(to.col - from.col)) return false;
        return this.isPathClear(from, to);
    }

    isValidTurretMove(from, to) {
        const rowDiff = Math.abs(to.row - from.row);
        const colDiff = Math.abs(to.col - from.col);
        return (rowDiff <= 1 && colDiff <= 1 && (rowDiff + colDiff > 0));
    }

    isPathClear(from, to) {
        const rowStep = Math.sign(to.row - from.row);
        const colStep = Math.sign(to.col - from.col);
        let row = from.row + rowStep;
        let col = from.col + colStep;

        while (row !== to.row || col !== to.col) {
            if (this.board[row][col]) return false;
            row += rowStep;
            col += colStep;
        }

        return true;
    }

    hasFlag(piece) {
        return piece.type === 'F' || piece.hasFlag;
    }
}
