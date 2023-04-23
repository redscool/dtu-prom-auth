import { createHash } from 'crypto';

export const isDTUEmail = email => {
    const domain = email.toLowerCase().split('@')[1];
    return domain === "dtu.ac.in";
}

export const computeSHA256 = lines => {
    const hash = createHash("sha256");
    hash.write(lines);
    return hash.digest("base64");
}