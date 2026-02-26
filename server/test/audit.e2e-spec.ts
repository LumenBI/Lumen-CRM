import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('System Audit (e2e)', () => {
    let app: INestApplication<App>;
    const TEST_TOKEN = 'Bearer eyJhbGciOiJFUzI1NiIsImtpZCI6IjI1ZjljNDBmLTc4YTItNDE0NS1hMjVhLWNkZGY2NTBhMzMxNCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2pod25nd2ZsZmVtbW9wbmNlaGphLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiIzZmFlZjY4Ny05ZDIyLTQ1YTYtOTI2ZC1hYjZmMWIzNzk1ZTIiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzcyMDgwNTgyLCJpYXQiOjE3NzIwNzY5ODIsImVtYWlsIjoiaW5mb0BzdGFyY2FyZ29zZXJ2aWNlLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZ29vZ2xlIiwicHJvdmlkZXJzIjpbImdvb2dsZSJdfSwidXNlcl9tZXRhZGF0YSI6eyJjdXN0b21fY2xhaW1zIjp7ImhkIjoic3RhcmNhcmdvc2VydmljZS5jb20ifSwiZW1haWwiOiJpbmZvQHN0YXJjYXJnb3NlcnZpY2UuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZ1bGxfbmFtZSI6IkNvcnJlbyBJbmZvIiwiaXNzIjoiaHR0cHM6Ly9hY2NvdW50cy5nb29nbGUuY29tIiwibmFtZSI6IkNvcnJlbyBJbmZvIiwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJwcm92aWRlcl9pZCI6IjExNDk0NzY3MDIyNjE4MDY2Mjk4MSIsInN1YiI6IjExNDk0NzY3MDIyNjE4MDY2Mjk4MSJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6Im9hdXRoIiwidGltZXN0YW1wIjoxNzcyMDc2OTgyfV0sInNlc3Npb25faWQiOiIyNmYzNTA5ZS03YWU5LTQyYTEtYjM4Yi0zZTZmNzY2NWE0NzQiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.pDNY5P1vhuKct6-6357HW34NEGaEWxuN4PxRWPvy39l7X7W9cBib6s_uI1M0eDcqDPMYIF9cYc2TTgV_av7MtQ';

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('Stats Module', () => {
        it('GET /stats - (Status 200)', async () => {
            const response = await request(app.getHttpServer())
                .get('/stats')
                .set('Authorization', TEST_TOKEN);
            expect(response.status).toBe(200);
        });

        it('GET /stats/history - (Status 200)', async () => {
            const response = await request(app.getHttpServer())
                .get('/stats/history')
                .set('Authorization', TEST_TOKEN);
            expect(response.status).toBe(200);
        });

        it('GET /stats/kanban - (Status 200)', async () => {
            const response = await request(app.getHttpServer())
                .get('/stats/kanban')
                .set('Authorization', TEST_TOKEN);
            expect(response.status).toBe(200);
        });
    });

    describe('Notifications Module', () => {
        it('GET /notifications/check - (Status 200)', async () => {
            const response = await request(app.getHttpServer())
                .get('/notifications/check')
                .set('Authorization', TEST_TOKEN);
            expect(response.status).toBe(200);
        });
    });

    describe('Users Module', () => {
        it('GET /users - (Status 200)', async () => {
            const response = await request(app.getHttpServer())
                .get('/users')
                .set('Authorization', TEST_TOKEN);
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });
    });

    describe('AI Module', () => {
        it('POST /ai/jargon-buster - (Status 201)', async () => {
            const response = await request(app.getHttpServer())
                .post('/ai/jargon-buster')
                .set('Authorization', TEST_TOKEN)
                .send({ items: ['Incoterms', 'FOB', 'CIF'] });

            // AI Service might return 400 if not configured, but we want to check it doesn't 500
            expect([201, 200, 400]).toContain(response.status);
        });
    });

    describe('App Health', () => {
        it('GET / - (Status 200)', async () => {
            const response = await request(app.getHttpServer()).get('/');
            expect(response.status).toBe(200);
        });
    });
});
