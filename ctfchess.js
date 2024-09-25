class CTFChess {
    constructor() {
        this.board = this.initializeBoard();
        this.currentPlayer = 'White';
        this.flags = {
            'White': { position: [7, 4], captured: false },
            'Black': { position: [0, 3], captured: false }
        };
        this.baseStations = {
            'White': [7, 3],
            'Black': [0, 4]
        };
        this.score = { 'White': 0, 'Black': 0 };
        this.selectedPiece = null;
        this.moveTo = null;
    }

    initializeBoard() {
        let board = Array(8).fill().map(() => Array(8).fill(null));
        
        // Set up pieces
        const setupRow = (row, color) => {
            board[row] = [
                { type: 'R', color: color }, { type: 'N', color: color }, { type: 'B', color: color },
                { type: 'T', color: color }, { type: 'F', color: color }, { type: 'B', color: color },
                { type: 'N', color: color }, { type: 'R', color: color }
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
    
    isValidTurretMove() {
        const rowDiff = Math.abs(to.row - this.selectedPiece.row);
        const colDiff = Math.abs(to.col - this.selectedPiece.col);
        return (rowDiff <= 1 && colDiff <= 1 && (rowDiff + colDiff > 0));
    }

    makeMove() {
        if (!this.isValidMove(this.selectedPiece, this.moveTo)) return false;

        // Handle flag capture
        const movingPiece = this.board[this.selectedPiece.row][this.selectedPiece.col];
        const targetPiece = this.board[this.moveTo.row][this.moveTo.col];

        // Handle turret movement (no shooting allowed)
        if (movingPiece.type === 'T') {
            this.board[this.moveTo.row][this.moveTo.col] = movingPiece;
            this.board[this.selectedPiece.row][this.selectedPiece.col] = null;
            this.currentPlayer = this.getOpponentColor();
            return true;
        }

        // Handle flag capture
        if (targetPiece && this.hasFlag(targetPiece)) {
            movingPiece.hasFlag = true;
            this.flags[targetPiece.color].captured = true;
        }

        // Move the piece
        this.board[this.moveTo.row][this.moveTo.col] = movingPiece;
        this.board[this.selectedPiece.row][this.selectedPiece.col] = null;

        // Check if flag has been returned to base
        if (movingPiece.hasFlag) {
            const baseStation = this.baseStations[this.getOpponentColor()];
            if (to.row === baseStation[0] && to.col === baseStation[1]) {
                this.score[this.currentPlayer]++;
                this.resetGame();
            }
        }

        // Handle turret shooting
        this.handleTurretShoot(this.moveTo);
        this.currentPlayer = this.getOpponentColor();
        return true;
    }

    validate_move(row, col) {
        this.moveTo = { row: row, col: col };
        
        if (this.selectedPiece) {
            if (this.makeMove()) {
                return true;
            }
        } else {
            console.log(row, col);
            const piece = this.board[row][col];
            if (piece && piece.color === this.currentPlayer) {
                this.moveTo = { row: row, col: col };
                this.selectedPiece = { row: this.moveTo.row, col: this.moveTo.col };
                return true;
            }
        }
        
        return false;
    }

    print_board() {
        const chessboard = document.getElementById('chessboard');
        chessboard.innerHTML = '';
        for (let row = 0; row < 8; row++) {
            const tr = document.createElement('tr');
            for (let col = 0; col < 8; col++) {
                const td = document.createElement('td');
                td.dataset.row = row;
                td.dataset.col = col;
                const piece = this.board[row][col];
                if (piece) {
                    td.textContent = this.getPieceSymbol(piece);
                    td.classList.add(piece.color.toLowerCase());
                }
                tr.appendChild(td);
            }
            chessboard.appendChild(tr);
        }
    }

    getPieceSymbol(piece) {
        const symbols = {
            'P': '♙', 'R': '♖', 'N': '♘', 'B': '♗', 'T': '♜', 'F': '⚑', 'K': '♔'
        };
        return symbols[piece.type] || '';
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
        let piece = null;
        try {
            if (from != null && from.row !== undefined && from.col !== undefined) {
                piece = this.board[from.row][from.col];
            }
        } catch (error) {
            console.error("Error in isValidMove:", error);
            // return;
            
        }
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
        const piece = this.board[from.row][from.col];
        const direction = piece.color === 'White' ? -1 : 1;
        const rowDiff = to.row - from.row;
        const colDiff = Math.abs(to.col - from.col);
    
        // Move forward one square (no capture)
        if (Math.abs(colDiff) <= 1 && rowDiff === direction) {
            return true;
        }
    
        // Capture diagonally
        if (colDiff === 1 && rowDiff === direction) {
            const targetPiece = this.board[to.row][to.col];
            return targetPiece && (targetPiece.color !== piece.color || this.hasFlag(targetPiece));
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
