// Utility Functions
export function parseError(error) {
    const regex = /{"error":(.*)}/gm;
    const m = regex.exec(error);
    try {
        const e = m?.[1]; // Use optional chaining to handle potential null match
        const err = e ? JSON.parse(e) : null; // Handle potential null e
        return err?.message || error; // Use optional chaining for err
    } catch (e) {
        return error;
    }
}