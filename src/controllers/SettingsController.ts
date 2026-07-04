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
      console.log('Received body:', req.body, 'Type:', typeof req.body);
      console.log('Content-Type:', req.headers['content-type']);
      
      // Angular sends the number directly in the body (not wrapped in an object)
      // So req.body is the number itself
      let fee: number;
      
      if (typeof req.body === 'number') {
        fee = req.body;
      } else if (typeof req.body === 'string') {
        fee = parseFloat(req.body);
      } else if (typeof req.body === 'object' && req.body !== null) {
        // Handle case where body might be an object with the value
        if (req.body.fee !== undefined) {
          fee = parseFloat(req.body.fee);
        } else if (Object.keys(req.body).length === 0) {
          // Empty object, might be parsing issue
          return res.status(400).json({ message: 'Empty request body' });
        } else {
          // Try to get the first value
          const firstValue = Object.values(req.body)[0];
          fee = parseFloat(String(firstValue));
        }
      } else {
        console.error('Invalid delivery fee format:', req.body);
        return res.status(400).json({ 
          message: 'Invalid delivery fee format',
          received: req.body,
          type: typeof req.body
        });
      }
      
      if (isNaN(fee) || fee < 0) {
        return res.status(400).json({ 
          message: 'Invalid delivery fee value',
          value: fee
        });
      }

      console.log('Parsed fee:', fee);

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

      console.log('Successfully saved delivery fee:', fee);
      res.json(fee);
    } catch (error: any) {
      console.error('Error updating delivery fee:', error);
      res.status(500).json({ message: error.message });
    }
  };
}
