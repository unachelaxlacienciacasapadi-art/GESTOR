import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// Esquemas de validación (Zod)
// ─────────────────────────────────────────────────────────────────────────────

// Validación ESTRICTA del formulario público de propuestas (POST /api/talks).
// Todos los campos visibles son obligatorios y `_trap` es un honeypot anti-bots:
// debe llegar vacío (los bots tienden a rellenarlo). Si trae contenido, falla.
//
// IMPORTANTE: esta validación NO aplica a la creación desde el panel admin
// (POST /api/admin/talks), que es autenticada y acepta campos parciales.
export const talkSchema = z.object({
  title: z.string().min(5).max(200),
  abstract: z.string().min(10).max(2000),
  speaker_name: z.string().min(2).max(100),
  speaker_bio: z.string().min(10).max(1000),
  email: z.string().email(),
  phone: z.string().regex(/^\d{10}$/),
  _trap: z.string().max(0).optional().default(""),
  preferred_date_1: z.string().optional(),
  preferred_date_2: z.string().optional(),
});

// Validación del alta al newsletter (POST /api/subscribers).
export const subscriberSchema = z.object({
  email: z.string().email(),
});
