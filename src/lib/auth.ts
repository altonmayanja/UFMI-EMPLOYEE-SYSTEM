import { SignJWT, jwtVerify } from 'jose'
import { NextRequest, NextResponse } from 'next/server'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'daily-report-system-secret-key-change-in-production'
)

export interface JWTPayload {
  userId: string
  username: string
  role: 'admin' | 'employee'
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return {
      userId: payload.userId as string,
      username: payload.username as string,
      role: payload.role as 'admin' | 'employee',
    }
  } catch {
    return null
  }
}

export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  return null
}

/**
 * Authenticate a request and return the JWT payload.
 * Returns null if unauthenticated or token invalid.
 */
export async function authenticateRequest(request: NextRequest): Promise<JWTPayload | null> {
  const token = getTokenFromRequest(request)
  if (!token) return null
  return verifyToken(token)
}

/**
 * Authenticate a request and verify the user is an admin.
 * Returns the admin payload or null.
 */
export async function authenticateAdmin(request: NextRequest): Promise<JWTPayload | null> {
  const payload = await authenticateRequest(request)
  if (!payload || payload.role !== 'admin') return null
  return payload
}

/**
 * Helper: return a 401 Unauthorized response.
 */
export function unauthorizedResponse(message = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 })
}

/**
 * Helper: return a 403 Forbidden response.
 */
export function forbiddenResponse(message = 'Forbidden') {
  return NextResponse.json({ error: message }, { status: 403 })
}
