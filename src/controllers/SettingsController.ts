import { Request, Response } from 'express';
import pool from '../config/database';

export class SettingsController {
  
  getDeliveryFee = async (req: Request, res: Response) => {
    try {
      // Get delivery fee from settings table, or return default 7
      const result = await pool.query<{ value: string }>(
        "SELECT value FROM settings WHERE key = 'delivery_fee' LIMIT 1"
      );
      
      if (result.rows.length === 0) {
        // Return default delivery fee
        res.json(7);
      } else {
        res.json(parseFloat(result.rows[0].value));
      }
    } catch (error: any) {
      // If table doesn't exist, return default
      res.json(7);
    }
  };

  updateDeliveryFee = async (req: Request, res: Response) => {
    try {
      // Express body-parser already parses JSON, so req.body is the number directly
      const fee = typeof req.body === 'number' ? req.body : parseFloat(req.body);
      
      if (isNaN(fee) || fee < 0) {
        return res.status(400).json({ message: 'Invalid delivery fee' });
      }

      // Ensure settings table exists
      await pool.query(`
        CREATE TABLE IF NOT EXISTS settings (
          key VARCHAR(255) PRIMARY KEY,
          value TEXT NOT NULL
        )
      `);

      // Upsert delivery fee
      await pool.query(
        `INSERT INTO settings (key, value) 
         VALUES ('delivery_fee', $1)
         ON CONFLICT (key) 
         DO UPDATE SET value = $1`,
        [fee.toString()]
      );

      res.json(fee);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}
