export {};

declare global {
    interface String {
        isNullOrWhitespace(): boolean;
    }
}

String.prototype.isNullOrWhitespace = function() {
    if (typeof this === 'undefined' || this == null) return true;
    return this.trim().length < 1;
}

