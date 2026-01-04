/**
 * Seed script to populate role-permission mappings in the database
 * Run with: npx tsx server/seed-rbac.ts
 */

import { getDb } from './db';
import { DEFAULT_ROLE_PERMISSIONS, ROLE_DESCRIPTIONS, PERMISSION_DESCRIPTIONS, PERMISSION_CATEGORIES } from './rbac-config';

async function seedRBAC() {
  console.log('🌱 Starting RBAC seed...');
  
  const db = await getDb();
  
  try {
    // Step 1: Get all roles from database
    console.log('\n📋 Fetching roles from database...');
    const roles = await db.select().from((await import('../drizzle/schema')).roles);
    console.log(`Found ${roles.length} roles`);
    
    // Step 2: Get all permissions from database
    console.log('\n🔑 Fetching permissions from database...');
    const permissions = await db.select().from((await import('../drizzle/schema')).permissions);
    console.log(`Found ${permissions.length} permissions`);
    
    // Create lookup maps
    const roleMap = new Map(roles.map(r => [r.name, r.id]));
    const permissionMap = new Map(permissions.map(p => [p.name, p.id]));
    
    // Step 3: Clear existing role-permission mappings
    console.log('\n🧹 Clearing existing role-permission mappings...');
    await db.delete((await import('../drizzle/schema')).rolePermissions);
    console.log('Cleared existing mappings');
    
    // Step 4: Insert role-permission mappings
    console.log('\n🔗 Creating role-permission mappings...');
    let mappingCount = 0;
    
    for (const [roleName, permissionNames] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
      const roleId = roleMap.get(roleName);
      
      if (!roleId) {
        console.warn(`⚠️  Role not found: ${roleName}`);
        continue;
      }
      
      console.log(`\n  Processing role: ${roleName}`);
      
      for (const permissionName of permissionNames) {
        const permissionId = permissionMap.get(permissionName);
        
        if (!permissionId) {
          console.warn(`    ⚠️  Permission not found: ${permissionName}`);
          continue;
        }
        
        // Insert mapping
        await db.insert((await import('../drizzle/schema')).rolePermissions).values({
          roleId,
          permissionId,
        });
        
        mappingCount++;
        console.log(`    ✓ Granted: ${permissionName}`);
      }
    }
    
    console.log(`\n✅ Successfully created ${mappingCount} role-permission mappings`);
    
    // Step 5: Display summary
    console.log('\n📊 Summary:');
    console.log('─'.repeat(60));
    
    for (const [roleName, permissionNames] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
      console.log(`\n${roleName.toUpperCase()}: ${permissionNames.length} permissions`);
      permissionNames.forEach(p => console.log(`  • ${p}`));
    }
    
    console.log('\n' + '─'.repeat(60));
    console.log('✨ RBAC seed completed successfully!\n');
    
  } catch (error) {
    console.error('\n❌ Error seeding RBAC:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

// Run the seed
seedRBAC().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
