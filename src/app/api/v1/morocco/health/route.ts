import { NextRequest } from 'next/server';

/**
 * Health check endpoint for Morocco API
 * Use this to verify the Morocco API routes are working
 */
export async function GET(req: NextRequest) {
  return Response.json({
    ok: true,
    service: 'Morocco Intelligence API',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    routes: {
      intelligence: '/api/v1/morocco/intelligence',
      health: '/api/v1/morocco/health',
    },
    message: 'Morocco API is working! If you can see this, the route is registered correctly.',
  });
}
