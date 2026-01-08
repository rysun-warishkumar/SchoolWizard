import { getDatabase, connectDatabase } from '../config/database';
import dotenv from 'dotenv';

dotenv.config();

async function checkTableStructure() {
  try {
    await connectDatabase();
    const db = getDatabase();

    // Get the actual table structure
    const [columns] = await db.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'students'
      ORDER BY ORDINAL_POSITION
    `) as any[];

    console.log('\n=== Students Table Structure ===');
    console.log(`Total columns: ${columns.length}`);
    console.log('\nColumns (excluding id, created_at, updated_at):');
    
    const insertableColumns = columns.filter((col: any) => 
      !['id', 'created_at', 'updated_at'].includes(col.COLUMN_NAME)
    );

    insertableColumns.forEach((col: any, index: number) => {
      console.log(`${index + 1}. ${col.COLUMN_NAME} (${col.DATA_TYPE}, nullable: ${col.IS_NULLABLE}, default: ${col.COLUMN_DEFAULT || 'none'})`);
    });

    console.log(`\nTotal insertable columns: ${insertableColumns.length}`);
    console.log('\nColumn names for INSERT:');
    console.log(insertableColumns.map((col: any) => col.COLUMN_NAME).join(', '));

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkTableStructure();

