import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      // url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: true,
      logging: true,
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT) || 3306,
      username: process.env.DB_USER || 'username',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME
    })
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
