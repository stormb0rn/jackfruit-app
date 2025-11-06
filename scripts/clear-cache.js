import { supabase } from '../src/services/supabaseClient.js';

async function clearAllCache() {
  console.log('Clearing all cached generations...');

  try {
    // First, get count of records
    const { count, error: countError } = await supabase
      .from('cached_generations')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error counting records:', countError);
      return;
    }

    console.log(`Found ${count} cached records`);

    if (count === 0) {
      console.log('No cache to clear!');
      return;
    }

    // Delete all records
    const { error } = await supabase
      .from('cached_generations')
      .delete()
      .neq('id', 0); // This will match all records

    if (error) {
      console.error('Error clearing cache:', error);
      return;
    }

    console.log(`Successfully cleared ${count} cached records!`);
    console.log('Cache storage freed up.');
  } catch (error) {
    console.error('Unexpected error:', error);
  }

  process.exit(0);
}

clearAllCache();
