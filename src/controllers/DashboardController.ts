import { Request, Response } from 'express';
import pool from '../config/database';

export class DashboardController {

  getStats = async (req: Request, res: Response) => {
    try {
      const days = parseInt(req.query.days as string) || 7;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Statistiques des commandes
      const ordersResult = await pool.query(
        `SELECT 
           COUNT(*) as total_orders,
           COALESCE(SUM(total_amount), 0) as total_revenue,
           COALESCE(AVG(total_amount), 0) as average_order_value
         FROM orders
         WHERE order_date >= $1`,
        [startDate]
      );

      // Commandes par statut
      const ordersByStatusResult = await pool.query(
        `SELECT 
           status,
           COUNT(*) as count
         FROM orders
         WHERE order_date >= $1
         GROUP BY status`,
        [startDate]
      );

      // Produits les plus vendus
      const topProductsResult = await pool.query(
        `SELECT 
           p.id,
           p.name,
           SUM(oi.quantity) as total_sold,
           SUM(oi.total_price) as total_revenue
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         JOIN orders o ON oi.order_id = o.id
         WHERE o.order_date >= $1
         GROUP BY p.id, p.name
         ORDER BY total_sold DESC
         LIMIT 10`,
        [startDate]
      );

      // Nombre total de produits actifs
      const productsResult = await pool.query(
        'SELECT COUNT(*) as total_products FROM products WHERE active = true'
      );

      // Stock total
      const stockResult = await pool.query(
        'SELECT COALESCE(SUM(current_quantity), 0) as total_stock FROM stock_batches'
      );

      // Revenus par jour
      const revenueByDayResult = await pool.query(
        `SELECT 
           DATE(order_date) as date,
           COUNT(*) as orders_count,
           COALESCE(SUM(total_amount), 0) as revenue
         FROM orders
         WHERE order_date >= $1
         GROUP BY DATE(order_date)
         ORDER BY date DESC`,
        [startDate]
      );

      const stats = {
        period: {
          days,
          startDate,
          endDate: new Date()
        },
        orders: {
          total: parseInt(ordersResult.rows[0].total_orders),
          revenue: parseFloat(ordersResult.rows[0].total_revenue),
          averageValue: parseFloat(ordersResult.rows[0].average_order_value)
        },
        ordersByStatus: ordersByStatusResult.rows.map(row => ({
          status: row.status,
          count: parseInt(row.count)
        })),
        topProducts: topProductsResult.rows.map(row => ({
          id: row.id,
          name: row.name,
          totalSold: parseInt(row.total_sold),
          totalRevenue: parseFloat(row.total_revenue)
        })),
        products: {
          total: parseInt(productsResult.rows[0].total_products)
        },
        stock: {
          total: parseInt(stockResult.rows[0].total_stock)
        },
        revenueByDay: revenueByDayResult.rows.map(row => ({
          date: row.date,
          ordersCount: parseInt(row.orders_count),
          revenue: parseFloat(row.revenue)
        }))
      };

      res.json(stats);
    } catch (error: any) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({ message: error.message });
    }
  };

  getRecentOrders = async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await pool.query(
        `SELECT 
           id,
           order_date,
           status,
           first_name,
           last_name,
           total_amount,
           has_stock_shortage
         FROM orders
         ORDER BY order_date DESC
         LIMIT $1`,
        [limit]
      );

      res.json(result.rows);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  getLowStock = async (req: Request, res: Response) => {
    try {
      const threshold = parseInt(req.query.threshold as string) || 10;

      const result = await pool.query(
        `SELECT 
           p.id,
           p.name,
           p.selling_pricettc,
           COALESCE(SUM(sb.current_quantity), 0) as stock_quantity
         FROM products p
         LEFT JOIN stock_batches sb ON p.id = sb.product_id
         WHERE p.active = true
         GROUP BY p.id, p.name, p.selling_pricettc
         HAVING COALESCE(SUM(sb.current_quantity), 0) <= $1
         ORDER BY stock_quantity ASC`,
        [threshold]
      );

      res.json(result.rows.map(row => ({
        id: row.id,
        name: row.name,
        sellingPrice: parseFloat(row.selling_pricettc),
        stockQuantity: parseInt(row.stock_quantity)
      })));
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  getSummary = async (req: Request, res: Response) => {
    try {
      // Résumé global
      const [ordersToday, ordersTotal, productsCount, revenue] = await Promise.all([
        // Commandes aujourd'hui
        pool.query(
          `SELECT COUNT(*) as count 
           FROM orders 
           WHERE DATE(order_date) = CURRENT_DATE`
        ),
        // Total commandes
        pool.query('SELECT COUNT(*) as count FROM orders'),
        // Nombre de produits actifs
        pool.query('SELECT COUNT(*) as count FROM products WHERE active = true'),
        // Revenu total
        pool.query('SELECT COALESCE(SUM(total_amount), 0) as total FROM orders')
      ]);

      res.json({
        ordersToday: parseInt(ordersToday.rows[0].count),
        ordersTotal: parseInt(ordersTotal.rows[0].count),
        productsCount: parseInt(productsCount.rows[0].count),
        totalRevenue: parseFloat(revenue.rows[0].total)
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}
