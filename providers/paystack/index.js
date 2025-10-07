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
        try {
            const payload = {
                email: data.email,
                amount: data.amount * 100, // Convert to kobo (Paystack expects amount in kobo)
                currency: "NGN",
                reference: data.reference || `provider_reg_${Date.now()}`,
                callback_url: data.callback_url || `${process.env.FRONTEND_URL}/provider/registration/success`,
                metadata: {
                    provider_id: data.provider_id,
                    business_name: data.business_name,
                    full_name: data.full_name,
                    phone: data.phone,
                    category: data.category,
                    registration_type: 'provider_registration'
                }
            };

            const response = await this.api.post('/transaction/initialize', payload);
            return callback({
                success: true,
                message: "Transaction initialized successfully",
                data: response.data.data
            });
        } catch (error) {
            console.error("Error initializing transaction:", error.response?.data || error.message);
            return callback({
                success: false,
                message: "Failed to initialize transaction",
                data: null
            });
        }
    }
    async verifyTransaction(reference, callback) {
        try {
            const response = await this.api.get(`/transaction/verify/${reference}`);
            return callback({
                success: true,
                message: "Transaction verified successfully",
                data: response.data.data
            });
        } catch (error) {
            console.error("Error verifying transaction:", error.response?.data || error.message);
            return callback({
                success: false,
                message: "Failed to verify transaction",
                data: null
            });
        }
    }

    async createTransferRecipient(data, callback) {
        try {
            const payload = {
                type: "nuban",
                name: data.accountName,
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
             //implement

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

            // Import models here to avoid circular dependency
            const { User, ProviderProfile, Payment } = await import('../../models/index.js');
            
            // Create payment record
            await Payment.create({
                reference,
                amount: amount / 100, // Convert from kobo to naira
                currency: 'NGN',
                status: 'successful',
                paymentMethod: 'paystack',
                customerEmail: customer?.email,
                metadata: JSON.stringify(metadata),
                providerId: metadata?.provider_id,
                paymentType: metadata?.registration_type === 'provider_registration' ? 'registration' : 'booking'
            });

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
                    
                    console.log(`Provider ${registrationResult.providerProfile.id} registered, subscription created, and payment completed successfully`);
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
                
                console.log(`Provider ${metadata.provider_id} payment completed successfully`);
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
            const { Payment } = await import('../../models/index.js');
            
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
             //implement

    }

    async handleFailedTransfer(data) {
             //implement

    }

    async handleReversedTransfer(data) {
             //implement

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