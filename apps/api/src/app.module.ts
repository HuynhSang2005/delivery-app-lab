import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { configModuleOptions, configNamespaces } from './config';

@Module({
  imports: [
    ConfigModule.forRoot({
      ...configModuleOptions,
      load: configNamespaces,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
