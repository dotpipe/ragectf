class CTFChess {
    constructor() {
        this.board = this.initializeBoard();
        this.currentPlayer = 'White';
        this.flags = this.initializeFlags();
        this.baseStations = this.initializeBaseStations();
        this.score = { 'White': 0, 'Black': 0 };
    }

    initializeBoard() {
        const board = Array(8).fill().map(() => Array(8).fill(null));
        this.setupInitialPieces(board);
        return board;
    }

    setupInitialPieces(board) {
        const setupRow = (row, color) => {
            let pieces = ['R', 'N', 'B', 'K', 'F', 'B', 'N', 'R'];
            if (color === 'White') {
                board[row] = pieces.map(type => ({ type, color, immovable: type === 'K' }));
                return;
            }
            pieces = ['R', 'N', 'B', 'W', 'K', 'B', 'N', 'R'];
            board[row] = pieces.map(type => ({ type, color, immovable: type === 'K' }));
        };

        setupRow(0, 'Black');
        setupRow(7, 'White');

        for (let i = 0; i < 8; i++) {
            board[1][i] = { type: 'P', color: 'Black' };
            board[6][i] = { type: 'P', color: 'White' };
        }

        this.placeRandomPieces(board);
    }

    placeRandomPieces(board) {
        const placeRandom = (type, color, row) => {
            const col = Math.floor(Math.random() * 8);
            board[row][col] = { type, color, immovable: true };
        };

        placeRandom('G', 'Black', 3);
        placeRandom('G', 'White', 4);
    }

    initializeFlags() {
        return {
            'White': { position: [7, 3], captured: false },
            'Black': { position: [0, 4], captured: false }
        };
    }

    initializeBaseStations() {
        return {
            'White': { position: [7, 4], color: 'White' },
            'Black': { position: [0, 3], color: 'Black' }
        };
    }

    makeMove(from, to) {
        if (!this.isValidMove(from, to)) return false;

        const movingPiece = this.board[from.row][from.col];
        const targetPiece = this.board[to.row][to.col];
    
        const originalType = movingPiece.type;
        this.handleFlagCapture(movingPiece, targetPiece);
        this.promotePawn(movingPiece, to);
        this.updateBoard(from, to, movingPiece);
        
        // Ensure the piece type hasn't changed
        movingPiece.type = originalType;
    
        if (this.checkFlagReturn(movingPiece, to)) {
            
            return true;
        }
    
        this.switchPlayer();
        return true;
    }


    promotePawn(piece, to) {
        if (piece.type === 'P' && (to.row == 7 || to.row == 0)) {
            const promotionPieces = ['N', 'B', 'R'];
            piece.type = promotionPieces[Math.floor(Math.random() * promotionPieces.length)];
            this.print_board();
        }
    }

    handleFlagCapture(movingPiece, targetPiece) {
        if (targetPiece && this.hasFlag(targetPiece)) {
            movingPiece.hasFlag = true;
            this.flags[targetPiece.color].captured = true;
            this.score[this.currentPlayer]++;  // Add a point for capturing the flag
        }
    }

    updateBoard(from, to, piece) {
        this.board[to.row][to.col] = piece;
        this.board[from.row][from.col] = null;
    }

    checkFlagReturn(piece, position) {
        if (piece.hasFlag) {
            const kingRow = this.currentPlayer === 'White' ? 7 : 0;
            const kingCol = this.currentPlayer === 'White' ? 3 : 4;
            if (this.moveTo.row === kingRow && this.moveTo.col === kingCol) {
                this.score[this.currentPlayer] += 3;
                this.resetGame();
                return true;
            }
        }
        return false;
    }

    switchPlayer() {
        this.currentPlayer = this.getOpponentColor();
    }

    isValidMove(from, to) {
        const piece = this.board[from.row]?.[from.col];
        if (!piece || piece.color !== this.currentPlayer) return false;
    
        if (from.row === to.row && from.col === to.col) return false;
        
        const targetPiece = this.board[to.row][to.col];
        if (targetPiece && targetPiece.immovable && targetPiece.type !== 'K') return false;
    
        // Allow flag carriers to move towards their base station
        if (piece.hasFlag) {
            const baseStation = this.baseStations[piece.color].position;
            if (to.row === baseStation[0] && to.col === baseStation[1]) {
                this.score[this.currentPlayer] += 3;
                piece.hasFlag = false;
                this.initializeFlags();
                return true;
            }
        }
    
        const moveValidators = {
            'P': this.isValidPawnMove,
            'R': this.isValidRookMove,
            'N': this.isValidKnightMove,
            'B': this.isValidBishopMove,
            'T': this.isValidTurretMove
        };
    
        return moveValidators[piece.type]?.call(this, from, to) ?? false;
    }

    isValidPawnMove(from, to) {
        const piece = this.board[from.row][from.col];
        const rowDiff = to.row - from.row;
        const colDiff = Math.abs(to.col - from.col);
        const direction = piece.color === 'White' ? -1 : 1;

        // Regular forward move
        if (colDiff === 0 && rowDiff === direction && !this.board[to.row][to.col]) {
            return true;
        }

        // Capture diagonally (including flag)
        if (colDiff === 1 && rowDiff === direction) {
            const targetPiece = this.board[to.row][to.col];
            if (targetPiece && (targetPiece.color !== piece.color || (targetPiece.type === 'F' || piece.type === 'W'))) {
                return true;
            }
        }

        // Move backwards with flag
        if (piece.hasFlag) {
            if (colDiff === 0 && rowDiff === -direction) {
                return true;
            }
        }

        // Reach opposite side and return flag
        const lastRow = piece.color === 'White' ? 0 : 7;
        if (from.row === lastRow && piece.hasFlag) {
            const baseStation = this.baseStations[piece.color];
            if (to.row === baseStation[0] && to.col === baseStation[1]) {
                return true;
            }
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
        return piece.type === 'F' || piece.type === 'W' || piece.hasFlag;
    }

    getOpponentColor() {
        return this.currentPlayer === 'White' ? 'Black' : 'White';
    }

    resetGame() {
        this.board = this.initializeBoard();
        this.flags = this.initializeFlags();
    }

    getPieceSymbol(piece, color) {
        let symbols = [];
        if (color == 'Black')
            symbols = {
                'P': '♟', 'R': '♜', 'N': '♞', 'B': '♝', 'T': '♛', 'W': '⚑', 'K': '♚', 'G': '🗿'
            };
        else
            symbols = {
                'P': '♙', 'R': '♖', 'N': '♘', 'B': '♗', 'T': '♜', 'F': '⚑', 'K': '♔', 'G': '🪨'
            };
        return symbols[piece.type] || '';
    }

    validate_move(row, col) {
        this.moveTo = { row: row, col: col };

        if (this.selectedPiece) {
            if (this.makeMove(this.selectedPiece, this.moveTo)) {
                this.selectedPiece = null;
                return true;
            }
        } else {
            const piece = this.board[row][col];
            if (piece && piece.color === this.currentPlayer) {
                this.selectedPiece = { row: row, col: col };
                return true;
            }
        }

        this.selectedPiece = null;
        return false;
    }

    print_board() {
        const chessboard = document.getElementById('chessboard');
        chessboard.innerHTML = '';
        const table = document.createElement('table');
        for (let row = 0; row < 8; row++) {
            const tr = document.createElement('tr');
            for (let col = 0; col < 8; col++) {
                const td = document.createElement('td');
                td.dataset.row = row;
                td.dataset.col = col;
                const piece = this.board[row][col];
                if (row % 2 === col % 2) {
                    td.classList.add('white');
                } else {
                    td.classList.add('beige');
                }
                if (piece) {
                    td.textContent = this.getPieceSymbol(piece, piece.color);
                    td.classList.add(piece.color.toLowerCase());
                    if (piece.hasFlag) {
                        td.classList.add('glow');  // Add glow effect for flag carriers
                    }
                }
                td.addEventListener('click', handleCellClick);
                tr.appendChild(td);
            }
            table.appendChild(tr);
        }
        chessboard.appendChild(table);
    }
}