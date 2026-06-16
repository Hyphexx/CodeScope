import crypto from "crypto";

const HASH_ALGORITHM = "sha256";
const HASH_ITERATIONS = 120000;
const HASH_KEY_LENGTH = 64;
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const LOCAL_DEV_AUTH_SECRET = "codescope-local-dev-secret";
const MIN_AUTH_SECRET_LENGTH = 32;

function base64UrlEncode(value) {
  return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function getAuthSecret() {
  const authSecret = process.env.AUTH_SECRET?.trim();

  if (authSecret) {
    if (authSecret.length < MIN_AUTH_SECRET_LENGTH) {
      throw new Error(`AUTH_SECRET must be at least ${MIN_AUTH_SECRET_LENGTH} characters.`);
    }

    return authSecret;
  }

  if (process.env.NODE_ENV === "production" || process.env.MONGO_URI) {
    throw new Error("AUTH_SECRET is required when user accounts are enabled.");
  }

  return LOCAL_DEV_AUTH_SECRET;
}

function signPayload(payload) {
  return crypto.createHmac("sha256", getAuthSecret()).update(payload).digest("base64url");
}

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = await new Promise((resolve, reject) => {
    crypto.pbkdf2(
      password,
      salt,
      HASH_ITERATIONS,
      HASH_KEY_LENGTH,
      HASH_ALGORITHM,
      (error, derivedKey) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(derivedKey.toString("hex"));
      }
    );
  });

  return `${HASH_ALGORITHM}:${HASH_ITERATIONS}:${salt}:${hash}`;
}

export async function verifyPassword(password, storedHash) {
  const [algorithm, iterationsText, salt, expectedHash] = storedHash.split(":");
  const iterations = Number(iterationsText);

  if (!algorithm || !iterations || !salt || !expectedHash) {
    return false;
  }

  const actualHash = await new Promise((resolve, reject) => {
    crypto.pbkdf2(
      password,
      salt,
      iterations,
      Buffer.from(expectedHash, "hex").length,
      algorithm,
      (error, derivedKey) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(derivedKey);
      }
    );
  });

  return crypto.timingSafeEqual(Buffer.from(expectedHash, "hex"), actualHash);
}

export function createToken(user) {
  const payload = base64UrlEncode(
    JSON.stringify({
      sub: String(user._id),
      username: user.username,
      exp: Date.now() + TOKEN_TTL_MS
    })
  );
  const signature = signPayload(payload);

  return `${payload}.${signature}`;
}

export function verifyToken(token) {
  const [payload, signature] = token.split(".");

  try {
    if (!payload || !signature || signPayload(payload) !== signature) {
      return null;
    }

    const data = JSON.parse(base64UrlDecode(payload));

    if (!data.sub || !data.exp || Date.now() > data.exp) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}
