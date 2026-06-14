import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { connectToDatabase } from '@/lib/mongoose';
import Summary from '@/lib/models/Summary';
import { summaryQueue } from '@/lib/queue/summaryQueue';
// Ensure worker initializes in this process
import '@/lib/queue/summaryQueue';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;

    if (!file || !title) {
      return NextResponse.json({ error: 'File and title are required' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be under 10MB' }, { status: 400 });
    }

    // Upload directly to S3 (same approach as difficulty analyzer)
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const s3Key = `uploads/summary/${(session.user as any).id}/${Date.now()}_${sanitizedFileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const putCmd = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: s3Key,
      Body: buffer,
      ContentType: 'application/pdf',
    });

    await s3Client.send(putCmd);
    console.log(`[Summary Upload] Uploaded to S3: ${s3Key}`);

    await connectToDatabase();

    // 1. Create Summary Document — store the S3 key (NOT a URL)
    const summary = await Summary.create({
      userId: (session.user as any).id,
      title,
      fileName: file.name,
      fileUrl: s3Key,       // ← Real S3 key, worker will use GetObjectCommand
      status: 'PENDING',
    });

    // 2. Enqueue Job with the S3 key
    await summaryQueue.add('generate-summary', {
      summaryId: summary._id.toString(),
      fileUrl: s3Key,       // ← Real S3 key passed to the worker
    });

    return NextResponse.json({ summaryId: summary._id }, { status: 202 });
  } catch (error: any) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
