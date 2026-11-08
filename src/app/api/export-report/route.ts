import { NextRequest, NextResponse } from 'next/server';
import { ArtifactInspectionResult } from '@/lib/scanner/artifact-engine';
import { buildSarifReport, buildMarkdownReport } from '@/lib/scanner/sarif-builder';

export async function POST(req: NextRequest) {
  try {
    const { result, format } = (await req.json()) as {
      result: ArtifactInspectionResult;
      format: 'sarif' | 'markdown' | 'json';
    };

    if (!result) {
      return NextResponse.json({ error: 'Inspection result data required.' }, { status: 400 });
    }

    const baseName = (result.fileName || 'artifact').replace(/[^a-zA-Z0-9_-]/g, '_');

    if (format === 'sarif') {
      const sarifData = buildSarifReport(result);
      return new NextResponse(JSON.stringify(sarifData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="niyantra-report-${baseName}.sarif"`
        }
      });
    }

    if (format === 'markdown') {
      const mdData = buildMarkdownReport(result);
      return new NextResponse(mdData, {
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': `attachment; filename="niyantra-report-${baseName}.md"`
        }
      });
    }

    // Default JSON export
    return new NextResponse(JSON.stringify(result, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="niyantra-report-${baseName}.json"`
      }
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Export generation failed.' },
      { status: 500 }
    );
  }
}

