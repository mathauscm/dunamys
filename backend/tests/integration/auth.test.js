const request = require('supertest');
const app = require('../../src/app');
const { prisma } = require('../../src/config/database');
const bcrypt = require('bcryptjs');

describe('Auth Integration Tests', () => {
  let testUser;
  let testCampus;

  beforeAll(async () => {
    // Criar campus de teste
    testCampus = await prisma.campus.create({
      data: {
        name: 'Campus Teste',
        city: 'São Paulo',
        active: true
      }
    });
  });

  afterAll(async () => {
    // Limpar dados de teste
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'test'
        }
      }
    });
    await prisma.campus.deleteMany({
      where: {
        name: 'Campus Teste'
      }
    });
  });

  beforeEach(async () => {
    // Limpar usuários de teste antes de cada teste
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'test'
        }
      }
    });
  });

  describe('POST /api/auth/register', () => {
    it('deve registrar um novo usuário com sucesso', async () => {
      const userData = {
        name: 'João Test',
        email: 'joao.test@email.com',
        password: 'senha123',
        phone: '11999999999',
        campusId: testCampus.id
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.status).toBe('PENDING');
      expect(response.body.user.role).toBe('MEMBER');

      // Verificar se usuário foi criado no banco
      const createdUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });
      expect(createdUser).toBeTruthy();
      expect(createdUser.name).toBe(userData.name);
    });

    it('deve retornar erro 400 para dados inválidos', async () => {
      const userData = {
        name: 'João Test',
        email: 'email-invalido',
        password: '123', // senha muito curta
        phone: '11999999999'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);
    });

    it('deve retornar erro 400 para email já cadastrado', async () => {
      const userData = {
        name: 'João Test',
        email: 'joao.test@email.com',
        password: 'senha123',
        phone: '11999999999',
        campusId: testCampus.id
      };

      // Primeiro registro
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Segundo registro com mesmo email
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Criar usuário ativo para testes de login
      const hashedPassword = await bcrypt.hash('senha123', 12);
      testUser = await prisma.user.create({
        data: {
          name: 'João Test',
          email: 'joao.test@email.com',
          password: hashedPassword,
          phone: '11999999999',
          campusId: testCampus.id,
          role: 'MEMBER',
          status: 'ACTIVE'
        }
      });
    });

    it('deve fazer login com sucesso', async () => {
      const loginData = {
        email: 'joao.test@email.com',
        password: 'senha123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(loginData.email);
      expect(response.body.user.userType).toBe('member');

      // Verificar se lastLogin foi atualizado
      const updatedUser = await prisma.user.findUnique({
        where: { id: testUser.id }
      });
      expect(updatedUser.lastLogin).toBeTruthy();
    });

    it('deve retornar erro 401 para credenciais inválidas', async () => {
      const loginData = {
        email: 'joao.test@email.com',
        password: 'senhaErrada'
      };

      await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);
    });

    it('deve retornar erro 401 para usuário não ativo', async () => {
      // Criar usuário PENDING
      const hashedPassword = await bcrypt.hash('senha123', 12);
      await prisma.user.create({
        data: {
          name: 'Maria Test',
          email: 'maria.test@email.com',
          password: hashedPassword,
          phone: '11999999999',
          campusId: testCampus.id,
          role: 'MEMBER',
          status: 'PENDING'
        }
      });

      const loginData = {
        email: 'maria.test@email.com',
        password: 'senha123'
      };

      await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);
    });

    it('deve retornar erro 400 para dados inválidos', async () => {
      const loginData = {
        email: 'email-invalido',
        password: ''
      };

      await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    let authToken;

    beforeEach(async () => {
      // Criar usuário e fazer login para obter token
      const hashedPassword = await bcrypt.hash('senha123', 12);
      testUser = await prisma.user.create({
        data: {
          name: 'João Test',
          email: 'joao.test@email.com',
          password: hashedPassword,
          phone: '11999999999',
          campusId: testCampus.id,
          role: 'MEMBER',
          status: 'ACTIVE'
        }
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'joao.test@email.com',
          password: 'senha123'
        });

      authToken = loginResponse.body.token;
    });

    it('deve renovar token com sucesso', async () => {
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body.token).toBeTruthy();
      expect(response.body.token).not.toBe(authToken); // Novo token deve ser diferente
    });

    it('deve retornar erro 401 para token inválido', async () => {
      await request(app)
        .post('/api/auth/refresh-token')
        .set('Authorization', 'Bearer token-invalido')
        .expect(401);
    });

    it('deve retornar erro 401 sem token', async () => {
      await request(app)
        .post('/api/auth/refresh-token')
        .expect(401);
    });
  });

  describe('POST /api/auth/change-password', () => {
    let authToken;

    beforeEach(async () => {
      // Criar usuário e fazer login para obter token
      const hashedPassword = await bcrypt.hash('senha123', 12);
      testUser = await prisma.user.create({
        data: {
          name: 'João Test',
          email: 'joao.test@email.com',
          password: hashedPassword,
          phone: '11999999999',
          campusId: testCampus.id,
          role: 'MEMBER',
          status: 'ACTIVE'
        }
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'joao.test@email.com',
          password: 'senha123'
        });

      authToken = loginResponse.body.token;
    });

    it('deve alterar senha com sucesso', async () => {
      const passwordData = {
        currentPassword: 'senha123',
        newPassword: 'novaSenha123'
      };

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(200);

      expect(response.body).toHaveProperty('message');

      // Verificar se nova senha funciona
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'joao.test@email.com',
          password: 'novaSenha123'
        });

      expect(loginResponse.status).toBe(200);
    });

    it('deve retornar erro 400 para senha atual incorreta', async () => {
      const passwordData = {
        currentPassword: 'senhaErrada',
        newPassword: 'novaSenha123'
      };

      await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(400);
    });

    it('deve retornar erro 401 sem token', async () => {
      const passwordData = {
        currentPassword: 'senha123',
        newPassword: 'novaSenha123'
      };

      await request(app)
        .post('/api/auth/change-password')
        .send(passwordData)
        .expect(401);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    beforeEach(async () => {
      // Criar usuário para teste
      const hashedPassword = await bcrypt.hash('senha123', 12);
      testUser = await prisma.user.create({
        data: {
          name: 'João Test',
          email: 'joao.test@email.com',
          password: hashedPassword,
          phone: '11999999999',
          campusId: testCampus.id,
          role: 'MEMBER',
          status: 'ACTIVE'
        }
      });
    });

    it('deve processar recuperação de senha com sucesso', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'joao.test@email.com' })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('receberá instruções');
    });

    it('deve retornar sucesso mesmo para email não cadastrado', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'naoexiste@email.com' })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('receberá instruções');
    });

    it('deve retornar erro 400 para email inválido', async () => {
      await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'email-invalido' })
        .expect(400);
    });
  });
});