// https://medium.com/laboratoria-developers/queues-in-javascript-2602677c9c3b
function Queue() {

    this.dataStore = Array.prototype.slice.call(arguments, 0);
    this.enqueue = enqueue;
    this.dequeue = dequeue;
    this.empty = empty;
    this.isEmpty = isEmpty;

    function enqueue(element) {
        this.dataStore.push(element);
    }

    function dequeue() {
        return this.dataStore.shift();
    }

    function empty() {
        return this.dataStore = [];
    }

    function isEmpty() {
        return this.dataStore.length === 0;
    }
}