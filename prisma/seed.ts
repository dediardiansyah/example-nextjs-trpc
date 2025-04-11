import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs';
import { Role } from '../src/enums/role';

const prisma = new PrismaClient()

async function main() {
    const adminEmail = 'admin@example.com';

    const existing = await prisma.user.findUnique({ where: { email: adminEmail } });

    if (!existing) {
        const hashedPassword = await bcrypt.hash('admin123', 10);

        await prisma.user.create({
            data: {
                name: 'Admin User',
                email: adminEmail,
                password: hashedPassword,
                role: Role.ADMIN,
            },
        });

        console.log('✅ Admin user created');
    } else {
        console.log('ℹ️ Admin user already exists');
    }
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    });