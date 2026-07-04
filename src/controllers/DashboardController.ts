import { Request, Response } from 'express';
import pool from '../config/database';

export class DashboardController {

  getStats = async (req: Request, res: Response) => {
    try {
      const days = parseInt(req.query.days as string) || 7;
      const from = req.query.from as string;
      const to = req.query.to as string;
      
      let startDate: Date;
      let endDate = new Date();

      if (from && to) {
        startDate = new Date(from);
        endDate = new Date(to);
      } else {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
      }

      // 1. Statistiques des logs (visiteurs)
      const totalVisitsResult = await pool.query(
        'SELECT COUNT(*) as count FROM log_entries WHERE timestamp >= $1 AND timestamp <= $2',
        [startDate, endDate]
      );

      const uniqueVisitorsResult = await pool.query(
        'SELECT COUNT(DISTINCT ip_address) as count FROM log_entries WHERE timestamp >= $1 AND timestamp <= $2',
        [startDate, endDate]
      );

      // 2. Visites par jour
      const visitsByDayResult = await pool.query(
        `SELECT DATE(timestamp) as date, COUNT(*) as count
         FROM log_entries
         WHERE timestamp >= $1 AND timestamp <= $2
         GROUP BY DATE(timestamp)
         ORDER BY date`,
        [startDate, endDate]
      );

      // 3. Visites par heure
      const visitsByHourResult = await pool.query(
        `SELECT EXTRACT(HOUR FROM timestamp)::integer as hour, COUNT(*) as count
         FROM log_entries
         WHERE timestamp >= $1 AND timestamp <= $2
         GROUP BY EXTRACT(HOUR FROM timestamp)
         ORDER BY hour`,
        [startDate, endDate]
      );

      // 4. Top IPs
      const topIpsResult = await pool.query(
        `SELECT 
           ip_address as ip,
           COUNT(*) as visits,
           MIN(timestamp) as first_visit,
           MAX(timestamp) as last_visit
         FROM log_entries
         WHERE timestamp >= $1 AND timestamp <= $2 AND ip_address IS NOT NULL
         GROUP BY ip_address
         ORDER BY visits DESC
         LIMIT 10`,
        [startDate, endDate]
      );

      // 5. Top Pages
      const topPagesResult = await pool.query(
        `SELECT 
           page_url as page,
           COUNT(*) as visits
         FROM log_entries
         WHERE timestamp >= $1 AND timestamp <= $2 AND page_url IS NOT NULL
         GROUP BY page_url
         ORDER BY visits DESC
         LIMIT 10`,
        [startDate, endDate]
      );

      // 6. Statistiques des commandes
      const totalOrdersResult = await pool.query(
        'SELECT COUNT(*) as count FROM orders WHERE order_date >= $1 AND order_date <= $2',
        [startDate, endDate]
      );

      const ordersByStatusResult = await pool.query(
        `SELECT status, COUNT(*) as count
         FROM orders
         WHERE order_date >= $1 AND order_date <= $2
         GROUP BY status`,
        [startDate, endDate]
      );

      const ordersByDayResult = await pool.query(
        `SELECT DATE(order_date) as date, COUNT(*) as count
         FROM orders
         WHERE order_date >= $1 AND order_date <= $2
         GROUP BY DATE(order_date)
         ORDER BY date`,
        [startDate, endDate]
      );

      // 7. Revenus et profits
      const revenueResult = await pool.query(
        'SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE order_date >= $1 AND order_date <= $2',
        [startDate, endDate]
      );

      // Calculer le coût du stock et le profit
      const profitResult = await pool.query(
        `SELECT 
           COALESCE(SUM(oi.quantity * oi.unit_price), 0) as revenue,
           COALESCE(SUM(oi.quantity * p.purchase_priceht), 0) as cost
         FROM order_items oi
         JOIN orders o ON oi.order_id = o.id
         JOIN products p ON oi.product_id = p.id
         WHERE o.order_date >= $1 AND o.order_date <= $2`,
        [startDate, endDate]
      );

      const stockCostResult = await pool.query(
        'SELECT COALESCE(SUM(current_quantity * unit_price), 0) as total FROM stock_batches'
      );

      const totalStockUnitsResult = await pool.query(
        'SELECT COALESCE(SUM(current_quantity), 0) as total FROM stock_batches'
      );

      const totalStockInboundResult = await pool.query(
        `SELECT COALESCE(SUM(quantity), 0) as total 
         FROM stock_movements 
         WHERE type = 'IN' AND movement_date >= $1 AND movement_date <= $2`,
        [startDate, endDate]
      );

      // Construire la réponse
      const revenue = parseFloat(profitResult.rows[0]?.revenue || 0);
      const cost = parseFloat(profitResult.rows[0]?.cost || 0);
      const profit = revenue - cost;
      const stockCost = parseFloat(stockCostResult.rows[0]?.total || 0);
      const netProfit = profit - stockCost;

      const ordersByStatus: Record<string, number> = {};
      ordersByStatusResult.rows.forEach(row => {
        ordersByStatus[row.status] = parseInt(row.count);
      });

      const stats = {
        totalVisits: parseInt(totalVisitsResult.rows[0]?.count || 0),
        uniqueVisitors: parseInt(uniqueVisitorsResult.rows[0]?.count || 0),
        visitsByDay: visitsByDayResult.rows.map(row => ({
          date: row.date,
          count: parseInt(row.count)
        })),
        visitsByHour: visitsByHourResult.rows.map(row => ({
          hour: row.hour,
          count: parseInt(row.count)
        })),
        topIps: topIpsResult.rows.map(row => ({
          ip: row.ip,
          visits: parseInt(row.visits),
          firstVisit: row.first_visit,
          lastVisit: row.last_visit
        })),
        topPages: topPagesResult.rows.map(row => ({
          page: row.page,
          visits: parseInt(row.visits)
        })),
        totalOrders: parseInt(totalOrdersResult.rows[0]?.count || 0),
        ordersByStatus,
        ordersByDay: ordersByDayResult.rows.map(row => ({
          date: row.date,
          count: parseInt(row.count)
        })),
        totalRevenue: parseFloat(revenueResult.rows[0]?.total || 0),
        totalProfit: profit,
        stockCost,
        netProfit,
        totalStockUnits: parseInt(totalStockUnitsResult.rows[0]?.total || 0),
        totalStockInbound: parseInt(totalStockInboundResult.rows[0]?.total || 0)
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
