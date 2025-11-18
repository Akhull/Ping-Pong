export function deepCopy<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (Array.isArray(obj)) {
        const arrCopy = [] as any[];
        for (let i = 0; i < obj.length; i++) {
            arrCopy[i] = deepCopy(obj[i]);
        }
        return arrCopy as T;
    }

    const objCopy = {} as { [key: string]: any };
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            objCopy[key] = deepCopy(obj[key]);
        }
    }
    return objCopy as T;
}

/**
 * Creates a delta object representing the changes from 'from' to 'to'.
 * Returns null if there are no changes.
 */
export function createDelta(from: any, to: any): any {
    if (from === to) return null;

    if (typeof to !== 'object' || to === null) {
        return to;
    }
    
    if (Array.isArray(to)) {
        // For arrays, do a simple stringify comparison. If different, send the whole new array.
        return JSON.stringify(from) !== JSON.stringify(to) ? to : null;
    }

    if (typeof from !== 'object' || from === null || Array.isArray(from)) {
        // 'from' is a primitive/array, but 'to' is an object. Send the whole new object.
        return to;
    }

    // Both 'from' and 'to' are objects. Time to diff them.
    const delta: { [key: string]: any } = {};
    let hasChanges = false;

    // Check for added or modified keys
    for (const key in to) {
        if (!to.hasOwnProperty(key)) continue;
        
        const nestedDelta = createDelta(from[key], to[key]);
        
        // This is the critical change. We register a change if:
        // 1. The recursive diff found a change (nestedDelta is not null).
        // 2. The new value is null, but the old value was not (i.e., a property was nulled).
        if (nestedDelta !== null || (to[key] === null && from[key] !== null)) {
            delta[key] = nestedDelta;
            hasChanges = true;
        }
    }

    // Check for deleted keys
    for (const key in from) {
        if (from.hasOwnProperty(key) && !to.hasOwnProperty(key)) {
            delta[key] = undefined; // Use `undefined` as a sentinel for deletion.
            hasChanges = true;
        }
    }

    return hasChanges ? delta : null;
}

/**
 * Applies a delta object to an existing state object, returning a new state.
 */
export function applyDelta(state: any, delta: any): any {
    if (typeof delta !== 'object' || delta === null || Array.isArray(delta)) {
        return delta;
    }

    // Start with a shallow copy of the state
    const newState = { ...state };
    for (const key in delta) {
        if (delta.hasOwnProperty(key)) {
            const value = delta[key];
            if (value === undefined) {
                // If the delta value is our sentinel, delete the key from the new state.
                delete newState[key];
            } else {
                // Otherwise, recursively apply the delta for this key.
                newState[key] = applyDelta(state ? state[key] : undefined, value);
            }
        }
    }
    return newState;
}