import { Module } from '@nestjs/common';
import { DiscoveryController } from './discovery.controller';
import { DiscoveryService } from './discovery.service';
import { IngestService } from './ingest.service';
import { YoutubeProvider } from './providers/youtube.provider';
import { WebProvider } from './providers/web.provider';

@Module({
  controllers: [DiscoveryController],
  providers: [DiscoveryService, IngestService, YoutubeProvider, WebProvider],
  exports: [IngestService],
})
export class DiscoveryModule {}
