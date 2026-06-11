async function createSampleData() {
  console.log('Sample data creation has been disabled to preserve only the admin seed.');
  return true;
}

// Run sample data creation if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createSampleData()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Sample data creation error:', error);
      process.exit(1);
    });
}

export default createSampleData;
