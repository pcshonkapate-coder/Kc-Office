import { NextResponse } from 'next/server';
import { getCloudDatabase } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  try {
    const db = await getCloudDatabase();
    // Ping MongoDB Atlas cloud
    const pingResult = await db.command({ ping: 1 });
    const latencyMs = Date.now() - startTime;

    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    return NextResponse.json({
      status: 'healthy',
      cloud_database: 'MongoDB Atlas',
      database_name: db.databaseName,
      latency_ms: `${latencyMs}ms`,
      ping: pingResult?.ok === 1 ? 'OK' : 'DEGRADED',
      collections_count: collectionNames.length,
      collections: collectionNames,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'degraded',
      cloud_database: 'MongoDB Atlas',
      error: error?.message || 'Could not connect to MongoDB Atlas',
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}
