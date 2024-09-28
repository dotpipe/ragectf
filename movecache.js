class MoveCache {
    constructor() {
        this.cache = new Map();
    }

    getKey(board, color) {
        return board.map(row => row.map(piece => piece ? `${piece.type}${piece.color[0]}` : '--').join('')).join('|') + color;
    }

    set(board, color, moves) {
        const key = this.getKey(board, color);
        this.cache.set(key, moves);
    }

    get(board, color) {
        const key = this.getKey(board, color);
        return this.cache.get(key);
    }

    clear() {
        this.cache.clear();
    }
}