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
                { type: 'R', color: color, immovable: false }, { type: 'N', color: color, immovable: false }, { type: 'B', color: color, immovable: false },
                { type: 'K', color: color, immovable: true }, { type: 'F', color: color, immovable: false }, { type: 'B', color: color, immovable: false },
                { type: 'N', color: color, immovable: false }, { type: 'R', color: color, immovable: false }
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
        // board[2][4] = { type: 'K', color: 'Black', immovable: true };
        // board[5][4] = { type: 'K', color: 'White', immovable: true };

        return board;
    }

    isValidTurretMove() {
        const rowDiff = Math.abs(to.row - this.selectedPiece.row);
        const colDiff = Math.abs(to.col - this.selectedPiece.col);
        return (rowDiff <= 1 && colDiff <= 1 && (rowDiff + colDiff > 0));
    }

    makeMove(from, to) {
        if (!this.isValidMove(from, to)) {
            this.selectedPiece = null;
            this.moveTo = null;
            return false;
        }

        const movingPiece = this.board[from.row][from.col];
        const targetPiece = this.board[to.row][to.col];

        if ((targetPiece && targetPiece.type === 'K') || (movingPiece && movingPiece.type === 'K')) {
            console.log("Invalid move: Cannot capture the opponent's safety zone.");
            this.selectedPiece = null;
            this.moveTo = null;
            return false;
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
                    td.textContent = this.getPieceSymbol(piece, piece.color);
                    td.classList.add(piece.color.toLowerCase());
                }
                td.addEventListener('click', handleCellClick);
                tr.appendChild(td);
            }
            chessboard.appendChild(tr);
        }
    }

    handleCellClick(cell) {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);

        // Log the click to ensure it is being registered
        console.log('Cell clicked:', row, col);

        if (!game.selectedPiece) {
            const selectedPiece = game.board[row][col];
            if (selectedPiece && selectedPiece.color === game.currentPlayer) {
                game.selectedPiece = { row, col };
                console.log('Selected piece:', selectedPiece);
            }
        } else {
            game.moveTo = { row, col };
            if (game.isValidMove(game.selectedPiece, game.moveTo)) {
                game.makeMove(game.selectedPiece, game.moveTo);
                game.print_board();
                updateGameInfo();

                // Reset state for the next move
                game.selectedPiece = null;
                game.moveTo = null;

                // If playing against the bot, trigger the bot's move
                if (game.currentPlayer === 'Black') {
                    setTimeout(() => {
                        const botMove = bot.makeMove();
                        game.selectedPiece = botMove.from;
                        game.moveTo = botMove.to;
                        game.makeMove(botMove.from, botMove.to);
                        game.print_board();
                        updateGameInfo();

                        // Reset after bot's move
                        game.selectedPiece = null;
                        game.moveTo = null;
                    }, 500);
                }
            }
        }
    }

    getPieceSymbol(piece, color) {
        let symbols = [];
        if (color == 'Black')
            symbols = {
                'P': '♟', 'R': '♜', 'N': '♞', 'B': '♝', 'T': '♛', 'F': '⚑', 'K': '♚'
            };
        else
            symbols = {
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
                            this.flags[targetPiece.color].captured = true;
                            this.board[position.row][position.col] = { type: 'F', color: color, immovable: false };
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
        const piece = this.board[from.row][from.col];
        const rowDiff = to.row - from.row;
        const colDiff = Math.abs(to.col - from.col);

        // Allow movement in any direction by checking both positive and negative rowDiff
        // No capture, move one square forward or backward
        if (Math.abs(colDiff) <= 1 && Math.abs(rowDiff) === 1) {
            return !this.board[to.row][to.col];  // Allow move if the target square is empty
        }

        // Allow capture diagonally in both forward and backward directions
        if (Math.abs(colDiff) === 1 && Math.abs(rowDiff) === 1) {
            const targetPiece = this.board[to.row][to.col];
            return targetPiece && (targetPiece.color !== piece.color || this.hasFlag(targetPiece));
        }

        return false;  // Return false if the move doesn't meet any valid conditions
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
