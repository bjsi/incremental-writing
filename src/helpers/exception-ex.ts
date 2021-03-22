export {};

declare global {
    interface String {
        throwIfNullOrWhitespace(msg: string): void;
    }
}

String.prototype.throwIfNullOrWhitespace = function(msg: string) {
    if (this.isNullOrWhitespace())
        throw new Error(msg);
}
