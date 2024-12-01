const cron = require('node-cron');
const Account = require('../models/Account');  // Adjust path as needed

// Schedule task to reset tokensUsed at 00:00 on the 1st of every month
cron.schedule('0 0 1 * *', async () => {
    console.log('Resetting tokensUsed for all accounts at the start of the month...');
    try {
        // Update all accounts, setting tokensUsed to 0
        await Account.updateMany({}, { tokensUsed: 0 });
        console.log('Successfully reset tokensUsed for all accounts.');
    } catch (error) {
        console.error('Error resetting tokensUsed:', error);
    }
});
