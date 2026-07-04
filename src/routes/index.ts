import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { ProductController } from '../controllers/ProductController';
import { CategoryController } from '../controllers/CategoryController';
import { OrderController } from '../controllers/OrderController';
import { StockController } from '../controllers/StockController';
import { LogController } from '../controllers/LogController';
import { DashboardController } from '../controllers/DashboardController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Controllers
const authController = new AuthController();
const productController = new ProductController();
const categoryController = new CategoryController();
const orderController = new OrderController();
const stockController = new StockController();
const logController = new LogController();
const dashboardController = new DashboardController();

// Auth routes (public)
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);

// Dashboard routes
router.get('/dashboard/stats', dashboardController.getStats);
router.get('/dashboard/recent-orders', dashboardController.getRecentOrders);
router.get('/dashboard/low-stock', dashboardController.getLowStock);
router.get('/dashboard/summary', dashboardController.getSummary);

// Product routes (PUBLIC - matching Spring Boot permitAll)
router.get('/products', productController.getAllProducts);
router.get('/products/archived', productController.getArchivedProducts);
router.get('/products/:id', productController.getProduct);
router.post('/products', productController.createProduct);
router.put('/products/:id', productController.updateProduct);
router.delete('/products/:id', productController.deleteProduct);
router.post('/products/:id/reactivate', productController.reactivateProduct);

// Category routes
router.get('/categories', categoryController.getAllCategories);
router.post('/categories', authenticateToken, categoryController.createCategory);
router.delete('/categories/:id', authenticateToken, categoryController.deleteCategory);

// Order routes (checkout is PUBLIC - matching Spring Boot)
router.post('/orders/checkout', orderController.checkout);
router.get('/orders', authenticateToken, orderController.getAllOrders);
router.get('/orders/:id', authenticateToken, orderController.getOrderById);
router.get('/orders/:id/items', authenticateToken, orderController.getOrderItems);
router.put('/orders/:id/status', authenticateToken, orderController.updateOrderStatus);

// Stock routes
router.post('/stock/inbound', authenticateToken, stockController.registerInbound);
router.get('/stock/product/:productId/total', stockController.getTotalStock);
router.get('/stock/movements', authenticateToken, stockController.getMovements);
router.get('/stock/movements/product/:productId', authenticateToken, stockController.getMovementsByProduct);
router.get('/stock/product/:productId/stats', authenticateToken, stockController.getProductStats);
router.get('/stock/product/:productId/latest-price', authenticateToken, stockController.getLatestPrice);

// Log routes (PUBLIC - matching Spring Boot)
router.post('/logs', logController.createLog);
router.get('/logs', logController.getAllLogs);
router.get('/logs/type/:logType', logController.getLogsByType);
router.get('/logs/ips', logController.getDistinctIpAddresses);

export default router;
