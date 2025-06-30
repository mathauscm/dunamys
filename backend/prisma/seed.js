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

    // SEGUNDO: Criar ministérios
    const ministerioMidia = await prisma.ministry.upsert({
        where: { name: 'Ministério de Mídia' },
        update: {},
        create: {
            name: 'Ministério de Mídia',
            description: 'Responsável pela transmissão, gravação e equipamentos audiovisuais',
            active: true
        }
    });

    const ministerioLouvor = await prisma.ministry.upsert({
        where: { name: 'Ministério de Louvor' },
        update: {},
        create: {
            name: 'Ministério de Louvor',
            description: 'Responsável pela música e adoração nos cultos',
            active: true
        }
    });

    const voluntariado = await prisma.ministry.upsert({
        where: { name: 'Voluntariado Geral' },
        update: {},
        create: {
            name: 'Voluntariado Geral',
            description: 'Atividades gerais de apoio e suporte',
            active: true
        }
    });

    const ministerioInfantil = await prisma.ministry.upsert({
        where: { name: 'Ministério Infantil' },
        update: {},
        create: {
            name: 'Ministério Infantil',
            description: 'Trabalho com crianças e adolescentes',
            active: true
        }
    });

    const ministerioRecepcao = await prisma.ministry.upsert({
        where: { name: 'Ministério de Recepção' },
        update: {},
        create: {
            name: 'Ministério de Recepção',
            description: 'Acolhimento e orientação dos visitantes',
            active: true
        }
    });

    console.log('✅ Ministérios criados:', [
        ministerioMidia.name,
        ministerioLouvor.name,
        voluntariado.name,
        ministerioInfantil.name,
        ministerioRecepcao.name
    ]);

    // TERCEIRO: Criar usuário administrador padrão
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
            campusId: campusUbajara.id,
            ministryId: ministerioMidia.id // Admin do ministério de mídia
        }
    });

    console.log('✅ Administrador criado:', admin.email);

    // QUARTO: Criar alguns membros de exemplo com campus e ministérios
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
                campusId: campusUbajara.id,
                ministryId: ministerioLouvor.id
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
                campusId: campusTiangua.id,
                ministryId: ministerioInfantil.id
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
                campusId: campusUbajara.id,
                ministryId: null // Membro pendente não tem ministério ainda
            }
        }),
        prisma.user.upsert({
            where: { email: 'ana@email.com' },
            update: {},
            create: {
                name: 'Ana Costa',
                email: 'ana@email.com',
                password: memberPassword,
                phone: '11555555555',
                role: 'MEMBER',
                status: 'ACTIVE',
                campusId: campusTiangua.id,
                ministryId: ministerioRecepcao.id
            }
        })
    ]);

    console.log('✅ Membros criados:', members.length);

    // QUINTO: Criar uma escala de exemplo
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
                    { userId: members[0].id }, // João (Louvor)
                    { userId: admin.id }       // Admin (Mídia)
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
    console.log('⛪ Ministérios disponíveis:');
    console.log('   - Ministério de Mídia');
    console.log('   - Ministério de Louvor');
    console.log('   - Voluntariado Geral');
    console.log('   - Ministério Infantil');
    console.log('   - Ministério de Recepção');
    console.log('');
    console.log('👤 Login do administrador:');
    console.log('   Email: admin@igreja.com');
    console.log('   Senha: admin123');
    console.log('   Campus: Ubajara');
    console.log('   Ministério: Ministério de Mídia');
    console.log('');
    console.log('👥 Membros de exemplo:');
    console.log('   joao@email.com / 123456 (ATIVO - Ubajara - Louvor)');
    console.log('   maria@email.com / 123456 (ATIVO - Tianguá - Infantil)');
    console.log('   pedro@email.com / 123456 (PENDENTE - Ubajara - Sem ministério)');
    console.log('   ana@email.com / 123456 (ATIVO - Tianguá - Recepção)');
}

main()
    .catch((e) => {
        console.error('❌ Erro no seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });