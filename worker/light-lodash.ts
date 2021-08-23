class LightLodash {
    last<T>(arr: T[]): T {
        return arr[arr.length - 1];
    }

    first<T>(arr: T[]): T {
        return arr[0];
    }

    partition<T>(arr: T[], predicate: (item: T) => boolean): [T[], T[]] {
        const first: T[] = [];
        const second: T[] = [];
        for (const item of arr) {
            if (predicate(item)) {
                first.push(item)
            } else {
                second.push(item)
            }
        }

        return [first, second];
    }
}

export const _l = new LightLodash();