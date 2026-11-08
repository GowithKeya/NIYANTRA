import { NextRequest, NextResponse } from 'next/server';
import { inspectArtifact } from '@/lib/scanner/artifact-engine';
import { validateFileType } from '@/lib/scanner/file-registry';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    // Multipart Form Data (Real file upload)
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file');
      const enableGemini = formData.get('enableGemini') === 'true';
      const apiKey = (formData.get('apiKey') as string) || '';

      if (!file || !(file instanceof File)) {
        return NextResponse.json(
          { error: 'No file provided in form payload.' },
          { status: 400 }
        );
      }

      // Check registration
      const validation = validateFileType(file.name, file.size);
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error || 'File validation failed.' },
          { status: 422 }
        );
      }

      const result = await inspectArtifact(file, { enableGemini, apiKey });
      return NextResponse.json(result);
    }

    // JSON Payload
    const body = await req.json();
    const { fileName, content, enableGemini, apiKey } = body;

    if (!fileName || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Invalid payload: "fileName" and string "content" required.' },
        { status: 400 }
      );
    }

    const validation = validateFileType(fileName, content.length);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error || 'File validation failed.' },
        { status: 422 }
      );
    }

    const result = await inspectArtifact(
      { name: fileName, text: content },
      { enableGemini: Boolean(enableGemini), apiKey }
    );

    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Artifact inspection pipeline failed.' },
      { status: 500 }
    );
  }
}

