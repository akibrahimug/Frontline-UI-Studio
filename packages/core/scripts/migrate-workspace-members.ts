/**
 * Data Migration Script: Add WorkspaceMember rows for existing workspace owners
 *
 * This script ensures that every existing workspace has a WorkspaceMember row
 * for its owner with role="owner".
 *
 * Run with: pnpm tsx scripts/migrate-workspace-members.ts
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function migrateWorkspaceMembers() {
  console.log("Starting workspace members migration...\n");

  try {
    // Get all workspaces
    const workspaces = await db.workspace.findMany({
      select: {
        id: true,
        name: true,
        ownerId: true,
      },
    });

    console.log(`Found ${workspaces.length} workspaces\n`);

    let created = 0;
    let skipped = 0;

    for (const workspace of workspaces) {
      // Check if owner already has a membership
      const existingMember = await db.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: workspace.id,
            userId: workspace.ownerId,
          },
        },
      });

      if (existingMember) {
        console.log(
          `✓ Workspace "${workspace.name}" - owner already has membership`
        );
        skipped++;
      } else {
        // Create WorkspaceMember for owner
        await db.workspaceMember.create({
          data: {
            workspaceId: workspace.id,
            userId: workspace.ownerId,
            role: "owner",
          },
        });
        console.log(`✓ Created owner membership for workspace "${workspace.name}"`);
        created++;
      }
    }

    console.log(`\n✅ Migration complete!`);
    console.log(`   Created: ${created}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total: ${workspaces.length}\n`);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

migrateWorkspaceMembers()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
