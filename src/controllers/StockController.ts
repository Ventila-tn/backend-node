import { Request, Response } from 'express';
import { StockService } from '../services/StockService';
import { ProductService } from '../services/ProductService';
import { StockInboundRequest } from '../types';

export class StockController {
  private stockService: StockService;
  private productService: ProductService;

  constructor() {
    this.stockService = new StockService();
    this.productService = new ProductService();
  }

  registerInbound = async (req: Request, res: Response) => {
    try {
      const request: StockInboundRequest = req.body;
      
      const product = await this.productService.findById(request.productId);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      const expirationDate = request.expirationDate ? new Date(request.expirationDate) : null;

      await this.stockService.registerInboundMovement(
        product,
        request.batchNumber,
        request.quantity,
        request.unitPrice,
        expirationDate,
        request.reason
      );

      res.status(200).json({ message: 'Stock registered successfully' });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  getTotalStock = async (req: Request, res: Response) => {
    try {
      const productId = parseInt(req.params.productId);
      const total = await this.stockService.getTotalStock(productId);
      res.json(total);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  getMovements = async (req: Request, res: Response) => {
    try {
      const movements = await this.stockService.getAllMovements();
      res.json(movements);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  getMovementsByProduct = async (req: Request, res: Response) => {
    try {
      const productId = parseInt(req.params.productId);
      const movements = await this.stockService.getMovementsByProduct(productId);
      res.json(movements);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  getProductStats = async (req: Request, res: Response) => {
    try {
      const productId = parseInt(req.params.productId);
      const stats = await this.stockService.getProductStats(productId);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  getLatestPrice = async (req: Request, res: Response) => {
    try {
      const productId = parseInt(req.params.productId);
      const price = await this.stockService.getLatestPurchasePrice(productId);
      res.json(price);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}
