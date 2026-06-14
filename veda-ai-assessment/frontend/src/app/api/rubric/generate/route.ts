import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { connectToDatabase } from '@/lib/mongoose';
import Rubric from '@/lib/models/Rubric';
import { rubricQueue } from '@/lib/queue/rubricQueue';
// Importing this ensures the worker initializes in the Next.js process
import '@/lib/queue/rubricQueue';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, description } = body;

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
    }

    await connectToDatabase();

    // 1. Create the Rubric in MongoDB
    const rubric = await Rubric.create({
      userId: (session.user as any).id,
      title,
      description,
      status: 'PENDING',
    });

    // 2. Push to Queue
    await rubricQueue.add('generate-rubric', {
      rubricId: rubric._id.toString(),
      assignmentDescription: description,
    });

    // 3. Return 202 Accepted
    return NextResponse.json({ rubricId: rubric._id }, { status: 202 });
  } catch (error: any) {
    console.error('Error generating rubric:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
