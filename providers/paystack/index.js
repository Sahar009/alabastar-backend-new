import { BAD_REQUEST, SUCCESS } from "../../constants/statusCode.js";
import axios from 'axios';



class PaystackService {
    constructor() {
        if (!PaystackService.instance) {
            this.initialize();
            PaystackService.instance = this;
        }
        return PaystackService.instance;
    }

    initialize() {
        try {
            this.baseURL = process.env.PAYSTACK_BASE_URL || 'https://api.paystack.co';
            this.secretKey = process.env.PAYSTACK_SECRET_KEY;

            this.api = axios.create({
                baseURL: this.baseURL,
                timeout: 10000,
                headers: {
                    Authorization: `Bearer ${this.secretKey}`,
                    "Content-Type": "application/json"
                }
            });

            this.setupInterceptors();
            console.log('Paystack Service initialized successfully');
        } catch (error) {
            console.error('Paystack Service initialization error:', error);
            throw error;
        }
    }

    setupInterceptors() {
        this.api.interceptors.request.use(
            request => {
                console.log('Request:', {
                    method: request.method,
                    url: request.url,
                    headers: request.headers,
                    data: request.data
                });
                return request;
            },
            error => {
                console.error('Request Error:', error);
                return Promise.reject(error);
            }
        );

        this.api.interceptors.response.use(
            response => {
                console.log('Response:', response.data);
                return response;
            },
            error => {
                console.error('Error Response:', {
                    status: error.response?.status,
                    data: error.response?.data,
                    message: error.message
                });
                return Promise.reject(error);
            }
        );
    }

    async initializeTransaction(data, callback) {
        const payload = {
            email: data.email,
            amount: data.amount , // Convert to kobo (Paystack expects amount in kobo)
            currency: "NGN",
            reference: data.reference || `provider_reg_${Date.now()}`,
            callback_url: data.callback_url || `${process.env.FRONTEND_URL}/provider/registration/success`,
            metadata: {
                provider_id: data.provider_id,
                business_name: data.business_name,
                full_name: data.full_name,
                phone: data.phone,
                category: data.category,
                registration_type: 'provider_registration',
                subscription_plan_id: data.registration_data?.subscriptionPlanId,
                registration_data: data.registration_data
            }
        };

        // ALWAYS create payment record in database first, regardless of Paystack API result
        let paymentRecord = null;
        try {
            const { Payment } = await import('../../schema/index.js');
            
            paymentRecord = await Payment.create({
                reference: payload.reference,
                amount: data.amount.toString(),
                currency: 'NGN',
                status: 'pending',
                paymentMethod: 'paystack',
                customerEmail: data.email,
                paymentType: 'registration',
                providerId: data.provider_id,
                metadata: JSON.stringify(payload.metadata)
            });
            
            console.log('Payment record created:', {
                id: paymentRecord.id,
                reference: paymentRecord.reference,
                status: paymentRecord.status
            });
        } catch (dbError) {
            console.error('Error creating payment record:', dbError);
            return callback({
                success: false,
                message: "Failed to create payment record",
                data: null
            });
        }

        // Now try to initialize with Paystack
        try {
            const response = await this.api.post('/transaction/initialize', payload);
            
            return callback({
                success: true,
                message: "Transaction initialized successfully",
                data: response.data.data
            });
        } catch (error) {
            console.error("Error initializing transaction with Paystack:", error.response?.data || error.message);
            
            // Even if Paystack fails, we still have the payment record, so return success
            // The payment can be completed manually later
            return callback({
                success: true,
                message: "Payment record created, but Paystack initialization failed",
                data: {
                    authorization_url: null,
                    access_code: null,
                    reference: payload.reference
                }
            });
        }
    }
    async verifyTransaction(reference, callback) {
        try {
            const response = await this.api.get(`/transaction/verify/${reference}`);
            const result = {
                success: true,
                message: "Transaction verified successfully",
                data: response.data.data
            };
            
            // Support both callback and promise patterns
            if (callback && typeof callback === 'function') {
                return callback(result);
            }
            return result;
        } catch (error) {
            console.error("Error verifying transaction:", error.response?.data || error.message);
            const result = {
                success: false,
                message: "Failed to verify transaction",
                data: null
            };
            
            // Support both callback and promise patterns
            if (callback && typeof callback === 'function') {
                return callback(result);
            }
            return result;
        }
    }

    async createTransferRecipient(data, callback) {
        try {
            const payload = {
                type: "nuban",
                name: data.name || data.accountName,
                account_number: data.accountNumber,
                bank_code: data.bankCode,
                currency: "NGN"
            };

            const response = await this.api.post('/transferrecipient', payload);
            return callback({
                success: true,
                message: "Transfer recipient created successfully",
                data: response.data.data
            });
        } catch (error) {
            console.error("Error creating transfer recipient:", error.response?.data || error.message);
            return callback({
                success: false,
                message: "Failed to create transfer recipient",
                data: null
            });
        }
    }

    async initiateTransfer(data, callback) {
        try {
            // First verify the account number
            const accountVerification = await new Promise((resolve) => {
                this.verifyAccountNumber({
                    accountNumber: data.accountNumber,
                    bankCode: data.bankCode
                }, resolve);
            });

            if (!accountVerification.success) {
                return callback({
                    success: false,
                    message: "Account verification failed",
                    data: null
                });
            }

            // Create transfer recipient if not exists
            const recipientData = {
                type: "nuban",
                name: accountVerification.data.account_name,
                account_number: data.accountNumber,
                bank_code: data.bankCode,
                currency: "NGN"
            };

            const recipientResult = await new Promise((resolve) => {
                this.createTransferRecipient(recipientData, resolve);
            });
            
            if (!recipientResult.success) {
                return callback({
                    success: false,
                    message: "Failed to create transfer recipient",
                    data: null
                });
            }

            // Initiate transfer
            const transferPayload = {
                source: "balance",
                amount: data.amount * 100, // Convert to kobo
                recipient: recipientResult.data.recipient_code,
                reason: data.reason || "Withdrawal from Alabastar wallet",
                reference: data.reference || `withdrawal_${Date.now()}`
            };

            const response = await this.api.post('/transfer', transferPayload);
            
            return callback({
                success: true,
                message: "Transfer initiated successfully",
                data: response.data.data
            });
        } catch (error) {
            console.error("Error initiating transfer:", error.response?.data || error.message);
            return callback({
                success: false,
                message: "Failed to initiate transfer",
                data: null
            });
        }
    }

    async getBanksList(callback) {
        try {
            const response = await this.api.get('/bank');
            return callback({
                success: true,
                message: "Banks list retrieved successfully",
                data: response.data.data
            });
        } catch (error) {
            console.error("Error retrieving banks:", error.response?.data || error.message);
            return callback({
                success: false,
                message: "Failed to retrieve banks",
                data: null
            });
        }
    }

    async getBankCode(bankName, callback) {
        try {
            const banksResponse = await new Promise((resolve) => {
                this.getBanksList(resolve);
            });
            
            if (!banksResponse.success) {
                return callback({
                    success: false,
                    message: "Failed to retrieve banks list",
                    data: null
                });
            }

            const banks = banksResponse.data;
            const bank = banks.find(b => 
                b.name.toLowerCase().includes(bankName.toLowerCase()) ||
                bankName.toLowerCase().includes(b.name.toLowerCase())
            );

            if (!bank) {
                return callback({
                    success: false,
                    message: "Bank not found",
                    data: null
                });
            }

            return callback({
                success: true,
                message: "Bank code retrieved successfully",
                data: {
                    code: bank.code,
                    name: bank.name
                }
            });
        } catch (error) {
            console.error("Error getting bank code:", error.response?.data || error.message);
            return callback({
                success: false,
                message: "Failed to get bank code",
                data: null
            });
        }
    }

    async verifyAccountNumber(data, callback) {
        try {
            const response = await this.api.get(
                `/bank/resolve?account_number=${data.accountNumber}&bank_code=${data.bankCode}`
            );
            return callback({
                success: true,
                message: "Account verified successfully",
                data: response.data.data
            });
        } catch (error) {
            console.error("Error verifying account:", error.response?.data || error.message);
            return callback({
                success: false,
                message: "Failed to verify account",
                data: null
            });
        }
    }

    async getTransactionsList(filters, callback) {
        try {
            const response = await this.api.get('/merchant/transactions', {
                params: {
                    pageSize: filters.pageSize || 10,
                    pageNo: filters.pageNo || 1,
                    startDate: filters.startDate,
                    endDate: filters.endDate,
                    paymentStatus: filters.paymentStatus
                }
            });
            return callback({
                success: true,
                message: "Transactions list retrieved successfully",
                data: response.data.data
            });
        } catch (error) {
            console.error("Error retrieving transactions:", error.response?.data || error.message);
            return callback({
                success: false,
                message: "Failed to retrieve transactions",
                data: null
            });
        }
    }

    async handleWebhook(payload, callback) {
        try {
            const { event, data } = payload;
            
            switch (event) {
                case 'charge.success':
                    await this.handleSuccessfulPayment(data);
                    break;
                case 'charge.failed':
                    await this.handleFailedPayment(data);
                    break;
                case 'transfer.success':
                    await this.handleSuccessfulTransfer(data);
                    break;
                case 'transfer.failed':
                    await this.handleFailedTransfer(data);
                    break;
                case 'transfer.reversed':
                    await this.handleReversedTransfer(data);
                    break;
                default:
                    console.log('Unhandled webhook event:', event);
            }
            
            return callback({
                success: true,
                message: "Webhook processed successfully",
                data: null
            });
        } catch (error) {
            console.error("Webhook processing error:", error);
            return callback({
                success: false,
                message: "Webhook processing failed",
                data: null
            });
        }
    }

    async handleSuccessfulPayment(data) {
        try {
            const { reference, amount, customer, metadata } = data;
            
            console.log('Processing successful payment:', {
                reference,
                amount,
                customer_email: customer?.email,
                metadata
            });
            
            console.log('Metadata details:', {
                registration_type: metadata?.registration_type,
                has_registration_data: !!metadata?.registration_data,
                registration_data_keys: metadata?.registration_data ? Object.keys(metadata.registration_data) : []
            });

            // Import models here to avoid circular dependency
            const { User, ProviderProfile, Payment } = await import('../../schema/index.js');
            
            // Update existing payment record or create new one
            let paymentRecord = await Payment.findOne({ where: { reference } });
            
            if (paymentRecord) {
                // Update existing payment record
                await Payment.update(
                    {
                        amount: (amount / 100).toString(), // Convert from kobo to naira
                        status: 'successful',
                        paymentMethod: 'paystack',
                        customerEmail: customer?.email,
                        metadata: JSON.stringify(metadata),
                        providerId: metadata?.provider_id,
                        paymentType: metadata?.registration_type === 'provider_registration' ? 'registration' : 'booking'
                    },
                    { where: { reference } }
                );
                console.log('Payment record updated:', { reference, status: 'successful' });
            } else {
                // Create new payment record (fallback)
                paymentRecord = await Payment.create({
                    reference,
                    amount: (amount / 100).toString(), // Convert from kobo to naira
                    currency: 'NGN',
                    status: 'successful',
                    paymentMethod: 'paystack',
                    customerEmail: customer?.email,
                    metadata: JSON.stringify(metadata),
                    providerId: metadata?.provider_id,
                    paymentType: metadata?.registration_type === 'provider_registration' ? 'registration' : 'booking'
                });
                console.log('Payment record created:', { reference, status: 'successful' });
            }

            // If this is a provider registration payment, register the provider
            if (metadata?.registration_type === 'provider_registration' && metadata?.registration_data) {
                try {
                    // Import provider service to register the provider
                    const { default: providerService } = await import('../../services/providerService.js');
                    
                    // Register the provider with the stored registration data
                    const registrationResult = await providerService.registerProvider(metadata.registration_data);
                    
                    // Update the payment record with the provider ID
                    await Payment.update(
                        { providerId: registrationResult.providerProfile.id },
                        { where: { reference } }
                    );
                    
                    // Update provider payment status to paid
                    await ProviderProfile.update(
                        { 
                            paymentStatus: 'paid',
                            verificationStatus: 'pending' // Move to pending verification after payment
                        },
                        { where: { id: registrationResult.providerProfile.id } }
                    );
                    
                    // Update registration progress to mark step 4 (subscription plan) as completed
                    const { ProviderRegistrationProgress } = await import('../../schema/index.js');
                    
                    console.log('Updating registration progress for user:', registrationResult.user.id);
                    console.log('Current step data:', registrationResult.registrationProgress.stepData);
                    
                    const updateData = { 
                        currentStep: 5, // Set to step 5 (maximum allowed)
                        isComplete: true, // Mark registration as complete
                        stepData: {
                            ...registrationResult.registrationProgress.stepData,
                            step4: {
                                ...registrationResult.registrationProgress.stepData.step4,
                                subscriptionPlanId: metadata.subscription_plan_id,
                                paymentCompleted: true,
                                paymentReference: reference
                            },
                            step5: {
                                paymentCompleted: true,
                                paymentReference: reference,
                                completedAt: new Date()
                            }
                        },
                        lastUpdated: new Date()
                    };
                    
                    console.log('Registration progress update data:', JSON.stringify(updateData, null, 2));
                    
                    await ProviderRegistrationProgress.update(
                        updateData,
                        { where: { userId: registrationResult.user.id } }
                    );
                    
                    console.log('Registration progress updated successfully');
                    
                    console.log(`Provider ${registrationResult.providerProfile.id} registered, subscription created, payment completed, and registration progress updated successfully`);
                } catch (registrationError) {
                    console.error('Error registering provider after payment:', registrationError);
                    // Payment is successful but registration failed - this needs manual intervention
                }
            } else if (metadata?.registration_type === 'provider_registration' && metadata?.provider_id) {
                // Legacy: Update existing provider status
                await ProviderProfile.update(
                    { 
                        paymentStatus: 'paid',
                        verificationStatus: 'pending' // Move to pending verification after payment
                    },
                    { where: { id: metadata.provider_id } }
                );
                
                // Update registration progress to mark step 4 (subscription plan) as completed
                const { ProviderRegistrationProgress } = await import('../../schema/index.js');
                const provider = await ProviderProfile.findByPk(metadata.provider_id);
                if (provider) {
                    await ProviderRegistrationProgress.update(
                        { 
                            currentStep: 5, // Set to step 5 (maximum allowed)
                            isComplete: true, // Mark registration as complete
                            stepData: {
                                step4: {
                                    subscriptionPlanId: metadata.subscription_plan_id,
                                    paymentCompleted: true,
                                    paymentReference: reference
                                },
                                step5: {
                                    paymentCompleted: true,
                                    paymentReference: reference,
                                    completedAt: new Date()
                                }
                            },
                            lastUpdated: new Date()
                        },
                        { where: { userId: provider.userId } }
                    );
                }
                
                console.log(`Provider ${metadata.provider_id} payment completed and registration progress updated successfully`);
            }

            return { success: true, message: 'Payment processed successfully' };
        } catch (error) {
            console.error('Error handling successful payment:', error);
            throw error;
        }
    }

    async handleFailedPayment(data) {
        try {
            const { reference, amount, customer, metadata } = data;
            
            console.log('Processing failed payment:', {
                reference,
                amount,
                customer_email: customer?.email,
                metadata
            });

            // Import models here to avoid circular dependency
            const { Payment } = await import('../../schema/index.js');
            
            // Create payment record for failed payment
            await Payment.create({
                reference,
                amount: amount / 100, // Convert from kobo to naira
                currency: 'NGN',
                status: 'failed',
                paymentMethod: 'paystack',
                customerEmail: customer?.email,
                metadata: JSON.stringify(metadata),
                providerId: metadata?.provider_id,
                paymentType: metadata?.registration_type === 'provider_registration' ? 'registration' : 'booking'
            });

            console.log(`Payment ${reference} failed for provider ${metadata?.provider_id}`);
            return { success: true, message: 'Failed payment recorded' };
        } catch (error) {
            console.error('Error handling failed payment:', error);
            throw error;
        }
    }

    async handleSuccessfulTransfer(data) {
        try {
            const { reference, amount, recipient, reason } = data;
            
            console.log('Processing successful transfer:', {
                reference,
                amount,
                recipient,
                reason
            });

            // Import models here to avoid circular dependency
            const { WalletTransaction, Wallet } = await import('../../schema/index.js');
            
            // Find the wallet transaction by reference
            const walletTransaction = await WalletTransaction.findOne({ 
                where: { reference },
                include: [{ model: Wallet, as: 'wallet' }]
            });

            if (walletTransaction) {
                // Update transaction status
                await walletTransaction.update({
                    status: 'completed',
                    metadata: JSON.stringify({
                        ...JSON.parse(walletTransaction.metadata || '{}'),
                        paystackTransferId: data.id,
                        transferStatus: 'successful',
                        completedAt: new Date()
                    })
                });

                console.log(`Transfer ${reference} completed successfully`);
            }

            return { success: true, message: 'Transfer processed successfully' };
        } catch (error) {
            console.error('Error handling successful transfer:', error);
            throw error;
        }
    }

    async handleFailedTransfer(data) {
        try {
            const { reference, amount, recipient, reason } = data;
            
            console.log('Processing failed transfer:', {
                reference,
                amount,
                recipient,
                reason
            });

            // Import models here to avoid circular dependency
            const { WalletTransaction, Wallet } = await import('../../schema/index.js');
            
            // Find the wallet transaction by reference
            const walletTransaction = await WalletTransaction.findOne({ 
                where: { reference },
                include: [{ model: Wallet, as: 'wallet' }]
            });

            if (walletTransaction) {
                // Refund the amount back to wallet
                const wallet = walletTransaction.wallet;
                const refundAmount = parseFloat(walletTransaction.amount);
                
                await wallet.update({
                    balance: parseFloat(wallet.balance) + refundAmount
                });

                // Update transaction status
                await walletTransaction.update({
                    status: 'failed',
                    metadata: JSON.stringify({
                        ...JSON.parse(walletTransaction.metadata || '{}'),
                        paystackTransferId: data.id,
                        transferStatus: 'failed',
                        refundedAt: new Date(),
                        refundAmount: refundAmount
                    })
                });

                // Create refund transaction record
                await WalletTransaction.create({
                    walletId: wallet.id,
                    type: 'credit',
                    amount: refundAmount,
                    reference: `REFUND_${reference}`,
                    description: `Refund for failed transfer: ${reason}`,
                    balanceAfter: parseFloat(wallet.balance),
                    metadata: JSON.stringify({
                        originalReference: reference,
                        refundReason: 'Transfer failed',
                        paystackTransferId: data.id
                    })
                });

                console.log(`Transfer ${reference} failed, amount refunded to wallet`);
            }

            return { success: true, message: 'Failed transfer processed' };
        } catch (error) {
            console.error('Error handling failed transfer:', error);
            throw error;
        }
    }

    async handleReversedTransfer(data) {
        try {
            const { reference, amount, recipient, reason } = data;
            
            console.log('Processing reversed transfer:', {
                reference,
                amount,
                recipient,
                reason
            });

            // Import models here to avoid circular dependency
            const { WalletTransaction, Wallet } = await import('../../schema/index.js');
            
            // Find the wallet transaction by reference
            const walletTransaction = await WalletTransaction.findOne({ 
                where: { reference },
                include: [{ model: Wallet, as: 'wallet' }]
            });

            if (walletTransaction) {
                // Refund the amount back to wallet
                const wallet = walletTransaction.wallet;
                const refundAmount = parseFloat(walletTransaction.amount);
                
                await wallet.update({
                    balance: parseFloat(wallet.balance) + refundAmount
                });

                // Update transaction status
                await walletTransaction.update({
                    status: 'reversed',
                    metadata: JSON.stringify({
                        ...JSON.parse(walletTransaction.metadata || '{}'),
                        paystackTransferId: data.id,
                        transferStatus: 'reversed',
                        refundedAt: new Date(),
                        refundAmount: refundAmount
                    })
                });

                // Create refund transaction record
                await WalletTransaction.create({
                    walletId: wallet.id,
                    type: 'credit',
                    amount: refundAmount,
                    reference: `REVERSAL_${reference}`,
                    description: `Reversal for transfer: ${reason}`,
                    balanceAfter: parseFloat(wallet.balance),
                    metadata: JSON.stringify({
                        originalReference: reference,
                        refundReason: 'Transfer reversed',
                        paystackTransferId: data.id
                    })
                });

                console.log(`Transfer ${reference} reversed, amount refunded to wallet`);
            }

            return { success: true, message: 'Reversed transfer processed' };
        } catch (error) {
            console.error('Error handling reversed transfer:', error);
            throw error;
        }
    }

    async createDedicatedVirtualAccount(userData, callback) {
             //implement

    }

    async getDedicatedAccounts(customerCode, callback) {
        try {
            const response = await this.api.get(`/dedicated_account?customer=${customerCode}`);
            return callback({
                success: true,
                message: "Virtual accounts retrieved",
                data: response.data.data
            });
        } catch (error) {
            console.error("Get DVA error:", error.response?.data || error.message);
            return callback({
                success: false,
                message: "Failed to get accounts",
                data: null
            });
        }
    }

    async deactivateDedicatedAccount(accountId, callback) {
        try {
            const response = await this.api.delete(`/dedicated_account/${accountId}`);
            await Wallet.update(
                { isActive: false },
                { where: { paystackDedicatedAccountId: accountId } }
            );
            return callback({
                success: true,
                message: "Account deactivated",
                data: response.data.data
            });
        } catch (error) {
            console.error("Deactivation error:", error.response?.data || error.message);
            return callback({
                success: false,
                message: "Failed to deactivate account",
                data: null
            });
        }
    }
}

// Create and export singleton instance
const paystackService = new PaystackService();
export default paystackService;