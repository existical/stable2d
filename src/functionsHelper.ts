// GENERIC HELPER FUNCTIONS

export function isNumber(n: any): n is number {
    return typeof n === 'number';
}

export function isString(n: any): n is string {
    return typeof n === 'string';
}

export function isBoolean(n: any): n is boolean {
    return typeof n === 'boolean';
}

export function getRandomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getRandomFloatNumber(min: number, max: number): number {
    return Math.random() * (max - min + 1) + min;
}

export function isFunctionNotEmpty(func: Function): boolean {
    // Get content between first { and last }
    const m = func.toString().match(/\{([\s\S]*)\}/m);
    if (m) {
        // Strip comments
        const filtered = m[1].replace(/^\s*\/\/.*$/mg, '');
        return filtered.trim().length > 0;
    }
    return false;
}

// Returns text string of the environment where script is running
export function detectEnvironment(): "node" | "browser" | "unknown" {
    const isNode = typeof process !== 'undefined' && process?.versions?.node;
    const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';

    if (isNode) {
    // Code for Node.js environment
        return 'node';
    } else if (isBrowser) {
    // Code for browser environment
        return 'browser';
    } else {
        return 'unknown';
    }
}


// Returns 'true' if script is running in Node.js environment, otherwise 'false'
export function isNode(): boolean {
    const isNode = typeof process !== 'undefined' && process?.versions?.node;
    return isNode ? true : false;
}

// Returns 'true' if script is running in the Browser, otherwise 'false'
export function isBrowser(): boolean {
    const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';
    return isBrowser ? true : false;
}

// This function removes all object keys, so in the end object is {}
export function deleteObjectKeys(obj: any): void {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        delete obj[key];
      }
    }
}

// This function checks if an object is empty (contains no properties): {}
export function isObjectEmpty(obj: Record<string, unknown>): boolean {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        return false;
      }
    }
    return true;
}

// This function fetches JSON data from a URL and returns it as a Promise
export async function fetchJsonData<T>(url: string): Promise<T> {
    try {
      const response = await fetch(url);
      const json = await response.json();
      return json as T;
    } catch (error) {
      throw new Error(`Failed to fetch JSON data: ${error}`);
    }
  }