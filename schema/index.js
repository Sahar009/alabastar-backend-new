import User from './User.js';
import ProviderProfile from './ProviderProfile.js';
import ServiceCategory from './ServiceCategory.js';
import Service from './Service.js';
import Booking from './Booking.js';
import Payment from './Payment.js';
import Wallet from './Wallet.js';
import WalletTransaction from './WalletTransaction.js';
import Review from './Review.js';
import ChatThread from './ChatThread.js';
import ChatMessage from './ChatMessage.js';
import Notification from './Notification.js';
import NotificationPreference from './NotificationPreference.js';
import SupportTicket from './SupportTicket.js';
import BlogPost from './BlogPost.js';
import ProductCategory from './ProductCategory.js';
import Product from './Product.js';
import Order from './Order.js';
import OrderItem from './OrderItem.js';
import SavedProvider from './SavedProvider.js';
import Address from './Address.js';
import Dispute from './Dispute.js';
import ProviderDocument from './ProviderDocument.js';
import NewsletterSubscription from './NewsletterSubscription.js';
import SubscriptionPlan from './SubscriptionPlan.js';
import ProviderSubscription from './ProviderSubscription.js';
import Withdrawal from './Withdrawal.js';
import CorporateRequest from './CorporateRequest.js';
import ContactMessage from './ContactMessage.js';

// Associations
User.hasOne(ProviderProfile, { foreignKey: 'userId' });
ProviderProfile.belongsTo(User, { foreignKey: 'userId' });

ServiceCategory.hasMany(Service, { foreignKey: 'categoryId' });
Service.belongsTo(ServiceCategory, { foreignKey: 'categoryId' });

ProviderProfile.hasMany(Service, { foreignKey: 'providerId' });
Service.belongsTo(ProviderProfile, { foreignKey: 'providerId' });

User.hasMany(Booking, { foreignKey: 'userId', as: 'CustomerBookings' });
ProviderProfile.hasMany(Booking, { foreignKey: 'providerId', as: 'ProviderBookings' });
Service.hasMany(Booking, { foreignKey: 'serviceId' });
Booking.belongsTo(User, { foreignKey: 'userId', as: 'Customer' });
Booking.belongsTo(ProviderProfile, { foreignKey: 'providerId', as: 'Provider' });
Booking.belongsTo(Service, { foreignKey: 'serviceId' });

Booking.hasMany(Payment, { foreignKey: 'bookingId' });
Payment.belongsTo(Booking, { foreignKey: 'bookingId' });

User.hasOne(Wallet, { foreignKey: 'userId' });
Wallet.belongsTo(User, { foreignKey: 'userId' });
Wallet.hasMany(WalletTransaction, { foreignKey: 'walletId' });
WalletTransaction.belongsTo(Wallet, { foreignKey: 'walletId' });

ProviderProfile.hasMany(Review, { foreignKey: 'providerId' });
User.hasMany(Review, { foreignKey: 'reviewerId' });
Booking.hasOne(Review, { foreignKey: 'bookingId' });
Review.belongsTo(ProviderProfile, { foreignKey: 'providerId' });
Review.belongsTo(User, { foreignKey: 'reviewerId' });
Review.belongsTo(Booking, { foreignKey: 'bookingId' });

ChatThread.belongsTo(User, { foreignKey: 'userId', as: 'Customer' });
ChatThread.belongsTo(ProviderProfile, { foreignKey: 'providerId', as: 'Provider' });
Booking.hasOne(ChatThread, { foreignKey: 'bookingId' });
ChatThread.hasMany(ChatMessage, { foreignKey: 'threadId' });
ChatMessage.belongsTo(ChatThread, { foreignKey: 'threadId' });
ChatMessage.belongsTo(User, { foreignKey: 'senderId' });

User.hasMany(Notification, { foreignKey: 'userId' });
Notification.belongsTo(User, { foreignKey: 'userId' });
User.hasOne(NotificationPreference, { foreignKey: 'userId' });
NotificationPreference.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(SupportTicket, { foreignKey: 'userId' });
SupportTicket.belongsTo(User, { foreignKey: 'userId' });
Booking.hasMany(SupportTicket, { foreignKey: 'bookingId' });
SupportTicket.belongsTo(Booking, { foreignKey: 'bookingId' });

User.hasMany(BlogPost, { foreignKey: 'authorId' });
BlogPost.belongsTo(User, { foreignKey: 'authorId' });

ProductCategory.hasMany(Product, { foreignKey: 'categoryId' });
Product.belongsTo(ProductCategory, { foreignKey: 'categoryId' });

User.hasMany(Order, { foreignKey: 'userId' });
Order.belongsTo(User, { foreignKey: 'userId' });
Order.hasMany(OrderItem, { foreignKey: 'orderId' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId' });
Product.hasMany(OrderItem, { foreignKey: 'productId' });
OrderItem.belongsTo(Product, { foreignKey: 'productId' });

User.belongsToMany(ProviderProfile, { through: SavedProvider, foreignKey: 'userId', otherKey: 'providerId' });
ProviderProfile.belongsToMany(User, { through: SavedProvider, foreignKey: 'providerId', otherKey: 'userId' });

User.hasMany(Address, { foreignKey: 'userId' });
Address.belongsTo(User, { foreignKey: 'userId' });

Booking.hasMany(Dispute, { foreignKey: 'bookingId' });
Dispute.belongsTo(Booking, { foreignKey: 'bookingId' });

ProviderProfile.hasMany(ProviderDocument, { foreignKey: 'providerId' });
ProviderDocument.belongsTo(ProviderProfile, { foreignKey: 'providerId' });

// Subscriptions and payouts
SubscriptionPlan.hasMany(ProviderSubscription, { foreignKey: 'planId' });
ProviderSubscription.belongsTo(SubscriptionPlan, { foreignKey: 'planId' });
ProviderProfile.hasMany(ProviderSubscription, { foreignKey: 'providerId' });
ProviderSubscription.belongsTo(ProviderProfile, { foreignKey: 'providerId' });

User.hasMany(Withdrawal, { foreignKey: 'userId' });
Withdrawal.belongsTo(User, { foreignKey: 'userId' });

export {
  User,
  ProviderProfile,
  ServiceCategory,
  Service,
  Booking,
  Payment,
  Wallet,
  WalletTransaction,
  Review,
  ChatThread,
  ChatMessage,
  Notification,
  NotificationPreference,
  SupportTicket,
  BlogPost,
  ProductCategory,
  Product,
  Order,
  OrderItem,
  SavedProvider,
  Address,
  Dispute,
  ProviderDocument,
  NewsletterSubscription,
  SubscriptionPlan,
  ProviderSubscription,
  Withdrawal,
  CorporateRequest,
  ContactMessage
};


