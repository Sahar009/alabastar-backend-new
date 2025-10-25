import { Wallet, WalletTransaction, User } from './schema/index.js';
import sequelize from './database/db.js';

async function updateUserWallet() {
  const transaction = await sequelize.transaction();
  
  try {
    const userId = '2c645cd7-a721-4646-958d-8a5ed9782703';
    
    console.log('🔍 Looking for user:', userId);
    
    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      console.error('❌ User not found:', userId);
      console.log('💡 Let me show you available users...');
      
      const users = await User.findAll({
        attributes: ['id', 'fullName', 'email', 'role'],
        limit: 10,
        order: [['createdAt', 'DESC']]
      });
      
      console.log('📋 Available users:');
      users.forEach((u, index) => {
        console.log(`${index + 1}. ID: ${u.id}`);
        console.log(`   Name: ${u.fullName}`);
        console.log(`   Email: ${u.email}`);
        console.log(`   Role: ${u.role}`);
        console.log('---');
      });
      
      await transaction.rollback();
      return;
    }
    
    console.log('✅ User found:', user.fullName, `(${user.email})`);
    
    // Get or create wallet
    let wallet = await Wallet.findOne({ 
      where: { userId },
      transaction 
    });
    
    if (!wallet) {
      console.log('💰 Creating new wallet...');
      wallet = await Wallet.create({
        userId,
        balance: 1000,
        currency: 'NGN'
      }, { transaction });
      console.log('✅ Wallet created with ID:', wallet.id);
    } else {
      console.log('💰 Updating existing wallet...');
      console.log('   Previous balance:', wallet.balance);
      await wallet.update({ balance: 1000 }, { transaction });
      console.log('   New balance: 1000');
    }
    
    // Create transaction record
    const walletTransaction = await WalletTransaction.create({
      walletId: wallet.id,
      type: 'credit',
      amount: 1000,
      reference: `MANUAL_UPDATE_${Date.now()}`,
      description: 'Manual wallet balance update to 1000',
      balanceAfter: 1000,
      metadata: {
        type: 'manual_update',
        source: 'admin_direct_update',
        updatedBy: 'admin_script'
      }
    }, { transaction });
    
    await transaction.commit();
    
    console.log('🎉 Wallet updated successfully!');
    console.log('📊 Summary:');
    console.log('   User ID:', userId);
    console.log('   User Name:', user.fullName);
    console.log('   Wallet ID:', wallet.id);
    console.log('   New Balance:', wallet.balance, wallet.currency);
    console.log('   Transaction ID:', walletTransaction.id);
    console.log('   Reference:', walletTransaction.reference);
    
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error updating wallet:', error.message);
    
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      console.log('💡 This error means the user ID does not exist in the database.');
      console.log('   Please check the user ID or create the user first.');
    }
    
    console.error('Stack trace:', error.stack);
  }
  
  process.exit(0);
}

updateUserWallet();
