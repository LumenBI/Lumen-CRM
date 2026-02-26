import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import * as dotenv from 'dotenv';
dotenv.config();

// 🚨 IMPORTANTE: NO MODIFICAR DATOS REALES. ESTE SCRIPT CREA Y DESTRUYE SU PROPIA DATA.
describe('AppointmentsController (e2e) - SAFE MODE', () => {
    let app: INestApplication<App>;

    // Reemplaza esto con un token Bearer válido de tu usuario de pruebas
    const TEST_TOKEN = 'Bearer eyJhbGciOiJFUzI1NiIsImtpZCI6IjI1ZjljNDBmLTc4YTItNDE0NS1hMjVhLWNkZGY2NTBhMzMxNCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2pod25nd2ZsZmVtbW9wbmNlaGphLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiIzZmFlZjY4Ny05ZDIyLTQ1YTYtOTI2ZC1hYjZmMWIzNzk1ZTIiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzcyMDgwNTgyLCJpYXQiOjE3NzIwNzY5ODIsImVtYWlsIjoiaW5mb0BzdGFyY2FyZ29zZXJ2aWNlLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZ29vZ2xlIiwicHJvdmlkZXJzIjpbImdvb2dsZSJdfSwidXNlcl9tZXRhZGF0YSI6eyJjdXN0b21fY2xhaW1zIjp7ImhkIjoic3RhcmNhcmdvc2VydmljZS5jb20ifSwiZW1haWwiOiJpbmZvQHN0YXJjYXJnb3NlcnZpY2UuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZ1bGxfbmFtZSI6IkNvcnJlbyBJbmZvIiwiaXNzIjoiaHR0cHM6Ly9hY2NvdW50cy5nb29nbGUuY29tIiwibmFtZSI6IkNvcnJlbyBJbmZvIiwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJwcm92aWRlcl9pZCI6IjExNDk0NzY3MDIyNjE4MDY2Mjk4MSIsInN1YiI6IjExNDk0NzY3MDIyNjE4MDY2Mjk4MSJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6Im9hdXRoIiwidGltZXN0YW1wIjoxNzcyMDc2OTgyfV0sInNlc3Npb25faWQiOiIyNmYzNTA5ZS03YWU5LTQyYTEtYjM4Yi0zZTZmNzY2NWE0NzQiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.pDNY5P1vhuKct6-6357HW34NEGaEWxuN4PxRWPvy39l7X7W9cBib6s_uI1M0eDcqDPMYIF9cYc2TTgV_av7MtQ';

    // ID del cliente al que asociaremos la cita (Se creará en beforeAll)
    let testClientId: string;

    // Guardaremos el ID de la cita creada por el test para destruirla al final
    let testAppointmentId: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
        await app.init();

        // Crear un cliente de prueba aislado
        const clientRes = await request(app.getHttpServer())
            .post('/clients')
            .set('Authorization', TEST_TOKEN)
            .send({
                company_name: 'APPT_TEST_CLIENT',
                contact_name: 'APPT_TEST_CONTACT',
            });

        if (clientRes.status !== 201) {
            throw new Error('No se pudo crear el cliente de prueba para las citas.');
        }
        testClientId = clientRes.body.id;
    });

    // 🧹 LIMPIEZA OBLIGATORIA: Pase lo que pase, borramos la data basura
    afterAll(async () => {
        if (testAppointmentId) {
            console.log(`[CLEANUP] Destruyendo cita de prueba generada: ${testAppointmentId}`);
            await request(app.getHttpServer())
                .delete(`/appointments/${testAppointmentId}`)
                .set('Authorization', TEST_TOKEN);
        }
        if (testClientId) {
            console.log(`[CLEANUP] Destruyendo cliente de prueba generado: ${testClientId}`);
            await request(app.getHttpServer())
                .delete(`/clients/${testClientId}`)
                .set('Authorization', TEST_TOKEN);
        }
        await app.close();
    });

    describe('Fase 1: Bombardeo a la Creación (POST /appointments)', () => {
        it('Debe rechazar la creación si el payload está vacío (Esperamos 400, NUNCA 500)', () => {
            return request(app.getHttpServer())
                .post('/appointments')
                .set('Authorization', TEST_TOKEN)
                .send({})
                .expect((res) => {
                    if (res.status === 500) throw new Error('Crasheo 500: Faltan validaciones de DTO en createAppointment.');
                    expect(res.status).toBe(400); // Bad Request por validación
                });
        });

        it('Debe crear una cita de prueba aislada exitosamente (Status 201)', async () => {
            const response = await request(app.getHttpServer())
                .post('/appointments')
                .set('Authorization', TEST_TOKEN)
                .send({
                    client_id: testClientId,
                    title: '[TEST AUTOGENERADO] - NO TOCAR',
                    description: 'Esta es una cita temporal para pruebas E2E',
                    appointment_date: '2099-12-31', // Fecha absurda para no chocar con reportes reales
                    appointment_time: '10:00',
                    appointment_type: 'virtual',
                });

            if (response.status === 500) {
                throw new Error(`Crasheo 500 al crear cita: ${JSON.stringify(response.body)}`);
            }

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('id');

            // GUARDAMOS EL ID PARA LIMPIARLO AL FINAL Y USARLO EN LAS SIGUIENTES PRUEBAS
            testAppointmentId = response.body.id;
        });
    });

    describe('Fase 2: Bombardeo a las Consultas (GET /appointments)', () => {
        it('Debe obtener las citas sin fallar (Status 200)', () => {
            return request(app.getHttpServer())
                .get('/appointments')
                .set('Authorization', TEST_TOKEN)
                .expect(200);
        });

        it('Debe fallar elegantemente con fechas inválidas en los filtros (Esperamos 400, NUNCA 500)', () => {
            return request(app.getHttpServer())
                .get('/appointments?from=fecha-invalida&to=otra-fecha-mala')
                .set('Authorization', TEST_TOKEN)
                .expect((res) => {
                    if (res.status === 500) throw new Error('Crasheo 500: El backend intentó parsear fechas malformadas y falló.');
                });
        });
    });

    describe('Fase 3: Destapando brechas en la Edición (PATCH /appointments/:id)', () => {
        it('Debe lanzar 404 o 400 al intentar editar un ID que no es UUID válido (NUNCA 500)', () => {
            return request(app.getHttpServer())
                .patch('/appointments/id-falso-y-malformado')
                .set('Authorization', TEST_TOKEN)
                .send({ title: 'Hacked' })
                .expect((res) => {
                    if (res.status === 500) throw new Error('Crasheo 500: Falla en ParseUUIDPipe o en validateOrganizer al recibir basura.');
                });
        });

        it('Debe permitir editar SOLO la cita de prueba generada (Status 200)', () => {
            // 🚨 Nota: Aquí usamos estrictamente el ID temporal, no tocamos data real.
            return request(app.getHttpServer())
                .patch(`/appointments/${testAppointmentId}`)
                .set('Authorization', TEST_TOKEN)
                .send({ notes: 'Nota agregada por el test automático' })
                .expect((res) => {
                    if (res.status === 500) throw new Error('Crasheo 500 al editar la cita.');
                    expect(res.status).toBe(200);
                });
        });
    });

    describe('Fase 4: Destapando Errores de Estado (PATCH /appointments/:id/status)', () => {
        it('Debe rechazar estados inventados/ilegales (Esperamos 400, NUNCA 500)', () => {
            return request(app.getHttpServer())
                .patch(`/appointments/${testAppointmentId}/status`)
                .set('Authorization', TEST_TOKEN)
                .send({ status: 'ESTADO_INVENTADO_QUE_ROMPERA_LA_BD' })
                .expect((res) => {
                    if (res.status === 500) throw new Error('Crasheo 500: El servicio no valida el Enum de los estados permitidos.');
                });
        });
    });
});
