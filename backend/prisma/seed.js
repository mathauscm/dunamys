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
    const ministerioMultimidia = await prisma.ministry.upsert({
        where: { name: 'Ministério Multimídia' },
        update: {},
        create: {
            name: 'Ministério Multimídia',
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

    const ministerioSonorizacao = await prisma.ministry.upsert({
        where: { name: 'Sonorização e Iluminação' },
        update: {},
        create: {
            name: 'Sonorização e Iluminação',
            description: 'Responsável por som e iluminação dos cultos e eventos',
            active: true
        }
    });

    console.log('✅ Ministérios criados:', [
        ministerioMultimidia.name,
        ministerioLouvor.name,
        voluntariado.name,
        ministerioInfantil.name,
        ministerioSonorizacao.name
    ]);

    // NOVO: Criar grupos de funções e funções COM ASSOCIAÇÃO AOS MINISTÉRIOS
    console.log('🎯 Criando grupos de funções e funções...');

    // Criar grupo Voluntariado Geral
    const voluntariadoGeral = await prisma.functionGroup.upsert({
        where: { name: 'Voluntariado Geral' },
        update: { ministryId: voluntariado.id },
        create: {
            name: 'Voluntariado Geral',
            description: 'Funções gerais de apoio aos cultos e eventos',
            active: true,
            ministryId: voluntariado.id
        }
    });

    // Criar grupo Multimídia
    const multimidia = await prisma.functionGroup.upsert({
        where: { name: 'Multimídia' },
        update: { ministryId: ministerioMultimidia.id },
        create: {
            name: 'Multimídia',
            description: 'Funções relacionadas à produção audiovisual',
            active: true,
            ministryId: ministerioMultimidia.id
        }
    });

    // Criar grupo Ministério de Louvor
    const grupoLouvor = await prisma.functionGroup.upsert({
        where: { name: 'Ministério de Louvor' },
        update: { ministryId: ministerioLouvor.id },
        create: {
            name: 'Ministério de Louvor',
            description: 'Funções relacionadas ao louvor e adoração',
            active: true,
            ministryId: ministerioLouvor.id
        }
    });

    // Criar grupo Sonorização e Iluminação
    const grupoSonorizacao = await prisma.functionGroup.upsert({
        where: { name: 'Sonorização e Iluminação' },
        update: { ministryId: ministerioSonorizacao.id },
        create: {
            name: 'Sonorização e Iluminação',
            description: 'Funções de som e iluminação',
            active: true,
            ministryId: ministerioSonorizacao.id
        }
    });

    // Criar grupo Kids
    const grupoKids = await prisma.functionGroup.upsert({
        where: { name: 'Kids' },
        update: { ministryId: ministerioInfantil.id },
        create: {
            name: 'Kids',
            description: 'Funções relacionadas ao ministério infantil',
            active: true,
            ministryId: ministerioInfantil.id
        }
    });

    // Funções do Voluntariado Geral
    const voluntariadoFunctions = [
        { name: 'Estacionamento', icon: 'car', description: 'Organização do estacionamento' },
        { name: 'Acolhimento', icon: 'heart', description: 'Recepção e acolhimento dos visitantes' },
        { name: 'Auditório', icon: 'users', description: 'Organização do auditório' },
        { name: 'Dízimos e Oferta', icon: 'dollar-sign', description: 'Coleta de dízimos e ofertas' },
        { name: 'Comunhão', icon: 'coffee', description: 'Organização da comunhão' },
        { name: 'Ceia', icon: 'utensils', description: 'Organização da santa ceia' }
    ];

    for (const func of voluntariadoFunctions) {
        await prisma.function.upsert({
            where: { 
                name_groupId: { 
                    name: func.name, 
                    groupId: voluntariadoGeral.id 
                } 
            },
            update: {},
            create: {
                name: func.name,
                description: func.description,
                icon: func.icon,
                groupId: voluntariadoGeral.id,
                active: true
            }
        });
    }

    // Funções de Multimídia
    const multimidiaFunctions = [
        { name: 'Stories', icon: 'instagram', description: 'Criação de stories para redes sociais' },
        { name: 'Projeção', icon: 'projector', description: 'Operação do sistema de projeção' },
        { name: 'Fotos', icon: 'camera', description: 'Fotografia dos eventos' },
        { name: 'Reels', icon: 'video', description: 'Criação de reels para redes sociais' },
        { name: 'Live', icon: 'radio', description: 'Transmissão ao vivo' },
        { name: 'Vídeo Live', icon: 'video', description: 'Produção de vídeo para transmissão' }
    ];

    for (const func of multimidiaFunctions) {
        await prisma.function.upsert({
            where: {
                name_groupId: {
                    name: func.name,
                    groupId: multimidia.id
                }
            },
            update: {},
            create: {
                name: func.name,
                description: func.description,
                icon: func.icon,
                groupId: multimidia.id,
                active: true
            }
        });
    }

    // Função do Ministério de Louvor
    await prisma.function.upsert({
        where: {
            name_groupId: {
                name: 'Ministério de Louvor',
                groupId: grupoLouvor.id
            }
        },
        update: {},
        create: {
            name: 'Ministério de Louvor',
            description: 'Participação no ministério de louvor',
            icon: 'radio',
            groupId: grupoLouvor.id,
            active: true
        }
    });

    // Funções de Sonorização e Iluminação
    const sonorizacaoFunctions = [
        { name: 'Iluminação', icon: 'briefcase', description: 'Operação de iluminação dos cultos' },
        { name: 'Sonorização', icon: 'radio', description: 'Operação de som dos cultos' }
    ];

    for (const func of sonorizacaoFunctions) {
        await prisma.function.upsert({
            where: {
                name_groupId: {
                    name: func.name,
                    groupId: grupoSonorizacao.id
                }
            },
            update: {},
            create: {
                name: func.name,
                description: func.description,
                icon: func.icon,
                groupId: grupoSonorizacao.id,
                active: true
            }
        });
    }

    // Função Kids
    await prisma.function.upsert({
        where: {
            name_groupId: {
                name: 'Voluntariado Kids',
                groupId: grupoKids.id
            }
        },
        update: {},
        create: {
            name: 'Voluntariado Kids',
            description: 'Trabalho com crianças no ministério infantil',
            icon: 'users',
            groupId: grupoKids.id,
            active: true
        }
    });

    console.log('✅ Grupos de funções e funções criados com sucesso!');

    // TERCEIRO: Criar usuário administrador master (Mathaus)
    const masterAdminPassword = await bcrypt.hash('kenbuk-gerjih-dyKve9', 12);

    const masterAdmin = await prisma.user.upsert({
        where: { email: 'mathauscarvalho@gmail.com' },
        update: {},
        create: {
            name: 'Mathaus Carvalho',
            email: 'mathauscarvalho@gmail.com',
            password: masterAdminPassword,
            phone: '11999999999',
            role: 'ADMIN',
            status: 'ACTIVE',
            campusId: campusUbajara.id,
            ministryId: ministerioMultimidia.id // Admin master do ministério de mídia
        }
    });

    console.log('✅ Administrador Master criado:', masterAdmin.email);

    // QUARTO: Criar administrador padrão (backup)
    const adminPassword = await bcrypt.hash('admin123', 12);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@igreja.com' },
        update: {},
        create: {
            name: 'Administrador',
            email: 'admin@igreja.com',
            password: adminPassword,
            phone: '11888888888',
            role: 'ADMIN',
            status: 'ACTIVE',
            campusId: campusUbajara.id,
            ministryId: ministerioMidia.id // Admin do ministério de mídia
        }
    });

    console.log('✅ Administrador padrão criado:', admin.email);

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

    // QUINTO: Criar uma escala de exemplo COM FUNÇÕES
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

    // NOVO: Associar funções aos membros da escala de exemplo
    const scheduleMemberJoao = await prisma.scheduleMember.findFirst({
        where: { 
            scheduleId: schedule.id, 
            userId: members[0].id 
        }
    });

    const scheduleMemberAdmin = await prisma.scheduleMember.findFirst({
        where: { 
            scheduleId: schedule.id, 
            userId: admin.id 
        }
    });

    // Buscar algumas funções para associar
    const funcaoAcolhimento = await prisma.function.findFirst({
        where: { name: 'Acolhimento' }
    });

    const funcaoProjecao = await prisma.function.findFirst({
        where: { name: 'Projeção' }
    });

    const funcaoFotos = await prisma.function.findFirst({
        where: { name: 'Fotos' }
    });

    // Associar funções aos membros da escala
    if (scheduleMemberJoao && funcaoAcolhimento) {
        await prisma.scheduleMemberFunction.create({
            data: {
                scheduleMemberId: scheduleMemberJoao.id,
                functionId: funcaoAcolhimento.id
            }
        });
    }

    if (scheduleMemberAdmin && funcaoProjecao) {
        await prisma.scheduleMemberFunction.create({
            data: {
                scheduleMemberId: scheduleMemberAdmin.id,
                functionId: funcaoProjecao.id
            }
        });
    }

    if (scheduleMemberAdmin && funcaoFotos) {
        await prisma.scheduleMemberFunction.create({
            data: {
                scheduleMemberId: scheduleMemberAdmin.id,
                functionId: funcaoFotos.id
            }
        });
    }

    console.log('✅ Escala criada com funções associadas:', schedule.title);

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
    console.log('🎯 Grupos de Funções criados:');
    console.log('   📋 Voluntariado Geral: Estacionamento, Acolhimento, Auditório, Dízimos e Oferta, Comunhão, Ceia');
    console.log('   🎥 Multimídia: Stories, Projeção, Fotos, Reels, Live, Vídeo Live');
    console.log('');
    console.log('👤 Login dos administradores:');
    console.log('');
    console.log('🔑 ADMIN MASTER (Mathaus):');
    console.log('   Email: mathauscarvalho@gmail.com');
    console.log('   Senha: kenbuk-gerjih-dyKve9');
    console.log('   Campus: Ubajara');
    console.log('   Ministério: Ministério de Mídia');
    console.log('');
    console.log('🔑 Admin padrão (backup):');
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
    console.log('');
    console.log('📅 Escala de exemplo criada:');
    console.log('   - João Silva: Acolhimento');
    console.log('   - Administrador: Projeção + Fotos');
}

main()
    .catch((e) => {
        console.error('❌ Erro no seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });