import { NextRequest, NextResponse } from 'next/server';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import { query } from '@/lib/db';

const issuer = `${(process.env.KEYCLOAK_URL || '').replace(/\/$/, '')}/realms/${process.env.KEYCLOAK_REALM || 'bettercamsur'}`;
const jwks = process.env.KEYCLOAK_URL ? createRemoteJWKSet(new URL(`${issuer}/protocol/openid-connect/certs`)) : null;
export type Principal = { sub: string; email: string; name: string; roles: string[]; payload: JWTPayload };
export async function authenticate(request: NextRequest): Promise<Principal | NextResponse> {
 const header = request.headers.get('authorization');
 if (!header?.startsWith('Bearer ') || !jwks) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
 try {
  const { payload } = await jwtVerify(header.slice(7), jwks, { issuer });
  if (payload.azp && payload.azp !== (process.env.KEYCLOAK_CLIENT_ID || 'bettercamsur-web')) return NextResponse.json({ error: 'Token was issued to an untrusted client' }, { status: 401 });
  const realm = (payload.realm_access as { roles?: string[] } | undefined)?.roles || [];
  const client = (payload.resource_access as Record<string, { roles?: string[] }> | undefined)?.[process.env.KEYCLOAK_CLIENT_ID || 'bettercamsur-web']?.roles || [];
  return { sub: String(payload.sub), email: String(payload.email || ''), name: String(payload.name || payload.preferred_username || ''), roles: [...realm, ...client], payload };
 } catch { return NextResponse.json({ error: 'Invalid or expired access token' }, { status: 401 }); }
}
export function isResponse(value: Principal | NextResponse): value is NextResponse { return value instanceof NextResponse; }
export async function requireSystemAdmin(request: NextRequest) {
 const principal = await authenticate(request);
 if (isResponse(principal)) return { response: principal, principal: null };
 if (!principal.roles.includes('SYSTEM_ADMIN')) return { response: NextResponse.json({ error: 'System administrator role required' }, { status: 403 }), principal: null };
 await upsertPrincipal(principal);
 return { response: null, principal };
}
export async function upsertPrincipal(principal: Principal) {
 await query(`INSERT INTO app_users (keycloak_sub,email,display_name,last_login_at) VALUES ($1,$2,$3,now())
 ON CONFLICT (keycloak_sub) DO UPDATE SET email=EXCLUDED.email, display_name=EXCLUDED.display_name,last_login_at=now(),updated_at=now()`, [principal.sub, principal.email, principal.name]);
 const result = await query<{id:string}>('SELECT id FROM app_users WHERE keycloak_sub=$1', [principal.sub]);
 return result.rows[0]?.id;
}

export async function authenticateOptional(request: NextRequest): Promise<Principal | null | NextResponse> {
 const header=request.headers.get('authorization');
 if(!header)return null;
 if(!header.startsWith('Bearer '))return NextResponse.json({error:'Invalid authorization header'},{status:401});
 const principal=await authenticate(request);
 return principal;
}
