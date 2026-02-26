import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import * as dotenv from 'dotenv';
dotenv.config();

describe('DealsController (e2e)', () => {
    let app: INestApplication<App>;
    const TEST_TOKEN = 'Bearer eyJhbGciOiJFUzI1NiIsImtpZCI6IjI1ZjljNDBmLTc4YTItNDE0NS1hMjVhLWNkZGY2NTBhMzMxNCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2pod25nd2ZsZmVtbW9wbmNlaGphLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiIzZmFlZjY4Ny05ZDIyLTQ1YTYtOTI2ZC1hYjZmMWIzNzk1ZTIiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzcyMDgwNTgyLCJpYXQiOjE3NzIwNzY5ODIsImVtYWlsIjoiaW5mb0BzdGFyY2FyZ29zZXJ2aWNlLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZ29vZ2xlIiwicHJvdmlkZXJzIjpbImdvb2dsZSJdfSwidXNlcl9tZXRhZGF0YSI6eyJjdXN0b21fY2xhaW1zIjp7ImhkIjoic3RhcmNhcmdvc2VydmljZS5jb20ifSwiZW1haWwiOiJpbmZvQHN0YXJjYXJnb3NlcnZpY2UuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZ1bGxfbmFtZSI6IkNvcnJlbyBJbmZvIiwiaXNzIjoiaHR0cHM6Ly9hY2NvdW50cy5nb29nbGUuY29tIiwibmFtZSI6IkNvcnJlbyBJbmZvIiwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJwcm92aWRlcl9pZCI6IjExNDk0NzY3MDIyNjE4MDY2Mjk4MSIsInN1YiI6IjExNDk0NzY3MDIyNjE4MDY2Mjk4MSJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6Im9hdXRoIiwidGltZXN0YW1wIjoxNzcyMDc2OTgyfV0sInNlc3Npb25faWQiOiIyNmYzNTA5ZS03YWU5LTQyYTEtYjM4Yi0zZTZmNzY2NWE0NzQiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.pDNY5P1vhuKct6-6357HW34NEGaEWxuN4PxRWPvy39l7X7W9cBib6s_uI1M0eDcqDPMYIF9cYc2TTgV_av7MtQ';

    let testClientId: string;
    let testDealId: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
        await app.init();

        // Create a client for the deals
        const clientRes = await request(app.getHttpServer())
            .post('/clients')
            .set('Authorization', TEST_TOKEN)
            .send({
                company_name: 'DEALS_TEST_COMPANY',
                contact_name: 'DEALS_TEST_CONTACT',
            });
        testClientId = clientRes.body.id;
    });

    afterAll(async () => {
        if (testDealId) {
            await request(app.getHttpServer())
                .delete(`/deals/${testDealId}`)
                .set('Authorization', TEST_TOKEN);
        }
        if (testClientId) {
            await request(app.getHttpServer())
                .delete(`/clients/${testClientId}`)
                .set('Authorization', TEST_TOKEN);
        }
        await app.close();
    });

    describe('POST /deals', () => {
        it('should create a new deal', async () => {
            const response = await request(app.getHttpServer())
                .post('/deals')
                .set('Authorization', TEST_TOKEN)
                .send({
                    client_id: testClientId,
                    title: 'TEST_DEAL_E2E',
                    status: 'PROSPECT', // Corrected status ID
                    value: 1000,
                    type: 'AEREO', // Added mandatory field
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('id');
            testDealId = response.body.id;
        });
    });

    describe('GET /deals', () => {
        it('should get deals for a client', async () => {
            const response = await request(app.getHttpServer())
                .get(`/deals?clientId=${testClientId}`)
                .set('Authorization', TEST_TOKEN);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);
        });
    });

    describe('PATCH /deals/:id/move', () => {
        it('should move a deal to another status', async () => {
            const response = await request(app.getHttpServer())
                .patch(`/deals/${testDealId}/move`)
                .set('Authorization', TEST_TOKEN)
                .send({ status: 'PROCESO_COTIZACION' });

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('PROCESO_COTIZACION');
        });
    });

    describe('GET /deals/column', () => {
        it('should get deals by column status', async () => {
            const response = await request(app.getHttpServer())
                .get('/deals/column?columnId=PROCESO_COTIZACION')
                .set('Authorization', TEST_TOKEN);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('items');
            expect(Array.isArray(response.body.items)).toBe(true);
        });
    });
});
