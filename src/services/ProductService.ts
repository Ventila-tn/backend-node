import pool from '../config/database';
import { Product, ProductRequest } from '../types';

export class ProductService {
  
  /**
   * Formula: sellingPriceTTC = purchasePriceHT * (1 + (profitMarginPercent / 100)) * (1 + (vatPercent / 100))
   */
  calculateSellingPrice(product: ProductRequest | Product): number {
    const purchasePrice = 'purchasePriceHT' in product ? product.purchasePriceHT : product.purchase_priceht;
    const profitMargin = 'profitMarginPercent' in product ? product.profitMarginPercent : product.profit_margin_percent;
    const vat = 'vatPercent' in product ? product.vatPercent : product.vat_percent;
    
    const marginMultiplier = 1 + (profitMargin / 100);
    const vatMultiplier = 1 + (vat / 100);
    
    return Number((purchasePrice * marginMultiplier * vatMultiplier).toFixed(4));
  }

  async createOrUpdateProduct(productData: ProductRequest, id?: number): Promise<Product> {
    const sellingPrice = this.calculateSellingPrice(productData);
    
    if (id) {
      // Update
      const result = await pool.query<Product>(
        `UPDATE products 
         SET name = $1, 
             description = $2, 
             purchase_priceht = $3, 
             profit_margin_percent = $4, 
             vat_percent = $5, 
             selling_pricettc = $6,
             characteristics = $7
         WHERE id = $8
         RETURNING *`,
        [
          productData.name,
          productData.description,
          productData.purchasePriceHT,
          productData.profitMarginPercent,
          productData.vatPercent,
          sellingPrice,
          JSON.stringify(productData.characteristics),
          id
        ]
      );
      
      if (result.rows.length === 0) {
        throw new Error('Product not found');
      }
      
      return result.rows[0];
    } else {
      // Create
      const result = await pool.query<Product>(
        `INSERT INTO products (
           name, 
           description, 
           purchase_priceht, 
           profit_margin_percent, 
           vat_percent, 
           selling_pricettc, 
           active, 
           characteristics
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          productData.name,
          productData.description,
          productData.purchasePriceHT,
          productData.profitMarginPercent,
          productData.vatPercent,
          sellingPrice,
          true,
          JSON.stringify(productData.characteristics)
        ]
      );
      
      return result.rows[0];
    }
  }

  async deleteOrDeactivate(id: number): Promise<void> {
    const result = await pool.query(
      'UPDATE products SET active = false WHERE id = $1',
      [id]
    );
    
    if (result.rowCount === 0) {
      throw new Error('Product not found');
    }
  }

  async reactivateProduct(id: number): Promise<Product> {
    const result = await pool.query<Product>(
      'UPDATE products SET active = true WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Product not found');
    }
    
    return result.rows[0];
  }

  async findById(id: number): Promise<Product | null> {
    const result = await pool.query<Product>(
      'SELECT * FROM products WHERE id = $1',
      [id]
    );
    
    return result.rows[0] || null;
  }

  async findAllActive(): Promise<Product[]> {
    const result = await pool.query<Product>(
      'SELECT * FROM products WHERE active = true ORDER BY id'
    );
    
    return result.rows;
  }

  async findAllArchived(): Promise<Product[]> {
    const result = await pool.query<Product>(
      'SELECT * FROM products WHERE active = false ORDER BY id'
    );
    
    return result.rows;
  }
}
