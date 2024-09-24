class MoveCache {
    constructor(maxSize = 20) {
        this.cache = [];
        this.maxSize = maxSize;
    }

    addMove(move, score) {
        this.cache.push({move, score});
        this.cache.sort((a, b) => b.score - a.score);
        if (this.cache.length > this.maxSize) {
            this.cache.pop();
        }
    }

    getBestMove() {
        return this.cache.length > 0 ? this.cache[0].move : null;
    }

    updateScores(evaluateFunction) {
        this.cache.forEach(item => {
            item.score = evaluateFunction(item.move);
        });
        this.cache = this.cache.filter(item => item.score > 0);
        this.cache.sort((a, b) => b.score - a.score);
    }
}