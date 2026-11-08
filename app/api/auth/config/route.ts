import { NextResponse } from 'next/server';
export const dynamic='force-dynamic';
export async function GET(){return NextResponse.json({url:process.env.KEYCLOAK_URL,realm:process.env.KEYCLOAK_REALM||'bettercamsur',clientId:process.env.KEYCLOAK_CLIENT_ID||'bettercamsur-web'});}
