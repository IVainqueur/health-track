export const findMissing = (obj) => {
    return Object.keys(obj).filter((key) => obj[key] === undefined || obj[key] === null || obj[key] === '');
}