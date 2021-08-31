class LightLodash {
    last<T>(arr: T[]): T {
        return arr[arr.length - 1];
    }

    first<T>(arr: T[]): T {
        return arr[0];
    }
    flatten<T>(arr: T[][]): T[] {
        return arr.reduce((prev, c) => prev.concat(c), []);
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

    zip<T, K>(arr1: T[], arr2: K[]): [T, K][] {
        const maxLength = Math.max(arr1.length, arr2.length);
        const rs = new Array(maxLength) as [T, K][];
        for (let idx = 0; idx < maxLength; idx++) {
            rs[idx]=[arr1[idx], arr2[idx]]
        }

        return rs;
    }

}

export const _l = new LightLodash();