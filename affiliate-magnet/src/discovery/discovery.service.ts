import { Injectable } from '@nestjs/common';
import { Platform } from '@prisma/client';
import { YoutubeProvider } from './providers/youtube.provider';
import { WebProvider } from './providers/web.provider';
import { IngestService } from './ingest.service';
import { leadsFromCsv, leadsFromRecords } from './csv';
import { parseLeadUrl } from './url-parser';
import { RawLead } from './types';

export interface UrlOutcome {
  url: string;
  status: 'saved' | 'skipped';
  note?: string;
  leadId?: string;
}

@Injectable()
export class DiscoveryService {
  constructor(
    private youtube: YoutubeProvider,
    private web: WebProvider,
    private ingest: IngestService,
  ) {}

  async searchYoutube(query: string, limit: number, opts: { regionCode?: string; language?: string }) {
    const leads = await this.youtube.search(query, limit, opts);
    return { found: leads.length, ...(await this.ingest.upsertMany(leads)) };
  }

  /** Paste links in any mix — each is read in the best way available for its platform. */
  async addUrls(urls: string[]): Promise<UrlOutcome[]> {
    const out: UrlOutcome[] = [];
    for (const input of urls.slice(0, 50)) {
      const parsed = parseLeadUrl(input);
      if (!parsed) {
        out.push({ url: input, status: 'skipped', note: "Doesn't look like a channel, profile or website link." });
        continue;
      }
      try {
        let raw: RawLead | null = null;
        let note: string | undefined;
        if (parsed.platform === Platform.YOUTUBE && this.youtube.configured) raw = await this.youtube.resolve(parsed.handle);
        else if (parsed.platform === Platform.TELEGRAM) raw = await this.web.telegram(parsed.handle);
        else if (parsed.platform === Platform.WEBSITE) raw = await this.web.website(parsed.url);

        if (!raw) {
          // TikTok, Instagram, X, Reddit (and anything we couldn't read) can't be read automatically —
          // save the link so nothing is lost, and the manager can add a bio or import details.
          raw = { platform: parsed.platform, handle: parsed.handle, url: parsed.url, displayName: parsed.handle, source: 'url' };
          note =
            parsed.platform === Platform.WEBSITE || parsed.platform === Platform.TELEGRAM
              ? 'Could not read this page (blocked, private or not found) — saved as a bare link.'
              : 'Saved as a link. This platform cannot be read automatically — add a bio or import details so it can be scored.';
        }
        const saved = await this.ingest.upsert(raw);
        out.push({ url: input, status: 'saved', leadId: saved.id, note });
      } catch (err) {
        out.push({ url: input, status: 'skipped', note: err instanceof Error ? err.message : 'Failed' });
      }
    }
    return out;
  }

  async importFile(format: 'csv' | 'json', data: unknown) {
    const parsed =
      format === 'csv'
        ? leadsFromCsv(String(data))
        : leadsFromRecords(Array.isArray(data) ? (data as Record<string, unknown>[]) : [], 'json');
    const saved = await this.ingest.upsertMany(parsed.leads);
    return { created: saved.created, updated: saved.updated, errors: parsed.errors };
  }
}
