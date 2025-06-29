// backend/prisma/seed.js - ATUALIZADO COM CAMPUS
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Iniciando seed do banco de dados...');

    // PRIMEIRO: Criar campus
    const campusUbajara = await prisma.campus.upsert({
        where: { name: 'Ubajara' },
        update: {},
        create: {
            name: 'Ubajara',
            city: 'Ubajara',
            active: true
        }
    });

    const campusTiangua = await prisma.campus.upsert({
        where: { name: 'Tianguá' },
        update: {},
        create: {
            name: 'Tianguá',
            city: 'Tianguá',
            active: true
        }
    });

    console.log('✅ Campus criados:', [campusUbajara.name, campusTiangua.name]);

    // Criar usuário administrador padrão
    const adminPassword = await bcrypt.hash('admin123', 12);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@igreja.com' },
        update: {},
        create: {
            name: 'Administrador',
            email: 'admin@igreja.com',
            password: adminPassword,
            phone: '11999999999',
            role: 'ADMIN',
            status: 'ACTIVE',
            campusId: campusUbajara.id // Admin do campus Ubajara
        }
    });

    console.log('✅ Administrador criado:', admin.email);

    // Criar alguns membros de exemplo com campus
    const memberPassword = await bcrypt.hash('123456', 12);

    const members = await Promise.all([
        prisma.user.upsert({
            where: { email: 'joao@email.com' },
            update: {},
            create: {
                name: 'João Silva',
                email: 'joao@email.com',
                password: memberPassword,
                phone: '11888888888',
                role: 'MEMBER',
                status: 'ACTIVE',
                campusId: campusUbajara.id
            }
        }),
        prisma.user.upsert({
            where: { email: 'maria@email.com' },
            update: {},
            create: {
                name: 'Maria Santos',
                email: 'maria@email.com',
                password: memberPassword,
                phone: '11777777777',
                role: 'MEMBER',
                status: 'ACTIVE',
                campusId: campusTiangua.id
            }
        }),
        prisma.user.upsert({
            where: { email: 'pedro@email.com' },
            update: {},
            create: {
                name: 'Pedro Oliveira',
                email: 'pedro@email.com',
                password: memberPassword,
                phone: '11666666666',
                role: 'MEMBER',
                status: 'PENDING',
                campusId: campusUbajara.id
            }
        })
    ]);

    console.log('✅ Membros criados:', members.length);

    // Criar uma escala de exemplo
    const nextSunday = new Date();
    nextSunday.setDate(nextSunday.getDate() + (7 - nextSunday.getDay()));

    const schedule = await prisma.schedule.create({
        data: {
            title: 'Culto Dominical - Manhã',
            description: 'Culto de adoração dominical das 9h',
            date: nextSunday,
            time: '09:00',
            location: 'Igreja Central - Ubajara',
            members: {
                create: [
                    { userId: members[0].id },
                    { userId: members[2].id } // Apenas membros do mesmo campus
                ]
            }
        }
    });

    console.log('✅ Escala criada:', schedule.title);

    console.log('🎉 Seed concluído com sucesso!');
    console.log('');
    console.log('🏫 Campus disponíveis:');
    console.log('   - Ubajara');
    console.log('   - Tianguá');
    console.log('');
    console.log('👤 Login do administrador:');
    console.log('   Email: admin@igreja.com');
    console.log('   Senha: admin123');
    console.log('   Campus: Ubajara');
    console.log('');
    console.log('👥 Membros de exemplo:');
    console.log('   joao@email.com / 123456 (ATIVO - Ubajara)');
    console.log('   maria@email.com / 123456 (ATIVO - Tianguá)');
    console.log('   pedro@email.com / 123456 (PENDENTE - Ubajara)');
}

main()
    .catch((e) => {
        console.error('❌ Erro no seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });