import "./env";
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Secreto para firmar/verificar los JWT del panel admin. Sin valor por defecto:
// el repo es público, así que cualquier fallback permitiría falsificar tokens.
// Si falta, el login responde 503 y todo token se rechaza.
export const JWT_SECRET = process.env.JWT_SECRET ?? "";
if (!JWT_SECRET) {
  console.error("JWT_SECRET no está definido: el panel de administración queda deshabilitado.");
}

// Middleware que protege las rutas de administración.
// Espera un header `Authorization: Bearer <token>` y verifica la firma.
//   - 401 si no hay token.
//   - 403 si el token es inválido o expiró.
export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "Access denied" });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err) => {
    if (err) {
      res.status(403).json({ error: "Invalid token" });
      return;
    }
    next();
  });
};
