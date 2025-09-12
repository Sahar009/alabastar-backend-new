import { BAD_REQUEST, SUCCESS } from "../../constants/statusCode.js";
import { messageHandler } from "../../utils/index.js";
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
            //implement

    }
    async verifyTransaction(reference, callback) {
      //implement
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
            return callback(messageHandler("Transfer recipient created successfully", true, SUCCESS, response.data.data));
        } catch (error) {
            console.error("Error creating transfer recipient:", error.response?.data || error.message);
            return callback(messageHandler("Failed to create transfer recipient", false, BAD_REQUEST));
        }
    }

    async initiateTransfer(data, callback) {
             //implement

    }

    async getBanksList(callback) {
        try {
            const response = await this.api.get('/bank');
            return callback(messageHandler("Banks list retrieved successfully", true, SUCCESS, response.data.data));
        } catch (error) {
            console.error("Error retrieving banks:", error.response?.data || error.message);
            return callback(messageHandler("Failed to retrieve banks", false, BAD_REQUEST));
        }
    }

    async verifyAccountNumber(data, callback) {
        try {
            const response = await this.api.get(
                `/bank/resolve?account_number=${data.accountNumber}&bank_code=${data.bankCode}`
            );
            return callback(messageHandler("Account verified successfully", true, SUCCESS, response.data.data));
        } catch (error) {
            console.error("Error verifying account:", error.response?.data || error.message);
            return callback(messageHandler("Failed to verify account", false, BAD_REQUEST));
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
            return callback(messageHandler("Transactions list retrieved successfully", true, SUCCESS, response.data.data));
        } catch (error) {
            console.error("Error retrieving transactions:", error.response?.data || error.message);
            return callback(messageHandler("Failed to retrieve transactions", false, BAD_REQUEST));
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
            
            return callback(messageHandler("Webhook processed successfully", true, SUCCESS));
        } catch (error) {
            console.error("Webhook processing error:", error);
            return callback(messageHandler("Webhook processing failed", false, BAD_REQUEST));
        }
    }

    async handleSuccessfulPayment(data) {
             //implement

    }

    async handleFailedPayment(data) {
             //implement

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
            return callback(messageHandler("Virtual accounts retrieved", true, SUCCESS, response.data.data));
        } catch (error) {
            console.error("Get DVA error:", error.response?.data || error.message);
            return callback(messageHandler("Failed to get accounts", false, BAD_REQUEST));
        }
    }

    async deactivateDedicatedAccount(accountId, callback) {
        try {
            const response = await this.api.delete(`/dedicated_account/${accountId}`);
            await Wallet.update(
                { isActive: false },
                { where: { paystackDedicatedAccountId: accountId } }
            );
            return callback(messageHandler("Account deactivated", true, SUCCESS, response.data.data));
        } catch (error) {
            console.error("Deactivation error:", error.response?.data || error.message);
            return callback(messageHandler("Failed to deactivate account", false, BAD_REQUEST));
        }
    }
}

// Create and export singleton instance
const paystackService = new PaystackService();
export default paystackService;