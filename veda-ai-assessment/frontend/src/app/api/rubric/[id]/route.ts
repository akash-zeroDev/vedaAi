import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { connectToDatabase } from '@/lib/mongoose';
import Rubric from '@/lib/models/Rubric';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Await params as required by Next.js 15
    const { id } = await params;
    const rubric = await Rubric.findById(id);

    if (!rubric) {
      return NextResponse.json({ error: 'Rubric not found' }, { status: 404 });
    }

    // Security check
    if (rubric.userId.toString() !== (session.user as any).id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ rubric }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching rubric:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
