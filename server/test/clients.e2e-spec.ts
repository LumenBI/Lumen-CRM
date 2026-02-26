import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import * as dotenv from 'dotenv';
dotenv.config();

describe('ClientsController (e2e)', () => {
    let app: INestApplication<App>;
    const TEST_TOKEN = 'Bearer eyJhbGciOiJFUzI1NiIsImtpZCI6IjI1ZjljNDBmLTc4YTItNDE0NS1hMjVhLWNkZGY2NTBhMzMxNCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2pod25nd2ZsZmVtbW9wbmNlaGphLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiIzZmFlZjY4Ny05ZDIyLTQ1YTYtOTI2ZC1hYjZmMWIzNzk1ZTIiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzcyMDgwNTgyLCJpYXQiOjE3NzIwNzY5ODIsImVtYWlsIjoiaW5mb0BzdGFyY2FyZ29zZXJ2aWNlLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZ29vZ2xlIiwicHJvdmlkZXJzIjpbImdvb2dsZSJdfSwidXNlcl9tZXRhZGF0YSI6eyJjdXN0b21fY2xhaW1zIjp7ImhkIjoic3RhcmNhcmdvc2VydmljZS5jb20ifSwiZW1haWwiOiJpbmZvQHN0YXJjYXJnb3NlcnZpY2UuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZ1bGxfbmFtZSI6IkNvcnJlbyBJbmZvIiwiaXNzIjoiaHR0cHM6Ly9hY2NvdW50cy5nb29nbGUuY29tIiwibmFtZSI6IkNvcnJlbyBJbmZvIiwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJwcm92aWRlcl9pZCI6IjExNDk0NzY3MDIyNjE4MDY2Mjk4MSIsInN1YiI6IjExNDk0NzY3MDIyNjE4MDY2Mjk4MSJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6Im9hdXRoIiwidGltZXN0YW1wIjoxNzcyMDc2OTgyfV0sInNlc3Npb25faWQiOiIyNmYzNTA5ZS03YWU5LTQyYTEtYjM4Yi0zZTZmNzY2NWE0NzQiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.pDNY5P1vhuKct6-6357HW34NEGaEWxuN4PxRWPvy39l7X7W9cBib6s_uI1M0eDcqDPMYIF9cYc2TTgV_av7MtQ';

    let testClientId: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
        await app.init();
    });

    afterAll(async () => {
        if (testClientId) {
            await request(app.getHttpServer())
                .delete(`/clients/${testClientId}`)
                .set('Authorization', TEST_TOKEN);
        }
        await app.close();
    });

    describe('POST /clients', () => {
        it('should create a new client', async () => {
            const response = await request(app.getHttpServer())
                .post('/clients')
                .set('Authorization', TEST_TOKEN)
                .send({
                    company_name: 'TEST_E2E_COMPANY',
                    contact_name: 'TEST_E2E_CONTACT',
                    email: 'test_e2e@example.com',
                    phone: '123456789',
                    commodity: 'TEST_COMMODITY',
                    origin: 'MANUAL',
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('id');
            testClientId = response.body.id;
        });

        it('should reject creation if mandatory fields are missing', async () => {
            const response = await request(app.getHttpServer())
                .post('/clients')
                .set('Authorization', TEST_TOKEN)
                .send({
                    email: 'test_e2e@example.com',
                });

            expect(response.status).toBe(400); // Now correctly returns 400 due to hardening
        });
    });

    describe('GET /clients/list', () => {
        it('should list clients', async () => {
            const response = await request(app.getHttpServer())
                .get('/clients/list')
                .set('Authorization', TEST_TOKEN);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('items');
            expect(Array.isArray(response.body.items)).toBe(true);
        });
    });

    describe('GET /clients/:id', () => {
        it('should get client details', async () => {
            const response = await request(app.getHttpServer())
                .get(`/clients/${testClientId}`)
                .set('Authorization', TEST_TOKEN);

            expect(response.status).toBe(200);
            expect(response.body.client.id).toBe(testClientId);
        });
    });

    describe('PATCH /clients/:id', () => {
        it('should update client', async () => {
            const response = await request(app.getHttpServer())
                .patch(`/clients/${testClientId}`)
                .set('Authorization', TEST_TOKEN)
                .send({
                    company_name: 'TEST_E2E_COMPANY_UPDATED',
                });

            expect(response.status).toBe(200);
            expect(response.body.company_name).toBe('TEST_E2E_COMPANY_UPDATED');
        });
    });

    describe('Interactions', () => {
        let testInteractionId: string;

        it('should create an interaction', async () => {
            const response = await request(app.getHttpServer())
                .post('/clients/interactions')
                .set('Authorization', TEST_TOKEN)
                .send({
                    clientId: testClientId, // Fixed: service expects clientId
                    category: 'CALL',
                    summary: 'Test interaction notes',
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('id');
            testInteractionId = response.body.id;
        });

        it('should delete an interaction', async () => {
            const response = await request(app.getHttpServer())
                .delete(`/clients/interactions/${testInteractionId}`)
                .set('Authorization', TEST_TOKEN);

            expect(response.status).toBe(200);
        });
    });
});
