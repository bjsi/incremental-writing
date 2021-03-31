export class HashSet {
    private values= {}

    //@ts-ignore
    add(val) {
        //@ts-ignore
        this.values[val] = true
    }

    //@ts-ignore
    has(val) {
        //@ts-ignore
        return this.values[val] === true

    }

    //@ts-ignore
    remove(val) {
        //@ts-ignore
        delete this.values[val]

    }

    getValues() {
        return Object.keys(this.values)
    }
}
