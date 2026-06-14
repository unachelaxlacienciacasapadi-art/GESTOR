import "./env";
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Secreto para firmar/verificar los JWT del panel admin.
// Se lee de process.env.JWT_SECRET (cargado por ./env). El fallback solo aplica
// en entornos sin configurar; en producción SIEMPRE debe definirse en .env.
export const JWT_SECRET = process.env.JWT_SECRET || "casapadi-super-secret-key-2026-xyz";

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
