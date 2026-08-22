import { PrismaClient } from '@prisma/client';
import Database from 'better-sqlite3';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

console.log("Loading adapter...");
const adapter = new PrismaBetterSqlite3({ url: 'file:./dev.db' });
console.log("Loading client...");
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Querying...");
  const posts = await prisma.post.findMany();
  console.log(posts);
}

main().catch(console.error);
