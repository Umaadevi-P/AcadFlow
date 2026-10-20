import { User } from "../models/User.js";
import { signToken } from "../middleware/auth.js";
import { ApiError } from "../middleware/errorHandler.js";

/**
 * POST /api/auth/login
 * Body: { email, password }  →  { token, user }
 * Returns 401 for any bad credentials so the reason isn't revealed.
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new ApiError(400, "Email and password are required.");
    }

    // Password is select:false, so we explicitly request it for the check.
    const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select("+password");
    if (!user || user.status !== "active" || !(await user.matchPassword(password))) {
      throw new ApiError(401, "Invalid email or password.");
    }

    const token = signToken(user);
    res.json({ token, user: user.toPublicJSON() });
  } catch (err) {
    next(err);
  }
}

/** GET /api/auth/me → { user } for the currently authenticated account. */
export function me(req, res) {
  res.json({ user: req.user.toPublicJSON() });
}

/**
 * POST /api/auth/logout
 * JWTs are stateless, so logout is primarily a client-side action (discard the
 * token). This endpoint exists so the app can call it for symmetry.
 */
export function logout(_req, res) {
  res.json({ ok: true });
}
