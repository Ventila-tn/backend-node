import pool from '../config/database';
import { StockBatch, StockMovement, MovementType, Product, StockMovementResponse, ProductStockStats } from '../types';

export class StockService {

  async registerInboundMovement(
    product: Product,
    batchNumber: string,
    quantity: number,
    unitPrice: number,
    expirationDate: Date | null,
    reason: string | null
  ): Promise<void> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // 1. Find or create the batch
      const existingBatchResult = await client.query<StockBatch>(
        'SELECT * FROM stock_batches WHERE product_id = $1 AND batch_number = $2',
        [product.id, batchNumber]
      );

      let batch: StockBatch;
      
      if (existingBatchResult.rows.length > 0) {
        // Update existing batch
        const updateResult = await client.query<StockBatch>(
          `UPDATE stock_batches 
           SET current_quantity = current_quantity + $1, 
               unit_price = $2
           WHERE id = $3
           RETURNING *`,
          [quantity, unitPrice, existingBatchResult.rows[0].id]
        );
        batch = updateResult.rows[0];
      } else {
        // Create new batch
        const insertResult = await client.query<StockBatch>(
          `INSERT INTO stock_batches (
             product_id, 
             batch_number, 
             initial_quantity, 
             current_quantity, 
             unit_price, 
             expiration_date
           )
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *`,
          [product.id, batchNumber, quantity, quantity, unitPrice, expirationDate]
        );
        batch = insertResult.rows[0];
      }

      // 2. Record movement history
      await client.query(
        `INSERT INTO stock_movements (
           product_id, 
           batch_id, 
           type, 
           quantity, 
           unit_price, 
           reason, 
           movement_date
         )
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [product.id, batch.id, MovementType.IN, quantity, unitPrice, reason]
      );

      // 3. Update product base purchase price and recalculate selling price
      const marginMultiplier = 1 + (product.profit_margin_percent / 100);
      const taxMultiplier = 1 + (product.vat_percent / 100);
      const newSellingPrice = Number((unitPrice * marginMultiplier * taxMultiplier).toFixed(2));

      await client.query(
        `UPDATE products 
         SET purchase_priceht = $1, 
             selling_pricettc = $2
         WHERE id = $3`,
        [unitPrice, newSellingPrice, product.id]
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async registerOutboundMovement(
    product: Product,
    quantity: number,
    reason: string | null
  ): Promise<boolean> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      let remainingToDeduct = quantity;
      
      // Get batches ordered by expiration date (FIFO)
      const batchesResult = await client.query<StockBatch>(
        `SELECT * FROM stock_batches 
         WHERE product_id = $1 AND current_quantity > 0
         ORDER BY expiration_date ASC NULLS LAST`,
        [product.id]
      );

      for (const batch of batchesResult.rows) {
        if (remainingToDeduct <= 0) break;

        const available = batch.current_quantity;
        if (available > 0) {
          const toDeduct = Math.min(available, remainingToDeduct);
          
          // Update batch quantity
          await client.query(
            'UPDATE stock_batches SET current_quantity = current_quantity - $1 WHERE id = $2',
            [toDeduct, batch.id]
          );

          // Record movement
          await client.query(
            `INSERT INTO stock_movements (
               product_id, 
               batch_id, 
               type, 
               quantity, 
               unit_price, 
               reason, 
               movement_date
             )
             VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
            [product.id, batch.id, MovementType.OUT, toDeduct, batch.unit_price, reason]
          );

          remainingToDeduct -= toDeduct;
        }
      }

      await client.query('COMMIT');
      return remainingToDeduct <= 0;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getTotalStock(productId: number): Promise<number> {
    const result = await pool.query<{ total: string }>(
      `SELECT COALESCE(SUM(current_quantity), 0) as total 
       FROM stock_batches 
       WHERE product_id = $1`,
      [productId]
    );
    
    return parseInt(result.rows[0].total);
  }

  async getAllMovements(): Promise<StockMovementResponse[]> {
    const result = await pool.query<StockMovement & { product_name: string; batch_number: string }>(
      `SELECT 
         sm.*, 
         p.name as product_name, 
         sb.batch_number
       FROM stock_movements sm
       JOIN products p ON sm.product_id = p.id
       LEFT JOIN stock_batches sb ON sm.batch_id = sb.id
       ORDER BY sm.movement_date DESC`
    );

    return result.rows.map(row => ({
      id: row.id,
      movementDate: row.movement_date,
      type: row.type,
      quantity: row.quantity,
      unitPrice: row.unit_price,
      reason: row.reason,
      productId: row.product_id,
      productName: row.product_name,
      batchNumber: row.batch_number
    }));
  }

  async getMovementsByProduct(productId: number): Promise<StockMovementResponse[]> {
    const result = await pool.query<StockMovement & { product_name: string; batch_number: string }>(
      `SELECT 
         sm.*, 
         p.name as product_name, 
         sb.batch_number
       FROM stock_movements sm
       JOIN products p ON sm.product_id = p.id
       LEFT JOIN stock_batches sb ON sm.batch_id = sb.id
       WHERE sm.product_id = $1
       ORDER BY sm.movement_date DESC`,
      [productId]
    );

    return result.rows.map(row => ({
      id: row.id,
      movementDate: row.movement_date,
      type: row.type,
      quantity: row.quantity,
      unitPrice: row.unit_price,
      reason: row.reason,
      productId: row.product_id,
      productName: row.product_name,
      batchNumber: row.batch_number
    }));
  }

  async getProductStats(productId: number): Promise<ProductStockStats> {
    const totalUnits = await this.getTotalStock(productId);

    const result = await pool.query<{ total_quantity: string; total_value: string }>(
      `SELECT 
         COALESCE(SUM(quantity), 0) as total_quantity,
         COALESCE(SUM(quantity * unit_price), 0) as total_value
       FROM stock_movements
       WHERE product_id = $1 AND type = $2`,
      [productId, MovementType.IN]
    );

    const totalInQuantity = parseFloat(result.rows[0].total_quantity);
    const totalPurchaseValue = parseFloat(result.rows[0].total_value);
    const averagePurchasePrice = totalInQuantity > 0 
      ? Number((totalPurchaseValue / totalInQuantity).toFixed(2))
      : 0;

    return {
      totalUnits,
      averagePurchasePrice,
      totalPurchaseValue
    };
  }

  async getLatestPurchasePrice(productId: number): Promise<number> {
    const result = await pool.query<{ unit_price: number }>(
      `SELECT unit_price FROM stock_movements
       WHERE product_id = $1 AND type = $2
       ORDER BY movement_date DESC
       LIMIT 1`,
      [productId, MovementType.IN]
    );

    return result.rows[0]?.unit_price || 0;
  }
}
