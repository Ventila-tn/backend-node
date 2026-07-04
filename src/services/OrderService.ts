import pool from '../config/database';
import { Order, OrderItem, OrderStatus, CheckoutRequest } from '../types';
import { ProductService } from './ProductService';
import { StockService } from './StockService';

export class OrderService {
  private productService: ProductService;
  private stockService: StockService;

  constructor() {
    this.productService = new ProductService();
    this.stockService = new StockService();
  }

  async placeOrder(request: CheckoutRequest): Promise<Order> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Generate order reference: CMD-YYYYMMDD-RANDOM
      const date = new Date();
      const dateStr = date.getFullYear().toString() + 
                      (date.getMonth() + 1).toString().padStart(2, '0') + 
                      date.getDate().toString().padStart(2, '0');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const reference = `CMD-${dateStr}-${random}`;

      // Create order
      const orderResult = await client.query<Order>(
        `INSERT INTO orders (
           user_id,
           first_name, 
           last_name, 
           address, 
           phone, 
           email, 
           city, 
           governorate,
           delivery_fee, 
           status, 
           has_stock_shortage, 
           order_date, 
           total_amount,
           reference
         ) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), 0, $12)
         RETURNING *`,
        [
          null, // user_id - null for guest checkout
          request.firstName,
          request.lastName,
          request.address,
          request.phone,
          request.email,
          request.city || null,
          request.governorate || null,
          request.deliveryFee || 0,
          OrderStatus.PENDING_CONFIRMATION,
          false,
          reference
        ]
      );

      const order = orderResult.rows[0];
      let totalAmount = 0;
      let hasStockShortage = false;

      // Process each item
      for (const [productIdStr, quantity] of Object.entries(request.items)) {
        const productId = parseInt(productIdStr);
        const product = await this.productService.findById(productId);
        
        if (!product) {
          throw new Error(`Product not found: ${productId}`);
        }

        const stock = await this.stockService.getTotalStock(productId);
        
        if (stock < quantity) {
          hasStockShortage = true;
        }

        // Deduct stock (FIFO)
        if (stock > 0) {
          const quantityToDeduct = Math.min(stock, quantity);
          await this.stockService.registerOutboundMovement(product, quantityToDeduct, 'Order placed');
        }

        // Create order item
        const itemTotal = Number((product.selling_pricettc * quantity).toFixed(2));
        
        await client.query(
          `INSERT INTO order_items (
             order_id, 
             product_id, 
             quantity, 
             unit_price, 
             total_price
           )
           VALUES ($1, $2, $3, $4, $5)`,
          [order.id, productId, quantity, product.selling_pricettc, itemTotal]
        );

        totalAmount += itemTotal;
      }

      // Add delivery fee to total
      totalAmount += (request.deliveryFee || 0);

      // Update order with total and shortage flag
      const updatedOrderResult = await client.query<Order>(
        `UPDATE orders 
         SET total_amount = $1, 
             has_stock_shortage = $2 
         WHERE id = $3 
         RETURNING *`,
        [totalAmount, hasStockShortage, order.id]
      );

      await client.query('COMMIT');
      
      return updatedOrderResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getAllOrders(): Promise<Order[]> {
    const result = await pool.query<Order>(
      'SELECT * FROM orders ORDER BY order_date DESC'
    );
    
    return result.rows;
  }

  async updateOrderStatus(orderId: number, status: OrderStatus): Promise<Order> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get current order
      const currentOrderResult = await client.query<Order>(
        'SELECT * FROM orders WHERE id = $1',
        [orderId]
      );

      if (currentOrderResult.rows.length === 0) {
        throw new Error('Order not found');
      }

      const currentOrder = currentOrderResult.rows[0];

      // If canceling and wasn't canceled before, restore stock
      if (status === OrderStatus.CANCELLED && currentOrder.status !== OrderStatus.CANCELLED) {
        const itemsResult = await client.query<OrderItem & { purchase_priceht: number }>(
          `SELECT oi.*, p.purchase_priceht 
           FROM order_items oi
           JOIN products p ON oi.product_id = p.id
           WHERE oi.order_id = $1`,
          [orderId]
        );

        for (const item of itemsResult.rows) {
          const product = await this.productService.findById(item.product_id);
          if (product) {
            const purchasePrice = product.purchase_priceht || 0;
            await this.stockService.registerInboundMovement(
              product,
              `RESTORE-${orderId}`,
              item.quantity,
              purchasePrice,
              null,
              'Order canceled'
            );
          }
        }
      }

      // Update status
      const result = await client.query<Order>(
        `UPDATE orders 
         SET status = $1 
         WHERE id = $2 
         RETURNING *`,
        [status, orderId]
      );

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getOrderById(id: number): Promise<Order | null> {
    const result = await pool.query<Order>(
      'SELECT * FROM orders WHERE id = $1',
      [id]
    );
    
    return result.rows[0] || null;
  }

  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    const result = await pool.query<OrderItem>(
      'SELECT * FROM order_items WHERE order_id = $1',
      [orderId]
    );
    
    return result.rows;
  }
}
