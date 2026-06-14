import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { connectToDatabase } from '@/lib/mongoose';
import Analysis from '@/lib/models/Analysis';
import { analysisQueue } from '@/lib/queue/analysisQueue';
import '@/lib/queue/analysisQueue';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, questions, s3Key } = await request.json();

    if (!title || (!s3Key && (!Array.isArray(questions) || questions.length === 0))) {
      return NextResponse.json(
        { error: 'Title and either an array of questions or an s3Key are required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Create the PENDING document
    const analysisDoc = await Analysis.create({
      userId: session.user.id,
      title,
      status: 'PENDING',
    });

    // Add to BullMQ
    await analysisQueue.add('analyze-difficulty', {
      analysisId: analysisDoc._id,
      questions: questions || [],
      s3Key: s3Key || null,
    });

    return NextResponse.json({ analysisId: analysisDoc._id }, { status: 202 });
  } catch (error: any) {
    console.error('Error starting analysis job:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
