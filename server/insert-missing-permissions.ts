/**
 * Insert missing permissions into the database
 * Run with: npx tsx server/insert-missing-permissions.ts
 */

import { getDb } from './db';
import { PERMISSIONS, PERMISSION_DESCRIPTIONS, PERMISSION_CATEGORIES } from './rbac-config';

async function insertMissingPermissions() {
  console.log('🔑 Inserting missing permissions...');
  
  const db = await getDb();
  
  try {
    // Get existing permissions
    const existingPermissions = await db.select().from((await import('../drizzle/schema')).permissions);
    const existingNames = new Set(existingPermissions.map(p => p.name));
    
    console.log(`\nExisting permissions: ${existingNames.size}`);
    existingPermissions.forEach(p => console.log(`  • ${p.name}`));
    
    // Find category for each permission
    const permissionCategories: Record<string, string> = {};
    for (const [category, perms] of Object.entries(PERMISSION_CATEGORIES)) {
      for (const perm of perms) {
        permissionCategories[perm] = category;
      }
    }
    
    // Insert missing permissions
    const allPermissions = Object.values(PERMISSIONS);
    const missingPermissions = allPermissions.filter(p => !existingNames.has(p));
    
    console.log(`\nMissing permissions: ${missingPermissions.length}`);
    
    if (missingPermissions.length === 0) {
      console.log('✅ All permissions already exist!');
      return;
    }
    
    for (const permName of missingPermissions) {
      const description = PERMISSION_DESCRIPTIONS[permName] || '';
      const category = permissionCategories[permName] || 'other';
      
      await db.insert((await import('../drizzle/schema')).permissions).values({
        name: permName,
        description,
        category,
      });
      
      console.log(`  ✓ Inserted: ${permName} (${category})`);
    }
    
    console.log(`\n✅ Successfully inserted ${missingPermissions.length} missing permissions`);
    
    // Verify all permissions now exist
    const finalPermissions = await db.select().from((await import('../drizzle/schema')).permissions);
    console.log(`\nTotal permissions in database: ${finalPermissions.length}`);
    
  } catch (error) {
    console.error('\n❌ Error inserting permissions:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

// Run the script
insertMissingPermissions().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
